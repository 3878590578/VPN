// main.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 随机生成邮箱和密码
function randomString(len){
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({length: len},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
}

function randomPassword() {
    return `${randomString(6)}-${randomString(6)}-${randomString(6)}`;
}

async function main() {
    const email = randomString(8) + "@gmail.com";
    const password = randomPassword();

    console.log("🟦 注册账号：", email, password);

    // 注册
    const regResp = await fetch("https://cn4.newbee888.cc/api/v1/passport/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&invite_code=&email_code=`
    });

    const regData = await regResp.json();

    let token = regData?.data?.auth_data || regData?.data?.token;
    if(!token){
        console.log("❌ 未能获取 token", regData);
        return;
    }
    console.log("✅ 获取 token:", token);

    // 延迟 2 秒再请求订阅，防止接口未激活
    await new Promise(r => setTimeout(r, 2000));

    // 获取订阅链接
    const subResp = await fetch("https://cn4.newbee888.cc/api/v1/user/getSubscribe", {
        method: "GET",
        headers: { "authorization": token }
    });

    const subData = await subResp.json();
    let subscribeUrl = subData?.data?.subscribe_url?.replace(/\\/g,"");

    if(!subscribeUrl){
        console.log("❌ 未能获取订阅链接", subData);
        return;
    }

    console.log("✅ 订阅链接:", subscribeUrl);

    // 保存订阅链接到仓库文件
    const filePath = path.join(__dirname, 'subscribe_url.txt');
    fs.writeFileSync(filePath, subscribeUrl, { encoding: 'utf-8' });
    console.log("✅ 已保存订阅链接到", filePath);
}

main().catch(err => console.error(err));
