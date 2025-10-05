const fs = require('fs');
const fetch = require('node-fetch'); // GitHub Actions 使用 node-fetch@2

(async () => {
  try {
    console.log("▶ 开始自动注册...");

    const registerUrl = "https://cn4.newbee888.cc/api/v1/passport/auth/register";
    const email = `vpn_${Date.now()}@gmail.com`;
    const password = "abc123456";

    const registerRes = await fetch(registerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        invite_code: "",
        email_code: ""
      }),
    });

    const registerData = await registerRes.json();
    console.log("注册返回:", registerData);

    // 兼容两种字段结构
    const token =
      registerData?.data?.auth_data?.token ||
      registerData?.data?.token;

    if (!token) {
      throw new Error("注册失败，未返回 token");
    }

    console.log("✅ 获取到 token:", token);

    // === 获取订阅链接 ===
    const subUrl = `https://cn4.newbee888.cc/api/v1/client/subscribe?token=${token}`;
    console.log("✅ 订阅链接:", subUrl);

    console.log("▶ 获取订阅内容中...");
    const subRes = await fetch(subUrl);
    if (!subRes.ok) throw new Error("获取订阅失败，HTTP状态码: " + subRes.status);
    const subContent = await subRes.text();

    const base64Content = Buffer.from(subContent).toString('base64');
    fs.writeFileSync("subscribe_url.txt", base64Content);

    console.log(`
──────────────
🚀 订阅更新成功！
直接导入 Clash / Surge / Loon：
https://raw.githubusercontent.com/3878590578/vpn/main/subscribe_url.txt
──────────────
`);

  } catch (err) {
    console.error("❌ 出错了:", err.message);
    process.exit(1);
  }
})();
