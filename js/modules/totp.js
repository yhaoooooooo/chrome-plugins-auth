// totp.js - TOTP生成模块

/**
 * 生成TOTP令牌
 * @param {string} secret - 密钥
 * @param {number} period - 周期（秒）
 * @returns {Promise<string>} 令牌
 */
async function generateTOTP(secret, period = 30) {
  if (!authenticator) {
    console.error('[TOTP] Authenticator未初始化');
    return '------';
  }
  
  try {
    return await authenticator.generateTOTP(secret, period);
  } catch (error) {
    console.error('[TOTP] 生成TOTP失败:', error);
    return '------';
  }
}

/**
 * 更新所有倒计时和令牌
 */
async function updateTokensOnly() {
  const accounts = await loadAccounts();
  const items = document.querySelectorAll('.account-item');
  
  items.forEach(async (item) => {
    const name = item.getAttribute('data-name');
    const secret = accounts[name];
    
    if (!secret) return;
    
    // 更新令牌
    const tokenElement = item.querySelector('.account-token');
    if (!tokenElement) return;
    
    const newToken = await generateTOTP(secret);
    const currentToken = tokenElement.textContent.replace(/\s/g, '');
    
    if (currentToken !== newToken) {
      tokenElement.textContent = formatToken(newToken);
      tokenElement.style.animation = 'none';
      tokenElement.offsetHeight; // 触发重排
      tokenElement.style.animation = 'tokenCopied 0.4s ease';
    }
    
    // 更新倒计时
    const remaining = calculateRemainingTime();
    const progressCircle = item.querySelector('.countdown-progress');
    const countdownText = item.querySelector('.countdown-text');
    
    if (progressCircle && countdownText) {
      const offset = ((30 - remaining) / 30) * 100;
      progressCircle.style.strokeDashoffset = offset;
      countdownText.textContent = remaining;
      
      // 更新样式
      progressCircle.classList.remove('warning', 'critical');
      if (remaining <= 5) {
        progressCircle.classList.add('critical');
      } else if (remaining <= 10) {
        progressCircle.classList.add('warning');
      }
    }
  });
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateTOTP,
    updateTokensOnly
  };
}
