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
const PAY_AMOUNT_FEN = 1990;
const PAY_POLL_INTERVAL_MS = 3000;
const PAY_POLL_TIMEOUT_MS = 180000;

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
    submitText: "生成事业报告",
    slideTitle: "事业测算",
    slideSub: "重点看职业驱动力、岗位匹配和未来节奏。",
    coverTitleCn: "事业洞察",
    coverTitleEn: "Career Direction",
    scoreLabel: "CAREER INDEX"
  },
  wealth: {
    heroTag: "WEALTH MAP · 财运洞察",
    heroTitle: "你的财富结构<br>适合怎么走",
    submitText: "生成财运报告",
    slideTitle: "财运测算",
    slideSub: "重点看赚钱方式、守财节奏和副业机会。",
    coverTitleCn: "财运洞察",
    coverTitleEn: "Wealth Pattern",
    scoreLabel: "WEALTH INDEX"
  }
};

const LOADING_STEPS = [
  "校对出生信息",
  "生成星盘结构",
  "解析关系能量",
  "整理最终报告"
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

const paymentState = {
  outTradeNo: "",
  channel: "wechat",
  scene: "",
  status: "",
  accessToken: "",
  payPayload: null,
  expireAt: "",
  pollTimer: null,
  pollStartedAt: 0
};

let activeTheme = "love";
let activeModel = "deepseek";
let activePayMethod = "wechat";
let cityIndex = new Map();
let currentLoadingTimer = null;
let currentProgress = 0;
let latestReport = null;

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

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.message || `请求失败 (${resp.status})`);
  }
  return data;
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
  return match ? { year: match[1], month: match[2], day: match[3] } : { ...DEFAULT_BIRTH_DATE };
}

function composeBirthDate(year, month, day) {
  return year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : "";
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
  select.value = selectedValue && items.includes(selectedValue) ? selectedValue : "";
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

function refreshPlaceSelects(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  const person = getThemeState(theme, personKey);
  populateSelect(controls.province, getProvinces(), "省", person.birthProvince);
  const cities = getCities(controls.province.value || person.birthProvince);
  populateSelect(controls.city, cities, "市", person.birthCity);
  const districts = getDistricts(controls.province.value || person.birthProvince, controls.city.value || person.birthCity);
  populateSelect(controls.district, districts, "区/县", person.birthDistrict);
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
  });
  refreshPlaceSelects(theme, personKey);
}

