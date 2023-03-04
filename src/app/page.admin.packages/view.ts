import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {

    public kernelspec: any = [];
    public selected: any;
    public installed: any = [];
    public text: string = "";

    constructor(public service: Service) { }

    public async ngOnInit() {
        await this.loadKernel();
        await this.service.init();
        await this.service.auth.allow('admin', "/");
    }

    public async loadKernel() {
        let { data } = await wiz.call("kernelspec");
        this.kernelspec = data;
        this.selected = this.kernelspec[0].name;
        await this.load();
        await this.service.render();
    }

    public async load() {
        this.service.loading.show();
        let { code, data } = await wiz.call('load', { kernel_name: this.selected });
        if (code != 200) {
            this.service.toast.error(data);
            this.installed = [];
        } else {
            this.installed = data;
        }
        this.service.loading.hide();
    }

    public async install() {
        this.service.loading.show();
        let { code, data } = await wiz.call('install', { kernel_name: this.selected, package: this.text });
        if (code != 200) this.service.toast.error(data);
        await this.load();
    }
}