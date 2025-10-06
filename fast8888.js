#!/usr/bin/env node
/**
 * 完全随机注册并拉取 fast8888 订阅
 * 输出：fast8888.txt
 */
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");
const fetch  = require("node-fetch");

const OUT_FILE = path.join(__dirname, "fast8888.txt");

/* ---------- 工具 ---------- */
const randStr = (len = 12) => crypto.randomBytes(len).toString('base64url').slice(0, len);
const email   = `${crypto.randomUUID()}@tmpmail.cn`;
const password = randStr(16);

/* ---------- 主流程 ---------- */
(async () => {
  try {
    console.log(`🚀 随机注册：${email} / ${password}`);

    // 1. 注册
    const regOK = await register(email, password);
    if (!regOK) console.log("⚠️  注册未成功，继续尝试获取订阅");

    // 2. 拿订阅
    const url = await getSubscribe();
    if (!url) throw new Error("获取订阅失败");

    // 3. 写入
    fs.writeFileSync(OUT_FILE, url, "utf8");
    console.log("✅ 已写入", OUT_FILE);
  } catch (e) {
    console.error("❌ 运行失败:", e.message);
    process.exit(1);
  }
})();

/* ---------- 业务函数 ---------- */
async function register(email, pwd) {
  const params = new URLSearchParams({
    email,
    password: pwd,
    invite_code: "",
    email_code: ""
  });
  const res = await fetch("http://panel.fast8888.com/api/v1/passport/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const body = await res.json().catch(() => ({}));
  return res.status === 200 && body.status === "success";
}

async function getSubscribe() {
  const ts = Date.now();
  const res = await fetch(`http://panel.fast8888.com/api/v1/user/getSubscribe?t=${ts}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.status === "success" && body.data?.subscribe_url) {
    return body.data.subscribe_url;
  }
  throw new Error(body.message || "接口异常");
}
