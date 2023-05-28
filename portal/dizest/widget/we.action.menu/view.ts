import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

export class Component implements OnInit, OnDestroy {
    public action: any = null;
    public event: any = {
        change: []
    };

    constructor(
        public service: Service,
        public workflow: Workflow
    ) { }

    public async ngOnInit() {
        this.workflow.regist('action.menu', this);
    }

    public async ngOnDestroy() {
        this.workflow.unregist('action.menu');
    }

    public async on(event, fn) {
        if (!this.event[event]) this.event[event] = [];
        this.event[event].push(fn);
    }

    public async toggle(action: any, status: any = null) {
        if (this.action == action && !status) this.action = null;
        else this.action = action;

        for (let fn of this.event.change)
            fn(this.action);
        await this.service.render();
    }

    public is(action: any) {
        return this.action == action;
    }
}