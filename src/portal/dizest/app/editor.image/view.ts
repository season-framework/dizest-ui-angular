import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() dizest: any;
    @Input() editor: any = {};

    public loading: boolean = true;

    public async ngOnInit() {
        await this.service.init();
        this.editor.data = "";
        await this.service.render();
    }

    public imageURI() {
        return this.dizest.api.url('drive', 'download/' + this.editor.path);
    }

    public async download() {
        let url = this.dizest.api.url('drive', 'download/' + this.editor.path);
        window.open(url, '_blank');
    }
}