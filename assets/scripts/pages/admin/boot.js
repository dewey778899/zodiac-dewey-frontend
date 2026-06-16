import { ADMIN_TOKEN_KEY, api } from "./api.js";
import { renderOverview } from "./modules/overview.js";
import { renderReports } from "./modules/reports.js";
import { renderOrders } from "./modules/orders.js";
import { renderAccounts } from "./modules/accounts.js";
import { renderRewards } from "./modules/rewards.js";
import { renderWithdrawals } from "./modules/withdrawals.js";

const views = {
  overview: {
    breadcrumb: "运营中心 / 总览",
    kicker: "OVERVIEW",
    title: "总览",
    subtitle: "查看核心指标、近 7 天趋势、深度解析解锁使用与整体运营状态。",
    render: renderOverview
  },
  reports: {
    breadcrumb: "内容中心 / 报告管理",
    kicker: "REPORTS",
    title: "报告管理",
    subtitle: "搜索报告、回查生成记录、快速定位具体用户与模型输出。",
    render: renderReports
  },
  orders: {
    breadcrumb: "交易中心 / 支付订单",
    kicker: "ORDERS",
    title: "支付订单",
    subtitle: "追踪支付链路、处理异常补单、回看回调日志与订单状态。",
    render: renderOrders
  },
  accounts: {
    breadcrumb: "返现中心 / 返现账户",
    kicker: "ACCOUNTS",
    title: "返现账户",
    subtitle: "统一管理手机号账户、邀请码、余额、平台身份与邀请资格。",
    render: renderAccounts
  },
  rewards: {
    breadcrumb: "返现中心 / 返现记录",
    kicker: "REWARDS",
    title: "返现记录",
    subtitle: "查看每笔返现、手工补发、撤销异常返现与归因结果。",
    render: renderRewards
  },
  withdrawals: {
    breadcrumb: "返现中心 / 提现审核",
    kicker: "WITHDRAWALS",
    title: "提现审核",
    subtitle: "审核提现申请、记录驳回原因、确认出款与回滚状态。",
    render: renderWithdrawals
  }
};

const state = {
  token: localStorage.getItem(ADMIN_TOKEN_KEY) || "",
  currentView: "overview",
  reportPage: 0,
  reportQuery: "",
  reportModel: "",
  orderPage: 0,
  orderStatus: "PAYING",
  orderLogs: [],
  accountQuery: "",
  rewardStatus: "",
  withdrawalStatus: ""
};

function $(id) {
  return document.getElementById(id);
}

function setView(loggedIn) {
  $("login-view").classList.toggle("hidden", loggedIn);
  $("dashboard-view").classList.toggle("hidden", !loggedIn);
}

function setTopbar(viewKey) {
  const view = views[viewKey];
  $("view-breadcrumb").textContent = view.breadcrumb;
  $("view-kicker").textContent = view.kicker;
  $("view-title").textContent = view.title;
  $("view-subtitle").textContent = view.subtitle;
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewKey);
  });
}

async function request(path, options = {}) {
  return api(path, options, state.token);
}

async function renderCurrentView() {
  const container = $("module-container");
  const view = views[state.currentView];
  setTopbar(state.currentView);
  $("refresh-status").textContent = "正在刷新";
  container.innerHTML = `<section class="panel"><div class="empty-state">正在加载 ${view.title}...</div></section>`;
  try {
    await view.render(container, {
      state,
      api: request,
      reload: renderCurrentView
    });
    $("refresh-status").textContent = `已刷新 ${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
  } catch (error) {
    $("refresh-status").textContent = "刷新失败";
    if (error.status === 401) {
      logout(error.message);
      return;
    }
    container.innerHTML = `<section class="panel"><div class="empty-state">${error.message}</div></section>`;
  }
}

async function login() {
  $("login-error").textContent = "";
  $("refresh-status").textContent = "登录中";
  try {
    const data = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("admin-username").value.trim(),
        password: $("admin-password").value
      })
    });
    state.token = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, state.token);
    $("login-status").textContent = `登录有效期至 ${(data.expiresAt || "").replace("T", " ").slice(0, 16)}`;
    setView(true);
    await renderCurrentView();
  } catch (error) {
    $("refresh-status").textContent = "登录失败";
    $("login-error").textContent = error.message;
  }
}

function logout(message = "") {
  state.token = "";
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  setView(false);
  $("login-error").textContent = message;
}

async function boot() {
  if (!state.token) {
    setView(false);
    return;
  }
  setView(true);
  $("login-status").textContent = "已登录";
  await renderCurrentView();
}

export function initAdminApp() {
  $("login-btn").addEventListener("click", login);
  $("logout-btn").addEventListener("click", () => logout());
  $("refresh-btn").addEventListener("click", renderCurrentView);
  $("admin-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") login();
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", async () => {
      state.currentView = item.dataset.view;
      await renderCurrentView();
    });
  });
  boot();
}
