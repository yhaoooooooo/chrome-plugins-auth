// scanner.js - 二维码扫描模块

/**
 * 处理二维码扫描
 */
async function handleScanQR() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs[0]) {
      showToast('无法获取当前标签页', 'error');
      return;
    }
    
    const tab = tabs[0];
    
    // 检查是否是chrome页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showToast('无法在此页面使用扫描功能', 'error');
      return;
    }
    
    // 尝试发送扫描请求，如果content script未注入则动态注入
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'scanQR' });
    } catch (e) {
      console.log('[Scanner] Content script未注入，正在动态注入...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      await chrome.tabs.sendMessage(tab.id, { action: 'scanQR' });
    }
    
    closeAddPanel();
    showToast('正在扫描页面二维码...', 'info');
    
  } catch (error) {
    console.error('[Scanner] 扫描失败:', error);
    showToast('扫描功能不可用: ' + error.message, 'error');
  }
}

/**
 * 导出账户数据
 */
async function exportAccountsData() {
  try {
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    const order = await loadAccountOrder();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      accounts: accounts,
      accountInfo: accountInfo,
      accountOrder: order
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `authenticator-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
    
  } catch (error) {
    console.error('[Scanner] 导出失败:', error);
    showToast('导出失败', 'error');
  }
}

/**
 * 导入账户数据
 */
async function importAccountsData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.accounts) {
        throw new Error('无效的数据格式');
      }
      
      // 合并账户
      const currentAccounts = await loadAccounts();
      const currentInfo = await loadAccountInfo();
      
      const mergedAccounts = { ...currentAccounts, ...data.accounts };
      const mergedInfo = { ...currentInfo, ...data.accountInfo };
      
      await chrome.storage.local.set({
        accounts: mergedAccounts,
        accountInfo: mergedInfo
      });
      
      // 导入排序
      if (data.accountOrder) {
        const currentOrder = await loadAccountOrder();
        const newOrder = [...new Set([...currentOrder, ...data.accountOrder])];
        await saveAccountOrder(newOrder);
      }
      
      await displayAccounts();
      showToast(`成功导入 ${Object.keys(data.accounts).length} 个账户`, 'success');
      
    } catch (error) {
      console.error('[Scanner] 导入失败:', error);
      showToast('导入失败: ' + error.message, 'error');
    }
  };
  
  input.click();
}

/**
 * 导出为二维码
 */
async function exportAsQRCode() {
  try {
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    
    if (Object.keys(accounts).length === 0) {
      showToast('没有账户可导出', 'error');
      return;
    }
    
    const exportData = {
      accounts: accounts,
      accountInfo: accountInfo
    };
    
    const jsonStr = JSON.stringify(exportData);
    const base64Data = btoa(jsonStr);
    const migrationUrl = `otpauth-migration://offline?data=${encodeURIComponent(base64Data)}`;
    
    // 显示二维码
    const panel = document.getElementById('add-account-panel');
    const body = panel.querySelector('.panel-body');
    
    // 移除已存在的二维码
    const existingQR = body.querySelector('#export-qr-display')?.parentElement;
    if (existingQR) existingQR.remove();
    
    const qrDiv = document.createElement('div');
    qrDiv.className = 'form-group';
    qrDiv.innerHTML = `
      <label class="form-label">导出二维码</label>
      <div id="export-qr-display" style="display: flex; justify-content: center; padding: 20px;"></div>
      <p style="font-size: 11px; color: var(--text-secondary); text-align: center; margin-top: 8px;">
        使用 Google Authenticator 扫描二维码导入
      </p>
    `;
    
    body.appendChild(qrDiv);
    
    // 生成二维码
    if (typeof QRCode !== 'undefined') {
      new QRCode(document.getElementById('export-qr-display'), {
        text: migrationUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
    
    panel.classList.add('visible');
    
  } catch (error) {
    console.error('[Scanner] 生成二维码失败:', error);
    showToast('生成二维码失败', 'error');
  }
}

/**
 * 清空所有账户
 */
async function clearAllAccounts() {
  if (!confirm('确定要删除所有账户吗？此操作不可恢复！')) {
    return;
  }
  
  try {
    await clearAllData();
    accountOrder = [];
    await displayAccounts();
    showToast('所有账户已清空', 'success');
  } catch (error) {
    console.error('[Scanner] 清空失败:', error);
    showToast('清空失败', 'error');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleScanQR,
    exportAccountsData,
    importAccountsData,
    exportAsQRCode,
    clearAllAccounts
  };
}
