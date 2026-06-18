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

const CITY_DATA_URL = "/assets/data/birth-place-coordinates.json";
const YEARS = { start: 1975, end: 2005 };
const DEFAULT_BIRTH_DATE = { year: "1990", month: "06", day: "15" };
const THEMES = ["love", "career", "wealth"];
const THEME_SLIDES = { love: 0, career: 1, wealth: 2 };
const LOADING_STEPS = ["校对出生信息", "生成星盘结构", "解析关系能量", "整理最终报告"];

const THEME_COPY = {
  love: {
    heroTag: "LOVE REPORT · 灵魂合盘",
    heroTitle: "你和 TA<br>到底有多合？",
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

// ===== 农历数据表 (1900-2100) =====
const lunarInfo=[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
0x0d520];
const ZHI_DAY=["初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
"十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
"廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];
const MONTH=["正","二","三","四","五","六","七","八","九","十","冬","腊"];
const GAN=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const ANIMAL=["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
function leapMonth(y){ return lunarInfo[y-1900]&0xf; }
function leapDays(y){ if(leapMonth(y)) return (lunarInfo[y-1900]&0x10000)?30:29; return 0; }
function monthDays(y,m){ return (lunarInfo[y-1900]&(0x10000>>m))?30:29; }
function lunarYearDays(y){
  let sum=348;
  for(let i=0x8000;i>0x8;i>>=1) sum+=(lunarInfo[y-1900]&i)?1:0;
  return sum+leapDays(y);
}
function ganzhi(y){ return GAN[(y-4)%10]+ZHI[(y-4)%12]; }
function solarToLunar(y,m,d){
  let offset=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(1900,0,31))/86400000);
  let ly,temp=0;
  for(ly=1900;ly<2101&&offset>0;ly++){ temp=lunarYearDays(ly); offset-=temp; }
  if(offset<0){ offset+=temp; ly--; }
  let leap=leapMonth(ly), isLeap=false, lm;
  for(lm=1;lm<13&&offset>0;lm++){
    if(leap>0&&lm===leap+1&&!isLeap){ lm--; isLeap=true; temp=leapDays(ly); }
    else temp=monthDays(ly,lm);
    if(isLeap&&lm===leap+1) isLeap=false;
    offset-=temp;
  }
  if(offset===0&&leap>0&&lm===leap+1){ if(isLeap) isLeap=false; else { isLeap=true; lm--; } }
  if(offset<0){ offset+=temp; lm--; }
  return {y:ly,m:lm,d:offset+1,isLeap};
}
function lunarToSolar(y,m,d,isLeap){
  let offset=0;
  for(let i=1900;i<y;i++) offset+=lunarYearDays(i);
  let leap=leapMonth(y);
  for(let i=1;i<m;i++){
    offset+=monthDays(y,i);
    if(leap===i) offset+=leapDays(y);
  }
  if(isLeap&&leap===m) offset+=monthDays(y,m);
  offset+=d-1;
  let date=new Date(Date.UTC(1900,0,31)+offset*86400000);
  return {y:date.getUTCFullYear(),m:date.getUTCMonth()+1,d:date.getUTCDate()};
}
function formatLunar(r){
  let mp=(r.isLeap?"闰":"")+MONTH[r.m-1]+"月";
  return ganzhi(r.y)+ANIMAL[(r.y-4)%12]+"年 "+mp+ZHI_DAY[r.d-1];
}

let lunarMode="s2l";
let lunarYearEl, lunarMonthEl, lunarDayEl;

function fillLunarYear(){
  lunarYearEl.innerHTML="";
  for(let i=1900;i<=2100;i++){ let o=document.createElement("option"); o.value=i; o.textContent=i+"年"; lunarYearEl.appendChild(o); }
}
function daysInLunarMonth(){
  let y=+lunarYearEl.value, mv=lunarMonthEl.value;
  if(lunarMode==="s2l"){
    return new Date(y,+mv,0).getDate();
  }else{
    if(typeof mv==="string"&&mv[0]==="L") return leapDays(y);
    return monthDays(y,+mv);
  }
}
function fillLunarDay(){
  let max=daysInLunarMonth(), keep=+lunarDayEl.value||1;
  lunarDayEl.innerHTML="";
  for(let i=1;i<=max;i++){ let o=document.createElement("option"); o.value=i; o.textContent=i+"日"; lunarDayEl.appendChild(o); }
  lunarDayEl.value=Math.min(keep,max);
}
function fillLunarMonth(){
  let y=+lunarYearEl.value;
  lunarMonthEl.innerHTML="";
  if(lunarMode==="s2l"){
    for(let i=1;i<=12;i++){ let o=document.createElement("option"); o.value=i; o.textContent=i+"月"; lunarMonthEl.appendChild(o); }
  }else{
    let leap=leapMonth(y);
    for(let i=1;i<=12;i++){
      let o=document.createElement("option"); o.value=i; o.textContent=MONTH[i-1]+"月"; lunarMonthEl.appendChild(o);
      if(leap===i){ let lo=document.createElement("option"); lo.value="L"+i; lo.textContent="闰"+MONTH[i-1]+"月"; lunarMonthEl.appendChild(lo); }
    }
  }
  fillLunarDay();
}
function initLunarOptions(){
  fillLunarYear();
  let n=new Date();
  lunarYearEl.value=n.getFullYear();
  fillLunarMonth();
  if(lunarMode==="s2l") lunarMonthEl.value=n.getMonth()+1;
  lunarDayEl.value=n.getDate();
  fillLunarDay();
}

function switchLunarTab(m){
  lunarMode=m;
  document.querySelectorAll("#lunar-modal .lunar-tab").forEach(t=>t.classList.toggle("active",t.dataset.mode===m));
  document.getElementById("lunar-result").classList.remove("show");
  fillLunarMonth();
}

function doLunarConversion(){
  let y=+lunarYearEl.value,d=+lunarDayEl.value,mv=lunarMonthEl.value;
  let rEl=document.getElementById("lunar-result");
  let rMain=document.getElementById("lunar-result-main");
  let rSub=document.getElementById("lunar-result-sub");
  try{
    if(lunarMode==="s2l"){
      let m=+mv;
      if(y<1900||y>2100){ rMain.innerHTML="年份超出范围"; rMain.className="lunar-result-main err"; rSub.textContent=""; rEl.classList.add("show"); return; }
      let r=solarToLunar(y,m,d);
      rMain.innerHTML=formatLunar(r);
      rMain.className="lunar-result-main";
      rSub.textContent="阳历 "+y+"年"+m+"月"+d+"日 星期"+["日","一","二","三","四","五","六"][new Date(y,m-1,d).getDay()];
    }else{
      let leap=false,m;
      if(typeof mv==="string"&&mv[0]==="L"){ leap=true; m=+mv.slice(1); }
      else m=+mv;
      let r=lunarToSolar(y,m,d,leap);
      rMain.innerHTML="阳历 "+r.y+"年"+r.m+"月"+r.d+"日 星期"+["日","一","二","三","四","五","六"][new Date(r.y,r.m-1,r.d).getDay()];
      rMain.className="lunar-result-main";
      rSub.textContent=(leap?"闰":"")+"农历 "+y+"年"+MONTH[m-1]+"月"+ZHI_DAY[d-1];
    }
    rEl.classList.add("show");
  }catch(e){ rMain.innerHTML="转换失败，请检查输入"; rMain.className="lunar-result-main err"; rSub.textContent=""; rEl.classList.add("show"); }
}

const ZODIAC_SYMBOLS = {
  ARIES: "♈",
  TAURUS: "♉",
  GEMINI: "♊",
  CANCER: "♋",
  LEO: "♌",
  VIRGO: "♍",
  LIBRA: "♎",
  SCORPIO: "♏",
  SAGITTARIUS: "♐",
  CAPRICORN: "♑",
  AQUARIUS: "♒",
  PISCES: "♓",
  白羊座: "♈",
  金牛座: "♉",
  双子座: "♊",
  巨蟹座: "♋",
  狮子座: "♌",
  处女座: "♍",
  天秤座: "♎",
  天蝎座: "♏",
  射手座: "♐",
  摩羯座: "♑",
  水瓶座: "♒",
  双鱼座: "♓"
};

const paymentState = {
  accessTokens: {
    love: "",
    career: "",
    wealth: ""
  },
  unlockSource: "payment",
  outTradeNo: "",
  payChannel: "wechat",
  pollTimer: null,
  payReturnHandled: false
};

let activeTheme = "love";
const themeModelState = {
  love: "deepseek",
  career: "deepseek",
  wealth: "deepseek"
};
let cityIndex = new Map();
let cityCoordinateData = {};
let currentLoadingTimer = null;
let currentLoadingRaf = 0;
let currentProgress = 0;
let latestReport = null;
let latestShareCardDataUrl = "";
let latestShareCardCacheKey = "";
const SHARE_QUERY_KEY = "report";
const SHARE_CARD_STYLE_VERSION = "v2";

function $(id) {
  return document.getElementById(id);
}

function buildShareCardCacheKey(report) {
  if (!report || !report.reportUid) return "";
  return JSON.stringify({
    version: SHARE_CARD_STYLE_VERSION,
    reportUid: report.reportUid,
    reportType: report.reportType || "",
    score: report.score == null ? "" : String(report.score),
    zodiacA: report.zodiacA && report.zodiacA.sun ? String(report.zodiacA.sun) : "",
    zodiacB: report.zodiacB && report.zodiacB.sun ? String(report.zodiacB.sun) : ""
  });
}

function resetShareCardCache(report = latestReport) {
  latestShareCardDataUrl = "";
  latestShareCardCacheKey = buildShareCardCacheKey(report);
}

function ensureShareCardCacheFresh() {
  const nextKey = buildShareCardCacheKey(latestReport);
  if (!nextKey) {
    latestShareCardDataUrl = "";
    latestShareCardCacheKey = "";
    return "";
  }
  if (latestShareCardCacheKey !== nextKey) {
    latestShareCardDataUrl = "";
    latestShareCardCacheKey = nextKey;
  }
  return nextKey;
}

const originalGetZodiacSymbol = getZodiacSymbol;
getZodiacSymbol = function patchedGetZodiacSymbol(value) {
  const symbol = originalGetZodiacSymbol(value);
  if (!symbol || symbol === "?" || symbol === "�") {
    return "✦";
  }
  return symbol;
};

function getZodiacSymbol(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "✦";
  const upper = normalized.toUpperCase();
  return ZODIAC_SYMBOLS[normalized] || ZODIAC_SYMBOLS[upper] || "✦";
}

function showToast(message) {
  let toast = $("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:32px",
      "transform:translateX(-50%)",
      "background:rgba(28,26,33,.92)",
      "color:#fff",
      "padding:12px 18px",
      "border-radius:999px",
      "font-size:14px",
      "z-index:9999",
      "box-shadow:0 12px 30px rgba(0,0,0,.22)",
      "opacity:0",
      "transition:opacity .2s ease"
    ].join(";");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    toast.style.opacity = "0";
  }, 1800);
}

