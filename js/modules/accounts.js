// accounts.js - 账户管理模块

// 全局变量
let accountOrder = [];
let draggedItem = null;

/**
 * 加载账户排序
 */
async function initAccountOrder() {
  accountOrder = await loadAccountOrder();
}

/**
 * 显示账户列表
 */
async function displayAccounts() {
  try {
    console.log('[Accounts] 开始加载账户列表');
    
    const accounts = await loadAccounts();
    const usageStats = await loadUsageStats();
    const accountInfo = await loadAccountInfo();
    
    const container = document.getElementById('accounts-container');
    const emptyState = document.getElementById('empty-state');
    const accountsCount = document.getElementById('accounts-count');
    
    if (!container || !emptyState || !accountsCount) {
      console.error('[Accounts] 找不到必要的DOM元素');
      return;
    }
    
    // 更新账户数量
    const accountEntries = Object.entries(accounts);
    accountsCount.textContent = `${accountEntries.length} 个账户`;
    
    // 显示/隐藏空状态
    if (accountEntries.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }
    
    emptyState.style.display = 'none';
    
    // 排序账户
    const sortedAccounts = sortAccounts(accountEntries, usageStats);
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染账户卡片
    for (const [name, secret] of sortedAccounts) {
      try {
        const info = accountInfo[name] || {};
        const card = await createAccountCard(name, secret, info, usageStats[name]);
        container.appendChild(card);
      } catch (cardError) {
        console.error(`[Accounts] 渲染账户卡片失败 ${name}:`, cardError);
      }
    }
    
    // 初始化拖拽
    initializeDragAndDrop();
    
    console.log('[Accounts] 账户列表加载完成');
    
  } catch (error) {
    console.error('[Accounts] 显示账户列表失败:', error);
    showToast('加载账户失败', 'error');
  }
}

/**
 * 创建账户卡片
 */
async function createAccountCard(name, secret, info, usageStats) {
  const issuer = info.issuer || '';
  const displayName = info.displayName || name;
  const icon = getServiceIcon(issuer, name);
  const token = await generateTOTP(secret);
  const remaining = calculateRemainingTime();
  
  const card = document.createElement('div');
  card.className = 'account-item';
  card.setAttribute('data-name', name);
  card.draggable = true;
  
  card.innerHTML = `
    <div class="drag-handle">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="account-content">
      <div class="account-top">
        <div class="account-info">
          <div class="account-name" title="${displayName}">${escapeHtml(displayName)}</div>
          ${issuer ? `<div class="account-issuer">${escapeHtml(issuer)}</div>` : ''}
        </div>
      </div>
      <div class="account-bottom">
        <div class="account-token-wrapper">
          <div class="account-token" data-name="${escapeHtml(name)}" title="点击复制">
            ${formatToken(token)}
          </div>
        </div>
        <div class="account-actions">
          <div class="countdown-wrapper">
            <svg class="countdown-circle" viewBox="0 0 36 36">
              <circle class="countdown-bg" cx="18" cy="18" r="16"></circle>
              <circle class="countdown-progress" cx="18" cy="18" r="16" 
                      style="stroke-dashoffset: ${((30 - remaining) / 30) * 100}"></circle>
            </svg>
            <div class="countdown-text">${remaining}</div>
          </div>
          <div class="account-menu">
            <button class="menu-btn" data-name="${escapeHtml(name)}">⋯</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 绑定事件
  bindCardEvents(card, name);
  
  return card;
}

/**
 * 绑定卡片事件
 */
function bindCardEvents(card, name) {
  // 点击复制验证码
  const tokenElement = card.querySelector('.account-token');
  tokenElement.addEventListener('click', async () => {
    const token = tokenElement.textContent.replace(/\s/g, '');
    await copyToClipboard(token);
    tokenElement.classList.add('copied');
    setTimeout(() => tokenElement.classList.remove('copied'), 600);
    await recordAccountUsage(name);
  });
  
  // 菜单按钮
  const menuBtn = card.querySelector('.menu-btn');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(name, card);
  });
  
  // 拖拽事件
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  card.addEventListener('dragover', handleDragOver);
  card.addEventListener('drop', handleDrop);
  card.addEventListener('dragenter', handleDragEnter);
  card.addEventListener('dragleave', handleDragLeave);
}

/**
 * 排序账户
 */
function sortAccounts(accountEntries, usageStats) {
  // 如果存在自定义排序，优先使用
  if (accountOrder.length > 0) {
    const orderMap = new Map(accountOrder.map((name, index) => [name, index]));
    
    return accountEntries.sort(([nameA], [nameB]) => {
      const orderA = orderMap.get(nameA);
      const orderB = orderMap.get(nameB);
      
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      
      return sortByUsage(nameA, nameB, usageStats);
    });
  }
  
  // 没有自定义排序，按使用频率
  return accountEntries.sort(([nameA], [nameB]) => {
    return sortByUsage(nameA, nameB, usageStats);
  });
}

/**
 * 按使用频率排序
 */
function sortByUsage(nameA, nameB, usageStats) {
  const statsA = usageStats[nameA] || { count: 0, lastUsed: 0 };
  const statsB = usageStats[nameB] || { count: 0, lastUsed: 0 };
  
  if (statsA.count !== statsB.count) {
    return statsB.count - statsA.count;
  }
  
  return statsB.lastUsed - statsA.lastUsed;
}

/**
 * 初始化拖拽功能
 */
function initializeDragAndDrop() {
  const container = document.getElementById('accounts-container');
  if (container) {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  }
}

// 拖拽事件处理
function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.getAttribute('data-name'));
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedItem = null;
  
  document.querySelectorAll('.account-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  
  saveCurrentOrder();
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this !== draggedItem) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  
  if (draggedItem && this !== draggedItem) {
    const container = document.getElementById('accounts-container');
    const allItems = [...container.querySelectorAll('.account-item')];
    const draggedIndex = allItems.indexOf(draggedItem);
    const droppedIndex = allItems.indexOf(this);
    
    if (draggedIndex < droppedIndex) {
      this.after(draggedItem);
    } else {
      this.before(draggedItem);
    }
  }
}

/**
 * 保存当前排序
 */
function saveCurrentOrder() {
  const container = document.getElementById('accounts-container');
  if (!container) return;
  
  const items = container.querySelectorAll('.account-item');
  accountOrder = Array.from(items).map(item => item.getAttribute('data-name'));
  saveAccountOrder(accountOrder);
  
  const sortIndicator = document.getElementById('sort-indicator');
  if (sortIndicator) {
    sortIndicator.textContent = '自定义排序';
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    accountOrder,
    initAccountOrder,
    displayAccounts,
    createAccountCard,
    bindCardEvents,
    sortAccounts,
    saveCurrentOrder
  };
}
