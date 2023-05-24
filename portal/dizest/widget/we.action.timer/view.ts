import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

export class Component implements OnInit, OnDestroy {
    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) { }

    public async ngOnInit() {
        await this.refresh();
    }

    public async ngOnDestroy() {
    }

    public list: any = [];
    public query: any = { time: '0 2 * * *', spec: 'base' };

    public async close() {
        let action = this.workflow.component("action.menu");
        await action.toggle();
    }

    public async request(fnname: string, query: any = {}) {
        let workflow_id: any = this.workflow.workflow_id;
        let zone: any = this.workflow.zone;

        const { code, data } = await wiz.call(fnname, { workflow_id, zone, ...query });
        return { code, data };
    }

    public async refresh() {
        const { data } = await this.request("list");
        this.list = data;
        await this.service.render();
    }

    public async remove(comment) {
        await this.request("remove", { comment: comment });
        await this.refresh();
    }

    public async add() {
        await this.request("add", this.query);
        this.query = { time: '0 2 * * *', spec: 'base' };
        await this.refresh();
    }

}