function getReportShareUrl(reportUid) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  if (reportUid) {
    url.searchParams.set(SHARE_QUERY_KEY, reportUid);
  }
  return url.toString();
}

function syncReportUrl(reportUid) {
  const target = getReportShareUrl(reportUid);
  if (window.location.href !== target) {
    window.history.replaceState({ reportUid }, "", target);
  }
}

function getReportUidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get(SHARE_QUERY_KEY) || "").trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const stateByTheme = clone(DEFAULT_STATE);

function safeText(value, fallback) {
  return value == null ? (fallback || "") : String(value);
}

function replaceAllText(value, search, replacement) {
  return safeText(value).split(search).join(replacement);
}

function padStart2(value) {
  value = String(value);
  return value.length >= 2 ? value : `0${value}`;
}

function closestBySelector(element, selector) {
  if (!element) return null;
  if (typeof element.closest === "function") return element.closest(selector);
  let current = element;
  while (current) {
    if (current.matches && current.matches(selector)) return current;
    current = current.parentElement;
  }
  return null;
}

function escapeHtml(value) {
  return replaceAllText(
    replaceAllText(
      replaceAllText(
        replaceAllText(safeText(value), "&", "&amp;"),
        "<",
        "&lt;"
      ),
      ">",
      "&gt;"
    ),
    '"',
    "&quot;"
  );
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (error) {
    const message = error && error.message ? String(error.message) : "";
    if (message.includes("Failed to fetch") || error instanceof TypeError) {
      throw new Error("网络连接失败，请确认前后端服务已经启动");
    }
    throw new Error(message || "请求发送失败，请稍后再试");
  }

  const contentType = resp.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await resp.json().catch(() => ({}))
    : { message: (await resp.text().catch(() => "")).trim() };

  if (!resp.ok) {
    const message = data && data.message ? String(data.message) : `请求失败 (${resp.status})`;
    throw new Error(message);
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
  const personNode = slide ? slide.querySelector(`.person-section [data-person="${personKey}"]`) : null;
  const section = closestBySelector(personNode, ".person-section");
  if (!section) return null;
  return {
    section,
    name: section.querySelector(`[data-person="${personKey}"][data-field="name"]`),
    genderButtons: Array.prototype.slice.call(section.querySelectorAll(`.gender-btn[data-person="${personKey}"]`)),
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
  return padStart2(value);
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
    if (districts.indexOf(district) === -1) districts.push(district);
  });
  return map;
}

function getProvinces() {
  return Array.from(cityIndex.keys());
}

function getCities(province) {
  return province && cityIndex.has(province) ? Array.from(cityIndex.get(province).keys()) : [];
}

function getDistricts(province, city) {
  return province && city && cityIndex.has(province) ? cityIndex.get(province).get(city) || [] : [];
}

function populateSelect(select, items, placeholder, selectedValue = "") {
  if (!select) return;
  select.innerHTML = [`<option value="">${placeholder}</option>`]
    .concat(items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`))
    .join("");
  select.value = selectedValue && items.indexOf(selectedValue) !== -1 ? selectedValue : "";
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
  const province = controls.province.value || person.birthProvince;
  populateSelect(controls.city, getCities(province), "市", person.birthCity);
  const city = controls.city.value || person.birthCity;
  populateSelect(controls.district, getDistricts(province, city), "区 / 县", person.birthDistrict);
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
  const activeTab = nav ? nav.querySelector(`.theme-tab[data-theme="${activeTheme}"]`) : null;
  if (!nav || !indicator || !activeTab) return;
  indicator.style.width = `${activeTab.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
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
  clearFormError();
  const copy = THEME_COPY[activeTheme];
  $("hero-tag").textContent = copy.heroTag;
  $("hero-title").innerHTML = copy.heroTitle;
  $("submit-btn").textContent = copy.submitText;
  $("theme-hint").textContent = activeTheme === "love" ? "左右滑动切换不同主题" : "左右滑动查看不同主题内容";
  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === activeTheme);
  });
  document.querySelectorAll(".slide-title").forEach((el) => {
    const slide = closestBySelector(el, ".form-slide");
    const themeCode = slide && slide.dataset ? slide.dataset.theme : "";
    if (themeCode) el.textContent = THEME_COPY[themeCode].slideTitle;
  });
  document.querySelectorAll(".slide-sub").forEach((el) => {
    const slide = closestBySelector(el, ".form-slide");
    const themeCode = slide && slide.dataset ? slide.dataset.theme : "";
    if (themeCode) el.textContent = THEME_COPY[themeCode].slideSub;
  });
  renderPerson(activeTheme, "a");
  if (activeTheme === "love") renderPerson(activeTheme, "b");
  setModel(themeModelState[activeTheme] || "deepseek");
  adjustThemeIndicator();
  adjustSliderPosition();
  requestAnimationFrame(adjustSliderHeight);
}

