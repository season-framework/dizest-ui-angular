import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    public user: any = {
        id: '',
        username: '',
        password: ''
    };

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(false, "/");
    }

    public async alert(message: string, status: string = 'error') {
        return await this.service.alert.show({
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
        let { code, data } = await wiz.call("login", user);
        if (code == 200) {
            location.href = "/";
            return;
        }
        await this.alert(data);
    }
}