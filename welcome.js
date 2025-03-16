// 欢迎弹窗功能
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是首次访问
    if (!localStorage.getItem('hasVisited')) {
        // 标记为已访问
        localStorage.setItem('hasVisited', 'true');
        
        // 创建欢迎弹窗
        showWelcomePopup();
    }
});

function showWelcomePopup() {
    // 获取版本号
    fetch('Update')
        .then(response => response.text())
        .then(data => {
            // 提取版本号
            const versionMatch = data.match(/Version:([^\n]+)/);
            const version = versionMatch ? versionMatch[1].trim() : '未知版本';
            
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
                closeWelcomePopup(popup);
            });
            
            // 设置自动关闭
            setTimeout(function() {
                closeWelcomePopup(popup);
            }, 5000); // 5秒后自动关闭
            
            // 添加动画效果
            setTimeout(function() {
                popup.classList.add('show');
            }, 100);
        })
        .catch(error => {
            console.error('获取版本信息失败:', error);
        });
}

function closeWelcomePopup(popup) {
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