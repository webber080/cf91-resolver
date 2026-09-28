const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const INDEX_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>91 视频地址解析</title><link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>▶️</text></svg>">
<style>
  body { font-family: system-ui, sans-serif; background:#0f172a; color:#e2e8f0;
         max-width: 860px; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 22px; }
  .row { display:flex; gap:8px; margin: 16px 0; flex-wrap: wrap; }
  input[type=text]{ flex:1; min-width:240px; padding:10px 12px; border-radius:8px;
         border:1px solid #334155; background:#1e293b; color:#e2e8f0; font-size:14px;}
  button { padding:10px 18px; border:0; border-radius:8px; background:#3b82f6;
         color:#fff; font-size:14px; cursor:pointer; }
  button:disabled { background:#475569; }
  .result { margin-top:16px; }
  .urlbox { width:100%; word-break:break-all; background:#1e293b; border:1px solid #334155;
         border-radius:8px; padding:10px; font-size:12px; color:#94a3b8; }
  .err { color:#f87171; }
  video { width:100%; border-radius:8px; margin-top:12px; background:#000; }
  a.dl { display:inline-block; margin-top:10px; padding:10px 18px; background:#22c55e;
         color:#052e16; border-radius:8px; text-decoration:none; font-weight:600;}
  .tip { color:#64748b; font-size:12px; margin-top:4px; }
</style>
</head>
<body>
  <h1>91 视频地址解析 &amp; 下载</h1>
  <div class="row">
    <input id="url" type="text" placeholder="粘贴 91porn 播放页地址（含 viewkey=...）">
    <button id="go" onclick="doParse()">解析</button>
  </div>
  <div id="result" class="result"></div>
<script>
let DIRECT_URL = '';
let DL_URL = '';
function copyDirect(){
  const b = document.getElementById('cp');
  const done = () => { b.textContent = '✓ 已复制'; setTimeout(() => { b.textContent = '📋 复制直链'; }, 1500); };
  function fallback(){
    const t = document.createElement('textarea'); t.value = DIRECT_URL;
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch(e) {}
    t.remove(); done();
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(DIRECT_URL).then(done).catch(fallback);
  } else { fallback(); }
}
function shareUrl(){
  const data = { url: DIRECT_URL, title: 'cf91 视频下载' };
  if (navigator.share) navigator.share(data).catch(()=>{});
  else copyDirect();
}
async function doParse(){
  const btn = document.getElementById('go'), box = document.getElementById('result');
  const url = document.getElementById('url').value.trim();
  btn.disabled = true; btn.textContent = '解析中…';
  box.innerHTML = '';
  try {
    const r = await fetch('api/parse?url=' + encodeURIComponent(url));
    const j = await r.json();
    if (!j.ok) { box.innerHTML = '<p class="err">'+j.error+'</p>'; return; }
    DIRECT_URL = j.video_url;
    DL_URL = new URL(j.download, location.href).href;
    const isAndroid = /android/i.test(navigator.userAgent);
    const admBtns = isAndroid ? \`
        <button onclick="shareUrl()">↗ 分享到下载器</button>\` : '';
    box.innerHTML = \`
      <p>✅ 解析成功</p>
      <div class="urlbox">\${j.video_url}</div>
      <div class="row">
        <a class="dl" href="\${j.download}">⬇ 代理下载</a>
        <button id="cp" onclick="copyDirect()">📋 复制直链</button>
        \${admBtns}
      </div>
      <video controls src="\${j.download}"></video>
      <p class="tip">\${isAndroid ? '点「分享到下载器」选 ADM / 1DM，即可多线程直连 CDN 下载；或复制直链手动粘贴。' : '复制直链粘贴到下载工具；代理下载支持断点续传。'}代理下载同样支持多线程/断点续传。</p>\`;
  } catch(e) {
    box.innerHTML = '<p class="err">请求失败：'+e+'</p>';
  } finally {
    btn.disabled = false; btn.textContent = '解析';
  }
}
</script>
</body>
</html>`;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// --- 91porn 声明页 Cookie 自动获取 ---
// 未带 Cookie 访问会拿到 18 岁声明过渡页；访问首页 + index.php（声明链接）
// 会种下 ga / CLIPSHARE 等 Cookie，带上才能抓到真正的播放页。
const BASE_HEADERS = {
  "user-agent": UA,
  "accept-language": "zh-CN,zh;q=0.9",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "upgrade-insecure-requests": "1",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "sec-ch-ua": '"Chromium";v="126", "Google Chrome";v="126", "Not?A_Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

function mergeSetCookies(jar, response) {
  const list = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
  for (const sc of list) {
    const pair = sc.split(";")[0];
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

let cookieCache = { value: "", at: 0 };

// 统一走 www.91porn.com：裸域对 Cloudflare Workers 出口软屏蔽（返回空 200）
function toWww(target) {
  return target.replace(/^https?:\/\/91porn\.com/i, "https://www.91porn.com");
}

async function getDisclaimerCookies(force = false) {
  if (!force && cookieCache.value && Date.now() - cookieCache.at < 10 * 60 * 1000) {
    return cookieCache.value;
  }
  const jar = new Map();
  const s1 = await fetch("https://www.91porn.com/", { headers: BASE_HEADERS });
  mergeSetCookies(jar, s1);
  const s2 = await fetch("https://www.91porn.com/index.php", {
    headers: { ...BASE_HEADERS, referer: "https://www.91porn.com/" },
  });
  mergeSetCookies(jar, s2);
  cookieCache = {
    value: [...jar].map(([k, v]) => k + "=" + v).join("; "),
    at: Date.now(),
  };
  return cookieCache.value;
}

function isDisclaimerPage(html) {
  return html.includes("我已年满18岁") || html.includes("You need to be at least 18");
}

export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    const path = u.pathname.replace(/\/+$/, "") || "/";

    if (path === "/") {
      return new Response(INDEX_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/api/parse") {
      const target = (u.searchParams.get("url") || "").trim();
      if (!target.includes("viewkey=")) {
        return json({ ok: false, error: "请输入 91porn 的视频播放页地址（需含 viewkey 参数）" });
      }
      try {
        const fetchTarget = toWww(target);

        // ---- 抓取通道 1：Oracle 中继（CF Workers 出口被 91porn WAF 软屏蔽，中继可正常抓取）----
        let html = "";
        let htmlSource = "";
        let relayErr = "";
        if (env.RELAY_URL && env.RELAY_TOKEN) {
          try {
            const rr = await fetch(env.RELAY_URL + "/fetch?url=" + encodeURIComponent(fetchTarget), {
              headers: { authorization: "Bearer " + env.RELAY_TOKEN },
            });
            const rj = await rr.json().catch(() => null);
            if (rj && rj.ok && rj.html) {
              if (rj.html.includes("strencode2")) {
                html = rj.html;
                htmlSource = "relay";
              } else {
                relayErr = "relay 页面无 strencode2 (len " + (rj.html_length || 0) + ")";
              }
            } else {
              relayErr = "relay HTTP " + rr.status + " " + ((rj && rj.error) || "");
            }
          } catch (re) {
            relayErr = "relay fetch: " + (re && re.message);
          }
        }

        // ---- 抓取通道 2：CF 直连（声明页 Cookie + 重试）----
        if (!html) {
          async function grabPage(cookie) {
            return fetch(fetchTarget, {
              headers: {
                ...BASE_HEADERS,
                referer: "https://91porn.com/",
                ...(cookie ? { cookie } : {}),
              },
              cf: { cacheTtl: 0 },
            });
          }
          let r = await grabPage(await getDisclaimerCookies());
          if (!r.ok) return json({ ok: false, error: "页面抓取失败 HTTP " + r.status });
          html = await r.text();
          // 拿到的是声明页 → 强制刷新 Cookie 重抓一次
          if (isDisclaimerPage(html)) {
            r = await grabPage(await getDisclaimerCookies(true));
            if (!r.ok) return json({ ok: false, error: "重试抓取失败 HTTP " + r.status });
            html = await r.text();
          }
          htmlSource = "direct";
        }

        const m = html.match(/strencode2\("([^"]+)"\)/);
        if (!m) {
          const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "无标题";
          return json({
            ok: false,
            error: "页面里没找到 strencode2（可能被风控或页面结构变了）",
            debug: {
              source: htmlSource,
              relay_error: relayErr || undefined,
              html_length: html.length,
              title: title,
              is_disclaimer: isDisclaimerPage(html),
              head_snippet: html.slice(0, 300),
            },
          });
        }
        const decoded = decodeURIComponent(m[1]);
        const mu = decoded.match(/src='([^']+)'/);
        if (!mu) return json({ ok: false, error: "解码后没找到 src 地址" });
        const videoUrl = mu[1];
        return json({
          ok: true,
          video_url: videoUrl,
          download: "api/download?url=" + encodeURIComponent(videoUrl),
        });
      } catch (e) {
        return json({ ok: false, error: "解析失败：" + (e && e.message) });
      }
    }

    if (path === "/api/download") {
      const target = u.searchParams.get("url") || "";
      if (!/^https?:\/\//.test(target)) return new Response("bad url", { status: 400 });
      // 透传 Range：支持多线程下载器分段拉流（206）
      const range = request.headers.get("range");
      let upstream;
      try {
        upstream = await fetch(target, {
          headers: {
            "user-agent": UA,
            "referer": "https://91porn.com/",
            ...(range ? { range } : {}),
          },
        });
      } catch (e) {
        return new Response("upstream fetch error", { status: 502 });
      }
      if (upstream.status !== 200 && upstream.status !== 206) {
        return new Response("upstream HTTP " + upstream.status, { status: 502 });
      }
      const h = new Headers();
      h.set("content-type", upstream.headers.get("content-type") || "video/mp4");
      h.set("accept-ranges", "bytes");
      const base = (target.split("?")[0].split("/").pop() || "video.mp4").replace(/[^A-Za-z0-9._-]/g, "") || "video.mp4";
      h.set("content-disposition", 'attachment; filename="' + base + '"');
      for (const k of ["content-length", "content-range"]) {
        const v = upstream.headers.get(k);
        if (v) h.set(k, v);
      }
      return new Response(upstream.body, { status: upstream.status, headers: h });
    }

    return new Response("not found", { status: 404 });
  },
};
