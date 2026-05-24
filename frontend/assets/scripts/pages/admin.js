const API_BASE = (() => {
  if (!location.port || location.port === '80' || location.port === '443') return '';
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return location.port === '8080' ? '' : 'http://localhost:8080';
  }
  if (location.hostname.startsWith('10.') || location.hostname.startsWith('192.168.') || location.hostname.startsWith('172.')) {
    return 'http://' + location.hostname + ':8080';
  }
  return '';
})();

const ADMIN_TOKEN_KEY = 'zodiac_admin_token';
let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
let currentPage = 0;
let currentQuery = '';
let totalPages = 0;
let orderPage = 0;
let orderStatus = 'CREATED';
let orderTotalPages = 0;

function $(id) {
  return document.getElementById(id);
}

function setView(loggedIn) {
  $('login-view').classList.toggle('hidden', loggedIn);
  $('dashboard-view').classList.toggle('hidden', !loggedIn);
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken;
  }
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data.message || `请求失败 (${resp.status})`);
    err.status = resp.status;
    throw err;
  }
  return data;
}

function renderMetrics(overview) {
  const cards = [
    {
      title: '生成点击',
      className: 'peach',
      value: overview.generateClick.today,
      total: overview.generateClick.total,
      left: `DeepSeek ${overview.generateClick.deepseekToday} / ${overview.generateClick.deepseekTotal}`,
      right: `深度解析 ${overview.generateClick.claudeToday} / ${overview.generateClick.claudeTotal}`
    },
    {
      title: '生成成功',
      className: 'violet',
      value: overview.generateSuccess.today,
      total: overview.generateSuccess.total,
      left: `DeepSeek ${overview.generateSuccess.deepseekToday} / ${overview.generateSuccess.deepseekTotal}`,
      right: `深度解析 ${overview.generateSuccess.claudeToday} / ${overview.generateSuccess.claudeTotal}`
    },
    {
      title: '支付弹窗打开',
      className: 'gold',
      value: overview.qrModalOpen.today,
      total: overview.qrModalOpen.total,
      left: `今日 ${overview.qrModalOpen.today}`,
      right: `累计 ${overview.qrModalOpen.total}`
    },
    {
      title: '二维码展示',
      className: 'peach',
      value: overview.qrView.today,
      total: overview.qrView.total,
      left: `微信 ${overview.qrView.wechatToday} / ${overview.qrView.wechatTotal}`,
      right: `支付宝 ${overview.qrView.alipayToday} / ${overview.qrView.alipayTotal}`
    },
    {
      title: '二维码切换',
      className: 'violet',
      value: overview.qrSwitch.today,
      total: overview.qrSwitch.total,
      left: `微信 ${overview.qrSwitch.wechatToday} / ${overview.qrSwitch.wechatTotal}`,
      right: `支付宝 ${overview.qrSwitch.alipayToday} / ${overview.qrSwitch.alipayTotal}`
    }
  ];

  $('metric-grid').innerHTML = cards.map(card => `
    <div class="metric-box ${card.className}">
      <div class="metric-label">${card.title}</div>
      <div class="metric-value">${card.value}</div>
      <div class="metric-split">
        <span>${card.left}</span>
        <span>${card.right}</span>
      </div>
      <div class="metric-split" style="margin-top:10px;">
        <span>累计</span>
        <strong>${card.total}</strong>
      </div>
    </div>
  `).join('');
}

function renderTrends(overview) {
  $('trend-body').innerHTML = overview.trends.map(item => `
    <tr>
      <td>${item.date}</td>
      <td>${item.deepseekClicks}</td>
      <td>${item.claudeClicks}</td>
      <td>${item.deepseekSuccess}</td>
      <td>${item.claudeSuccess}</td>
      <td>${item.qrModalOpens}</td>
      <td>${item.wechatViews}</td>
      <td>${item.alipayViews}</td>
    </tr>
  `).join('');
}

function modelPill(model) {
  const text = model === 'claude' ? '深度解析' : 'DeepSeek';
  const className = model === 'claude' ? 'claude' : 'deepseek';
  return `<span class="pill ${className}">${text}</span>`;
}

function renderReports(result) {
  totalPages = result.totalPages;
  $('pager-info').textContent = `第 ${result.page + 1} / ${Math.max(result.totalPages, 1)} 页，共 ${result.totalElements} 条`;

  if (!result.items || result.items.length === 0) {
    $('report-body').innerHTML = '';
    $('report-empty').classList.remove('hidden');
    $('pager-info').textContent = '';
    return;
  }

  $('report-empty').classList.add('hidden');
  $('report-body').innerHTML = result.items.map(item => `
    <tr>
      <td>${item.reportUid || ''}</td>
      <td>${item.userAName || '-'} × ${item.userBName || '-'}</td>
      <td>${modelPill(item.modelCode)}</td>
      <td>${item.score ?? '-'}</td>
      <td>${item.relationshipType || '-'}</td>
      <td>${item.wechatId || '-'}</td>
      <td>${item.createdAt || '-'}</td>
    </tr>
  `).join('');
}

