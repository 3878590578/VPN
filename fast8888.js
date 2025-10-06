#!/usr/bin/env node
/**
•  完全随机注册并拉取 fast8888 订阅（带重试 + UA + 主流邮箱）
•  输出：fast8888.txt
*/
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");
const fetch  = require("node-fetch");
const OUT_FILE = path.join(__dirname, "fast8888.txt");
const RETRY    = 3;
const MAIL_POOL= [               // 主流域名，降低一次性邮箱特征
'@gmail.com',
'@outlook.com',
'@proton.me'
];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
/* ---------- 工具 ---------- */
const randStr = (len = 16) => crypto.randomBytes(len).toString('base64url').slice(0, len);

const randMail = () =>
  `${crypto.randomUUID().replace(/-/g, '')}${MAIL_POOL[Math.floor(Math.random() * MAIL_POOL.length)]}`;

const sleep   = (ms) => new Promise(r => setTimeout(r, ms));
/* ---------- 主流程 ---------- */
(async () => {
const email    = randMail();
const password = randStr(16);
console.log(🚀 随机注册：${email} / ${password});
try {
// 1. 注册（带重试）
const regOK = await retry(() => register(email, password), RETRY);
if (!regOK) throw new Error('注册失败已达上限');
// 2. 拿订阅（带重试）
const url = await retry(getSubscribe, RETRY);
if (!url) throw new Error('获取订阅失败已达上限');

// 3. 写入
fs.writeFileSync(OUT_FILE, url, 'utf8');
console.log('✅ 订阅链接：', url);
console.log('✅ 已写入：', OUT_FILE);

} catch (e) {
console.error('❌ 运行失败：', e.message);
process.exit(1);
}
})();
/* ---------- 业务函数 ---------- */
async function register(email, pwd) {
const params = new URLSearchParams({
email,
password: pwd,
invite_code: '',
email_code: ''
});
const res = await fetch('http://panel.fast8888.com/api/v1/passport/auth/register', {
method: 'POST',
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
'User-Agent': UA
},
body: params.toString()
});
if (res.status === 403) throw new Error('注册接口 403（IP/UA 被封）');
if (res.status === 429) throw new Error('注册接口 429（限流）');
const body = await res.json().catch(() => ({}));
if (res.status !== 200 || body.status !== 'success') {
console.warn(注册异常 status=${res.status} msg=${body.message || '-'});
return false;
}
return true;
}
async function getSubscribe() {
const ts = Date.now();
const res = await fetch(http://panel.fast8888.com/api/v1/user/getSubscribe?t=${ts}, {
headers: { 'User-Agent': UA }
});
if (res.status === 403) throw new Error('订阅接口 403（IP/UA 被封）');
if (res.status === 429) throw new Error('订阅接口 429（限流）');
const body = await res.json().catch(() => ({}));
if (res.status !== 200 || body.status !== 'success') {
console.warn(订阅异常 status=${res.status} msg=${body.message || '-'});
return null;
}
return body.data?.subscribe_url || null;
}
/* ---------- 通用重试 ---------- */
async function retry(fn, times = 3) {
for (let i = 1; i <= times; i++) {
try {
const res = await fn();
if (res) return res;
} catch (e) {
console.warn(第 ${i} 次重试失败: ${e.message});
if (i < times) await sleep(2000 * i);
}
}
return null;
}
