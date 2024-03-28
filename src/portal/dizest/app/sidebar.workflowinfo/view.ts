import { OnInit, OnDestroy } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import showdown from 'showdown';
import $ from 'jquery';

export class Component implements OnInit, OnDestroy {
    @Input() sidebar: any = null;

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        this.workflow = this.sidebar.selected.workflow;
        this.data = this.workflow.data;
        this.style.logo = { 'background-image': 'url(' + this.data.logo + ')' };
        this.initialize = true;
        await this.service.render();
    }

    public async ngOnDestroy() {
    }

    public initialize: boolean = false;
    public descriptionEditable: boolean = false;
    public data: any = {};
    public style: any = {};

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

    public async toggleEditable() {
        this.descriptionEditable = !this.descriptionEditable;
        await this.service.render();
    }

    public showdown(text) {
        let converter = new showdown.Converter();
        return converter.makeHtml(text);
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

    public async download(data: any) {
        await this.service.file.download(data, data.title + ".dwp");
    }

    public upload: any = ((obj: any = {}) => {
        obj.logo = async () => {
            try {
                this.data.logo = await this.service.file.read({ type: 'image', accept: 'image/*', width: 40, quality: 1 });
                this.style.logo = { 'background-image': 'url(' + this.data.logo + ')' };
                await this.service.render();
            } catch (e) {
                toastr.error(e);
            }
        }

        obj.featured = async () => {
            try {
                this.data.featured = await this.service.file.read({ type: 'image', accept: 'image/*', width: 512, quality: 1 });
                await this.service.render();
            } catch (e) {
                toastr.error(e);
            }
        }
        return obj;
    })();

    public clear: any = ((obj: any = {}) => {
        obj.logo = async () => {
            this.data.logo = '';
            this.style.logo = {};
            await this.service.render();
        }

        obj.featured = async () => {
            this.data.featured = '';
            await this.service.render();
        }

        return obj;
    })();

    public async close() {
        await this.sidebar.close();
    }
}