function adjustThemeIndicator() {
  const nav = $("theme-nav");
  const indicator = $("theme-tab-indicator");
  const activeTab = nav?.querySelector(`.theme-tab[data-theme="${activeTheme}"]`);
  if (!nav || !indicator || !activeTab) return;
  indicator.style.width = `${activeTab.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
}

function adjustSliderPosition() {
  const slides = $("form-slides");
  if (slides) slides.style.transform = `translateX(-${THEME_SLIDES[activeTheme] * 100}%)`;
}

function adjustSliderHeight() {
  const slides = $("form-slides");
  const slide = getThemeSlide(activeTheme);
  if (slides && slide) slides.style.height = `${slide.offsetHeight}px`;
}

function renderTheme(theme) {
  activeTheme = THEME_COPY[theme] ? theme : "love";
  const copy = THEME_COPY[activeTheme];
  $("hero-tag").textContent = copy.heroTag;
  $("hero-title").innerHTML = copy.heroTitle;
  $("submit-btn").textContent = copy.submitText;
  $("theme-hint").textContent = activeTheme === "love" ? "左右滑动切换不同主题" : "左右滑动查看不同主题内容";
  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === activeTheme);
  });
  document.querySelectorAll(".slide-title").forEach((el) => {
    const themeCode = el.closest(".form-slide")?.dataset.theme;
    if (themeCode) el.textContent = THEME_COPY[themeCode].slideTitle;
  });
  document.querySelectorAll(".slide-sub").forEach((el) => {
    const themeCode = el.closest(".form-slide")?.dataset.theme;
    if (themeCode) el.textContent = THEME_COPY[themeCode].slideSub;
  });
  renderPerson(activeTheme, "a");
  if (activeTheme === "love") renderPerson(activeTheme, "b");
  adjustThemeIndicator();
  adjustSliderPosition();
  requestAnimationFrame(adjustSliderHeight);
}

function setModel(model) {
  activeModel = model === "claude" ? "claude" : "deepseek";
  document.querySelectorAll(".model-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === activeModel);
  });
}

function updatePayMethodUI(method) {
  activePayMethod = method === "alipay" ? "alipay" : "wechat";
  paymentState.channel = activePayMethod;
  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.payMethod === activePayMethod);
  });
}

function showFormError(message) {
  const box = $("form-error");
  if (!box) return;
  box.textContent = message || "";
  box.classList.toggle("hidden", !message);
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
  $("page-form")?.classList.toggle("hidden", page !== "form");
  $("page-loading")?.classList.toggle("hidden", page !== "loading");
  $("page-report")?.classList.toggle("hidden", page !== "report");
}

function renderLoadingSteps(activeIndex) {
  const container = $("loading-steps");
  if (!container) return;
  container.innerHTML = LOADING_STEPS.map((step, index) => {
    const state = index < activeIndex ? "completed" : index === activeIndex ? "active" : "pending";
    const mark = index < activeIndex ? "✓" : String(index + 1).padStart(2, "0");
    const sub = state === "completed" ? "已完成" : state === "active" ? "正在处理中..." : "等待执行";
    return `<div class="loading-step ${state}"><div class="loading-step-status">${mark}</div><div class="loading-step-copy"><div class="loading-step-title">${escapeHtml(step)}</div><div class="loading-step-sub">${sub}</div></div></div>`;
  }).join("");
}

function setLoadingProgress(percent, label) {
  currentProgress = percent;
  if ($("loading-progress-fill")) $("loading-progress-fill").style.width = `${percent}%`;
  if ($("loading-progress-value")) $("loading-progress-value").textContent = `${Math.round(percent)}%`;
  if ($("loading-progress-label")) $("loading-progress-label").textContent = label;
}

function startLoadingAnimation() {
  stopLoadingAnimation(0);
  let step = 0;
  renderLoadingSteps(step);
  setLoadingProgress(0, "准备开始...");
  currentLoadingTimer = window.setInterval(() => {
    const next = Math.min(currentProgress + 7, 92);
    if (next >= (step + 1) * 23 && step < LOADING_STEPS.length - 1) {
      step += 1;
      renderLoadingSteps(step);
    }
    setLoadingProgress(next, LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)]);
  }, 420);
}

function stopLoadingAnimation(finalProgress) {
  if (currentLoadingTimer) clearInterval(currentLoadingTimer);
  currentLoadingTimer = null;
  setLoadingProgress(finalProgress, finalProgress >= 100 ? "已完成" : "处理中...");
}

function syncBirthDate(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  setThemeState(theme, personKey, {
    birthDate: composeBirthDate(controls.year.value, controls.month.value, controls.day.value)
  });
}

function slugTheme(theme) {
  if (theme === "career") return "career";
  if (theme === "wealth") return "wealth";
  return "love";
}

function getClientContext() {
  const ua = navigator.userAgent || "";
  return {
    deviceToken: localStorage.getItem("zodiac_device_token") || ensureDeviceToken(),
    userAgent: ua,
    source: location.href,
    insideWechat: /MicroMessenger/i.test(ua),
    mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  };
}

function ensureDeviceToken() {
  const existing = localStorage.getItem("zodiac_device_token");
  if (existing) return existing;
  const token = `dev-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  localStorage.setItem("zodiac_device_token", token);
  return token;
}

