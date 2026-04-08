// popup.js - 主入口文件
// 引入模块化组件

// 全局变量
let authenticator;

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
  console.log('✅ Popup DOM已加载');
  
  try {
    // 检查必要的DOM元素
    const requiredElements = ['accounts-container', 'empty-state', 'filter-input', 'add-account-btn'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));

    if (missingElements.length > 0) {
      console.error('❌ 缺少必要的DOM元素:', missingElements);
      showToast('界面加载错误，请刷新重试', 'error');
      return;
    }

    // 初始化 authenticator
    if (typeof GoogleAuthenticator !== 'undefined') {
      authenticator = new GoogleAuthenticator();
      console.log('✅ GoogleAuthenticator已初始化');
    } else {
      console.warn('⚠️ GoogleAuthenticator库未加载');
    }

    // 初始化账户排序
    await initAccountOrder();
    console.log('✅ 账户排序初始化完成');

    // 加载账户列表
    console.log('🔄 正在加载账户列表...');
    await displayAccounts();
    console.log('✅ 账户列表加载完成');

    // 根据当前域名自动筛选
    console.log('🔄 正在检查自动筛选...');
    await autoFilterByCurrentDomain();
    console.log('✅ 自动筛选检查完成');

    // 初始化事件监听器
    console.log('🔄 正在初始化事件监听器...');
    initializeEventListeners();
    initAddPanelEvents();
    initEditPanelEvents();
    console.log('✅ 事件监听器初始化完成');

    // 启动定期更新倒计时和令牌
    console.log('✅ 启动定时更新任务');
    setInterval(updateTokensOnly, 1000);

    // 自动聚焦搜索输入框
    setTimeout(() => {
      const filterInput = document.getElementById('filter-input');
      if (filterInput && document.activeElement !== filterInput) {
        filterInput.focus();
        console.log('✅ 搜索输入框已自动聚焦');
      }
    }, 100);

    console.log('✅ 所有初始化完成');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    console.error('错误堆栈:', error.stack);
    showToast('加载失败: ' + error.message, 'error');
  }
});

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
  // 添加账户按钮
  safeBind(document.getElementById('add-account-btn'), 'click', openAddPanel);
  
  // 搜索功能
  const filterInput = document.getElementById('filter-input');
  const clearFilterBtn = document.getElementById('clear-filter');
  
  if (filterInput) {
    filterInput.addEventListener('input', debounce(function(e) {
      const value = e.target.value;
      if (clearFilterBtn) {
        clearFilterBtn.classList.toggle('visible', value.length > 0);
      }
      enhancedFilterAccounts(value);
    }, 300));
  }
  
  safeBind(clearFilterBtn, 'click', () => {
    if (filterInput) filterInput.value = '';
    if (clearFilterBtn) clearFilterBtn.classList.remove('visible');

    // 恢复所有账户显示
    const items = document.querySelectorAll('.account-item');
    items.forEach(item => {
      item.classList.remove('hidden', 'matched');
      item.style.opacity = '1';
    });

    const countElement = document.getElementById('accounts-count');
    if (countElement) {
      countElement.textContent = `${items.length} 个账户`;
    }

    hideAutoFilterIndicator();
  });

  // 取消自动筛选按钮
  safeBind(document.getElementById('cancel-auto-filter'), 'click', () => {
    // 调用 filter 模块的 cancelAutoFilter 函数
    if (typeof cancelAutoFilter === 'function') {
      cancelAutoFilter();
    } else {
      console.warn('[Popup] cancelAutoFilter 函数未定义');
    }
  });
  
  // 导出导入按钮
  safeBind(document.getElementById('export-btn'), 'click', exportAccountsData);
  safeBind(document.getElementById('import-btn-header'), 'click', importAccountsData);
  safeBind(document.getElementById('export-qr-btn'), 'click', exportAsQRCode);
  safeBind(document.getElementById('clear-all-btn'), 'click', clearAllAccounts);
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 聚焦搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const filterInput = document.getElementById('filter-input');
      if (filterInput) filterInput.focus();
    }
    
    // ESC 关闭面板
    if (e.key === 'Escape') {
      closeAddPanel();
      closeEditPanel();
      closeAllMenus();
    }
  });
  
  // 点击外部关闭菜单
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.account-menu')) {
      closeAllMenus();
    }
  });
}
