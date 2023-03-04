import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public dizest: Dizest
    ) { }

    public async ngOnInit() {
        await this.service.init();
    }

    public isMenuCollapsed: boolean = true;

    public menuActive(url: string) {
        let path = location.pathname;
        if (path.indexOf(url) == 0) return 'active';
        return '';
    }

    public async stop() {
        await this.dizest.server.stop();
    }
}