function inferWechatScene() {
  const ua = navigator.userAgent || "";
  const insideWechat = /MicroMessenger/i.test(ua);
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  if (insideWechat) return "wechat_jsapi";
  if (mobile) return "wechat_h5";
  return "wechat_native";
}

function inferChannelAndScene() {
  if (activePayMethod === "alipay") {
    return { channel: "alipay", scene: "alipay_wap" };
  }
  return { channel: "wechat", scene: inferWechatScene() };
}

function normalizeName(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function resolveCoords(person) {
  const key = composeBirthPlace(person).trim();
  const item = key ? cityIndex.get?.(key) : null;
  return item ? { lat: item.lat, lng: item.lng } : null;
}

function buildPersonPayload(person, fallbackName) {
  const birthPlace = composeBirthPlace(person);
  const coords = resolveCoords(person);
  return {
    name: normalizeName(person.name, fallbackName),
    gender: person.gender,
    birthDate: person.birthDate,
    birthTime: person.birthTime || "12:30",
    birthPlace,
    birthLatitude: coords?.lat ?? null,
    birthLongitude: coords?.lng ?? null,
    birthTimezone: "Asia/Shanghai"
  };
}

function buildCompatibilityPayload(model) {
  const theme = slugTheme(activeTheme);
  const payload = {
    model,
    reportType: theme,
    personA: buildPersonPayload(stateByTheme[activeTheme].a, activeTheme === "love" ? "你" : "我的名字")
  };
  if (activeTheme === "love") {
    payload.personB = buildPersonPayload(stateByTheme[activeTheme].b, "TA的名字");
  }
  if (model === "claude" && paymentState.accessToken) {
    payload.accessToken = paymentState.accessToken;
  }
  return payload;
}

function validateCurrentForm() {
  const a = stateByTheme[activeTheme].a;
  if (!a.name.trim()) return "请先填写名字";
  if (!a.birthProvince || !a.birthCity || !a.birthDistrict) return "请完整选择出生城市";
  if (activeTheme === "love") {
    const b = stateByTheme[activeTheme].b;
    if (!b.name.trim()) return "请先填写 TA 的名字";
    if (!b.birthProvince || !b.birthCity || !b.birthDistrict) return "请完整选择 TA 的出生城市";
  }
  return "";
}

function resetPaymentState() {
  if (paymentState.pollTimer) clearInterval(paymentState.pollTimer);
  paymentState.outTradeNo = "";
  paymentState.scene = "";
  paymentState.status = "";
  paymentState.accessToken = "";
  paymentState.payPayload = null;
  paymentState.expireAt = "";
  paymentState.pollTimer = null;
  paymentState.pollStartedAt = 0;
}

function setPayStatus(text, success = false) {
  const el = $("pay-status-text");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("success", success);
}

function setPayLoading(loading) {
  $("pay-qr-loading")?.classList.toggle("hidden", !loading);
}

function setPayQrImage(src) {
  const img = $("pay-qr-img");
  if (!img) return;
  img.src = src || "";
  img.classList.toggle("hidden", !src);
}

function renderPaymentModal(order) {
  paymentState.outTradeNo = order.outTradeNo || "";
  paymentState.status = order.status || "";
  paymentState.channel = order.channel || activePayMethod;
  paymentState.scene = order.scene || "";
  paymentState.expireAt = order.expireAt || "";
  paymentState.payPayload = order.payPayload || null;
  $("pay-order-no").textContent = paymentState.outTradeNo || "—";
  setPayLoading(false);
  setPayQrImage("");

  const payload = paymentState.payPayload || {};
  const openBtn = $("pay-open-btn");
  const hint = $("pay-open-hint");
  const qrTitle = $("pay-qr-title");

  if (paymentState.channel === "wechat") {
    if (payload.mode === "JSAPI") {
      openBtn.textContent = "打开微信支付";
      hint.textContent = "当前处于微信内，将使用微信官方支付拉起。";
      qrTitle.textContent = "微信内支付无需二维码";
      setPayStatus("订单已创建，请点击按钮拉起微信支付");
    } else if (payload.mode === "H5") {
      openBtn.textContent = "打开微信支付";
      hint.textContent = "当前为手机浏览器，将跳转微信 H5 支付。";
      qrTitle.textContent = "如果无法跳转，也可在电脑上使用二维码兜底";
      setPayStatus("订单已创建，请点击按钮前往微信支付");
    } else {
      openBtn.textContent = "刷新微信支付二维码";
      hint.textContent = "当前环境使用微信 Native 二维码支付。";
      qrTitle.textContent = "请使用微信扫码支付";
      if (payload.codeUrl) {
        setPayQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload.codeUrl)}`);
      }
      setPayStatus("订单已创建，请扫码支付");
    }
  } else {
    openBtn.textContent = "打开支付宝支付";
    hint.textContent = "将通过支付宝 WAP 官方支付链路完成付款。";
    qrTitle.textContent = "手机可直接打开支付宝，电脑端可用下方二维码兜底";
    if (payload.payUrl) {
      setPayQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload.payUrl)}`);
    }
    setPayStatus("订单已创建，请点击按钮前往支付宝支付");
  }
}

