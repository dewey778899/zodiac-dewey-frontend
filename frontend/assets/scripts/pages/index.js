const API_BASE = (() => {
  if (!location.port || location.port === "80" || location.port === "443") return "";
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return location.port === "8080" ? "" : "http://localhost:8080";
  }
  if (location.hostname.startsWith("10.") || location.hostname.startsWith("192.168.") || location.hostname.startsWith("172.")) {
    return `http://${location.hostname}:8080`;
  }
  return "";
})();

const CITY_DATA_URL = "./assets/data/birth-place-coordinates.json";
const YEARS = { start: 1975, end: 2005 };
const DEFAULT_BIRTH_YEAR = "1990";
const DEFAULT_BIRTH_MONTH = "06";
const DEFAULT_BIRTH_DAY = "15";
const DEFAULT_BIRTH_DATE = `${DEFAULT_BIRTH_YEAR}-${DEFAULT_BIRTH_MONTH}-${DEFAULT_BIRTH_DAY}`;
const THEMES = ["love", "career", "wealth"];
const THEME_SLIDES = {
  love: 0,
  career: 1,
  wealth: 2
};

const THEME_CONFIG = {
  love: {
    heroTag: "LOVE REPORT ? ????",
    heroTitle: "?? TA<br>?????",
    submitText: "?????????",
    coverTitleCn: "????",
    coverTitleEn: "The Cosmic Bond",
    scoreLabel: "SOULMATE INDEX",
    typeLabel: "????",
    coverBadge: "??????"
  },
  career: {
    heroTag: "CAREER ASTROLOGY ? ????",
    heroTitle: "??????<br>?????",
    submitText: "??????",
    coverTitleCn: "????",
    coverTitleEn: "Career Direction",
    scoreLabel: "CAREER INDEX",
    typeLabel: "????",
    coverBadge: "??????"
  },
  wealth: {
    heroTag: "WEALTH MAP ? ????",
    heroTitle: "??????<br>?????",
    submitText: "??????",
    coverTitleCn: "????",
    coverTitleEn: "Wealth Pattern",
    scoreLabel: "WEALTH INDEX",
    typeLabel: "????",
    coverBadge: "??????"
  }
};

const PRESETS = {
  loveA: {
    name: "",
    gender: "male",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "14:30",
    birthProvince: "???",
    birthCity: "??",
    birthDistrict: "???"
  },
  loveB: {
    name: "",
    gender: "female",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "10:15",
    birthProvince: "???",
    birthCity: "??",
    birthDistrict: "???"
  },
  career: {
    name: "",
    gender: "female",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "09:20",
    birthProvince: "???",
    birthCity: "??",
    birthDistrict: "???"
  },
  wealth: {
    name: "",
    gender: "male",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "11:10",
    birthProvince: "???",
    birthCity: "??",
    birthDistrict: "???"
  }
};

const LOADING_STEPS = [
  "??????",
  "??????",
  "??????",
  "??????"
];

let activeTheme = "love";
let activeModel = "claude";
let activePayMethod = "wechat";
let cityIndex = null;
let currentLoadingTimer = null;
let currentLoadingProgress = 0;
let activeReport = null;

const stateByTheme = {
  love: {
    a: clonePerson(PRESETS.loveA),
    b: clonePerson(PRESETS.loveB)
  },
  career: {
    a: clonePerson(PRESETS.career)
  },
  wealth: {
    a: clonePerson(PRESETS.wealth)
  }
};

function $(id) {
  return document.getElementById(id);
}

function clonePerson(person) {
  return {
    name: "",
    gender: "female",
    birthDate: DEFAULT_BIRTH_DATE,
    birthTime: "",
    birthProvince: "",
    birthCity: "",
    birthDistrict: "",
    ...person,
    birthDate: person.birthDate || DEFAULT_BIRTH_DATE
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeMojibakeString(value) {
  const str = String(value ?? "");
  if (!/[???????????????]/.test(str)) return str;
  try {
    const bytes = Uint8Array.from(str, (ch) => ch.charCodeAt(0) & 255);
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("?") ? str : decoded;
  } catch {
    return str;
  }
}

function normalizeServerValue(value) {
  if (typeof value === "string") return decodeMojibakeString(value);
  if (Array.isArray(value)) return value.map(normalizeServerValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeServerValue(item)]));
  }
  return value;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getThemeSlide(theme) {
  return document.querySelector(`.form-slide[data-theme="${theme}"]`);
}

