import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import showdown from 'showdown';
import $ from 'jquery';
import toastr from 'toastr';

export class Component implements OnInit {
    @Input() workflow: any;

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

    public initialize: boolean = false;
    public descriptionEditable: boolean = false;
    public data: any;
    public style: any = {};

    constructor(public service: Service) { }

    public async ngOnInit() {
        if (!this.workflow.flow.selected) return;
        this.data = this.workflow.flow.selected.app().spec();
        this.style.logo = { 'background-image': 'url(' + this.data.logo + ')' };
        this.initialize = true;
        await this.service.render();
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
            const el = editor._domElement;
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

        // TODO: Update Shortcut
    }

    public upload: any = ((obj: any = {}) => {
        obj.logo = async () => {
            try {
                this.data.logo = await this.service.file.upload({ type: 'image', accept: 'image/*', width: 40, quality: 1 });
                this.style.logo = { 'background-image': 'url(' + this.data.logo + ')' };
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
        return obj;
    })();

}