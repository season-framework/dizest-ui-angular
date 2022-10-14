import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    @Input() workflow: any;

    constructor(public service: Service) { }

    public async ngOnInit() {
    }
}