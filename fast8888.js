#!/usr/bin/env node
/**
 * fast8888 自动注册并输出订阅链接
 * 运行环境:GitHub Actions / Node.js 18+
 */

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const BASE_URL = "http://panel.fast8888.com";
const REGISTER_API = `${BASE_URL}/api/v1/passport/auth/register`;
const SUBSCRIBE_API = (t) => `${BASE_URL}/api/v1/user/getSubscribe?t=${t}`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const OUT_FILE = path.join(__dirname, "fast8888.txt");

function randStr(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function register(email, password) {
  const body = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&invite_code=&email_code=`;
  const res = await fetch(REGISTER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
      "Origin": BASE_URL,
      "Referer": BASE_URL + "/",
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (data.status === "success" && data.data?.auth_data) {
    return data.data.auth_data; // token
  }
  throw new Error("注册失败");
}

async function getSubscribe(token) {
  const res = await fetch(SUBSCRIBE_API(Date.now()), {
    method: "GET",
    headers: {
      "User-Agent": UA,
      "Authorization": token,
      "Referer": BASE_URL + "/",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (data.status === "success" && data.data?.subscribe_url) {
    return data.data.subscribe_url.replace(/\\/g, "");
  }
  throw new Error("获取订阅失败");
}

(async () => {
  try {
    const email = `${randStr(8)}@gmail.com`;
    const password = randStr(12);
    console.log(`🚀 注册账号:${email} / ${password}`);

    const token = await register(email, password);
    console.log("✅ 注册成功,token 获取成功");

    const subUrl = await getSubscribe(token);
    console.log("✅ 订阅链接:", subUrl);

    fs.writeFileSync(OUT_FILE, subUrl + "\n", "utf8");
    console.log("📄 已写入:fast8888.txt");
  } catch (e) {
    console.error("❌ 出错:", e.message);
    process.exit(1);
  }
})();
