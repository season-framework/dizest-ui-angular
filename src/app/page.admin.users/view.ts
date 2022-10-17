import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {

    public list: any = [];
    public selected: any;
    public status: any = {};
    public session: any = {};

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow('admin', '/');
        await this.load();
        this.session = this.service.auth;
    }

    public async load() {
        let { data } = await wiz.call('users');
        let { users, status } = data;
        this.list = users;
        this.status = status;
        await this.service.render();
    }

    public async select(item: any) {
        this.created = null;
        if (item) {
            this.selected = JSON.parse(JSON.stringify(item));
        } else {
            this.selected = null;
        }
        await this.service.render();
    }

    public async alert(message: string) {
        return await this.service.alert.show({
            title: "Error",
            message: message,
            cancel: false,
            action: "Confirm"
        });
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
        this.selected = null;
        this.created = { role: 'user' };
        await this.service.render();
    }

    public async close() {
        this.created = null;
        await this.service.render();
    }

    public async send() {
        let user = JSON.parse(JSON.stringify(this.created));
        if (!user.id || user.id.length < 4) return await this.alert('user id must 4 characters or more');
        if (!user.password) return await this.alert('password must 8 characters or more');
        if (user.password.length < 8)
            return await this.alert('password must 8 characters or more');
        if (!user.repeat_password)
            return await this.alert('check password');
        if (user.password != user.repeat_password)
            return await this.alert('check password');

        await this.service.loading.show();
        let { code, data } = await wiz.call("create", user);

        if (code != 200) {
            await this.service.loading.hide();
            return await this.alert(data);
        }

        this.created = null;
        await this.load();
        await this.service.render();
        await this.service.loading.hide();
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