import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Kernel } from '@wiz/libs/portal/dizest/kernel';

export class Component implements OnInit {
    public isOpen: boolean = false;
    public spec: string;
    public selected: any = null;

    constructor(
        public service: Service,
        public kernel: Kernel
    ) { }

    public async ngOnInit() {
        await this.service.init();
        if (this.kernel.list.length > 0)
            await this.select(this.kernel.list[0]);
    }

    public async toggle(stat: any = null) {
        if (stat !== null) {
            this.isOpen = stat;
        } else {
            this.isOpen = !this.isOpen;
        }
        await this.service.render();
    }

    public async select(spec: any) {
        this.spec = spec.name;
        this.selected = spec;
        await this.toggle(false);
    }

    public async start() {
        await this.kernel.server.start(this.selected);
    }

}