function setModel(model) {
  const resolved = model === "claude" ? "claude" : "deepseek";
  themeModelState[activeTheme] = resolved;
  document.querySelectorAll(".form-slide").forEach((slide) => {
    const theme = slide.dataset.theme;
    const selectedModel = themeModelState[theme] || "deepseek";
    slide.querySelectorAll(".model-option").forEach((button) => {
      const isActive = button.dataset.model === selectedModel;
      const isPremium = button.dataset.model === "claude";
      button.classList.toggle("active", isActive);
      button.classList.toggle("premium-active", isActive && isPremium);
      button.classList.toggle("premium-unlocked", isPremium && Boolean(paymentState.accessTokens[theme]));
    });
  });
}

function showFormError(message) {
  const box = $("form-error");
  if (!box) return;
  box.textContent = message || "";
  box.classList.toggle("hidden", !message);
}

function clearFormError() {
  showFormError("");
}

function getElementTheme(element) {
  const slide = closestBySelector(element, ".form-slide");
  return slide && slide.dataset ? slide.dataset.theme || "" : "";
}

function clearFormErrorForActiveTheme(element) {
  if (getElementTheme(element) === activeTheme) {
    clearFormError();
  }
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
  if ($("page-form")) $("page-form").classList.toggle("hidden", page !== "form");
  if ($("page-loading")) $("page-loading").classList.toggle("hidden", page !== "loading");
  if ($("page-report")) $("page-report").classList.toggle("hidden", page !== "report");
}

function renderLoadingSteps(activeIndex) {
  const container = $("loading-steps");
  if (!container) return;
  container.innerHTML = LOADING_STEPS.map((step, index) => {
    const state = index < activeIndex ? "completed" : index === activeIndex ? "active" : "pending";
    const mark = index < activeIndex ? "✓" : padStart2(index + 1);
    const sub = state === "completed" ? "已完成" : state === "active" ? "处理中..." : "等待执行";
    return `<div class="loading-step ${state}"><div class="loading-step-status">${mark}</div><div class="loading-step-copy"><div class="loading-step-title">${escapeHtml(step)}</div><div class="loading-step-sub">${sub}</div></div></div>`;
  }).join("");
}

function setLoadingProgress(percent, label) {
  currentProgress = percent;
  if ($("loading-progress-fill")) $("loading-progress-fill").style.width = `${percent}%`;
  if ($("loading-progress-value")) $("loading-progress-value").textContent = `${Math.round(percent)}%`;
  if ($("loading-progress-label")) $("loading-progress-label").textContent = label;
}

function getLoadingStepIndex(percent) {
  if (percent >= 78) return 3;
  if (percent >= 52) return 2;
  if (percent >= 24) return 1;
  return 0;
}

function getLoadingLabel(percent) {
  if (percent >= 92) return "正在整理结果细节...";
  if (percent >= 78) return "正在整理最终报告...";
  return LOADING_STEPS[Math.min(getLoadingStepIndex(percent), LOADING_STEPS.length - 1)];
}

function cancelLoadingAnimation() {
  if (currentLoadingTimer) clearInterval(currentLoadingTimer);
  currentLoadingTimer = null;
  if (currentLoadingRaf) cancelAnimationFrame(currentLoadingRaf);
  currentLoadingRaf = 0;
}

function startLoadingAnimation() {
  cancelLoadingAnimation();
  currentProgress = 0;
  renderLoadingSteps(0);
  setLoadingProgress(0, "准备开始...");
  currentLoadingTimer = window.setInterval(() => {
    const remaining = 96 - currentProgress;
    if (remaining <= 0.15) return;
    let increment = remaining * 0.12;
    if (currentProgress < 20) increment = Math.max(increment, 4.8);
    else if (currentProgress < 48) increment = Math.max(increment, 2.8);
    else if (currentProgress < 78) increment = Math.max(increment, 1.35);
    else increment = Math.max(increment, 0.32);
    const next = Math.min(currentProgress + increment, 96);
    renderLoadingSteps(getLoadingStepIndex(next));
    setLoadingProgress(next, getLoadingLabel(next));
  }, 360);
}

