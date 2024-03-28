import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Input } from '@angular/core';

export class Component implements OnInit, OnDestroy {
    @Input() sidebar: any = null;

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.refresh();
    }

    public async ngOnDestroy() {
    }

    public specs: any = [];
    public list: any = [];
    public query: any = { time: '0 2 * * *', spec: 'base', comment: '' };

    public async request(fnname: string, query: any = {}) {
        let dizest = this.sidebar.selected.dizest;
        query.workflow_id = this.sidebar.selected.workflow.id;
        const { code, data } = await dizest.api.call('timer', fnname, query);
        return { code, data };
    }

    public async refresh() {
        let workflow = this.sidebar.selected.workflow;
        const { data } = await this.request("list");
        this.list = data;
        this.query.spec = (await workflow.spec()).name;
        this.specs = await workflow.dizest.specs();
        await this.service.render();
    }

    public async remove(comment) {
        await this.request("remove", { comment: comment });
        await this.refresh();
    }

    public async add() {
        await this.request("add", this.query);
        this.query = { time: '0 2 * * *', spec: this.query.spec };
        await this.refresh();
    }

    public async close() {
        await this.sidebar.close();
    }
}