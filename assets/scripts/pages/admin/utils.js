export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatFee(fee) {
  if (fee == null) return "-";
  return `\u00a5${(fee / 100).toFixed(2)}`;
}

export function formatTime(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

export function channelText(channel) {
  if (channel === "alipay") return "\u652f\u4ed8\u5b9d";
  if (channel === "douyin") return "\u6296\u97f3";
  return "\u5fae\u4fe1";
}

export function reportTypeText(reportType) {
  if (reportType === "career") return "\u4e8b\u4e1a";
  if (reportType === "wealth") return "\u8d22\u8fd0";
  return "\u7231\u60c5";
}

export function pill(text, tone = "peach") {
  return `<span class="pill ${tone}">${text}</span>`;
}

export function statusPill(status) {
  const map = {
    CREATED: ["\u5f85\u521b\u5efa", "peach"],
    PAYING: ["\u652f\u4ed8\u4e2d", "gold"],
    PAID: ["\u5df2\u652f\u4ed8", "olive"],
    CLOSED: ["\u5df2\u5173\u95ed", "rose"],
    FAILED: ["\u5931\u8d25", "rose"],
    AVAILABLE: ["\u53ef\u7528", "olive"],
    WITHDRAW_APPLIED: ["\u63d0\u73b0\u5904\u7406\u4e2d", "gold"],
    WITHDRAWN: ["\u5df2\u63d0\u73b0", "olive"],
    CANCELED: ["\u5df2\u64a4\u9500", "rose"],
    APPLIED: ["\u5f85\u5ba1\u6838", "gold"],
    REJECTED: ["\u5df2\u9a73\u56de", "rose"],
    PROCESSING: ["\u5904\u7406\u4e2d", "gold"],
    SUCCESS: ["\u6210\u529f", "olive"],
    LOCKED: ["\u672a\u89e3\u9501", "rose"],
    UNLOCKED: ["\u5df2\u89e3\u9501", "olive"],
    CONSUMED: ["\u5df2\u6d88\u8017", "gold"],
    EXPIRED: ["\u5df2\u8fc7\u671f", "rose"]
  };
  const [text, tone] = map[status] || [status || "-", "peach"];
  return pill(text, tone);
}

export function verifyPill(flag) {
  if (flag === true) return pill("\u5df2\u9a8c\u7b7e", "olive");
  if (flag === false) return pill("\u9a8c\u7b7e\u5931\u8d25", "rose");
  return pill("\u672a\u56de\u8c03", "gold");
}

export function tokenPill(flag) {
  return flag ? pill("\u5df2\u6d88\u8017", "gold") : pill("\u53ef\u7528", "olive");
}

export function unlockSourcePill(source) {
  const map = {
    PAYMENT_AUTO: ["\u81ea\u52a8\u652f\u4ed8\u89e3\u9501", "olive"],
    ADMIN_APPROVED: ["\u4eba\u5de5\u5ba1\u6279\u89e3\u9501", "gold"],
    ADMIN_REPAIRED: ["\u4eba\u5de5\u4fee\u5355\u89e3\u9501", "peach"],
    DOUYIN_FOLLOW: ["\u6296\u97f3\u5173\u6ce8\u89e3\u9501", "peach"]
  };
  const [text, tone] = map[source] || [source || "-", "peach"];
  return pill(text, tone);
}

export function createEmptyState(text) {
  return `<div class="empty-state">${text}</div>`;
}

export function createSectionHeader(title, subtitle, actions = "") {
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${title}</h2>
        <p class="section-subtitle">${subtitle}</p>
      </div>
      ${actions ? `<div class="table-actions">${actions}</div>` : ""}
    </div>
  `;
}