function stopLoadingAnimation(finalProgress, options = {}) {
  const { animate = false, onComplete = null } = options;
  cancelLoadingAnimation();
  const target = Math.max(0, Math.min(finalProgress, 100));
  if (!animate) {
    const stepIndex = target >= 100 ? LOADING_STEPS.length - 1 : getLoadingStepIndex(target);
    renderLoadingSteps(stepIndex);
    setLoadingProgress(target, target >= 100 ? "已完成" : "处理中...");
    if (typeof onComplete === "function") onComplete();
    return;
  }

  const start = currentProgress;
  const duration = 420;
  const startedAt = performance.now();
  const tick = (now) => {
    const elapsed = now - startedAt;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = start + (target - start) * eased;
    renderLoadingSteps(target >= 100 && progress >= 1 ? LOADING_STEPS.length - 1 : getLoadingStepIndex(next));
    setLoadingProgress(next, target >= 100 ? "已完成" : getLoadingLabel(next));
    if (progress < 1) {
      currentLoadingRaf = requestAnimationFrame(tick);
      return;
    }
    currentLoadingRaf = 0;
    if (typeof onComplete === "function") onComplete();
  };
  currentLoadingRaf = requestAnimationFrame(tick);
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

function ensureDeviceToken() {
  const existing = localStorage.getItem("zodiac_device_token");
  if (existing) return existing;
  const token = `dev-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  localStorage.setItem("zodiac_device_token", token);
  return token;
}

function getClientContext() {
  const ua = navigator.userAgent || "";
  return {
    deviceToken: ensureDeviceToken(),
    userAgent: ua,
    source: location.href,
    insideWechat: /MicroMessenger/i.test(ua),
    mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  };
}

function normalizeName(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function resolveCoords(person) {
  const key = composeBirthPlace(person).trim();
  const item = key ? cityCoordinateData[key] : null;
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
    birthLatitude: coords ? coords.lat : null,
    birthLongitude: coords ? coords.lng : null,
    birthTimezone: "Asia/Shanghai"
  };
}

function buildCompatibilityPayload(model) {
  const payload = {
    model,
    reportType: slugTheme(activeTheme),
    personA: buildPersonPayload(stateByTheme[activeTheme].a, activeTheme === "love" ? "我" : "我的名字")
  };
  if (activeTheme === "love") {
    payload.personB = buildPersonPayload(stateByTheme[activeTheme].b, "TA");
  }
  if (model === "claude" && paymentState.accessTokens[activeTheme]) {
    payload.accessToken = paymentState.accessTokens[activeTheme];
  }
  return payload;
}

function validateCurrentForm() {
  const a = stateByTheme[activeTheme].a;
  if (!a.name.trim()) return "请先填写名字";
  if (!a.birthProvince || !a.birthCity || !a.birthDistrict) return "请完整选择出生地";
  if (activeTheme === "love") {
    const b = stateByTheme[activeTheme].b;
    if (!b.name.trim()) return "请先填写 TA 的名字";
    if (!b.birthProvince || !b.birthCity || !b.birthDistrict) return "请完整选择 TA 的出生地";
    if ((a.gender || "").toLowerCase() === (b.gender || "").toLowerCase()) {
        return "爱情合盘暂不支持同一性别组合，请选择一男一女";
    }
  }
  return "";
}

function resetPaymentState() {
  paymentState.accessTokens[activeTheme] = "";
  paymentState.outTradeNo = "";
  if (paymentState.pollTimer) {
    clearTimeout(paymentState.pollTimer);
    paymentState.pollTimer = null;
  }
  paymentState.payReturnHandled = false;
}

function setPayStatus(text, success = false) {
  const el = $("pay-status-text");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("success", success);
}

function setPayLoading(loading) {
  const btn = $("pay-confirm-btn");
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "处理中..." : "确认支付 ¥29.90";
}

function selectPayChannel(channel) {
  paymentState.payChannel = channel;
  document.querySelectorAll(".pay-channel-btn").forEach(function(btn) {
    btn.classList.toggle("active", btn.dataset.channel === channel);
  });
}

// ===== Invite Code =====
function getInviteCodeFromUrl() {
  var params = new URLSearchParams(window.location.search);
  return (params.get("invite") || params.get("ref") || params.get("inviteCode") || "").trim();
}

function saveInviteCode(code) {
  if (!code) return;
  try { localStorage.setItem("zodiac_invite_code", code); } catch(e) {}
}

function getSavedInviteCode() {
  try { return localStorage.getItem("zodiac_invite_code") || ""; } catch(e) { return ""; }
}

function getPendingInviteCode() {
  return getInviteCodeFromUrl() || getSavedInviteCode();
}

// ===== Phone Binding =====
function normalizePhone(value) {
  return String(value || "").replace(/\s+/g, "").replace(/[^0-9]/g, "").trim();
}

function getLastBoundPhone() {
  try { return localStorage.getItem("zodiac_bound_phone") || ""; } catch(e) { return ""; }
}

function saveBoundPhone(phone) {
  try { localStorage.setItem("zodiac_bound_phone", phone); } catch(e) {}
}

async function bindReferralIfNeeded(phone) {
  var inviteCode = getPendingInviteCode();
  if (!inviteCode) return;
  try {
    await api("/api/referral/bind", {
      method: "POST",
      body: JSON.stringify({
        phone: phone,
        inviteCode: inviteCode,
        platform: "WECHAT",
        deviceToken: ensureDeviceToken(),
        source: "h5-payment"
      })
    });
    saveBoundPhone(phone);
  } catch(e) {
    // non-critical, don't block payment
    console.warn("Referral binding failed:", e.message || e);
  }
}

// ===== Payment Flow =====
var PAY_AMOUNT_FEN = 2990;

async function createPayOrder(channel) {
  setPayStatus("正在创建支付订单...");
  setPayLoading(true);
  try {
    var scene = channel === "alipay" ? "alipay_wap" : "wechat_h5";
    var phone = normalizePhone(($("pay-phone-input") || {}).value || "");
    if (!phone) {
      throw new Error("请先填写手机号");
    }

    // Auto-bind referral on payment
    await bindReferralIfNeeded(phone);

    var response = await api("/api/pay/orders", {
      method: "POST",
      body: JSON.stringify({
        channel: channel,
        scene: scene,
        reportType: slugTheme(activeTheme),
        amountFen: PAY_AMOUNT_FEN,
        subject: "深度解析服务",
        phone: phone,
        returnUrl: window.location.href.split("?")[0],
        clientContext: getClientContext()
      })
    });

    paymentState.outTradeNo = response.outTradeNo || "";
    // Store outTradeNo in session storage for return detection
    if (paymentState.outTradeNo) {
      try { sessionStorage.setItem("zodiac_pay_otn", paymentState.outTradeNo); } catch(e) {}
    }
    return response;
  } finally {
    setPayLoading(false);
  }
}

function redirectToPayUrl(url) {
  try { sessionStorage.setItem("zodiac_pay_return", "1"); } catch(e) {}
  window.location.href = url;
}

async function handleWechatH5Pay() {
  try {
    var order = await createPayOrder("wechat");
    var payPayload = order.payPayload || {};
    var mwebUrl = payPayload.mwebUrl;
    if (!mwebUrl) {
      throw new Error("未获取到微信支付链接");
    }
    if (payPayload.mock) {
      setPayStatus("当前为开发模拟支付环境，请在正式环境下测试真实支付。", false);
      // In mock mode, poll for status
      await pollOrderStatus(order.outTradeNo);
      return;
    }
    setPayStatus("正在跳转到微信支付...");
    redirectToPayUrl(mwebUrl);
  } catch (error) {
    setPayStatus(error.message || "创建微信支付订单失败");
    setPayLoading(false);
  }
}

async function handleAlipayWapPay() {
  try {
    var order = await createPayOrder("alipay");
    var payPayload = order.payPayload || {};
    var payUrl = payPayload.payUrl;
    if (!payUrl) {
      throw new Error("未获取到支付宝支付链接");
    }
    if (payPayload.mock) {
      setPayStatus("当前为开发模拟支付环境，请在正式环境下测试真实支付。", false);
      await pollOrderStatus(order.outTradeNo);
      return;
    }
    setPayStatus("正在跳转到支付宝支付...");
    redirectToPayUrl(payUrl);
  } catch (error) {
    setPayStatus(error.message || "创建支付宝支付订单失败");
    setPayLoading(false);
  }
}

async function submitPayment() {
  if (paymentState.payChannel === "alipay") {
    await handleAlipayWapPay();
  } else {
    await handleWechatH5Pay();
  }
}

function cancelPolling() {
  if (paymentState.pollTimer) {
    clearTimeout(paymentState.pollTimer);
    paymentState.pollTimer = null;
  }
}

async function pollOrderStatus(outTradeNo) {
  cancelPolling();
  var startTime = Date.now();
  var timeoutMs = 180000;
  var intervalMs = 3000;

  var check = async function() {
    try {
      var response = await api("/api/pay/orders/" + encodeURIComponent(outTradeNo));
      if (response.paid || response.status === "PAID") {
        handlePaymentSuccess(response);
        return;
      }
      if (response.status === "CLOSED" || response.status === "EXPIRED") {
        setPayStatus("订单已过期或已关闭，请重新发起支付。", false);
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        setPayStatus("支付等待超时，如有任何疑问请联系客服。");
        return;
      }
      setPayStatus("等待支付完成...已等待 " + Math.floor((Date.now() - startTime) / 1000) + " 秒");
      paymentState.pollTimer = setTimeout(check, intervalMs);
    } catch (e) {
      setPayStatus("查询支付状态失败：" + (e.message || e));
    }
  };

  await check();
}

async function consumePaymentToken(outTradeNo) {
  try {
    var response = await api("/api/pay/orders/" + encodeURIComponent(outTradeNo) + "/consume", {
      method: "POST"
    });
    return response.success;
  } catch(e) {
    console.warn("Token consumption failed:", e.message || e);
    return false;
  }
}

function handlePaymentSuccess(orderResponse) {
  cancelPolling();
  var accessToken = orderResponse.accessToken || "";
  if (accessToken) {
    paymentState.accessTokens[activeTheme] = accessToken;
    paymentState.unlockSource = orderResponse.unlockSource === "ADMIN_APPROVED" ? "admin_approved" : "payment";
  }
  setPayStatus("支付成功！系统已自动解锁深度解析。", true);
  setModel("claude");
  setTimeout(function() {
    closeModal("pay-modal");
  }, 800);
}

// ===== Return-from-Payment Detection =====
async function handlePaymentReturn() {
  if (paymentState.payReturnHandled) return;
  var wasReturning = false;
  try { wasReturning = sessionStorage.getItem("zodiac_pay_return") === "1"; } catch(e) {}
  if (!wasReturning) return;

  var outTradeNo = "";
  try { outTradeNo = sessionStorage.getItem("zodiac_pay_otn") || ""; } catch(e) {}
  try { sessionStorage.removeItem("zodiac_pay_return"); } catch(e) {}
  try { sessionStorage.removeItem("zodiac_pay_otn"); } catch(e) {}

  paymentState.payReturnHandled = true;

  if (!outTradeNo) return;

  try {
    var response = await api("/api/pay/orders/" + encodeURIComponent(outTradeNo));
    if (response.paid || response.status === "PAID") {
      // Consume token automatically
      var consumed = await consumePaymentToken(outTradeNo);
      if (consumed || response.accessToken) {
        var token = response.accessToken || "";
        if (token) {
          paymentState.accessTokens[activeTheme] = token;
          paymentState.unlockSource = "payment";
          setModel("claude");
          showToast("支付成功！深度解析已解锁。");
        }
      }
    } else if (response.status === "PAYING" || response.status === "CREATED") {
      showToast("支付处理中，即将刷新状态...");
      paymentState.outTradeNo = outTradeNo;
      openModal("pay-modal");
      pollOrderStatus(outTradeNo);
    } else {
      showToast("支付未完成，可在提交表单时重新选择支付方式。");
    }
  } catch(e) {
    console.warn("Payment return check failed:", e.message || e);
  }

function buildReportId(reportUid) {
  const value = safeText(reportUid, "Report");
  return `
    <span class="cover-meta-id-label">COLLECTOR CODE</span>
    <span class="cover-meta-id-value">${escapeHtml(value)}</span>
  `;
}

function formatTriplet(info) {
  if (!info) return "太阳 — / 月亮 — / 上升 —";
  return `太阳 ${info.sun || "—"} · 月亮 ${info.moon || "—"} · 上升 ${info.rising || "—"}`;
}

function chapterEmoji(index) {
  return padStart2(index + 1);
}

function getShareCardTitle(reportType) {
  if (reportType === "love") return "爱情合盘";
  if (reportType === "career") return "事业报告";
  return "财运报告";
}

function buildShareCardSource() {
  const reportType = latestReport ? latestReport.reportType : "";
  const title = getShareCardTitle(reportType);
  const reportId = latestReport && latestReport.reportUid ? latestReport.reportUid : "Report";
  const personAName = (latestReport && latestReport.personA && latestReport.personA.name) || "我";
  const personBName = (latestReport && latestReport.personB && latestReport.personB.name) || "TA";
  const zodiacA = ((latestReport && latestReport.zodiacA && latestReport.zodiacA.sun) || "SUN").toUpperCase();
  const zodiacB = ((latestReport && latestReport.zodiacB && latestReport.zodiacB.sun) || "MOON").toUpperCase();
  const isLove = reportType === "love";
  return `
    <div class="sc-emblem">
      <div class="sc-emblem-text">XIAODENG ARCHIVE</div>
      <div class="sc-emblem-deco">✦ ✦ ✦</div>
    </div>
    <div class="sc-names">
      <div class="sc-name-row">
        <div class="sc-name-block">
          <div class="sc-name">${escapeHtml(personAName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacA)}</div>
        </div>
        ${isLove ? `<div class="sc-heart">❤</div>
        <div class="sc-name-block">
          <div class="sc-name">${escapeHtml(personBName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacB)}</div>
        </div>` : ""}
      </div>
    </div>
    <div class="sc-score-block">
      <div><span class="sc-score">${escapeHtml(String(latestReport && latestReport.score != null ? latestReport.score : "--"))}</span><span class="sc-score-unit">/100</span></div>
      <div class="sc-score-label">REPORT SCORE</div>
    </div>
    <div class="sc-type">
      <span class="sc-type-text">${escapeHtml((latestReport && latestReport.relationshipType) || title)}</span>
    </div>
    <div class="sc-tagline">${escapeHtml((latestReport && latestReport.tagline) || "愿你更了解自己，也更从容地做选择。")}</div>
    <div class="sc-footer">
      <div class="sc-id">COLLECTOR CODE · ${escapeHtml(reportId)}</div>
      <div class="sc-by">CREATED BY <span class="name">小登哥 · XIAODENG</span></div>
      <div class="sc-call">打开同一链接即可查看完整报告<br><strong>${escapeHtml(getReportShareUrl(latestReport && latestReport.reportUid))}</strong></div>
    </div>
  `;
}

async function generateShareCardDataUrl() {
  if (!latestReport) throw new Error("请先生成报告");
  if (typeof window.html2canvas !== "function") {
    throw new Error("当前环境不支持生成图片，可复制链接");
  }
  const source = document.createElement("div");
  source.id = "share-card-source";
  source.innerHTML = buildShareCardSource();
  document.body.appendChild(source);
  try {
    const canvas = await window.html2canvas(source, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 3),
      useCORS: true
    });
    latestShareCardDataUrl = canvas.toDataURL("image/png");
    return latestShareCardDataUrl;
  } finally {
    document.body.removeChild(source);
  }
}

function renderReport(response) {
  latestReport = response;
  resetShareCardCache(response);
  syncReportUrl(response.reportUid);
  const reportTheme = slugTheme(response.reportType);
  const themeCopy = THEME_COPY[reportTheme];
  $("cover-title-cn").textContent = themeCopy && themeCopy.coverTitleCn ? themeCopy.coverTitleCn : "深度报告";
  $("cover-title-en").textContent = themeCopy && themeCopy.coverTitleEn ? themeCopy.coverTitleEn : "Premium Reading";
  $("cover-score").textContent = response.score == null ? "--" : response.score;
  $("cover-score-label").textContent = themeCopy && themeCopy.scoreLabel ? themeCopy.scoreLabel : "REPORT INDEX";
  $("cover-type").textContent = response.relationshipType || "关系洞察";
  $("cover-tagline").textContent = response.tagline || "愿你更了解自己，也更从容地做选择。";
  $("cover-id").innerHTML = buildReportId(response.reportUid);
  $("cover-date").textContent = new Date().toLocaleDateString("zh-CN");
  $("cover-person-a").textContent = (response.personA && response.personA.name) || stateByTheme[activeTheme].a.name || "我";
  $("cover-zodiac-a-name").textContent = (((response.zodiacA && response.zodiacA.sun) || "SUN")).toUpperCase();
  $("cover-zodiac-a-icon").textContent = getZodiacSymbol((response.zodiacA && response.zodiacA.sun) || "SUN");

  const isLove = response.reportType === "love";
  $("cover-zodiac-b-block").style.display = isLove ? "" : "none";
  $("cover-heart").style.display = isLove ? "" : "none";
  if (isLove) {
    $("cover-person-b").textContent = (response.personB && response.personB.name) || stateByTheme[activeTheme].b.name || "TA";
    $("cover-zodiac-b-name").textContent = (((response.zodiacB && response.zodiacB.sun) || "MOON")).toUpperCase();
    $("cover-zodiac-b-icon").textContent = getZodiacSymbol((response.zodiacB && response.zodiacB.sun) || "MOON");
  }

  $("zodiac-details").innerHTML = `
    <div class="chapter-head">
      <div class="chapter-emoji">✦</div>
      <div class="chapter-title">星盘重点</div>
    </div>
    <div class="zd-summary-list">
      <div class="zd-summary-item">
        <div class="zd-summary-name">${escapeHtml((response.personA && response.personA.name) || "我")}</div>
        <div class="zd-summary-sep">·</div>
        <div class="zd-summary-value">${escapeHtml(formatTriplet(response.zodiacA))}</div>
      </div>
      ${isLove ? `
      <div class="zd-summary-item">
        <div class="zd-summary-name">${escapeHtml((response.personB && response.personB.name) || "TA")}</div>
        <div class="zd-summary-sep">·</div>
        <div class="zd-summary-value">${escapeHtml(formatTriplet(response.zodiacB))}</div>
      </div>` : ""}
    </div>
  `;

  $("chapters-container").innerHTML = (response.chapters || []).map((chapter, index) => `
    <div class="chapter">
      <div class="chapter-num">${chapterEmoji(index)}</div>
      <div class="chapter-head">
        <div class="chapter-emoji">${escapeHtml(chapter.emoji || "✦")}</div>
        <div class="chapter-title">${escapeHtml(chapter.title || `章节 ${index + 1}`)}</div>
      </div>
      <div class="chapter-body">${replaceAllText(escapeHtml(chapter.content || ""), "\n", "<br>")}</div>
    </div>
  `).join("");

  $("essence-list").innerHTML = (response.essence || []).map((item, index) => `
    <li class="essence-item">
      <div class="essence-item-num">${padStart2(index + 1)}</div>
      <div class="essence-item-text">${escapeHtml(item)}</div>
    </li>
  `).join("");

  $("action-bar-sub").textContent = response.reportType === "love"
    ? "把这份只属于你们的关系答案，优雅地留存，也安心地分享给彼此。"
    : "把这份只属于此刻的个人答案，安静收藏，也分享给真正懂你的人。";
}

const originalRenderReport = renderReport;
renderReport = function patchedRenderReport(response) {
  originalRenderReport(response);

  const isLove = response && response.reportType === "love";
  const coverRow = $("cover-zodiac-row");
  if (coverRow) {
    coverRow.classList.toggle("single-report", !isLove);
  }

  const zodiacASun = response && response.zodiacA ? response.zodiacA.sun : "";
  if ($("cover-zodiac-a-name")) {
    $("cover-zodiac-a-name").textContent = String(zodiacASun || "SUN").toUpperCase();
  }
  if ($("cover-zodiac-a-icon")) {
    $("cover-zodiac-a-icon").textContent = getZodiacSymbol(zodiacASun);
  }

  if (isLove) {
    const zodiacBSun = response && response.zodiacB ? response.zodiacB.sun : "";
    if ($("cover-zodiac-b-name")) {
      $("cover-zodiac-b-name").textContent = String(zodiacBSun || "MOON").toUpperCase();
    }
    if ($("cover-zodiac-b-icon")) {
      $("cover-zodiac-b-icon").textContent = getZodiacSymbol(zodiacBSun);
    }
  }
};

async function loadSharedReportFromUrl() {
  const reportUid = getReportUidFromUrl();
  if (!reportUid) return false;
  switchPage("loading");
  startLoadingAnimation();
  try {
    const response = await api(`/api/compatibility/report/${encodeURIComponent(reportUid)}`);
    stopLoadingAnimation(100, {
      animate: true,
      onComplete: () => {
        renderReport(response);
        switchPage("report");
      }
    });
    return true;
  } catch (error) {
    stopLoadingAnimation(0);
    switchPage("form");
    showFormError(error.message || "生成失败");
    return false;
  }
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
    stopLoadingAnimation(100, {
      animate: true,
      onComplete: () => {
        renderReport(response);
        switchPage("report");
      }
    });
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
  const selectedModel = themeModelState[activeTheme] || "deepseek";
  if (selectedModel === "claude" && !paymentState.accessTokens[activeTheme]) {
    openModal("value-modal");
    return;
  }
  try {
    await generateReport(selectedModel);
    if (selectedModel === "claude") {
      paymentState.accessTokens[activeTheme] = "";
      setModel("deepseek");
    }
  } catch (error) {
    showFormError(error.message || "生成失败");
  }
}

async function beginPremiumFlow() {
  closeModal("value-modal");
  // Pre-fill phone if available
  var phoneEl = $("pay-phone-input");
  if (phoneEl) {
    phoneEl.value = getLastBoundPhone() || "";
  }
  // Reset payment state
  cancelPolling();
  paymentState.payChannel = "wechat";
  setPayStatus("请选择支付方式并填写手机号，支付成功后自动解锁。");
  setPayLoading(false);
  // Highlight wechat button
  document.querySelectorAll(".pay-channel-btn").forEach(function(btn) {
    btn.classList.toggle("active", btn.dataset.channel === "wechat");
  });
  // Show invite hint if present
  var inviteHint = $("pay-invite-hint");
  if (inviteHint) {
    var code = getPendingInviteCode();
    inviteHint.textContent = code ? "检测到邀请码：" + code + "，支付后将自动关联返现。请务必填写手机号！" : "";
  }
  openModal("pay-modal");
}

async function enterPremiumReport() {
  try {
    await submitPayment();
  } catch (error) {
    setPayStatus(error.message || "支付发起失败");
  }
}

async function renderSharePreview(forceRegenerate = false) {
  const preview = $("share-preview");
  if (!preview) return;
  preview.innerHTML = `<div class="share-preview-loading">正在生成分享卡...</div>`;
  const dataUrl = !forceRegenerate && latestShareCardDataUrl
    ? latestShareCardDataUrl
    : await generateShareCardDataUrl();
  preview.innerHTML = `<img src="${dataUrl}" alt="分享卡预览" class="share-preview-image">`;
}

async function saveShareCardToAlbum() {
  const dataUrl = latestShareCardDataUrl || await generateShareCardDataUrl();
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `zodiac-report-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function copyReportLink() {
  const shareUrl = getReportShareUrl(latestReport && latestReport.reportUid);
  await navigator.clipboard.writeText(shareUrl);
}

async function openNativeShare() {
  if (!latestReport || typeof navigator.share !== "function") return false;
  const reportType = latestReport.reportType === "love"
    ? "爱情合盘"
    : latestReport.reportType === "career"
      ? "事业报告"
      : "财运报告";
  const shareUrl = getReportShareUrl(latestReport.reportUid);
  try {
    await navigator.share({
      title: `${reportType} · 小登哥`,
      text: latestReport.tagline || "分享一份专属报告给你看看",
      url: shareUrl
    });
    return true;
  } catch (error) {
    if (error && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}

function getSafeShareUrl() {
  if (!latestReport || !latestReport.reportUid) {
    throw new Error("请先生成报告");
  }
  return getReportShareUrl(latestReport.reportUid);
}

function renderShareLinkBox(message) {
  const box = $("share-link-box");
  if (!box) return;
  try {
    const shareUrl = getSafeShareUrl();
    box.classList.remove("hidden");
    box.innerHTML = `
      <span class="share-link-label">${escapeHtml(message || "如果系统复制不可用，可手动复制下方链接")}</span>
      <span class="share-link-value">${escapeHtml(shareUrl)}</span>
    `;
  } catch {
    box.classList.add("hidden");
    box.innerHTML = "";
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("复制失败");
  }
}

async function copyReportLinkWithFallback() {
  const shareUrl = getSafeShareUrl();
  if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return;
    } catch {}
  }
  fallbackCopyText(shareUrl);
}

function buildEnhancedShareCardSource() {
  const reportType = latestReport ? latestReport.reportType : "";
  const title = getShareCardTitle(reportType);
  const reportId = latestReport && latestReport.reportUid ? latestReport.reportUid : "Report";
  const personAName = (latestReport && latestReport.personA && latestReport.personA.name) || "我";
  const personBName = (latestReport && latestReport.personB && latestReport.personB.name) || "TA";
  const zodiacA = ((latestReport && latestReport.zodiacA && latestReport.zodiacA.sun) || "SUN").toUpperCase();
  const zodiacB = ((latestReport && latestReport.zodiacB && latestReport.zodiacB.sun) || "MOON").toUpperCase();
  const zodiacAIcon = getZodiacSymbol(zodiacA);
  const zodiacBIcon = getZodiacSymbol(zodiacB);
  const isLove = reportType === "love";
  const shareUrl = latestReport && latestReport.reportUid ? getReportShareUrl(latestReport.reportUid) : "";
  return `
    <div class="sc-emblem">
      <div class="sc-emblem-text">XIAODENG ARCHIVE</div>
      <div class="sc-emblem-deco">✦ ✦ ✦</div>
    </div>
    <div class="sc-names">
      <div class="sc-name-row ${isLove ? "" : "single-report"}">
        <div class="sc-name-block">
          <div class="sc-zodiac-icon">${escapeHtml(zodiacAIcon)}</div>
          <div class="sc-name">${escapeHtml(personAName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacA)}</div>
        </div>
        ${isLove ? `<div class="sc-heart">❤</div>
        <div class="sc-name-block">
          <div class="sc-zodiac-icon">${escapeHtml(zodiacBIcon)}</div>
          <div class="sc-name">${escapeHtml(personBName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacB)}</div>
        </div>` : ""}
      </div>
    </div>
    <div class="sc-score-block">
      <div><span class="sc-score">${escapeHtml(String(latestReport && latestReport.score != null ? latestReport.score : "--"))}</span><span class="sc-score-unit">/100</span></div>
      <div class="sc-score-label">REPORT SCORE</div>
    </div>
    <div class="sc-type">
      <span class="sc-type-text">${escapeHtml((latestReport && latestReport.relationshipType) || title)}</span>
    </div>
    <div class="sc-tagline">${escapeHtml((latestReport && latestReport.tagline) || "愿你更了解自己，也更从容地做选择。")}</div>
    <div class="sc-footer">
      <div class="sc-id">COLLECTOR CODE · ${escapeHtml(reportId)}</div>
      <div class="sc-by">CREATED BY <span class="name">小登哥 · XIAODENG</span></div>
      <div class="sc-call">打开同一链接即可查看完整报告<br><strong>${escapeHtml(shareUrl)}</strong></div>
    </div>
  `;
}

const originalGenerateShareCardDataUrl = generateShareCardDataUrl;
generateShareCardDataUrl = async function patchedGenerateShareCardDataUrl() {
  if (!latestReport) throw new Error("请先生成报告");
  if (typeof window.html2canvas !== "function") {
    throw new Error("当前环境不支持生成图片，可复制链接");
  }
  const source = document.createElement("div");
  source.id = "share-card-source";
  source.innerHTML = buildEnhancedShareCardSource();
  document.body.appendChild(source);
  try {
    const canvas = await window.html2canvas(source, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 3),
      useCORS: true
    });
    latestShareCardDataUrl = canvas.toDataURL("image/png");
    return latestShareCardDataUrl;
  } finally {
    document.body.removeChild(source);
  }
};

