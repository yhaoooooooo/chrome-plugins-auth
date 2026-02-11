// filter.js - 筛选搜索模块

/**
 * 根据当前域名自动筛选
 */
async function autoFilterByCurrentDomain() {
  try {
    console.log('[Filter] 开始自动筛选...');
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs[0] || !tabs[0].url) {
      console.log('[Filter] 无法获取当前标签页URL');
      return;
    }
    
    const url = new URL(tabs[0].url);
    const domain = url.hostname.replace(/^www\./, '');
    
    console.log('[Filter] 当前域名:', domain);
    
    // 生成关键词
    const keywords = generateDomainKeywords(domain);
    console.log('[Filter] 关键词:', keywords);
    
    // 加载账户
    const accounts = await loadAccounts();
    const accountInfo = await loadAccountInfo();
    
    const matches = [];
    
    for (const [name, secret] of Object.entries(accounts)) {
      const info = accountInfo[name] || {};
      const searchStr = (name + ' ' + (info.displayName || '') + ' ' + (info.issuer || '')).toLowerCase();
      
      for (const keyword of keywords) {
        if (searchStr.includes(keyword)) {
          matches.push(name);
          console.log(`[Filter] 匹配: ${name} (关键词: ${keyword})`);
          break;
        }
      }
    }
    
    console.log(`[Filter] 找到 ${matches.length} 个匹配`);
    
    if (matches.length > 0) {
      showAutoFilterIndicator(domain, matches.length);
      highlightMatchedAccounts(matches);
    } else {
      console.log('[Filter] 无匹配，显示全部');
    }
    
  } catch (error) {
    console.error('[Filter] 自动筛选错误:', error);
  }
}

/**
 * 生成域名关键词
 */
function generateDomainKeywords(domain) {
  const keywords = [];
  const parts = domain.toLowerCase().split('.');
  
  // 添加完整域名
  keywords.push(domain.toLowerCase());
  
  // 添加各部分（过滤掉TLD）
  parts.forEach(part => {
    if (part.length >= 4 && part !== 'com' && part !== 'cn' && part !== 'www') {
      keywords.push(part);
      // 添加无短横线版本
      const noDash = part.replace(/-/g, '');
      if (noDash !== part) keywords.push(noDash);
    }
  });
  
  return [...new Set(keywords)]; // 去重
}

/**
 * 增强筛选功能
 */
function enhancedFilterAccounts(filterText) {
  const items = document.querySelectorAll('.account-item');
  const filterLower = filterText.toLowerCase().trim();
  let visibleCount = 0;
  
  // 清空筛选时恢复默认显示
  if (!filterLower) {
    items.forEach(item => {
      item.classList.remove('hidden', 'matched');
      item.style.opacity = '1';
    });
    
    const countElement = document.getElementById('accounts-count');
    if (countElement) {
      countElement.textContent = `${items.length} 个账户`;
    }
    
    hideAutoFilterIndicator();
    return;
  }
  
  items.forEach(item => {
    const name = item.getAttribute('data-name').toLowerCase();
    const issuer = item.querySelector('.account-issuer')?.textContent.toLowerCase() || '';
    const searchStr = name + ' ' + issuer;
    
    const isMatch = searchStr.includes(filterLower);
    
    if (isMatch) {
      item.classList.remove('hidden');
      item.classList.add('matched');
      visibleCount++;
    } else {
      item.classList.add('hidden');
      item.classList.remove('matched');
    }
  });
  
  // 更新计数
  const countElement = document.getElementById('accounts-count');
  if (countElement) {
    countElement.textContent = `${visibleCount} / ${items.length} 个匹配`;
  }
}

/**
 * 显示自动筛选指示器
 */
function showAutoFilterIndicator(domain, count) {
  const indicator = document.getElementById('auto-filter-indicator');
  const domainSpan = document.getElementById('filter-domain');
  
  if (indicator && domainSpan) {
    domainSpan.textContent = `${domain} · ${count} 个匹配`;
    indicator.style.display = 'inline-flex';
  }
}

/**
 * 隐藏自动筛选指示器
 */
function hideAutoFilterIndicator() {
  const indicator = document.getElementById('auto-filter-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * 高亮显示匹配的账户
 */
function highlightMatchedAccounts(matchedNames) {
  const items = document.querySelectorAll('.account-item');
  const matchedSet = new Set(matchedNames);
  
  items.forEach(item => {
    const name = item.getAttribute('data-name');
    
    if (matchedSet.has(name)) {
      item.classList.remove('hidden');
      item.classList.add('matched');
      item.style.opacity = '1';
    } else {
      item.classList.add('hidden');
      item.classList.remove('matched');
    }
  });
  
  const countElement = document.getElementById('accounts-count');
  if (countElement) {
    countElement.textContent = `${matchedNames.length} / ${items.length} 个匹配`;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    autoFilterByCurrentDomain,
    generateDomainKeywords,
    enhancedFilterAccounts,
    showAutoFilterIndicator,
    hideAutoFilterIndicator,
    highlightMatchedAccounts
  };
}
