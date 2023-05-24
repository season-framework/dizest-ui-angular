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

    public activeTab: string = 'apps';
    public isMenuCollapsed: boolean = true;

    public async ngOnInit() {
        this.workflow.regist('navigator', this);
    }

    public async ngOnDestroy() {
        this.workflow.unregist('navigator');
    }

    public async tab(tab: string) {
        this.activeTab = tab;
        await this.service.render();
    }

    public is(tab: string) {
        return this.activeTab == tab;
    }

    public menuActive(url: string) {
        let path = location.pathname;
        if (path.indexOf(url) == 0) return 'active';
        return '';
    }

    public async stop() {
        await this.dizest.server.stop();
    }
}