function forceReadableTexts() {
  const themeCopy = {
    love: {
      heroTag: "LOVE REPORT · \u7f18\u5206\u5408\u76d8",
      heroTitle: "\u4f60\u548c TA<br>\u5230\u5e95\u6709\u591a\u5408",
      submitText: "\u89e3\u6790\u6211\u4eec\u7684\u7075\u9b42\u5408\u76d8",
      slideTitle: "\u7231\u60c5\u5408\u76d8",
      slideSub: "\u4fdd\u7559\u53cc\u4eba\u8f93\u5165\uff0c\u91cd\u70b9\u770b\u5438\u5f15\u529b\u3001\u51b2\u7a81\u70b9\u548c\u76f8\u5904\u8282\u594f\u3002",
      nameA: "\u4f60\u7684\u540d\u5b57(\u6635\u79f0)",
      nameB: "TA\u7684\u540d\u5b57(\u6635\u79f0)",
      cityA: "\u51fa\u751f\u57ce\u5e02",
      cityB: "\u51fa\u751f\u57ce\u5e02"
    },
    career: {
      heroTag: "CAREER ASTROLOGY · \u4e8b\u4e1a\u89e3\u6790",
      heroTitle: "\u4f60\u7684\u4e8b\u4e1a\u8282\u594f<br>\u8be5\u600e\u4e48\u53d1\u529b",
      submitText: "\u9884\u89c8\u4e8b\u4e1a\u62a5\u544a",
      slideTitle: "\u4e8b\u4e1a\u6d4b\u7b97",
      slideSub: "\u5355\u4eba\u9875\u66f4\u7d27\u51d1\uff0c\u91cd\u70b9\u770b\u804c\u4e1a\u9a71\u52a8\u529b\u3001\u5c97\u4f4d\u5339\u914d\u548c\u672a\u6765\u8282\u594f\u3002",
      nameA: "\u540d\u5b57(\u6635\u79f0)",
      cityA: "\u57ce\u5e02 / \u533a\u53bf"
    },
    wealth: {
      heroTag: "WEALTH MAP · \u8d22\u8fd0\u6d1e\u5bdf",
      heroTitle: "\u4f60\u7684\u8d22\u5bcc\u7ed3\u6784<br>\u9002\u5408\u600e\u4e48\u8d5a",
      submitText: "\u9884\u89c8\u8d22\u8fd0\u62a5\u544a",
      slideTitle: "\u8d22\u8fd0\u6d4b\u7b97",
      slideSub: "\u5355\u4eba\u9875\u66f4\u7d27\u51d1\uff0c\u91cd\u70b9\u770b\u8d5a\u94b1\u65b9\u5f0f\u3001\u5b88\u8d22\u4e60\u60ef\u548c\u526f\u4e1a\u673a\u4f1a\u3002",
      nameA: "\u540d\u5b57(\u6635\u79f0)",
      cityA: "\u57ce\u5e02 / \u533a\u53bf"
    }
  };

  const activeCopy = themeCopy[activeTheme] || themeCopy.love;
  const themeTabs = {
    love: { icon: "❤", text: "\u7231\u60c5" },
    career: { icon: "▲", text: "\u4e8b\u4e1a" },
    wealth: { icon: "¥", text: "\u8d22\u8fd0" }
  };

  document.querySelectorAll(".theme-tab").forEach((button) => {
    const copy = themeTabs[button.dataset.theme];
    if (!copy) return;
    const icon = button.querySelector(".theme-tab-icon");
    const text = button.querySelector(".theme-tab-text");
    if (icon) icon.textContent = copy.icon;
    if (text) text.textContent = copy.text;
  });

  const heroTag = $("hero-tag");
  const heroTitle = $("hero-title");
  const submitBtn = $("submit-btn");
  const themeHint = $("theme-hint");
  if (heroTag) heroTag.textContent = activeCopy.heroTag;
  if (heroTitle) heroTitle.innerHTML = activeCopy.heroTitle;
  if (submitBtn) submitBtn.textContent = activeCopy.submitText;
  if (themeHint) themeHint.textContent = activeTheme === "love" ? "\u5de6\u53f3\u6ed1\u52a8\u5207\u6362\u4e0d\u540c\u4e3b\u9898" : "\u5de6\u4fa7\u6309\u94ae\u53ef\u5207\u6362\u5230\u5176\u4ed6\u4e3b\u9898";

  document.querySelectorAll(".form-slide").forEach((slide) => {
    const theme = slide.dataset.theme;
    const copy = themeCopy[theme];
    if (!copy) return;
    slide.querySelectorAll(".slide-title").forEach((el) => { el.textContent = copy.slideTitle; });
    slide.querySelectorAll(".slide-sub").forEach((el) => { el.textContent = copy.slideSub; });
    slide.querySelectorAll(".field-label").forEach((el, index) => {
      if (index % 5 === 0) {
        el.textContent = theme === "love" && slide.querySelectorAll(".person-section").length > 1 && index >= 5 ? copy.nameB : copy.nameA;
      } else if (index % 5 === 1) {
        el.textContent = "\u6027\u522b";
      } else if (index % 5 === 2) {
        el.textContent = "\u751f\u65e5";
      } else if (index % 5 === 3) {
        el.innerHTML = "\u51fa\u751f\u65f6\u95f4 <span class=\"opt\">(\u7b97\u6708\u4eae\u4e0a\u5347)</span>";
      } else if (index % 5 === 4) {
        el.textContent = copy.cityA;
      }
    });
    slide.querySelectorAll(".gender-btn").forEach((btn) => {
      btn.textContent = btn.dataset.value === "female" ? "\u5973\u751f \u2640" : "\u7537\u751f \u2642";
    });
    slide.querySelectorAll(".quick-fill-btn").forEach((btn) => {
      btn.textContent = btn.dataset.demo === "snow" ? "\u2728 \u4f53\u9a8c:snow" : "\u2728 \u4f53\u9a8c:dewey";
    });
    slide.querySelectorAll(".model-option").forEach((btn) => {
      if (btn.dataset.model === "deepseek") {
        btn.innerHTML = "免费版<span class=\"model-badge\">· 基础解析</span>";
      } else {
        btn.innerHTML = "深度解析<span class=\"model-badge\">· Opus 4.7</span>";
      }
    });
  });

  const reportCopy = {
    titleCn: "\u7075\u9b42\u5408\u76d8",
    titleEn: "The Cosmic Bond",
    scoreLabel: "SOULMATE INDEX",
    typeLabel: "\u5173\u7cfb\u7c7b\u578b",
    tagline: "\u4f60\u7684\u7f18\u5206\u6545\u4e8b\u4f1a\u5728\u8fd9\u91cc\u5c55\u5f00\u3002",
    essence: "\u7cbe\u534e\u6458\u8981",
    actionTitle: "KEEP IT FOREVER",
    actionSub: "\u73cd\u85cf\u62a5\u544a\uff0c\u6216\u76f4\u63a5\u5206\u4eab\u7ed9 TA",
    shareBtn: "\u751f\u6210\u5206\u4eab\u5361\u7247",
    pdfBtn: "\u4e0b\u8f7d\u5b8c\u6574\u62a5\u544a",
    restartBtn: "\u548c TA \u518d\u6d4b\u4e00\u6b21",
    valueFree: "\u5148\u7528\u514d\u8d39\u7248",
    payTitle: "\u89e3\u9501\u5b8c\u6574\u62a5\u544a",
    paySub: "\u66f4\u6df1\u5165\u7684\u89e3\u6790\u9700\u8981\u4e00\u70b9\u70b9\u8010\u5fc3",
    cityConfirm: "\u786e\u8ba4",
    cityClear: "\u6e05\u7a7a",
    shareDownload: "\u590d\u5236\u5206\u4eab\u94fe\u63a5"
  };

  const mappings = [
    ["cover-title-cn", reportCopy.titleCn],
    ["cover-title-en", reportCopy.titleEn],
    ["cover-score-label", reportCopy.scoreLabel],
    ["cover-type", reportCopy.typeLabel],
    ["cover-tagline", reportCopy.tagline],
    ["essence-head-title", reportCopy.essence],
    ["action-bar-title", reportCopy.actionTitle],
    ["action-bar-sub", reportCopy.actionSub],
    ["share-btn", reportCopy.shareBtn],
    ["pdf-btn", reportCopy.pdfBtn],
    ["restart-btn", reportCopy.restartBtn],
    ["value-modal-free-btn", reportCopy.valueFree],
    ["pay-modal-title", reportCopy.payTitle],
    ["pay-modal-subtitle", reportCopy.paySub],
    ["city-picker-confirm", reportCopy.cityConfirm],
    ["city-picker-clear", reportCopy.cityClear],
    ["share-download", reportCopy.shareDownload]
  ];
  mappings.forEach(([id, text]) => { const el = $(id); if (el) el.textContent = text; });

  document.querySelectorAll(".city-picker-header .pay-modal-icon").forEach((el) => { el.textContent = "📍"; });
  document.querySelectorAll(".pay-modal-header .pay-modal-icon").forEach((el) => { el.textContent = "🔍"; });
  document.querySelectorAll(".pay-modal-header .pay-modal-close, .city-picker-header .pay-modal-close").forEach((el) => { el.textContent = "×"; });
  document.title = "\u7075\u9b42\u5408\u76d8 · \u4f60\u548c TA \u7684\u7f18\u5206\u5bc6\u7801 · \u5c0f\u767b\u54e5\u51fa\u54c1";
}

