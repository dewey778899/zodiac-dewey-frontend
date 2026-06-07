const API_BASE = (() => {
  if (!location.port || location.port === "80" || location.port === "443") return "";
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return location.port === "8080" ? "" : "http://localhost:8080";
  }
  if (location.hostname.startsWith("10.") || location.hostname.startsWith("192.168.") || location.hostname.startsWith("172.")) {
    return `http://${location.hostname}:8080`;
  }
  return "";
})();

const ADMIN_TOKEN_KEY = "zodiac_admin_token";
let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || "";
let currentPage = 0;
let currentQuery = "";
let totalPages = 0;
let orderPage = 0;
let orderStatus = "PAYING";
let orderTotalPages = 0;
let unlockTotalPages = 0;

function $(id) {
  return document.getElementById(id);
}

function setView(loggedIn) {
  $("login-view").classList.toggle("hidden", loggedIn);
  $("dashboard-view").classList.toggle("hidden", !loggedIn);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (adminToken) headers["X-Admin-Token"] = adminToken;
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
      title: "模型点击",
      className: "peach",
      value: overview.generateClick.today,
      total: overview.generateClick.total,
      left: `DeepSeek ${overview.generateClick.deepseekToday} / ${overview.generateClick.deepseekTotal}`,
      right: `深度解析 ${overview.generateClick.claudeToday} / ${overview.generateClick.claudeTotal}`
    },
    {
      title: "生成成功",
      className: "violet",
      value: overview.generateSuccess.today,
      total: overview.generateSuccess.total,
      left: `DeepSeek ${overview.generateSuccess.deepseekToday} / ${overview.generateSuccess.deepseekTotal}`,
      right: `深度解析 ${overview.generateSuccess.claudeToday} / ${overview.generateSuccess.claudeTotal}`
    },
    {
      title: "支付创建",
      className: "gold",
      value: overview.paymentCreate.today,
      total: overview.paymentCreate.total,
      left: `微信 ${overview.paymentCreate.wechatToday} / ${overview.paymentCreate.wechatTotal}`,
      right: `支付宝 ${overview.paymentCreate.alipayToday} / ${overview.paymentCreate.alipayTotal}`
    },
    {
      title: "支付成功",
      className: "peach",
      value: overview.paymentSuccess.today,
      total: overview.paymentSuccess.total,
      left: `微信 ${overview.paymentSuccess.wechatToday} / ${overview.paymentSuccess.wechatTotal}`,
      right: `支付宝 ${overview.paymentSuccess.alipayToday} / ${overview.paymentSuccess.alipayTotal}`
    },
    {
      title: "回调失败",
      className: "violet",
      value: overview.callbackFailure.today,
      total: overview.callbackFailure.total,
      left: `今日 ${overview.callbackFailure.today}`,
      right: `累计 ${overview.callbackFailure.total}`
    },
    {
      title: "支付成功率",
      className: "gold",
      value: `${overview.successRate.todayRate}%`,
      total: `${overview.successRate.totalRate}%`,
      left: `今日 ${overview.successRate.todayPaid}/${overview.successRate.todayCreated}`,
      right: `累计 ${overview.successRate.totalPaid}/${overview.successRate.totalCreated}`
    }
  ];

  $("metric-grid").innerHTML = cards.map((card) => `
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
  `).join("");
}

