import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    @Input() workflow: any;

    public data: any;

    constructor(public service: Service) { }

    public async ngOnInit() {
        if (!this.workflow.flow.selected) return;
        this.data = this.workflow.flow.selected.app().spec();
        await this.service.render();
    }
}