import { openModal } from "../modal.js";
import { createSectionHeader, formatFee, formatTime, statusPill } from "../utils.js";

function buildSummary(withdrawals) {
  const applied = withdrawals.filter((item) => item.status === "APPLIED").length;
  const success = withdrawals.filter((item) => item.status === "SUCCESS" || item.status === "WITHDRAWN").length;
  const totalFen = withdrawals.reduce((sum, item) => sum + (item.amountFen || 0), 0);
  return `
    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">申请总数</span>
        <strong>${withdrawals.length}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">待审核</span>
        <strong>${applied}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">已完成</span>
        <strong>${success}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">累计提现</span>
        <strong>${formatFee(totalFen)}</strong>
      </div>
    </div>
  `;
}

function withdrawalDetail(item) {
  return `
    <div class="detail-grid">
      <div class="detail-item"><span>提现单 ID</span><strong>${item.id}</strong></div>
      <div class="detail-item"><span>账户 ID</span><strong>${item.userId}</strong></div>
      <div class="detail-item"><span>提现金额</span><strong>${formatFee(item.amountFen)}</strong></div>
      <div class="detail-item"><span>平台</span><strong>${item.withdrawPlatform || "-"}</strong></div>
      <div class="detail-item"><span>状态</span><strong>${item.status || "-"}</strong></div>
      <div class="detail-item"><span>收款快照</span><strong class="mono">${item.payeeAccountSnapshot || "-"}</strong></div>
      <div class="detail-item"><span>备注</span><strong>${item.remark || "-"}</strong></div>
      <div class="detail-item"><span>申请时间</span><strong>${formatTime(item.createdAt)}</strong></div>
      <div class="detail-item"><span>更新时间</span><strong>${formatTime(item.updatedAt)}</strong></div>
    </div>
  `;
}

export async function renderWithdrawals(container, ctx) {
  const withdrawals = await ctx.api("/api/admin/referral/withdrawals");
  const statusFilter = ctx.state.withdrawalStatus || "";
  const filteredWithdrawals = (withdrawals || []).filter((item) => !statusFilter || item.status === statusFilter);
  const appliedAmount = (withdrawals || [])
    .filter((item) => item.status === "APPLIED")
    .reduce((sum, item) => sum + (item.amountFen || 0), 0);
  const successAmount = (withdrawals || [])
    .filter((item) => item.status === "SUCCESS" || item.status === "WITHDRAWN")
    .reduce((sum, item) => sum + (item.amountFen || 0), 0);

  container.innerHTML = `
    <section class="table-card">
      ${createSectionHeader("提现审核", "审核提现申请、记录驳回原因、确认出款与回滚状态。")}
      ${buildSummary(filteredWithdrawals || [])}
      <div class="summary-strip summary-strip-compact">
        <div class="summary-chip">
          <span class="summary-label">待审核金额</span>
          <strong>${formatFee(appliedAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">已完成金额</span>
          <strong>${formatFee(successAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">驳回笔数</span>
          <strong>${(withdrawals || []).filter((item) => item.status === "REJECTED").length}</strong>
        </div>
      </div>
      <div class="filters-bar">
        <select class="filter-select" id="withdrawal-status-filter">
          <option value="">全部状态</option>
          <option value="APPLIED" ${statusFilter === "APPLIED" ? "selected" : ""}>待审核</option>
          <option value="REJECTED" ${statusFilter === "REJECTED" ? "selected" : ""}>已驳回</option>
          <option value="SUCCESS" ${statusFilter === "SUCCESS" ? "selected" : ""}>成功</option>
          <option value="WITHDRAWN" ${statusFilter === "WITHDRAWN" ? "selected" : ""}>已提现</option>
        </select>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>账户 ID</th>
              <th>提现金额</th>
              <th>平台</th>
              <th>状态</th>
              <th>收款快照</th>
              <th>申请时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredWithdrawals.map((item) => `
              <tr class="${item.status === "REJECTED" ? "is-danger-row" : item.status === "APPLIED" ? "is-warn-row" : ""}">
                <td>${item.id}</td>
                <td>${item.userId}</td>
                <td>${formatFee(item.amountFen)}</td>
                <td>${item.withdrawPlatform || "-"}</td>
                <td>${statusPill(item.status)}</td>
                <td class="mono">${item.payeeAccountSnapshot || "-"}</td>
                <td>${formatTime(item.createdAt)}</td>
                <td>${formatTime(item.updatedAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary detail-withdraw-btn" data-id="${item.id}">详情</button>
                    ${item.status === "APPLIED" ? `<button class="btn btn-primary approve-withdraw-btn" data-id="${item.id}">通过</button>` : ""}
                    ${item.status === "APPLIED" ? `<button class="btn btn-danger reject-withdraw-btn" data-id="${item.id}">驳回</button>` : ""}
                  </div>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="9"><div class="empty-state">暂无提现申请</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelector("#withdrawal-status-filter").addEventListener("change", () => {
    ctx.state.withdrawalStatus = container.querySelector("#withdrawal-status-filter").value;
    ctx.reload();
  });

  container.querySelectorAll(".detail-withdraw-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = filteredWithdrawals.find((entry) => String(entry.id) === button.dataset.id);
      if (!item) return;
      openModal({
        title: "提现详情",
        description: "这里展示当前提现申请的审核字段。",
        body: withdrawalDetail(item),
        confirmText: "关闭",
        cancelText: "收起"
      });
    });
  });

  container.querySelectorAll(".approve-withdraw-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openModal({
        title: "通过提现审核",
        description: `提现单 ${button.dataset.id} 审核通过后，会进入出款流程。`,
        body: `
          <div class="modal-field">
            <label for="approve-withdraw-remark">备注</label>
            <input id="approve-withdraw-remark" value="admin-approved">
          </div>
        `,
        confirmText: "确认通过",
        onConfirm: async () => {
          const remark = document.getElementById("approve-withdraw-remark").value.trim() || "admin-approved";
          await ctx.api(`/api/admin/referral/withdrawals/${button.dataset.id}/approve`, {
            method: "POST",
            body: JSON.stringify({ remark })
          });
          ctx.reload();
        }
      });
    });
  });

  container.querySelectorAll(".reject-withdraw-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openModal({
        title: "驳回提现申请",
        description: `提现单 ${button.dataset.id} 驳回后，冻结金额会退回可提现余额。`,
        body: `
          <div class="modal-field">
            <label for="reject-withdraw-remark">备注</label>
            <input id="reject-withdraw-remark" value="admin-rejected">
          </div>
        `,
        confirmText: "确认驳回",
        danger: true,
        onConfirm: async () => {
          const remark = document.getElementById("reject-withdraw-remark").value.trim() || "admin-rejected";
          await ctx.api(`/api/admin/referral/withdrawals/${button.dataset.id}/reject`, {
            method: "POST",
            body: JSON.stringify({ remark })
          });
          ctx.reload();
        }
      });
    });
  });
}
