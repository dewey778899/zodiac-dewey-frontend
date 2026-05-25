const THEME_CONFIG = {
  love: {
    heroTag: "LOVE REPORT · 爱情合盘",
    heroTitle: "你和 TA<br>会如何靠近",
    heroSub: "爱情继续保留双人信息，重点看吸引力、冲突点和相处策略。",
    flowTitle: "沿用现在的双人合盘骨架，把生成逻辑切成爱情专用 prompt。",
    primaryTitle: "关于你",
    submitText: "预览爱情报告",
    coverBadge: "双人合盘报告",
    coverTitleCn: "爱情合盘",
    coverTitleEn: "— The Magnetic Bond —",
    score: 89,
    scoreLabel: "LOVE INDEX",
    type: "高吸引慢热型",
    tagline: "越熟越有张力，越认真越需要温柔表达。",
    reportId: "预览编号 · PREVIEW-LOVE-01",
    coverLink: "❤",
    duo: true,
    metrics: [
      { label: "吸引力", value: "92" },
      { label: "沟通感", value: "84" },
      { label: "承诺感", value: "87" }
    ],
    summary: [
      "表单页保留双人输入，用户认知和现在最接近。",
      "结果页继续用现有封面、章节、锦囊、分享区结构。",
      "后端只需要把主题作为 reportType 传进去，prompt 和章节文案按爱情切换。"
    ],
    chapters: [
      {
        emoji: "01",
        title: "吸引力是怎么发生的",
        content: "你们的互动像是一个人先点火，另一个人负责把情绪接住。前期会因为反差感而快速被彼此吸引，越靠近越会在安全感和表达方式上看见对方真正的需求。"
      },
      {
        emoji: "02",
        title: "最容易卡住的沟通点",
        content: "一方希望马上得到回应，另一方更习惯先消化情绪再开口，所以误会通常不是来自不在乎，而是来自节奏不一致。结果页里这一章就可以换成爱情专用 prompt 输出。"
      },
      {
        emoji: "03",
        title: "适合保留的底部操作",
        content: "分享图、PDF、复制链接和再次修改信息都应该常驻在结果页尾部，不因为打开分享弹层或切换别的功能而消失。"
      }
    ],
    essenceIcon: "✦",
    essenceTitle: "相处锦囊",
    essenceSub: "KEEP THE SPARK",
    essence: [
      "先讲感受，再讲结论。",
      "别让沉默代替确认。",
      "适合固定一次深聊时间。",
      "高情绪时先暂停十分钟。"
    ]
  },
  career: {
    heroTag: "CAREER ASTROLOGY · 事业解析",
    heroTitle: "你的事业节奏<br>该怎么发力",
    heroSub: "事业默认带入当前人的信息，也支持切换成手动填写新的分析对象。",
    flowTitle: "单人报告更适合看职业驱动力、适合岗位和未来 90 天发力点。",
    primaryTitle: "分析对象",
    submitText: "预览事业报告",
    coverBadge: "单人事业报告",
    coverTitleCn: "事业解析",
    coverTitleEn: "— Career Direction —",
    score: 86,
    scoreLabel: "CAREER INDEX",
    type: "执行型增长期",
    tagline: "这类报告更像职业策略书，而不是关系解读。",
    reportId: "预览编号 · PREVIEW-CAREER-01",
    coverLink: "▲",
    duo: false,
    metrics: [
      { label: "执行力", value: "91" },
      { label: "协作感", value: "78" },
      { label: "机会窗", value: "88" }
    ],
    summary: [
      "默认先带入当前人的资料，减少重复填写。",
      "如果用户想看别人的事业，比如合伙人或候选人，可以切到手动填写。",
      "结果页从双人封面切成单人封面，但底部分享和 PDF 入口继续保留。"
    ],
    chapters: [
      {
        emoji: "01",
        title: "你的事业驱动力",
        content: "这一版首页不再强调关系，而是把个人的推进节奏、压力反应和成就感来源放在最前面，让用户马上感知这是单人事业报告。"
      },
      {
        emoji: "02",
        title: "更适合的角色和赛道",
        content: "章节可以围绕管理、销售、内容、产品、咨询、创业等方向展开。真正接入时只需要让事业 prompt 输出对应的章节标题和建议。"
      },
      {
        emoji: "03",
        title: "未来 90 天发力点",
        content: "这一章适合给出短期行动清单，比如适合冲刺、适合布局、适合稳定积累的时间段，让报告有更直接的行动感。"
      }
    ],
    essenceIcon: "▲",
    essenceTitle: "发力清单",
    essenceSub: "MOVE WITH RHYTHM",
    essence: [
      "先定主赛道，再谈分心项。",
      "高曝光机会要主动抢。",
      "把复盘写成固定动作。",
      "别在低能量日做大决策。"
    ]
  },
  wealth: {
    heroTag: "WEALTH MAP · 财运洞察",
    heroTitle: "你的财运结构<br>适合怎么走",
    heroSub: "财运也是单人报告，默认复用当前人的资料，再决定要不要改成手动填写。",
    flowTitle: "更适合看赚钱方式、守财风险、副业机会和短期财务节奏。",
    primaryTitle: "分析对象",
    submitText: "预览财运报告",
    coverBadge: "单人财运报告",
    coverTitleCn: "财运洞察",
    coverTitleEn: "— Wealth Pattern —",
    score: 82,
    scoreLabel: "WEALTH INDEX",
    type: "稳进型累积期",
    tagline: "重点不只看能不能赚，还要看钱会从哪里来、怎么留得住。",
    reportId: "预览编号 · PREVIEW-WEALTH-01",
    coverLink: "¥",
    duo: false,
    metrics: [
      { label: "正财", value: "84" },
      { label: "偏财", value: "76" },
      { label: "守财力", value: "81" }
    ],
    summary: [
      "页面结构和事业相似，用户学习成本最低。",
      "区别主要在章节和封面语义，避免看起来像换皮。",
      "后续分享图和 PDF 文件名也应该跟着主题走，比如财运报告、事业报告。"
    ],
    chapters: [
      {
        emoji: "01",
        title: "你的赚钱方式",
        content: "这一类报告更适合先告诉用户，他是适合稳定累积、资源整合，还是适合在高波动机会中找增量。封面和分数标签也要跟着改成财运语义。"
      },
      {
        emoji: "02",
        title: "钱最容易漏掉的地方",
        content: "财运报告里需要一章专门解释守财和消费风险，让用户感觉这不是泛泛而谈的好运坏运，而是比较落地的资金习惯洞察。"
      },
      {
        emoji: "03",
        title: "未来 90 天的财务节奏",
        content: "这一章可以提示什么时候适合冲收入、什么时候适合做预算、什么时候适合保守观察，跟事业报告形成相近但不重复的节奏感。"
      }
    ],
    essenceIcon: "¥",
    essenceTitle: "招财提示",
    essenceSub: "BUILD AND KEEP",
    essence: [
      "先守现金流，再谈放大。",
      "赚钱和花钱分两套账户。",
      "副业优先选可复用能力。",
      "预算表要比热情更稳定。"
    ]
  }
};

