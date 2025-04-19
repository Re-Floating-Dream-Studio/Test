/**
 * 设备指纹检查工具
 * 此文件用于检查设备指纹是否在允许列表或禁止列表中
 */

// 可以通过注释以下代码块来禁用设备检查功能
/* 设备检查功能开始 */

// 调试模式 - 在控制台打印详细信息
const DEBUG = true;

// 工具函数：安全的控制台日志
function debug(...args) {
    if (DEBUG) {
        console.log('[指纹检查]', ...args);
    }
}

// SHA-256 哈希函数
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 获取设备信息
async function getMacAddresses() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return "不支持获取网络设备信息";
    }
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.map(device => device.deviceId).join('');
    } catch (e) {
        return "获取设备信息失败: " + e.toString();
    }
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("设备指纹Canvas", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("设备指纹Canvas", 4, 17);
        
        return canvas.toDataURL();
    } catch (e) {
        return "Canvas指纹获取失败";
    }
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "WebGL不可用";
        
        const info = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION)
        };
        
        return JSON.stringify(info);
    } catch (e) {
        return "WebGL指纹获取失败";
    }
}

async function collectDeviceInfo() {
    const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        screenColorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        plugins: Array.from(navigator.plugins || []).map(p => p.name).join(';'),
        canvas: getCanvasFingerprint(),
        webgl: getWebGLFingerprint(),
        deviceIds: await getMacAddresses()
    };
    
    return deviceInfo;
}

// 生成设备指纹
async function generateFingerprint() {
    try {
        const deviceInfo = await collectDeviceInfo();
        const infoString = JSON.stringify(deviceInfo);
        let fingerprint = await sha256(infoString);
        
        // 移除下划线和特殊符号（如果需要）
        fingerprint = fingerprint.replace(/[_\-]/g, '');
        
        debug('生成的设备指纹:', fingerprint);
        
        // 验证指纹是否有效
        if (!fingerprint || fingerprint.length < 8) {
            debug('无法生成有效的设备指纹');
            return null;
        }
        
        return fingerprint;
    } catch (error) {
        debug('生成设备指纹时出错:', error);
        return null;
    }
}

// 清理指纹字符串，移除分号、空格等
function cleanFingerprint(fp) {
    if (!fp) return '';
    return fp.trim().replace(/;$/, '').replace(/\s+/g, ''); // 移除末尾分号和所有空白字符
}

// 从KEY文件加载指纹列表
async function loadFingerprintList() {
    try {
        debug('开始加载KEY文件...');
        
        // 尝试不同的文件路径
        const paths = ['passkey/KEY.txt', 'passkey/KEY'];
        let response = null;
        let successPath = '';
        
        for (const path of paths) {
            try {
                const resp = await fetch(path);
                if (resp.ok) {
                    response = resp;
                    successPath = path;
                    debug(`成功加载文件: ${path}`);
                    break;
                }
            } catch (e) {
                debug(`无法加载文件 ${path}: ${e.message}`);
            }
        }
        
        if (!response) {
            debug('所有文件路径尝试失败');
            return { allowed: [], blocked: [] };
        }
        
        const text = await response.text();
        debug(`KEY文件原始内容(${successPath}):`, text);
        
        // 处理不同的换行符
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        debug('分割后的行数:', lines.length);
        
        const allowed = [];
        const blocked = [];
        
        lines.forEach((line, index) => {
            // 移除前后空白和末尾分号
            let processedLine = cleanFingerprint(line);
            debug(`处理第${index+1}行: "${processedLine}"`);
            
            if (processedLine.startsWith('!')) {
                // 移除开头的感叹号，加入禁止列表
                const blockedFingerprint = processedLine.substring(1);
                debug(`- 添加到禁止列表: "${blockedFingerprint}"`);
                if (blockedFingerprint.trim() !== '') {
                    blocked.push(blockedFingerprint);
                }
            } else if (processedLine !== '') {
                debug(`- 添加到允许列表: "${processedLine}"`);
                allowed.push(processedLine);
            }
        });
        
        debug('最终允许列表:', allowed);
        debug('最终禁止列表:', blocked);
        
        return { allowed, blocked };
    } catch (error) {
        debug('加载或处理KEY文件时出错:', error);
        return { allowed: [], blocked: [] };
    }
}

// 检查设备指纹
async function checkDeviceAccess() {
    try {
        debug('开始验证设备指纹...');
        
        // 1. 生成当前设备的指纹
        const fingerprint = await generateFingerprint();
        
        // 如果无法生成有效指纹，则不提供服务
        if (!fingerprint) {
            debug('无法获取有效的设备指纹，跳转到noserve.html');
            window.location.href = 'noserve.html';
            return;
        }
        
        debug('当前设备指纹:', fingerprint);
        
        // 2. 加载指纹列表
        const { allowed, blocked } = await loadFingerprintList();
        
        // 3. 检查是否在禁止列表中（精确匹配）
        const isBlocked = blocked.some(item => {
            const cleanItem = cleanFingerprint(item);
            const match = cleanItem === fingerprint;
            if (match) debug(`指纹在禁止列表中匹配: "${cleanItem}"`);
            return match;
        });
        
        if (isBlocked) {
            debug('设备已被封禁，跳转到blocked.html');
            window.location.href = 'blocked.html';
            return;
        }
        
        // 4. 检查是否在允许列表中（精确匹配）
        if (allowed.length > 0) {
            const isAllowed = allowed.some(item => {
                const cleanItem = cleanFingerprint(item);
                const match = cleanItem === fingerprint;
                if (match) debug(`指纹在允许列表中匹配: "${cleanItem}"`);
                return match;
            });
            
            if (isAllowed) {
                debug('设备指纹验证通过，允许访问');
                return;
            }
            
            // 如果允许列表不为空但指纹不在其中，不提供服务
            debug('设备指纹未在允许列表中，跳转到noserve.html');
            window.location.href = 'noserve.html';
        } else {
            // 如果允许列表为空且不在禁止列表中，默认允许访问
            debug('允许列表为空且设备未被封禁，允许访问');
        }
    } catch (error) {
        debug('设备指纹检查过程中出错:', error);
        // 如果检查过程出错，不提供服务
        window.location.href = 'noserve.html';
    }
}

// 页面加载时执行检查
window.addEventListener('DOMContentLoaded', checkDeviceAccess);

/* 设备检查功能结束 */ 