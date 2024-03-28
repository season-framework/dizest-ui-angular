import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Input } from '@angular/core';

export class Component implements OnInit, OnDestroy {
    @Input() sidebar: any = null;

    public loading: boolean = true;

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.refresh();
    }

    public async ngOnDestroy() {
    }

    public list: any = [];
    public query: string = '';

    public async request(fnname: string, query: any = {}) {
        let dizest = this.sidebar.selected.dizest;
        query.workflow_id = this.sidebar.selected.workflow.id;
        const { code, data } = await dizest.api.call('conda', fnname, query);
        return { code, data };
    }

    public async refresh() {
        let workflow = this.sidebar.selected.workflow;
        let spec = (await workflow.spec()).name;
        const { data } = await this.request("pip/list", { spec: spec });
        this.list = data;
        this.loading = false;
        await this.service.render();
    }

    public async remove(comment) {
        this.loading = true;
        await this.service.render();
        await this.request("remove", { comment: comment });
        await this.refresh();
    }

    public async add() {
        if (!this.query) return;
        this.loading = true;
        await this.service.render();
        let workflow = this.sidebar.selected.workflow;
        let spec = (await workflow.spec()).name;
        await this.request("pip/install", { spec: spec, package: this.query });
        await this.refresh();
    }

    public async close() {
        await this.sidebar.close();
    }
}