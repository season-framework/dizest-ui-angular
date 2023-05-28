import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';
import $ from 'jquery';

export class Component implements OnInit, OnDestroy {

    constructor(
        public service: Service,
        public workflow: Workflow
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

        let monaco_auto_height = (forced: boolean = false) => async () => {
            if (activated) return;
            if (!forced)
                if (flow.ctrl.selected)
                    if (!flow.selected())
                        return;

            activated = true;

            const el = editor.getDomNode();
            if (!el) return;

            let getLines = () => {
                return $(el).find('.view-lines .view-line');
            }

            let lineUtil = async (margin: number = 0) => {
                let lines = getLines();
                if (lines.length == 0) return;
                let last_line = lines[lines.length - 1];
                let top = last_line.style.top.replace("px", "") * 1;
                let height = top + last_line.style.height.replace("px", "") * 1;

                for (let i = 0; i < lines.length; i++) {
                    let _top = lines[i].style.top.replace("px", "") * 1;
                    let _height = _top + lines[i].style.height.replace("px", "") * 1;
                    if (_height > height) height = _height;
                }

                height = height + margin;
                if (height < 105) height = 105;
                el.style.height = height + 'px';
                editor.layout();
            }

            let lineEstimate = async () => {
                let pre_line = -1;
                for (let i = 0; i < 100; i++) {
                    await this.service.render();
                    let real_line = getLines().length;
                    if (real_line == pre_line) {
                        await lineUtil();
                        return;
                    }

                    await lineUtil(630);
                    pre_line = real_line;
                }
            }

            let lines = getLines();
            if (lines.length == 0) {
                el.style.height = '105px';
                editor.layout();
            }

            await lineEstimate();
            activated = false;
        }

        flow.monaco_auto_height = monaco_auto_height;
        monaco_auto_height(true)();
        editor.getModel().onDidChangeContent(monaco_auto_height());
    }

    public async select(flow: any) {
        if (flow && !this.selected(flow)) {
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
