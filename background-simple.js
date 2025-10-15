// background-simple.js - 简化版background script用于测试

console.log('Background script loaded');

// 存储二维码数据
let qrCodeData = null;

// 处理来自弹出窗口或内容脚本的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background收到消息:', request);
  
  if (request.action === 'test') {
    console.log('收到测试消息');
    sendResponse({ success: true, message: 'Background script is running' });
    return true;
  }
  
  if (request.action === 'qrCodeDetected') {
    console.log('处理二维码检测消息');
    // 存储二维码数据
    qrCodeData = {
      secret: request.secret,
      issuer: request.issuer,
      label: request.label,
      rawData: request.rawData,
      fullData: request.fullData,
      migrationData: request.migrationData,
      timestamp: Date.now()
    };
    
    console.log('二维码数据已存储:', qrCodeData);
    
    // 发送响应
    sendResponse({ success: true, message: '二维码数据已存储' });
    return true;
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
  
  return false;
});

// 安装时的初始化
chrome.runtime.onInstalled.addListener(function() {
  console.log('Google Authenticator Extension 已安装');
});