function getPersonState(theme, personKey) {
  return stateByTheme[theme][personKey];
}

function setPersonState(theme, personKey, patch) {
  stateByTheme[theme][personKey] = {
    ...stateByTheme[theme][personKey],
    ...patch
  };
}

function parseBirthDateParts(birthDate) {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { year: "", month: "", day: "" };
  }
  const [year, month, day] = birthDate.split("-");
  return { year, month, day };
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
  for (const key of Object.keys(raw || {})) {
    const parts = key.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const [province, city, ...districtParts] = parts;
    const district = districtParts.join(" ");
    if (!province || !city || !district) continue;
    if (!map.has(province)) map.set(province, new Map());
    const cityMap = map.get(province);
    if (!cityMap.has(city)) cityMap.set(city, new Set());
    cityMap.get(city).add(district);
  }

  const provinces = [...map.keys()];
  const citiesByProvince = new Map();
  const districtsByProvinceCity = new Map();

  for (const [province, cityMap] of map.entries()) {
    const cities = [...cityMap.keys()];
    citiesByProvince.set(province, cities);
    for (const [city, districtSet] of cityMap.entries()) {
      districtsByProvinceCity.set(`${province}@@${city}`, [...districtSet]);
    }
  }

  return { provinces, citiesByProvince, districtsByProvinceCity };
}

function getProvinces() {
  return cityIndex?.provinces || [];
}

function getCities(province) {
  if (!province || !cityIndex) return [];
  return cityIndex.citiesByProvince.get(province) || [];
}

function getDistricts(province, city) {
  if (!province || !city || !cityIndex) return [];
  return cityIndex.districtsByProvinceCity.get(`${province}@@${city}`) || [];
}

