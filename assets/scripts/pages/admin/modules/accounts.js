import { createSectionHeader, formatFee, formatTime } from "../utils.js";
import { openModal } from "../modal.js";

function buildSummary(users, bindings) {
  const activated = (users || []).filter((item) => item.inviterEligible).length;
  const totalBalance = (users || []).reduce((sum, item) => sum + (item.balanceFen || 0), 0);
  return `
    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">账户总数</span>
        <strong>${users.length}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">已激活邀请资格</span>
        <strong>${activated}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">绑定关系</span>
        <strong>${bindings.length}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">累计返现池</span>
        <strong>${formatFee(totalBalance)}</strong>
      </div>
    </div>
  `;
}

function accountDetail(item) {
  return `
    <div class="detail-grid">
      <div class="detail-item"><span>账户 ID</span><strong>${item.id}</strong></div>
      <div class="detail-item"><span>手机号</span><strong>${item.phone || "-"}</strong></div>
      <div class="detail-item"><span>邀请码</span><strong class="mono">${item.inviteCode || "-"}</strong></div>
      <div class="detail-item"><span>邀请资格</span><strong>${item.inviterEligible ? "已激活" : "未激活"}</strong></div>
      <div class="detail-item"><span>累计返现</span><strong>${formatFee(item.balanceFen)}</strong></div>
      <div class="detail-item"><span>可提现</span><strong>${formatFee(item.withdrawableFen)}</strong></div>
      <div class="detail-item"><span>冻结中</span><strong>${formatFee(item.frozenFen)}</strong></div>
      <div class="detail-item"><span>已提现</span><strong>${formatFee(item.withdrawnFen)}</strong></div>
      <div class="detail-item"><span>付费次数</span><strong>${item.premiumPaidCount ?? 0}</strong></div>
      <div class="detail-item"><span>微信 OpenID</span><strong class="mono">${item.wechatOpenid || "-"}</strong></div>
      <div class="detail-item"><span>抖音 OpenID</span><strong class="mono">${item.douyinOpenid || "-"}</strong></div>
      <div class="detail-item"><span>创建时间</span><strong>${formatTime(item.createdAt)}</strong></div>
    </div>
  `;
}

export async function renderAccounts(container, ctx) {
  const keyword = (ctx.state.accountQuery || "").trim().toLowerCase();
  const [users, bindings] = await Promise.all([
    ctx.api("/api/admin/referral/users"),
    ctx.api("/api/admin/referral/bindings")
  ]);
  const filteredUsers = (users || []).filter((item) => {
    if (!keyword) return true;
    return [item.phone, item.inviteCode, item.wechatOpenid, item.douyinOpenid]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  container.innerHTML = `
    <section class="table-card">
      ${createSectionHeader("返现账户", "统一查看手机号账户、邀请码、余额、平台身份与邀请资格。")}
      ${buildSummary(filteredUsers || [], bindings || [])}
      <div class="filters-bar">
        <input class="filter-input" id="account-query" placeholder="搜索手机号 / 邀请码 / OpenID" value="${ctx.state.accountQuery || ""}">
        <button class="btn btn-primary" id="account-search-btn">筛选</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>手机号</th>
              <th>邀请码</th>
              <th>累计返现</th>
              <th>可提现</th>
              <th>付费次数</th>
              <th>邀请资格</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map((item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.phone || "-"}</td>
                <td class="mono">${item.inviteCode || "-"}</td>
                <td>${formatFee(item.balanceFen)}</td>
                <td>${formatFee(item.withdrawableFen)}</td>
                <td>${item.premiumPaidCount ?? 0}</td>
                <td>${item.inviterEligible ? "已激活" : "未激活"}</td>
                <td>${formatTime(item.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary detail-account-btn" data-id="${item.id}">详情</button>
                  </div>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="9"><div class="empty-state">暂无返现账户</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    <section class="table-card">
      ${createSectionHeader("邀请绑定关系", "谁邀请了谁在这里确认，支持后台手工改绑处理归因异常。")}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>邀请人账户</th>
              <th>被邀请人账户</th>
              <th>邀请码</th>
              <th>来源</th>
              <th>绑定时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${(bindings || []).map((item) => `
              <tr>
                <td>${item.id}</td>
                <td>${item.inviterUserId}</td>
                <td>${item.inviteeUserId}</td>
                <td class="mono">${item.inviteCode || "-"}</td>
                <td>${item.bindSource || "-"}</td>
                <td>${formatTime(item.boundAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-secondary rebind-btn" data-invitee="${item.inviteeUserId}">改绑</button>
                  </div>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="7"><div class="empty-state">暂无邀请绑定关系</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelector("#account-search-btn").addEventListener("click", () => {
    ctx.state.accountQuery = container.querySelector("#account-query").value.trim();
    ctx.reload();
  });

  container.querySelector("#account-query").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      ctx.state.accountQuery = container.querySelector("#account-query").value.trim();
      ctx.reload();
    }
  });

  container.querySelectorAll(".detail-account-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = filteredUsers.find((entry) => String(entry.id) === button.dataset.id);
      if (!item) return;
      openModal({
        title: "账户详情",
        description: "这里是统一返现账户的完整字段视图。",
        body: accountDetail(item),
        confirmText: "关闭",
        cancelText: "收起"
      });
    });
  });

  container.querySelectorAll(".rebind-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openModal({
        title: "改绑邀请关系",
        description: `被邀请人账户 ${button.dataset.invitee} 将改绑到新的邀请人账户。`,
        body: `
          <div class="modal-field">
            <label for="modal-inviter-id">新的邀请人账户 ID</label>
            <input id="modal-inviter-id" placeholder="请输入新的邀请人账户 ID">
          </div>
          <div class="modal-field">
            <label for="modal-bind-source">来源备注</label>
            <input id="modal-bind-source" value="admin-manual-rebind">
          </div>
        `,
        confirmText: "确认改绑",
        onConfirm: async () => {
          const inviterUserId = Number(document.getElementById("modal-inviter-id").value);
          const source = document.getElementById("modal-bind-source").value.trim() || "admin-manual-rebind";
          if (!inviterUserId) throw new Error("请输入新的邀请人账户 ID");
          await ctx.api("/api/admin/referral/bindings/rebind", {
            method: "POST",
            body: JSON.stringify({
              inviteeUserId: Number(button.dataset.invitee),
              inviterUserId,
              source
            })
          });
          ctx.reload();
        }
      });
    });
  });
}