async function loadOverview() {
  const overview = await api('/api/admin/overview');
  renderMetrics(overview);
  renderTrends(overview);
}

async function loadReports() {
  const result = await api(`/api/admin/reports?page=${currentPage}&size=20&query=${encodeURIComponent(currentQuery)}`);
  renderReports(result);
}

// ========== 订单管理 ==========
function statusPill(status) {
  if (status === 'PAID') return '<span class="pill claude">已支付</span>';
  return '<span class="pill deepseek">待确认</span>';
}

function formatFee(fee) {
  if (fee == null) return '—';
  return '¥' + (fee / 100).toFixed(2);
}

function formatTime(t) {
  if (!t) return '—';
  return t.replace('T', ' ').slice(0, 16);
}

function renderOrders(result) {
  orderTotalPages = result.totalPages || 0;
  const info = $('order-pager-info');
  if (info) info.textContent = `第 ${(result.page || 0) + 1} / ${Math.max(orderTotalPages, 1)} 页，共 ${result.totalElements || 0} 条`;

  if (!result.content || result.content.length === 0) {
    $('order-body').innerHTML = '';
    $('order-empty').classList.remove('hidden');
    return;
  }

  $('order-empty').classList.add('hidden');
  $('order-body').innerHTML = result.content.map(item => `
    <tr>
      <td style="font-family:monospace;letter-spacing:1px;">${item.outTradeNo || ''}</td>
      <td>${formatFee(item.totalFee)}</td>
      <td>${statusPill(item.status)}</td>
      <td>${formatTime(item.createdAt)}</td>
      <td>${formatTime(item.paidAt)}</td>
      <td>${item.status === 'CREATED' ? `<button class="btn primary confirm-order-btn" data-order="${item.outTradeNo}">确认已支付</button>` : '—'}</td>
    </tr>
  `).join('');

  // 绑定确认按钮
  document.querySelectorAll('.confirm-order-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const outTradeNo = btn.dataset.order;
      btn.disabled = true;
      btn.textContent = '确认中...';
      try {
        await api(`/api/admin/orders/${outTradeNo}/confirm`, { method: 'POST' });
        btn.textContent = '✅ 已确认';
        btn.closest('tr').style.opacity = '0.5';
        // 延迟刷新
        setTimeout(() => loadOrders(), 800);
      } catch (e) {
        btn.textContent = '确认失败';
        btn.disabled = false;
      }
    });
  });
}

async function loadOrders() {
  const statusParam = orderStatus ? `&status=${orderStatus}` : '';
  const result = await api(`/api/admin/orders?page=${orderPage}&size=20${statusParam}`);
  renderOrders(result);
}

async function loadOrderCount() {
  const data = await api('/api/admin/orders/count');
  // 在待确认 tab 上显示数量
  const createdTab = document.querySelector('.order-tab[data-status="CREATED"]');
  if (createdTab && data.CREATED > 0) {
    createdTab.textContent = `待确认 (${data.CREATED})`;
  }
}

async function login() {
  $('login-error').textContent = '';
  const username = $('admin-username').value.trim();
  const password = $('admin-password').value;
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {}
    });
    adminToken = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
    const expiresAt = data.expiresAt ? data.expiresAt.replace('T', ' ').slice(0, 16) : '—';
    $('login-status').textContent = `登录有效期到 ${expiresAt}`;
    setView(true);
    await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount()]);
  } catch (e) {
    $('login-error').textContent = e.message;
  }
}

function logout() {
  adminToken = '';
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  setView(false);
}

async function boot() {
  if (!adminToken) {
    setView(false);
    return;
  }
  try {
    setView(true);
    await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount()]);
  } catch (e) {
    if (e.status === 401) {
      logout();
      $('login-error').textContent = e.message;
    }
  }
}

$('login-btn').addEventListener('click', login);
$('logout-btn').addEventListener('click', logout);
$('refresh-btn').addEventListener('click', async () => {
  await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount()]);
});
$('search-btn').addEventListener('click', async () => {
  currentPage = 0;
  currentQuery = $('report-query').value.trim();
  await loadReports();
});
$('prev-page').addEventListener('click', async () => {
  if (currentPage <= 0) return;
  currentPage -= 1;
  await loadReports();
});
$('next-page').addEventListener('click', async () => {
  if (currentPage >= totalPages - 1) return;
  currentPage += 1;
  await loadReports();
});
$('report-query').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    currentPage = 0;
    currentQuery = $('report-query').value.trim();
    await loadReports();
  }
});

// 订单 Tab 切换
document.querySelectorAll('.order-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    orderStatus = tab.dataset.status;
    orderPage = 0;
    await loadOrders();
  });
});

// 订单分页
$('order-prev-page')?.addEventListener('click', async () => {
  if (orderPage <= 0) return;
  orderPage -= 1;
  await loadOrders();
});
$('order-next-page')?.addEventListener('click', async () => {
  if (orderPage >= orderTotalPages - 1) return;
  orderPage += 1;
  await loadOrders();
});

boot();

