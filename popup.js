// popup.js - Google Authenticator 扩展弹出窗口逻辑

// 引入Google身份验证器类
let authenticator;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM已加载');
  
  // 确保authenticator已初始化
  if (typeof GoogleAuthenticator !== 'undefined') {
    authenticator = new GoogleAuthenticator();
    console.log('GoogleAuthenticator已初始化');
  } else {
    console.error('GoogleAuthenticator库未加载');
  }
  
  // 测试表单元素
  const secretField = document.getElementById('secret-key');
  const nameField = document.getElementById('account-name');
  const addBtn = document.getElementById('add-btn');
  const scanBtn = document.getElementById('scan-btn');
  
  console.log('表单元素检查:');
  console.log('- secret-key:', secretField);
  console.log('- account-name:', nameField);
  console.log('- add-btn:', addBtn);
  console.log('- scan-btn:', scanBtn);
  
  // 检查是否有二维码数据
  checkForQRData();
  
  // 加载已保存的账户
  displayAccounts();
  
  // 根据当前域名自动筛选
  autoFilterByCurrentDomain();
  
  // 添加测试按钮（仅在开发模式下显示）
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    addTestButton();
  }
  
  // 定期更新所有令牌
  setInterval(async function() {
    updateTokensOnly();
  }, 10000); // 每10秒更新一次账户列表中的令牌
  
  // 添加账户按钮事件监听器
  const addAccountBtn = document.getElementById('add-account-btn');
  const addAccountPanel = document.getElementById('add-account-panel');
  const closePanelBtn = document.getElementById('close-panel');
  
  if (addAccountBtn && addAccountPanel) {
    addAccountBtn.addEventListener('click', function() {
      addAccountPanel.style.display = 'block';
      addAccountBtn.style.display = 'none';
    });
  }
  
  if (closePanelBtn && addAccountPanel) {
    closePanelBtn.addEventListener('click', function() {
      addAccountPanel.style.display = 'none';
      addAccountBtn.style.display = 'block';
      
      // 清空表单
      const secretField = document.getElementById('secret-key');
      const nameField = document.getElementById('account-name');
      if (secretField) secretField.value = '';
      if (nameField) nameField.value = '';
    });
  }
  
  // 导入导出按钮事件监听器
  const exportBtn = document.getElementById('export-btn');
  const importBtnHeader = document.getElementById('import-btn-header');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      exportAccountsData();
    });
  }
  
  if (importBtnHeader) {
    importBtnHeader.addEventListener('click', function() {
      importAccountsData();
    });
  }
  
  // 备份功能按钮事件监听器
  const exportQrBtn = document.getElementById('export-qr-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  
  if (exportQrBtn) {
    exportQrBtn.addEventListener('click', function() {
      exportAsQRCode();
    });
  }
  
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      clearAllAccounts();
    });
  }
});

// 检查是否有二维码数据
function checkForQRData() {
  console.log('=== 开始检查二维码数据 ===');
  console.log('发送getQRData消息到background script...');
  
  chrome.runtime.sendMessage({action: 'getQRData'}, function(response) {
    console.log('=== 二维码数据检查结果 ===');
    console.log('chrome.runtime.lastError:', chrome.runtime.lastError);
    console.log('响应内容:', response);
    
    if (chrome.runtime.lastError) {
      console.error('❌ 获取二维码数据失败:', chrome.runtime.lastError);
      return;
    }
    
    if (response.success && response.hasData) {
      console.log('✅ 发现二维码数据:', response.data);
      console.log('✅ 开始填充表单');
      fillFormWithQRData(response.data);
    } else {
      console.log('ℹ️ 没有二维码数据');
      console.log('响应详情:', response);
    }
    console.log('=== 二维码数据检查完成 ===');
  });
}

// 用二维码数据填充表单
function fillFormWithQRData(data) {
  console.log('填充表单数据:', data);
  console.log('表单元素检查:');
  console.log('- secret-key元素:', document.getElementById('secret-key'));
  console.log('- account-name元素:', document.getElementById('account-name'));
  
  if (data.migrationData && data.migrationData.length > 0) {
    // 处理迁移数据
    console.log('处理迁移数据，包含', data.migrationData.length, '个账户');
    
    // 填充第一个账户
    const firstAccount = data.migrationData[0];
    console.log('第一个账户数据:', firstAccount);
    
    if (firstAccount.secret) {
      const secretField = document.getElementById('secret-key');
      const nameField = document.getElementById('account-name');
      
      if (secretField) {
        secretField.value = firstAccount.secret;
        console.log('密钥已填充:', firstAccount.secret);
      } else {
        console.error('找不到secret-key元素');
      }
      
      if (nameField) {
        if (firstAccount.issuer) {
          nameField.value = firstAccount.issuer;
        } else if (firstAccount.name) {
          nameField.value = firstAccount.name;
        }
        console.log('账户名称已填充:', nameField.value);
      } else {
        console.error('找不到account-name元素');
      }
      
      // 显示成功消息
      alert(`检测到Google Authenticator迁移数据！包含${data.migrationData.length}个账户，已填充第一个账户：${firstAccount.name || firstAccount.issuer || 'Unknown'}`);
      
      // 清除background中的二维码数据
      chrome.runtime.sendMessage({action: 'clearQRData'}, function(response) {
        console.log('清除二维码数据响应:', response);
      });
    } else {
      console.error('迁移数据中没有找到密钥');
      alert('迁移数据解析失败，无法提取密钥。');
    }
  } else if (data.secret) {
    // 处理单个账户数据
    console.log('处理单个账户数据:', data);
    
    const secretField = document.getElementById('secret-key');
    const nameField = document.getElementById('account-name');
    
    if (secretField) {
      secretField.value = data.secret;
      console.log('密钥已填充:', data.secret);
    }
    
    if (nameField) {
      if (data.issuer) {
        nameField.value = data.issuer;
      } else if (data.label) {
        nameField.value = data.label;
      }
      console.log('账户名称已填充:', nameField.value);
    }
    
    // 显示成功消息
    alert('检测到二维码数据！密钥已自动填充。');
    
    // 清除background中的二维码数据
    chrome.runtime.sendMessage({action: 'clearQRData'}, function(response) {
      console.log('清除二维码数据响应:', response);
    });
  } else if (data.rawData) {
    // 尝试解析rawData
    console.log('处理原始数据:', data.rawData);
    
    const otpauthRegex = /otpauth:\/\/totp\/[^?]+\?secret=([^&]+)/i;
    const match = data.rawData.match(otpauthRegex);
    if (match && match[1]) {
      const secretField = document.getElementById('secret-key');
      if (secretField) {
        secretField.value = match[1];
        console.log('从原始数据提取密钥:', match[1]);
      }
      alert('检测到二维码数据！密钥已自动填充。');
      
      // 清除background中的二维码数据
      chrome.runtime.sendMessage({action: 'clearQRData'}, function(response) {
        console.log('清除二维码数据响应:', response);
      });
    } else {
      console.error('无法从原始数据中提取密钥');
      alert('检测到二维码数据，但格式无法识别。请手动处理。');
    }
  } else {
    console.error('未检测到有效的二维码数据');
    alert('未检测到有效的二维码数据。');
  }
}

// 生成TOTP (Time-based One-time Password)
async function generateTOTP(secret, period = 30) {
  if (!authenticator) {
    console.error('Authenticator未初始化');
    return '--:--:--';
  }
  return await authenticator.generateTOTP(secret, period);
}

