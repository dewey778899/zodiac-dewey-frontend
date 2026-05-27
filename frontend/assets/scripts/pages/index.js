const API_BASE = (() => {
  if (!location.port || location.port === "80" || location.port === "443") return "";
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return location.port === "8080" ? "" : "http://localhost:8080";
  }
  if (/^(10\.|192\.168\.|172\.)/.test(location.hostname)) {
    return `http://${location.hostname}:8080`;
  }
  return "";
})();

const CITY_DATA_URL = "./assets/data/birth-place-coordinates.json";
const YEARS = { start: 1975, end: 2005 };
const DEFAULT_BIRTH_DATE = { year: "1990", month: "06", day: "15" };
const THEMES = ["love", "career", "wealth"];
const THEME_SLIDES = { love: 0, career: 1, wealth: 2 };

const THEME_COPY = {
  love: {
    heroTag: "LOVE REPORT · 灵魂合盘",
    heroTitle: "你和 TA<br>到底有多合",
    submitText: "解析我们的灵魂合盘",
    slideTitle: "爱情合盘",
    slideSub: "保留双人输入，重点看吸引力、冲突点和相处节奏。",
    coverTitleCn: "灵魂合盘",
    coverTitleEn: "The Cosmic Bond",
    scoreLabel: "SOULMATE INDEX"
  },
  career: {
    heroTag: "CAREER ASTROLOGY · 事业解读",
    heroTitle: "你的事业节奏<br>该怎么发力",
    submitText: "预览事业报告",
    slideTitle: "事业测算",
    slideSub: "重点看职业驱动力、岗位匹配和未来节奏。",
    coverTitleCn: "事业洞察",
    coverTitleEn: "Career Direction",
    scoreLabel: "CAREER INDEX"
  },
  wealth: {
    heroTag: "WEALTH MAP · 财运洞察",
    heroTitle: "你的财富结构<br>适合怎么走",
    submitText: "预览财运报告",
    slideTitle: "财运测算",
    slideSub: "重点看赚钱方式、守财节奏和副业机会。",
    coverTitleCn: "财运洞察",
    coverTitleEn: "Wealth Pattern",
    scoreLabel: "WEALTH INDEX"
  }
};

const LOADING_STEPS = [
  "正在校验出生信息",
  "正在计算星盘结构",
  "正在调用 AI 生成解读",
  "正在整理最终报告"
];

const DEFAULT_STATE = {
  love: {
    a: { name: "", gender: "male", birthDate: "1990-06-15", birthTime: "12:30", birthProvince: "", birthCity: "", birthDistrict: "" },
    b: { name: "", gender: "female", birthDate: "1990-06-15", birthTime: "12:30", birthProvince: "", birthCity: "", birthDistrict: "" }
  },
  career: {
    a: { name: "", gender: "female", birthDate: "1990-06-15", birthTime: "12:30", birthProvince: "", birthCity: "", birthDistrict: "" }
  },
  wealth: {
    a: { name: "", gender: "male", birthDate: "1990-06-15", birthTime: "12:30", birthProvince: "", birthCity: "", birthDistrict: "" }
  }
};

let activeTheme = "love";
let activeModel = "deepseek";
let activePayMethod = "wechat";
let cityIndex = new Map();
let currentLoadingTimer = null;
let currentProgress = 0;
let activeReport = null;

function $(id) {
  return document.getElementById(id);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const stateByTheme = clone(DEFAULT_STATE);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeServerValue(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(normalizeServerValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeServerValue(item)]));
  }
  return value;
}

function getThemeSlide(theme) {
  return document.querySelector(`.form-slide[data-theme="${theme}"]`);
}

function getThemeState(theme, personKey) {
  return stateByTheme[theme][personKey];
}

function setThemeState(theme, personKey, patch) {
  stateByTheme[theme][personKey] = { ...stateByTheme[theme][personKey], ...patch };
}

