"use strict";
// 채팅/랭킹 백엔드. config.js에 Supabase 정보가 있으면 온라인 모드,
// 없으면 로컬(오프라인) 모드로 동작한다. 두 모드는 같은 인터페이스를 가진다:
//   init()                       : 시작 (과거 채팅 로드, 구독 시작)
//   sendChat({nickname,text,item}) : 채팅 전송
//   reportGold(nickname, gold)   : 내 골드 보고 (랭킹 갱신)
//   isOnline                     : 온라인 모드 여부
window.createBackend = function (config, handlers) {
  const online = config && config.supabaseUrl && config.supabaseKey && window.supabase;
  return online ? supabaseBackend(config, handlers) : localBackend(handlers);

  // ---------- 로컬 모드 ----------
  function localBackend({ onChat, onRanking, clientId }) {
    const CHAT_KEY = "sword-game-chat-v1";
    let log = [];
    try { log = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch { log = []; }

    function persist() {
      log = log.slice(-100);
      localStorage.setItem(CHAT_KEY, JSON.stringify(log));
    }

    return {
      isOnline: false,
      init() {
        log.forEach(onChat);
        onChat({ system: true, text: "오프라인 모드: 채팅과 랭킹이 이 브라우저에만 저장됩니다." });
      },
      sendChat(msg) {
        const m = { nickname: msg.nickname, text: msg.text, item: msg.item || null, ts: Date.now() };
        log.push(m);
        persist();
        onChat(m);
      },
      sendSystem(text) {
        const m = { system: true, text, ts: Date.now() };
        log.push(m);
        persist();
        onChat(m);
      },
      reportGold(nickname, gold) {
        onRanking([{ nickname, gold, self: true }]);
      }
    };
  }

  // ---------- 온라인 모드 (Supabase) ----------
  function supabaseBackend(cfg, { onChat, onRanking, clientId }) {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    let lastReport = 0;
    let pendingReport = null;
    let latest = null; // 마지막으로 보고 요청된 {nickname, gold}

    function mapRow(r) {
      return {
        nickname: r.nickname,
        text: r.message || "",
        item: r.item_level != null ? { level: r.item_level, name: r.item_name } : null,
        ts: new Date(r.created_at).getTime()
      };
    }

    async function refreshRanking() {
      const { data, error } = await client
        .from("sword_players")
        .select("client_id, nickname, gold")
        .order("gold", { ascending: false })
        .limit(10);
      if (!error && data) {
        onRanking(data.map(r => ({ nickname: r.nickname, gold: r.gold, self: r.client_id === clientId })));
      }
    }

    async function upsertPlayer(nickname, gold) {
      await client.from("sword_players").upsert(
        { client_id: clientId, nickname, gold, updated_at: new Date().toISOString() },
        { onConflict: "client_id" }
      );
      refreshRanking();
    }

    return {
      isOnline: true,
      async init() {
        const { data } = await client
          .from("sword_chat")
          .select("*")
          .order("id", { ascending: false })
          .limit(50);
        if (data) data.reverse().forEach(r => onChat(mapRow(r)));

        client
          .channel("sword_chat_feed")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "sword_chat" },
            payload => onChat(mapRow(payload.new)))
          .subscribe();

        refreshRanking();
        setInterval(refreshRanking, 15000);
      },
      sendChat(msg) {
        client.from("sword_chat").insert({
          nickname: msg.nickname,
          message: msg.text,
          item_level: msg.item ? msg.item.level : null,
          item_name: msg.item ? msg.item.name : null
        }).then(() => {});
      },
      sendSystem(text) {
        client.from("sword_chat").insert({ nickname: "[알림]", message: text }).then(() => {});
      },
      // 골드 보고는 5초에 1회로 제한 (강화 연타 시 과도한 요청 방지)
      reportGold(nickname, gold) {
        latest = { nickname, gold };
        const now = Date.now();
        if (now - lastReport > 5000) {
          lastReport = now;
          upsertPlayer(latest.nickname, latest.gold);
        } else if (!pendingReport) {
          pendingReport = setTimeout(() => {
            pendingReport = null;
            lastReport = Date.now();
            upsertPlayer(latest.nickname, latest.gold);
          }, 5000 - (now - lastReport));
        }
      }
    };
  }
};
