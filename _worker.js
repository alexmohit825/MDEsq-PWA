/**
 * MDEsq - Cloudflare Unified Worker, Static Asset Handler & Ad-Hoc OTA Server
 * - Handles /api/chat serverless edge proxy to Google Gemini 3.8 Flash
 * - Handles /install 1-Tap Safari Ad-Hoc OTA Installer
 * - Handles /manifest.plist Apple Wireless OTA Manifest
 * - Handles /MDEsq.ipa Ad-Hoc Signed Binary Delivery
 * - Proxies all static PWA assets via env.ASSETS
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase().replace(/\/$/, "");

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-key"
        }
      });
    }

    // 2. Wireless Safari Ad-Hoc OTA Manifest (/manifest.plist) - Rule 4 & Anti-Leap 10
    if (pathname === "/manifest.plist") {
      const manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>https://mdesq.mohalex.workers.dev/MDEsq.ipa</string>
                </dict>
                <dict>
                    <key>kind</key>
                    <string>display-image</string>
                    <key>url</key>
                    <string>https://raw.githubusercontent.com/alexmohit825/MDEsq/main/MDEsq/Assets.xcassets/AppIcon.appiconset/icon_1024.png</string>
                </dict>
                <dict>
                    <key>kind</key>
                    <string>full-size-image</string>
                    <key>url</key>
                    <string>https://raw.githubusercontent.com/alexmohit825/MDEsq/main/MDEsq/Assets.xcassets/AppIcon.appiconset/icon_1024.png</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.dramohit.mdesq</string>
                <key>bundle-version</key>
                <string>1.0.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>MDEsq</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

      return new Response(manifestXML, {
        status: 200,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 3. Ad-Hoc Signed IPA Binary Proxy (/MDEsq.ipa)
    if (pathname === "/mdesq.ipa") {
      const releaseIpaUrl = "https://github.com/alexmohit825/MDEsq/releases/download/v1.0.0-adhoc/MDEsq.ipa";
      const ipaResponse = await fetch(releaseIpaUrl);

      if (ipaResponse.ok) {
        return new Response(ipaResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": 'attachment; filename="MDEsq.ipa"',
            "Cache-Control": "public, max-age=3600"
          }
        });
      } else {
        // Fallback redirect to latest release
        return Response.redirect(releaseIpaUrl, 302);
      }
    }

    // 4. 1-Tap Safari Wireless OTA Installation Page (/install)
    if (pathname === "/install") {
      const installHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Install MDEsq — Physician Medicolegal Suite</title>
  <link rel="icon" href="https://raw.githubusercontent.com/alexmohit825/MDEsq/main/MDEsq/Assets.xcassets/AppIcon.appiconset/icon_1024.png">
  <style>
    :root {
      --bg: #0A0F1D;
      --card: #131B2E;
      --gold: #C9A84C;
      --gold-light: #E8D595;
      --ivory: #F5F2E9;
      --slate: #8A99AD;
      --emerald: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--ivory);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: var(--card);
      border: 1px solid rgba(201, 168, 76, 0.35);
      border-radius: 24px;
      max-width: 440px;
      width: 100%;
      padding: 32px 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .icon {
      width: 100px;
      height: 100px;
      border-radius: 22px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(201, 168, 76, 0.35);
    }
    h1 {
      font-family: "New York", Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--ivory);
      margin-bottom: 8px;
    }
    .badge {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
      background: rgba(201, 168, 76, 0.15);
      padding: 4px 10px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    p {
      color: var(--slate);
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn-install {
      display: block;
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #D4AF37 0%, #AA8022 100%);
      color: #0A0F1D;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
      transition: transform 0.1s ease;
    }
    .btn-install:active {
      transform: scale(0.98);
    }
    .footer-note {
      margin-top: 20px;
      font-size: 12px;
      color: var(--slate);
      line-height: 1.4;
    }
    .device-tag {
      color: var(--emerald);
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://raw.githubusercontent.com/alexmohit825/MDEsq/main/MDEsq/Assets.xcassets/AppIcon.appiconset/icon_1024.png" alt="MDEsq Icon" class="icon">
    <h1>MD Esq.</h1>
    <span class="badge">AD-HOC DIRECT OTA (ZERO ASC)</span>
    <p>Physician Medicolegal Radar & Contract Defense Folio engineered for licensed physicians and surgeons.</p>

    <a href="itms-services://?action=download-manifest&url=https://mdesq.mohalex.workers.dev/manifest.plist" class="btn-install">
      📱 Install on Alex's iPhone
    </a>

    <div class="footer-note">
      Direct OTA signed binary for registered iPhone<br>
      <span class="device-tag">UDID: 00008150-001E7C892200401C</span><br>
      Valid for 365 days • No cables • Zero TestFlight footprint
    </div>
  </div>
</body>
</html>`;

      return new Response(installHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 5. Serverless Edge API Endpoint for AI Copilot
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const { prompt, jurisdiction } = body;

        if (!prompt) {
          return new Response(JSON.stringify({ error: "Missing prompt parameter" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const apiKey = env.GEMINI_API_KEY || env.MDEsq || env.MDESQ;
        if (!apiKey) {
          return new Response(JSON.stringify({
            error: "Serverless GEMINI_API_KEY not configured in Cloudflare environment secrets.",
            isMock: true
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const stateContext = jurisdiction || 'WA';
        const systemPrompt = `You are MDEsq, an elite physician-legal advocate and medicolegal strategist for licensed physicians and surgeons.
Your active jurisdiction is ${stateContext} (Washington State: RCW 18.71, RCW 7.70, RCW 49.62, WAC 246-919, WMC rules).
You provide sharp, legally grounded, practical advice regarding hospital contract negotiations, Fair Market Value (FMV), Stark Law, non-competes, medical malpractice standard of care defense, and medical board investigations.
Always maintain a direct, professional, protective tone for the physician.
Include statutory citations (RCW/WAC/Stark) where relevant. Include a brief educational disclaimer.`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

        const geminiPayload = {
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nUser Question:\n${prompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        };

        const upstreamResponse = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload)
        });

        if (!upstreamResponse.ok) {
          const errText = await upstreamResponse.text();
          return new Response(JSON.stringify({ error: `Upstream Gemini API error: ${upstreamResponse.status}`, details: errText }), {
            status: upstreamResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const data = await upstreamResponse.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        return new Response(JSON.stringify({ response: replyText }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // 6. Serve Static Assets (HTML, CSS, JS, etc.)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