function renderTrends(overview) {
  $("trend-body").innerHTML = overview.trends.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.deepseekClicks}</td>
      <td>${item.claudeClicks}</td>
      <td>${item.deepseekSuccess}</td>
      <td>${item.claudeSuccess}</td>
      <td>${item.paymentCreated}</td>
      <td>${item.paymentPaid}</td>
      <td>${item.callbackFailure}</td>
    </tr>
  `).join("");
}

function modelPill(model) {
  const text = model === "claude" ? "深度解析" : "DeepSeek";
  const className = model === "claude" ? "claude" : "deepseek";
  return `<span class="pill ${className}">${text}</span>`;
}

function renderReports(result) {
  totalPages = result.totalPages;
  $("pager-info").textContent = `第 ${result.page + 1} / ${Math.max(result.totalPages, 1)} 页，共 ${result.totalElements} 条`;

  if (!result.items || result.items.length === 0) {
    $("report-body").innerHTML = "";
    $("report-empty").classList.remove("hidden");
    $("pager-info").textContent = "";
    return;
  }

  $("report-empty").classList.add("hidden");
  $("report-body").innerHTML = result.items.map((item) => `
    <tr>
      <td>${item.reportUid || ""}</td>
      <td>${item.userAName || "-"} × ${item.userBName || "-"}</td>
      <td>${modelPill(item.modelCode)}</td>
      <td>${item.score ?? "-"}</td>
      <td>${item.relationshipType || "-"}</td>
      <td>${item.wechatId || "-"}</td>
      <td>${item.createdAt || "-"}</td>
    </tr>
  `).join("");
}

async function loadOverview() {
  const overview = await api("/api/admin/overview");
  renderMetrics(overview);
  renderTrends(overview);
}

async function loadReports() {
  const result = await api(`/api/admin/reports?page=${currentPage}&size=20&query=${encodeURIComponent(currentQuery)}`);
  renderReports(result);
}

function statusPill(status) {
  const map = {
    CREATED: ["待创建", "deepseek"],
    PAYING: ["支付中", "gold"],
    PAID: ["已支付", "claude"],
    CLOSED: ["已关闭", "deepseek"],
    FAILED: ["失败", "deepseek"]
  };
  const [text, cls] = map[status] || [status || "—", "deepseek"];
  return `<span class="pill ${cls}">${text}</span>`;
}

function verifyPill(flag) {
  if (flag === true) return '<span class="pill claude">已验签</span>';
  if (flag === false) return '<span class="pill deepseek">失败</span>';
  return '<span class="pill gold">未回调</span>';
}

function tokenPill(flag) {
  return flag ? '<span class="pill gold">已消费</span>' : '<span class="pill claude">可用</span>';
}

function channelText(channel) {
  return channel === "alipay" ? "支付宝" : "微信";
}

function formatFee(fee) {
  if (fee == null) return "—";
  return `¥${(fee / 100).toFixed(2)}`;
}

function formatTime(t) {
  if (!t) return "—";
  return t.replace("T", " ").slice(0, 19);
}

function renderOrders(result) {
  orderTotalPages = result.totalPages || 0;
  $("order-pager-info").textContent = `第 ${(result.page || 0) + 1} / ${Math.max(orderTotalPages, 1)} 页，共 ${result.totalElements || 0} 条`;

  if (!result.content || result.content.length === 0) {
    $("order-body").innerHTML = "";
    $("order-empty").classList.remove("hidden");
    return;
  }

  $("order-empty").classList.add("hidden");
  $("order-body").innerHTML = result.content.map((item) => `
    <tr>
      <td style="font-family:monospace;letter-spacing:1px;">${item.outTradeNo || ""}</td>
      <td>${channelText(item.channel)}</td>
      <td>${item.scene || "—"}</td>
      <td>${formatFee(item.amountFen)}</td>
      <td>${statusPill(item.status)}</td>
      <td>${verifyPill(item.notifyVerified)}</td>
      <td>${tokenPill(item.tokenConsumed)}</td>
      <td>${formatTime(item.createdAt)}</td>
      <td>${formatTime(item.paidAt)}</td>
      <td>
        ${item.status !== "PAID" ? `<button class="btn primary repair-order-btn" data-order="${item.outTradeNo}">补单</button>` : ""}
        ${item.status !== "PAID" && item.status !== "CLOSED" ? `<button class="btn secondary close-order-btn" data-order="${item.outTradeNo}">关闭</button>` : ""}
        <button class="btn secondary log-order-btn" data-order="${item.outTradeNo}">查看日志</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".repair-order-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const outTradeNo = btn.dataset.order;
      btn.disabled = true;
      btn.textContent = "补单中...";
      try {
        await api(`/api/admin/orders/${outTradeNo}/repair-paid`, {
          method: "POST",
          body: JSON.stringify({})
        });
        await Promise.all([loadOrders(), loadOverview(), loadOrderCount()]);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = "补单失败";
      }
    });
  });

  document.querySelectorAll(".close-order-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const outTradeNo = btn.dataset.order;
      btn.disabled = true;
      btn.textContent = "关闭中...";
      try {
        await api(`/api/admin/orders/${outTradeNo}/close`, { method: "POST" });
        await Promise.all([loadOrders(), loadOrderCount()]);
      } catch {
        btn.disabled = false;
        btn.textContent = "关闭失败";
      }
    });
  });

  document.querySelectorAll(".log-order-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const outTradeNo = btn.dataset.order;
      const data = await api(`/api/admin/orders/${outTradeNo}/logs`);
      renderLogs(data.logs || []);
    });
  });
}

