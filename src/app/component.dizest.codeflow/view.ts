import { OnInit, OnDestroy, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import showdown from 'showdown';
import $ from 'jquery';

export class Component implements OnInit, OnDestroy {
    @Input() workflow: any;

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

    public status: any = {
        drag: false
    }

    constructor(public service: Service) { }

    public async ngOnInit() {
        this.workflow.codeflow = this.codeflow;
        await this.codeflow.build();
    }

    public async ngOnDestroy() {
        this.workflow.codeflow = null;
    }

    public showdown(text: string) {
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
    }

    public isDescriptionHidden: boolean = false;

    public async toggleDescription() {
        this.isDescriptionHidden = !this.isDescriptionHidden
        await this.service.render();
    }

    public async create(index: number = -1) {
        let app_id = this.workflow.app.create();
        let flow = this.workflow.flow.create(app_id, {}, index);
        await flow.select();
    }

    public async drag(status: boolean, item: any) {
        this.status.drag = status;
        await this.service.render();

        if (status == false) {
            await item.select();
            await this.workflow.position.codeflow(item.id);
        }
    }

    public app() {
        return this.workflow.flow.selected.app().spec();
    }

    public codeflow: any = ((scope: any, obj: any = {}) => {

        obj.data = [];

        obj.item = (id: string, order: number) => {
            let item: any = {
                id: id,
                order: order,
                editable: false
            };

            item.desc = {};
            item.desc.toggle = async () => {
                item.editable = !item.editable;
                await scope.service.render();
            }
            item.desc.isEditable = () => {
                return item.selected() && item.editable;
            }

            item.selected = () => {
                if (!scope.workflow.flow.selected) return false;
                if (scope.workflow.flow.selected.id() == item.id) return true;
                return false;
            }

            item.select = async () => {
                await scope.workflow.flow.select(item.id);
                await scope.workflow.position.drawflow(item.id);
            }

            item.delete = async () => {
                await scope.workflow.flow.delete(item.id);
            }

            item.flow = () => {
                try {
                    return scope.workflow.flow(item.id).spec();
                } catch (e) {
                    return {};
                }
            }

            item.app = () => {
                try {
                    return scope.workflow.flow(item.id).app().spec();
                } catch (e) {
                    return {};
                }
            }

            item.toggle = async () => {
                await scope.workflow.flow(item.id).toggle();
                await item.select();
            }

            item.up = async () => {
                obj.data.up(item);
                await scope.service.render();
            }

            item.down = async () => {
                obj.data.down(item);
                await scope.service.render();
            }

            return item;
        }

        obj.build = async () => {
            let res: any = [];
            let spec = scope.workflow.spec();
            for (let flow_id in spec.flow) {
                let order = spec.flow[flow_id].order;
                if (!order) order = new Date().getTime();
                let item = obj.item(flow_id, order);
                res.push(item);
            }
            res.sort((a, b) => a.order - b.order);
            obj.data = res;
            await scope.service.render();
        }

        obj.delete = (flow: any) => {
            let flow_id = flow.id();
            let removeItemIndex: number = -1;
            for (let i = 0; i < obj.data.length; i++) {
                if (obj.data[i].id == flow_id) {
                    removeItemIndex = i;
                    break;
                }
            }
            if (removeItemIndex < 0) return;

            obj.data.splice(removeItemIndex, 1);
        }

        obj.add = (flow: any, position: number = -1) => {
            let flow_id = flow.id();
            let order = new Date().getTime();
            let item = obj.item(flow_id, order);
            if (position < 0)
                obj.data.push(item);
            else
                obj.data.splice(position + 1, 0, item);
        }

        obj.first = () => {
            if (obj.data[0])
                return obj.data[0].id;
            return null;
        }

        obj.next = (flow_id: string) => {
            let idx: number = -2;
            for (let i = 0; i < obj.data.length; i++) {
                if (obj.data[i].id == flow_id) {
                    idx = i;
                    break;
                }
            }
            if (obj.data[idx + 1])
                return obj.data[idx + 1].id;
            return null;
        }

        obj.prev = (flow_id: string) => {
            let idx: number = -2;
            for (let i = 0; i < obj.data.length; i++) {
                if (obj.data[i].id == flow_id) {
                    idx = i;
                    break;
                }
            }
            if (obj.data[idx - 1])
                return obj.data[idx - 1].id;
            return null;
        }

        return obj;
    })(this);
}