import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    public data: any = {};

    constructor(public service: Service) { }

    public async ngOnInit() {
        await this.load();
        await this.service.init();
        await this.service.auth.allow('admin', "/");
    }

    public async load() {
        let { data } = await wiz.call("load");
        this.data = data;
        await this.service.render();
    }

    public async update() {
        await this.service.loading.show();
        await wiz.call("update", { data: JSON.stringify(this.data.config) });
        location.reload();
    }

    public async uploadLogo() {
        this.data.config.logo = await this.service.file.read({ type: 'image', accept: 'image/*', width: 180, quality: 1 });
        await this.service.render();
    }

    public async uploadIcon() {
        this.data.config.icon = await this.service.file.read({ type: 'image', accept: 'image/*', width: 48, quality: 1 });
        await this.service.render();
    }
}