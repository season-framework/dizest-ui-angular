import { OnInit, OnDestroy, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import $ from 'jquery';

export class Component implements OnInit, OnDestroy {
    @Input() workflow: any;

    public monaco(lang: string) {
        return {
            value: '',
            language: lang,
            theme: "vs",
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: true,
            wordWrap: false,
            roundedSelection: false,
            glyphMargin: false,
            minimap: {
                enabled: false
            }
        }
    }

    public monacopug: any = this.monaco("pug");
    public monacojs: any = this.monaco("javascript");
    public monacoscss: any = this.monaco("scss");
    public monacopy: any = this.monaco("python");

    public data: any;
    public url: any;

    public iframe: boolean = false;
    public iframe_loaded: boolean = false;
    public maximized: boolean = false;
    public edit: boolean = false;
    public enabled: any = { body: true, api: true };

    constructor(public service: Service) { }

    public async ngOnInit() {
        if (!this.workflow.flow.selected) return;
        this.data = this.workflow.flow.selected.app().spec();
        this.url = this.workflow.request.uimode.render(this.workflow.flow.selected.id());
        this.workflow.uimodeRender = async () => {
            await this.render();
        };
        
        await this.service.render();
        await this.render();
    }

    public async ngOnDestroy() {
        this.workflow.uimodeRender = null;
        await this.service.render();
    }

    public async render() {
        this.iframe_loaded = false;
        this.iframe = false;
        await this.service.render();

        this.iframe = true;
        await this.service.render();

        $('#uimode-iframe').attr('src', this.url);
        $('#uimode-iframe').on('load', async () => {
            this.iframe_loaded = true;
            await this.service.render();
        });
    }

    public async maximize(maximized: boolean) {
        if (maximized) {
            this.maximized = true;
        } else {
            this.maximized = false;
        }
        await this.service.render();
    }

    public async code(edit: boolean) {
        if (edit) {
            this.edit = true;
            this.enabled = { body: true, api: true };
        } else {
            this.edit = false;
        }
        await this.service.render();
    }

    public async toggle(ctype: string) {
        this.enabled[ctype] = !this.enabled[ctype];
        await this.service.render();
    }

}