import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit, OnDestroy {

    public status: any = {
        deploy: [],
        system: [],
        gpu: []
    };

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.health();
        this.interval_id = setInterval(async () => {
            await this.health();
        }, 1000);
    }

    public async ngOnDestroy() {
        if (this.interval_id > 0)
            clearInterval(this.interval_id);
    }

    public async health() {
        let res = await wiz.call("health");
        this.status.deploy = res.data.deploy;
        this.status.system = res.data.system;
        let gpus = res.data.gpu;

        let gbutil = (value) => {
            return Math.round(value / 1024 * 100) / 100;
        }

        let gpudata = [];
        for (let gpu of gpus) {
            gpudata.push({
                title: gpu.name,
                data: [
                    { key: "GPU Usage", value: `${gpu['utilization.gpu']}%` },
                    { key: "Memory Usage", value: `${gbutil(gpu['memory.used'])} GB / ${gbutil(gpu['memory.total'])} GB` }
                ]
            });
        }

        this.status.gpu = gpudata;
        await this.service.render();
    }

}