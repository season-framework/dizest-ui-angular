import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow('admin', '/');
    }
}