// 保存账户到存储
function saveAccount(accountName, secret, issuer = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accounts', 'accountInfo'], function(result) {
      const accounts = result.accounts || {};
      const accountInfo = result.accountInfo || {};
      
      accounts[accountName] = secret;
      if (issuer) {
        accountInfo[accountName] = { issuer: issuer };
      }
      
      const dataToSave = { accounts: accounts };
      if (issuer) {
        dataToSave.accountInfo = accountInfo;
      }
      
      chrome.storage.local.set(dataToSave, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

// 从存储中加载账户列表
function loadAccounts() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accounts'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.accounts || {});
      }
    });
  });
}

// 从存储中加载账户信息
function loadAccountInfo() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accountInfo'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.accountInfo || {});
      }
    });
  });
}

// 从存储中加载使用频率数据
function loadUsageStats() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['usageStats'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.usageStats || {});
      }
    });
  });
}

// 保存使用频率数据
function saveUsageStats(usageStats) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ usageStats: usageStats }, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// 记录账户使用频率
async function recordUsage(accountName) {
  try {
    const usageStats = await loadUsageStats();
    
    if (!usageStats[accountName]) {
      usageStats[accountName] = {
        count: 0,
        lastUsed: 0
      };
    }
    
    usageStats[accountName].count += 1;
    usageStats[accountName].lastUsed = Date.now();
    
    await saveUsageStats(usageStats);
    console.log(`记录账户 ${accountName} 使用次数: ${usageStats[accountName].count}`);
  } catch (error) {
    console.error('记录使用频率失败:', error);
  }
}

// 解析账户名中的issuer和name
function parseAccountInfo(accountName, storedIssuer = null) {
  // 移除索引后缀
  const cleanName = accountName.replace(/_\d+$/, '');
  
  // 如果存储中有issuer信息，优先使用
  if (storedIssuer) {
    // 检查name中是否还包含issuer信息，如果有则只保留name部分
    let displayName = cleanName;
    if (cleanName.includes(':') && cleanName.split(':').length === 2) {
      const parts = cleanName.split(':');
      const namePart = parts[1];
      displayName = namePart;
    }
    
    return {
      issuer: storedIssuer,
      name: displayName,
      displayName: `${storedIssuer}(${displayName})`
    };
  }
  
  // 尝试解析不同格式的账户名
  const patterns = [
    // 格式: issuer(name) 或 issuer:name
    /^([^(]+)\(([^)]+)\)$/,  // issuer(name)
    /^([^:]+):(.+)$/,        // issuer:name
    // 格式: user@domain.com
    /^([^@]+)@(.+)$/,        // user@domain
    // 格式: domain.com(user)
    /^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\(([^)]+)\)$/,  // domain.com(user)
  ];
  
  for (const pattern of patterns) {
    const match = cleanName.match(pattern);
    if (match) {
      if (pattern.source.includes('@')) {
        // 邮箱格式: user@domain.com -> domain.com(user)
        return {
          issuer: match[2], // domain.com
          name: match[1],   // user
          displayName: `${match[2]}(${match[1]})`
        };
      } else if (pattern.source.includes('\\(')) {
        // 括号格式: issuer(name) 或 domain.com(user)
        return {
          issuer: match[1],
          name: match[2],
          displayName: cleanName
        };
      } else {
        // 冒号格式: issuer:name
        return {
          issuer: match[1],
          name: match[2],
          displayName: `${match[1]}(${match[2]})`
        };
      }
    }
  }
  
  // 如果没有匹配到任何格式，直接返回原始名称
  return {
    issuer: null,
    name: cleanName,
    displayName: cleanName
  };
}

// 只更新令牌，不重新渲染整个列表
async function updateTokensOnly() {
  try {
    const accounts = await loadAccounts();
    const container = document.getElementById('accounts-container');
    
    // 检查是否有账户元素存在，如果没有则进行完整渲染
    const existingAccounts = container.querySelectorAll('.account-item');
    if (existingAccounts.length === 0) {
      console.log('没有找到现有账户元素，进行完整渲染');
      await displayAccounts();
      return;
    }
    
    // 只更新现有账户的令牌
    for (const [name, secret] of Object.entries(accounts)) {
      const tokenElement = document.getElementById(`token-${name}`);
      if (tokenElement) {
        try {
          const token = await generateTOTP(secret);
          tokenElement.textContent = token;
        } catch (error) {
          console.error(`更新账户 ${name} 的令牌时出错:`, error);
          tokenElement.textContent = '错误';
        }
      }
    }
  } catch (error) {
    console.error('更新令牌时出错:', error);
    // 如果出错，回退到完整渲染
    await displayAccounts();
  }
}

