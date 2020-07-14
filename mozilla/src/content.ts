/// <reference path="../../node_modules/@types/firefox-webext-browser/index.d.ts"/>

interface clientInfo {
    name: string;
    user: string;
    pass: string;
}

interface messageInfo {
    action: string;
    param: any;
}


browser.runtime.onMessage.addListener((msg: messageInfo) => {
    if (msg.action == 'paste-credential') {
        let objCredential: clientInfo = msg.param;
        if (location.href.indexOf('incometaxindiaefiling.gov.in/e-Filing/UserLogin/') != -1) {
            let eUser: HTMLInputElement = <HTMLInputElement>document.getElementById('Login_userName');
            let ePass: HTMLInputElement = <HTMLInputElement>document.getElementById('Login_password');
            eUser.value = objCredential.user;
            ePass.value = objCredential.pass;
            eUser.dispatchEvent(new Event('change'));
            ePass.dispatchEvent(new Event('change'));
            setTimeout(() => {
                let eCaptcha: HTMLInputElement = <HTMLInputElement>document.getElementById('Login_captchaCode');
                eCaptcha.focus();
                eCaptcha.select();
            }, 500);
        }
    }
});