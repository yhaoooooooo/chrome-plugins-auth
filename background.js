// background.js - Google Authenticator 扩展后台脚本

// 安装时的初始化
chrome.runtime.onInstalled.addListener(function() {
  console.log('Google Authenticator Extension 已安装');
});

// 确保background script正在运行
console.log('Background script loaded and running');

// 存储二维码数据
let qrCodeData = null;

// 处理来自弹出窗口或内容脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('=== Background Script 收到消息 ===');
  console.log('消息内容:', request);
  console.log('发送者:', sender);
  console.log('消息类型:', request.action);
  console.log('时间戳:', new Date().toISOString());
  
  if (request.action === 'test') {
    console.log('✅ 收到测试消息');
    console.log('✅ 准备发送响应');
    const response = { success: true, message: 'Background script is running' };
    console.log('✅ 响应内容:', response);
    sendResponse(response);
    console.log('✅ 响应已发送');
    return true;
  }
  
  if (request.action === 'qrCodeDetected') {
    console.log('处理二维码检测消息');
    
    // 检查是否是迁移数据
    if (request.migrationData && request.migrationData.length > 0) {
      console.log('检测到迁移数据，包含', request.migrationData.length, '个账户');
      
      // 自动保存所有迁移账户
      chrome.storage.local.get(['accounts', 'accountInfo'], function(result) {
        const accounts = result.accounts || {};
        const accountInfo = result.accountInfo || {};
        let addedCount = 0;
        
        request.migrationData.forEach((account, index) => {
          if (account.secret && account.name) {
            // 清理账户名称，只移除控制字符，保留冒号等符号
            const cleanName = account.name
              .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 只移除控制字符
              .trim()
              .substring(0, 50); // 限制长度
            
            // 如果清理后的名称为空，使用默认名称
            const finalName = cleanName || `迁移账户_${index + 1}`;
            const accountKey = `${finalName}_${index}`;
            
            accounts[accountKey] = account.secret;
            
            // 保存issuer信息
            if (account.issuer) {
              accountInfo[accountKey] = { issuer: account.issuer };
            }
            
            addedCount++;
            console.log(`✅ 自动添加账户 ${index + 1}: ${finalName}, issuer: ${account.issuer || 'none'}`);
          }
        });
        
        // 保存所有账户和账户信息
        const dataToSave = { accounts: accounts };
        if (Object.keys(accountInfo).length > 0) {
          dataToSave.accountInfo = accountInfo;
        }
        
        chrome.storage.local.set(dataToSave, function() {
          console.log(`✅ 成功自动添加 ${addedCount} 个账户到存储`);
          
          // 通知popup刷新账户列表
          chrome.runtime.sendMessage({
            action: 'accountsUpdated',
            addedCount: addedCount,
            totalCount: request.migrationData.length
          }).catch(() => {
            console.log('Popup已关闭，无法发送账户更新通知');
          });
          
          // 发送响应
          sendResponse({ 
            success: true, 
            message: `成功自动添加 ${addedCount} 个账户`,
            addedCount: addedCount,
            totalCount: request.migrationData.length
          });
        });
      });
      
      return true;
    } else {
      // 单个账户数据，保持原有逻辑
      qrCodeData = {
        secret: request.secret,
        issuer: request.issuer,
        label: request.label,
        rawData: request.rawData,
        fullData: request.fullData,
        migrationData: request.migrationData,
        timestamp: Date.now()
      };
      
      console.log('单个账户数据已存储:', qrCodeData);
      
      // 发送响应
      sendResponse({ success: true, message: '二维码数据已存储' });
      
      // 通知所有popup窗口（如果有的话）
      chrome.runtime.sendMessage({
        action: 'qrDataUpdated',
        data: qrCodeData
      }).catch(() => {
        console.log('Popup已关闭，无法发送更新通知');
      });
      
      return true;
    }
  }
  
  if (request.action === 'getQRData') {
    // popup请求获取二维码数据
    sendResponse({ 
      success: true, 
      data: qrCodeData,
      hasData: qrCodeData !== null
    });
    return true;
  }
  
  if (request.action === 'clearQRData') {
    // 清除二维码数据
    qrCodeData = null;
    sendResponse({ success: true, message: '二维码数据已清除' });
    return true;
  }
  
  if (request.action === 'generateTOTP') {
    // 这里将请求转发给popup.js处理，因为算法逻辑在前端
    // 实际上这个功能在popup.js中已经实现
  }
  
  // 如果需要异步响应，返回true
  if (request.action === 'getAccounts') {
    chrome.storage.local.get(['accounts'], function(result) {
      sendResponse({ accounts: result.accounts || {} });
    });
    return true; // 保持消息通道开放以进行异步响应
  }
});

// 定期更新令牌（如果需要在后台运行）
// 设置闹钟来定期更新令牌
chrome.alarms.create('updateTokens', {
  periodInMinutes: 1  // 每分钟检查一次是否需要更新令牌
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'updateTokens') {
    // 可以在这里实现后台令牌更新逻辑
    console.log('更新令牌的闹钟触发');
  }
});

// 确保service worker保持活跃
chrome.runtime.onStartup.addListener(function() {
  console.log('Extension startup');
});

chrome.runtime.onSuspend.addListener(function() {
  console.log('Extension suspending');
});