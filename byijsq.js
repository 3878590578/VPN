// byijsq.js
// 自动注册 + 登录 + 提取 Clash 订阅 + 保存 YAML
// Node 18+ 兼容
if (typeof File === 'undefined') global.File = class File {};

const fs      = require('fs');
const fetch   = require('node-fetch');   // v2 版本
const cheerio = require('cheerio');

const BASE        = 'https://byijsq.com';
const REG_API     = `${BASE}/auth/register`;
const LOGIN_API   = `${BASE}/auth/login`;
const USER_PAGE   = `${BASE}/user`;

(async () => {
  try {
    const email    = `bot${Math.random().toString(36).slice(2, 8)}@gmail.com`;
    const password = 'abc123456';

    console.log('📩 注册账号:', email);

    // 1. 注册
    const regRes = await fetch(REG_API, {
      method : 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body   : new URLSearchParams({
        email, name: email.split('@')[0], passwd: password, repasswd: password,
        invite_code: '', email_code: ''
      }).toString()
    });
    const regText = await regRes.text();
    console.log('🟢 注册响应:', regText.slice(0, 100));

  

// 2. 登录
// 2. 登录
const loginRes = await fetch(LOGIN_API, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ email, passwd: password }).toString(),
  redirect: 'follow'
});
const cookie = loginRes.headers.raw()?.['set-cookie']
  ?.map(c => c.split(';')[0])
  .join('; ');
if (!cookie) throw new Error('❌ 登录后无 cookie');
console.log('🍪 登录成功');




    // 3. 用户中心 → 先保存调试文件
const userRes = await fetch(USER_PAGE, { headers: { cookie } });
const html = await userRes.text();
fs.writeFileSync('debug_user.html', html);          // ← 新增
console.log('📄 已保存 debug_user.html，前 3000 字符：', html.slice(0, 3000));

const $ = cheerio.load(html);

// ① 尝试自动提取
let subLink = $('button[data-clipboard-text*="clash=1"]').attr('data-clipboard-text');

// ② 如果提取不到，用写死的临时链接（把 XXXX 换成你手动复制的）
if (!subLink) {
  subLink = 'https://ozwhvroaxw7x8y8osqg.gym-gpt.com/link/XXXX?clash=1';
  console.log('⚠️  未找到按钮，使用手动链接');
}

if (!subLink) throw new Error('❌ 仍无订阅链接');
console.log('🔗 订阅链接:', subLink);


    // 4. 拉取订阅内容
    const subRes  = await fetch(subLink, { headers: { cookie } });
    const yamlTxt = await subRes.text();
    if (!yamlTxt) throw new Error('❌ 订阅内容为空');
    fs.writeFileSync('byijsq.yaml', yamlTxt);
    console.log('✅ 已保存 byijsq.yaml');
  } catch (e) {
    console.error('❌ 出错:', e);
    process.exit(1);
  }
})();
