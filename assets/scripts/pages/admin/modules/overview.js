import { createSectionHeader, createEmptyState, formatTime, reportTypeText, tokenPill } from "../utils.js";

function metricCard(title, value, metaLeft, metaRight, tone) {
  return `
    <article class="metric-card ${tone}">
      <div class="metric-label">${title}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-meta">
        <span>${metaLeft}</span>
        <span>${metaRight}</span>
      </div>
    </article>
  `;
}

function commandCard(title, desc, action, targetView) {
  return `
    <button class="command-card" data-target-view="${targetView}">
      <span class="command-kicker">${title}</span>
      <strong>${action}</strong>
      <span>${desc}</span>
    </button>
  `;
}

function todoCard(title, value, desc, targetView, tone = "") {
  return `
    <button class="todo-card ${tone}" data-target-view="${targetView}">
      <span class="todo-value">${value}</span>
      <strong>${title}</strong>
      <span>${desc}</span>
    </button>
  `;
}

export async function renderOverview(container, ctx) {
  const [overview, referralOverview, unlocks, orderCount] = await Promise.all([
    ctx.api("/api/admin/overview"),
    ctx.api("/api/admin/referral/overview"),
    ctx.api("/api/admin/premium-unlocks?page=0&size=8"),
    ctx.api("/api/admin/orders/count")
  ]);

  const trendRows = (overview.trends || []).map((item) => `
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

  const unlockRows = (unlocks.content || []).map((item) => `
    <tr>
      <td>${item.source || "-"}</td>
      <td>${item.douyinName || "-"}</td>
      <td>${reportTypeText(item.reportType)}</td>
      <td>${item.confirmedFollowed ? "是" : "否"}</td>
      <td>${tokenPill(item.tokenConsumed)}</td>
      <td>${formatTime(item.createdAt)}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <section class="metrics-grid">
      ${metricCard("模型点击", overview.generateClick.today, `DeepSeek ${overview.generateClick.deepseekToday}`, `深度解析 ${overview.generateClick.claudeToday}`, "peach")}
      ${metricCard("生成成功", overview.generateSuccess.today, `DeepSeek ${overview.generateSuccess.deepseekToday}`, `深度解析 ${overview.generateSuccess.claudeToday}`, "gold")}
      ${metricCard("支付成功", overview.paymentSuccess.today, `微信 ${overview.paymentSuccess.wechatToday}`, `支付宝 ${overview.paymentSuccess.alipayToday}`, "olive")}
      ${metricCard("返现账户", referralOverview.users || 0, `绑定 ${referralOverview.bindings || 0}`, `提现 ${referralOverview.withdrawals || 0}`, "rose")}
    </section>

    <section class="panel">
      ${createSectionHeader("待处理事项", "把最需要处理的运营问题集中在一个面板里。")}
      <div class="todo-grid">
        ${todoCard("支付中订单", orderCount.PAYING || 0, "优先排查卡在支付中的订单。", "orders", "warn")}
        ${todoCard("失败订单", orderCount.FAILED || 0, "检查失败原因并决定是否补单。", "orders", "danger")}
        ${todoCard("返现账户", referralOverview.users || 0, "检查账户、邀请码与归因绑定。", "accounts")}
        ${todoCard("提现申请", referralOverview.withdrawals || 0, "进入提现审核处理待出款记录。", "withdrawals")}
      </div>
    </section>

    <section class="panel">
      ${createSectionHeader("快捷操作", "直接跳到最常用的后台工作区域。")}
      <div class="command-grid">
        ${commandCard("支付异常", "进入支付订单页，优先处理支付中与失败订单。", "查看订单", "orders")}
        ${commandCard("返现修正", "进入返现记录页，处理补发或撤销。", "处理返现", "rewards")}
        ${commandCard("提现审核", "进入提现审核页，完成待审核申请。", "审核提现", "withdrawals")}
        ${commandCard("归因改绑", "进入返现账户页，修正邀请绑定关系。", "调整关系", "accounts")}
      </div>
    </section>

    <section class="split-grid">
      <div class="panel">
        ${createSectionHeader("近 7 天趋势", "快速查看模型点击、生成成功、支付创建和支付成功走势。")}
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>DeepSeek 点击</th>
                <th>深度解析 点击</th>
                <th>DeepSeek 成功</th>
                <th>深度解析 成功</th>
                <th>支付创建</th>
                <th>支付成功</th>
                <th>回调失败</th>
              </tr>
            </thead>
            <tbody>${trendRows || `<tr><td colspan="8">${createEmptyState("暂无趋势数据")}</td></tr>`}</tbody>
          </table>
        </div>
      </div>

      <div class="stats-stack">
        <section class="stats-card">
          ${createSectionHeader("支付成功率", "今日与累计支付成功率概览。")}
          <div class="mini-stats">
            <div class="mini-stat">
              <div class="label">今日成功率</div>
              <div class="value">${overview.successRate.todayRate}%</div>
            </div>
            <div class="mini-stat">
              <div class="label">累计成功率</div>
              <div class="value">${overview.successRate.totalRate}%</div>
            </div>
            <div class="mini-stat">
              <div class="label">今日支付</div>
              <div class="value">${overview.successRate.todayPaid}/${overview.successRate.todayCreated}</div>
            </div>
            <div class="mini-stat">
              <div class="label">累计支付</div>
              <div class="value">${overview.successRate.totalPaid}/${overview.successRate.totalCreated}</div>
            </div>
          </div>
        </section>

        <section class="stats-card">
          ${createSectionHeader("最近解锁记录", "快速回查抖音解锁提交与 token 消费情况。")}
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>来源</th>
                  <th>抖音名</th>
                  <th>主题</th>
                  <th>已关注</th>
                  <th>Token</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>${unlockRows || `<tr><td colspan="6">${createEmptyState("暂无解锁记录")}</td></tr>`}</tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  `;

  container.querySelectorAll(".command-card, .todo-card").forEach((button) => {
    button.addEventListener("click", async () => {
      ctx.state.currentView = button.dataset.targetView;
      await ctx.reload();
    });
  });
}
