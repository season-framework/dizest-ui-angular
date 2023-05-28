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
        await this.kernel.init(this.service);
    }
}