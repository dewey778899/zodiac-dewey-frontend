import { openModal } from "../modal.js";
import { createSectionHeader, formatFee, formatTime, statusPill } from "../utils.js";

function buildSummary(rewards) {
  const available = rewards.filter((item) => item.status === "AVAILABLE").length;
  const withdrawn = rewards.filter((item) => item.status === "WITHDRAWN").length;
  const totalFen = rewards.reduce((sum, item) => sum + (item.amountFen || 0), 0);
  return `
    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">返现总笔数</span>
        <strong>${rewards.length}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">可用返现</span>
        <strong>${available}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">已提现</span>
        <strong>${withdrawn}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">累计返现金额</span>
        <strong>${formatFee(totalFen)}</strong>
      </div>
    </div>
  `;
}

function rewardDetail(item) {
  return `
    <div class="detail-grid">
      <div class="detail-item"><span>返现 ID</span><strong>${item.id}</strong></div>
      <div class="detail-item"><span>订单 ID</span><strong>${item.payOrderId}</strong></div>
      <div class="detail-item"><span>邀请人账户</span><strong>${item.inviterUserId}</strong></div>
      <div class="detail-item"><span>被邀请人账户</span><strong>${item.inviteeUserId}</strong></div>
      <div class="detail-item"><span>返现金额</span><strong>${formatFee(item.amountFen)}</strong></div>
      <div class="detail-item"><span>状态</span><strong>${item.status || "-"}</strong></div>
      <div class="detail-item"><span>提现单</span><strong>${item.withdrawalId || "-"}</strong></div>
      <div class="detail-item"><span>入账时间</span><strong>${formatTime(item.settledAt)}</strong></div>
    </div>
  `;
}

export async function renderRewards(container, ctx) {
  const rewards = await ctx.api("/api/admin/referral/rewards");
  const statusFilter = ctx.state.rewardStatus || "";
  const filteredRewards = (rewards || []).filter((item) => !statusFilter || item.status === statusFilter);
  const availableAmount = (rewards || [])
    .filter((item) => item.status === "AVAILABLE")
    .reduce((sum, item) => sum + (item.amountFen || 0), 0);
  const withdrawnAmount = (rewards || [])
    .filter((item) => item.status === "WITHDRAWN")
    .reduce((sum, item) => sum + (item.amountFen || 0), 0);

  container.innerHTML = `
    <section class="table-card">
      ${createSectionHeader(
        "返现记录",
        "每一笔返现都可追溯到邀请人、被邀请人与支付订单，支持补发与撤销。",
        `<button class="btn btn-primary" id="issue-reward-btn">手工补发返现</button>`
      )}
      ${buildSummary(filteredRewards || [])}
      <div class="summary-strip summary-strip-compact">
        <div class="summary-chip">
          <span class="summary-label">当前可用金额</span>
          <strong>${formatFee(availableAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">已提现金额</span>
          <strong>${formatFee(withdrawnAmount)}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">可撤销笔数</span>
          <strong>${(rewards || []).filter((item) => item.status === "AVAILABLE").length}</strong>
        </div>
      </div>
      <div class="filters-bar">
        <select class="filter-select" id="reward-status-filter">
          <option value="">全部状态</option>
          <option value="AVAILABLE" ${statusFilter === "AVAILABLE" ? "selected" : ""}>可用</option>
          <option value="WITHDRAWN" ${statusFilter === "WITHDRAWN" ? "selected" : ""}>已提现</option>
          <option value="CANCELED" ${statusFilter === "CANCELED" ? "selected" : ""}>已撤销</option>
        </select>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>订单 ID</th>
              <th>邀请人账户</th>
              <th>被邀请人账户</th>
              <th>返现金额</th>
              <th>状态</th>
              <th>提现单</th>
              <th>入账时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRewards.map((item) => `
              <tr class="${item.status === "CANCELED" ? "is-danger-row" : ""}">
                <td>${item.id}</td>
                <td>${item.payOrderId}</td>
                <td>${item.inviterUserId}</td>
                <td>${item.inviteeUserId}</td>
                <td>${formatFee(item.amountFen)}</td>
                <td>${statusPill(item.status)}</td>
                <td>${item.withdrawalId || "-"}</td>
                <td>${formatTime(item.settledAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary detail-reward-btn" data-id="${item.id}">详情</button>
                    ${item.status === "AVAILABLE" ? `<button class="btn btn-danger cancel-reward-btn" data-id="${item.id}">撤销</button>` : ""}
                  </div>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="9"><div class="empty-state">暂无返现记录</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelector("#reward-status-filter").addEventListener("change", () => {
    ctx.state.rewardStatus = container.querySelector("#reward-status-filter").value;
    ctx.reload();
  });

  container.querySelector("#issue-reward-btn").addEventListener("click", () => {
    openModal({
      title: "手工补发返现",
      description: "用于补发漏结算或人工补录的返现记录。",
      body: `
        <div class="modal-field">
          <label for="reward-pay-order-id">支付订单 ID</label>
          <input id="reward-pay-order-id" placeholder="请输入支付订单 ID">
        </div>
        <div class="modal-field">
          <label for="reward-inviter-user-id">邀请人账户 ID</label>
          <input id="reward-inviter-user-id" placeholder="请输入邀请人账户 ID">
        </div>
        <div class="modal-field">
          <label for="reward-amount-fen">补发金额（分）</label>
          <input id="reward-amount-fen" placeholder="例如 897">
        </div>
        <div class="modal-field">
          <label for="reward-remark">备注</label>
          <input id="reward-remark" value="admin-manual-issue">
        </div>
      `,
      confirmText: "确认补发",
      onConfirm: async () => {
        const payOrderId = Number(document.getElementById("reward-pay-order-id").value);
        const inviterUserId = Number(document.getElementById("reward-inviter-user-id").value);
        const amountFen = Number(document.getElementById("reward-amount-fen").value);
        const remark = document.getElementById("reward-remark").value.trim() || "admin-manual-issue";
        if (!payOrderId || !inviterUserId || !amountFen) {
          throw new Error("请完整填写订单 ID、邀请人账户 ID 和补发金额");
        }
        await ctx.api("/api/admin/referral/rewards/issue", {
          method: "POST",
          body: JSON.stringify({ payOrderId, inviterUserId, amountFen, remark })
        });
        ctx.reload();
      }
    });
  });

  container.querySelectorAll(".detail-reward-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = filteredRewards.find((entry) => String(entry.id) === button.dataset.id);
      if (!item) return;
      openModal({
        title: "返现详情",
        description: "这里展示当前返现记录的结算信息。",
        body: rewardDetail(item),
        confirmText: "关闭",
        cancelText: "收起"
      });
    });
  });

  container.querySelectorAll(".cancel-reward-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openModal({
        title: "撤销返现",
        description: `返现记录 ${button.dataset.id} 将被撤销，并回退到账户余额。`,
        body: `
          <div class="modal-field">
            <label for="cancel-reward-remark">备注</label>
            <input id="cancel-reward-remark" value="admin-cancel">
          </div>
        `,
        confirmText: "确认撤销",
        danger: true,
        onConfirm: async () => {
          const remark = document.getElementById("cancel-reward-remark").value.trim() || "admin-cancel";
          await ctx.api(`/api/admin/referral/rewards/${button.dataset.id}/cancel`, {
            method: "POST",
            body: JSON.stringify({ remark })
          });
          ctx.reload();
        }
      });
    });
  });
}
