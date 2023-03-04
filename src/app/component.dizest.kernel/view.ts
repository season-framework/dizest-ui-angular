import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';

export class Component implements OnInit {
    public isOpen: boolean = false;
    public kernel: string;
    public selected: any = null;

    constructor(
        public service: Service,
        public dizest: Dizest
    ) { }

    public async ngOnInit() {
        await this.service.init();
        if (this.dizest.kernels.length > 0)
            await this.select(this.dizest.kernels[0]);
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
        this.kernel = spec.name;
        this.selected = spec;
        await this.toggle(false);
    }

    public async start() {
        await this.dizest.server.start(this.selected);
    }

}