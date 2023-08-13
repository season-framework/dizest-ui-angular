import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

import showdown from 'showdown';
import $ from 'jquery';

export class Component implements OnInit {
    @Input() app: any = null;

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        this.initialize = true;
        await this.service.render();
    }

    public initialize: boolean = false;
    public descriptionEditable: boolean = false;

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

}