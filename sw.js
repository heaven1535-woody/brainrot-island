/* 브레인롯 아일랜드 - 오프라인 캐시 (서비스 워커) */
const CACHE = "brainrot-island-v36";
const FILES = ["./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png", "./"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/");
  const store = res => { if (res && res.ok && same) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; };
  if (isPage) {
    // 게임 본체: 인터넷이 되면 최신 버전, 안 되면 저장된 버전
    // GitHub Pages 가 페이지를 10분 캐시해서 새 버전이 늦게 보이던 문제 → 매번 서버에 바뀌었는지 확인(no-cache)
    e.respondWith(fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then(store).catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || caches.match("./index.html"))));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(store).catch(() => Response.error()))
  );
});
