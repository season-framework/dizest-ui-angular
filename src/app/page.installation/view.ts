import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {

    public step: number = 1;
    public data: any = {};
    public user: any = {};

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        if (this.service.auth.installed)
            location.href = "/";
        await this.load();
        await this.service.render();
    }

    public async load() {
        let { code, data } = await wiz.call("load");
        if (code != 200)
            return false;

        this.data = data;
        await this.service.render();
        return true;
    }

    public async configdb() {
        await this.service.loading.show();
        await wiz.call("update", { data: JSON.stringify(this.data) });
        let status = await this.load();
        if (!status) {
            location.href = "/";
            return;
        }

        this.step = 2;
        await this.service.render();
        await this.service.loading.hide();
    }

    public async prev() {
        this.step = 1;
        await this.service.render();
    }

    public async start() {
        await this.service.loading.show();
        if (this.user.password != this.user.password_re) {
            await this.service.alert.show({ title: "Error", message: "Password missmatched", cancel: false, action: "Confirm" });
            return;
        }

        let { code, data } = await wiz.call("start", this.user);
        if (code === 200) {
            location.href = "/";
            return;
        }

        await this.service.loading.hide();
        await this.service.alert.show({ title: "Error", message: data, cancel: false, action: "Confirm" });
    }
}