async function createPaymentOrder() {
  setPayLoading(true);
  setPayStatus("正在创建支付订单...");
  $("pay-order-no").textContent = "—";
  const { channel, scene } = inferChannelAndScene();
  const order = await api("/api/pay/orders", {
    method: "POST",
    body: JSON.stringify({
      channel,
      scene,
      reportType: slugTheme(activeTheme),
      amountFen: PAY_AMOUNT_FEN,
      subject: activeTheme === "love" ? "深度解析灵魂合盘" : activeTheme === "career" ? "深度解析事业报告" : "深度解析财运报告",
      returnUrl: location.href,
      clientContext: getClientContext()
    })
  });
  renderPaymentModal(order);
  startPollingPaymentStatus();
}

function stopPaymentPolling() {
  if (paymentState.pollTimer) clearInterval(paymentState.pollTimer);
  paymentState.pollTimer = null;
}

function startPollingPaymentStatus() {
  stopPaymentPolling();
  paymentState.pollStartedAt = Date.now();
  paymentState.pollTimer = window.setInterval(async () => {
    if (!paymentState.outTradeNo) return;
    if (Date.now() - paymentState.pollStartedAt > PAY_POLL_TIMEOUT_MS) {
      stopPaymentPolling();
      setPayStatus("轮询超时，你支付完成后仍可点击“我已支付，立即检查”");
      return;
    }
    try {
      const status = await api(`/api/pay/orders/${paymentState.outTradeNo}`);
      applyPaymentStatus(status);
    } catch {}
  }, PAY_POLL_INTERVAL_MS);
}

function applyPaymentStatus(status) {
  paymentState.status = status.status || paymentState.status;
  if (status.accessToken) paymentState.accessToken = status.accessToken;
  if (status.paid && status.accessToken) {
    stopPaymentPolling();
    setPayStatus("支付成功，深度解析凭证已就绪", true);
    $("pay-order-hint").textContent = "支付已到账，现在可以继续生成深度解析。";
    $("pay-confirm-btn").textContent = "进入深度解析";
  }
}

async function checkPaymentStatusNow() {
  if (!paymentState.outTradeNo) {
    throw new Error("请先创建支付订单");
  }
  const status = await api(`/api/pay/orders/${paymentState.outTradeNo}`);
  applyPaymentStatus(status);
  if (!status.paid || !status.accessToken) {
    throw new Error("订单仍未支付成功，请完成支付后再试");
  }
}

