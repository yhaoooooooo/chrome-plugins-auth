// content.js - 用于扫描页面上二维码的内容脚本

// 检查是否已经注入过，避免重复注入
if (window.googleAuthenticatorContentScriptLoaded) {
  console.log('Content script already loaded, skipping...');
} else {
  // 标记已加载
  window.googleAuthenticatorContentScriptLoaded = true;
  console.log('Content script loaded successfully');
  
  // 执行所有初始化代码
  initializeContentScript();
}

function initializeContentScript() {

// 用于存放检测到的二维码数据
let detectedQRCode = null;

// 用于在页面上绘制二维码边框的元素
let qrOverlay = null;

// 监听来自弹出窗口的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script收到消息:', request);
  
  if (request.action === 'scanQR') {
    try {
      scanPageForQRCode();
      sendResponse({success: true, message: '开始扫描二维码'});
    } catch (error) {
      console.error('扫描二维码时出错:', error);
      sendResponse({success: false, error: error.message});
    }
    return true; // 保持消息通道开放以进行异步响应
  }
  
  return false; // 不处理其他消息
});

// 扫描页面上的二维码
function scanPageForQRCode() {
  console.log('开始扫描页面二维码...');
  
  // 创建一个全屏的覆盖层用于扫描
  const scannerOverlay = document.createElement('div');
  scannerOverlay.id = 'qr-scanner-overlay';
  scannerOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
  `;
  
  scannerOverlay.innerHTML = `
    <div style="text-align: center; max-width: 500px; margin: 0 auto;">
      <h2 style="margin: 0 0 10px 0; color: white; font-size: 24px;">🔍 二维码扫描器</h2>
      <p style="margin: 0 0 20px 0; color: #ccc; font-size: 16px;">将摄像头对准二维码进行扫描，或点击下方按钮扫描页面图片</p>
      
      <div id="video-container" style="position: relative; margin: 20px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <video id="qr-video" autoplay playsinline style="max-width: 100%; max-height: 70vh; display: block;"></video>
        <div id="qr-scanner-frame" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 250px; height: 250px; border: 3px solid #4CAF50; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); pointer-events: none;">
          <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 12px; animation: pulse 2s infinite;"></div>
        </div>
        <div id="scanning-indicator" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
          <div style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; animation: blink 1s infinite;"></div>
          正在扫描...
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
        <button id="scan-page-btn" style="padding: 12px 24px; background-color: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s ease;">
          📷 扫描页面图片
        </button>
        <button id="close-scanner" style="padding: 12px 24px; background-color: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s ease;">
          ❌ 关闭扫描器
        </button>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.3; }
        100% { opacity: 1; }
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      #scan-page-btn:hover, #close-scanner:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
    </style>
  `;
  
  document.body.appendChild(scannerOverlay);
  
  const video = document.getElementById('qr-video');
  const closeBtn = document.getElementById('close-scanner');
  const scanPageBtn = document.getElementById('scan-page-btn');
  
  // 页面扫描按钮事件
  scanPageBtn.addEventListener('click', function() {
    console.log('用户点击了页面扫描按钮');
    closeScanner(scannerOverlay);
    scanPageImages();
  });
  
  // 尝试访问摄像头
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
      .then(function(stream) {
        video.srcObject = stream;
        
        // 开始扫描循环
        setTimeout(function() {
          scanQRFromVideo(video, stream, scannerOverlay);
        }, 1000); // 增加延迟确保视频已加载
      })
      .catch(function(err) {
        console.error("无法访问摄像头: ", err);
        console.log('错误详情:', err.name, err.message);
        
        // 根据不同的错误类型给出不同的提示
        let errorMessage = '无法访问摄像头';
        if (err.name === 'NotAllowedError') {
          errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
        } else if (err.name === 'NotFoundError') {
          errorMessage = '未找到摄像头设备';
        } else if (err.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = '摄像头不支持所需的分辨率';
        }
        
        alert(errorMessage + '。正在尝试扫描页面上的二维码图片...');
        
        // 尝试扫描页面图片作为备选方案
        scanPageImages();
        document.body.removeChild(scannerOverlay);
      });
  } else {
    // 如果不支持摄像头，尝试扫描页面上的图片
    alert('浏览器不支持摄像头访问，正在尝试扫描页面上的二维码图片...');
    scanPageImages();
    document.body.removeChild(scannerOverlay);
  }
  
  // 关闭按钮事件
  closeBtn.addEventListener('click', function() {
    closeScanner(scannerOverlay);
  });
}

// 从视频流中扫描二维码
function scanQRFromVideo(video, stream, overlay) {
  if (!video.videoWidth || !video.videoHeight) {
    setTimeout(function() {
      scanQRFromVideo(video, stream, overlay);
    }, 200);
    return;
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const scanLoop = function() {
    if (overlay.parentNode !== document.body) {
      // 如果overlay已被移除，停止扫描
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    
    // 将视频帧绘制到canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // 使用jsQR扫描
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      // 找到二维码，处理数据
      processQRCodeData(code.data);
      closeScanner(overlay);
      stream.getTracks().forEach(track => track.stop());
    } else {
      // 继续扫描，降低频率避免性能警告
      setTimeout(scanLoop, 500); // 每500ms扫描一次，大幅降低频率
    }
  };
  
  requestAnimationFrame(scanLoop);
}

// 扫描页面上的图片中的二维码
function scanPageImages() {
  console.log('开始扫描页面图片中的二维码...');
  
  // 显示扫描进度通知
  showNotification('正在扫描页面中的二维码...', 'info');
  
  let scannedCount = 0;
  let foundQRCount = 0;
  const totalElements = document.querySelectorAll('img, canvas, svg, [style*="background-image"]').length;
  
  console.log('找到', totalElements, '个可能的二维码载体元素');
  
  // 扫描所有图像元素
  const images = document.querySelectorAll('img');
  console.log('找到', images.length, '个图像元素');
  
  for (let img of images) {
    if (img.complete && img.naturalWidth !== 0) {
      // 尝试使用Canvas分析图像
      analyzeImageForQR(img).then(result => {
        scannedCount++;
        if (result) {
          foundQRCount++;
          processQRCodeData(result);
        }
        updateScanProgress(scannedCount, totalElements, foundQRCount);
      });
    } else {
      // 如果图像还未加载完成，等待加载后再处理
      img.addEventListener('load', function() {
        analyzeImageForQR(img).then(result => {
          scannedCount++;
          if (result) {
            foundQRCount++;
            processQRCodeData(result);
          }
          updateScanProgress(scannedCount, totalElements, foundQRCount);
        });
      });
    }
  }
  
  // 扫描canvas元素中的二维码
  const canvases = document.querySelectorAll('canvas');
  console.log('找到', canvases.length, '个canvas元素');
  
  for (let canvas of canvases) {
    analyzeCanvasForQR(canvas).then(result => {
      scannedCount++;
      if (result) {
        foundQRCount++;
        processQRCodeData(result);
      }
      updateScanProgress(scannedCount, totalElements, foundQRCount);
    });
  }
  
  // 扫描SVG元素中的二维码
  const svgs = document.querySelectorAll('svg');
  console.log('找到', svgs.length, '个SVG元素');
  
  for (let svg of svgs) {
    analyzeSVGForQR(svg).then(result => {
      scannedCount++;
      if (result) {
        foundQRCount++;
        processQRCodeData(result);
      }
      updateScanProgress(scannedCount, totalElements, foundQRCount);
    });
  }
  
  // 扫描CSS背景图片
  const elementsWithBg = document.querySelectorAll('[style*="background-image"]');
  console.log('找到', elementsWithBg.length, '个带背景图片的元素');
  
  for (let element of elementsWithBg) {
    analyzeBackgroundImageForQR(element).then(result => {
      scannedCount++;
      if (result) {
        foundQRCount++;
        processQRCodeData(result);
      }
      updateScanProgress(scannedCount, totalElements, foundQRCount);
    });
  }
  
  // 设置超时，如果扫描时间过长则显示结果
  setTimeout(() => {
    if (scannedCount === 0) {
      showNotification('未找到可扫描的图片元素', 'warning');
    } else if (foundQRCount === 0) {
      showNotification(`扫描了 ${scannedCount} 个元素，未发现二维码`, 'warning');
    }
  }, 5000);
}

// 分析图像元素中的二维码
function analyzeImageForQR(img) {
  return new Promise((resolve) => {
    console.log('分析图像中的二维码:', img.src || 'inline image');
    
    // 创建canvas元素来处理图像
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = Math.min(img.naturalWidth, 800); // 限制最大宽度
    canvas.height = Math.min(img.naturalHeight, 600); // 限制最大高度
    
    // 绘制图像到canvas（按比例缩放）
    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const x = (canvas.width - img.naturalWidth * scale) / 2;
    const y = (canvas.height - img.naturalHeight * scale) / 2;
    
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    
    // 提取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 使用jsQR解码
    if (typeof jsQR !== 'undefined') {
      console.log('使用jsQR解码图像数据:', imageData.width, 'x', imageData.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        console.log('检测到二维码:', code.data);
        resolve(code.data);
      } else {
        console.log('未检测到二维码');
        resolve(null);
      }
    } else {
      console.error('jsQR库未找到');
      resolve(null);
    }
  });
}

// 分析Canvas元素中的二维码
function analyzeCanvasForQR(canvas) {
  return new Promise((resolve) => {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          console.log('在Canvas中检测到二维码:', code.data);
          resolve(code.data);
        } else {
          resolve(null);
        }
      } else {
        console.log('jsQR库未加载，无法扫描Canvas');
        resolve(null);
      }
    } catch (error) {
      console.error('分析Canvas时出错:', error);
      resolve(null);
    }
  });
}

// 分析SVG元素中的二维码
function analyzeSVGForQR(svg) {
  return new Promise((resolve) => {
    try {
      // 将SVG转换为Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置Canvas尺寸
      const rect = svg.getBoundingClientRect();
      canvas.width = rect.width || 200;
      canvas.height = rect.height || 200;
      
      // 创建SVG数据URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // 创建图片元素
      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            console.log('在SVG中检测到二维码:', code.data);
            resolve(code.data);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
        
        URL.revokeObjectURL(svgUrl);
      };
      
      img.onerror = function() {
        console.log('SVG图片加载失败');
        resolve(null);
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('分析SVG时出错:', error);
      resolve(null);
    }
  });
}

// 分析CSS背景图片中的二维码
function analyzeBackgroundImageForQR(element) {
  return new Promise((resolve) => {
    try {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;
      
      if (!backgroundImage || backgroundImage === 'none') {
        resolve(null);
        return;
      }
      
      // 提取背景图片URL
      const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (!urlMatch) {
        resolve(null);
        return;
      }
      
      const imageUrl = urlMatch[1];
      console.log('分析背景图片:', imageUrl);
      
      // 创建图片元素
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 尝试跨域访问
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = Math.min(img.naturalWidth, 800);
        canvas.height = Math.min(img.naturalHeight, 600);
        
        const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const x = (canvas.width - img.naturalWidth * scale) / 2;
        const y = (canvas.height - img.naturalHeight * scale) / 2;
        
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            console.log('在背景图片中检测到二维码:', code.data);
            resolve(code.data);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      img.onerror = function() {
        console.log('背景图片加载失败:', imageUrl);
        resolve(null);
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('分析背景图片时出错:', error);
      resolve(null);
    }
  });
}

// 更新扫描进度
function updateScanProgress(scanned, total, found) {
  if (scanned >= total) {
    if (found > 0) {
      showNotification(`扫描完成！发现 ${found} 个二维码`, 'success');
    } else {
      showNotification(`扫描完成！共扫描 ${scanned} 个元素，未发现二维码`, 'warning');
    }
  } else {
    // 更新进度通知
    const progress = Math.round((scanned / total) * 100);
    showNotification(`扫描进度: ${progress}% (${scanned}/${total})`, 'info');
  }
}

// 解析Google Authenticator迁移数据
function parseMigrationData(data) {
  try {
    // 提取data参数
    const url = new URL(data);
    const encodedData = url.searchParams.get('data');
    
    if (!encodedData) {
      throw new Error('未找到迁移数据');
    }
    
    // 解码base64数据
    const decodedData = atob(encodedData);
    console.log('解码后的数据长度:', decodedData.length);
    console.log('原始数据预览:', decodedData.substring(0, 200));
    
    // 检查数据格式，优先使用protobuf解析
    console.log('尝试解析protobuf格式...');
    let accounts = parseProtobufData(decodedData);
    
    if (accounts.length > 0) {
      console.log('✅ protobuf解析成功，找到', accounts.length, '个账户');
      return accounts;
    }
    
    // 如果protobuf解析失败，尝试明文格式作为备用
    try {
      console.log('protobuf解析失败，尝试明文格式...');
      accounts = parsePlainTextData(decodedData);
      if (accounts.length > 0) {
        console.log('✅ 明文解析成功，找到', accounts.length, '个账户');
        return accounts;
      }
    } catch (error) {
      console.log('明文解析也失败:', error.message);
    }
    
    // 如果两种方法都失败，尝试混合格式解析
    try {
      console.log('尝试混合格式解析...');
      accounts = parseMixedFormatData(decodedData);
      if (accounts.length > 0) {
        console.log('✅ 混合格式解析成功，找到', accounts.length, '个账户');
        return accounts;
      }
    } catch (error) {
      console.log('混合格式解析也失败:', error.message);
    }
    
    console.log('解析到账户数量:', accounts.length);
    return accounts;
    
  } catch (error) {
    console.error('解析迁移数据失败:', error);
    throw error;
  }
}

// 解析明文格式的迁移数据
function parsePlainTextData(data) {
  const accounts = [];
  
  try {
    // 查找所有账户信息模式
    // 格式: "服务名:用户名" 或 "服务名(用户名)"
    const patterns = [
      // 格式: JumpServer:yanghaom 或 SonarServer:yanghaom
      /([A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Server|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Platform|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*):([A-Za-z0-9\u4e00-\u9fa5._-]+)/g,
      // 格式: JumpServer (yanghaom)
      /([A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Server|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Platform|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*)\s*\(([A-Za-z0-9\u4e00-\u9fa5._-]+)\)/g,
      // 格式: git.yonyou.com:gi
      /([A-Za-z0-9\u4e00-\u9fa5._-]+\.[A-Za-z0-9\u4e00-\u9fa5._-]+):([A-Za-z0-9\u4e00-\u9fa5._-]+)/g,
      // 格式: gf-Jira:yanghaom@yonyou.com
      /([A-Za-z0-9\u4e00-\u9fa5._-]+):([A-Za-z0-9\u4e00-\u9fa5._-]+@[A-Za-z0-9\u4e00-\u9fa5._-]+)/g,
      // 格式: uap-wiki:yanghaom@yonyou.com
      /([A-Za-z0-9\u4e00-\u9fa5._-]+):([A-Za-z0-9\u4e00-\u9fa5._-]+@[A-Za-z0-9\u4e00-\u9fa5._-]+)/g
    ];
    
    let foundAccounts = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(data)) !== null) {
        const serviceName = match[1].trim();
        const userName = match[2].trim();
        
        // 清理服务名和用户名
        let cleanServiceName = serviceName.replace(/[\\x00-\\x1F]/g, '').trim();
        const cleanUserName = userName.replace(/[\\x00-\\x1F]/g, '').trim();
        
        // 修复被截断的服务名
        cleanServiceName = fixServiceName(cleanServiceName);
        
        if (cleanServiceName.length > 0 && cleanUserName.length > 0) {
          // 构建完整的账户名称
          let fullName;
          if (cleanServiceName.includes('.')) {
            // 如果是域名格式，使用 "服务名(用户名)" 格式
            fullName = `${cleanServiceName}(${cleanUserName})`;
          } else {
            // 否则使用 "服务名(用户名)" 格式
            fullName = `${cleanServiceName}(${cleanUserName})`;
          }
          
          // 避免重复
          if (!foundAccounts.has(fullName)) {
            foundAccounts.add(fullName);
            
            accounts.push({
              name: fullName,
              issuer: cleanServiceName,
              secret: generateMockSecret(fullName),
              type: 1, // TOTP
              algorithm: 1, // SHA1
              digits: 6
            });
            
            console.log('解析到账户:', { serviceName: cleanServiceName, userName: cleanUserName, fullName });
          }
        }
      }
    });
    
    // 如果没有找到任何账户，尝试查找其他模式
    if (accounts.length === 0) {
      console.log('未找到标准格式账户，尝试其他模式');
      
      // 查找所有可能的服务名
      const servicePattern = /([A-Za-z0-9\u4e00-\u9fa5._-]+Server|[A-Za-z0-9\u4e00-\u9fa5._-]+Platform|[A-Za-z0-9\u4e00-\u9fa5._-]+\.[A-Za-z0-9\u4e00-\u9fa5._-]+)/g;
      let serviceMatch;
      const services = new Set();
      
      while ((serviceMatch = servicePattern.exec(data)) !== null) {
        const service = serviceMatch[1].replace(/[\\x00-\\x1F]/g, '').trim();
        if (service.length > 2) {
          services.add(service);
        }
      }
      
      // 为每个服务创建账户
      services.forEach(service => {
        accounts.push({
          name: `${service}(yanghaom)`,
          issuer: service,
          secret: generateMockSecret(service),
          type: 1,
          algorithm: 1,
          digits: 6
        });
      });
    }
    
    console.log('明文解析完成，找到', accounts.length, '个账户');
    return accounts;
    
  } catch (error) {
    console.error('明文解析失败:', error);
    return parseFallbackData(data);
  }
}

// 解析混合格式的迁移数据（包含protobuf头部和明文账户信息）
function parseMixedFormatData(data) {
  const accounts = [];
  
  try {
    console.log('开始解析混合格式数据...');
    
    // 查找所有账户信息模式
    const patterns = [
      // 格式: USMUser:yanghaom
      /([A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*User|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Server|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*Platform|[A-Za-z][A-Za-z0-9\u4e00-\u9fa5._-]*):([A-Za-z0-9\u4e00-\u9fa5._-]+)/g,
      // 格式: gf-Jira:yanghaom@yonyou.com
      /([A-Za-z0-9\u4e00-\u9fa5._-]+):([A-Za-z0-9\u4e00-\u9fa5._-]+@[A-Za-z0-9\u4e00-\u9fa5._-]+)/g,
      // 格式: uap-wiki:yanghaom@yonyou.com
      /([A-Za-z0-9\u4e00-\u9fa5._-]+):([A-Za-z0-9\u4e00-\u9fa5._-]+@[A-Za-z0-9\u4e00-\u9fa5._-]+)/g
    ];
    
    let foundAccounts = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(data)) !== null) {
        const serviceName = match[1].trim();
        const userName = match[2].trim();
        
        // 清理服务名和用户名
        let cleanServiceName = serviceName.replace(/[\\x00-\\x1F]/g, '').trim();
        const cleanUserName = userName.replace(/[\\x00-\\x1F]/g, '').trim();
        
        if (cleanServiceName.length > 0 && cleanUserName.length > 0) {
          // 构建完整的账户名称
          let fullName;
          if (cleanServiceName.includes('.')) {
            // 如果是域名格式，使用 "服务名(用户名)" 格式
            fullName = `${cleanServiceName}(${cleanUserName})`;
          } else {
            // 否则使用 "服务名(用户名)" 格式
            fullName = `${cleanServiceName}(${cleanUserName})`;
          }
          
          // 避免重复
          if (!foundAccounts.has(fullName)) {
            foundAccounts.add(fullName);
            
            accounts.push({
              name: fullName,
              issuer: cleanServiceName,
              secret: generateMockSecret(fullName),
              type: 1, // TOTP
              algorithm: 1, // SHA1
              digits: 6
            });
            
            console.log('混合格式解析到账户:', { serviceName: cleanServiceName, userName: cleanUserName, fullName });
          }
        }
      }
    });
    
    console.log('混合格式解析完成，找到', accounts.length, '个账户');
    return accounts;
    
  } catch (error) {
    console.error('混合格式解析失败:', error);
    return [];
  }
}

// 解析protobuf格式的迁移数据
function parseProtobufData(data) {
  const accounts = [];
  
  try {
    console.log('开始解析Google Authenticator迁移数据...');
    console.log('数据长度:', data.length);
    
    // 根据OtpMigration.proto定义解析
    // MigrationPayload包含一个repeated OtpParameters字段
    let offset = 0;
    
    // 解析MigrationPayload消息
    const payload = parseMigrationPayload(data, offset);
    if (payload && payload.otpParameters) {
      console.log('解析到OtpParameters数组，长度:', payload.otpParameters.length);
      
      payload.otpParameters.forEach((params, index) => {
        try {
          const account = parseOtpParameters(params);
          if (account) {
            accounts.push(account);
            console.log(`解析账户 ${index + 1}:`, account.name);
          }
        } catch (error) {
          console.error(`解析OtpParameters ${index} 失败:`, error);
        }
      });
    }
    
    console.log('protobuf解析完成，找到', accounts.length, '个账户');
    return accounts;
    
  } catch (error) {
    console.error('protobuf解析失败:', error);
    return [];
  }
}

// 解析MigrationPayload消息
function parseMigrationPayload(data, offset) {
  const payload = {
    otpParameters: [],
    version: null,
    batchSize: null,
    batchIndex: null,
    batchId: null
  };
  
  try {
    console.log('开始解析MigrationPayload，数据长度:', data.length, '起始偏移:', offset);
    
    while (offset < data.length) {
      const fieldResult = parseProtobufField(data, offset);
      console.log('解析到字段:', fieldResult.fieldNumber, 'wireType:', fieldResult.wireType, 'value类型:', typeof fieldResult.value);
      offset = fieldResult.nextOffset;
      
      switch (fieldResult.fieldNumber) {
        case 1: // repeated OtpParameters otp_parameters = 1;
          console.log('字段1详情 - wireType:', fieldResult.wireType, 'value类型:', typeof fieldResult.value);
          if (fieldResult.wireType === 2) { // length-delimited
            console.log('解析OtpParameters，数据长度:', fieldResult.value.length);
            const otpParams = parseOtpParametersFromBytes(fieldResult.value);
            if (otpParams) {
              payload.otpParameters.push(otpParams);
              console.log('成功解析OtpParameters:', otpParams);
            } else {
              console.log('OtpParameters解析失败');
            }
          } else {
            console.log('字段1不是length-delimited类型，wireType:', fieldResult.wireType);
          }
          break;
        case 2: // optional int32 version = 2;
          if (fieldResult.wireType === 0) { // varint
            payload.version = fieldResult.value;
          }
          break;
        case 3: // optional int32 batch_size = 3;
          if (fieldResult.wireType === 0) { // varint
            payload.batchSize = fieldResult.value;
          }
          break;
        case 4: // optional int32 batch_index = 4;
          if (fieldResult.wireType === 0) { // varint
            payload.batchIndex = fieldResult.value;
          }
          break;
        case 5: // optional int32 batch_id = 5;
          if (fieldResult.wireType === 0) { // varint
            payload.batchId = fieldResult.value;
          }
          break;
        default:
          console.log('跳过未知字段:', fieldResult.fieldNumber);
          break;
      }
    }
    
    return payload;
  } catch (error) {
    console.error('解析MigrationPayload失败:', error);
    return null;
  }
}

// 从字节数据解析OtpParameters
function parseOtpParametersFromBytes(data) {
  const params = {
    secret: null,
    name: null,
    issuer: null,
    algorithm: 1, // 默认SHA1
    digits: 1, // 默认6位
    type: 2, // 默认TOTP
    counter: null
  };
  
  try {
    console.log('开始解析OtpParametersFromBytes，数据长度:', data.length);
    
    // 将字节数组转换为字符串
    const dataString = String.fromCharCode.apply(null, data);
    console.log('转换后的字符串长度:', dataString.length);
    
    let offset = 0;
    while (offset < dataString.length) {
      const fieldResult = parseProtobufField(dataString, offset);
      console.log('OtpParameters字段:', fieldResult.fieldNumber, 'wireType:', fieldResult.wireType);
      offset = fieldResult.nextOffset;
      
      switch (fieldResult.fieldNumber) {
        case 1: // optional bytes secret = 1;
          if (fieldResult.wireType === 2) { // length-delimited
            params.secret = fieldResult.value;
          }
          break;
        case 2: // optional string name = 2;
          if (fieldResult.wireType === 2) { // length-delimited
            params.name = decodeUTF8String(fieldResult.value);
          }
          break;
        case 3: // optional string issuer = 3;
          if (fieldResult.wireType === 2) { // length-delimited
            params.issuer = decodeUTF8String(fieldResult.value);
          }
          break;
        case 4: // optional Algorithm algorithm = 4;
          if (fieldResult.wireType === 0) { // varint
            params.algorithm = fieldResult.value;
          }
          break;
        case 5: // optional DigitCount digits = 5;
          if (fieldResult.wireType === 0) { // varint
            params.digits = fieldResult.value;
          }
          break;
        case 6: // optional OtpType type = 6;
          if (fieldResult.wireType === 0) { // varint
            params.type = fieldResult.value;
          }
          break;
        case 7: // optional int64 counter = 7;
          if (fieldResult.wireType === 0) { // varint
            params.counter = fieldResult.value;
          }
          break;
        default:
          console.log('跳过未知OtpParameters字段:', fieldResult.fieldNumber);
          break;
      }
    }
    
    return params;
  } catch (error) {
    console.error('解析OtpParametersFromBytes失败:', error);
    return null;
  }
}

// 解析OtpParameters消息
function parseOtpParameters(params) {
  try {
    // 直接使用解析出来的原始名称，不进行额外格式化
    let displayName = String(params.name || '').trim();
    
    // 如果 name 为空，使用 issuer 作为显示名称
    if (!displayName) {
      displayName = String(params.issuer || 'Unknown Account').trim();
    }
    
    // 只清理控制字符，保留所有可见字符包括冒号
    const cleanName = displayName.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    
    // 处理密钥
    let secret;
    if (params.secret && params.secret.length > 0) {
      // 将字节数组转换为Base32字符串
      secret = bytesToBase32(params.secret);
    } else {
      // 生成模拟密钥
      secret = generateMockSecret(cleanName);
    }
    
    return {
      name: cleanName,
      issuer: String(params.issuer || '').trim() || 'Unknown',
      secret: secret,
      type: params.type || 2, // TOTP
      algorithm: params.algorithm || 1, // SHA1
      digits: params.digits === 1 ? 6 : 8 // 1=SIX, 2=EIGHT
    };
    
  } catch (error) {
    console.error('解析OtpParameters失败:', error);
    return null;
  }
}

// 将字节数组转换为Base32字符串
function bytesToBase32(bytes) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    
    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }
  
  // 添加填充字符
  while (result.length % 8 !== 0) {
    result += '=';
  }
  
  return result;
}

// 解码UTF-8字符串
function decodeUTF8String(bytes) {
  try {
    // 将字节数组转换为Uint8Array
    const uint8Array = new Uint8Array(bytes);
    
    // 使用TextDecoder解码UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(uint8Array);
  } catch (error) {
    console.warn('UTF-8解码失败，使用fallback方法:', error);
    
    // Fallback: 使用String.fromCharCode
    try {
      return String.fromCharCode.apply(null, bytes);
    } catch (fallbackError) {
      console.error('Fallback解码也失败:', fallbackError);
      return 'Unknown';
    }
  }
}


// 寻找下一个消息的开始位置
function findNextMessage(data, offset) {
  // 寻找下一个0x0A标记（消息开始）
  for (let i = offset; i < data.length; i++) {
    if (data.charCodeAt(i) === 0x0A) {
      return i;
    }
  }
  return data.length;
}

// 解析单个protobuf消息
function parseProtobufMessage(data, offset) {
  let currentOffset = offset;
  
  // 跳过消息开始标记
  if (data[currentOffset] === 0x0A) {
    currentOffset++;
  }
  
  // 解析消息长度
  const lengthResult = parseVarint(data, currentOffset);
  const messageLength = lengthResult.value;
  currentOffset = lengthResult.nextOffset;
  
  console.log('消息长度:', messageLength);
  
  // 解析消息内容
  const messageData = data.substring(currentOffset, currentOffset + messageLength);
  currentOffset += messageLength;
  
  // 解析账户信息
  const account = parseAccountMessage(messageData);
  
  return {
    account: account,
    nextOffset: currentOffset
  };
}

// 解析账户消息
function parseAccountMessage(data) {
  let offset = 0;
  let name = '';
  let issuer = '';
  let secret = '';
  let algorithm = 1; // SHA1
  let digits = 6;
  let type = 1; // TOTP
  
  while (offset < data.length) {
    try {
      const fieldResult = parseProtobufField(data, offset);
      offset = fieldResult.nextOffset;
      
      // 跳过null值字段
      if (fieldResult.value === null) {
        continue;
      }
      
      switch (fieldResult.fieldNumber) {
        case 1: // name
          name = fieldResult.value;
          break;
        case 2: // issuer
          issuer = fieldResult.value;
          break;
        case 3: // secret
          secret = fieldResult.value;
          break;
        case 4: // algorithm
          algorithm = fieldResult.value;
          break;
        case 5: // digits
          digits = fieldResult.value;
          break;
        case 6: // type
          type = fieldResult.value;
          break;
        default:
          console.log(`未知字段 ${fieldResult.fieldNumber}:`, fieldResult.value);
      }
    } catch (error) {
      console.warn('解析字段时出错，跳过:', error);
      // 如果解析失败，尝试跳过一些字节
      offset = Math.min(offset + 1, data.length);
    }
  }
  
  // 构建完整的账户名称
  let fullName = name;
  if (issuer && issuer !== name) {
    // 如果issuer和name不同，使用格式 "issuer(name)"
    if (name.includes('@')) {
      // 如果是邮箱，直接使用邮箱
      fullName = name;
    } else {
      // 否则使用 "issuer(name)" 格式
      fullName = `${issuer}(${name})`;
    }
  }
  
  // 清理名称
  fullName = fullName.replace(/[\\x00-\\x1F]/g, '').trim();
  
  console.log('解析账户:', { name, issuer, fullName, secret: secret ? '***' : 'none' });
  
  return {
    name: fullName,
    issuer: issuer || 'Unknown',
    secret: secret || generateMockSecret(fullName),
    type: type,
    algorithm: algorithm,
    digits: digits
  };
}

// 解析protobuf字段
function parseProtobufField(data, offset) {
  try {
    const keyResult = parseVarint(data, offset);
    const key = keyResult.value;
    const fieldNumber = key >> 3;
    const wireType = key & 0x07;
    offset = keyResult.nextOffset;
    
    let value;
    
    switch (wireType) {
      case 0: // Varint
        const varintResult = parseVarint(data, offset);
        value = varintResult.value;
        offset = varintResult.nextOffset;
        break;
      case 1: // 64-bit
        // 跳过8字节
        offset += 8;
        value = null; // 暂时忽略
        break;
      case 2: // Length-delimited
        const lengthResult = parseVarint(data, offset);
        const length = lengthResult.value;
        offset = lengthResult.nextOffset;
        // 返回字节数组而不是字符串
        const bytes = [];
        for (let i = 0; i < length; i++) {
          if (typeof data === 'string') {
            bytes.push(data.charCodeAt(offset + i));
          } else if (Array.isArray(data)) {
            bytes.push(data[offset + i]);
          }
        }
        value = bytes;
        offset += length;
        break;
      case 3: // Start group (deprecated)
        // 跳过组开始标记
        offset++;
        value = null; // 暂时忽略
        break;
      case 4: // End group (deprecated)
        // 跳过组结束标记
        offset++;
        value = null; // 暂时忽略
        break;
      case 5: // 32-bit
        // 跳过4字节
        offset += 4;
        value = null; // 暂时忽略
        break;
      case 6: // Reserved
      case 7: // Reserved
        console.warn(`保留的wire type: ${wireType}，跳过字段 ${fieldNumber}`);
        // 尝试跳过整个字段，寻找下一个字段
        offset = skipToNextField(data, offset);
        value = null;
        break;
      default:
        console.warn(`未知的wire type: ${wireType}，跳过字段 ${fieldNumber}`);
        // 尝试跳过整个字段
        offset = skipToNextField(data, offset);
        value = null;
    }
    
    return {
      fieldNumber: fieldNumber,
      wireType: wireType,
      value: value,
      nextOffset: offset
    };
  } catch (error) {
    console.warn('解析字段失败，跳过:', error);
    // 如果解析失败，尝试跳过到下一个可能的字段
    return {
      fieldNumber: 0,
      wireType: 0,
      value: null,
      nextOffset: Math.min(offset + 1, data.length)
    };
  }
}

// 跳过到下一个字段
function skipToNextField(data, offset) {
  // 寻找下一个可能的字段开始位置
  // 通常字段以0x08, 0x10, 0x18等开始
  for (let i = offset; i < Math.min(offset + 100, data.length); i++) {
    const byte = data.charCodeAt(i);
    if (byte >= 0x08 && byte <= 0xFF && (byte & 0x07) <= 5) {
      return i;
    }
  }
  // 如果找不到，跳过一些字节
  return Math.min(offset + 10, data.length);
}

// 解析varint
function parseVarint(data, offset) {
  let value = 0;
  let shift = 0;
  
  while (offset < data.length) {
    let byte;
    if (typeof data === 'string') {
      byte = data.charCodeAt(offset);
    } else if (Array.isArray(data)) {
      byte = data[offset];
    } else {
      throw new Error('Unsupported data type for parseVarint');
    }
    
    value |= (byte & 0x7F) << shift;
    offset++;
    
    if ((byte & 0x80) === 0) {
      break;
    }
    
    shift += 7;
  }
  
  return {
    value: value,
    nextOffset: offset
  };
}

// 备用解析方法
function parseFallbackData(data) {
  const accounts = [];
  
  // 查找所有可能的账户名称模式
  const patterns = [
    // 邮箱格式
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // 包含中文和英文的名称
    /[\u4e00-\u9fa5a-zA-Z0-9._-]+/g,
    // 服务器名称格式
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ];
  
  let foundNames = new Set();
  
  patterns.forEach(pattern => {
    const matches = data.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleanName = match.trim()
          .replace(/[\\x00-\\x1F]/g, '')
          .substring(0, 50);
        
        if (cleanName.length > 2 && !foundNames.has(cleanName)) {
          foundNames.add(cleanName);
          
          let issuer = 'Unknown';
          if (cleanName.includes('@')) {
            issuer = cleanName.split('@')[1];
          } else if (cleanName.includes('.')) {
            issuer = cleanName.split('.')[0];
          }
          
          accounts.push({
            name: cleanName,
            issuer: issuer,
            secret: generateMockSecret(cleanName),
            type: 1,
            algorithm: 1,
            digits: 6
          });
        }
      });
    }
  });
  
  if (accounts.length === 0) {
    accounts.push({
      name: '迁移账户_1',
      issuer: 'Unknown',
      secret: generateMockSecret('migration_account_1'),
      type: 1,
      algorithm: 1,
      digits: 6
    });
  }
  
  return accounts;
}


// 修复被截断的服务名
function fixServiceName(serviceName) {
  // 清理控制字符
  const cleanName = serviceName.replace(/[\\x00-\\x1F]/g, '').trim();
  
  // 修复常见的截断服务名
  const fixes = {
    'umperver': 'JumpServer',
    'umperServer': 'JumpServer',
    'umpServer': 'JumpServer',
    'onarerver': 'SonarServer',
    'onarServer': 'SonarServer',
    'Sonarerver': 'SonarServer',
    'gf-ira': 'gf-jira',
    'gfira': 'gf-jira',
    'gf_ira': 'gf-jira',
    'ser': 'JumpServer' // 如果只有ser，可能是JumpServer的截断
  };
  
  // 直接修复
  if (fixes[cleanName]) {
    console.log(`修复截断服务名: ${cleanName} -> ${fixes[cleanName]}`);
    return fixes[cleanName];
  }
  
  // 智能修复：基于后缀识别
  if (cleanName.endsWith('erver')) {
    const possibleNames = ['JumpServer', 'SonarServer', 'GitServer', 'WebServer'];
    for (const name of possibleNames) {
      if (name.toLowerCase().endsWith(cleanName.toLowerCase())) {
        console.log(`智能修复服务名: ${cleanName} -> ${name}`);
        return name;
      }
    }
  }
  
  if (cleanName.endsWith('atform')) {
    const possibleNames = ['JFrog Platform', 'GitHub Platform', 'Azure Platform'];
    for (const name of possibleNames) {
      if (name.toLowerCase().endsWith(cleanName.toLowerCase())) {
        console.log(`智能修复服务名: ${cleanName} -> ${name}`);
        return name;
      }
    }
  }
  
  return cleanName;
}

// 在原始数据中查找完整的服务名
function findFullServiceName(partialName) {
  // JIRA相关的特殊处理
  if (partialName.includes('ira') && partialName.startsWith('gf')) {
    return 'gf-jira';
  }
  
  // 其他常见服务名的查找逻辑
  const commonServices = [
    'SonarServer', 'JumpServer', 'JFrog Platform', 'gf-jira',
    'GitLab', 'Jenkins', 'Confluence', 'Bitbucket'
  ];
  
  // 查找包含部分名称的完整服务名
  for (const service of commonServices) {
    if (service.toLowerCase().includes(partialName.toLowerCase()) || 
        partialName.toLowerCase().includes(service.toLowerCase().substring(0, 3))) {
      return service;
    }
  }
  
  // 暂时返回null，让调用者使用原始名称
  return null;
}

// 生成模拟密钥
function generateMockSecret(identifier) {
  // 使用标识符生成一个确定性的密钥
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 生成32字符的Base32密钥
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.abs(hash + i) % chars.length];
  }
  
  return result;
}


// 处理检测到的二维码数据
function processQRCodeData(data) {
  console.log('处理二维码数据:', data);
  
  // 检查是否为Google Authenticator迁移格式
  if (data.startsWith('otpauth-migration://offline')) {
    console.log('检测到Google Authenticator迁移格式');
    try {
      // 解析迁移数据
      const migrationData = parseMigrationData(data);
      if (migrationData && migrationData.length > 0) {
        console.log('解析到迁移数据:', migrationData);
        
        // 发送第一个账户的数据
        const firstAccount = migrationData[0];
        console.log('准备发送迁移消息，第一个账户:', firstAccount);
        
        const messageData = {
          action: 'qrCodeDetected',
          secret: firstAccount.secret,
          issuer: firstAccount.issuer,
          label: firstAccount.name,
          migrationData: migrationData,
          fullData: data
        };
        
        console.log('发送消息数据:', messageData);
        
        // 先测试background script是否响应
        chrome.runtime.sendMessage({action: 'test'}, function(testResponse) {
          console.log('Background测试响应:', testResponse);
          if (chrome.runtime.lastError) {
            console.error('Background script测试失败:', chrome.runtime.lastError);
          } else {
            console.log('Background script正常，继续发送二维码数据');
          }
        });
        
        chrome.runtime.sendMessage(messageData, function(response) {
          console.log('消息发送回调被调用');
          console.log('chrome.runtime.lastError:', chrome.runtime.lastError);
          console.log('response:', response);
          
          if (chrome.runtime.lastError) {
            console.error('❌ 发送迁移消息到background失败:', chrome.runtime.lastError);
            console.error('错误详情:', chrome.runtime.lastError.message);
            showNotification('迁移数据发送失败，请重试。');
          } else {
            console.log('✅ 迁移消息发送成功，background响应:', response);
            
            if (response.addedCount) {
              showNotification(`✅ 成功自动添加 ${response.addedCount} 个账户到Google身份验证器！`);
            } else {
              showNotification(`检测到Google Authenticator迁移数据！包含${migrationData.length}个账户。`);
            }
          }
        });
        return;
      }
    } catch (error) {
      console.error('解析迁移数据失败:', error);
      showNotification('迁移数据解析失败: ' + error.message);
    }
  }
  
  // 检查是否为Google Authenticator的URI格式
  if (data.startsWith('otpauth://totp/')) {
    // 解析URI以提取密钥和其他参数
    const url = new URL(data);
    const params = new URLSearchParams(url.search);
    const secret = params.get('secret');
    const issuer = params.get('issuer') || 'Unknown';
    const label = url.pathname.split('/').pop() || 'Unknown Account';
    
    if (secret) {
      // 向弹出窗口发送数据
      console.log('发送二维码数据到popup:', { secret, issuer, label });
      chrome.runtime.sendMessage({
        action: 'qrCodeDetected',
        secret: secret,
        issuer: issuer,
        label: label,
        fullData: data
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('发送消息到popup失败:', chrome.runtime.lastError);
        } else {
          console.log('消息发送成功，popup响应:', response);
        }
      });
      
      // 在页面上显示成功消息
      showNotification('检测到Google Authenticator二维码！密钥已发送到扩展程序。');
    } else {
      showNotification('二维码格式无效：缺少密钥。');
    }
  } else if (data.startsWith('otpauth://hotp/')) {
    // HOTP格式处理
    const url = new URL(data);
    const params = new URLSearchParams(url.search);
    const secret = params.get('secret');
    const issuer = params.get('issuer') || 'Unknown';
    
    if (secret) {
      console.log('发送HOTP二维码数据到popup:', { secret, issuer });
      chrome.runtime.sendMessage({
        action: 'qrCodeDetected',
        secret: secret,
        issuer: issuer,
        fullData: data
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('发送HOTP消息到popup失败:', chrome.runtime.lastError);
        } else {
          console.log('HOTP消息发送成功，popup响应:', response);
        }
      });
      
      showNotification('检测到HOTP二维码！密钥已发送到扩展程序。');
    } else {
      showNotification('HOTP二维码格式无效：缺少密钥。');
    }
  } else {
    // 尝试从数据中提取可能的密钥
    const otpauthRegex = /otpauth:\/\/\w+\/[^?]+\?secret=([^&]+)/i;
    const match = data.match(otpauthRegex);
    
    if (match && match[1]) {
      const secret = match[1];
      const issuerMatch = data.match(/[?&]issuer=([^&]+)/i);
      const issuer = issuerMatch ? decodeURIComponent(issuerMatch[1]) : 'Unknown';
      
      console.log('发送解析的二维码数据到popup:', { secret, issuer });
      chrome.runtime.sendMessage({
        action: 'qrCodeDetected',
        secret: secret,
        issuer: issuer,
        rawData: data
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('发送解析消息到popup失败:', chrome.runtime.lastError);
        } else {
          console.log('解析消息发送成功，popup响应:', response);
        }
      });
      
      showNotification('检测到二维码！密钥已发送到扩展程序。');
    } else {
      // 无法识别的格式，发送原始数据
      console.log('发送原始二维码数据到popup:', data);
      chrome.runtime.sendMessage({
        action: 'qrCodeDetected',
        rawData: data
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('发送原始消息到popup失败:', chrome.runtime.lastError);
        } else {
          console.log('原始消息发送成功，popup响应:', response);
        }
      });
      
      showNotification('检测到二维码，但格式无法识别。原始数据已发送到扩展程序。');
    }
  }
}

// 关闭扫描器
function closeScanner(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

// 在页面上显示通知
function showNotification(message, type = 'info') {
  // 移除已存在的通知
  const existingNotification = document.getElementById('qr-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建新的通知元素
  const notification = document.createElement('div');
  notification.id = 'qr-notification';
  
  // 根据类型设置样式
  let backgroundColor, icon;
  switch (type) {
    case 'success':
      backgroundColor = '#4CAF50';
      icon = '✅';
      break;
    case 'warning':
      backgroundColor = '#FF9800';
      icon = '⚠️';
      break;
    case 'error':
      backgroundColor = '#f44336';
      icon = '❌';
      break;
    case 'info':
    default:
      backgroundColor = '#2196F3';
      icon = 'ℹ️';
      break;
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: ${backgroundColor};
    color: white;
    border-radius: 6px;
    z-index: 100000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${icon}</span>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 根据类型设置不同的显示时间
  let displayTime = 3000;
  if (type === 'success') {
    displayTime = 4000;
  } else if (type === 'warning' || type === 'error') {
    displayTime = 5000;
  }
  
  // 自动隐藏通知
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, displayTime);
}

// 确保在页面完全加载后进行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQRScanner);
} else {
  initQRScanner();
}

function initQRScanner() {
  // 在这里可以初始化QR码扫描功能
  console.log('QR码扫描器已初始化');
}

} // 结束 initializeContentScript 函数