renderSharePreview = async function patchedRenderSharePreview(forceRegenerate = false) {
  renderShareLinkBox();
  const preview = $("share-preview");
  if (!preview) return;
  preview.innerHTML = `<div class="share-preview-loading">正在生成分享卡...</div>`;
  const dataUrl = !forceRegenerate && latestShareCardDataUrl
    ? latestShareCardDataUrl
    : await generateShareCardDataUrl();
  preview.innerHTML = `<img src="${dataUrl}" alt="分享卡预览" class="share-preview-image">`;
};

function bindFormEvents() {
  document.querySelectorAll(".theme-tab").forEach((button) => {
    button.addEventListener("click", () => renderTheme(button.dataset.theme));
  });

  document.querySelectorAll(".person-input, .person-select").forEach((element) => {
    const eventName = element.tagName === "SELECT" || element.type === "time" ? "change" : "input";
    element.addEventListener("focus", () => {
      clearFormErrorForActiveTheme(element);
    });
    element.addEventListener(eventName, () => {
      const theme = getElementTheme(element);
      const personKey = element.dataset.person;
      const field = element.dataset.field;
      if (!theme || !personKey || !field) return;
      clearFormErrorForActiveTheme(element);
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
      const theme = getElementTheme(button);
      const personKey = button.dataset.person;
      if (!theme || !personKey) return;
      clearFormErrorForActiveTheme(button);
      setThemeState(theme, personKey, { gender: button.dataset.value });
      renderPerson(theme, personKey);
    });
  });

  document.querySelectorAll(".model-option").forEach((button) => {
    button.addEventListener("click", () => {
      const slide = closestBySelector(button, ".form-slide");
      const theme = slide && slide.dataset ? slide.dataset.theme : "";
      if (!theme) return;
      activeTheme = theme;
      if (button.dataset.model === "claude") {
        setModel("claude");
        openModal("value-modal");
      } else {
        paymentState.accessTokens[theme] = "";
        setModel("deepseek");
      }
    });
  });

  if ($("submit-btn")) $("submit-btn").addEventListener("click", handleSubmit);
  if ($("share-close")) $("share-close").addEventListener("click", () => closeModal("share-modal"));
  if ($("pay-modal-close")) $("pay-modal-close").addEventListener("click", () => closeModal("pay-modal"));
  if ($("value-modal-close")) $("value-modal-close").addEventListener("click", () => closeModal("value-modal"));
  if ($("city-picker-close")) $("city-picker-close").addEventListener("click", () => closeModal("city-picker-modal"));
  if ($("value-modal-pay-btn")) $("value-modal-pay-btn").addEventListener("click", beginPremiumFlow);
  if ($("value-modal-free-btn")) $("value-modal-free-btn").addEventListener("click", () => {
    setModel("deepseek");
    closeModal("value-modal");
  });
  if ($("pay-confirm-btn")) $("pay-confirm-btn").addEventListener("click", enterPremiumReport);
  if ($("pay-channel-wechat")) $("pay-channel-wechat").addEventListener("click", function() { selectPayChannel("wechat"); });
  if ($("pay-channel-alipay")) $("pay-channel-alipay").addEventListener("click", function() { selectPayChannel("alipay"); });
  if ($("restart-btn")) $("restart-btn").addEventListener("click", () => {
    latestReport = null;
    latestShareCardDataUrl = "";
    switchPage("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  if ($("share-btn")) $("share-btn").addEventListener("click", async () => {
    const shared = await openNativeShare();
    if (!shared) {
      await renderSharePreview();
      openModal("share-modal");
    }
  });
  if ($("share-download")) $("share-download").addEventListener("click", async () => {
    try {
      await renderSharePreview();
      await saveShareCardToAlbum();
      showToast("分享卡已生成，可直接保存");
    } catch {
      showToast("请长按图片保存到相册");
    }
  });
  if ($("share-copy-link")) $("share-copy-link").addEventListener("click", async () => {
    try {
      await copyReportLink();
      showToast("分享链接已复制");
    } catch {
      showToast("复制分享链接失败，请稍后再试");
    }
  });
  if ($("pdf-btn")) $("pdf-btn").addEventListener("click", async () => {
    try {
      await renderSharePreview(true);
      openModal("share-modal");
      showToast("分享卡已生成，请长按图片保存到相册");
    } catch {
      showToast("生成分享卡失败，请稍后再试");
    }
  });

  if ($("lunar-trigger")) $("lunar-trigger").addEventListener("click", () => {
    lunarYearEl=document.getElementById("lunar-year");
    lunarMonthEl=document.getElementById("lunar-month");
    lunarDayEl=document.getElementById("lunar-day");
    lunarMode="s2l";
    initLunarOptions();
    document.querySelectorAll("#lunar-modal .lunar-tab").forEach(t=>t.classList.toggle("active",t.dataset.mode==="s2l"));
    document.getElementById("lunar-result").classList.remove("show");
    openModal("lunar-modal");
  });
  if ($("lunar-modal-close")) $("lunar-modal-close").addEventListener("click", () => closeModal("lunar-modal"));
  if ($("lunar-convert-btn")) $("lunar-convert-btn").addEventListener("click", doLunarConversion);
  document.querySelectorAll("#lunar-modal .lunar-tab").forEach((button) => {
    button.addEventListener("click", () => switchLunarTab(button.dataset.mode));
  });
  document.addEventListener("change", (e) => {
    if(e.target.id==="lunar-year"){ fillLunarMonth(); }
    if(e.target.id==="lunar-month"){ fillLunarDay(); }
  });

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
  cityCoordinateData = await response.json();
  cityIndex = buildCityIndex(cityCoordinateData);
}

async function init() {
  document.title = "灵魂合盘 · 你和 TA 的缘分密码 · 小登哥出品";
  populateDateSelects();
  bindFormEvents();
  setupFinalShareHandlers();
  try {
    await loadCityData();
  } catch (error) {
    showFormError(error.message || "页面初始化失败");
  }
  THEMES.forEach((theme) => {
    renderPerson(theme, "a");
    if (theme === "love") renderPerson(theme, "b");
  });
  setModel(themeModelState[activeTheme] || "deepseek");
  renderTheme(activeTheme);

  // Save invite code from URL
  var urlInviteCode = getInviteCodeFromUrl();
  if (urlInviteCode) saveInviteCode(urlInviteCode);

  // Handle return from payment gateway
  handlePaymentReturn().catch(function() {});

  if (await loadSharedReportFromUrl()) {
    return;
  }
  window.addEventListener("resize", () => {
    adjustThemeIndicator();
    adjustSliderHeight();
  });
}

function bindExclusiveClick(id, handler) {
  const element = $(id);
  if (!element) return;
  const clone = element.cloneNode(true);
  element.replaceWith(clone);
  clone.addEventListener("click", handler);
}

function getFinalShareUrl() {
  if (!latestReport || !latestReport.reportUid) {
    throw new Error("请先生成报告");
  }
  return getReportShareUrl(latestReport.reportUid);
}

function renderFinalShareLinkBox(message) {
  const box = $("share-link-box");
  if (!box) return;
  try {
    const shareUrl = getFinalShareUrl();
    box.classList.remove("hidden");
    box.innerHTML = `
      <span class="share-link-label">${escapeHtml(message || "如果自动复制不可用，可手动复制下方链接")}</span>
      <span class="share-link-value">${escapeHtml(shareUrl)}</span>
    `;
  } catch {
    box.classList.add("hidden");
    box.innerHTML = "";
  }
}

function fallbackCopyShareText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("复制失败，请手动复制");
  }
}