// 显示账户列表
async function displayAccounts() {
  const accounts = await loadAccounts();
  const usageStats = await loadUsageStats();
  const accountInfo = await loadAccountInfo();
  const container = document.getElementById('accounts-container');
  
  // 保存当前滚动位置
  const scrollTop = container.scrollTop;
  const scrollLeft = container.scrollLeft;
  
  container.innerHTML = '';
  
  // 按使用频率排序账户
  const sortedAccounts = Object.entries(accounts).sort(([nameA], [nameB]) => {
    const statsA = usageStats[nameA] || { count: 0, lastUsed: 0 };
    const statsB = usageStats[nameB] || { count: 0, lastUsed: 0 };
    
    // 首先按使用次数排序，然后按最后使用时间排序
    if (statsA.count !== statsB.count) {
      return statsB.count - statsA.count;
    }
    return statsB.lastUsed - statsA.lastUsed;
  });
  
  for (const [name, secret] of sortedAccounts) {
    // 解析账户信息，优先使用存储的issuer
    const storedIssuer = accountInfo[name]?.issuer;
    const parsedInfo = parseAccountInfo(name, storedIssuer);
    
    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-item';
    accountDiv.innerHTML = `
      <div class="account-display">
        <div class="account-content">
          <div class="account-name-container">
            <div class="account-name" title="${name}">${parsedInfo.displayName}</div>
            ${usageStats[name] && usageStats[name].count > 0 ? `<div class="usage-count" title="使用次数">${usageStats[name].count}</div>` : ''}
          </div>
          <div class="account-token" id="token-${name}" data-name="${name}" title="点击复制验证码">--:--:--</div>
        </div>
        <div class="account-right">
          <div class="countdown-circle" id="timer-${name}">
            <svg class="circle-svg" viewBox="0 0 36 36">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              <path class="circle-progress" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            </svg>
            <div class="circle-text" id="timer-text-${name}">30</div>
          </div>
          <div class="account-menu">
            <button class="menu-btn" data-name="${name}">⋯</button>
            <div class="menu-dropdown" style="display: none;">
              <button class="menu-item delete-btn" data-name="${name}">删除账户</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(accountDiv);
    
    // 生成并显示当前令牌
    try {
      const token = await generateTOTP(secret);
      document.getElementById(`token-${name}`).textContent = token;
      
      // 启动倒计时
      startCountdown(name);
    } catch (error) {
      console.error(`生成账户 ${name} 的令牌时出错:`, error);
      document.getElementById(`token-${name}`).textContent = '错误';
      const textElement = document.getElementById(`timer-text-${name}`);
      if (textElement) {
        textElement.textContent = '--';
      }
    }
  }
  
  // 添加菜单按钮事件监听器
  document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const accountName = this.getAttribute('data-name');
      toggleMenu(accountName);
    });
  });
  
  // 添加删除按钮事件监听器
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const accountName = this.getAttribute('data-name');
      deleteAccount(accountName);
    });
  });
  
  // 添加验证码点击复制事件监听器
  document.querySelectorAll('.account-token').forEach(tokenElement => {
    tokenElement.addEventListener('click', function() {
      const token = this.textContent.trim();
      const accountName = this.getAttribute('data-name');
      
      if (token && token !== '--:--:--' && token !== '错误') {
        copyToClipboard(token);
        
        // 记录使用频率
        if (accountName) {
          recordUsage(accountName);
        }
      }
    });
  });
  
  // 添加筛选功能事件监听器
  const filterInput = document.getElementById('filter-input');
  const clearFilterBtn = document.getElementById('clear-filter');
  
  if (filterInput) {
    filterInput.addEventListener('input', function() {
      // 使用增强的筛选功能
      enhancedFilterAccounts(this.value);
    });
  }
  
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener('click', function() {
      filterInput.value = '';
      filterInput.placeholder = '筛选域名或账户名...';
      enhancedFilterAccounts('');
      
      // 移除自动筛选指示器
      const indicator = document.getElementById('auto-filter-indicator');
      if (indicator) {
        indicator.remove();
      }
    });
  }
  
  // 点击其他地方关闭菜单
  document.addEventListener('click', function() {
    closeAllMenus();
  });
  
  // 恢复滚动位置
  container.scrollTop = scrollTop;
  container.scrollLeft = scrollLeft;
}

// 切换菜单显示/隐藏
function toggleMenu(accountName) {
  const menu = document.querySelector(`.menu-btn[data-name="${accountName}"]`).parentElement.querySelector('.menu-dropdown');
  const isVisible = menu.style.display !== 'none';
  
  // 先关闭所有菜单
  closeAllMenus();
  
  // 如果当前菜单是隐藏的，则显示它
  if (!isVisible) {
    menu.style.display = 'block';
  }
}

// 关闭所有菜单
function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    menu.style.display = 'none';
  });
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    // 使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showCopyFeedback('验证码已复制到剪贴板');
    } else {
      // 备用方法：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showCopyFeedback('验证码已复制到剪贴板');
      } else {
        showCopyFeedback('复制失败，请手动复制', 'error');
      }
    }
  } catch (error) {
    console.error('复制失败:', error);
    showCopyFeedback('复制失败，请手动复制', 'error');
  }
}

// 显示复制反馈
function showCopyFeedback(message, type = 'success') {
  // 创建或更新反馈元素
  let feedback = document.getElementById('copy-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'copy-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(feedback);
  }
  
  // 设置样式和内容
  if (type === 'success') {
    feedback.style.backgroundColor = '#4CAF50';
    feedback.style.color = 'white';
  } else {
    feedback.style.backgroundColor = '#f44336';
    feedback.style.color = 'white';
  }
  
  feedback.textContent = message;
  feedback.style.display = 'block';
  feedback.style.opacity = '1';
  
  // 3秒后隐藏
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 300);
  }, 2000);
}

// 筛选账户
function filterAccounts(filterText) {
  const accountItems = document.querySelectorAll('.account-item');
  const noResultsDiv = document.getElementById('no-results');
  let visibleCount = 0;
  
  if (!filterText || filterText.trim() === '') {
    // 显示所有账户
    accountItems.forEach(item => {
      item.classList.remove('hidden');
      visibleCount++;
    });
  } else {
    // 筛选账户
    const filterLower = filterText.toLowerCase().trim();
    
    accountItems.forEach(item => {
      const accountName = item.querySelector('.account-name').textContent.toLowerCase();
      const accountToken = item.querySelector('.account-token').textContent.toLowerCase();
      
      // 检查是否匹配账户名、域名或验证码
      const isMatch = accountName.includes(filterLower) || 
                     accountToken.includes(filterLower) ||
                     extractDomain(accountName).includes(filterLower);
      
      if (isMatch) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });
  }
  
  // 显示或隐藏"无结果"提示
  if (visibleCount === 0 && filterText.trim() !== '') {
    noResultsDiv.style.display = 'block';
  } else {
    noResultsDiv.style.display = 'none';
  }
}

// 增强的筛选功能
async function enhancedFilterAccounts(filterText) {
  const accountItems = document.querySelectorAll('.account-item');
  const noResultsDiv = document.getElementById('no-results');
  let visibleCount = 0;
  
  if (!filterText || filterText.trim() === '') {
    // 显示所有账户
    accountItems.forEach(item => {
      item.classList.remove('hidden');
      visibleCount++;
    });
  } else {
    // 使用增强的匹配算法
    let matches = [];
    
    // 如果filterText看起来像URL，使用findMatchingAccounts
    if (filterText.includes('://') || filterText.includes('.')) {
      try {
        // 构造一个完整的URL用于匹配
        const testUrl = filterText.startsWith('http') ? filterText : `https://${filterText}`;
        matches = await findMatchingAccounts(testUrl);
      } catch (error) {
        console.error('URL匹配失败，使用文本匹配:', error);
        matches = [];
      }
    }
    
    // 如果没有URL匹配结果，使用文本匹配
    if (matches.length === 0) {
      matches = await findMatchingAccountsByText(filterText);
    }
    
    const matchNames = new Set(matches.map(match => match.name));
    
    console.log('筛选文本:', filterText);
    console.log('匹配结果:', matches);
    console.log('匹配的账户名:', Array.from(matchNames));
    
    accountItems.forEach(item => {
      const accountName = item.querySelector('.account-name').textContent;
      const accountKey = item.querySelector('.account-token').getAttribute('data-name');
      
      // 检查是否在匹配列表中
      const isMatch = matchNames.has(accountKey) || 
                     accountName.toLowerCase().includes(filterText.toLowerCase());
      
      if (isMatch) {
        item.classList.remove('hidden');
        visibleCount++;
        
        // 如果是高匹配度，添加高亮效果
        const match = matches.find(m => m.name === accountKey);
        if (match && match.score >= 60) {
          item.style.borderLeft = '3px solid #4CAF50';
          item.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
        } else {
          item.style.borderLeft = '';
          item.style.backgroundColor = '';
        }
      } else {
        item.classList.add('hidden');
        item.style.borderLeft = '';
        item.style.backgroundColor = '';
      }
    });
  }
  
  // 显示或隐藏"无结果"提示
  if (visibleCount === 0 && filterText.trim() !== '') {
    noResultsDiv.style.display = 'block';
  } else {
    noResultsDiv.style.display = 'none';
  }
  
  console.log(`筛选完成: 显示 ${visibleCount} 个账户`);
  
  // 强制刷新显示
  if (visibleCount > 0) {
    // 确保所有匹配的账户都可见
    accountItems.forEach(item => {
      const accountKey = item.querySelector('.account-token').getAttribute('data-name');
      const accountName = item.querySelector('.account-name').textContent;
      
      // 检查是否应该显示
      const shouldShow = matchNames.has(accountKey) || 
                        accountName.toLowerCase().includes(filterText.toLowerCase());
      
      if (shouldShow) {
        item.style.display = 'block';
        item.classList.remove('hidden');
      } else {
        item.style.display = 'none';
        item.classList.add('hidden');
      }
    });
  }
  
  // 调试信息
  setTimeout(() => {
    debugAccountDisplay();
  }, 200);
}

// 从账户名中提取域名
function extractDomain(accountName) {
  // 尝试从账户名中提取域名
  // 支持格式: "example.com(user)", "example.com:user", "user@example.com"
  
  // 邮箱格式: user@example.com
  const emailMatch = accountName.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase();
  }
  
  // 括号格式: example.com(user)
  const bracketMatch = accountName.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\(/);
  if (bracketMatch) {
    return bracketMatch[1].toLowerCase();
  }
  
  // 冒号格式: example.com:user
  const colonMatch = accountName.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}):/);
  if (colonMatch) {
    return colonMatch[1].toLowerCase();
  }
  
  // 直接域名格式: example.com
  const directMatch = accountName.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
  if (directMatch) {
    return directMatch[1].toLowerCase();
  }
  
  // 如果没有找到域名，返回原始名称的小写版本
  return accountName.toLowerCase();
}

