// panel.js - 面板管理模块

/**
 * 关闭添加面板
 */
function closeAddPanel() {
  const panel = document.getElementById('add-account-panel');
  if (panel) {
    panel.classList.remove('visible');
  }
  
  // 清空表单
  const secretKey = document.getElementById('secret-key');
  const accountName = document.getElementById('account-name');
  const accountIssuer = document.getElementById('account-issuer');
  
  if (secretKey) secretKey.value = '';
  if (accountName) accountName.value = '';
  if (accountIssuer) accountIssuer.value = '';
}

/**
 * 打开添加面板
 */
function openAddPanel() {
  const panel = document.getElementById('add-account-panel');
  if (panel) {
    panel.classList.add('visible');
  }
  
  const secretKey = document.getElementById('secret-key');
  if (secretKey) {
    secretKey.focus();
  }
}

/**
 * 处理添加账户
 */
async function handleAddAccount() {
  const secretField = document.getElementById('secret-key');
  const nameField = document.getElementById('account-name');
  const issuerField = document.getElementById('account-issuer');
  
  if (!secretField || !nameField) {
    showToast('表单元素缺失', 'error');
    return;
  }
  
  const secret = secretField.value.trim();
  const name = nameField.value.trim();
  const issuer = issuerField ? issuerField.value.trim() : '';
  
  if (!secret || !name) {
    showToast('请输入密钥和账户名称', 'error');
    return;
  }
  
  try {
    // 验证密钥格式
    await generateTOTP(secret);
    
    // 保存账户
    await saveAccount(name, secret, issuer, name);
    
    // 添加到自定义排序末尾
    accountOrder.push(name);
    await saveAccountOrder(accountOrder);
    
    // 刷新显示
    await displayAccounts();
    
    // 关闭面板
    closeAddPanel();
    
    showToast('账户添加成功', 'success');
  } catch (error) {
    console.error('[Panel] 添加账户失败:', error);
    showToast('密钥格式无效', 'error');
  }
}

/**
 * 初始化添加面板事件
 */
function initAddPanelEvents() {
  // 关闭按钮
  safeBind(document.getElementById('close-panel'), 'click', closeAddPanel);
  
  // 点击面板外部关闭
  const addPanel = document.getElementById('add-account-panel');
  if (addPanel) {
    addPanel.addEventListener('click', (e) => {
      if (e.target === addPanel) {
        closeAddPanel();
      }
    });
  }
  
  // 添加按钮
  safeBind(document.getElementById('add-btn'), 'click', handleAddAccount);
  
  // 扫描二维码
  safeBind(document.getElementById('scan-btn'), 'click', handleScanQR);
  
  // 快捷模板
  document.querySelectorAll('.template-btn').forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', function() {
      const issuer = this.dataset.issuer;
      if (issuer) {
        const issuerField = document.getElementById('account-issuer');
        const nameField = document.getElementById('account-name');
        if (issuerField) issuerField.value = issuer;
        if (nameField) nameField.focus();
      }
    });
  });
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    closeAddPanel,
    openAddPanel,
    handleAddAccount,
    initAddPanelEvents
  };
}
