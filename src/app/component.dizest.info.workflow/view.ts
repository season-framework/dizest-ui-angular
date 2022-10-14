import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import showdown from 'showdown';

export class Component implements OnInit {
    @Input() workflow: any;

    public initialize: boolean = false;
    public descriptionEditable: boolean = false;
    public data: any = {};
    public style: any = {};

    constructor(public service: Service) { }

    public async ngOnInit() {
        this.data = this.workflow.spec();
        this.style.logo = { 'background-image': 'url(' + this.data.logo + ')' };
        console.log(this.style);
        this.initialize = true;
        await this.service.render();
    }

    public showdown(text) {
        let converter = new showdown.Converter();
        return converter.makeHtml(text);
    }

}