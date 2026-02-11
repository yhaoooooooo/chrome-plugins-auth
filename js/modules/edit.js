// edit.js - 编辑账户模块

// 当前正在编辑的账户名
let currentEditingAccount = null;

/**
 * 打开编辑面板
 */
async function openEditPanel(accountName) {
  try {
    currentEditingAccount = accountName;
    
    // 加载账户信息
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    const info = accountInfo[accountName] || {};
    
    // 填充表单
    document.getElementById('edit-account-original-name').value = accountName;
    document.getElementById('edit-account-name').value = accountName;
    document.getElementById('edit-display-name').value = info.displayName || '';
    document.getElementById('edit-account-issuer').value = info.issuer || '';
    
    // 显示面板
    const panel = document.getElementById('edit-account-panel');
    panel.classList.add('visible');
    
    // 聚焦到账户名称输入框
    document.getElementById('edit-account-name').focus();
    
  } catch (error) {
    console.error('[Edit] 打开编辑面板失败:', error);
    showToast('打开编辑失败', 'error');
  }
}

/**
 * 关闭编辑面板
 */
function closeEditPanel() {
  const panel = document.getElementById('edit-account-panel');
  panel.classList.remove('visible');
  currentEditingAccount = null;
}

/**
 * 保存编辑
 */
async function saveEditAccount() {
  try {
    const originalName = document.getElementById('edit-account-original-name').value;
    const newName = document.getElementById('edit-account-name').value.trim();
    const displayName = document.getElementById('edit-display-name').value.trim();
    const issuer = document.getElementById('edit-account-issuer').value.trim();
    
    if (!newName) {
      showToast('账户名称不能为空', 'error');
      return;
    }
    
    // 加载现有数据
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    
    // 获取密钥
    const secret = accounts[originalName];
    if (!secret) {
      showToast('账户不存在', 'error');
      return;
    }
    
    // 如果名称改变，需要迁移数据
    if (newName !== originalName) {
      // 检查新名称是否已存在
      if (accounts[newName]) {
        showToast('该账户名称已存在', 'error');
        return;
      }
      
      // 创建新账户
      accounts[newName] = secret;
      delete accounts[originalName];
      
      // 迁移账户信息
      accountInfo[newName] = {
        issuer: issuer,
        displayName: displayName || newName
      };
      delete accountInfo[originalName];
      
      // 更新排序数组
      const index = accountOrder.indexOf(originalName);
      if (index !== -1) {
        accountOrder[index] = newName;
      }
      
      // 迁移使用统计
      const usageStats = await loadUsageStats();
      if (usageStats[originalName]) {
        usageStats[newName] = usageStats[originalName];
        delete usageStats[originalName];
        await saveUsageStats(usageStats);
      }
    } else {
      // 只更新信息
      accountInfo[originalName] = {
        issuer: issuer,
        displayName: displayName || originalName
      };
    }
    
    // 保存数据
    await chrome.storage.local.set({ accounts, accountInfo });
    await saveAccountOrder(accountOrder);
    
    // 刷新显示
    await displayAccounts();
    
    // 关闭面板
    closeEditPanel();
    
    showToast('账户信息已更新', 'success');
    
  } catch (error) {
    console.error('[Edit] 保存编辑失败:', error);
    showToast('保存失败: ' + error.message, 'error');
  }
}

/**
 * 初始化编辑面板事件
 */
function initEditPanelEvents() {
  // 关闭编辑面板按钮
  safeBind(document.getElementById('close-edit-panel'), 'click', closeEditPanel);
  safeBind(document.getElementById('cancel-edit-btn'), 'click', closeEditPanel);
  
  // 保存按钮
  safeBind(document.getElementById('save-edit-btn'), 'click', saveEditAccount);
  
  // 点击面板外部关闭
  const editPanel = document.getElementById('edit-account-panel');
  if (editPanel) {
    editPanel.addEventListener('click', (e) => {
      if (e.target === editPanel) {
        closeEditPanel();
      }
    });
  }
  
  // 回车键保存
  const editNameInput = document.getElementById('edit-account-name');
  if (editNameInput) {
    editNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveEditAccount();
      }
    });
  }
  
  // 域名模板快捷插入
  document.querySelectorAll('.domain-template').forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', function() {
      const domain = this.dataset.domain;
      const input = document.getElementById('edit-account-name');
      if (!input) return;
      
      const currentValue = input.value;
      if (!currentValue) {
        input.value = domain;
      } else if (!currentValue.includes(domain)) {
        input.value = currentValue + ' ' + domain;
      }
      
      input.focus();
    });
  });
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    currentEditingAccount,
    openEditPanel,
    closeEditPanel,
    saveEditAccount,
    initEditPanelEvents
  };
}
