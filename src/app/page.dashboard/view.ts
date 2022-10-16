import { OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit, OnDestroy {

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public status: any = {
        deploy: [],
        system: [],
        workflow: {
            data: [],
            map: {},
            total: 0,
            alive: 0
        }
    };

    public interval_id: number = 0;

    public async ngOnInit() {
        await this.service.init();
        this.service.auth.allow(true, '/auth/login');

        await this.workflow();
        await this.health();
        this.interval_id = setInterval(async () => {
            await this.health();
        }, 1000);
    }

    public async ngOnDestroy() {
        if (this.interval_id > 0)
            clearInterval(this.interval_id);
    }

    public async workflow() {
        let res = await wiz.call("list");
        this.status.workflow.data = res.data;
        for (let i = 0; i < this.status.workflow.data.length; i++) {
            this.status.workflow.map[this.status.workflow.data[i].id] = this.status.workflow.data[i];
        }
        await this.service.render();
    }

    public async health() {
        let res = await wiz.call("health");
        this.status.deploy = res.data.deploy;
        this.status.system = res.data.system;
        this.status.workflow.total = res.data.total;

        res = await wiz.call("status");

        for (let i = 0; i < res.data.length; i++) {
            let item = res.data[i];
            if (this.status.workflow.map[item.id]) {
                if (item.status == 'stop') {
                    let index = this.status.workflow.data.indexOf(this.status.workflow.map[item.id]);
                    if (index > -1) {
                        this.status.workflow.data.splice(index, 1);
                        delete this.status.workflow.map[item.id];
                    }
                } else {
                    this.status.workflow.map[item.id].status = item.status;
                }
            } else {
                if (item.status == 'stop') continue;
                let { code, data } = await wiz.call('get', { workflow_id: item.id });
                if (code != 200) continue;
                data.status = item.status;
                this.status.workflow.map[data.id] = data;
                this.status.workflow.data.push(this.status.workflow.map[data.id]);
            }
        }

        this.status.workflow.alive = this.status.workflow.data.length;

        await this.service.render();
    }

    public selected: any = {};

    public async close() {
        await this.select();
    }

    public async select(item: any = {}) {
        this.selected = item;
        await this.service.render();
    }

}