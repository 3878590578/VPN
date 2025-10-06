const fs = require("fs");
const fetch = require("node-fetch"); // 使用 v2 版本
const cheerio = require("cheerio");  // 解析网页 HTML

process.chdir(__dirname);

(async () => {
  try {
    console.log("▶ 开始注册 BYIJSQ 账号...");

    // === Step 1: 随机账号信息 ===
    const email = `vpn_${Date.now()}@qq.com`;
    const password = "abc123456";
    const name = "user" + Math.floor(Math.random() * 10000);

    // === Step 2: 注册接口 ===
    const registerUrl = "https://byijsq.com/auth/register";
    const bodyData = new URLSearchParams({
      name,
      email,
      passwd: password,
      repasswd: password
    });

    const registerRes = await fetch(registerUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: bodyData
    });

    // 获取 Cookie
    const setCookie = registerRes.headers.get("set-cookie");
    if (!setCookie) throw new Error("未获取到 Cookie，注册可能失败");

    console.log("✅ 注册成功，正在提取订阅...");

    // === Step 3: 使用 Cookie 访问 /user 页面 ===
    const userRes = await fetch("https://byijsq.com/user", {
      headers: {
        "cookie": setCookie,
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X)",
        "referer": "https://byijsq.com/auth/register"
      }
    });

    const html = await userRes.text();

    // === Step 4: 提取 Clash 订阅链接 ===
    const $ = cheerio.load(html);
    const subLink = $('button[data-clipboard-text*="clash"]').attr("data-clipboard-text");

    if (!subLink) throw new Error("未找到订阅链接，可能网站结构变化");
    console.log("✅ 订阅链接:", subLink);

    // === Step 5: 下载订阅文件 ===
    const subRes = await fetch(subLink);
    if (!subRes.ok) throw new Error("下载订阅失败，状态码：" + subRes.status);
    const yamlText = await subRes.text();

    // === Step 6: 写入 clash.yaml 文件 ===
    fs.writeFileSync("byijsq.yaml", yamlText);

    console.log(`
──────────────
✅ 成功生成 Clash 配置文件：
https://raw.githubusercontent.com/<你的GitHub用户名>/<你的仓库名>/main/byijsq.yaml
──────────────
`);

  } catch (err) {
    console.error("❌ 出错了:", err.message);
    process.exit(1);
  }
})();
