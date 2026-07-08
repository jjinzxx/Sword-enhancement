"use strict";
// 채팅/랭킹 백엔드. config.js에 Supabase 정보가 있으면 온라인 모드,
// 없으면 로컬(오프라인) 모드로 동작한다. 두 모드는 같은 인터페이스를 가진다:
//   init()                       : 시작 (과거 채팅 로드, 구독 시작)
//   sendChat({nickname,text,item}) : 채팅 전송
//   reportGold(nickname, gold, dailyGold, dailyGoldDate) : 내 골드 보고 (랭킹 갱신)
//   isOnline                     : 온라인 모드 여부
window.createBackend = function (config, handlers) {
  const online = config && config.supabaseUrl && config.supabaseKey && window.supabase;
  return online ? supabaseBackend(config, handlers) : localBackend(config || {}, handlers);

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // ---------- 로컬 모드 ----------
  function localBackend(cfg, { onChat, onRanking }) {
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
      reportGold(nickname, gold, dailyGold) {
        onRanking({
          total: [{ nickname, gold, self: true }],
          daily: [{ nickname, gold: dailyGold || 0, self: true }]
        });
      },
      async verifyAdminPassword(password) {
        if (!cfg.adminPassword) {
          return { ok: false, error: "오프라인 관리자 비밀번호가 설정되어 있지 않습니다. js/config.js의 adminPassword를 설정하세요." };
        }
        return { ok: password === cfg.adminPassword, error: password === cfg.adminPassword ? "" : "관리자 인증에 실패했습니다." };
      },
      async resetAllUsers() {
        log = [];
        localStorage.removeItem(CHAT_KEY);
        return { ok: true, resetAt: new Date().toISOString() };
      },
      async startHotTime() {
        return { ok: true, startedAt: new Date().toISOString() };
      }
    };
  }

  // ---------- 온라인 모드 (Supabase) ----------
  function supabaseBackend(cfg, { onChat, onRanking, onAdminEvent, clientId }) {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    let lastReport = 0;
    let pendingReport = null;
    let latest = null; // 마지막으로 보고 요청된 {nickname, gold, dailyGold, dailyGoldDate}

    function mapRow(r) {
      const system = r.nickname === "[알림]";
      return {
        system,
        nickname: r.nickname,
        text: r.message || "",
        item: system ? null : (r.item_level != null ? { level: r.item_level, name: r.item_name } : null),
        ts: new Date(r.created_at).getTime()
      };
    }

    function mapRankingRows(rows, valueKey) {
      return rows.map(r => ({
        nickname: r.nickname,
        gold: r[valueKey],
        self: r.client_id === clientId
      }));
    }

    async function refreshRanking() {
      const totalReq = client
        .from("sword_players")
        .select("client_id, nickname, gold")
        .order("gold", { ascending: false })
        .limit(10);
      const dailyReq = client
        .from("sword_players")
        .select("client_id, nickname, daily_gold, daily_gold_date")
        .eq("daily_gold_date", todayKey())
        .order("daily_gold", { ascending: false })
        .limit(10);
      const [totalRes, dailyRes] = await Promise.all([totalReq, dailyReq]);
      onRanking({
        total: totalRes.error || !totalRes.data ? [] : mapRankingRows(totalRes.data, "gold"),
        daily: dailyRes.error || !dailyRes.data ? [] : mapRankingRows(dailyRes.data, "daily_gold")
      });
    }

    async function upsertPlayer(nickname, gold, dailyGold, dailyGoldDate) {
      await client.from("sword_players").upsert(
        {
          client_id: clientId,
          nickname,
          gold,
          daily_gold: dailyGold || 0,
          daily_gold_date: dailyGoldDate || todayKey(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "client_id" }
      );
      refreshRanking();
    }

    function mapAdminEvent(row) {
      return {
        type: row.event_type,
        message: row.message || "",
        createdAt: row.created_at
      };
    }

    function rpcErrorMessage(prefix, error) {
      const detail = [error && error.message, error && error.details, error && error.hint]
        .filter(Boolean)
        .join(" / ");
      return detail ? `${prefix} (${detail})` : prefix;
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

        const { data: eventData } = await client
          .from("sword_admin_events")
          .select("*")
          .order("id", { ascending: false })
          .limit(20);
        if (eventData && onAdminEvent) {
          eventData.reverse().forEach(row => onAdminEvent(mapAdminEvent(row)));
        }

        client
          .channel("sword_admin_events_feed")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "sword_admin_events" },
            payload => { if (onAdminEvent) onAdminEvent(mapAdminEvent(payload.new)); })
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
      reportGold(nickname, gold, dailyGold, dailyGoldDate) {
        latest = { nickname, gold, dailyGold, dailyGoldDate };
        const now = Date.now();
        if (now - lastReport > 5000) {
          lastReport = now;
          upsertPlayer(latest.nickname, latest.gold, latest.dailyGold, latest.dailyGoldDate);
        } else if (!pendingReport) {
          pendingReport = setTimeout(() => {
            pendingReport = null;
            lastReport = Date.now();
            upsertPlayer(latest.nickname, latest.gold, latest.dailyGold, latest.dailyGoldDate);
          }, 5000 - (now - lastReport));
        }
      },
      async verifyAdminPassword(password) {
        const { data, error } = await client.rpc("admin_verify_sword_password", { input_password: password });
        if (error) {
          return {
            ok: false,
            error: rpcErrorMessage("관리자 인증 RPC를 사용할 수 없습니다. Supabase SQL Editor에서 sql/admin_rpc_patch.sql을 실행하세요.", error)
          };
        }
        return { ok: data === true, error: data === true ? "" : "관리자 인증에 실패했습니다." };
      },
      async resetAllUsers(password) {
        const { data, error } = await client.rpc("admin_reset_sword_game", { input_password: password });
        if (error) {
          return {
            ok: false,
            error: rpcErrorMessage("전체 초기화 RPC 실행에 실패했습니다. 비밀번호 또는 sql/admin_rpc_patch.sql 적용 여부를 확인하세요.", error)
          };
        }
        refreshRanking();
        return { ok: true, resetAt: data };
      },
      async startHotTime(password) {
        const { data, error } = await client.rpc("admin_start_sword_hot_time", { input_password: password });
        if (error) {
          return {
            ok: false,
            error: rpcErrorMessage("핫타임 RPC 실행에 실패했습니다. sql/admin_rpc_patch.sql 적용 여부를 확인하세요.", error)
          };
        }
        return { ok: true, startedAt: data };
      }
    };
  }
};