async function copyReportLinkWithFinalFallback() {
  const shareUrl = getFinalShareUrl();
  if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return;
    } catch {}
  }
  fallbackCopyShareText(shareUrl);
}

function buildFinalShareCardSource() {
  const reportType = latestReport ? latestReport.reportType : "";
  const title = getShareCardTitle(reportType);
  const reportId = latestReport && latestReport.reportUid ? latestReport.reportUid : "Report";
  const personAName = (latestReport && latestReport.personA && latestReport.personA.name) || "我";
  const personBName = (latestReport && latestReport.personB && latestReport.personB.name) || "TA";
  const zodiacA = ((latestReport && latestReport.zodiacA && latestReport.zodiacA.sun) || "SUN").toUpperCase();
  const zodiacB = ((latestReport && latestReport.zodiacB && latestReport.zodiacB.sun) || "MOON").toUpperCase();
  const zodiacAIcon = getZodiacSymbol(zodiacA);
  const zodiacBIcon = getZodiacSymbol(zodiacB);
  const isLove = reportType === "love";
  const shareUrl = latestReport && latestReport.reportUid ? getReportShareUrl(latestReport.reportUid) : "";
  return `
    <div class="sc-emblem">
      <div class="sc-emblem-text">XIAODENG ARCHIVE</div>
      <div class="sc-emblem-deco">✦ ✦ ✦</div>
    </div>
    <div class="sc-names">
      <div class="sc-name-row ${isLove ? "" : "single-report"}">
        <div class="sc-name-block">
          <div class="sc-zodiac-icon">${escapeHtml(zodiacAIcon)}</div>
          <div class="sc-name">${escapeHtml(personAName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacA)}</div>
        </div>
        ${isLove ? `<div class="sc-heart">❤</div>
        <div class="sc-name-block">
          <div class="sc-zodiac-icon">${escapeHtml(zodiacBIcon)}</div>
          <div class="sc-name">${escapeHtml(personBName)}</div>
          <div class="sc-name-zodiac">${escapeHtml(zodiacB)}</div>
        </div>` : ""}
      </div>
    </div>
    <div class="sc-score-block">
      <div><span class="sc-score">${escapeHtml(String(latestReport && latestReport.score != null ? latestReport.score : "--"))}</span><span class="sc-score-unit">/100</span></div>
      <div class="sc-score-label">REPORT SCORE</div>
    </div>
    <div class="sc-type">
      <span class="sc-type-text">${escapeHtml((latestReport && latestReport.relationshipType) || title)}</span>
    </div>
    <div class="sc-tagline">${escapeHtml((latestReport && latestReport.tagline) || "愿你更了解自己，也更从容地做选择。")}</div>
    <div class="sc-footer">
      <div class="sc-id">COLLECTOR CODE · ${escapeHtml(reportId)}</div>
      <div class="sc-by">CREATED BY <span class="name">小登哥 · XIAODENG</span></div>
      <div class="sc-call">打开同一链接即可查看完整报告<br><strong>${escapeHtml(shareUrl)}</strong></div>
    </div>
  `;
}

