// byijsq.js
// 自动注册 + 登录 + 获取订阅 + 保存为 Clash YAML 文件

// 🔧 修复 Node18+ 环境中 undici 的 File 缺失问题
if (typeof File === "undefined") {
  global.File = class File {};
}

const fs = require('fs');
const fetch = require('node-fetch'); // 已固定使用 node-fetch@2
const cheerio = require('cheerio');

const BASE = "https://byijsq.com";
const REGISTER_URL = `${BASE}/auth/register`;
const LOGIN_URL = `${BASE}/auth/login`;
const USER_URL = `${BASE}/user`;

(async () => {
  try {
    const email = `bot${Math.random().toString(36).slice(2, 8)}@gmail.com`;
    const password = 'abc123456';

    console.log("📩 注册账号:", email);

    // 注册
    const registerRes = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `email=${email}&name=${email.split('@')[0]}&passwd=${password}&repasswd=${password}&invite_code=&email_code=`,
    });

    const registerText = await registerRes.text();
    console.log("🟢 注册响应:", registerText.slice(0, 100));

    // 登录
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `email=${email}&passwd=${password}`,
      redirect: "manual",
    });

    const cookie = loginRes.headers.get("set-cookie");
    if (!cookie) throw new Error("❌ 登录失败，未返回 cookie");

    console.log("🍪 登录成功");

    // 获取订阅链接
    const userRes = await fetch(USER_URL, { headers: { cookie } });
    const html = await userRes.text();
    const $ = cheerio.load(html);
    const subLink = $('a[href*="/link/"]').attr('href') || $('a:contains("订阅")').attr('href');

    if (!subLink) throw new Error("❌ 未找到订阅链接");

    const fullLink = subLink.startsWith("http") ? subLink : `${BASE}${subLink}`;
    console.log("🔗 订阅链接:", fullLink);

    // 拉取订阅内容
    const subRes = await fetch(fullLink, { headers: { cookie } });
    const subText = await subRes.text();

    if (!subText) throw new Error("❌ 订阅内容为空");

    // 如果内容是 Base64 格式，自动转成 Clash YAML
    let output = subText;
    try {
      const decoded = Buffer.from(subText.trim(), "base64").toString();
      if (decoded.includes("vmess") || decoded.includes("ss://") || decoded.includes("vless://")) {
        output = decoded;
        console.log("🧩 检测到 Base64 编码，已自动解码");
      }
    } catch {
      console.log("⚪ 非 Base64 内容，直接保存");
    }

    fs.writeFileSync("byijsq.yaml", output);
    console.log("✅ 已保存 byijsq.yaml 文件");
  } catch (err) {
    console.error("❌ 出错:", err);
    process.exit(1);
  }
})();
