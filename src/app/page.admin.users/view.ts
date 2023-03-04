import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {

    public list: any = [];
    public isCreate: boolean = false;
    public selected: any;
    public session: any = {};

    constructor(public service: Service) { }

    public async ngOnInit() {
        await this.load();
        this.session = this.service.auth.session;

        await this.service.init();
        await this.service.auth.allow('admin', "/");
    }

    public async alert(message: string) {
        return await this.service.alert.show({
            title: "Error",
            message: message,
            cancel: false,
            action: "Confirm"
        });
    }

    public async load() {
        let { data } = await wiz.call("load");
        let { users } = data;
        this.list = users;
        await this.service.render();
    }

    public async select(item: any, isCreate: boolean = false) {
        if (isCreate) {
            this.isCreate = isCreate;
            this.selected = { role: 'user' };
        } else if (item) {
            this.selected = JSON.parse(JSON.stringify(item));
        } else {
            this.isCreate = false;
            this.selected = null;
        }
        await this.service.render();
    }

    public async update() {
        let user = JSON.parse(JSON.stringify(this.selected));

        if (user.password) {
            if (user.password.length < 8)
                return await this.alert("password must 8 characters or more");
            if (!user.repeat_password)
                return await this.alert("Check password");
            if (user.password != user.repeat_password)
                return await this.alert("Check password");
            user.password = this.service.auth.hash(user.password);
        } else {
            delete user.password;
        }

        let { code, data } = await wiz.call("update", user);
        if (code != 200) return await this.alert(data);

        this.selected = null;
        await this.load();
        await this.service.render();
    }

    public async create() {
        let user = JSON.parse(JSON.stringify(this.selected));
        if (!user.id || user.id.length < 4) return await this.alert('user id must 4 characters or more');
        if (!user.password) return await this.alert('password must 8 characters or more');
        if (user.password.length < 8)
            return await this.alert('password must 8 characters or more');
        if (!user.repeat_password)
            return await this.alert('check password');
        if (user.password != user.repeat_password)
            return await this.alert('check password');

        user.password = this.service.auth.hash(user.password);

        let { code, data } = await wiz.call("create", user);

        if (code != 200) {
            return await this.alert(data);
        }

        this.selected = null;
        this.isCreate = false;
        await this.load();
        await this.service.render();
    }

    public async delete() {
        let user = JSON.parse(JSON.stringify(this.selected));

        let res = await this.service.alert.show({
            message: `Do you really want to remove user '${user.id}'? What you've done cannot be undone.`,
            action: "Delete"
        });
        if (!res) return;

        let { code, data } = await wiz.call("delete", user);
        if (code != 200) return await this.alert(data);
        this.selected = null;
        await this.load();
        await this.service.render();
    }

}