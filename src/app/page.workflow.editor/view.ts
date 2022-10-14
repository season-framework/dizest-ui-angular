import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    public ID: string;
    constructor(
        public service: Service
    ) {
        this.ID = WizRoute.segment.id;
    }

    public async ngOnInit() {
    }
}