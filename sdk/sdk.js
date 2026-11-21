/* PushKit SDK — zero dependencies. https://github.com/zhshimul815/pushkit
 *
 * Features: opt-in prompt (banner / top bar / bell styles), per-language
 * prompt texts (owner overrides + built-in bn/hi/es/pt), prompt A/B
 * variant, migration re-subscription (returning subscribers from another
 * provider are silently re-subscribed under this site's VAPID key when
 * permission is already granted), daily visit ping (powers win-back
 * audiences and the 180-day list cleaning), tagging.
 */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var siteId = script.getAttribute("data-site-id");
  if (!siteId) return;
  var base = new URL(script.src).origin;
  var tags = {};
  try { tags = JSON.parse(localStorage.getItem("pushkit:tags") || "{}"); } catch {}
  var cfgCache = null;

  var I18N = {
    bn: { title: "আপডেট পান", body: "পুশ নোটিফিকেশনে সাবস্ক্রাইব করুন।", allow: "অনুমতি দিন", deny: "এখন নয়" },
    hi: { title: "अपडेट पाएं", body: "पुश नोटिफिकेशन के लिए सब्सक्राइब करें।", allow: "अनुमति दें", deny: "अभी नहीं" },
    es: { title: "Recibe novedades", body: "Suscríbete a las notificaciones push.", allow: "Permitir", deny: "Ahora no" },
    pt: { title: "Receba novidades", body: "Assine as notificações push.", allow: "Permitir", deny: "Agora não" },
  };

  window.PushKit = {
    tag: function (key, value) {
      tags[key] = String(value);
      try { localStorage.setItem("pushkit:tags", JSON.stringify(tags)); } catch {}
      var sub = window.PushKit._sub;
      if (sub) postTags(sub);
    },
    subscribe: function () { return subscribe(); },
    _sub: null,
  };

  function b64ToUint8(base64) {
    var pad = "=".repeat((4 - (base64.length % 4)) % 4);
    var raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function bufToB64(buf) {
    var bytes = new Uint8Array(buf), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function getConfig() {
    if (cfgCache) return Promise.resolve(cfgCache);
    return fetch(base + "/api/public/config?siteId=" + encodeURIComponent(siteId))
      .then(function (r) { return r.json(); })
      .then(function (cfg) { cfgCache = cfg; return cfg; });
  }
  function getVariant(cfg) {
    if (!cfg.prompt.abEnabled) return null;
    try {
      var v = localStorage.getItem("pushkit:variant");
      if (v === "a" || v === "b") return v;
      v = Math.random() < 0.5 ? "a" : "b";
      localStorage.setItem("pushkit:variant", v);
      return v;
    } catch { return "a"; }
  }
  function promptTexts(cfg) {
    var p = cfg.prompt;
    var lang = (navigator.language || "en").slice(0, 2).toLowerCase();
    var t = (p.texts && p.texts[lang]) || I18N[lang] || null;
    var out = {
      title: (t && t.title) || p.title,
      body: (t && t.body) || p.body,
      allow: (t && t.allow) || p.allowLabel,
      deny: (t && t.deny) || p.denyLabel,
    };
    if (getVariant(cfg) === "b") {
      if (p.bTitle) out.title = p.bTitle;
      if (p.bBody) out.body = p.bBody;
    }
    return out;
  }

  function postTags(sub) {
    fetch(base + "/api/public/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: siteId, endpoint: sub.endpoint, tags: tags }),
    }).catch(function () {});
  }

  function sendSubscription(sub, cfg) {
    var json = sub.toJSON();
    return fetch(base + "/api/public/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: siteId,
        subscription: { endpoint: sub.endpoint, keys: json.keys },
        pageUrl: location.href,
        language: navigator.language,
        tags: tags,
        variant: cfg ? getVariant(cfg) : undefined,
      }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          console.error("PushKit /api/public/subscribe error:", res.status, err);
        }).catch(function () {
          console.error("PushKit /api/public/subscribe error:", res.status);
        });
      }
      console.log("PushKit: Successfully subscribed!");
    }).catch(function (err) {
      console.error("PushKit subscription network error:", err);
    });
  }

  function visitPing(sub) {
    try {
      var today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("pushkit:visit") === today) return;
      localStorage.setItem("pushkit:visit", today);
    } catch {}
    fetch(base + "/api/public/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: siteId, endpoint: sub.endpoint }),
    }).catch(function () {});
  }

  /* Ensure a subscription under THIS site's VAPID key. If the browser holds
   * a subscription created with a different key (e.g. the previous provider
   * after a migration), it is replaced — with permission already granted
   * this happens silently, without a new prompt. */
  function ensureSubscription(cfg) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return Promise.resolve(null);
    return navigator.serviceWorker
      .register(script.getAttribute("data-sw-path") || "/sw.js")
      .then(function () { return navigator.serviceWorker.ready; })
      .then(function (reg) {
        return reg.pushManager.getSubscription().then(function (existing) {
          if (existing) {
            var key = existing.options && existing.options.applicationServerKey;
            if (key && bufToB64(key) === cfg.vapidPublicKey) return existing;
            return existing.unsubscribe().then(function () { return subscribeNew(reg, cfg); });
          }
          return subscribeNew(reg, cfg);
        });
      })
      .then(function (sub) {
        if (!sub) return null;
        window.PushKit._sub = sub;
        visitPing(sub);
        return sendSubscription(sub, cfg).then(function () { return sub; });
      })
      .catch(function (err) {
        console.error("PushKit registration/subscription error:", err);
        return null;
      });
  }
  function subscribeNew(reg, cfg) {
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToUint8(cfg.vapidPublicKey),
    });
  }
  function subscribe() {
    return getConfig().then(function (cfg) { return ensureSubscription(cfg); });
  }

  var BTN = "padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;";
  function makeButtons(t, el) {
    var row = document.createElement("div");
    row.setAttribute("style", "display:flex;gap:8px;justify-content:flex-end");
    var deny = document.createElement("button");
    deny.textContent = t.deny;
    deny.setAttribute("style", BTN + "border:1px solid #e4e4e7;background:#fff;color:#111");
    var allow = document.createElement("button");
    allow.textContent = t.allow;
    allow.setAttribute("style", BTN + "border:0;background:#111;color:#fff");
    deny.onclick = function () { try { localStorage.setItem("pushkit:dismissed", "1"); } catch {} el.remove(); };
    allow.onclick = function () {
      el.remove();
      if (typeof Notification !== "undefined" && Notification.requestPermission && Notification.permission === "default") {
        Notification.requestPermission().then(function (perm) {
          if (perm === "granted") {
            subscribe();
          } else {
            console.warn("PushKit: Notification permission " + perm);
          }
        }).catch(function (err) {
          console.error("PushKit requestPermission error:", err);
          subscribe();
        });
      } else {
        subscribe();
      }
    };
    row.appendChild(deny); row.appendChild(allow);
    return row;
  }

  function showCard(cfg) {
    var p = cfg.prompt, t = promptTexts(cfg);
    var el = document.createElement("div");
    el.setAttribute("style", "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:420px;width:calc(100% - 32px);background:#fff;color:#111;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);padding:16px;font-family:system-ui,sans-serif");
    var head = document.createElement("div");
    head.setAttribute("style", "display:flex;gap:12px;align-items:flex-start");
    if (p.iconUrl) {
      var img = document.createElement("img");
      img.src = p.iconUrl; img.alt = "";
      img.setAttribute("style", "width:40px;height:40px;border-radius:8px");
      head.appendChild(img);
    }
    var text = document.createElement("div");
    var title = document.createElement("div");
    title.textContent = t.title;
    title.setAttribute("style", "font-weight:600;font-size:14px");
    var body = document.createElement("div");
    body.textContent = t.body;
    body.setAttribute("style", "font-size:13px;color:#555;margin-top:2px");
    text.appendChild(title); text.appendChild(body); head.appendChild(text);
    var row = makeButtons(t, el);
    row.style.marginTop = "12px";
    el.appendChild(head); el.appendChild(row);
    document.body.appendChild(el);
  }

  function showBar(cfg) {
    var t = promptTexts(cfg);
    var el = document.createElement("div");
    el.setAttribute("style", "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#111;color:#fff;padding:10px 16px;display:flex;align-items:center;gap:12px;font-family:system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.25)");
    var title = document.createElement("div");
    title.textContent = t.title + " — " + t.body;
    title.setAttribute("style", "font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    el.appendChild(title);
    el.appendChild(makeButtons(t, el));
    document.body.appendChild(el);
  }

  function showBell(cfg) {
    var el = document.createElement("button");
    el.setAttribute("aria-label", "Subscribe to notifications");
    el.setAttribute("style", "position:fixed;left:16px;bottom:16px;z-index:2147483646;width:48px;height:48px;border-radius:9999px;border:0;background:#111;color:#fff;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center");
    el.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
    el.onclick = function () { el.remove(); showCard(cfg); };
    document.body.appendChild(el);
  }

  function showPrompt(cfg) {
    try { if (localStorage.getItem("pushkit:dismissed")) return; } catch {}
    if (Notification.permission !== "default") {
      if (Notification.permission === "granted") subscribe();
      return;
    }
    var style = cfg.prompt.style || "banner";
    if (style === "bell") showBell(cfg);
    else if (style === "bar") showBar(cfg);
    else showCard(cfg);
  }

  function init() {
    getConfig()
      .then(function (cfg) {
        if (!cfg || !cfg.prompt) return;
        // Already granted: sync / migrate the subscription and ping the visit.
        if (Notification.permission === "granted") { ensureSubscription(cfg); return; }
        if (cfg.prompt.scrollPercent) {
          var fired = false;
          addEventListener("scroll", function () {
            if (fired) return;
            var max = document.documentElement.scrollHeight - innerHeight;
            if (max > 0 && (scrollY / max) * 100 >= cfg.prompt.scrollPercent) { fired = true; showPrompt(cfg); }
          }, { passive: true });
        } else {
          setTimeout(function () { showPrompt(cfg); }, (cfg.prompt.delaySeconds || 0) * 1000);
        }
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
