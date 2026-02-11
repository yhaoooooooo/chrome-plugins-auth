// storage.js - 存储操作模块

/**
 * 加载所有账户
 * @returns {Promise<Object>} 账户对象
 */
async function loadAccounts() {
  try {
    const result = await chrome.storage.local.get(['accounts']);
    return result.accounts || {};
  } catch (error) {
    console.error('[Storage] 加载账户失败:', error);
    return {};
  }
}

/**
 * 加载账户信息
 * @returns {Promise<Object>} 账户信息对象
 */
async function loadAccountInfo() {
  try {
    const result = await chrome.storage.local.get(['accountInfo']);
    return result.accountInfo || {};
  } catch (error) {
    console.error('[Storage] 加载账户信息失败:', error);
    return {};
  }
}

/**
 * 加载使用统计
 * @returns {Promise<Object>} 使用统计对象
 */
async function loadUsageStats() {
  try {
    const result = await chrome.storage.local.get(['usageStats']);
    return result.usageStats || {};
  } catch (error) {
    console.error('[Storage] 加载使用统计失败:', error);
    return {};
  }
}

/**
 * 保存使用统计
 * @param {Object} usageStats - 使用统计对象
 */
async function saveUsageStats(usageStats) {
  try {
    await chrome.storage.local.set({ usageStats });
  } catch (error) {
    console.error('[Storage] 保存使用统计失败:', error);
  }
}

/**
 * 保存账户
 * @param {string} accountName - 账户名称
 * @param {string} secret - 密钥
 * @param {string} issuer - 服务商（可选）
 * @param {string} displayName - 显示名称（可选）
 */
async function saveAccount(accountName, secret, issuer = null, displayName = null) {
  try {
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    
    accounts[accountName] = secret;
    
    if (issuer || displayName) {
      accountInfo[accountName] = {
        issuer: issuer || '',
        displayName: displayName || accountName
      };
    }
    
    await chrome.storage.local.set({ accounts, accountInfo });
    return true;
  } catch (error) {
    console.error('[Storage] 保存账户失败:', error);
    return false;
  }
}

/**
 * 更新账户信息
 * @param {string} accountName - 账户名称
 * @param {Object} info - 账户信息
 */
async function updateAccountInfo(accountName, info) {
  try {
    const accountInfo = await loadAccountInfo();
    accountInfo[accountName] = { ...accountInfo[accountName], ...info };
    await chrome.storage.local.set({ accountInfo });
    return true;
  } catch (error) {
    console.error('[Storage] 更新账户信息失败:', error);
    return false;
  }
}

/**
 * 删除账户
 * @param {string} accountName - 账户名称
 */
async function deleteAccountFromStorage(accountName) {
  try {
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    const usageStats = await loadUsageStats();
    
    delete accounts[accountName];
    delete accountInfo[accountName];
    delete usageStats[accountName];
    
    await chrome.storage.local.set({ accounts, accountInfo, usageStats });
    return true;
  } catch (error) {
    console.error('[Storage] 删除账户失败:', error);
    return false;
  }
}

/**
 * 加载账户排序
 * @returns {Promise<Array>} 排序数组
 */
async function loadAccountOrder() {
  try {
    const result = await chrome.storage.local.get(['accountOrder']);
    return result.accountOrder || [];
  } catch (error) {
    console.error('[Storage] 加载账户排序失败:', error);
    return [];
  }
}

/**
 * 保存账户排序
 * @param {Array} order - 排序数组
 */
async function saveAccountOrder(order) {
  try {
    await chrome.storage.local.set({ accountOrder: order });
  } catch (error) {
    console.error('[Storage] 保存账户排序失败:', error);
  }
}

/**
 * 记录账户使用
 * @param {string} accountName - 账户名称
 */
async function recordAccountUsage(accountName) {
  try {
    const usageStats = await loadUsageStats();
    
    if (!usageStats[accountName]) {
      usageStats[accountName] = { count: 0, lastUsed: 0 };
    }
    
    usageStats[accountName].count += 1;
    usageStats[accountName].lastUsed = Date.now();
    
    await saveUsageStats(usageStats);
  } catch (error) {
    console.error('[Storage] 记录使用失败:', error);
  }
}

/**
 * 清空所有数据
 */
async function clearAllData() {
  try {
    await chrome.storage.local.remove([
      'accounts', 
      'accountInfo', 
      'usageStats', 
      'accountOrder'
    ]);
    return true;
  } catch (error) {
    console.error('[Storage] 清空数据失败:', error);
    return false;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadAccounts,
    loadAccountInfo,
    loadUsageStats,
    saveUsageStats,
    saveAccount,
    updateAccountInfo,
    deleteAccountFromStorage,
    loadAccountOrder,
    saveAccountOrder,
    recordAccountUsage,
    clearAllData
  };
}
