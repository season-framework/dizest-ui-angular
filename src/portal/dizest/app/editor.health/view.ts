import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() dizest: any;
    @Input() editor: any = {};

    public status: any = {
        deploy: [],
        system: [],
        gpu: []
    };

    public workflows: any = [];

    public async ngOnInit() {
        await this.service.init();
        await this.service.render();
    }

    public async onEditorShow() {
        await this.health();
        this.interval_id = setInterval(async () => {
            await this.health();
        }, 1000);
    }

    public async onEditorHide() {
        clearInterval(this.interval_id);
    }

    public async ngOnDestroy() {
        clearInterval(this.interval_id);
    }

    public currentTab: string = 'status';

    public async changeTab(tab: string) {
        this.currentTab = tab;
        if (tab == 'workflow') {
            await this.loadWorkflows();
        }
        await this.service.render();
    }

    // main settings
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

    public async loadWorkflows() {
        const { code, data } = await wiz.call("workflows");
        if (code == 200)
            this.workflows = data;
        await this.dizest.kernels();
        await this.service.render();
    }

    public async stopWorkflow(item) {
        if (item.proceed) return;
        item.proceed = true;
        await wiz.call("workflow_stop", { kernel_id: item.kernel_id });
        await this.loadWorkflows();
    }

}