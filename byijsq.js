// byijsq.js
// 自动注册 + 登录 + 获取订阅 + 输出为 byijsq.yaml

const fs = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const BASE = "https://byijsq.com";
const REGISTER_URL = `${BASE}/auth/register`;
const LOGIN_URL = `${BASE}/auth/login`;
const USER_URL = `${BASE}/user`;

(async () => {
  try {
    // ✅ 这里修正了 Math.random() 的写法
    const email = `bot${Math.random().toString(36).slice(2, 8)}@gmail.com`;
    const password = 'abc123456';

    console.log("📩 注册账号：", email);

    // 注册账号
    const registerRes = await fetch(REGISTER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `email=${email}&name=${email.split('@')[0]}&passwd=${password}&repasswd=${password}&invite_code=&email_code=`,
    });

    const registerText = await registerRes.text();
    console.log("🟢 注册成功响应:", registerText.slice(0, 100));

    // 登录
    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `email=${email}&passwd=${password}`,
      redirect: "manual"
    });

    const cookie = loginRes.headers.get('set-cookie');
    if (!cookie) throw new Error("❌ 登录失败，未获取到 cookie");

    console.log("🍪 登录成功");

    // 获取订阅链接
    const userRes = await fetch(USER_URL, { headers: { cookie } });
    const html = await userRes.text();
    const $ = cheerio.load(html);
    const subLink = $('a[href*="/link/"]').attr('href') || $('a:contains("订阅")').attr('href');

    if (!subLink) throw new Error("❌ 未找到订阅链接");
    const fullLink = subLink.startsWith('http') ? subLink : `${BASE}${subLink}`;
    console.log("🔗 订阅链接:", fullLink);

    // 获取订阅内容
    const subRes = await fetch(fullLink, { headers: { cookie } });
    const subText = await subRes.text();

    if (!subText) throw new Error("❌ 订阅内容为空");

    fs.writeFileSync("byijsq.yaml", subText);
    console.log("✅ 已保存 byijsq.yaml 文件");
  } catch (err) {
    console.error("❌ 出错:", err);
    process.exit(1);
  }
})();
