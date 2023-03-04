import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

export class Component implements OnInit, OnDestroy {
    public zone: string = 'dizest';
    public workflow_id: any;
    public loaded: boolean = false;

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) { this.workflow_id = WizRoute.segment.id; }

    public async ngOnInit() {
        this.loaded = false;
        await this.workflow.init(this.service, this.zone, this.workflow_id);
        await this.service.init();
        await this.service.auth.allow(true, "/access");
        this.loaded = true;
        await this.service.render();
    }

}