import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    public loading: boolean = false;
    
    constructor(
        public service: Service,
        public ref: ChangeDetectorRef,
        public router: Router
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
    }

}