const FORM_PRESETS = {
  current: {
    name: "Dewey",
    gender: "male",
    birthDate: "1986-12-10",
    birthTime: "14:30",
    birthPlace: "北京",
    zodiac: "射手 · 月双鱼 · 升狮子",
    symbol: "♐"
  },
  manualCareer: {
    name: "Luna",
    gender: "female",
    birthDate: "1994-04-18",
    birthTime: "09:20",
    birthPlace: "杭州",
    zodiac: "白羊 · 月处女 · 升天秤",
    symbol: "♈"
  },
  manualWealth: {
    name: "Milo",
    gender: "male",
    birthDate: "1991-09-26",
    birthTime: "11:10",
    birthPlace: "深圳",
    zodiac: "天秤 · 月金牛 · 升双子",
    symbol: "♎"
  },
  partnerA: {
    name: "Dewey",
    gender: "male",
    birthDate: "1986-12-10",
    birthTime: "14:30",
    birthPlace: "北京",
    zodiac: "射手 · 月双鱼 · 升狮子",
    symbol: "♐"
  },
  partnerB: {
    name: "Snow",
    gender: "female",
    birthDate: "1988-11-06",
    birthTime: "10:15",
    birthPlace: "上海",
    zodiac: "天蝎 · 月巨蟹 · 升水瓶",
    symbol: "♏"
  }
};

const YEARS = { start: 1975, end: 2005 };
let activeTheme = "love";
let activeSource = "current";
let shuffleIndex = 0;

const $ = (id) => document.getElementById(id);

