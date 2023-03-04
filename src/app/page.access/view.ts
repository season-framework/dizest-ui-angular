import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    public status: any = {
        page: ''
    };

    public user: any = {
        id: '',
        username: '',
        password: ''
    };

    public database: any = {
        'type': 'sqlite',
        'path': 'dizest.db',
        'host': '127.0.0.1',
        'user': 'root',
        'port': 3306,
        'database': 'dizest'
    };

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(false, "/");
        await this.installed();
    }

    public async installed() {
        const { code } = await wiz.call("installed");
        if (code == 200) {
            this.status.page = 'login';
        } else {
            this.status.page = 'install.database';
        }
        await this.service.render();
    }

    public async alert(message: string, status: string = 'error') {
        return await this.service.alert.show({
            title: "",
            message: message,
            cancel: false,
            actionBtn: status,
            action: "확인",
            status: status
        });
    }

    public async login() {
        let user = JSON.parse(JSON.stringify(this.user));
        user.password = this.service.auth.hash(user.password);

        let { code, data } = await wiz.call("login", user);
        if (code == 200) {
            location.href = "/";
            return;
        }
        await this.alert(data);
    }

    public async check() {
        await wiz.call("update", this.database);
        const { code } = await wiz.call("check");
        if (code == 200) {
            this.user.id = "root";
            this.status.page = 'install.user';
            await this.service.render();
            return
        }

        await this.alert("Database Error");
    }

    public async create() {
        let user = JSON.parse(JSON.stringify(this.user));
        if (user.password != user.password_re) {
            await this.alert("Password missmatched");
            return;
        }

        user.password = this.service.auth.hash(user.password);
        const { code, data } = await wiz.call("create", user);

        if (code != 200) {
            await this.alert(data);
            return;
        }

        this.user = {};
        await this.installed();
    }
}