generateShareCardDataUrl = async function finalGenerateShareCardDataUrl() {
  if (!latestReport) throw new Error("请先生成报告");
  if (typeof window.html2canvas !== "function") {
    throw new Error("当前环境不支持生成图片，可复制链接");
  }
  const source = document.createElement("div");
  source.id = "share-card-source";
  source.innerHTML = buildFinalShareCardSource();
  document.body.appendChild(source);
  try {
    const canvas = await window.html2canvas(source, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 3),
      useCORS: true
    });
    latestShareCardDataUrl = canvas.toDataURL("image/png");
    return latestShareCardDataUrl;
  } finally {
    document.body.removeChild(source);
  }
};

renderSharePreview = async function finalRenderSharePreview(forceRegenerate = false) {
  renderFinalShareLinkBox();
  const preview = $("share-preview");
  if (!preview) return;
  preview.innerHTML = `<div class="share-preview-loading">正在生成分享卡...</div>`;
  const dataUrl = !forceRegenerate && latestShareCardDataUrl
    ? latestShareCardDataUrl
    : await generateShareCardDataUrl();
  preview.innerHTML = `<img src="${dataUrl}" alt="分享卡预览" class="share-preview-image">`;
};

function setupFinalShareHandlers() {
  bindExclusiveClick("share-btn", async () => {
    if (!latestReport || !latestReport.reportUid) {
      showToast("请先生成报告");
      return;
    }
    try {
      const shared = await openNativeShare();
      if (!shared) {
        renderFinalShareLinkBox("系统分享暂不可用，可复制下方链接");
        await renderSharePreview();
        openModal("share-modal");
      }
    } catch {
      renderFinalShareLinkBox("系统分享暂不可用，可复制下方链接");
      await renderSharePreview();
      openModal("share-modal");
    }
  });

  bindExclusiveClick("share-download", async () => {
    try {
      await renderSharePreview();
      await saveShareCardToAlbum();
      showToast("分享卡已生成，可直接保存");
    } catch (error) {
      renderFinalShareLinkBox("当前环境不支持保存图片时，可复制下方链接");
      showToast((error && error.message) || "当前环境不支持生成图片，可复制链接");
    }
  });

  bindExclusiveClick("share-copy-link", async () => {
    try {
      await copyReportLinkWithFinalFallback();
      renderFinalShareLinkBox("链接已准备好，你也可以手动复制下方内容");
      showToast("分享链接已复制");
    } catch (error) {
      renderFinalShareLinkBox("自动复制不可用，请手动复制下方链接");
      showToast((error && error.message) || "复制分享链接失败，请手动复制");
    }
  });

  bindExclusiveClick("pdf-btn", async () => {
    try {
      await renderSharePreview(true);
      renderFinalShareLinkBox();
      openModal("share-modal");
      showToast("分享卡已生成，请长按图片保存到相册");
    } catch (error) {
      renderFinalShareLinkBox("当前环境不支持生成图片时，可复制下方链接");
      showToast((error && error.message) || "生成分享卡失败，请稍后再试");
    }
  });
}