function initDateSelects() {
  ["a", "b"].forEach((prefix) => {
    const year = $(`${prefix}-birthdate-year`);
    const month = $(`${prefix}-birthdate-month`);
    const day = $(`${prefix}-birthdate-day`);
    if (!year || year.options.length > 0) return;

    for (let y = YEARS.start; y <= YEARS.end; y += 1) {
      year.appendChild(new Option(String(y), String(y)));
    }
    for (let m = 1; m <= 12; m += 1) {
      month.appendChild(new Option(`${m}月`, String(m).padStart(2, "0")));
    }
    for (let d = 1; d <= 31; d += 1) {
      day.appendChild(new Option(`${d}日`, String(d).padStart(2, "0")));
    }
  });
}

function setDate(prefix, date) {
  const [year, month, day] = date.split("-");
  $(`${prefix}-birthdate-year`).value = year;
  $(`${prefix}-birthdate-month`).value = month;
  $(`${prefix}-birthdate-day`).value = day;
}

function setGender(prefix, gender) {
  $(`${prefix}-gender`).value = gender;
  document.querySelectorAll(`[data-target="${prefix}-gender"]`).forEach((button) => {
    button.classList.remove("active", "female");
    if (button.dataset.value === gender) {
      button.classList.add("active");
      if (gender === "female") button.classList.add("female");
    }
  });
}

function fillPerson(prefix, person, locked = false) {
  $(`${prefix}-name`).value = person.name;
  $(`${prefix}-birthtime`).value = person.birthTime;
  $(`${prefix}-birthplace`).value = person.birthPlace;
  setDate(prefix, person.birthDate);
  setGender(prefix, person.gender);

  [
    `${prefix}-name`,
    `${prefix}-birthdate-year`,
    `${prefix}-birthdate-month`,
    `${prefix}-birthdate-day`,
    `${prefix}-birthtime`,
    `${prefix}-birthplace`
  ].forEach((id) => {
    $(id).disabled = locked;
  });
  document.querySelectorAll(`[data-target="${prefix}-gender"]`).forEach((button) => {
    button.disabled = locked;
    button.classList.toggle("locked", locked);
  });
}

function applyThemeState() {
  const config = THEME_CONFIG[activeTheme];
  $("hero-tag").textContent = config.heroTag;
  $("hero-title").innerHTML = config.heroTitle;
  const heroSub = $("hero-sub");
  if (heroSub) heroSub.textContent = config.heroSub;
  $("flow-title").textContent = config.flowTitle;
  $("primary-title").textContent = config.primaryTitle;
  $("preview-btn").textContent = config.submitText;

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === activeTheme);
  });
  document.querySelectorAll(".mini-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === activeTheme);
  });

  const isLove = activeTheme === "love";
  $("source-card").classList.toggle("hidden", isLove);
  $("secondary-person").classList.toggle("hidden", !isLove);
  $("prefill-banner").classList.toggle("hidden", isLove || activeSource !== "current");

  if (isLove) {
    fillPerson("a", FORM_PRESETS.partnerA);
    fillPerson("b", FORM_PRESETS.partnerB);
  } else {
    const person = activeSource === "current"
      ? FORM_PRESETS.current
      : activeTheme === "career"
        ? FORM_PRESETS.manualCareer
        : FORM_PRESETS.manualWealth;
    fillPerson("a", person, activeSource === "current");
  }

  if ($("page-report").classList.contains("hidden")) return;
  renderReport();
}

function renderMetrics(metrics) {
  $("metric-row").innerHTML = metrics.map((item) => `
    <div class="metric-card">
      <div class="metric-value">${item.value}</div>
      <div class="metric-label">${item.label}</div>
    </div>
  `).join("");
}

function renderSummary(items) {
  $("summary-list").innerHTML = items.map((item) => `
    <div class="summary-item">${item}</div>
  `).join("");
}

function renderChapters(chapters) {
  $("chapters-container").innerHTML = chapters.map((chapter, index) => `
    <div class="chapter">
      <div class="chapter-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="chapter-head">
        <div class="chapter-emoji">${chapter.emoji}</div>
        <div class="chapter-title">${chapter.title}</div>
      </div>
      <div class="chapter-body">${chapter.content}</div>
    </div>
  `).join("");
}

function renderEssence(config) {
  $("essence-icon").textContent = config.essenceIcon;
  $("essence-title").textContent = config.essenceTitle;
  $("essence-sub").textContent = config.essenceSub;
  $("essence-list").innerHTML = config.essence.map((item, index) => `
    <li class="essence-item">
      <div class="essence-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="essence-copy">${item}</div>
    </li>
  `).join("");
}