// 根据当前域名自动筛选
async function autoFilterByCurrentDomain() {
  try {
    console.log('=== 开始自动域名筛选 ===');
    
    // 获取当前活动标签页
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0] || !tabs[0].url) {
      console.log('无法获取当前标签页或URL');
      return;
    }
    
    const currentUrl = tabs[0].url;
    console.log('当前页面URL:', currentUrl);
    
    // 提取域名
    const domain = extractDomainFromUrl(currentUrl);
    if (!domain) {
      console.log('无法提取域名');
      return;
    }
    
    console.log('提取的域名:', domain);
    
    // 使用增强的匹配算法查找相关账户
    const matches = await findMatchingAccounts(currentUrl);
    console.log('找到匹配的账户数量:', matches.length);
    console.log('匹配详情:', matches);
    
    if (matches.length > 0) {
      // 显示匹配结果
      displayMatchingResults(domain, matches);
      
      // 自动填充筛选框并执行筛选
      const filterInput = document.getElementById('filter-input');
      if (filterInput) {
        filterInput.value = domain;
        filterInput.placeholder = `已自动筛选: ${domain} (${matches.length}个匹配)`;
        
        // 等待一下确保DOM更新完成
        setTimeout(async () => {
          await enhancedFilterAccounts(domain);
        }, 100);
        
        // 添加自动筛选指示器
        addAutoFilterIndicator(domain, matches.length);
      }
      
      console.log('✅ 自动筛选完成，找到', matches.length, '个匹配账户');
    } else {
      // 没有找到匹配的账户，显示所有账户
      console.log('❌ 没有找到匹配的账户，显示所有账户');
      showAllAccountsIndicator();
    }
    
    console.log('=== 自动域名筛选完成 ===');
  } catch (error) {
    console.error('❌ 自动筛选失败:', error);
  }
}

// 从URL中提取域名
function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // 移除www前缀
    if (hostname.startsWith('www.')) {
      return hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    console.error('解析URL失败:', error);
    return null;
  }
}

// 增强的域名提取函数，支持更多格式
function extractEnhancedDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // 移除www前缀
    let domain = hostname;
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    // 提取主域名（去掉子域名）
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // 保留最后两个部分作为主域名
      const mainDomain = parts.slice(-2).join('.');
      return {
        full: domain,
        main: mainDomain,
        parts: parts
      };
    }
    
    return {
      full: domain,
      main: domain,
      parts: parts
    };
  } catch (error) {
    console.error('解析URL失败:', error);
    return null;
  }
}

