/* 🌿 SOWEL 수업일지 — 앱(홈 화면) 지원
 * 화면 파일은 항상 인터넷에서 새로 받고(그래서 고친 내용이 바로 보임),
 * 인터넷이 끊겼을 때만 마지막으로 받은 화면을 보여줘요.
 * 시트·AI 요청은 건드리지 않아요.
 */
var CACHE = 'sowel-shell-v2';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin) return;   // 시트 API·AI·글꼴은 그대로
  if (u.searchParams.has('check')) return;                                   // 새 버전 확인은 늘 서버로
  e.respondWith(fetch(req).then(function (r) {
    if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return r;
  }).catch(function () {
    return caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || c.match(req, { ignoreSearch: true }).then(function (h2) {
          return h2 || new Response('인터넷에 연결되지 않았어요. 연결 후 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        });
      });
    });
  }));
});

/* ───── 푸시 알림 (Firebase가 전달한 데이터 메시지) ───── */
self.addEventListener('push', function (e) {
  var p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = { data: { body: e.data ? e.data.text() : '' } }; }
  var d = p.data || {}, n = p.notification || {};
  var title = d.title || n.title || '소웰 웰니스';
  var opt = {
    body: d.body || n.body || '',
    icon: 'icon-member-192.png',
    badge: 'icon-member-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || (p.fcmOptions && p.fcmOptions.link) || './' }
  };
  if (/index\.html/.test(opt.data.url)) { opt.icon = 'icon-teacher-192.png'; opt.badge = 'icon-teacher-192.png'; }
  e.waitUntil(self.registration.showNotification(title, opt));   // 아이폰은 받은 푸시를 꼭 화면에 보여줘야 함
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var target = new URL(url, self.location.href).href.split('#')[0];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.split('?')[0] === target.split('?')[0] && 'focus' in c) return c.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : null;
  }));
});