function populateSelect(select, items, placeholderText, selectedValue = "") {
  if (!select) return;
  const options = [`<option value="">${escapeHtml(placeholderText)}</option>`]
    .concat(items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`))
    .join("");
  select.innerHTML = options;
  if (selectedValue && items.includes(selectedValue)) {
    select.value = selectedValue;
  } else {
    select.value = "";
  }
}

function getSlideControls(theme, personKey) {
  const slide = getThemeSlide(theme);
  if (!slide) return null;
  const scope = slide.querySelector(`.person-section [data-person="${personKey}"]`)?.closest(".person-section");
  const personScope = scope || slide;
  return {
    scope: personScope,
    name: personScope.querySelector(`[data-person="${personKey}"][data-field="name"]`),
    genderButtons: [...personScope.querySelectorAll(`[data-person="${personKey}"].gender-btn`)],
    year: personScope.querySelector(`[data-person="${personKey}"][data-field="birthYear"]`),
    month: personScope.querySelector(`[data-person="${personKey}"][data-field="birthMonth"]`),
    day: personScope.querySelector(`[data-person="${personKey}"][data-field="birthDay"]`),
    time: personScope.querySelector(`[data-person="${personKey}"][data-field="birthTime"]`),
    province: personScope.querySelector(`[data-person="${personKey}"][data-field="birthProvince"]`),
    city: personScope.querySelector(`[data-person="${personKey}"][data-field="birthCity"]`),
    district: personScope.querySelector(`[data-person="${personKey}"][data-field="birthDistrict"]`),
    quickFill: personScope.querySelector(".quick-fill")
  };
}

function refreshPlaceSelects(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;

  const person = getPersonState(theme, personKey);
  const province = person.birthProvince;
  const city = person.birthCity;
  const district = person.birthDistrict;

  populateSelect(controls.province, getProvinces(), "省 / 市", province);

  const cityItems = getCities(controls.province.value || province);
  const validCity = cityItems.includes(city) ? city : "";
  populateSelect(controls.city, cityItems, "城市", validCity);

  if (controls.district) {
    const districtItems = getDistricts(controls.province.value || province, controls.city.value || validCity);
    const validDistrict = districtItems.includes(district) ? district : "";
    populateSelect(controls.district, districtItems, "区 / 县", validDistrict);
  }

  const nextPlace = composeBirthPlace({
    birthProvince: controls.province.value,
    birthCity: controls.city.value,
    birthDistrict: controls.district?.value || ""
  });
  setPersonState(theme, personKey, {
    birthProvince: controls.province.value,
    birthCity: controls.city.value,
    birthDistrict: controls.district?.value || "",
    birthPlace: nextPlace
  });
}

function renderPerson(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  const person = getPersonState(theme, personKey);

  if (controls.name) controls.name.value = person.name || "";
  if (controls.time) controls.time.value = person.birthTime || "";

  const parts = parseBirthDateParts(person.birthDate);
  if (controls.year) controls.year.value = parts.year;
  if (controls.month) controls.month.value = parts.month;
  if (controls.day) controls.day.value = parts.day;

  controls.genderButtons.forEach((button) => {
    const active = button.dataset.value === person.gender;
    button.classList.toggle("active", active);
    button.classList.toggle("female", active && person.gender === "female");
  });

  refreshPlaceSelects(theme, personKey);
  if (controls.quickFill) {
    controls.quickFill.classList.toggle("show", theme === "love");
  }
}

function renderThemeForm(theme) {
  const themeConfig = THEME_CONFIG[theme];
  $("hero-tag").textContent = decodeMojibakeString(themeConfig.heroTag);
  $("hero-title").innerHTML = decodeMojibakeString(themeConfig.heroTitle);
  $("submit-btn").textContent = decodeMojibakeString(themeConfig.submitText);
  $("theme-hint").textContent = theme === "love" ? "\u5de6\u53f3\u6ed1\u52a8\u5207\u6362\u4e0d\u540c\u4e3b\u9898" : "\u5de6\u4fa7\u6309\u94ae\u53ef\u5207\u6362\u5230\u5176\u4ed6\u4e3b\u9898";

  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });
  document.querySelectorAll(".model-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === activeModel);
  });

  renderPerson(theme, "a");
  if (theme === "love") {
    renderPerson(theme, "b");
  }

  adjustThemeIndicator();
  adjustSliderPosition();
  requestAnimationFrame(adjustSliderHeight);
  forceReadableTexts();
  document.querySelectorAll(".slide-model-switcher").forEach((switcher) => {
    switcher.style.display = "flex";
    if (!switcher.querySelector(".model-option")) {
      switcher.innerHTML = `
        <button type="button" class="model-option" data-model="deepseek">免费版<span class="model-badge">· 基础解析</span></button>
        <button type="button" class="model-option active" data-model="claude">深度解析<span class="model-badge">· Opus 4.7</span></button>
      `;
    }
  });
}

function adjustThemeIndicator() {
  const activeButton = document.querySelector(`.theme-tab[data-theme="${activeTheme}"]`);
  const indicator = $("theme-tab-indicator");
  const nav = $("theme-nav");
  if (!activeButton || !indicator || !nav) return;
  const navRect = nav.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  indicator.style.left = `${buttonRect.left - navRect.left}px`;
  indicator.style.width = `${buttonRect.width}px`;
}

function adjustSliderPosition() {
  const slides = $("form-slides");
  if (!slides) return;
  slides.style.transform = `translateX(-${THEME_SLIDES[activeTheme] * 100}%)`;
}

function adjustSliderHeight() {
  const shell = document.querySelector(".form-slider-shell");
  const slide = getThemeSlide(activeTheme);
  if (!shell || !slide) return;
  shell.style.height = `${slide.offsetHeight}px`;
}

function populateYearSelects() {
  const yearOptions = Array.from({ length: YEARS.end - YEARS.start + 1 }, (_, index) => YEARS.start + index);
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1);

  document.querySelectorAll('[data-field="birthYear"]').forEach((select) => {
    populateSelect(select, yearOptions.map(String), "\u5e74", select.value || DEFAULT_BIRTH_YEAR);
  });
  document.querySelectorAll('[data-field="birthMonth"]').forEach((select) => {
    populateSelect(select, monthOptions.map((item) => pad2(item)), "\u6708", select.value || DEFAULT_BIRTH_MONTH);
  });
  document.querySelectorAll('[data-field="birthDay"]').forEach((select) => {
    populateSelect(select, dayOptions.map((item) => pad2(item)), "\u65e5", select.value || DEFAULT_BIRTH_DAY);
  });
}

function syncDateState(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;
  const birthDate = composeBirthDate(controls.year?.value, controls.month?.value, controls.day?.value);
  setPersonState(theme, personKey, { birthDate });
}

function syncTextState(theme, personKey, field, value) {
  setPersonState(theme, personKey, { [field]: value });
}

function syncPlaceState(theme, personKey) {
  const controls = getSlideControls(theme, personKey);
  if (!controls) return;

  const province = controls.province?.value || "";
  const city = controls.city?.value || "";
  const district = controls.district?.value || "";
  setPersonState(theme, personKey, {
    birthProvince: province,
    birthCity: city,
    birthDistrict: district,
    birthPlace: composeBirthPlace({ birthProvince: province, birthCity: city, birthDistrict: district })
  });
}

function syncAllThemeState(theme) {
  const keys = theme === "love" ? ["a", "b"] : ["a"];
  keys.forEach((personKey) => {
    syncDateState(theme, personKey);
    syncPlaceState(theme, personKey);
  });
}

function setTheme(theme) {
  if (!THEME_CONFIG[theme]) return;
  activeTheme = theme;
  renderThemeForm(theme);
}

function setModel(model) {
  activeModel = model === "deepseek" ? "deepseek" : "claude";
  document.querySelectorAll(".model-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === activeModel);
  });
}

function getPayMethodCopy(method) {
  if (method === "alipay") {
    return {
      image: "img/alipay_qr.jpg",
      label: "支付宝",
      buttonText: "打开支付宝",
      hint: "默认金额 19.9 元，可使用支付宝扫码支付到你当前的支付宝收款码。",
      alt: "支付宝支付二维码"
    };
  }
  return {
    image: "img/wechat_qr.jpg",
    label: "微信",
    buttonText: "打开微信支付",
    hint: "默认金额 19.9 元，可使用微信扫码支付到你当前的微信收款码。",
    alt: "微信支付二维码"
  };
}

function updatePayMethodUI(method = activePayMethod) {
  const nextMethod = method === "alipay" ? "alipay" : "wechat";
  const copy = getPayMethodCopy(nextMethod);
  activePayMethod = nextMethod;

  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.payMethod === nextMethod);
  });

  const qr = $("pay-qr-img");
  if (qr) {
    qr.src = copy.image;
    qr.alt = copy.alt;
  }
  const hint = $("pay-open-hint");
  if (hint) hint.textContent = copy.hint;
  const openBtn = $("pay-open-btn");
  if (openBtn) openBtn.textContent = copy.buttonText;
}

function setPayMethod(method) {
  updatePayMethodUI(method);
}

function applyDemo(personKey, demoKey) {
  const theme = "love";
  const preset = demoKey === "snow" ? PRESETS.loveB : PRESETS.loveA;
  stateByTheme[theme][personKey] = clonePerson(preset);
  renderPerson(theme, personKey);
}

function buildPersonPayload(theme, personKey) {
  const person = getPersonState(theme, personKey);
  const birthPlace = person.birthPlace || composeBirthPlace(person);
  return {
    name: person.name.trim(),
    gender: person.gender,
    birthDate: person.birthDate,
    birthTime: person.birthTime || "",
    birthPlace
  };
}

function validateThemeState(theme) {
  const personA = getPersonState(theme, "a");
  if (!personA.name.trim()) return "\u8bf7\u586b\u5199\u4f60\u7684\u540d\u5b57";
  if (!personA.gender) return "\u8bf7\u9009\u62e9\u4f60\u7684\u6027\u522b";
  if (!personA.birthDate) return "\u8bf7\u9009\u62e9\u4f60\u7684\u751f\u65e5";
  if (theme === "love") {
    const personB = getPersonState(theme, "b");
    if (!personB.name.trim()) return "\u7231\u60c5\u9875\u9700\u8981\u586b\u5199 TA \u7684\u540d\u5b57";
    if (!personB.gender) return "\u7231\u60c5\u9875\u9700\u8981\u9009\u62e9 TA \u7684\u6027\u522b";
    if (!personB.birthDate) return "\u7231\u60c5\u9875\u9700\u8981\u586b\u5199 TA \u7684\u751f\u65e5";
  }
  return "";
}

async function fetchJSON(url, options = {}) {
  const resp = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const error = new Error(data.message || `???? (${resp.status})`);
    error.status = resp.status;
    error.payload = data;
    throw error;
  }
  return data;
}

function setLoadingProgress(percent, label = "") {
  currentLoadingProgress = Math.max(0, Math.min(100, percent));
  const fill = $("loading-progress-fill");
  const value = $("loading-progress-value");
  const labelEl = $("loading-progress-label");
  if (fill) fill.style.width = `${currentLoadingProgress}%`;
  if (value) value.textContent = `${Math.round(currentLoadingProgress)}%`;
  if (labelEl && label) labelEl.textContent = label;
}

function renderLoadingSteps(activeIndex = 0) {
  const container = $("loading-steps");
  if (!container) return;
  container.innerHTML = LOADING_STEPS.map((step, index) => {
    const status = index < activeIndex ? "completed" : index === activeIndex ? "active" : "pending";
    return `
      <div class="loading-step ${status}">
        <div class="loading-step-status">${String(index + 1).padStart(2, "0")}</div>
        <div class="loading-step-copy">
          <div class="loading-step-title">${escapeHtml(decodeMojibakeString(step))}</div>
          <div class="loading-step-sub">${status === "active" ? "\u6b63\u5728\u5904\u7406..." : status === "completed" ? "\u5df2\u5b8c\u6210" : "\u7b49\u5f85\u4e2d"}</div>
        </div>
      </div>
    `;
  }).join("");
}

function startLoadingAnimation() {
  stopLoadingAnimation();
  setLoadingProgress(0, "\u51c6\u5907\u5f00\u59cb...");
  renderLoadingSteps(0);
  let stepIndex = 0;
  currentLoadingTimer = window.setInterval(() => {
    const next = Math.min(currentLoadingProgress + 9, 92);
    setLoadingProgress(next, decodeMojibakeString(LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)] || "\u6b63\u5728\u751f\u6210..."));
    if (next >= (stepIndex + 1) * 23 && stepIndex < LOADING_STEPS.length - 1) {
      stepIndex += 1;
      renderLoadingSteps(stepIndex);
    }
  }, 260);
}

function stopLoadingAnimation(finalProgress = 100) {
  if (currentLoadingTimer) {
    clearInterval(currentLoadingTimer);
    currentLoadingTimer = null;
  }
  setLoadingProgress(finalProgress, finalProgress >= 100 ? "\u5df2\u5b8c\u6210" : "\u5904\u7406\u4e2d...");
}

function switchPage(page) {
  $("page-form").classList.toggle("hidden", page !== "form");
  $("page-loading").classList.toggle("hidden", page !== "loading");
  $("page-report").classList.toggle("hidden", page !== "report");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderZodiacDetails(report) {
  const normalized = normalizeServerValue(report || {});
  const container = $("zodiac-details");
  if (!container) return;
  const isSingle = !normalized.zodiacB;
  const personAName = normalized.personA?.name || "A";
  const personBName = normalized.personB?.name || "B";
  container.innerHTML = `
    <div class="zd-head">
      <div class="zd-head-title">????</div>
      <div class="zd-head-sub">${isSingle ? "SINGLE REPORT" : "DUO REPORT"}</div>
    </div>
    <div class="zd-grid ${isSingle ? "single-report" : ""}">
      <div class="zd-person ${isSingle ? "single-report" : ""}">
        <div class="zd-person-name">${escapeHtml(personAName)}</div>
        <div class="zd-rows">
          <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacA?.sun || "-")}</span></div>
          <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacA?.moon || "-")}</span></div>
          <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacA?.rising || "-")}</span></div>
        </div>
      </div>
      ${isSingle ? "" : '<div class="zd-divider"></div>'}
      ${isSingle ? "" : `
        <div class="zd-person">
          <div class="zd-person-name">${escapeHtml(personBName)}</div>
          <div class="zd-rows">
            <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacB?.sun || "-")}</span></div>
            <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacB?.moon || "-")}</span></div>
            <div class="zd-row"><span class="zd-label">??</span><span class="zd-value">${escapeHtml(normalized.zodiacB?.rising || "-")}</span></div>
          </div>
        </div>
      `}
    </div>
    <div class="zd-foot">${isSingle ? "??????? A ??????" : "???????????????????"}</div>
  `;
}

function renderReport(report, options = {}) {
  const normalized = normalizeServerValue(report || {});
  activeReport = normalized;
  const reportType = normalized.reportType || options.reportType || "love";
  const theme = THEME_CONFIG[reportType] ? reportType : "love";
  const config = THEME_CONFIG[theme];

  $("cover-title-cn").textContent = decodeMojibakeString(config.coverTitleCn);
  $("cover-title-en").textContent = decodeMojibakeString(config.coverTitleEn);
  $("cover-score-label").textContent = decodeMojibakeString(config.scoreLabel);
  $("cover-type").textContent = decodeMojibakeString(normalized.relationshipType || config.typeLabel);
  $("cover-tagline").textContent = decodeMojibakeString(normalized.tagline || "");
  $("cover-id").textContent = decodeMojibakeString(normalized.reportUid || "???? ? SASC-000000-PF4E");
  $("cover-date").textContent = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  $("cover-score").textContent = normalized.score ?? "--";

  const nameA = normalized.personA?.name || getPersonState(theme, "a").name || "A";
  const nameB = normalized.personB?.name || getPersonState(theme, "b")?.name || "B";
  $("cover-person-a").textContent = decodeMojibakeString(nameA);
  $("cover-person-b").textContent = decodeMojibakeString(nameB);

  const iconA = $("cover-zodiac-a-icon");
  const iconB = $("cover-zodiac-b-icon");
  const zodiacA = normalized.zodiacA?.sign || "";
  const zodiacB = normalized.zodiacB?.sign || "";
  if (iconA) iconA.textContent = zodiacA ? zodiacA[0] : "?";
  if (iconB) iconB.textContent = zodiacB ? zodiacB[0] : "?";

  renderZodiacDetails(normalized);
  renderChapters(normalized);
  renderEssence(normalized);

  $("page-loading").classList.add("hidden");
  $("page-report").classList.remove("hidden");
  $("page-form").classList.add("hidden");
  adjustSliderHeight();
  forceReadableTexts();
}

function copyShareLink() {
  if (!activeReport?.reportUid) {
    showToast("暂无可复制的分享链接");
    return;
  }
  const url = `${location.origin}${location.pathname}?uid=${encodeURIComponent(activeReport.reportUid)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("分享链接已复制");
  }).catch(() => {
    showToast(url);
  });
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