// 检查是否有匹配的账户
async function checkForMatchingAccounts(domain) {
  try {
    const accounts = await loadAccounts();
    const domainLower = domain.toLowerCase();
    
    for (const [name, secret] of Object.entries(accounts)) {
      const accountDomain = extractDomain(name);
      if (accountDomain.includes(domainLower) || domainLower.includes(accountDomain)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('检查匹配账户失败:', error);
    return false;
  }
}

// 增强的账户匹配算法
async function findMatchingAccounts(domain) {
  try {
    const accounts = await loadAccounts();
    const domainInfo = extractEnhancedDomain(domain);
    
    if (!domainInfo) {
      return [];
    }
    
    const matches = [];
    const domainLower = domainInfo.full.toLowerCase();
    const mainDomainLower = domainInfo.main.toLowerCase();
    
    for (const [name, secret] of Object.entries(accounts)) {
      const accountDomain = extractDomain(name);
      const accountDomainLower = accountDomain.toLowerCase();
      
      // 计算匹配分数
      const score = calculateMatchScore(domainInfo, accountDomainLower, name);
      
      if (score > 0) {
        matches.push({
          name: name,
          secret: secret,
          domain: accountDomain,
          score: score,
          matchType: getMatchType(domainInfo, accountDomainLower, score)
        });
      }
    }
    
    // 按分数排序
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('查找匹配账户失败:', error);
    return [];
  }
}

// 计算匹配分数
function calculateMatchScore(domainInfo, accountDomain, accountName) {
  let score = 0;
  const domainLower = domainInfo.full.toLowerCase();
  const mainDomainLower = domainInfo.main.toLowerCase();
  const accountLower = accountName.toLowerCase();
  
  // 完全匹配
  if (accountDomain === domainLower) {
    score += 100;
  }
  // 主域名匹配
  else if (accountDomain === mainDomainLower) {
    score += 80;
  }
  // 包含匹配
  else if (accountDomain.includes(domainLower) || domainLower.includes(accountDomain)) {
    score += 60;
  }
  // 部分匹配
  else if (accountDomain.includes(mainDomainLower) || mainDomainLower.includes(accountDomain)) {
    score += 40;
  }
  
  // 账户名中包含域名关键词
  const domainKeywords = extractKeywords(domainInfo.full);
  for (const keyword of domainKeywords) {
    if (accountLower.includes(keyword.toLowerCase())) {
      score += 20;
    }
  }
  
  // 检查常见的服务名映射
  const serviceMapping = getServiceMapping(domainInfo.full);
  for (const service of serviceMapping) {
    if (accountLower.includes(service.toLowerCase())) {
      score += 30;
    }
  }
  
  return score;
}

// 提取域名关键词
function extractKeywords(domain) {
  const keywords = [];
  const parts = domain.split('.');
  
  // 添加域名各部分
  parts.forEach(part => {
    if (part.length > 2) {
      keywords.push(part);
    }
  });
  
  // 添加常见服务名
  const commonServices = ['github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'jenkins', 'sonar', 'jump', 'platform'];
  commonServices.forEach(service => {
    if (domain.includes(service)) {
      keywords.push(service);
    }
  });
  
  return keywords;
}

// 获取服务映射
function getServiceMapping(domain) {
  const mappings = {
    'github.com': ['github', 'git'],
    'gitlab.com': ['gitlab', 'git'],
    'bitbucket.org': ['bitbucket', 'git'],
    'atlassian.net': ['jira', 'confluence', 'atlassian'],
    'sonarqube.org': ['sonar', 'sonarqube'],
    'jumpserver.org': ['jump', 'jumpserver'],
    'jfrog.io': ['jfrog', 'artifactory'],
    'docker.io': ['docker', 'registry'],
    'kubernetes.io': ['k8s', 'kubernetes'],
    'jenkins.io': ['jenkins', 'ci']
  };
  
  const domainLower = domain.toLowerCase();
  for (const [key, services] of Object.entries(mappings)) {
    if (domainLower.includes(key) || key.includes(domainLower)) {
      return services;
    }
  }
  
  return [];
}

// 获取匹配类型
function getMatchType(domainInfo, accountDomain, score) {
  if (score >= 100) return 'exact';
  if (score >= 80) return 'main-domain';
  if (score >= 60) return 'contains';
  if (score >= 40) return 'partial';
  if (score >= 20) return 'keyword';
  return 'fuzzy';
}

// 基于文本的账户匹配
async function findMatchingAccountsByText(filterText) {
  try {
    const accounts = await loadAccounts();
    const filterLower = filterText.toLowerCase().trim();
    const matches = [];
    
    for (const [name, secret] of Object.entries(accounts)) {
      const accountDomain = extractDomain(name);
      const accountLower = name.toLowerCase();
      const domainLower = accountDomain.toLowerCase();
      
      let score = 0;
      
      // 完全匹配
      if (accountLower === filterLower) {
        score += 100;
      }
      // 域名完全匹配
      else if (domainLower === filterLower) {
        score += 90;
      }
      // 包含匹配
      else if (accountLower.includes(filterLower) || filterLower.includes(accountLower)) {
        score += 70;
      }
      // 域名包含匹配
      else if (domainLower.includes(filterLower) || filterLower.includes(domainLower)) {
        score += 60;
      }
      // 关键词匹配
      else if (accountLower.includes(filterLower) || domainLower.includes(filterLower)) {
        score += 40;
      }
      
      if (score > 0) {
        matches.push({
          name: name,
          secret: secret,
          domain: accountDomain,
          score: score,
          matchType: getMatchTypeByScore(score)
        });
      }
    }
    
    // 按分数排序
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('文本匹配失败:', error);
    return [];
  }
}

// 根据分数获取匹配类型
function getMatchTypeByScore(score) {
  if (score >= 100) return 'exact';
  if (score >= 90) return 'domain-exact';
  if (score >= 70) return 'contains';
  if (score >= 60) return 'domain-contains';
  if (score >= 40) return 'keyword';
  return 'fuzzy';
}

// 显示匹配结果
function displayMatchingResults(domain, matches) {
  console.log(`为域名 ${domain} 找到 ${matches.length} 个匹配账户:`, matches);
  
  // 在控制台显示详细信息
  matches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.name} (${match.matchType}, 分数: ${match.score})`);
  });
}

// 调试函数：检查账户显示状态
function debugAccountDisplay() {
  const accountItems = document.querySelectorAll('.account-item');
  console.log('=== 账户显示状态调试 ===');
  console.log(`总账户数量: ${accountItems.length}`);
  
  let visibleCount = 0;
  let hiddenCount = 0;
  
  accountItems.forEach((item, index) => {
    const isHidden = item.classList.contains('hidden') || item.style.display === 'none';
    const accountName = item.querySelector('.account-name')?.textContent || 'Unknown';
    const accountKey = item.querySelector('.account-token')?.getAttribute('data-name') || 'Unknown';
    
    if (isHidden) {
      hiddenCount++;
      console.log(`${index + 1}. [隐藏] ${accountName} (${accountKey})`);
    } else {
      visibleCount++;
      console.log(`${index + 1}. [显示] ${accountName} (${accountKey})`);
    }
  });
  
  console.log(`可见账户: ${visibleCount}, 隐藏账户: ${hiddenCount}`);
  console.log('=== 调试完成 ===');
}

// 添加自动筛选指示器
function addAutoFilterIndicator(domain, matchCount = 0) {
  const filterContainer = document.querySelector('.filter-container');
  if (!filterContainer) return;
  
  // 移除已存在的指示器
  const existingIndicator = document.getElementById('auto-filter-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // 创建指示器
  const indicator = document.createElement('div');
  indicator.id = 'auto-filter-indicator';
  indicator.style.cssText = `
    font-size: 10px;
    color: #4CAF50;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    background-color: rgba(76, 175, 80, 0.1);
    transition: all 0.2s ease;
  `;
  
  const matchText = matchCount > 0 ? ` (${matchCount}个匹配)` : '';
  indicator.innerHTML = `
    <span>🔍</span>
    <span>自动筛选: ${domain}${matchText}</span>
  `;
  
  // 添加点击事件，显示匹配详情
  indicator.addEventListener('click', function() {
    showMatchDetails(domain, matchCount);
  });
  
  // 添加悬停效果
  indicator.addEventListener('mouseenter', function() {
    this.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
  });
  
  indicator.addEventListener('mouseleave', function() {
    this.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
  });
  
  filterContainer.appendChild(indicator);
  
  // 10秒后自动移除指示器
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 10000);
}

// 显示所有账户指示器
function showAllAccountsIndicator() {
  const filterContainer = document.querySelector('.filter-container');
  if (!filterContainer) return;
  
  // 移除已存在的指示器
  const existingIndicator = document.getElementById('auto-filter-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // 创建指示器
  const indicator = document.createElement('div');
  indicator.id = 'auto-filter-indicator';
  indicator.style.cssText = `
    font-size: 10px;
    color: #FF9800;
    margin-left: 5px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px;
    border-radius: 3px;
    background-color: rgba(255, 152, 0, 0.1);
  `;
  indicator.innerHTML = `
    <span>📋</span>
    <span>未找到匹配，显示所有账户</span>
  `;
  
  filterContainer.appendChild(indicator);
  
  // 5秒后自动移除指示器
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 5000);
}

// 显示匹配详情
function showMatchDetails(domain, matchCount) {
  // 创建详情弹窗
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;
  
  content.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333;">匹配结果</h3>
    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
      为域名 <strong>${domain}</strong> 找到 <strong>${matchCount}</strong> 个相关账户
    </p>
    <div id="match-details-list" style="margin-bottom: 15px;"></div>
    <button id="close-match-details" style="
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">关闭</button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // 添加关闭事件
  document.getElementById('close-match-details').addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  // 点击背景关闭
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 添加测试按钮
function addTestButton() {
  const header = document.querySelector('.header');
  if (!header) return;
  
  const testBtn = document.createElement('button');
  testBtn.textContent = '🧪 测试筛选';
  testBtn.style.cssText = `
    background-color: #FF9800;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 8px;
  `;
  
  testBtn.addEventListener('click', async function() {
    const testUrls = [
      'https://github.com/user/repo',
      'https://gitlab.com/user/repo',
      'https://jira.company.com',
      'https://sonar.company.com',
      'https://jumpserver.company.com',
      'https://example.com'
    ];
    
    const randomUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
    console.log('🧪 测试URL:', randomUrl);
    
    // 模拟当前URL
    const originalQuery = chrome.tabs.query;
    chrome.tabs.query = function(queryInfo, callback) {
      callback([{ url: randomUrl }]);
    };
    
    try {
      await autoFilterByCurrentDomain();
    } finally {
      // 恢复原始函数
      chrome.tabs.query = originalQuery;
    }
  });
  
  header.appendChild(testBtn);
}

// 全局倒计时存储
const countdownTimers = {};

// 启动倒计时
function startCountdown(accountName) {
  // 清除已存在的倒计时
  if (countdownTimers[accountName]) {
    clearInterval(countdownTimers[accountName]);
  }
  
  // 计算当前时间窗口的剩余时间
  const now = Math.floor(Date.now() / 1000);
  const timeWindow = 30; // TOTP时间窗口为30秒
  const remainingSeconds = timeWindow - (now % timeWindow);
  
  // 更新倒计时显示
  updateCountdownDisplay(accountName, remainingSeconds);
  
  // 启动倒计时
  countdownTimers[accountName] = setInterval(() => {
    const currentNow = Math.floor(Date.now() / 1000);
    const currentRemaining = timeWindow - (currentNow % timeWindow);
    
    if (currentRemaining <= 0) {
      // 时间到了，刷新令牌
      refreshToken(accountName);
    } else {
      updateCountdownDisplay(accountName, currentRemaining);
    }
  }, 1000);
}

// 更新倒计时显示
function updateCountdownDisplay(accountName, seconds) {
  const timerElement = document.getElementById(`timer-${accountName}`);
  const textElement = document.getElementById(`timer-text-${accountName}`);
  const progressElement = timerElement?.querySelector('.circle-progress');
  
  if (!timerElement || !textElement || !progressElement) return;
  
  // 更新文字显示
  textElement.textContent = seconds;
  
  // 计算圆圈进度 (0-100)
  const progress = (seconds / 30) * 100;
  const offset = 100 - progress;
  
  // 更新圆圈进度
  progressElement.style.strokeDashoffset = offset;
  
  // 根据剩余时间设置样式
  progressElement.classList.remove('warning', 'critical');
  textElement.classList.remove('warning', 'critical');
  
  if (seconds <= 5) {
    progressElement.classList.add('critical');
    textElement.classList.add('critical');
  } else if (seconds <= 10) {
    progressElement.classList.add('warning');
    textElement.classList.add('warning');
  }
}

// 刷新令牌
async function refreshToken(accountName) {
  try {
    // 获取账户密钥
    const accounts = await loadAccounts();
    const secret = accounts[accountName];
    
    if (!secret) {
      console.error(`找不到账户 ${accountName} 的密钥`);
      return;
    }
    
    // 生成新令牌
    const newToken = await generateTOTP(secret);
    const tokenElement = document.getElementById(`token-${accountName}`);
    
    if (tokenElement) {
      tokenElement.textContent = newToken;
    }
    
    // 重新启动倒计时
    startCountdown(accountName);
    
  } catch (error) {
    console.error(`刷新账户 ${accountName} 令牌时出错:`, error);
    const textElement = document.getElementById(`timer-text-${accountName}`);
    if (textElement) {
      textElement.textContent = '错误';
    }
  }
}

// 清除所有倒计时
function clearAllCountdowns() {
  Object.values(countdownTimers).forEach(timer => {
    clearInterval(timer);
  });
  Object.keys(countdownTimers).forEach(key => {
    delete countdownTimers[key];
  });
}

// 删除账户
function deleteAccount(accountName) {
  // 清除该账户的倒计时
  if (countdownTimers[accountName]) {
    clearInterval(countdownTimers[accountName]);
    delete countdownTimers[accountName];
  }
  
  chrome.storage.local.get(['accounts'], function(result) {
    const accounts = result.accounts || {};
    delete accounts[accountName];
    
    chrome.storage.local.set({ accounts: accounts }, function() {
      // 删除账户时需要完整重新渲染，因为列表结构发生了变化
      displayAccounts();
    });
  });
}

// 显示QR码
function displayQRCode(secret, accountName) {
  const issuer = 'Google Authenticator Extension';
  const uri = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
  
  const qrContainer = document.getElementById('qr-display');
  qrContainer.innerHTML = '';
  
  // 创建QR码
  const canvas = document.createElement('canvas');
  qrContainer.appendChild(canvas);
  
  // 使用qrcode库生成二维码
  if (typeof QRCode !== 'undefined') {
    new QRCode(canvas, {
      text: uri,
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

// 添加新账户
document.getElementById('add-btn').addEventListener('click', async function() {
  console.log('添加账户按钮被点击');
  
  const secretField = document.getElementById('secret-key');
  const nameField = document.getElementById('account-name');
  
  console.log('表单字段检查:');
  console.log('- secret-key元素:', secretField);
  console.log('- account-name元素:', nameField);
  
  if (!secretField || !nameField) {
    console.error('找不到表单字段');
    alert('表单字段未找到，请刷新页面重试');
    return;
  }
  
  const secret = secretField.value.trim();
  const accountName = nameField.value.trim();
  
  console.log('表单数据:');
  console.log('- 密钥:', secret);
  console.log('- 账户名称:', accountName);
  
  if (!secret || !accountName) {
    alert('请输入密钥和账户名称');
    return;
  }
  
  try {
    // 验证密钥格式
    const testToken = await generateTOTP(secret);
    
    // 保存账户
    await saveAccount(accountName, secret);
    
    // 更新界面
    document.getElementById('display-secret').textContent = secret;
    document.getElementById('token-container').style.display = 'block';
    
    // 显示当前令牌
    const tokenElement = document.getElementById('current-token');
    tokenElement.textContent = testToken;
    
    // 显示QR码
    displayQRCode(secret, accountName);
    
    // 重置输入框并关闭面板
    document.getElementById('secret-key').value = '';
    document.getElementById('account-name').value = '';
    
    // 关闭添加面板
    const addAccountPanel = document.getElementById('add-account-panel');
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountPanel) addAccountPanel.style.display = 'none';
    if (addAccountBtn) addAccountBtn.style.display = 'block';
    
    // 更新账户列表（添加账户后需要完整重新渲染）
    displayAccounts();
    
    // 设置定时更新令牌 (每30秒更新一次)
    setInterval(async () => {
      try {
        const newToken = await generateTOTP(secret);
        tokenElement.textContent = newToken;
      } catch (error) {
        console.error('更新令牌时出错:', error);
        tokenElement.textContent = '错误';
      }
    }, 30000); // 每30秒更新一次
    
  } catch (error) {
    alert('密钥格式无效，请检查后重试: ' + error.message);
  }
});

// 扫描页面二维码按钮
document.getElementById('scan-btn').addEventListener('click', async function() {
  try {
    // 获取当前活动标签页
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0]) {
      showCopyFeedback('无法获取当前标签页信息', 'error');
      return;
    }
    
    const tab = tabs[0];
    
    // 检查URL是否支持注入脚本
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
      showCopyFeedback('无法在此页面使用二维码扫描功能', 'error');
      return;
    }
    
    // 显示扫描开始提示
    showCopyFeedback('正在启动二维码扫描...', 'info');
    
    try {
      // 先检查是否已经注入过脚本
      const checkResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            alreadyLoaded: !!window.googleAuthenticatorContentScriptLoaded,
            jsQRAvailable: typeof jsQR !== 'undefined'
          };
        }
      });
      
      const isAlreadyLoaded = checkResult[0]?.result?.alreadyLoaded;
      const isJsQRAvailable = checkResult[0]?.result?.jsQRAvailable;
      
      console.log('脚本状态检查:', { isAlreadyLoaded, isJsQRAvailable });
      
      if (!isAlreadyLoaded) {
        // 动态注入content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/jsQR.js', 'content.js']
        });
        
        // 等待一下确保脚本加载完成
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (!isJsQRAvailable) {
        // 如果content script已加载但jsQR库未加载，只注入jsQR库
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/jsQR.js']
        });
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // 向内容脚本发送消息
      chrome.tabs.sendMessage(tab.id, {action: 'scanQR'}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('发送消息失败:', chrome.runtime.lastError);
          showCopyFeedback('无法与页面通信，请刷新页面后重试', 'error');
        } else {
          console.log('消息发送成功:', response);
          showCopyFeedback('二维码扫描已启动，请查看页面', 'success');
        }
      });
      
    } catch (injectionError) {
      console.error('注入脚本失败:', injectionError);
      console.log('尝试使用备用扫描方法...');
      
      // 备用方法：直接在当前页面中扫描
      try {
        // 先注入jsQR库
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/jsQR.js']
        });
        
        // 等待库加载
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 再注入扫描函数
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scanQRCodeDirectly
        });
      } catch (fallbackError) {
        console.error('备用扫描方法也失败:', fallbackError);
        showCopyFeedback('无法注入扫描脚本，请确保页面已完全加载', 'error');
      }
    }
    
  } catch (error) {
    console.error('扫描二维码时出错:', error);
    showCopyFeedback('扫描二维码时出错: ' + error.message, 'error');
  }
});

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Popup收到消息:', request);
  
  if (request.action === 'qrDataUpdated') {
    // 当background script通知有新的二维码数据时
    console.log('收到二维码数据更新通知:', request.data);
    fillFormWithQRData(request.data);
    sendResponse({success: true});
  }
  
  if (request.action === 'accountsUpdated') {
    // 当账户列表更新时，刷新显示
    console.log('收到账户更新通知，刷新账户列表');
    displayAccounts();
    sendResponse({success: true});
  }
  
  if (request.action === 'tokensUpdated') {
    // 当只需要更新令牌时
    console.log('收到令牌更新通知');
    updateTokensOnly();
    sendResponse({success: true});
  }
  
  return true; // 保持消息通道开放
});

// 备用扫描函数 - 直接在页面中执行
function scanQRCodeDirectly() {
  console.log('使用备用扫描方法...');
  
  // 查找页面上的所有图片
  const images = document.querySelectorAll('img');
  console.log('找到', images.length, '个图片元素');
  
  // 创建一个简单的通知
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background-color: #4CAF50;
    color: white;
    border-radius: 4px;
    z-index: 100000;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  notification.textContent = '正在扫描页面中的二维码...';
  document.body.appendChild(notification);
  
  // 扫描图片中的二维码
  let foundQR = false;
  let processedCount = 0;
  
  function processImage(img) {
    return new Promise((resolve) => {
      if (!img.complete || img.naturalWidth === 0) {
        resolve(null);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = Math.min(img.naturalWidth, 800);
      canvas.height = Math.min(img.naturalHeight, 600);
      
      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const x = (canvas.width - img.naturalWidth * scale) / 2;
      const y = (canvas.height - img.naturalHeight * scale) / 2;
      
      ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // 简单的二维码检测（这里需要jsQR库）
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          console.log('检测到二维码:', code.data);
          foundQR = true;
          
          // 显示结果
          notification.style.backgroundColor = '#2196F3';
          notification.textContent = '检测到二维码！请查看扩展程序。';
          
          // 发送消息到扩展程序
          chrome.runtime.sendMessage({
            action: 'qrCodeDetected',
            rawData: code.data
          });
          
          resolve(code.data);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }
  
  // 处理所有图片
  Promise.all(Array.from(images).map(processImage)).then(() => {
    setTimeout(() => {
      if (!foundQR) {
        notification.style.backgroundColor = '#f44336';
        notification.textContent = '未找到二维码';
      }
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }, 1000);
  });
}

// 导入二维码按钮
document.getElementById('import-btn').addEventListener('click', function() {
  console.log('=== 导入二维码按钮点击 ===');
  document.getElementById('qr-file-input').click();
});

// 文件输入处理
document.getElementById('qr-file-input').addEventListener('change', function(event) {
  console.log('=== 文件选择事件 ===');
  const file = event.target.files[0];
  
  if (!file) {
    console.log('未选择文件');
    return;
  }
  
  console.log('选择的文件:', file.name, file.type, file.size);
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件！');
    return;
  }
  
  // 检查文件大小（限制为5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片文件太大，请选择小于5MB的文件！');
    return;
  }
  
  // 读取文件并扫描二维码
  const reader = new FileReader();
  reader.onload = function(e) {
    console.log('文件读取完成，开始扫描二维码');
    scanQRFromImage(e.target.result);
  };
  
  reader.onerror = function() {
    console.error('文件读取失败');
    alert('文件读取失败，请重试！');
  };
  
  reader.readAsDataURL(file);
});

// 从图片扫描二维码
function scanQRFromImage(imageDataUrl) {
  console.log('=== 开始从图片扫描二维码 ===');
  
  try {
    // 创建图片元素
    const img = new Image();
    img.onload = function() {
      console.log('图片加载完成，尺寸:', img.width, 'x', img.height);
      
      // 创建canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置canvas尺寸
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制图片到canvas
      ctx.drawImage(img, 0, 0);
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log('图像数据获取完成，像素数:', imageData.data.length);
      
      // 动态加载jsQR库
      loadJSQR().then(() => {
        console.log('jsQR库加载完成，开始扫描');
        
        // 使用jsQR扫描二维码
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log('✅ 扫描到二维码:', code.data);
          processImportedQRCode(code.data);
        } else {
          console.log('❌ 未扫描到二维码');
          alert('未在图片中检测到二维码，请确保图片包含清晰的二维码！');
        }
      }).catch(error => {
        console.error('jsQR库加载失败:', error);
        alert('二维码扫描库加载失败: ' + error.message);
      });
    };
    
    img.onerror = function() {
      console.error('图片加载失败');
      alert('图片加载失败，请检查文件格式！');
    };
    
    img.src = imageDataUrl;
    
  } catch (error) {
    console.error('扫描图片二维码时出错:', error);
    alert('扫描图片二维码时出错: ' + error.message);
  }
}

// 处理导入的二维码数据
function processImportedQRCode(qrData) {
  console.log('=== 处理导入的二维码数据 ===');
  console.log('二维码数据:', qrData);
  
  // 检查是否为Google Authenticator迁移格式
  if (qrData.startsWith('otpauth-migration://offline')) {
    console.log('检测到Google Authenticator迁移格式');
    
    try {
      // 解析迁移数据
      const migrationData = parseMigrationData(qrData);
      if (migrationData && migrationData.length > 0) {
        console.log('解析到迁移数据:', migrationData);
        
        // 发送到background script
        const messageData = {
          action: 'qrCodeDetected',
          secret: migrationData[0].secret,
          issuer: migrationData[0].issuer,
          label: migrationData[0].name,
          migrationData: migrationData,
          fullData: qrData
        };
        
        chrome.runtime.sendMessage(messageData, function(response) {
          console.log('导入二维码消息发送响应:', response);
          if (chrome.runtime.lastError) {
            console.error('发送导入二维码消息失败:', chrome.runtime.lastError);
            alert('导入二维码失败: ' + chrome.runtime.lastError.message);
          } else {
            if (response.addedCount) {
              alert(`✅ 成功导入 ${response.addedCount} 个账户！`);
              // 刷新账户列表
              displayAccounts();
            } else {
              alert('✅ 二维码导入成功！');
            }
          }
        });
      } else {
        console.error('迁移数据解析失败');
        alert('二维码数据解析失败，请检查二维码格式！');
      }
    } catch (error) {
      console.error('解析迁移数据失败:', error);
      alert('二维码数据解析失败: ' + error.message);
    }
  } else if (qrData.startsWith('otpauth://')) {
    console.log('检测到单个账户otpauth格式');
    
    // 解析单个账户
    const url = new URL(qrData);
    const secret = url.searchParams.get('secret');
    const issuer = url.searchParams.get('issuer');
    const label = url.pathname.split('/').pop();
    
    if (secret) {
      const messageData = {
        action: 'qrCodeDetected',
        secret: secret,
        issuer: issuer || 'Unknown',
        label: label || 'Imported Account',
        fullData: qrData
      };
      
      chrome.runtime.sendMessage(messageData, function(response) {
        console.log('导入单个账户响应:', response);
        if (chrome.runtime.lastError) {
          console.error('发送单个账户消息失败:', chrome.runtime.lastError);
          alert('导入账户失败: ' + chrome.runtime.lastError.message);
        } else {
          alert('✅ 账户导入成功！');
          // 刷新账户列表
          displayAccounts();
        }
      });
    } else {
      alert('二维码格式不正确，无法提取密钥！');
    }
  } else {
    console.log('未知的二维码格式:', qrData);
    alert('不支持的二维码格式，请使用Google Authenticator生成的二维码！');
  }
}

// 动态加载jsQR库
function loadJSQR() {
  return new Promise((resolve, reject) => {
    if (typeof jsQR !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'js/jsQR.js';
    script.onload = () => {
      console.log('jsQR库动态加载完成');
      resolve();
    };
    script.onerror = () => {
      console.error('jsQR库动态加载失败');
      reject(new Error('jsQR库加载失败'));
    };
    document.head.appendChild(script);
  });
}

// ==================== 导入导出功能 ====================

// 导出所有账户数据为JSON格式
async function exportAccountsData() {
  try {
    console.log('开始导出账户数据...');
    
    // 获取所有账户数据
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    const usageStats = await loadUsageStats();
    
    // 构建导出数据
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      accounts: {},
      accountInfo: accountInfo,
      usageStats: usageStats,
      totalAccounts: Object.keys(accounts).length
    };
    
    // 处理账户数据（不包含敏感密钥）
    for (const [name, secret] of Object.entries(accounts)) {
      exportData.accounts[name] = {
        name: name,
        secret: secret, // 注意：这里包含敏感信息
        issuer: accountInfo[name]?.issuer || null,
        usageCount: usageStats[name]?.count || 0,
        lastUsed: usageStats[name]?.lastUsed || null
      };
    }
    
    // 创建下载链接
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `google-authenticator-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadLink.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // 清理URL对象
    URL.revokeObjectURL(url);
    
    console.log('账户数据导出成功');
    showCopyFeedback('账户数据已导出到文件', 'success');
    
  } catch (error) {
    console.error('导出账户数据失败:', error);
    showCopyFeedback('导出失败: ' + error.message, 'error');
  }
}

// 导入账户数据
async function importAccountsData() {
  try {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    // 添加文件选择事件监听器
    fileInput.addEventListener('change', async function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        console.log('开始导入账户数据...');
        
        // 读取文件内容
        const fileContent = await readFileAsText(file);
        const importData = JSON.parse(fileContent);
        
        // 验证数据格式
        if (!validateImportData(importData)) {
          throw new Error('无效的导入文件格式');
        }
        
        // 导入账户数据
        const result = await processImportData(importData);
        
        // 显示结果
        if (result.success) {
          showCopyFeedback(`成功导入 ${result.importedCount} 个账户`, 'success');
          // 刷新账户列表
          displayAccounts();
        } else {
          showCopyFeedback('导入失败: ' + result.error, 'error');
        }
        
      } catch (error) {
        console.error('导入账户数据失败:', error);
        showCopyFeedback('导入失败: ' + error.message, 'error');
      } finally {
        // 清理文件输入元素
        document.body.removeChild(fileInput);
      }
    });
    
    // 添加到页面并触发文件选择
    document.body.appendChild(fileInput);
    fileInput.click();
    
  } catch (error) {
    console.error('导入功能初始化失败:', error);
    showCopyFeedback('导入功能初始化失败: ' + error.message, 'error');
  }
}

