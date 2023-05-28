import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Kernel } from '@wiz/libs/portal/dizest/kernel';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

export class Component implements OnInit, OnDestroy {
    constructor(
        public service: Service,
        public kernel: Kernel,
        public workflow: Workflow
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
        let namespace: any = this.workflow.namespace();
        let workflow_id: any = this.workflow.workflow_id;

        const { code, data } = await wiz.call(fnname, { workflow_id, namespace, ...query });
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