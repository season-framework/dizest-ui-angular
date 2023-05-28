import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit, OnDestroy {
    public loaded: boolean = false;
    public workflow_id: any;
    public namespace: any;
    public kernel_id: any;

    constructor(public service: Service) {
        this.workflow_id = WizRoute.segment.id;
    }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, "/access");

        let workflow_id = this.workflow_id;
        this.namespace = 'dizest.' + workflow_id;
        // let user_id = this.service.auth.session.id;
        // this.kernel_id = `${user_id}.${workflow_id}`;

        this.loaded = true;
        await this.service.render();
    }

}