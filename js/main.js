"use strict";
(function () {
  const DATA = window.SWORD_DATA;
  const LEVELS = DATA.levels;
  const MAX_LEVEL = LEVELS.length - 1;
  const SAVE_KEY = "sword-game-save-v1";
  const STORAGE_MAX = 12;
  const HOT_DURATION_MS = 10 * 60 * 1000;
  const HOT_COST_MULTIPLIER = 0.95;
  const HOT_SUCCESS_MULTIPLIER = 1.05;
  const DAILY_REWARD_BOOST_COUNT = 1;
  const BOOST_SUCCESS_BONUS = 5;
  const SHOP_ITEMS = [
    { level: 10, price: 300000 },
    { level: 15, price: 12000000 },
    { level: 17, price: 53000000 }
  ];

  // ---------- 상태 ----------
  let state = load();
  let busy = false;        // 강화 연출 중 입력 잠금
  let attachedItem = null; // 채팅에 첨부할 아이템
  let activeStorageTab = "storage";
  let activeRankingTab = "total";
  let rankingState = { total: [], daily: [] };
  let adminPassword = "";
  let hotTime = { startedAt: null, activeUntil: 0 };
  let hotTimeClock = null;
  let hotTimeWasActive = false;

  function defaultState() {
    return {
      nickname: "용사" + Math.floor(1000 + Math.random() * 9000),
      clientId: (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random()),
      gold: DATA.startingGold,
      dailyGold: 0,
      dailyGoldDate: todayKey(),
      lastDailyRewardDate: null,
      boostItems: 0,
      lastResetAt: null,
      sword: { level: 0 },
      storage: []
    };
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function clampLevel(lv) {
    lv = Number(lv) || 0;
    return Math.max(0, Math.min(MAX_LEVEL, Math.floor(lv)));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      const d = defaultState();
      return {
        nickname: (typeof s.nickname === "string" && s.nickname.trim()) ? s.nickname.trim().slice(0, 12) : d.nickname,
        clientId: s.clientId || d.clientId,
        gold: Math.max(0, Number(s.gold) || 0),
        dailyGold: s.dailyGoldDate === todayKey() ? Math.max(0, Number(s.dailyGold) || 0) : 0,
        dailyGoldDate: s.dailyGoldDate === todayKey() ? s.dailyGoldDate : todayKey(),
        lastDailyRewardDate: typeof s.lastDailyRewardDate === "string" ? s.lastDailyRewardDate : null,
        boostItems: Math.max(0, Math.floor(Number(s.boostItems) || 0)),
        lastResetAt: typeof s.lastResetAt === "string" ? s.lastResetAt : null,
        sword: { level: clampLevel(s.sword && s.sword.level) },
        storage: Array.isArray(s.storage)
          ? s.storage
            .map(it => ({ level: clampLevel(it && it.level) }))
            .filter(it => it.level > 0)
            .slice(0, STORAGE_MAX)
          : []
      };
    } catch {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  const fmt = n => Number(n).toLocaleString("ko-KR");

  function scheduledHotTimeUntil(now) {
    const d = new Date(now);
    if (d.getMinutes() >= 10) return 0;
    d.setMinutes(10, 0, 0);
    return d.getTime();
  }

  function currentHotTimeUntil() {
    const now = Date.now();
    return Math.max(hotTime.activeUntil, scheduledHotTimeUntil(now));
  }

  function isHotTimeActive() {
    return Date.now() < currentHotTimeUntil();
  }

  function effectiveEnhanceCost(baseCost) {
    return isHotTimeActive() ? Math.floor(baseCost * HOT_COST_MULTIPLIER) : baseCost;
  }

  function effectiveSuccessRate(baseRate, useBoost) {
    const rate = isHotTimeActive() ? baseRate * HOT_SUCCESS_MULTIPLIER : baseRate;
    const boostedRate = useBoost ? rate + BOOST_SUCCESS_BONUS : rate;
    return Math.min(100, Number(boostedRate.toFixed(2)));
  }

  function fmtRate(rate) {
    return Number(rate).toFixed(2).replace(/\.?0+$/, "");
  }

  function fmtRemaining(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(total / 60);
    const sec = String(total % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }

  function startHotTimeClock() {
    if (hotTimeClock) return;
    hotTimeWasActive = isHotTimeActive();
    hotTimeClock = setInterval(() => {
      const active = isHotTimeActive();
      renderHotTime();
      if (active !== hotTimeWasActive) {
        hotTimeWasActive = active;
        renderCosts();
      }
    }, 1000);
  }

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const el = {
    nickBtn: $("nickBtn"), nickInput: $("nickInput"),
    storageTab: $("storageTab"), shopTab: $("shopTab"),
    storagePane: $("storagePane"), shopPane: $("shopPane"),
    storageList: $("storageList"), storageEmpty: $("storageEmpty"), shopList: $("shopList"),
    btnEnhance: $("btnEnhance"), btnSell: $("btnSell"), btnStore: $("btnStore"),
    successRate: $("successRate"), costInfo: $("costInfo"),
    chkDown: $("chkDown"), chkDest: $("chkDest"),
    chkBoost: $("chkBoost"), boostCount: $("boostCount"),
    downCost: $("downCost"), destCost: $("destCost"),
    hotTimeBanner: $("hotTimeBanner"),
    swordStage: $("swordStage"), swordVisual: $("swordVisual"),
    swordName: $("swordName"), resultMsg: $("resultMsg"),
    goldAmount: $("goldAmount"),
    rankTotalTab: $("rankTotalTab"), rankDailyTab: $("rankDailyTab"),
    rankingList: $("rankingList"),
    chatMessages: $("chatMessages"), chatForm: $("chatForm"), chatInput: $("chatInput"),
    btnItemLink: $("btnItemLink"), attachBar: $("attachBar"),
    attachChip: $("attachChip"), attachRemove: $("attachRemove"),
    rewardPopup: $("rewardPopup"), rewardMessage: $("rewardMessage"), rewardClose: $("rewardClose")
  };

  // ---------- 검 비주얼 (이미지 없으면 SVG 대체) ----------
  const TIERS = [
    { max: 4,  blade: "#b8c4d0", edge: "#e8eef4", guard: "#8a7a5c", glow: "160,180,200" },
    { max: 9,  blade: "#7ec3ff", edge: "#d6ecff", guard: "#4f7fb8", glow: "90,170,255" },
    { max: 14, blade: "#c390ff", edge: "#eadcff", guard: "#8a5cc4", glow: "170,110,255" },
    { max: 17, blade: "#ffc94d", edge: "#fff2c7", guard: "#b8893a", glow: "255,190,60" },
    { max: 99, blade: "#ff6a5e", edge: "#ffd9d4", guard: "#a13c35", glow: "255,90,70" }
  ];
  const tierOf = lv => TIERS.find(t => lv <= t.max);

  function svgSword(lv) {
    const t = tierOf(lv);
    return `<svg viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,6 76,44 76,150 60,168 44,150 44,44" fill="${t.blade}"/>
      <polygon points="60,6 60,168 44,150 44,44" fill="${t.edge}" opacity="0.45"/>
      <line x1="60" y1="20" x2="60" y2="155" stroke="${t.edge}" stroke-width="3" opacity="0.7"/>
      <rect x="28" y="152" width="64" height="14" rx="6" fill="${t.guard}"/>
      <rect x="53" y="166" width="14" height="46" rx="5" fill="#4a3a28"/>
      <circle cx="60" cy="222" r="11" fill="${t.guard}"/>
    </svg>`;
  }

  // 이미지가 있으면 이미지, 로드 실패 시 SVG로 대체되는 요소 생성
  function swordVisualEl(lv, cssClass) {
    const t = tierOf(lv);
    const wrap = document.createElement("div");
    wrap.className = cssClass;
    const glowStrength = 4 + (lv % 5) * 3 + Math.min(Math.floor(lv / 5), 4) * 4;
    wrap.style.filter = `drop-shadow(0 0 ${glowStrength}px rgba(${t.glow},0.8))`;
    const img = document.createElement("img");
    img.alt = "";
    img.onerror = () => {
      img.remove();
      wrap.innerHTML = svgSword(lv);
    };
    img.src = LEVELS[lv].image;
    wrap.appendChild(img);
    return wrap;
  }

  // ---------- 렌더링 ----------
  function renderSword() {
    const d = LEVELS[state.sword.level];
    el.swordVisual.innerHTML = "";
    el.swordVisual.appendChild(swordVisualEl(d.level, "sword-main"));
    el.swordName.textContent = `+${d.level} ${d.name}`;
    el.swordName.style.color = tierOf(d.level).blade;
  }

  function renderHotTime() {
    if (!isHotTimeActive()) {
      el.hotTimeBanner.hidden = true;
      return;
    }
    const activeUntil = currentHotTimeUntil();
    el.hotTimeBanner.hidden = false;
    el.hotTimeBanner.textContent = `핫타임 ${fmtRemaining(activeUntil - Date.now())} 남음 · 강화비용 5% 감소 · 성공확률 5% 증가`;
  }

  function renderCosts() {
    const lv = state.sword.level;
    const d = LEVELS[lv];
    const isMax = lv >= MAX_LEVEL;
    const enhanceCost = effectiveEnhanceCost(d.enhanceCost);
    const boostAvail = !isMax && state.boostItems > 0;
    const useBoost = el.chkBoost.checked && boostAvail;
    const successRate = effectiveSuccessRate(d.successRate, useBoost);

    renderHotTime();
    el.successRate.textContent = isMax ? "MAX" : fmtRate(successRate) + " %";
    el.costInfo.textContent = isMax
      ? `최대 강화 달성! 판매가 ${fmt(d.sellPrice)} 골드`
      : `강화 비용 ${fmt(enhanceCost)} 골드 · 실패 시 파괴 확률 ${d.destroyRate}% · 판매가 ${fmt(d.sellPrice)} 골드`
        + (useBoost ? ` · 확률 업 +${BOOST_SUCCESS_BONUS}% 적용` : "");

    const downAvail = !isMax && lv > 0 && d.downgradeProtectCost > 0;
    const destAvail = !isMax && d.destroyRate > 0;
    el.boostCount.textContent = fmt(state.boostItems);
    el.chkBoost.disabled = !boostAvail;
    if (!boostAvail) el.chkBoost.checked = false;
    el.chkBoost.parentElement.classList.toggle("disabled", !boostAvail);
    el.downCost.textContent = fmt(d.downgradeProtectCost);
    el.destCost.textContent = fmt(d.destroyProtectCost);
    el.chkDown.disabled = !downAvail;
    el.chkDest.disabled = !destAvail;
    if (!downAvail) el.chkDown.checked = false;
    if (!destAvail) el.chkDest.checked = false;
    el.chkDown.parentElement.classList.toggle("disabled", !downAvail);
    el.chkDest.parentElement.classList.toggle("disabled", !destAvail);

    el.btnEnhance.disabled = busy || isMax;
    el.btnSell.disabled = busy;
    el.btnStore.disabled = busy || lv <= 0 || state.storage.length >= STORAGE_MAX;
  }

  function renderGold() {
    el.goldAmount.textContent = fmt(state.gold);
  }

  function normalizeDailyGold() {
    const today = todayKey();
    if (state.dailyGoldDate !== today) {
      state.dailyGoldDate = today;
      state.dailyGold = 0;
    }
  }

  function addGold(amount) {
    amount = Math.max(0, Number(amount) || 0);
    if (!amount) return;
    normalizeDailyGold();
    state.gold += amount;
    state.dailyGold += amount;
  }

  function renderStorage() {
    el.storageList.innerHTML = "";
    el.storageEmpty.hidden = state.storage.length > 0;
    state.storage.forEach((item, i) => {
      const d = LEVELS[item.level];
      const li = document.createElement("li");
      li.className = "storage-item";

      li.appendChild(swordVisualEl(item.level, "sword-thumb"));

      const info = document.createElement("div");
      info.className = "storage-info";
      const nameEl = document.createElement("div");
      nameEl.className = "storage-name";
      nameEl.textContent = `+${d.level} ${d.name}`;
      nameEl.style.color = tierOf(d.level).blade;
      const priceEl = document.createElement("div");
      priceEl.className = "storage-price";
      priceEl.textContent = fmt(d.sellPrice) + " 골드";
      info.append(nameEl, priceEl);
      li.appendChild(info);

      const btn = document.createElement("button");
      btn.className = "swap-btn";
      btn.textContent = "꺼내기";
      btn.title = "강화 중인 검과 교체";
      btn.onclick = () => retrieve(i);
      li.appendChild(btn);

      el.storageList.appendChild(li);
    });
  }

  function renderShop() {
    el.shopList.innerHTML = "";
    SHOP_ITEMS.forEach(item => {
      const d = LEVELS[item.level];
      if (!d) return;

      const li = document.createElement("li");
      li.className = "storage-item";
      li.appendChild(swordVisualEl(item.level, "sword-thumb"));

      const info = document.createElement("div");
      info.className = "storage-info";
      const nameEl = document.createElement("div");
      nameEl.className = "storage-name";
      nameEl.textContent = `+${d.level} ${d.name}`;
      nameEl.style.color = tierOf(d.level).blade;
      const priceEl = document.createElement("div");
      priceEl.className = "shop-price";
      priceEl.textContent = fmt(item.price) + " 골드";
      const noteEl = document.createElement("div");
      noteEl.className = "shop-note";
      noteEl.textContent = "구매 시 보관함으로 이동";
      info.append(nameEl, priceEl, noteEl);
      li.appendChild(info);

      const btn = document.createElement("button");
      btn.className = "swap-btn buy-btn";
      btn.textContent = "구매";
      btn.disabled = busy || state.gold < item.price || state.storage.length >= STORAGE_MAX;
      btn.title = state.storage.length >= STORAGE_MAX
        ? "보관함이 가득 찼습니다"
        : state.gold < item.price
          ? "골드가 부족합니다"
          : `+${d.level} ${d.name} 구매`;
      btn.onclick = () => buyShopItem(item);
      li.appendChild(btn);

      el.shopList.appendChild(li);
    });
  }

  function setStorageTab(tab) {
    activeStorageTab = tab;
    const isStorage = tab === "storage";
    el.storageTab.classList.toggle("active", isStorage);
    el.shopTab.classList.toggle("active", !isStorage);
    el.storageTab.setAttribute("aria-selected", String(isStorage));
    el.shopTab.setAttribute("aria-selected", String(!isStorage));
    el.storagePane.hidden = !isStorage;
    el.shopPane.hidden = isStorage;
  }

  function rankingEntriesWithSelf(tab) {
    normalizeDailyGold();
    const entries = (rankingState[tab] || []).slice();
    const myGold = tab === "daily" ? state.dailyGold : state.gold;
    const selfIndex = entries.findIndex(e => e.self);
    if (selfIndex >= 0) {
      entries[selfIndex] = { ...entries[selfIndex], nickname: state.nickname, gold: myGold, self: true };
    } else {
      entries.push({ nickname: state.nickname, gold: myGold, self: true });
    }
    return entries
      .sort((a, b) => (Number(b.gold) || 0) - (Number(a.gold) || 0))
      .slice(0, 10);
  }

  function renderRanking() {
    const entries = rankingEntriesWithSelf(activeRankingTab);
    el.rankingList.innerHTML = "";
    if (!entries.length) {
      const li = document.createElement("li");
      li.className = "ranking-item empty";
      li.textContent = activeRankingTab === "daily" ? "오늘 획득 기록이 없습니다" : "랭킹 기록이 없습니다";
      el.rankingList.appendChild(li);
      return;
    }
    entries.forEach(e => {
      const li = document.createElement("li");
      li.className = "ranking-item" + (e.self ? " self" : "");
      const nick = document.createElement("span");
      nick.className = "ranking-nick";
      nick.textContent = e.nickname;
      const gold = document.createElement("span");
      gold.className = "ranking-gold";
      gold.textContent = fmt(e.gold) + " 골드";
      li.append(nick, gold);
      el.rankingList.appendChild(li);
    });
  }

  function renderRankings(nextRankings) {
    if (Array.isArray(nextRankings)) {
      rankingState = { total: nextRankings, daily: [] };
    } else {
      rankingState = {
        total: nextRankings.total || [],
        daily: nextRankings.daily || []
      };
    }
    renderRanking();
  }

  function setRankingTab(tab) {
    activeRankingTab = tab;
    el.rankTotalTab.classList.toggle("active", tab === "total");
    el.rankDailyTab.classList.toggle("active", tab === "daily");
    el.rankTotalTab.setAttribute("aria-selected", String(tab === "total"));
    el.rankDailyTab.setAttribute("aria-selected", String(tab === "daily"));
    renderRanking();
  }

  function renderNickname() {
    el.nickBtn.textContent = state.nickname;
  }

  function renderAll() {
    renderSword();
    renderCosts();
    renderGold();
    renderStorage();
    renderShop();
    renderNickname();
  }

  function showRewardPopup(message) {
    el.rewardMessage.textContent = message;
    el.rewardPopup.hidden = false;
  }

  function hideRewardPopup() {
    el.rewardPopup.hidden = true;
  }

  function grantDailyLoginReward() {
    const today = todayKey();
    if (state.lastDailyRewardDate === today) return false;
    state.lastDailyRewardDate = today;
    state.boostItems += DAILY_REWARD_BOOST_COUNT;
    save();
    const message = `강화 확률 업 아이템 ${DAILY_REWARD_BOOST_COUNT}개를 받았습니다.`;
    showRewardPopup(message);
    appendSystem(`일일 접속 보상으로 ${message}`);
    return true;
  }

  // ---------- 결과 메시지 ----------
  let resultTimer = null;
  function showResult(text, kind) {
    el.resultMsg.textContent = text;
    el.resultMsg.className = "result-msg " + (kind || "info");
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => { el.resultMsg.textContent = ""; }, 4000);
  }

  function flashStage(cls) {
    el.swordStage.classList.remove("flash-success", "flash-fail", "flash-destroy");
    void el.swordStage.offsetWidth; // 애니메이션 재시작
    el.swordStage.classList.add(cls);
  }

  // ---------- 파산 구제 ----------
  function bailoutCheck() {
    const assets = state.gold
      + LEVELS[state.sword.level].sellPrice
      + state.storage.reduce((s, it) => s + LEVELS[it.level].sellPrice, 0);
    if (assets < LEVELS[0].enhanceCost) {
      addGold(500);
      appendChat({ system: true, text: "무일푼이 된 당신에게 긴급 지원금 500 골드가 지급되었습니다." });
    }
  }

  function reportGold() {
    normalizeDailyGold();
    renderRanking();
    backend.reportGold(state.nickname, state.gold, state.dailyGold, state.dailyGoldDate);
  }

  function afterGoldChange() {
    bailoutCheck();
    renderGold();
    renderCosts();
    renderShop();
    save();
    reportGold();
  }

  // ---------- 강화 / 판매 / 보관 / 꺼내기 ----------
  function enhance() {
    if (busy) return;
    const lv = state.sword.level;
    if (lv >= MAX_LEVEL) return;
    const d = LEVELS[lv];
    const enhanceCost = effectiveEnhanceCost(d.enhanceCost);
    const useBoost = el.chkBoost.checked && !el.chkBoost.disabled && state.boostItems > 0;
    const successRate = effectiveSuccessRate(d.successRate, useBoost);
    const useDown = el.chkDown.checked && !el.chkDown.disabled;
    const useDest = el.chkDest.checked && !el.chkDest.disabled;
    const total = enhanceCost
      + (useDown ? d.downgradeProtectCost : 0)
      + (useDest ? d.destroyProtectCost : 0);

    if (state.gold < total) {
      showResult(`골드가 부족합니다. (필요: ${fmt(total)} 골드)`, "fail");
      return;
    }

    state.gold -= total;
    if (useBoost) state.boostItems -= 1;
    renderGold();
    busy = true;
    renderCosts();
    renderShop();
    el.swordStage.classList.add("shaking");

    setTimeout(() => {
      el.swordStage.classList.remove("shaking");
      busy = false;

      const roll = Math.random() * 100;
      if (roll < successRate) {
        state.sword.level = lv + 1;
        const nd = LEVELS[state.sword.level];
        flashStage("flash-success");
        showResult(`강화 성공! +${nd.level} ${nd.name}`, "success");
        if (nd.level >= 19) {
          backend.sendSystem(`${state.nickname}님이 +${nd.level} ${nd.name} 강화에 성공했습니다!`);
        }
      } else if (Math.random() * 100 < d.destroyRate) {
        if (useDest) {
          flashStage("flash-fail");
          showResult("강화 실패! 검이 파괴될 뻔했지만 파괴 보호로 살아남았습니다.", "fail");
        } else {
          flashStage("flash-destroy");
          showResult(`+${lv} ${d.name}이(가) 파괴되었습니다... 새로운 검을 받았습니다.`, "fail");
          backend.sendSystem(`${state.nickname}님의 +${lv} ${d.name}이(가) 산산조각 났습니다...`);
          state.sword = { level: 0 };
        }
      } else if (useDown || lv === 0) {
        flashStage("flash-fail");
        showResult(lv === 0 ? "강화 실패..." : "강화 실패... 하락 보호로 수치를 지켰습니다.", "fail");
      } else {
        state.sword.level = lv - 1;
        flashStage("flash-fail");
        showResult(`강화 실패... 수치가 하락했습니다. (+${state.sword.level})`, "fail");
      }

      renderSword();
      afterGoldChange();
    }, 100);
  }

  function sell() {
    if (busy) return;
    const d = LEVELS[state.sword.level];
    if (d.sellPrice <= 0) {
      showResult("이 검은 판매할 수 없습니다. (판매가 0 골드)", "info");
      return;
    }
    if (d.level >= 10 && !confirm(`+${d.level} ${d.name}을(를) ${fmt(d.sellPrice)} 골드에 판매할까요?`)) {
      return;
    }
    addGold(d.sellPrice);
    state.sword = { level: 0 };
    showResult(`+${d.level} ${d.name}을(를) ${fmt(d.sellPrice)} 골드에 판매했습니다.`, "success");
    renderSword();
    afterGoldChange();
  }

  function store() {
    if (busy) return;
    if (state.sword.level <= 0) {
      showResult("+0 검은 보관할 수 없습니다.", "info");
      return;
    }
    if (state.storage.length >= STORAGE_MAX) {
      showResult(`보관함이 가득 찼습니다. (최대 ${STORAGE_MAX}개)`, "info");
      return;
    }
    const d = LEVELS[state.sword.level];
    state.storage.push({ level: state.sword.level });
    state.sword = { level: 0 };
    showResult(`+${d.level} ${d.name}을(를) 보관함에 넣고 새 검을 받았습니다.`, "info");
    renderSword();
    renderStorage();
    renderShop();
    renderCosts();
    save();
  }

  function buyShopItem(item) {
    if (busy) return;
    const d = LEVELS[item.level];
    if (!d) return;
    if (state.storage.length >= STORAGE_MAX) {
      showResult(`보관함이 가득 찼습니다. (최대 ${STORAGE_MAX}개)`, "info");
      return;
    }
    if (state.gold < item.price) {
      showResult(`골드가 부족합니다. (필요: ${fmt(item.price)} 골드)`, "fail");
      return;
    }
    if (!confirm(`+${d.level} ${d.name}을(를) ${fmt(item.price)} 골드에 구매할까요?`)) {
      return;
    }
    state.gold -= item.price;
    state.storage.push({ level: item.level });
    showResult(`+${d.level} ${d.name}을(를) 구매해 보관함에 넣었습니다.`, "success");
    renderStorage();
    afterGoldChange();
    setStorageTab("storage");
  }

  // 보관함에서 꺼내기 = 강화 중인 검과 자리 교체 (+0 검은 보관하지 않고 버림)
  function retrieve(i) {
    if (busy) return;
    const stored = state.storage[i];
    if (!stored) return;
    const swapped = state.sword.level > 0;
    if (swapped) {
      state.storage[i] = { level: state.sword.level };
    } else {
      state.storage.splice(i, 1);
    }
    state.sword = { level: stored.level };
    const d = LEVELS[state.sword.level];
    showResult(`+${d.level} ${d.name}을(를) 꺼냈습니다.` + (swapped ? " (기존 검은 보관함으로)" : ""), "info");
    renderSword();
    renderStorage();
    renderShop();
    renderCosts();
    save();
  }

  // ---------- 관리자 명령어 ----------
  function applyHotTime(startedAt) {
    const start = Date.parse(startedAt);
    if (!start) return false;
    const activeUntil = start + HOT_DURATION_MS;
    if (Date.now() >= activeUntil) return false;
    if (hotTime.startedAt === startedAt && hotTime.activeUntil === activeUntil) return false;

    hotTime = { startedAt, activeUntil };
    renderCosts();
    startHotTimeClock();
    return true;
  }

  function appendSystem(text) {
    appendChat({ system: true, text });
  }

  function appendAdmin(text) {
    appendChat({ admin: true, text });
  }

  function showAdminHelp() {
    appendAdmin([
      "관리자 명령어",
      "자동 핫타임: 매시간 00~10분 적용",
      "/admin login <비밀번호> : 관리자 모드 로그인",
      "/admin hot : 10분간 강화비용 5% 감소, 성공확률 5% 증가",
      "/admin reset-users : 전체 유저 데이터를 초기화합니다.",
      "/admin reset-me : 현재 브라우저 데이터를 초기화합니다.",
      "/admin logout : 관리자 세션을 종료합니다."
    ].join("\n"));
  }

  function isAdminLoggedIn() {
    return Boolean(adminPassword);
  }

  function resetLocalUser(resetAt) {
    const clientId = state.clientId;
    state = defaultState();
    state.clientId = clientId;
    state.lastResetAt = resetAt || new Date().toISOString();
    busy = false;
    attachedItem = null;
    save();
    renderAll();
    setAttachment(null);
    reportGold();
  }

  function handleAdminEvent(event) {
    if (!event || !event.createdAt) return;
    if (event.type === "hot_time") {
      applyHotTime(event.createdAt);
      return;
    }
    if (event.type !== "reset_users") return;
    const prev = state.lastResetAt ? Date.parse(state.lastResetAt) : 0;
    const next = Date.parse(event.createdAt);
    if (!next || next <= prev) return;
    resetLocalUser(event.createdAt);
  }

  async function handleAdminCommand(text) {
    const parts = text.split(/\s+/);
    const command = (parts[1] || "help").toLowerCase();
    const rest = parts.slice(2).join(" ");

    if (command === "help") {
      showAdminHelp();
      return;
    }

    if (command === "login") {
      if (!rest) {
        appendAdmin("사용법: /admin login <비밀번호>");
        return;
      }
      const result = await backend.verifyAdminPassword(rest);
      if (!result.ok) {
        appendAdmin(result.error || "관리자 인증에 실패했습니다.");
        return;
      }
      adminPassword = rest;
      appendAdmin("관리자 모드가 활성화되었습니다.");
      return;
    }

    if (command === "logout") {
      adminPassword = "";
      appendAdmin("관리자 모드가 종료되었습니다.");
      return;
    }

    if (!isAdminLoggedIn()) {
      appendAdmin("먼저 /admin login <비밀번호>로 로그인하세요.");
      return;
    }

    if (command === "reset-me") {
      if (!confirm("현재 브라우저의 유저 데이터를 초기화할까요?")) return;
      resetLocalUser(new Date().toISOString());
      appendAdmin("현재 브라우저 데이터가 초기화되었습니다.");
      return;
    }

    if (command === "reset-users") {
      if (!confirm("전체 유저 데이터를 초기화할까요? 온라인 사용자는 다음 동기화 때 초기화됩니다.")) return;
      const result = await backend.resetAllUsers(adminPassword);
      if (!result.ok) {
        appendAdmin(result.error || "전체 유저 데이터 초기화에 실패했습니다.");
        return;
      }
      resetLocalUser(result.resetAt || new Date().toISOString());
      appendAdmin("전체 유저 데이터 초기화 명령을 실행했습니다.");
      return;
    }

    if (command === "hot") {
      if (!confirm("10분 핫타임을 시작할까요?")) return;
      const result = await backend.startHotTime(adminPassword);
      if (!result.ok) {
        appendAdmin(result.error || "핫타임 시작에 실패했습니다.");
        return;
      }
      handleAdminEvent({ type: "hot_time", createdAt: result.startedAt || new Date().toISOString() });
      appendAdmin("핫타임을 시작했습니다. 10분간 강화비용 5% 감소, 성공확률 5% 증가가 적용됩니다.");
      return;
    }

    appendAdmin("알 수 없는 관리자 명령어입니다. /admin help를 입력해 확인하세요.");
  }

  // ---------- 채팅 ----------
  function itemChipEl(item) {
    const chip = document.createElement("span");
    chip.className = "item-chip";
    const lv = clampLevel(item.level);
    chip.textContent = `+${lv} ${item.name || LEVELS[lv].name}`;
    chip.style.borderColor = tierOf(lv).blade;
    chip.style.color = tierOf(lv).blade;
    return chip;
  }

  function appendChat(msg) {
    const div = document.createElement("div");
    const isSystem = msg.system || msg.nickname === "[알림]";
    if (msg.admin) {
      div.className = "chat-msg admin";
      div.textContent = msg.text;
    } else if (isSystem) {
      div.className = "chat-msg system";
      div.textContent = msg.text;
    } else {
      div.className = "chat-msg";
      const nick = document.createElement("span");
      nick.className = "chat-nick";
      nick.textContent = msg.nickname;
      div.appendChild(nick);
      if (msg.text) {
        const text = document.createElement("span");
        text.className = "chat-text";
        text.textContent = msg.text;
        div.appendChild(text);
      }
      if (msg.item) div.appendChild(itemChipEl(msg.item));
    }
    el.chatMessages.appendChild(div);
    while (el.chatMessages.children.length > 150) {
      el.chatMessages.firstChild.remove();
    }
    el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  }

  function setAttachment(item) {
    attachedItem = item;
    el.attachBar.hidden = !item;
    if (item) {
      el.attachChip.replaceWith(itemChipEl(item));
      el.attachBar.querySelector(".item-chip").id = "attachChip";
      el.attachChip = document.getElementById("attachChip");
    }
  }

  el.btnItemLink.addEventListener("click", () => {
    const d = LEVELS[state.sword.level];
    setAttachment({ level: d.level, name: d.name });
    el.chatInput.focus();
  });
  el.attachRemove.addEventListener("click", () => setAttachment(null));

  el.chatForm.addEventListener("submit", e => {
    e.preventDefault();
    const text = el.chatInput.value.trim();
    if (!text && !attachedItem) return;
    if (/^\/admin(?:\s|$)/i.test(text)) {
      el.chatInput.value = "";
      setAttachment(null);
      handleAdminCommand(text);
      return;
    }
    backend.sendChat({ nickname: state.nickname, text, item: attachedItem });
    el.chatInput.value = "";
    setAttachment(null);
  });

  // ---------- 닉네임 ----------
  function startNickEdit() {
    el.nickInput.value = state.nickname;
    el.nickBtn.hidden = true;
    el.nickInput.hidden = false;
    el.nickInput.focus();
    el.nickInput.select();
  }
  function commitNick() {
    const v = el.nickInput.value.trim().slice(0, 12);
    if (v) state.nickname = v;
    el.nickInput.hidden = true;
    el.nickBtn.hidden = false;
    renderNickname();
    save();
    reportGold();
  }
  el.nickBtn.addEventListener("click", startNickEdit);
  el.nickInput.addEventListener("blur", commitNick);
  el.nickInput.addEventListener("keydown", e => {
    if (e.key === "Enter") el.nickInput.blur();
    if (e.key === "Escape") { el.nickInput.value = state.nickname; el.nickInput.blur(); }
  });

  // ---------- 시작 ----------
  el.btnEnhance.addEventListener("click", enhance);
  el.btnSell.addEventListener("click", sell);
  el.btnStore.addEventListener("click", store);
  el.chkBoost.addEventListener("change", renderCosts);
  el.rewardClose.addEventListener("click", hideRewardPopup);
  el.rewardPopup.addEventListener("click", e => {
    if (e.target === el.rewardPopup) hideRewardPopup();
  });
  el.storageTab.addEventListener("click", () => setStorageTab("storage"));
  el.shopTab.addEventListener("click", () => setStorageTab("shop"));
  el.rankTotalTab.addEventListener("click", () => setRankingTab("total"));
  el.rankDailyTab.addEventListener("click", () => setRankingTab("daily"));

  const backend = window.createBackend(window.GAME_CONFIG, {
    onChat: appendChat,
    onRanking: renderRankings,
    onAdminEvent: handleAdminEvent,
    clientId: state.clientId
  });

  grantDailyLoginReward();
  renderAll();
  setStorageTab(activeStorageTab);
  startHotTimeClock();
  bailoutCheck();
  save();
  backend.init();
  reportGold();
})();
