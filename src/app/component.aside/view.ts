import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Kernel } from '@wiz/libs/portal/dizest/kernel';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public kernel: Kernel
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
        await this.kernel.server.stop();
    }
}