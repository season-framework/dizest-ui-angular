import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() app: any;
    @Input() sidebar: any;

    public loading: boolean = true;
    public list: any = [];
    public query: string = '';

    public async ngOnInit() {
        await this.service.init();
        await this.service.render();
    }

    public async call(path, query: any = {}) {
        let kernel_id = this.app.workflow.spec.data.kernel_id;
        query.kernel_id = kernel_id;
        return await wiz.call(path, query);
    }

    public async onSidebarShow() {
        await this.refresh();
        await this.service.render();
    }

    public async refresh() {
        await this.service.render(this.loading = true);
        let { data } = await this.call("load");
        this.list = data;
        await this.service.render(this.loading = false);
    }

    public async remove(item) {
        this.loading = true;
        await this.service.render();
        await this.call("remove", { package: item.name });
        await this.refresh();
    }

    public async add() {
        if (!this.query) return;
        this.loading = true;
        await this.service.render();
        await this.call("install", { package: this.query });
        await this.refresh();
    }
}