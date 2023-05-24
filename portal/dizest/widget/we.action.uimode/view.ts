import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export class Component implements OnInit, OnDestroy {

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

    public selected: any = null;
    public loading: boolean = false;

    public data: any;
    public url: SafeUrl;

    public maximized: boolean = false;
    public edit: boolean = false;
    public enabled: any = { body: true, api: true };

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest,
        public sanitizer: DomSanitizer
    ) { }

    public async ngOnInit() {
        await this.workflow.regist('action.uimode', this);
    }

    public async ngOnDestroy() {
        this.workflow.unregist('action.uimode');
    }

    public async close() {
        let action = this.workflow.component("action.menu");
        await action.toggle();
    }

    public async select(flow: any) {
        this.selected = null;
        this.loading = true;
        this.url = null;
        await this.service.render();

        this.selected = flow;
        this.data = flow.app().spec();
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(wiz.url(`render/${this.workflow.zone}/${this.workflow.workflow_id}/${this.selected.id()}`));
        await this.service.render();
    }

    public async onLoad() {
        this.loading = false;
        await this.service.render();
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

    public async update() {
        let res = await this.workflow.update();
        if (!res) {
            await this.service.alert.show({ title: 'Error', message: 'An error occurred while saving', action: 'Close', cancel: null });
            return;
        }
        this.service.toast.success('Saved');
        await this.select(this.selected);
    }
}