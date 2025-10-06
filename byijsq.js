const fetch = require("node-fetch");
const fs = require("fs");

async function main() {
  const emailPrefix = Math.random().toString(36).substring(2, 10);
  const email = `${emailPrefix}@gmail.com`;
  const password = "abc123456";
  console.log("📧 注册邮箱:", email);

  // 注册请求
  const registerRes = await fetch("https://byijsq.com/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "referer": "https://byijsq.com/auth/register",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1)",
    },
    body: new URLSearchParams({
      name: emailPrefix,
      email,
      passwd: password,
      repasswd: password,
    }),
  });

  const setCookie = registerRes.headers.raw()["set-cookie"];
  if (!setCookie) {
    console.log("❌ 注册失败，未返回Cookie");
    return;
  }

  const cookie = setCookie.map((x) => x.split(";")[0]).join("; ");
  console.log("🍪 Cookie:", cookie);

  // 获取用户页面
  const userRes = await fetch("https://byijsq.com/user", {
    method: "GET",
    headers: {
      cookie: cookie,
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1)",
    },
  });

  const html = await userRes.text();

  // 提取订阅链接
  const match = html.match(/data-clipboard-text="([^"]+)"/);
  if (!match) {
    console.log("❌ 未找到订阅链接");
    return;
  }

  const subLink = match[1];
  console.log("✅ 订阅链接:", subLink);

  // 保存到文件（覆盖式）
  fs.writeFileSync("sub.txt", subLink);
  console.log("💾 已保存为 sub.txt");
}

main().catch(console.error);