function showFormError(message = "") {
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

function renderChapters(report) {
  const container = $("chapters-container");
  if (!container) return;
  const chapters = Array.isArray(report?.chapters) ? report.chapters : [];
  container.innerHTML = chapters.map((chapter, index) => `
    <div class="chapter">
      <div class="chapter-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="chapter-head">
        <div class="chapter-emoji">${escapeHtml(chapter.emoji || "✨")}</div>
        <div class="chapter-title">${escapeHtml(chapter.title || "")}</div>
      </div>
      <div class="chapter-body">${escapeHtml(chapter.content || "")}</div>
    </div>
  `).join("");
}

function renderEssence(report) {
  const icon = $("essence-icon");
  const title = $("essence-title");
  const sub = $("essence-sub");
  const list = $("essence-list");
  if (icon) icon.textContent = "✨";
  if (title) title.textContent = "精华摘要";
  if (sub) sub.textContent = "把最重要的结论先收起来。";
  if (!list) return;
  const essence = Array.isArray(report?.essence) ? report.essence : [];
  list.innerHTML = essence.map((item, index) => `
    <li class="essence-item">
      <div class="essence-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="essence-copy">${escapeHtml(item)}</div>
    </li>
  `).join("");
}

async function loadCityData() {
  const resp = await fetch(CITY_DATA_URL);
  if (!resp.ok) throw new Error("\u65e0\u6cd5\u52a0\u8f7d\u533a\u53bf\u6570\u636e");
  const raw = await resp.json();
  cityIndex = buildCityIndex(raw);
}

async function loadSharedReport(uid) {
  const report = await fetchJSON(`/api/compatibility/report/${encodeURIComponent(uid)}`);
  renderReport(report, { reportType: report.reportType || "love" });
}

async function submitForm() {
  showFormError("");
  syncAllThemeState(activeTheme);
  const validationError = validateThemeState(activeTheme);
  if (validationError) {
    showFormError(validationError);
    return;
  }

  const request = {
    personA: buildPersonPayload(activeTheme, "a"),
    model: activeModel,
    reportType: activeTheme
  };
  if (activeTheme === "love") {
    request.personB = buildPersonPayload(activeTheme, "b");
  }

  try {
    switchPage("loading");
    startLoadingAnimation();
    const report = await fetchJSON("/api/compatibility", {
      method: "POST",
      body: JSON.stringify(request)
    });
    renderReport(report, { reportType: activeTheme });
  } catch (error) {
    stopLoadingAnimation(0);
    switchPage("form");
    const message = error?.message || "生成失败，请稍后重试";
    showFormError(message);
    showToast(message);
  }
}

function bindFieldEvents() {
  document.querySelectorAll(".person-input, .person-select").forEach((element) => {
    const eventName = element.tagName === "SELECT" || element.type === "time" ? "change" : "input";
    element.addEventListener(eventName, () => {
      const slide = element.closest(".form-slide");
      const theme = slide?.dataset.theme;
      const personKey = element.dataset.person;
      const field = element.dataset.field;
      if (!theme || !personKey || !field) return;

      if (field === "birthYear" || field === "birthMonth" || field === "birthDay") {
        syncDateState(theme, personKey);
        return;
      }
      if (field === "birthProvince") {
        const person = getPersonState(theme, personKey);
        const province = element.value;
        const city = getCities(province)[0] || "";
        const district = getDistricts(province, city)[0] || "";
        setPersonState(theme, personKey, {
          ...person,
          birthProvince: province,
          birthCity: city,
          birthDistrict: district,
          birthPlace: composeBirthPlace({ birthProvince: province, birthCity: city, birthDistrict: district })
        });
        refreshPlaceSelects(theme, personKey);
        return;
      }
      if (field === "birthCity") {
        const person = getPersonState(theme, personKey);
        const province = person.birthProvince;
        const district = getDistricts(province, element.value)[0] || "";
        setPersonState(theme, personKey, {
          ...person,
          birthCity: element.value,
          birthDistrict: district,
          birthPlace: composeBirthPlace({ birthProvince: province, birthCity: element.value, birthDistrict: district })
        });
        refreshPlaceSelects(theme, personKey);
        return;
      }
      if (field === "birthDistrict") {
        syncPlaceState(theme, personKey);
        return;
      }

      if (field === "name" || field === "birthTime") {
        syncTextState(theme, personKey, field, element.value);
      }
    });
  });

  document.querySelectorAll(".gender-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      const slide = button.closest(".form-slide");
      const theme = slide?.dataset.theme;
      const personKey = button.dataset.person;
      if (!theme || !personKey) return;
      setPersonState(theme, personKey, { gender: button.dataset.value });
      renderPerson(theme, personKey);
    });
  });

  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
  });

  document.querySelectorAll(".model-option").forEach((button) => {
    button.addEventListener("click", () => {
      const model = button.dataset.model;
      if (model === "claude") {
        openModal("value-modal");
        return;
      }
      setModel(model);
    });
  });

  document.querySelectorAll(".pay-tab").forEach((button) => {
    button.addEventListener("click", () => {
      setPayMethod(button.dataset.payMethod);
    });
  });

  document.querySelectorAll(".quick-fill-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const demo = button.dataset.demo;
      if (!demo) return;
      const personKey = demo === "snow" ? "b" : "a";
      applyDemo(personKey, demo);
    });
  });

  $("submit-btn")?.addEventListener("click", submitForm);
  $("copy-link-btn")?.addEventListener("click", copyShareLink);
  $("restart-btn")?.addEventListener("click", () => {
    activeReport = null;
    switchPage("form");
  });

  $("share-btn")?.addEventListener("click", () => openModal("share-modal"));
  $("share-close")?.addEventListener("click", () => closeModal("share-modal"));
  $("share-download")?.addEventListener("click", () => {
    copyShareLink();
    closeModal("share-modal");
  });
  $("pdf-btn")?.addEventListener("click", () => showToast("\u0050\u0044\u0046 \u5bfc\u51fa\u7a0d\u540e\u63a5\u5165"));

  $("value-modal-pay-btn")?.addEventListener("click", () => {
    setModel("claude");
    closeModal("value-modal");
    openModal("pay-modal");
  });
  $("value-modal-free-btn")?.addEventListener("click", () => {
    setModel("deepseek");
    closeModal("value-modal");
  });
  $("value-modal-close")?.addEventListener("click", () => closeModal("value-modal"));
  $("pay-open-btn")?.addEventListener("click", () => openModal("pay-modal"));
  $("pay-confirm-btn")?.addEventListener("click", () => {
    showToast("\u652f\u4ed8\u6d41\u7a0b\u7a0d\u540e\u63a5\u5165");
    closeModal("pay-modal");
  });
  $("pay-modal-close")?.addEventListener("click", () => closeModal("pay-modal"));

  $("city-picker-close")?.addEventListener("click", () => closeModal("city-picker-modal"));
  $("city-picker-clear")?.addEventListener("click", () => {
    closeModal("city-picker-modal");
  });
  $("city-picker-confirm")?.addEventListener("click", () => closeModal("city-picker-modal"));
}

