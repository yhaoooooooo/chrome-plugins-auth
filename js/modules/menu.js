// menu.js - 菜单模块

/**
 * 切换菜单显示
 */
function toggleMenu(name, card) {
  // 关闭其他菜单
  closeAllMenus();
  
  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'menu-dropdown';
  menu.innerHTML = `
    <button class="menu-item" data-action="copy" data-name="${escapeHtml(name)}">
      📋 复制验证码
    </button>
    <button class="menu-item" data-action="edit" data-name="${escapeHtml(name)}">
      ✏️ 编辑账户
    </button>
    <button class="menu-item delete" data-action="delete" data-name="${escapeHtml(name)}">
      🗑️ 删除账户
    </button>
  `;
  
  // 定位菜单
  const menuBtn = card.querySelector('.menu-btn');
  const rect = menuBtn.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.right = `${Math.max(10, window.innerWidth - rect.right)}px`;
  menu.style.zIndex = '10000';
  
  document.body.appendChild(menu);
  
  // 绑定菜单项事件
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      const accountName = item.dataset.name;
      
      switch (action) {
        case 'copy':
          const token = card.querySelector('.account-token').textContent.replace(/\s/g, '');
          await copyToClipboard(token);
          await recordAccountUsage(accountName);
          break;
        case 'edit':
          openEditPanel(accountName);
          break;
        case 'delete':
          if (confirm(`确定要删除账户 "${accountName}" 吗？`)) {
            await deleteAccount(accountName);
          }
          break;
      }
      
      closeAllMenus();
    });
  });
}

/**
 * 关闭所有菜单
 */
function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    menu.remove();
  });
}

/**
 * 删除账户
 */
async function deleteAccount(accountName) {
  try {
    await deleteAccountFromStorage(accountName);
    
    // 从自定义排序中移除
    accountOrder = accountOrder.filter(name => name !== accountName);
    await saveAccountOrder(accountOrder);
    
    // 刷新显示
    await displayAccounts();
    showToast('账户已删除', 'success');
  } catch (error) {
    console.error('[Menu] 删除账户失败:', error);
    showToast('删除失败', 'error');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    toggleMenu,
    closeAllMenus,
    deleteAccount
  };
}
