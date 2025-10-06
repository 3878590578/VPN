const fs = require("fs");
const fetch = require("node-fetch");

async function register(email, password) {
    const url = "http://panel.fast8888.com/api/v1/passport/auth/register";
    const params = new URLSearchParams();
    params.append("email", email);
    params.append("password", password);
    params.append("invite_code", "");
    params.append("email_code", "");

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    });

    const data = await res.json();
    if(data.status === "success") {
        console.log("注册成功:", email);
        return true;
    } else {
        console.log("注册失败:", data.message);
        return false;
    }
}

async function getSubscribe() {
    const timestamp = Date.now();
    const url = `http://panel.fast8888.com/api/v1/user/getSubscribe?t=${timestamp}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.status === "success") {
        console.log("订阅链接:", data.data.subscribe_url);
        return data.data.subscribe_url;
    } else {
        console.log("获取订阅失败:", data.message);
        return null;
    }
}

(async () => {
    const email = "sdjdjnddn@gmail.com";
    const password = "fibFyq-kykmaj-2cucdo";

    const ok = await register(email, password);
    if(ok) {
        const subscribe = await getSubscribe();
        if(subscribe) {
            fs.writeFileSync("subscribe.txt", subscribe);
console。log("文件生成路径:"， process.cwd() + "/subscribe.txt");
        }
    }
})();