function bindWindowEvents() {
  window.addEventListener("resize", () => {
    adjustThemeIndicator();
    adjustSliderHeight();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains("modal-overlay") || target.classList.contains("pay-modal-overlay")) {
      target.classList.add("hidden");
      if (!document.querySelector(".pay-modal-overlay:not(.hidden), .modal-overlay:not(.hidden)")) {
        document.body.classList.remove("modal-open");
      }
    }
  });
}

async function init() {
  bindWindowEvents();
  populateYearSelects();
  await loadCityData();
  applyStaticMarkup();

  THEMES.forEach((theme) => {
    const slide = getThemeSlide(theme);
    if (!slide) return;
    const personKeys = theme === "love" ? ["a", "b"] : ["a"];
    personKeys.forEach((personKey) => renderPerson(theme, personKey));
  });

  renderThemeForm(activeTheme);
  bindFieldEvents();
  bindEventsAfterData();

  const sharedUid = new URLSearchParams(location.search).get("uid");
  if (sharedUid) {
    await loadSharedReport(sharedUid);
  }
}

function bindEventsAfterData() {
  // Placeholder for future late-bound actions.
}

function applyStaticMarkup() {
  const themeTabs = {
    love: { icon: "❤", text: "爱情" },
    career: { icon: "▲", text: "事业" },
    wealth: { icon: "¥", text: "财运" }
  };

  document.querySelectorAll(".theme-tab").forEach((button) => {
    const theme = button.dataset.theme;
    const copy = themeTabs[theme];
    const icon = button.querySelector(".theme-tab-icon");
    const text = button.querySelector(".theme-tab-text");
    if (icon && copy) icon.textContent = copy.icon;
    if (text && copy) text.textContent = copy.text;
  });

  document.querySelectorAll(".star").forEach((star) => {
    star.textContent = "✦";
  });
  const heroDeco = document.querySelector(".hero-deco");
  if (heroDeco) heroDeco.textContent = "✦ ✦ ✦";

  const slideCopy = {
    love: {
      title: "爱情合盘",
      sub: "保留双人输入，重点看吸引力、矛盾点和相处节奏。",
      nameA: "你的名字(昵称)",
      nameB: "TA的名字(昵称)",
      cityA: "出生城市",
      cityB: "出生城市"
    },
    career: {
      title: "事业测算",
      sub: "单人页更紧凑，重点看职业驱动力、岗位匹配和未来节奏。",
      nameA: "名字(昵称)",
      cityA: "城市 / 区县"
    },
    wealth: {
      title: "财运测算",
      sub: "单人页更紧凑，重点看赚钱方式、守财习惯和副业机会。",
      nameA: "名字(昵称)",
      cityA: "城市 / 区县"
    }
  };

  document.querySelectorAll(".form-slide").forEach((slide) => {
    const theme = slide.dataset.theme;
    const copy = slideCopy[theme];
    if (!copy) return;

    const title = slide.querySelector(".slide-title");
    const sub = slide.querySelector(".slide-sub");
    if (title) title.textContent = decodeMojibakeString(copy.title);
    if (sub && copy.sub) sub.textContent = decodeMojibakeString(copy.sub);

    const personSections = slide.querySelectorAll(".person-section");
    personSections.forEach((section, index) => {
      const isSecondPerson = index === 1;
      const labels = section.querySelectorAll(".field-label");
      const nameLabel = labels[0];
      const genderLabel = labels[1];
      const birthLabel = labels[2];
      const timeLabel = labels[3];
      const cityLabel = labels[4];
      const quickFill = section.querySelector(".quick-fill-btn");
      const inputs = section.querySelectorAll(".person-input");
      const genderBtns = section.querySelectorAll(".gender-btn");

      if (nameLabel) nameLabel.textContent = decodeMojibakeString(isSecondPerson && copy.nameB ? copy.nameB : copy.nameA);
      if (genderLabel) genderLabel.textContent = "\u6027\u522b";
      if (birthLabel) birthLabel.textContent = "\u751f\u65e5";
      if (timeLabel) timeLabel.innerHTML = decodeMojibakeString('???? <span class="opt">(?????)</span>');
      if (cityLabel) cityLabel.textContent = decodeMojibakeString(copy.cityA);
      if (quickFill) quickFill.textContent = isSecondPerson ? "\u2728 \u4f53\u9a8c:snow" : "\u2728 \u4f53\u9a8c:dewey";
      if (inputs[0]) inputs[0].placeholder = "\u8bf7\u8f93\u5165\u540d\u5b57";
      if (genderBtns[0]) genderBtns[0].textContent = "\u5973\u751f \u2640";
      if (genderBtns[1]) genderBtns[1].textContent = "\u7537\u751f \u2642";
    });
  });

  const heroTag = $("hero-tag");
  const byLine = document.querySelector(".by-line .name");
  if (heroTag && !heroTag.textContent.trim()) heroTag.textContent = "SOULMATE · 灵魂合盘";
  if (byLine) byLine.textContent = "小登哥 · XIAODENG";
  document.querySelectorAll(".cover-by .name, .report-footer .by .name").forEach((el) => {
    el.textContent = "小登哥 · XIAODENG";
  });
  document.title = "灵魂合盘 · 你和 TA 的缘分密码 · 小登哥出品";

  const staticText = {
    "cover-title-cn": "灵魂合盘",
    "cover-title-en": "The Cosmic Bond",
    "cover-score-label": "SOULMATE INDEX",
    "cover-type": "关系类型",
    "cover-tagline": "你的缘分故事会在这里展开。",
    "cover-id": "珍藏编号 · SASC-000000-PF4E",
    "cover-date": "2026/05/25 · 00:00",
    "essence-head-title": "精华摘要",
    "action-bar-title": "KEEP IT FOREVER",
    "action-bar-sub": "珍藏报告，或直接分享给 TA",
    "share-btn-text": "生成分享卡片",
    "pdf-btn-text": "下载完整报告",
    "restart-btn": "和 TA 再测一次",
    "value-modal-free-btn": "先用免费版",
    "pay-modal-title": "解锁完整报告",
    "pay-modal-subtitle": "更深入的解析需要一点点耐心",
    "city-picker-confirm": "确认",
    "city-picker-clear": "清空",
    "share-download": "复制分享链接"
  };
  Object.entries(staticText).forEach(([id, text]) => {
    const el = $(id);
    if (el && text) el.textContent = decodeMojibakeString(text);
  });

  document.querySelectorAll(".city-picker-header .pay-modal-icon").forEach((el) => {
    el.textContent = "📍";
  });
  document.querySelectorAll(".pay-modal-header .pay-modal-icon").forEach((el) => {
    el.textContent = "🔍";
  });
  document.querySelectorAll(".pay-modal-header .pay-modal-close, .city-picker-header .pay-modal-close").forEach((el) => {
    el.textContent = "×";
  });
  updatePayMethodUI(activePayMethod);
  forceReadableTexts();
}

