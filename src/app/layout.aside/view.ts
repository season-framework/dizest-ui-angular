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
        await this.dizest.init(this.service);
        document.title = "DIZEST";
    }
}