import { OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import showdown from 'showdown';
import $ from 'jquery';

export class Component implements OnInit {
    @Input() item: any = {};
    @Input() full: boolean = false;
    @Input() actions: boolean = true;
    @Input() download: boolean = true;
    @Output() close = new EventEmitter<any>();
    @Output() open = new EventEmitter<any>();
    @Output() delete = new EventEmitter<any>();
    @Output() clone = new EventEmitter<any>();

    public style: any = {};
    public logoStyle: any = { 'border-radius': '24px' };
    public coverStyle: any = {};
    public tab: string = 'viewer';

    public monaco: any = {
        value: '',
        language: 'markdown',
        theme: "vs",
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: true,
        roundedSelection: false,
        glyphMargin: false,
        scrollbar: {
            vertical: "hidden",
            handleMouseWheel: false,
        },
        minimap: {
            enabled: false
        }
    }

    constructor(public service: Service) {
    }

    public async ngOnInit() {
        if (this.item.featured && this.item.featured.length > 0)
            this.coverStyle['background-image'] = this.item.featured;
        if (this.item.logo && this.item.logo.length > 0)
            this.logoStyle['background-image'] = this.item.logo;

        this.style.logo = { 'background-image': 'url(' + this.item.logo + ')' };

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

    public async viewInfo() {
        this.tab = 'viewer';
        await this.service.render();
    }

    public async editInfo() {
        this.tab = 'editor';
        await this.service.render();
    }

    public async init(event: any) {
        let { editor } = event;

        let monaco_auto_height = async () => {
            const LINE_HEIGHT = 21;
            const el = editor.getDomNode();
            if (!el) return;
            let ui_line_counter = $(el).find('.margin-view-overlays .line-numbers').length;
            let counter = editor.getModel().getLineCount();
            let real_line = $(el).find('.view-lines .view-line').length;
            let height = real_line * LINE_HEIGHT;
            if (height < 105) height = 105;

            el.style.height = height + 'px';
            editor.layout();
            let resetcounter = 0;
            while (ui_line_counter != counter) {
                if (resetcounter > 20) break;
                ui_line_counter = $(el).find('.margin-view-overlays .line-numbers').length;
                counter = editor.getModel().getLineCount();
                real_line = $(el).find('.view-lines .view-line').length;
                real_line = real_line + 5;
                height = real_line * LINE_HEIGHT;

                if (height < 105) height = 105;
                el.style.height = height + 'px';
                editor.layout();
                resetcounter++;
            }
        }

        await monaco_auto_height();
        editor.onDidChangeModelDecorations(monaco_auto_height);
    }

    public upload: any = ((obj: any = {}) => {
        obj.logo = async () => {
            try {
                this.item.logo = await this.service.file.read({ type: 'image', accept: 'image/*', width: 40, quality: 1 });
                this.style.logo = { 'background-image': 'url(' + this.item.logo + ')' };
                await this.service.render();
            } catch (e) {
                toastr.error(e);
            }
        }

        obj.featured = async () => {
            try {
                this.item.featured = await this.service.file.read({ type: 'image', accept: 'image/*', width: 512, quality: 1 });
                await this.service.render();
            } catch (e) {
                toastr.error(e);
            }
        }
        return obj;
    })();

    public clear: any = ((obj: any = {}) => {
        obj.logo = async () => {
            this.item.logo = '';
            this.style.logo = {};
            await this.service.render();
        }

        obj.featured = async () => {
            this.item.featured = '';
            await this.service.render();
        }

        return obj;
    })();

    public async updateInfo() {
        let item = this.item;
        const { code, data } = await wiz.call("update", item);
        await this.viewInfo();
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
        let { code, data } = await wiz.call("get", { workflow_id });
        if (code != 200) return;
        await this.service.file.download(data, data.title + ".dwp");
    }
}