function renderLogs(logs) {
  if (!logs.length) {
    $("log-empty").textContent = "该订单暂无回调日志";
    $("log-empty").classList.remove("hidden");
    $("log-table").classList.add("hidden");
    return;
  }
  $("log-empty").classList.add("hidden");
  $("log-table").classList.remove("hidden");
  $("log-body").innerHTML = logs.map((item) => `
    <tr>
      <td>${item.createdAt || "—"}</td>
      <td>${channelText(item.channel)}</td>
      <td>${item.notifyType || "—"}</td>
      <td>${item.verified ? "通过" : "失败"}</td>
      <td>${item.processResult || "—"}</td>
      <td>${item.errorMessage || "—"}</td>
      <td><code style="white-space:pre-wrap;word-break:break-all;">${(item.rawPayload || "").replaceAll("<", "&lt;")}</code></td>
    </tr>
  `).join("");
}

function formatReportType(reportType) {
  if (reportType === "career") return "事业";
  if (reportType === "wealth") return "财运";
  return "爱情";
}

function renderUnlocks(result) {
  unlockTotalPages = result.totalPages || 0;
  if (!result.content || result.content.length === 0) {
    $("unlock-body").innerHTML = "";
    $("unlock-empty").classList.remove("hidden");
    return;
  }

  $("unlock-empty").classList.add("hidden");
  $("unlock-body").innerHTML = result.content.map((item) => `
    <tr>
      <td>${item.id ?? ""}</td>
      <td>${item.source || "-"}</td>
      <td>${item.douyinName || "-"}</td>
      <td>${formatReportType(item.reportType)}</td>
      <td>${item.confirmedFollowed ? "是" : "否"}</td>
      <td>${tokenPill(item.tokenConsumed)}</td>
      <td>${formatTime(item.createdAt)}</td>
      <td>${formatTime(item.tokenConsumedAt)}</td>
    </tr>
  `).join("");
}

async function loadUnlocks() {
  const result = await api("/api/admin/premium-unlocks?page=0&size=50");
  renderUnlocks(result);
}

async function loadOrders() {
  const statusParam = orderStatus ? `&status=${orderStatus}` : "";
  const result = await api(`/api/admin/orders?page=${orderPage}&size=20${statusParam}`);
  renderOrders(result);
}

async function loadOrderCount() {
  const data = await api("/api/admin/orders/count");
  const payingTab = document.querySelector('.order-tab[data-status="PAYING"]');
  if (payingTab) payingTab.textContent = data.PAYING > 0 ? `支付中 (${data.PAYING})` : "支付中";
}

async function login() {
  $("login-error").textContent = "";
  const username = $("admin-username").value.trim();
  const password = $("admin-password").value;
  try {
    const data = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {}
    });
    adminToken = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
    $("login-status").textContent = `登录有效期到 ${(data.expiresAt || "").replace("T", " ").slice(0, 16)}`;
    setView(true);
    await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount(), loadUnlocks()]);
  } catch (e) {
    $("login-error").textContent = e.message;
  }
}

function logout() {
  adminToken = "";
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
    await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount(), loadUnlocks()]);
  } catch (e) {
    if (e.status === 401) {
      logout();
      $("login-error").textContent = e.message;
    }
  }
}

$("login-btn").addEventListener("click", login);
$("logout-btn").addEventListener("click", logout);
$("refresh-btn").addEventListener("click", async () => {
  await Promise.all([loadOverview(), loadReports(), loadOrders(), loadOrderCount(), loadUnlocks()]);
});
$("search-btn").addEventListener("click", async () => {
  currentPage = 0;
  currentQuery = $("report-query").value.trim();
  await loadReports();
});
$("prev-page").addEventListener("click", async () => {
  if (currentPage <= 0) return;
  currentPage -= 1;
  await loadReports();
});
$("next-page").addEventListener("click", async () => {
  if (currentPage >= totalPages - 1) return;
  currentPage += 1;
  await loadReports();
});
$("report-query").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    currentPage = 0;
    currentQuery = $("report-query").value.trim();
    await loadReports();
  }
});

document.querySelectorAll(".order-tab").forEach((tab) => {
  tab.addEventListener("click", async () => {
    document.querySelectorAll(".order-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    orderStatus = tab.dataset.status;
    orderPage = 0;
    await loadOrders();
  });
});

$("order-prev-page")?.addEventListener("click", async () => {
  if (orderPage <= 0) return;
  orderPage -= 1;
  await loadOrders();
});
$("order-next-page")?.addEventListener("click", async () => {
  if (orderPage >= orderTotalPages - 1) return;
  orderPage += 1;
  await loadOrders();
});

boot();
