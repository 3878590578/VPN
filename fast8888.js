#!/usr/bin/env node
/**
 * 自动注册/登录并拉取 fast8888 订阅链接
 * 环境变量：EMAIL、PASSWORD、INVITE_CODE(可选)
 * 输出文件：fast8888.txt（与脚本同名）
 */
const fs   = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const EMAIL       = process.env.EMAIL;
const PASSWORD    = process.env.PASSWORD;
const INVITE_CODE = process.env.INVITE_CODE || "";
const OUT_FILE    = path.join(__dirname, "fast8888.txt");

if (!EMAIL || !PASSWORD) {
  console.error("❌ 请设置 secrets.EMAIL 和 secrets.PASSWORD");
  process.exit(1);
}

(async () => {
  try {
    // 1. 注册（已存在会 400，忽略即可）
    const regOK = await register(EMAIL, PASSWORD, INVITE_CODE);
    if (!regOK) console.log("⚠️  注册跳过，可能已存在");

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
async function register(email, pwd, invite) {
  const params = new URLSearchParams({
    email,
    password: pwd,
    invite_code: invite,
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
