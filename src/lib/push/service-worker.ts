/**
 * Service worker source. Served per-site by GET /sw.js?siteId=...
 * and offered as a download from the Sites page. The PushKit origin is
 * embedded so click telemetry and re-subscription reach the right instance.
 */
export function buildServiceWorker(appOrigin: string): string {
  return `/* PushKit service worker — generated. Do not edit; re-download from the PushKit dashboard. */
"use strict";
var PUSHKIT_ORIGIN = ${JSON.stringify(appOrigin)};

self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "Notification", body: event.data ? event.data.text() : "" }; }
  var options = {
    body: data.body || "",
    icon: data.icon || undefined,
    badge: data.badge || undefined,
    image: data.image || undefined,
    tag: data.campaignId || undefined,
    data: { url: data.url || "/", campaignId: data.campaignId || "", subscriberId: data.subscriberId || "", actions: data.actions || [] },
    actions: (data.actions || []).slice(0, 2).map(function (a, i) {
      return { action: "open-" + i, title: a.label };
    }),
  };
  event.waitUntil(self.registration.showNotification(data.title || "Notification", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var stored = event.notification.data || {};
  var url = stored.url || "/";
  if (event.action && event.action.indexOf("open-") === 0) {
    var idx = Number(event.action.slice(5));
    var acts = stored.actions || [];
    if (acts[idx] && acts[idx].url) url = acts[idx].url;
  }
  var click = stored.campaignId
    ? fetch(PUSHKIT_ORIGIN + "/api/public/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: stored.campaignId, subscriberId: stored.subscriberId || undefined }),
        keepalive: true
      }).catch(function () {})
    : Promise.resolve();
  event.waitUntil(
    Promise.all([
      click,
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].url === url && "focus" in list[i]) return list[i].focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
    ])
  );
});
`;
}
