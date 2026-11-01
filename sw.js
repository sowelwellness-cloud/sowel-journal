/* 🌿 SOWEL 수업일지 — 앱(홈 화면) 지원
 * 화면 파일은 항상 인터넷에서 새로 받고(그래서 고친 내용이 바로 보임),
 * 인터넷이 끊겼을 때만 마지막으로 받은 화면을 보여줘요.
 * 시트·AI 요청은 건드리지 않아요.
 */
var CACHE = 'sowel-shell-v1';
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
