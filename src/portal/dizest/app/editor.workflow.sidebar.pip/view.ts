import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() app: any;
    @Input() sidebar: any;

    public async ngOnInit() {
        await this.service.init();
        await this.service.render();
    }

}