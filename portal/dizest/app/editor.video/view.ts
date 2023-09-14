import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }
    @Input() tab: any = {};
    public loading: boolean = true;

    public async ngOnInit() {
        await this.service.init();

        this.tab.data = "";

        await this.service.render();
    }

    public async wizOnTabInit() {
        this.loading = true;
        await this.service.render();

        this.loading = false;
        await this.service.render();
    }

    public async wizOnTabHide() {
        this.loading = true;
        await this.service.render();
    }

    public imageURI() {
        return this.tab.dizest.api.url('drive', 'video/' + this.tab.id);
    }

    public async download() {
        let url = this.tab.dizest.api.url('drive', 'download/' + this.tab.id);
        window.open(url, '_blank');
    }
}