import { openModal } from "../modal.js";
import {
  createSectionHeader,
  formatFee,
  formatTime,
  channelText,
  statusPill,
  verifyPill,
  tokenPill,
  unlockSourcePill,
  escapeHtml
} from "../utils.js";

function buildSummary(count, status, result) {
  const activeLabel = status || "\u5168\u90e8";
  return `
    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">\u5f53\u524d\u7b5b\u9009</span>
        <strong>${activeLabel}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">\u652f\u4ed8\u4e2d</span>
        <strong>${count.PAYING || 0}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">\u5df2\u652f\u4ed8</span>
        <strong>${count.PAID || 0}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">\u5f53\u524d\u9875</span>
        <strong>${(result.page || 0) + 1} / ${Math.max(result.totalPages || 1, 1)}</strong>
      </div>
    </div>
  `;
}

function orderLogTable(logs) {
  if (!logs.length) {
    return `<div class="empty-state">\u9009\u62e9\u4e00\u7b14\u8ba2\u5355\u540e\uff0c\u8fd9\u91cc\u4f1a\u663e\u793a\u6700\u8fd1 20 \u6761\u56de\u8c03\u6216\u8865\u5355\u65e5\u5fd7</div>`;
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>\u65f6\u95f4</th>
            <th>\u6e20\u9053</th>
            <th>\u7c7b\u578b</th>
            <th>\u9a8c\u7b7e</th>
            <th>\u7ed3\u679c</th>
            <th>\u9519\u8bef</th>
            <th>\u539f\u59cb\u56de\u8c03</th>
          </tr>
        </thead>
        <tbody>
          ${logs
            .map(
              (item) => `
            <tr>
              <td>${item.createdAt || "-"}</td>
              <td>${channelText(item.channel)}</td>
              <td>${item.notifyType || "-"}</td>
              <td>${item.verified ? "\u901a\u8fc7" : "\u5931\u8d25"}</td>
              <td>${item.processResult || "-"}</td>
              <td>${item.errorMessage || "-"}</td>
              <td><pre class="log-pre">${escapeHtml(item.rawPayload || "")}</pre></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function detailBody(item) {
  return `
    <div class="detail-grid">
      <div class="detail-item"><span>\u8ba2\u5355\u53f7</span><strong class="mono">${item.outTradeNo || "-"}</strong></div>
      <div class="detail-item"><span>\u6e20\u9053</span><strong>${channelText(item.channel)}</strong></div>
      <div class="detail-item"><span>\u91d1\u989d</span><strong>${formatFee(item.amountFen)}</strong></div>
      <div class="detail-item"><span>\u652f\u4ed8\u72b6\u6001</span><strong>${item.status || "-"}</strong></div>
      <div class="detail-item"><span>\u89e3\u9501\u72b6\u6001</span><strong>${item.unlockStatus || "-"}</strong></div>
      <div class="detail-item"><span>\u89e3\u9501\u6765\u6e90</span><strong>${item.unlockSource || "-"}</strong></div>
      <div class="detail-item"><span>\u573a\u666f</span><strong>${item.scene || "-"}</strong></div>
      <div class="detail-item"><span>\u62a5\u544a\u7c7b\u578b</span><strong>${item.reportType || "-"}</strong></div>
      <div class="detail-item"><span>\u8fd4\u73b0\u8d26\u6237</span><strong>${item.referralUserId || "-"}</strong></div>
      <div class="detail-item"><span>\u8fd4\u73b0\u7ed3\u7b97</span><strong>${item.referralSettled ? "\u5df2\u7ed3\u7b97" : "\u672a\u7ed3\u7b97"}</strong></div>
      <div class="detail-item"><span>\u89e3\u9501\u53d1\u653e\u65f6\u95f4</span><strong>${formatTime(item.unlockGrantedAt)}</strong></div>
      <div class="detail-item"><span>\u89e3\u9501\u53d1\u653e\u4eba</span><strong>${item.unlockGrantedBy || "-"}</strong></div>
      <div class="detail-item"><span>\u89e3\u9501\u5907\u6ce8</span><strong>${item.unlockRemark || "-"}</strong></div>
      <div class="detail-item"><span>\u521b\u5efa\u65f6\u95f4</span><strong>${formatTime(item.createdAt)}</strong></div>
      <div class="detail-item"><span>\u652f\u4ed8\u65f6\u95f4</span><strong>${formatTime(item.paidAt)}</strong></div>
      <div class="detail-item"><span>\u5173\u95ed\u65f6\u95f4</span><strong>${formatTime(item.closedAt)}</strong></div>
      <div class="detail-item"><span>\u5931\u8d25\u539f\u56e0</span><strong>${item.failReason || "-"}</strong></div>
    </div>
  `;
}

export async function renderOrders(container, ctx) {
  const status = ctx.state.orderStatus || "PAYING";
  const page = ctx.state.orderPage || 0;
  const count = await ctx.api("/api/admin/orders/count");
  const result = await ctx.api(`/api/admin/orders?page=${page}&size=20${status ? `&status=${status}` : ""}`);
  const logs = ctx.state.orderLogs || [];
  const currentItems = result.content || [];
  const unpaidAmount = currentItems
    .filter((item) => item.status === "PAYING" || item.status === "CREATED")
    .reduce((sum, item) => sum + (item.amountFen || 0), 0);
  const paidAmount = currentItems.filter((item) => item.status === "PAID").reduce((sum, item) => sum + (item.amountFen || 0), 0);

  container.innerHTML = `
    <section class="table-card">
      ${createSectionHeader(
        "\u652f\u4ed8\u8ba2\u5355",
        "\u8ffd\u8e2a\u652f\u4ed8\u94fe\u8def\u3001\u5904\u7406\u5f02\u5e38\u8865\u5355\u3001\u4eba\u5de5\u5ba1\u6279\u89e3\u9501\uff0c\u5e76\u56de\u770b\u5b8c\u6574\u89e3\u9501\u6765\u6e90\u3002"
      )}
      ${buildSummary(count, status, result)}
      <div class="summary-strip summary-strip-compact">
        <div class="summary-chip">
          <span class="summary-label">\u5f53\u524d\u9875\u5f85\u652f\u4ed8\u91d1\u989d</span>
          <strong>${formatFee(unpaidAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">\u5f53\u524d\u9875\u5df2\u652f\u4ed8\u91d1\u989d</span>
          <strong>${formatFee(paidAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">\u5f53\u524d\u9875\u8ba2\u5355\u6570</span>
          <strong>${currentItems.length}</strong>
        </div>
      </div>
      <div class="filters-bar">
        <button class="btn ${status === "PAYING" ? "btn-primary" : "btn-secondary"}" data-status="PAYING">\u652f\u4ed8\u4e2d${count.PAYING ? ` (${count.PAYING})` : ""}</button>
        <button class="btn ${status === "PAID" ? "btn-primary" : "btn-secondary"}" data-status="PAID">\u5df2\u652f\u4ed8</button>
        <button class="btn ${status === "FAILED" ? "btn-primary" : "btn-secondary"}" data-status="FAILED">\u5931\u8d25</button>
        <button class="btn ${status === "CLOSED" ? "btn-primary" : "btn-secondary"}" data-status="CLOSED">\u5df2\u5173\u95ed</button>
        <button class="btn ${status === "" ? "btn-primary" : "btn-secondary"}" data-status="">\u5168\u90e8</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>\u8ba2\u5355\u53f7</th>
              <th>\u6e20\u9053</th>
              <th>\u573a\u666f</th>
              <th>\u91d1\u989d</th>
              <th>\u652f\u4ed8\u72b6\u6001</th>
              <th>\u9a8c\u7b7e</th>
              <th>Token</th>
              <th>\u89e3\u9501\u72b6\u6001</th>
              <th>\u89e3\u9501\u6765\u6e90</th>
              <th>\u8fd4\u73b0\u8d26\u6237</th>
              <th>\u521b\u5efa\u65f6\u95f4</th>
              <th>\u64cd\u4f5c</th>
            </tr>
          </thead>
          <tbody>
            ${
              (result.content || [])
                .map(
                  (item) => `
              <tr class="${item.status === "FAILED" ? "is-danger-row" : item.status === "PAYING" ? "is-warn-row" : ""}">
                <td class="mono">${item.outTradeNo || ""}</td>
                <td>${channelText(item.channel)}</td>
                <td>${item.scene || "-"}</td>
                <td>${formatFee(item.amountFen)}</td>
                <td>${statusPill(item.status)}</td>
                <td>${verifyPill(item.notifyVerified)}</td>
                <td>${tokenPill(item.tokenConsumed)}</td>
                <td>${statusPill(item.unlockStatus)}</td>
                <td>${unlockSourcePill(item.unlockSource)}</td>
                <td>${item.referralUserId || "-"}</td>
                <td>${formatTime(item.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary detail-order-btn" data-order="${item.outTradeNo}">\u8be6\u60c5</button>
                    ${item.status !== "PAID" ? `<button class="btn btn-primary repair-order-btn" data-order="${item.outTradeNo}">\u8865\u5355</button>` : ""}
                    ${item.unlockStatus !== "UNLOCKED" && item.unlockStatus !== "CONSUMED" ? `<button class="btn btn-primary approve-unlock-btn" data-order="${item.outTradeNo}">\u5ba1\u6279\u89e3\u9501</button>` : ""}
                    ${item.status !== "PAID" && item.status !== "CLOSED" ? `<button class="btn btn-secondary close-order-btn" data-order="${item.outTradeNo}">\u5173\u95ed</button>` : ""}
                    <button class="btn btn-secondary log-order-btn" data-order="${item.outTradeNo}">\u65e5\u5fd7</button>
                  </div>
                </td>
              </tr>
            `
                )
                .join("") || `<tr><td colspan="12"><div class="empty-state">\u6682\u65e0\u8ba2\u5355\u6570\u636e</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="pager">
        <div class="pager-info">\u7b2c ${(result.page || 0) + 1} / ${Math.max(result.totalPages || 1, 1)} \u9875\uff0c\u5171 ${result.totalElements || 0} \u6761</div>
        <div class="table-actions">
          <button class="btn btn-secondary" id="order-prev-btn">\u4e0a\u4e00\u9875</button>
          <button class="btn btn-secondary" id="order-next-btn">\u4e0b\u4e00\u9875</button>
        </div>
      </div>
    </section>

    <section class="log-card">
      ${createSectionHeader(
        "\u56de\u8c03\u65e5\u5fd7",
        "\u70b9\u51fb\u8ba2\u5355\u65e5\u5fd7\u6309\u94ae\u540e\uff0c\u8fd9\u91cc\u5c55\u793a\u6700\u8fd1 20 \u6761\u56de\u8c03\u3001\u8865\u5355\u6216\u4eba\u5de5\u89e3\u9501\u8bb0\u5f55\u3002"
      )}
      ${orderLogTable(logs)}
    </section>
  `;

  container.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      ctx.state.orderStatus = button.dataset.status;
      ctx.state.orderPage = 0;
      ctx.reload();
    });
  });

  container.querySelector("#order-prev-btn").addEventListener("click", () => {
    if ((result.page || 0) <= 0) return;
    ctx.state.orderPage = result.page - 1;
    ctx.reload();
  });

  container.querySelector("#order-next-btn").addEventListener("click", () => {
    if ((result.page || 0) >= (result.totalPages || 1) - 1) return;
    ctx.state.orderPage = result.page + 1;
    ctx.reload();
  });

  container.querySelectorAll(".detail-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = (result.content || []).find((entry) => entry.outTradeNo === button.dataset.order);
      if (!item) return;
      openModal({
        title: "\u8ba2\u5355\u8be6\u60c5",
        description: "\u8fd9\u91cc\u5c55\u793a\u5f53\u524d\u652f\u4ed8\u8ba2\u5355\u7684\u5b8c\u6574\u5b57\u6bb5\u3001\u89e3\u9501\u6765\u6e90\u548c\u8fd4\u73b0\u5f52\u56e0\u3002",
        body: detailBody(item),
        confirmText: "\u5173\u95ed",
        cancelText: "\u6536\u8d77"
      });
    });
  });

  container.querySelectorAll(".repair-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await ctx.api(`/api/admin/orders/${button.dataset.order}/repair-paid`, {
        method: "POST",
        body: JSON.stringify({})
      });
      ctx.reload();
    });
  });

  container.querySelectorAll(".approve-unlock-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await ctx.api(`/api/admin/orders/${button.dataset.order}/approve-unlock`, {
        method: "POST",
        body: JSON.stringify({ remark: "admin-approved-unlock" })
      });
      ctx.reload();
    });
  });

  container.querySelectorAll(".close-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await ctx.api(`/api/admin/orders/${button.dataset.order}/close`, {
        method: "POST"
      });
      ctx.reload();
    });
  });

  container.querySelectorAll(".log-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const data = await ctx.api(`/api/admin/orders/${button.dataset.order}/logs`);
      ctx.state.orderLogs = data.logs || [];
      ctx.reload();
    });
  });
}
