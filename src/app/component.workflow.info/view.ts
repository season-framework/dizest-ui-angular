import { OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import showdown from 'showdown';

export class Component implements OnInit {
    @Input() item: any = {};
    @Input() full: boolean = false;
    @Input() actions: boolean = true;
    @Input() download: boolean = true;
    @Output() close = new EventEmitter<any>();
    @Output() open = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() clone = new EventEmitter<any>();

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

    public deleteInfo() {
        this.delete.emit(this.item);
    }

    public cloneInfo() {
        this.clone.emit(this.item);
    }

    public async run() {
        let workflow_id = this.item.id;
        await this.service.loading.show();
        await wiz.call('run', { workflow_id });
        await this.service.loading.hide();
    }

    public async stop() {
        let workflow_id = this.item.id;
        await this.service.loading.show();
        await wiz.call('stop', { workflow_id });
        await this.service.loading.hide();
    }

    public async downloadInfo() {
        let workflow_id = this.item.id;
        let { code, data } = await wiz.call("get", { id: workflow_id });
        if (code != 200) return;
        await this.service.file.download(data, data.title + ".dwp");
    }
}