function getSlideControls(theme, personKey) {
  const slide = getThemeSlide(theme);
  if (!slide) return null;
  const section = slide.querySelector(`.person-section [data-person="${personKey}"]`)?.closest(".person-section");
  if (!section) return null;
  return {
    section,
    name: section.querySelector(`[data-person="${personKey}"][data-field="name"]`),
    genderButtons: [...section.querySelectorAll(`.gender-btn[data-person="${personKey}"]`)],
    year: section.querySelector(`[data-person="${personKey}"][data-field="birthYear"]`),
    month: section.querySelector(`[data-person="${personKey}"][data-field="birthMonth"]`),
    day: section.querySelector(`[data-person="${personKey}"][data-field="birthDay"]`),
    time: section.querySelector(`[data-person="${personKey}"][data-field="birthTime"]`),
    province: section.querySelector(`[data-person="${personKey}"][data-field="birthProvince"]`),
    city: section.querySelector(`[data-person="${personKey}"][data-field="birthCity"]`),
    district: section.querySelector(`[data-person="${personKey}"][data-field="birthDistrict"]`)
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseBirthDate(birthDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate || "");
  return match
    ? { year: match[1], month: match[2], day: match[3] }
    : { ...DEFAULT_BIRTH_DATE };
}

function composeBirthDate(year, month, day) {
  if (!year || !month || !day) return "";
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function composeBirthPlace(person) {
  return [person.birthProvince, person.birthCity, person.birthDistrict].filter(Boolean).join(" ");
}

function buildCityIndex(raw) {
  const map = new Map();
  Object.keys(raw || {}).forEach((key) => {
    const parts = key.trim().split(/\s+/);
    if (parts.length < 3) return;
    const [province, city, ...districtParts] = parts;
    const district = districtParts.join(" ");
    if (!province || !city || !district) return;
    if (!map.has(province)) map.set(province, new Map());
    const cityMap = map.get(province);
    if (!cityMap.has(city)) cityMap.set(city, []);
    const districts = cityMap.get(city);
    if (!districts.includes(district)) districts.push(district);
  });
  return map;
}

function getProvinces() {
  return [...cityIndex.keys()];
}

function getCities(province) {
  return province && cityIndex.has(province) ? [...cityIndex.get(province).keys()] : [];
}

function getDistricts(province, city) {
  return province && city && cityIndex.has(province) ? cityIndex.get(province).get(city) || [] : [];
}

function populateSelect(select, items, placeholder, selectedValue = "") {
  if (!select) return;
  select.innerHTML = [`<option value="">${placeholder}</option>`]
    .concat(items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`))
    .join("");
  if (selectedValue && items.includes(selectedValue)) {
    select.value = selectedValue;
  } else {
    select.value = "";
  }
  select.classList.toggle("is-selected", Boolean(select.value));
}

function populateDateSelects() {
  const years = Array.from({ length: YEARS.end - YEARS.start + 1 }, (_, index) => String(YEARS.start + index));
  const months = Array.from({ length: 12 }, (_, index) => pad2(index + 1));
  const days = Array.from({ length: 31 }, (_, index) => pad2(index + 1));

  document.querySelectorAll('[data-field="birthYear"]').forEach((select) => populateSelect(select, years, "年", DEFAULT_BIRTH_DATE.year));
  document.querySelectorAll('[data-field="birthMonth"]').forEach((select) => populateSelect(select, months, "月", DEFAULT_BIRTH_DATE.month));
  document.querySelectorAll('[data-field="birthDay"]').forEach((select) => populateSelect(select, days, "日", DEFAULT_BIRTH_DATE.day));
}

function applyFieldLabels(section, isSecondPerson) {
  const labels = section.querySelectorAll(".field-label");
  if (labels[0]) labels[0].textContent = isSecondPerson ? "TA 的名字(昵称)" : "名字(昵称)";
  if (labels[1]) labels[1].textContent = "性别";
  if (labels[2]) labels[2].textContent = "生日";
  if (labels[3]) labels[3].innerHTML = '出生时间 <span class="opt">(算月亮上升用)</span>';
  const province = section.querySelector(".province-field .field-label");
  const city = section.querySelector(".city-name-field .field-label");
  const district = section.querySelector(".district-field .field-label");
  if (province) province.textContent = "省份";
  if (city) city.textContent = "城市";
  if (district) district.textContent = "区县";
}

function refreshPlaceSelects(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  const person = getThemeState(theme, personKey);
  const provinces = getProvinces();
  populateSelect(controls.province, provinces, "省", person.birthProvince);

  const cities = getCities(controls.province.value || person.birthProvince);
  const nextCity = cities.includes(person.birthCity) ? person.birthCity : cities[0] || "";
  populateSelect(controls.city, cities, "市", nextCity);

  const districts = getDistricts(controls.province.value || person.birthProvince, controls.city.value || nextCity);
  const nextDistrict = districts.includes(person.birthDistrict) ? person.birthDistrict : districts[0] || "";
  populateSelect(controls.district, districts, "区/县", nextDistrict);

  setThemeState(theme, personKey, {
    birthProvince: controls.province.value,
    birthCity: controls.city.value,
    birthDistrict: controls.district.value
  });
}

function renderPerson(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  const person = getThemeState(theme, personKey);
  const date = parseBirthDate(person.birthDate);
  controls.name.value = person.name || "";
  controls.time.value = person.birthTime || "12:30";
  controls.year.value = date.year;
  controls.month.value = date.month;
  controls.day.value = date.day;
  controls.genderButtons.forEach((button) => {
    const active = button.dataset.value === person.gender;
    button.classList.toggle("active", active);
    button.classList.toggle("female", active && person.gender === "female");
    button.textContent = button.dataset.value === "female" ? "女生 ♀" : "男生 ♂";
  });
  applyFieldLabels(controls.section, theme === "love" && personKey === "b");
  refreshPlaceSelects(theme, personKey);
}

function renderThemeUI(theme) {
  const copy = THEME_COPY[theme];
  if (!copy) return;
  $("hero-tag").textContent = copy.heroTag;
  $("hero-title").innerHTML = copy.heroTitle;
  $("submit-btn").textContent = copy.submitText;
  $("theme-hint").textContent = theme === "love" ? "左右滑动切换不同主题" : "点击上方按钮切换到其他主题";

  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
  document.querySelectorAll(".slide-title").forEach((el) => {
    const slideTheme = el.closest(".form-slide")?.dataset.theme;
    if (slideTheme && THEME_COPY[slideTheme]) el.textContent = THEME_COPY[slideTheme].slideTitle;
  });
  document.querySelectorAll(".slide-sub").forEach((el) => {
    const slideTheme = el.closest(".form-slide")?.dataset.theme;
    if (slideTheme && THEME_COPY[slideTheme]) el.textContent = THEME_COPY[slideTheme].slideSub;
  });
  document.querySelectorAll(".model-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === activeModel);
    button.innerHTML = button.dataset.model === "deepseek"
      ? '免费版<span class="model-badge">· 基础解析</span>'
      : '深度解析<span class="model-badge">· Opus 4.7</span>';
  });
}

function adjustThemeIndicator() {
  const indicator = $("theme-tab-indicator");
  const nav = $("theme-nav");
  const activeButton = document.querySelector(`.theme-tab[data-theme="${activeTheme}"]`);
  if (!indicator || !nav || !activeButton) return;
  const navRect = nav.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  indicator.style.left = `${buttonRect.left - navRect.left}px`;
  indicator.style.width = `${buttonRect.width}px`;
}

function adjustSliderPosition() {
  const slides = $("form-slides");
  if (slides) slides.style.transform = `translateX(-${THEME_SLIDES[activeTheme] * 100}%)`;
}

function adjustSliderHeight() {
  const shell = document.querySelector(".form-slider-shell");
  const slide = getThemeSlide(activeTheme);
  if (shell && slide) shell.style.height = `${slide.offsetHeight}px`;
}

function renderTheme(theme) {
  activeTheme = THEME_COPY[theme] ? theme : "love";
  renderThemeUI(activeTheme);
  renderPerson(activeTheme, "a");
  if (activeTheme === "love") renderPerson(activeTheme, "b");
  adjustThemeIndicator();
  adjustSliderPosition();
  requestAnimationFrame(adjustSliderHeight);
}

function setModel(model) {
  activeModel = model === "deepseek" ? "deepseek" : "claude";
  renderThemeUI(activeTheme);
}

function promptDeepAnalysisPayment() {
  setModel("claude");
  closeModal("value-modal");
  openModal("pay-modal");
}

function getPayMethodCopy(method) {
  return method === "alipay"
    ? {
        image: "img/alipay_qr.jpg",
        buttonText: "用另一个手机支付宝扫码",
        hint: "19.9 元，调用anthropic顶级大模型4.7很贵，但是可以知道你想知道的",
        alt: "支付宝支付二维码"
      }
    : {
        image: "img/wechat_qr.jpg",
        buttonText: "用另一个手机微信扫码",
        hint: "19.9 元，调用anthropic顶级大模型4.7很贵，但是可以知道你想知道的",
        alt: "微信支付二维码"
      };
}

function updatePayMethodUI(method) {
  activePayMethod = method === "alipay" ? "alipay" : "wechat";
  const copy = getPayMethodCopy(activePayMethod);
  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.payMethod === activePayMethod);
  });
  const qr = $("pay-qr-img");
  if (qr) {
    qr.src = copy.image;
    qr.alt = copy.alt;
  }
  if ($("pay-open-btn")) $("pay-open-btn").textContent = copy.buttonText;
  if ($("pay-open-hint")) $("pay-open-hint").textContent = copy.hint;
}

function showFormError(message) {
  const box = $("form-error");
  if (!box) return;
  if (!message) {
    box.textContent = "";
    box.classList.add("hidden");
    return;
  }
  box.textContent = message;
  box.classList.remove("hidden");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function openModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;
  modal.classList.add("hidden");
  if (!document.querySelector(".modal-overlay:not(.hidden), .pay-modal-overlay:not(.hidden)")) {
    document.body.classList.remove("modal-open");
  }
}

function switchPage(page) {
  $("page-form").classList.toggle("hidden", page !== "form");
  $("page-loading").classList.toggle("hidden", page !== "loading");
  $("page-report").classList.toggle("hidden", page !== "report");
}

function renderLoadingSteps(activeIndex) {
  const container = $("loading-steps");
  if (!container) return;
  container.innerHTML = LOADING_STEPS.map((step, index) => {
    const state = index < activeIndex ? "completed" : index === activeIndex ? "active" : "pending";
    return `
      <div class="loading-step ${state}">
        <div class="loading-step-status">${String(index + 1).padStart(2, "0")}</div>
        <div class="loading-step-copy">
          <div class="loading-step-title">${escapeHtml(step)}</div>
          <div class="loading-step-sub">${state === "completed" ? "已完成" : state === "active" ? "正在处理..." : "等待中"}</div>
        </div>
      </div>
    `;
  }).join("");
}

function setLoadingProgress(percent, label) {
  currentProgress = percent;
  if ($("loading-progress-fill")) $("loading-progress-fill").style.width = `${percent}%`;
  if ($("loading-progress-value")) $("loading-progress-value").textContent = `${Math.round(percent)}%`;
  if ($("loading-progress-label") && label) $("loading-progress-label").textContent = label;
}

function startLoadingAnimation() {
  stopLoadingAnimation(0);
  let step = 0;
  renderLoadingSteps(step);
  setLoadingProgress(0, "准备开始...");
  currentLoadingTimer = window.setInterval(() => {
    const next = Math.min(currentProgress + 8, 92);
    if (next >= (step + 1) * 23 && step < LOADING_STEPS.length - 1) {
      step += 1;
      renderLoadingSteps(step);
    }
    setLoadingProgress(next, LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)]);
  }, 260);
}

function stopLoadingAnimation(finalProgress) {
  if (currentLoadingTimer) {
    clearInterval(currentLoadingTimer);
    currentLoadingTimer = null;
  }
  setLoadingProgress(finalProgress, finalProgress >= 100 ? "已完成" : "处理中...");
}

function buildPersonPayload(theme, personKey) {
  const person = getThemeState(theme, personKey);
  return {
    name: (person.name || "").trim(),
    gender: person.gender,
    birthDate: person.birthDate,
    birthTime: person.birthTime || "",
    birthPlace: composeBirthPlace(person)
  };
}

function validateThemeState(theme) {
  const personA = getThemeState(theme, "a");
  if (!personA.name.trim()) return "请填写名字";
  if (!personA.birthDate) return "请选择生日";
  if (!personA.birthProvince || !personA.birthCity || !personA.birthDistrict) return "请完整选择出生省市区";
  if (theme === "love") {
    const personB = getThemeState(theme, "b");
    if (!personB.name.trim()) return "请填写 TA 的名字";
    if (!personB.birthDate) return "请填写 TA 的生日";
    if (!personB.birthProvince || !personB.birthCity || !personB.birthDistrict) return "请完整选择 TA 的出生省市区";
    if (personA.gender === personB.gender) return "爱情合盘暂不支持同一性别，请选择一男一女";
  }
  return "";
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `请求失败 (${response.status})`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function getZodiacIcon(zodiac) {
  const icons = {
    白羊座: "♈", 金牛座: "♉", 双子座: "♊", 巨蟹座: "♋", 狮子座: "♌", 处女座: "♍",
    天秤座: "♎", 天蝎座: "♏", 射手座: "♐", 摩羯座: "♑", 水瓶座: "♒", 双鱼座: "♓"
  };
  return icons[zodiac] || "✦";
}

function renderZodiacDetails(report) {
  const container = $("zodiac-details");
  if (!container) return;
  const single = !report.zodiacB;
  container.innerHTML = `
    <div class="zd-head">
      <div class="zd-head-title">星盘详情</div>
      <div class="zd-head-sub">${single ? "SINGLE REPORT" : "DUO REPORT"}</div>
    </div>
    <div class="zd-grid ${single ? "single-report" : ""}">
      <div class="zd-person ${single ? "single-report" : ""}">
        <div class="zd-person-name">${escapeHtml(report.personA?.name || "A")}</div>
        <div class="zd-rows">
          <div class="zd-row"><span class="zd-label">太阳</span><span class="zd-value">${escapeHtml(report.zodiacA?.sun || "-")}</span></div>
          <div class="zd-row"><span class="zd-label">月亮</span><span class="zd-value">${escapeHtml(report.zodiacA?.moon || "-")}</span></div>
          <div class="zd-row"><span class="zd-label">上升</span><span class="zd-value">${escapeHtml(report.zodiacA?.rising || "-")}</span></div>
        </div>
      </div>
      ${single ? "" : `
        <div class="zd-divider"></div>
        <div class="zd-person">
          <div class="zd-person-name">${escapeHtml(report.personB?.name || "B")}</div>
          <div class="zd-rows">
            <div class="zd-row"><span class="zd-label">太阳</span><span class="zd-value">${escapeHtml(report.zodiacB?.sun || "-")}</span></div>
            <div class="zd-row"><span class="zd-label">月亮</span><span class="zd-value">${escapeHtml(report.zodiacB?.moon || "-")}</span></div>
            <div class="zd-row"><span class="zd-label">上升</span><span class="zd-value">${escapeHtml(report.zodiacB?.rising || "-")}</span></div>
          </div>
        </div>
      `}
    </div>
  `;
}

function renderChapters(report) {
  const container = $("chapters-container");
  if (!container) return;
  const chapters = Array.isArray(report.chapters) ? report.chapters : [];
  container.innerHTML = chapters.map((chapter, index) => `
    <div class="chapter">
      <div class="chapter-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="chapter-head">
        <div class="chapter-emoji">${escapeHtml(chapter.emoji || "✦")}</div>
        <div class="chapter-title">${escapeHtml(chapter.title || "")}</div>
      </div>
      <div class="chapter-body">${escapeHtml(chapter.content || "")}</div>
    </div>
  `).join("");
}

function renderEssence(report) {
  if ($("essence-list")) {
    $("essence-list").innerHTML = (report.essence || []).map((item, index) => `
      <li class="essence-item">
        <div class="essence-num">${String(index + 1).padStart(2, "0")}</div>
        <div class="essence-copy">${escapeHtml(item)}</div>
      </li>
    `).join("");
  }
}

function renderReport(rawReport) {
  const report = normalizeServerValue(rawReport || {});
  activeReport = report;
  const reportType = THEMES.includes(report.reportType) ? report.reportType : activeTheme;
  const copy = THEME_COPY[reportType];
  $("cover-title-cn").textContent = copy.coverTitleCn;
  $("cover-title-en").textContent = copy.coverTitleEn;
  $("cover-score-label").textContent = copy.scoreLabel;
  $("cover-score").textContent = report.score ?? "--";
  $("cover-type").textContent = report.relationshipType || "关系类型";
  $("cover-tagline").textContent = report.tagline || "";
  $("cover-id").textContent = report.reportUid || "NO. SASC-000000-PF4E";
  $("cover-date").textContent = new Date().toLocaleString("zh-CN");
  $("cover-person-a").textContent = report.personA?.name || "—";
  $("cover-person-b").textContent = report.personB?.name || "—";
  $("cover-zodiac-a-name").textContent = report.zodiacA?.sun || "—";
  $("cover-zodiac-b-name").textContent = report.zodiacB?.sun || "—";
  $("cover-zodiac-a-icon").textContent = getZodiacIcon(report.zodiacA?.sun);
  $("cover-zodiac-b-icon").textContent = report.zodiacB ? getZodiacIcon(report.zodiacB?.sun) : "";
  $("cover-zodiac-row").classList.toggle("single-report", !report.zodiacB);
  renderZodiacDetails(report);
  renderChapters(report);
  renderEssence(report);
  stopLoadingAnimation(100);
  switchPage("report");
}

async function submitForm() {
  showFormError("");
  const validation = validateThemeState(activeTheme);
  if (validation) {
    showFormError(validation);
    return;
  }

  if (activeModel === "claude") {
    openModal("pay-modal");
    return;
  }

  const request = {
    personA: buildPersonPayload(activeTheme, "a"),
    model: activeModel,
    reportType: activeTheme
  };
  if (activeTheme === "love") request.personB = buildPersonPayload(activeTheme, "b");

  switchPage("loading");
  startLoadingAnimation();
  try {
    const report = await fetchJSON("/api/compatibility", {
      method: "POST",
      body: JSON.stringify(request)
    });
    renderReport(report);
  } catch (error) {
    stopLoadingAnimation(0);
    switchPage("form");
    showFormError(error.message || "生成失败，请稍后再试");
  }
}

function syncBirthDate(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  setThemeState(theme, personKey, {
    birthDate: composeBirthDate(controls.year.value, controls.month.value, controls.day.value)
  });
}

function bindFormEvents() {
  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.addEventListener("click", () => renderTheme(button.dataset.theme));
  });

  document.querySelectorAll(".person-input, .person-select").forEach((element) => {
    const eventName = element.tagName === "SELECT" || element.type === "time" ? "change" : "input";
    element.addEventListener(eventName, () => {
      const slide = element.closest(".form-slide");
      const theme = slide?.dataset.theme;
      const personKey = element.dataset.person;
      const field = element.dataset.field;
      if (!theme || !personKey || !field) return;

      if (field === "name" || field === "birthTime") {
        setThemeState(theme, personKey, { [field]: element.value });
      } else if (field === "birthYear" || field === "birthMonth" || field === "birthDay") {
        syncBirthDate(theme, personKey);
      } else if (field === "birthProvince") {
        setThemeState(theme, personKey, { birthProvince: element.value, birthCity: "", birthDistrict: "" });
        refreshPlaceSelects(theme, personKey);
      } else if (field === "birthCity") {
        setThemeState(theme, personKey, { birthCity: element.value, birthDistrict: "" });
        refreshPlaceSelects(theme, personKey);
      } else if (field === "birthDistrict") {
        setThemeState(theme, personKey, { birthDistrict: element.value });
        element.classList.toggle("is-selected", Boolean(element.value));
      }
    });
  });

  document.querySelectorAll(".gender-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.closest(".form-slide")?.dataset.theme;
      const personKey = button.dataset.person;
      if (!theme || !personKey) return;
      setThemeState(theme, personKey, { gender: button.dataset.value });
      renderPerson(theme, personKey);
    });
  });

  document.querySelectorAll(".model-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.model === "claude") {
        openModal("value-modal");
      } else {
        setModel("deepseek");
      }
    });
  });

  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.addEventListener("click", () => updatePayMethodUI(button.dataset.payMethod));
  });

  $("submit-btn")?.addEventListener("click", submitForm);
  $("restart-btn")?.addEventListener("click", () => {
    activeReport = null;
    switchPage("form");
    renderTheme(activeTheme);
  });
  $("copy-link-btn")?.addEventListener("click", () => {
    if (!activeReport?.reportUid) return showToast("暂无可分享链接");
    const url = `${location.origin}${location.pathname}?uid=${encodeURIComponent(activeReport.reportUid)}`;
    navigator.clipboard.writeText(url).then(() => showToast("分享链接已复制")).catch(() => showToast(url));
  });

  $("share-btn")?.addEventListener("click", () => openModal("share-modal"));
  $("share-close")?.addEventListener("click", () => closeModal("share-modal"));
  $("share-download")?.addEventListener("click", () => closeModal("share-modal"));
  $("pdf-btn")?.addEventListener("click", () => showToast("PDF 导出稍后接入"));

  $("value-modal-close")?.addEventListener("click", () => closeModal("value-modal"));
  $("value-modal-pay-btn")?.addEventListener("click", promptDeepAnalysisPayment);
  $("value-modal-free-btn")?.addEventListener("click", () => {
    setModel("deepseek");
    closeModal("value-modal");
  });

  $("pay-modal-close")?.addEventListener("click", () => closeModal("pay-modal"));
  $("pay-open-btn")?.addEventListener("click", () => showToast(activePayMethod === "alipay" ? "请用支付宝扫码支付" : "请用微信扫码支付"));
  $("pay-confirm-btn")?.addEventListener("click", () => { closeModal("pay-modal"); showToast("支付确认流程稍后接入"); });

  $("city-picker-close")?.addEventListener("click", () => closeModal("city-picker-modal"));
  $("city-picker-clear")?.addEventListener("click", () => closeModal("city-picker-modal"));
  $("city-picker-confirm")?.addEventListener("click", () => closeModal("city-picker-modal"));

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains("modal-overlay") || target.classList.contains("pay-modal-overlay")) {
      target.classList.add("hidden");
      if (!document.querySelector(".modal-overlay:not(.hidden), .pay-modal-overlay:not(.hidden)")) {
        document.body.classList.remove("modal-open");
      }
    }
  });
}

async function loadCityData() {
  const response = await fetch(CITY_DATA_URL);
  if (!response.ok) throw new Error("无法加载省市区数据");
  cityIndex = buildCityIndex(await response.json());
}

async function loadSharedReport(uid) {
  const report = await fetchJSON(`/api/compatibility/report/${encodeURIComponent(uid)}`);
  renderReport(report);
}

async function init() {
  document.title = "灵魂合盘 · 你和 TA 的缘分密码 · 小登哥出品";
  populateDateSelects();
  await loadCityData();
  bindFormEvents();
  THEMES.forEach((theme) => {
    renderPerson(theme, "a");
    if (theme === "love") renderPerson(theme, "b");
  });
  updatePayMethodUI(activePayMethod);
  renderTheme(activeTheme);

  window.addEventListener("resize", () => {
    adjustThemeIndicator();
    adjustSliderHeight();
  });

  const sharedUid = new URLSearchParams(location.search).get("uid");
  if (sharedUid) await loadSharedReport(sharedUid);
}

init().catch((error) => {
  console.error(error);
  showFormError(error.message || "页面初始化失败");
});