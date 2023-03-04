import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';
import $ from 'jquery';

export class Component implements OnInit, OnDestroy {

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) { }

    public async ngOnInit() {
        await this.workflow.regist('action.codeflow', this);
    }

    public async ngOnDestroy() {
        this.workflow.unregist('action.codeflow');
    }

    public is_dragging: boolean = false;

    public monacopy: any = {
        value: '',
        language: 'python',
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

    public monacomd: any = {
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

    public async drag(status: boolean, flow: any) {
        this.is_dragging = status;
        await this.service.render();
    }

    public codes() {
        return this.workflow.codeflow.codes;
    }

    public async close() {
        let action = this.workflow.component("action.menu");
        await action.toggle();
    }

    public async closeCode(flow: any) {
        await this.workflow.flow.select();
        await this.workflow.codeflow.close(flow);
    }

    public async init(flow: any, event: any) {
        let { editor } = event;

        let activated = false;

        let monaco_auto_height = (forced: boolean = false) => () => {
            if (activated) return;
            if (!forced)
                if (flow.ctrl.selected)
                    if (!flow.selected())
                        return;

            activated = true;
            const LINE_HEIGHT = 21;
            const el = editor.getDomNode();
            if (!el) return;
            let pre_line = -1;
            for (let i = 0; i < 100; i++) {
                let real_line = $(el).find('.view-lines .view-line').length;
                let ref = real_line + 5;
                if (real_line == pre_line) {
                    ref = real_line + 1;
                }

                let height = ref * LINE_HEIGHT;
                if (height < 105) height = 105;
                el.style.height = height + 'px';
                editor.layout();

                if (real_line == pre_line) {
                    break;
                }

                pre_line = real_line;
            }

            activated = false;
        }

        flow.monaco_auto_height = monaco_auto_height;
        monaco_auto_height(true)();
        editor.onDidChangeModelDecorations(monaco_auto_height());
    }

    public async select(flow: any) {
        if (flow) {
            await this.workflow.flow.select(flow.id());
            if (flow.monaco_auto_height)
                flow.monaco_auto_height();
        }
    }

    public selected(flow: any) {
        return flow.id() == this.workflow.flow.selected;
    }

    public async find(flow: any) {
        if (this.workflow.drawflow)
            await this.workflow.drawflow.find(flow.id());
    }
}