async function openPaymentGateway() {
  const payload = paymentState.payPayload || {};
  if (paymentState.channel === "wechat") {
    if (payload.mode === "JSAPI") {
      setPayStatus("微信 JSAPI 参数已生成，请在正式微信环境中拉起支付");
      return;
    }
    if (payload.mwebUrl) {
      window.location.href = payload.mwebUrl;
      return;
    }
    if (payload.codeUrl) {
      setPayStatus("请使用微信扫码支付");
      return;
    }
  }
  if (paymentState.channel === "alipay" && payload.payUrl) {
    window.location.href = payload.payUrl;
    return;
  }
  throw new Error("当前支付方式尚未返回可用的支付入口");
}

function buildReportId(reportUid) {
  const core = String(reportUid || "").slice(-8).toUpperCase();
  return `珍藏编号 · ZD-${core || "PREVIEW"}-OP47`;
}

function zodiacText(info) {
  if (!info) return "—";
  return [info.sun, info.moon, info.rising].filter(Boolean).join(" · ");
}

function chapterEmoji(index) {
  return String(index + 1).padStart(2, "0");
}

function renderReport(response) {
  latestReport = response;
  const themeCopy = THEME_COPY[slugTheme(response.reportType)];
  $("cover-title-cn").textContent = themeCopy?.coverTitleCn || "深度报告";
  $("cover-title-en").textContent = themeCopy?.coverTitleEn || "Premium Reading";
  $("cover-score").textContent = response.score ?? "--";
  $("cover-score-label").textContent = themeCopy?.scoreLabel || "REPORT INDEX";
  $("cover-type").textContent = response.relationshipType || "关系洞察";
  $("cover-tagline").textContent = response.tagline || "愿你更了解自己，也更从容地做选择。";
  $("cover-id").textContent = buildReportId(response.reportUid);
  $("cover-date").textContent = new Date().toLocaleDateString("zh-CN");
  $("cover-person-a").textContent = response.personA?.name || stateByTheme[activeTheme].a.name || "你";
  $("cover-zodiac-a-name").textContent = (response.zodiacA?.sun || "SUN").toUpperCase();
  $("cover-zodiac-a-icon").textContent = "✦";

  const isLove = response.reportType === "love";
  $("cover-zodiac-b-block").style.display = isLove ? "" : "none";
  $("cover-heart").style.display = isLove ? "" : "none";
  if (isLove) {
    $("cover-person-b").textContent = response.personB?.name || stateByTheme[activeTheme].b.name || "TA";
    $("cover-zodiac-b-name").textContent = (response.zodiacB?.sun || "MOON").toUpperCase();
    $("cover-zodiac-b-icon").textContent = "✦";
  }

  $("zodiac-details").innerHTML = `
    <div class="chapter-head">
      <div class="chapter-emoji">✧</div>
      <div class="chapter-title">星盘重点</div>
    </div>
    <div class="chapter-body">
      <strong>${escapeHtml(response.personA?.name || "你")}</strong>：${escapeHtml(zodiacText(response.zodiacA))}<br>
      ${isLove ? `<strong>${escapeHtml(response.personB?.name || "TA")}</strong>：${escapeHtml(zodiacText(response.zodiacB))}` : ""}
    </div>
  `;

  $("chapters-container").innerHTML = (response.chapters || []).map((chapter, index) => `
    <div class="chapter">
      <div class="chapter-num">${chapterEmoji(index)}</div>
      <div class="chapter-head">
        <div class="chapter-emoji">${escapeHtml(chapter.emoji || "✦")}</div>
        <div class="chapter-title">${escapeHtml(chapter.title || `章节 ${index + 1}`)}</div>
      </div>
      <div class="chapter-body">${escapeHtml(chapter.content || "").replaceAll("\n", "<br>")}</div>
    </div>
  `).join("");

  $("essence-list").innerHTML = (response.essence || []).map((item, index) => `
    <li class="essence-item">
      <div class="essence-item-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="essence-item-text">${escapeHtml(item)}</div>
    </li>
  `).join("");

  $("action-bar-sub").textContent = response.reportType === "love" ? "珍藏这份属于你们的关系报告" : "珍藏这份属于你的专属报告";
}

