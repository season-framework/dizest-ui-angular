import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

import toastr from 'toastr';
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-bottom-center",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": 300,
    "hideDuration": 500,
    "timeOut": 1500,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

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

    public async update() {
        let user = JSON.parse(JSON.stringify(this.selected));

        if (user.password) {
            if (user.password.length < 8)
                return toastr.error('password must 8 characters or more');
            if (!user.repeat_password)
                return toastr.error('check password');
            if (user.password != user.repeat_password)
                return toastr.error('check password');
        } else {
            delete user.password;
        }

        let { code, data } = await wiz.call("update", user);
        if (code != 200) return toastr.error(data);

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
        if (!user.id || user.id.length < 4) return toastr.error('user id must 4 characters or more');
        if (!user.password) return toastr.error('password must 8 characters or more');
        if (user.password.length < 8)
            return toastr.error('password must 8 characters or more');
        if (!user.repeat_password)
            return toastr.error('check password');
        if (user.password != user.repeat_password)
            return toastr.error('check password');

        await this.service.loading(true);
        let { code, data } = await wiz.call("create", user);

        if (code != 200) {
            await this.service.loading(false);
            return toastr.error(data);
        }

        this.created = null;
        await this.load();
        await this.service.render();
        await this.service.loading(false);
    }

    public async delete() {
        let user = JSON.parse(JSON.stringify(this.selected));
        let { code, data } = await wiz.call("delete", user);
        if (code != 200) return toastr.error(data);
        this.selected = null;
        await this.load();
        await this.service.render();
    }

}