generateShareCardDataUrl = async function cachedGenerateShareCardDataUrl() {
  if (!latestReport) throw new Error("请先生成报告");
  const cacheKey = ensureShareCardCacheFresh();
  if (typeof window.html2canvas !== "function") {
    throw new Error("当前环境不支持生成图片，可复制链接");
  }
  const source = document.createElement("div");
  source.id = "share-card-source";
  source.innerHTML = buildFinalShareCardSource();
  document.body.appendChild(source);
  try {
    const canvas = await window.html2canvas(source, {
      backgroundColor: null,
      scale: Math.min(window.devicePixelRatio || 2, 3),
      useCORS: true
    });
    latestShareCardDataUrl = canvas.toDataURL("image/png");
    latestShareCardCacheKey = cacheKey;
    return latestShareCardDataUrl;
  } finally {
    document.body.removeChild(source);
  }
};

renderSharePreview = async function cachedRenderSharePreview(forceRegenerate = false) {
  renderFinalShareLinkBox();
  const preview = $("share-preview");
  if (!preview) return;
  preview.innerHTML = `<div class="share-preview-loading">正在生成分享卡...</div>`;
  ensureShareCardCacheFresh();
  const dataUrl = !forceRegenerate && latestShareCardDataUrl
    ? latestShareCardDataUrl
    : await generateShareCardDataUrl();
  preview.innerHTML = `<img src="${dataUrl}" alt="分享卡预览" class="share-preview-image">`;
};

init().catch((error) => {
  showFormError(error.message || "页面初始化失败");
});

