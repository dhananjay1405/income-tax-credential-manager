"use strict";
browser.runtime.onMessage.addListener((msg) => {
    if (msg.action == 'paste-credential') {
        let objCredential = msg.param;
        if (location.href.indexOf('incometaxindiaefiling.gov.in/e-Filing/UserLogin/') != -1) {
            let eUser = document.getElementById('Login_userName');
            let ePass = document.getElementById('Login_password');
            eUser.value = objCredential.user;
            ePass.value = objCredential.pass;
            eUser.dispatchEvent(new Event('change'));
            ePass.dispatchEvent(new Event('change'));
            setTimeout(() => {
                let eCaptcha = document.getElementById('Login_captchaCode');
                eCaptcha.focus();
                eCaptcha.select();
            }, 500);
        }
    }
});