async function generateReport(model) {
  const payload = buildCompatibilityPayload(model);
  switchPage("loading");
  startLoadingAnimation();
  try {
    const response = await api("/api/compatibility", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    stopLoadingAnimation(100);
    renderReport(response);
    switchPage("report");
  } catch (error) {
    stopLoadingAnimation(0);
    switchPage("form");
    throw error;
  }
}

async function handleSubmit() {
  showFormError("");
  const validationError = validateCurrentForm();
  if (validationError) {
    showFormError(validationError);
    return;
  }
  if (activeModel === "claude") {
    openModal("value-modal");
    return;
  }
  try {
    await generateReport("deepseek");
  } catch (error) {
    showFormError(error.message || "生成失败");
  }
}

async function beginPremiumFlow() {
  closeModal("value-modal");
  resetPaymentState();
  updatePayMethodUI(inferChannelAndScene().channel);
  openModal("pay-modal");
  try {
    await createPaymentOrder();
  } catch (error) {
    setPayLoading(false);
    setPayStatus(error.message || "创建支付订单失败");
  }
}

async function enterPremiumReport() {
  try {
    await checkPaymentStatusNow();
    closeModal("pay-modal");
    await generateReport("claude");
  } catch (error) {
    setPayStatus(error.message || "支付校验失败");
  }
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
        setModel("claude");
        openModal("value-modal");
      } else {
        setModel("deepseek");
      }
    });
  });

  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.addEventListener("click", async () => {
      updatePayMethodUI(button.dataset.payMethod);
      resetPaymentState();
      try {
        await createPaymentOrder();
      } catch (error) {
        setPayStatus(error.message || "创建支付订单失败");
      }
    });
  });

  $("submit-btn")?.addEventListener("click", handleSubmit);
  $("share-close")?.addEventListener("click", () => closeModal("share-modal"));
  $("pay-modal-close")?.addEventListener("click", () => {
    stopPaymentPolling();
    closeModal("pay-modal");
  });
  $("value-modal-close")?.addEventListener("click", () => closeModal("value-modal"));
  $("city-picker-close")?.addEventListener("click", () => closeModal("city-picker-modal"));
  $("value-modal-pay-btn")?.addEventListener("click", beginPremiumFlow);
  $("value-modal-free-btn")?.addEventListener("click", () => {
    setModel("deepseek");
    closeModal("value-modal");
  });
  $("pay-open-btn")?.addEventListener("click", async () => {
    try {
      await openPaymentGateway();
    } catch (error) {
      setPayStatus(error.message || "暂时无法打开支付入口");
    }
  });
  $("pay-confirm-btn")?.addEventListener("click", enterPremiumReport);
  $("restart-btn")?.addEventListener("click", () => {
    latestReport = null;
    switchPage("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("copy-link-btn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showFormError("链接已复制");
      setTimeout(() => showFormError(""), 1500);
    } catch {}
  });
  $("share-btn")?.addEventListener("click", () => openModal("share-modal"));
  $("pdf-btn")?.addEventListener("click", () => window.print());

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
  const raw = await response.json();
  cityIndex = buildCityIndex(raw);
  cityIndex.get = function getValue(key) {
    return raw[key];
  };
}

async function init() {
  document.title = "灵魂合盘 · 你和 TA 的缘分密码 · 小登哥出品";
  populateDateSelects();
  bindFormEvents();
  try {
    await loadCityData();
  } catch (error) {
    showFormError(error.message || "页面初始化失败");
  }
  THEMES.forEach((theme) => {
    renderPerson(theme, "a");
    if (theme === "love") renderPerson(theme, "b");
  });
  updatePayMethodUI(activePayMethod);
  setModel(activeModel);
  renderTheme(activeTheme);
  window.addEventListener("resize", () => {
    adjustThemeIndicator();
    adjustSliderHeight();
  });
}

init().catch((error) => {
  showFormError(error.message || "页面初始化失败");
});
