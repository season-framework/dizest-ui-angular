import { OnInit, Input } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import $ from 'jquery';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @ViewChild('scrollelement')
    public scrollElement: ElementRef;

    @Input() app: any;
    @Input() sidebar: any;

    public codeflow: any = {};

    public onEditorScroll: boolean = false;
    public monaco_auto_height_objs: any = [];

    public async monaco_auto_height() {
        for (let i = 0; i < this.monaco_auto_height_objs.length; i++) {
            await this.monaco_auto_height_objs[i]();
        }
    }

    public async ngOnInit() {
        await this.service.init();
        this.workflow = this.app.workflow;
        await this.service.render();

        this.sidebar.getFlow = async () => {
            if (!this.workflow.node.selected) return;
            let flow = this.flow(this.workflow.node.selected);
            return flow;
        }
    }

    public async onSidebarShow() {
        await this.monaco_auto_height();
    }

    public flow(flow_id) {
        if (this.codeflow[flow_id]) return this.codeflow[flow_id].flow;
        this.codeflow[flow_id] = {};
        let flow = this.workflow.spec.flow(flow_id);
        this.codeflow[flow_id].flow = flow;
        this.codeflow[flow_id].target = 'code';
        this.codeflow[flow_id].monaco = this.monacoopt('python');
        this.codeflow[flow_id].show = true;
        return flow;
    }

    public monacoopt(language: string = 'python') {
        let opt = {
            value: '',
            language: language,
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
        return opt;
    }

    public async select(flow_id) {
        this.workflow.node.selected = flow_id;
        await this.workflow.moveToFlow(flow_id);
        await this.app.service.render();
    }

    public async close(flow_id) {
        this.sidebar.items.remove(flow_id);
        this.workflow.node.selected = null;
        await this.app.service.render();
    }

    public async changeTargetCode(flow_id, target) {
        this.codeflow[flow_id].show = false;
        await this.service.render();

        let languageMap: any = { code: 'python', html: 'html', js: 'javascript', css: 'scss', api: 'python' };
        let language = languageMap[target];

        this.codeflow[flow_id].target = target;
        this.codeflow[flow_id].monaco.language = language;
        this.codeflow[flow_id].show = true;

        await this.service.render();
    }

    public async init(event: any, flow_id: string) {
        let { editor } = event;

        let flow = this.flow(flow_id);
        flow.editor = editor;

        let activated = false;

        let documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );

        const el = editor.getDomNode();
        if (el) {
            el.style.maxHeight = (documentHeight - 104) + 'px';
            el.style.minHeight = '105px';
        }

        let monaco_auto_height = async () => {
            if (activated) return;
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

        this.monaco_auto_height_objs.push(monaco_auto_height);
        monaco_auto_height();
        editor.getModel().onDidChangeContent(monaco_auto_height);

        const container = this.scrollElement.nativeElement;

        editor.getDomNode().addEventListener('wheel', function (event) {
            this.onEditorScroll = true;
            const editorScrollTop = editor.getScrollTop();
            const editorScrollHeight = editor.getScrollHeight();
            const editorHeight = editor.getDomNode().offsetHeight;
            const recty = editor.getDomNode().getBoundingClientRect().y;

            if (event.deltaY > 0) {
                if (editorScrollTop + editorHeight >= editorScrollHeight) {
                    container.scrollTop += event.deltaY;
                } else {
                    if (recty > 104) {
                        container.scrollTop += event.deltaY;
                    } else {
                        editor.setScrollTop(editorScrollTop + event.deltaY);
                    }
                }
            } else {
                if (editorScrollTop == 0) {
                    container.scrollTop += event.deltaY;
                } else {
                    if (recty < 104) {
                        container.scrollTop += event.deltaY;
                    } else {
                        editor.setScrollTop(editorScrollTop + event.deltaY);
                    }
                }
            }
            this.onEditorScroll = false;
            event.preventDefault();
        });
    }


}