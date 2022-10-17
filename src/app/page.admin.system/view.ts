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

    public async restart() {
        await this.service.loading.show();
        try {
            await wiz.call("restart");
        } catch (e) {
        }

        while (true) {
            try {
                await this.load();
                break;
            } catch (e) {
                await this.service.render(500);
            }
        }
        await this.service.loading.hide();
    }

    public async update() {
        await this.service.loading.show();
        await wiz.call("update", { data: JSON.stringify(this.data.config) });
        await this.load();
        await this.service.loading.hide();
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