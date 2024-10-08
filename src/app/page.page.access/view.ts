import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';

export class Component implements OnInit {
    constructor(public service: Service) {
        this.dizest = new Dizest(service);
    }

    public mode: string = 'password';

    public user: any = {
        id: '',
        password: ''
    };

    public async ngOnInit() {
        await this.service.init();
        this.mode = WizRoute.segment.mode ? WizRoute.segment.mode : 'password';

        const urlParams = new URLSearchParams(window.location.search);
        let redirectParam = urlParams.get('redirect');
        if (!redirectParam) redirectParam = "/";
        this.redirectParam = redirectParam;
        await this.service.auth.allow(false, this.redirectParam);
    }

    public async alert(message: string, status: string = 'error') {
        return await this.service.modal.show({
            title: "",
            message: message,
            cancel: false,
            actionBtn: status,
            action: "Confirm",
            status: status
        });
    }

    public async login() {
        let user = JSON.parse(JSON.stringify(this.user));
        let { code, data } = await this.dizest.api.call("auth", "login", user)
        if (code == 200) {
            location.href = this.redirectParam;
            return;
        }
        await this.alert(data);
    }
}