function renderReport() {
  const config = THEME_CONFIG[activeTheme];
  const singleProfile = activeSource === "current"
    ? FORM_PRESETS.current
    : activeTheme === "career"
      ? FORM_PRESETS.manualCareer
      : FORM_PRESETS.manualWealth;

  $("cover-badge").textContent = config.coverBadge;
  $("cover-title-cn").textContent = config.coverTitleCn;
  $("cover-title-en").textContent = config.coverTitleEn;
  $("score-value").textContent = config.score;
  $("score-label").textContent = config.scoreLabel;
  $("report-type").textContent = config.type;
  $("tagline").textContent = config.tagline;
  $("report-id").textContent = config.reportId;
  $("cover-link").textContent = config.coverLink;

  $("cover-duo").classList.toggle("hidden", !config.duo);
  $("cover-single").classList.toggle("hidden", config.duo);

  if (config.duo) {
    $("cover-a-symbol").textContent = FORM_PRESETS.partnerA.symbol;
    $("cover-a-name").textContent = FORM_PRESETS.partnerA.name;
    $("cover-a-meta").textContent = FORM_PRESETS.partnerA.zodiac;
    $("cover-b-symbol").textContent = FORM_PRESETS.partnerB.symbol;
    $("cover-b-name").textContent = FORM_PRESETS.partnerB.name;
    $("cover-b-meta").textContent = FORM_PRESETS.partnerB.zodiac;
  } else {
    $("cover-single-symbol").textContent = singleProfile.symbol;
    $("cover-single-name").textContent = singleProfile.name;
    $("cover-single-meta").textContent = singleProfile.zodiac;
    $("cover-single-source").textContent = `资料来源 · ${activeSource === "current" ? "默认当前人" : "手动填写"}`;
  }

  renderMetrics(config.metrics);
  renderSummary(config.summary);
  renderChapters(config.chapters);
  renderEssence(config);
}

function switchPage(target) {
  $("page-form").classList.toggle("hidden", target !== "form");
  $("page-report").classList.toggle("hidden", target !== "report");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function cycleSamples() {
  shuffleIndex = (shuffleIndex + 1) % 2;
  if (activeTheme === "love") {
    const pair = shuffleIndex === 0
      ? [FORM_PRESETS.partnerA, FORM_PRESETS.partnerB]
      : [
          { name: "Ariel", gender: "female", birthDate: "1995-03-24", birthTime: "08:45", birthPlace: "成都", zodiac: "白羊 · 月双子 · 升射手", symbol: "♈" },
          { name: "Noah", gender: "male", birthDate: "1990-08-19", birthTime: "20:10", birthPlace: "广州", zodiac: "狮子 · 月摩羯 · 升天蝎", symbol: "♌" }
        ];
    fillPerson("a", pair[0]);
    fillPerson("b", pair[1]);
    return;
  }

  if (activeTheme === "career") {
    fillPerson("a", shuffleIndex === 0 ? FORM_PRESETS.current : FORM_PRESETS.manualCareer, activeSource === "current" && shuffleIndex === 0);
  } else {
    fillPerson("a", shuffleIndex === 0 ? FORM_PRESETS.current : FORM_PRESETS.manualWealth, activeSource === "current" && shuffleIndex === 0);
  }
}

function bindEvents() {
  document.querySelectorAll(".gender-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      setGender(button.dataset.target.replace("-gender", ""), button.dataset.value);
    });
  });

  document.querySelectorAll(".theme-option, .mini-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeTheme = button.dataset.theme;
      if (activeTheme === "love") activeSource = "current";
      applyThemeState();
    });
  });

  document.querySelectorAll(".source-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeSource = button.dataset.source;
      document.querySelectorAll(".source-option").forEach((item) => {
        item.classList.toggle("active", item.dataset.source === activeSource);
      });
      applyThemeState();
    });
  });

  $("prefill-edit-btn").addEventListener("click", () => {
    activeSource = "manual";
    document.querySelectorAll(".source-option").forEach((item) => {
      item.classList.toggle("active", item.dataset.source === activeSource);
    });
    applyThemeState();
  });

  $("preview-btn").addEventListener("click", () => {
    renderReport();
    switchPage("report");
  });
  $("back-btn").addEventListener("click", () => switchPage("form"));
  $("edit-btn").addEventListener("click", () => switchPage("form"));
  $("switch-btn").addEventListener("click", () => switchPage("form"));
  $("shuffle-btn").addEventListener("click", cycleSamples);

  $("share-btn").addEventListener("click", () => showToast("这里先演示结果页入口，正式接入时会保留分享图。"));
  $("pdf-btn").addEventListener("click", () => showToast("这里先演示结果页入口，正式接入时会保留 PDF。"));
}

initDateSelects();
bindEvents();
applyThemeState();
