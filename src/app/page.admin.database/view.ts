import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {

    public initialized: boolean = false;
    public data: any = {};

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.loading.show();
        await this.service.init();
        await this.service.auth.allow('admin', '/');
        await this.load();
        this.initialized = true;
        await this.service.loading.hide();
    }

    public async load() {
        let { data } = await wiz.call("load");
        this.data = data;
        await this.service.render();
    }

    public async update() {
        await this.service.loading.show();
        await wiz.call("update", { data: JSON.stringify(this.data) });
        location.reload();
    }

}