function localizeStaticMarkup() {
  const themeTabs = {
    love: { icon: "❤", text: "爱情" },
    career: { icon: "▲", text: "事业" },
    wealth: { icon: "¥", text: "财运" }
  };

  document.querySelectorAll(".theme-tab").forEach((button) => {
    const theme = button.dataset.theme;
    const copy = themeTabs[theme];
    const icon = button.querySelector(".theme-tab-icon");
    const text = button.querySelector(".theme-tab-text");
    if (icon && copy) icon.textContent = copy.icon;
    if (text && copy) text.textContent = copy.text;
  });

  document.querySelectorAll(".star").forEach((star) => {
    star.textContent = "✦";
  });
  const heroDeco = document.querySelector(".hero-deco");
  if (heroDeco) heroDeco.textContent = "✦ ✦ ✦";

  const slideCopy = {
    love: {
      title: "爱情合盘",
      sub: "保留双人输入，重点看吸引力、矛盾点和相处节奏。",
      nameA: "你的名字(昵称)",
      nameB: "TA的名字(昵称)",
      cityA: "出生城市",
      cityB: "出生城市"
    },
    career: {
      title: "事业测算",
      sub: "单人页更紧凑，重点看职业驱动力、岗位匹配和未来节奏。",
      nameA: "名字(昵称)",
      cityA: "城市 / 区县"
    },
    wealth: {
      title: "财运测算",
      sub: "单人页更紧凑，重点看赚钱方式、守财习惯和副业机会。",
      nameA: "名字(昵称)",
      cityA: "城市 / 区县"
    }
  };

  document.querySelectorAll(".form-slide").forEach((slide) => {
    const theme = slide.dataset.theme;
    const copy = slideCopy[theme];
    if (!copy) return;

    const title = slide.querySelector(".slide-title");
    const sub = slide.querySelector(".slide-sub");
    if (title) title.textContent = decodeMojibakeString(copy.title);
    if (sub && copy.sub) sub.textContent = decodeMojibakeString(copy.sub);

    const personSections = slide.querySelectorAll(".person-section");
    personSections.forEach((section, index) => {
      const isSecondPerson = index === 1;
      const labels = section.querySelectorAll(".field-label");
      const nameLabel = labels[0];
      const genderLabel = labels[1];
      const birthLabel = labels[2];
      const timeLabel = labels[3];
      const cityLabel = labels[4];
      const quickFill = section.querySelector(".quick-fill-btn");
      const inputs = section.querySelectorAll(".person-input");
      const genderBtns = section.querySelectorAll(".gender-btn");

      if (nameLabel) nameLabel.textContent = decodeMojibakeString(isSecondPerson && copy.nameB ? copy.nameB : copy.nameA);
      if (genderLabel) genderLabel.textContent = "\u6027\u522b";
      if (birthLabel) birthLabel.textContent = "\u751f\u65e5";
      if (timeLabel) timeLabel.innerHTML = decodeMojibakeString('???? <span class="opt">(?????)</span>');
      if (cityLabel) cityLabel.textContent = decodeMojibakeString(copy.cityA);
      if (quickFill) quickFill.textContent = isSecondPerson ? "\u2728 \u4f53\u9a8c:snow" : "\u2728 \u4f53\u9a8c:dewey";
      if (inputs[0]) inputs[0].placeholder = "\u8bf7\u8f93\u5165\u540d\u5b57";
      if (genderBtns[0]) genderBtns[0].textContent = "\u5973\u751f \u2640";
      if (genderBtns[1]) genderBtns[1].textContent = "\u7537\u751f \u2642";
    });
  });

  const heroTag = $("hero-tag");
  const byLine = document.querySelector(".by-line .name");
  if (heroTag && !heroTag.textContent.trim()) heroTag.textContent = "SOULMATE · 灵魂合盘";
  if (byLine) byLine.textContent = "小登哥 · XIAODENG";
  document.querySelectorAll(".cover-by .name, .report-footer .by .name").forEach((el) => {
    el.textContent = "小登哥 · XIAODENG";
  });
  document.title = "灵魂合盘 · 你和 TA 的缘分密码 · 小登哥出品";

  const staticText = {
    "cover-title-cn": "灵魂合盘",
    "cover-title-en": "The Cosmic Bond",
    "cover-score-label": "SOULMATE INDEX",
    "cover-type": "关系类型",
    "cover-tagline": "你的缘分故事会在这里展开。",
    "cover-id": "珍藏编号 · SASC-000000-PF4E",
    "cover-date": "2026/05/25 · 00:00",
    "essence-head-title": "精华摘要",
    "action-bar-title": "KEEP IT FOREVER",
    "action-bar-sub": "珍藏报告，或直接分享给 TA",
    "share-btn-text": "生成分享卡片",
    "pdf-btn-text": "下载完整报告",
    "restart-btn": "和 TA 再测一次",
    "value-modal-free-btn": "先用免费版",
    "pay-modal-title": "解锁完整报告",
    "pay-modal-subtitle": "更深入的解析需要一点点耐心",
    "city-picker-confirm": "确认",
    "city-picker-clear": "清空",
    "share-download": "复制分享链接"
  };
  Object.entries(staticText).forEach(([id, text]) => {
    const el = $(id);
    if (el && text) el.textContent = decodeMojibakeString(text);
  });

  document.querySelectorAll(".city-picker-header .pay-modal-icon").forEach((el) => {
    el.textContent = "📍";
  });
  document.querySelectorAll(".pay-modal-header .pay-modal-icon").forEach((el) => {
    el.textContent = "🔍";
  });
  document.querySelectorAll(".pay-modal-header .pay-modal-close, .city-picker-header .pay-modal-close").forEach((el) => {
    el.textContent = "×";
  });
}

init().catch((error) => {
  console.error(error);
  showFormError(error.message || "页面初始化失败");
});