// 读取文件为文本
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

// 验证导入数据格式
function validateImportData(data) {
  try {
    // 检查基本结构
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // 检查版本信息
    if (!data.version) {
      console.warn('导入文件缺少版本信息');
    }
    
    // 检查账户数据
    if (!data.accounts || typeof data.accounts !== 'object') {
      return false;
    }
    
    // 验证每个账户的数据结构
    for (const [name, account] of Object.entries(data.accounts)) {
      if (!account || typeof account !== 'object') {
        return false;
      }
      
      if (!account.name || !account.secret) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('验证导入数据失败:', error);
    return false;
  }
}

// 处理导入数据
async function processImportData(importData) {
  try {
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // 获取现有账户数据
    const existingAccounts = await loadAccounts();
    const existingAccountInfo = await loadAccountInfo();
    const existingUsageStats = await loadUsageStats();
    
    // 处理每个账户
    for (const [name, account] of Object.entries(importData.accounts)) {
      try {
        // 检查账户是否已存在
        if (existingAccounts[name]) {
          console.log(`账户 ${name} 已存在，跳过导入`);
          skippedCount++;
          continue;
        }
        
        // 验证密钥格式
        if (!account.secret || typeof account.secret !== 'string') {
          throw new Error(`账户 ${name} 的密钥格式无效`);
        }
        
        // 添加账户
        existingAccounts[name] = account.secret;
        
        // 添加账户信息
        if (account.issuer) {
          if (!existingAccountInfo[name]) {
            existingAccountInfo[name] = {};
          }
          existingAccountInfo[name].issuer = account.issuer;
        }
        
        // 添加使用统计
        if (account.usageCount || account.lastUsed) {
          existingUsageStats[name] = {
            count: account.usageCount || 0,
            lastUsed: account.lastUsed || 0
          };
        }
        
        importedCount++;
        console.log(`成功导入账户: ${name}`);
        
      } catch (error) {
        console.error(`导入账户 ${name} 失败:`, error);
        errors.push(`${name}: ${error.message}`);
      }
    }
    
    // 保存更新后的数据
    if (importedCount > 0) {
      await chrome.storage.local.set({
        accounts: existingAccounts,
        accountInfo: existingAccountInfo,
        usageStats: existingUsageStats
      });
    }
    
    return {
      success: true,
      importedCount: importedCount,
      skippedCount: skippedCount,
      errors: errors
    };
    
  } catch (error) {
    console.error('处理导入数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 导出为二维码格式（生成迁移二维码）
async function exportAsQRCode() {
  try {
    console.log('开始生成迁移二维码...');
    
    // 获取所有账户数据
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    
    if (Object.keys(accounts).length === 0) {
      showCopyFeedback('没有账户可以导出', 'error');
      return;
    }
    
    // 构建迁移数据
    const migrationData = [];
    for (const [name, secret] of Object.entries(accounts)) {
      const issuer = accountInfo[name]?.issuer || 'Unknown';
      migrationData.push({
        name: name,
        secret: secret,
        issuer: issuer
      });
    }
    
    // 生成迁移URL（简化版本，实际应该使用protobuf编码）
    const migrationUrl = generateMigrationURL(migrationData);
    
    // 生成二维码
    if (typeof QRCode !== 'undefined') {
      // 创建二维码显示区域
      const qrContainer = document.createElement('div');
      qrContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
      `;
      
      qrContainer.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">账户迁移二维码</h3>
        <div id="migration-qr-code"></div>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
          包含 ${migrationData.length} 个账户
        </p>
        <button id="close-qr-modal" style="
          margin-top: 15px;
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">关闭</button>
      `;
      
      document.body.appendChild(qrContainer);
      
      // 生成二维码
      new QRCode(document.getElementById('migration-qr-code'), {
        text: migrationUrl,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
      });
      
      // 添加关闭按钮事件
      document.getElementById('close-qr-modal').addEventListener('click', function() {
        document.body.removeChild(qrContainer);
      });
      
      // 点击背景关闭
      qrContainer.addEventListener('click', function(e) {
        if (e.target === qrContainer) {
          document.body.removeChild(qrContainer);
        }
      });
      
    } else {
      showCopyFeedback('二维码生成库未加载', 'error');
    }
    
  } catch (error) {
    console.error('生成迁移二维码失败:', error);
    showCopyFeedback('生成二维码失败: ' + error.message, 'error');
  }
}

// 生成迁移URL（简化版本）
function generateMigrationURL(accounts) {
  // 这里应该使用protobuf编码，但为了简化，我们使用JSON格式
  const data = {
    accounts: accounts.map(account => ({
      name: account.name,
      secret: account.secret,
      issuer: account.issuer
    }))
  };
  
  const encodedData = btoa(JSON.stringify(data));
  return `otpauth-migration://offline?data=${encodedData}`;
}

// 清空所有账户
async function clearAllAccounts() {
  try {
    // 确认对话框
    const confirmed = confirm('⚠️ 警告：此操作将删除所有账户数据，且无法恢复！\n\n确定要继续吗？');
    if (!confirmed) {
      return;
    }
    
    // 二次确认
    const doubleConfirmed = confirm('请再次确认：\n\n这将永久删除所有账户、使用统计和设置信息。\n\n确定要清空所有数据吗？');
    if (!doubleConfirmed) {
      return;
    }
    
    console.log('开始清空所有账户数据...');
    
    // 清除所有倒计时
    clearAllCountdowns();
    
    // 清空存储数据
    await chrome.storage.local.clear();
    
    // 刷新界面
    displayAccounts();
    
    console.log('所有账户数据已清空');
    showCopyFeedback('所有账户数据已清空', 'success');
    
  } catch (error) {
    console.error('清空账户数据失败:', error);
    showCopyFeedback('清空失败: ' + error.message, 'error');
  }
}