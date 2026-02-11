// utils.js - 工具函数模块

/**
 * 安全绑定事件 - 仅在元素存在时绑定
 * @param {string|Element} elementOrSelector - 元素或选择器
 * @param {string} event - 事件名称
 * @param {function} handler - 事件处理函数
 */
function safeBind(elementOrSelector, event, handler) {
  const el = (typeof elementOrSelector === 'string') 
    ? document.querySelector(elementOrSelector) 
    : elementOrSelector;
  
  if (el && typeof el.addEventListener === 'function') {
    el.addEventListener(event, handler);
    console.log(`[Utils] Bound ${event} on ${elementOrSelector}`);
    return true;
  } else {
    console.log(`[Utils] Skipped binding for ${elementOrSelector} (not found)`);
    return false;
  }
}

/**
 * 防抖函数
 * @param {function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * HTML转义
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 格式化令牌（分组显示）
 * @param {string} token - 原始令牌
 * @returns {string} 格式化后的令牌
 */
function formatToken(token) {
  if (token.length === 6) {
    return `${token.slice(0, 3)} ${token.slice(3)}`;
  }
  return token;
}

/**
 * 计算剩余时间（TOTP周期内）
 * @returns {number} 剩余秒数
 */
function calculateRemainingTime() {
  const now = Math.floor(Date.now() / 1000);
  return 30 - (now % 30);
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast('验证码已复制', 'success');
      return true;
    } else {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('验证码已复制', 'success');
      return true;
    }
  } catch (error) {
    console.error('[Utils] 复制失败:', error);
    showToast('复制失败，请手动复制', 'error');
    return false;
  }
}

/**
 * 显示Toast通知
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success/error/info)
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('[Utils] Toast容器不存在');
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    toast.style.animation = 'toastSlide 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 获取服务图标
 * @param {string} issuer - 服务商
 * @param {string} name - 账户名称
 * @returns {string} 图标emoji
 */
function getServiceIcon(issuer, name) {
  const serviceIcons = {
    'google': '🔍',
    'gmail': '📧',
    'github': '🐙',
    'microsoft': '🪟',
    'aws': '☁️',
    'amazon': '📦',
    'cloudflare': '🌐',
    'gitlab': '🦊',
    'bitbucket': '🪣',
    'jira': '📋',
    'confluence': '📄',
    'slack': '💬',
    'discord': '🎮',
    'twitter': '🐦',
    'facebook': '👥',
    'instagram': '📷',
    'linkedin': '💼',
    'dropbox': '📦',
    'apple': '🍎',
    'icloud': '☁️',
    'stripe': '💳',
    'paypal': '💰',
    'binance': '📈',
    'coinbase': '₿',
    'notion': '📝',
    'figma': '🎨',
    'vercel': '▲',
    'netlify': '🚀',
    'heroku': '⚡',
    'digitalocean': '🌊',
    'default': '🔐'
  };
  
  const searchStr = (issuer + ' ' + name).toLowerCase();
  
  for (const [key, icon] of Object.entries(serviceIcons)) {
    if (searchStr.includes(key)) {
      return icon;
    }
  }
  
  return serviceIcons.default;
}

// 导出模块（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    safeBind,
    debounce,
    escapeHtml,
    formatToken,
    calculateRemainingTime,
    copyToClipboard,
    showToast,
    getServiceIcon
  };
}
