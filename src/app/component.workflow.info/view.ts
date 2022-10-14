import { OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import showdown from 'showdown';

export class Component implements OnInit {
    @Input() item: any = {};
    @Output() close = new EventEmitter<number>();
    @Output() open = new EventEmitter<number>();

    public logoStyle: any = { 'border-radius': '24px' };
    public coverStyle: any = {};

    constructor(public service: Service) {
    }

    public async ngOnInit() {
        if (this.item.featured && this.item.featured.length > 0)
            this.coverStyle['background-image'] = this.item.featured;
        if (this.item.logo && this.item.logo.length > 0)
            this.logoStyle['background-image'] = this.item.logo;

        await this.service.render();
    }

    public showdown(text) {
        let converter = new showdown.Converter();
        return converter.makeHtml(text);
    }

    public closeInfo() {
        this.close.emit(this.item);
    }

    public openInfo() {
        this.open.emit(this.item);
    }

    public async run() {
        let workflow_id = this.item.id;
        await this.service.loading(true);
        await wiz.call('run', { workflow_id });
        await this.service.loading(false);
    }

    public async stop() {
        let workflow_id = this.item.id;
        await this.service.loading(true);
        await wiz.call('stop', { workflow_id });
        await this.service.loading(false);
    }
}