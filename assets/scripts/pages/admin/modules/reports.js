import { createSectionHeader, formatTime, pill } from "../utils.js";

function modelPill(modelCode) {
  return modelCode === "claude" ? pill("深度解析", "gold") : pill("DeepSeek", "peach");
}

function buildSummary(result, query) {
  return `
    <div class="summary-strip">
      <div class="summary-chip">
        <span class="summary-label">当前检索</span>
        <strong>${query || "全部报告"}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">总记录</span>
        <strong>${result.totalElements || 0}</strong>
      </div>
      <div class="summary-chip">
        <span class="summary-label">当前页</span>
        <strong>${(result.page || 0) + 1} / ${Math.max(result.totalPages || 1, 1)}</strong>
      </div>
    </div>
  `;
}

export async function renderReports(container, ctx) {
  const query = ctx.state.reportQuery || "";
  const page = ctx.state.reportPage || 0;
  const modelFilter = ctx.state.reportModel || "";
  const result = await ctx.api(`/api/admin/reports?page=${page}&size=20&query=${encodeURIComponent(query)}`);
  const filteredItems = (result.items || []).filter((item) => {
    if (!modelFilter) return true;
    return (item.modelCode || "") === modelFilter;
  });
  const modelStats = filteredItems.reduce((acc, item) => {
    const key = item.modelCode || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  container.innerHTML = `
    <section class="table-card">
      ${createSectionHeader("报告管理", "支持按报告编号、姓名、模型搜索，方便回查历史生成记录。")}
      ${buildSummary(result, query)}
      <div class="summary-strip summary-strip-compact">
        <div class="summary-chip">
          <span class="summary-label">DeepSeek</span>
          <strong>${modelStats.deepseek || 0}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">深度解析</span>
          <strong>${modelStats.claude || 0}</strong>
        </div>
        <div class="summary-chip">
          <span class="summary-label">平均分</span>
          <strong>${filteredItems.length ? Math.round(filteredItems.reduce((sum, item) => sum + (item.score || 0), 0) / filteredItems.length) : 0}</strong>
        </div>
      </div>
      <div class="filters-bar">
        <input class="filter-input" id="report-query" placeholder="搜索报告编号 / 姓名 / 模型" value="${query}">
        <select class="filter-select" id="report-model-filter">
          <option value="">全部模型</option>
          <option value="deepseek" ${modelFilter === "deepseek" ? "selected" : ""}>DeepSeek</option>
          <option value="claude" ${modelFilter === "claude" ? "selected" : ""}>深度解析</option>
        </select>
        <button class="btn btn-primary" id="report-search-btn">搜索</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>报告编号</th>
              <th>姓名</th>
              <th>模型</th>
              <th>分数</th>
              <th>关系类型</th>
              <th>微信号</th>
              <th>生成时间</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.map((item) => `
              <tr>
                <td class="mono">${item.reportUid || "-"}</td>
                <td>${item.userAName || "-"}${item.userBName ? ` / ${item.userBName}` : ""}</td>
                <td>${modelPill(item.modelCode)}</td>
                <td>${item.score ?? "-"}</td>
                <td>${item.relationshipType || "-"}</td>
                <td>${item.wechatId || "-"}</td>
                <td>${formatTime(item.createdAt)}</td>
              </tr>
            `).join("") || `<tr><td colspan="7"><div class="empty-state">暂无匹配报告</div></td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="pager">
        <div class="pager-info">第 ${(result.page || 0) + 1} / ${Math.max(result.totalPages || 1, 1)} 页，共 ${result.totalElements || 0} 条</div>
        <div class="table-actions">
          <button class="btn btn-secondary" id="report-prev-btn">上一页</button>
          <button class="btn btn-secondary" id="report-next-btn">下一页</button>
        </div>
      </div>
    </section>
  `;

  container.querySelector("#report-search-btn").addEventListener("click", () => {
    ctx.state.reportPage = 0;
    ctx.state.reportQuery = container.querySelector("#report-query").value.trim();
    ctx.state.reportModel = container.querySelector("#report-model-filter").value;
    ctx.reload();
  });

  container.querySelector("#report-query").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      ctx.state.reportPage = 0;
      ctx.state.reportQuery = container.querySelector("#report-query").value.trim();
      ctx.state.reportModel = container.querySelector("#report-model-filter").value;
      ctx.reload();
    }
  });

  container.querySelector("#report-model-filter").addEventListener("change", () => {
    ctx.state.reportPage = 0;
    ctx.state.reportModel = container.querySelector("#report-model-filter").value;
    ctx.reload();
  });

  container.querySelector("#report-prev-btn").addEventListener("click", () => {
    if ((result.page || 0) <= 0) return;
    ctx.state.reportPage = result.page - 1;
    ctx.reload();
  });

  container.querySelector("#report-next-btn").addEventListener("click", () => {
    if ((result.page || 0) >= (result.totalPages || 1) - 1) return;
    ctx.state.reportPage = result.page + 1;
    ctx.reload();
  });
}
