// 欢迎弹窗和更新提示功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取版本号
    fetch('Update')
        .then(response => response.text())
        .then(data => {
            // 提取版本号
            const versionMatch = data.match(/Version:([^\n]+)/);
            const currentVersion = versionMatch ? versionMatch[1].trim() : '未知版本';
            const storedVersion = localStorage.getItem('siteVersion');
            const hasVisited = localStorage.getItem('hasVisited');
            
            // 添加调试信息
            console.log('当前版本:', currentVersion);
            console.log('存储版本:', storedVersion);
            console.log('是否首次访问:', hasVisited ? '否' : '是');
            
            // 检查是否是首次访问
            if (!hasVisited) {
                console.log('首次访问，显示欢迎弹窗');
                // 标记为已访问
                localStorage.setItem('hasVisited', 'true');
                // 存储当前版本
                localStorage.setItem('siteVersion', currentVersion);
                // 创建欢迎弹窗
                showWelcomePopup(currentVersion);
            }             // 检查版本是否变动（非首次访问）
            else if (!storedVersion || storedVersion !== currentVersion) {
                console.log('版本已更新，显示更新弹窗');
                // 更新存储的版本号
                localStorage.setItem('siteVersion', currentVersion);
                // 显示更新提示
                showUpdatePopup(currentVersion, data);
            } else {
                console.log('版本未变化，不显示弹窗');
            }
        })
        .catch(error => {
            console.error('获取版本信息失败:', error);
        });
});

// 确保在页面加载完成后立即检查版本
window.addEventListener('load', function() {
    // 如果DOMContentLoaded事件已经触发但没有正确执行版本检查，这里提供一个备份机制
    if (!document.body.classList.contains('version-checked')) {
        console.log('使用备份机制检查版本');
        checkVersion();
    }
});

// 提取版本检查逻辑为单独函数，便于重用
function checkVersion() {
    document.body.classList.add('version-checked');
    fetch('Update')
        .then(response => response.text())
        .then(data => {
            const versionMatch = data.match(/Version:([^\n]+)/);
            const currentVersion = versionMatch ? versionMatch[1].trim() : '未知版本';
            const storedVersion = localStorage.getItem('siteVersion');
            
            console.log('备份检查 - 当前版本:', currentVersion);
            console.log('备份检查 - 存储版本:', storedVersion);
            
            if (!storedVersion || storedVersion !== currentVersion) {
                console.log('备份检查 - 版本不匹配，显示更新弹窗');
                localStorage.setItem('siteVersion', currentVersion);
                showUpdatePopup(currentVersion, data);
            }
        })
        .catch(error => {
            console.error('备份版本检查失败:', error);
        });
}


function showWelcomePopup(version) {
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    
    // 设置弹窗内容
    popup.innerHTML = `
        <div class="welcome-content">
            <h2>欢迎！</h2>
            <p>这是你第一次来到我们的网站！</p>
            <p class="version-info">版本：${version}</p>
            <span class="close-btn">&times;</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(popup);
    
    // 添加关闭按钮事件
    const closeBtn = popup.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        closePopup(popup);
    });
    
    // 设置自动关闭
    setTimeout(function() {
        closePopup(popup);
    }, 5000); // 5秒后自动关闭
    
    // 添加动画效果
    setTimeout(function() {
        popup.classList.add('show');
    }, 100);
}

function showUpdatePopup(version, updateData) {
    // 提取更新内容
    const updateContent = updateData.replace(/Version:[^\n]+\n/, '').trim();
    
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'welcome-popup update-popup';
    
    // 设置弹窗内容
    popup.innerHTML = `
        <div class="welcome-content">
            <h2 class="version-title">版本：${version}</h2>
            <div class="update-content">${formatUpdateContent(updateContent)}</div>
            <span class="close-btn">&times;</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(popup);
    
    // 添加关闭按钮事件
    const closeBtn = popup.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        closePopup(popup);
    });
    
    // 设置自动关闭
    setTimeout(function() {
        closePopup(popup);
    }, 8000); // 8秒后自动关闭
    
    // 添加动画效果
    setTimeout(function() {
        popup.classList.add('show');
    }, 100);
}

// 格式化更新内容，保持换行
function formatUpdateContent(content) {
    return content.split('\n').map(line => `<p>${line}</p>`).join('');
}

function closePopup(popup) {
    // 添加关闭动画
    popup.classList.remove('show');
    popup.classList.add('hide');
    
    // 动画结束后移除元素
    setTimeout(function() {
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 500); // 与CSS动画时间匹配
}