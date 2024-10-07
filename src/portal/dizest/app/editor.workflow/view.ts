import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Workflow } from '@wiz/libs/portal/dizest/ui/workflow';
import NodeComponentClass from '@wiz/app/portal.dizest.editor.workflow.node';

import Sortable from 'sortablejs';

import SidebarInfoClass from '@wiz/app/portal.dizest.editor.workflow.sidebar.info';
import SidebarAppsClass from '@wiz/app/portal.dizest.editor.workflow.sidebar.apps';
import SidebarCodeClass from '@wiz/app/portal.dizest.editor.workflow.sidebar.code';
import SidebarPipClass from '@wiz/app/portal.dizest.editor.workflow.sidebar.pip';
import SidebarAIClass from '@wiz/app/portal.dizest.editor.workflow.sidebar.ai';

export class Component implements OnInit {
    constructor(public service: Service, public ref: ViewContainerRef) { }

    @Input() dizest: any;
    @Input() workspace: any;
    @Input() editor: any;

    @ViewChild('drawflow')
    public element: ElementRef;

    @ViewChild('sidebar')
    public sidebarElement: ElementRef;

    public workflow: Workflow;
    public loading: boolean = true;
    public error: boolean = false;
    public eventHandler: any;
    public interrupt: boolean = false;
    public sortable: any;

    public async ngOnInit() {
        await this.service.init();
        await this.service.render();

        this.sortable = Sortable.create(this.sidebarElement.nativeElement, {
            draggable: '.tab-views',
            handle: '.draggable-handle'
        });
    }

    public async onEditorInit() {
        let path = this.editor.path;
        let { code, data } = await this.dizest.api.call(`workflow`, `init`, { path: path });
        if (code != 200) {
            this.error = true;
            await this.service.render();
            return;
        }

        this.editor.actions = [
            { id: 'info', icon: 'fa-solid fa-book', name: 'Workflow Info' },
            { id: 'apps', icon: 'fa-solid fa-cubes', name: 'Apps' },
            { id: 'code', icon: 'fa-solid fa-code', name: 'Code' },
        ];
        if (this.dizest.config.use_ai == 'use')
            this.editor.actions.push({ id: 'ai', icon: 'fa-solid fa-wand-magic-sparkles', name: 'AI Assistant' });
        this.editor.actions.push({ id: 'pip', icon: 'fa-brands fa-python', name: 'Packages' });
        this.editor.actions.push({ id: 'save', icon: 'fa-solid fa-floppy-disk', name: 'Save' });
        this.editor.actions.push({ id: 'download', icon: 'fa-solid fa-circle-down', name: 'Download' });

        this.editor.onAction = async (action: any) => {
            if (action.id == 'save') {
                await this.editor.update();
            } else if (action.id == 'download') {
                await this.editor.download();
            } else {
                action.view = await this.sidebar.open(action.id);
                action.isActive = () => {
                    if (action.view)
                        return action.view.isOpen;
                    return false;
                }
                await this.service.render();
            }
        }

        this.editor.alta = async () => {
            if (this.dizest.config.use_ai != 'use') return;
            if (this.sidebar.get('ai').isOpen) return;
            this.sidebar.open('ai');
        };

        this.editor.download = async () => {
            let url = this.dizest.api.url('drive', 'download/' + this.editor.path);
            window.open(url, '_blank');
        }

        this.editor.update = async () => {
            this.editor.loading = true;
            await this.service.render();
            await this.workflow.update();
            await this.service.render(500);
            this.editor.loading = false;
            await this.service.render();
        }

        this.editor.run = async () => {
            let node = this.workflow.node.get(this.workflow.node.selected);
            if (!node) return;
            if (!node.run) return;
            await node.run();
        }

        this.editor.esc = async () => {
            this.workflow.node.selected = null;
            await this.service.render();
        }

        this.editor.closeWindow = async () => {
            if (this.workflow.node.selected) {
                let node_selected_id = this.workflow.node.selected;
                if (this.sidebar.get('code').isOpen) {
                    let location = this.sidebar.get('code').items.indexOf(node_selected_id);
                    this.sidebar.get('code').items.remove(node_selected_id);

                    if (this.sidebar.get('code').items[location])
                        this.workflow.node.selected = this.sidebar.get('code').items[location]
                    else if (this.sidebar.get('code').items[location - 1])
                        this.workflow.node.selected = this.sidebar.get('code').items[location - 1]
                    else
                        this.workflow.node.selected = null;
                }

                await this.service.render();
                return;
            }

            let opened = [];
            for (let key in this.sidebar.items) {
                if (this.sidebar.items[key].isOpen) {
                    opened.push(this.sidebar.items[key].id);
                }
            }

            if (opened.length > 0) {
                if (opened[0] == 'apps') {
                    this.workflow.selectedApp = null;
                    await this.service.render();
                }
                await this.sidebar.items[opened[0]].close();
                return;
            }

            await this.editor.close();
        }

        // workflow changed event handler
        this.eventHandler = async (eventname: string, data: any) => {
            if (this.interrupt) return;
            if (eventname == "workflow.status") {
                const { value } = data;
                this.workflow.status = value;
                await this.service.render();
            } else if (eventname == 'flow.api') {
                const { value } = data;
                let Style = {
                    base: [
                        "color: #fff",
                        "background-color: #444",
                        "padding: 2px 4px",
                        "border-radius: 2px"
                    ],
                    warning: [
                        "color: #eee",
                        "background-color: red"
                    ],
                    success: [
                        "background-color: green"
                    ]
                }

                let logdisplay = function () {
                    let style = Style.base.join(';') + ';';
                    style += Style.base.join(';');
                    console.log(`%cdizest.api`, style, ...arguments);
                }
                logdisplay(value);
            } else if (data.flow_id) {
                let node: any = this.workflow.node.get(data.flow_id);
                if (node && node.eventHandler)
                    await node.eventHandler(eventname, data.value);
            }
        }

        let base: any = this.editor.path.split("/");
        base.pop();
        base = base.join("/");
        this.drive.base = base;

        this.workflow = new Workflow(this, {
            data: data,
            nodeComponentClass: NodeComponentClass,
            onError: async () => {
                let socket: any = this.editor.workspace.socket;
                let path = this.editor.path;
                await this.service.render(this.workspace.app.editorLoading = true);
                let { code, data } = await this.dizest.api.call(`workflow`, `init`, { path: path });
                if (code != 200) {
                    this.error = true;
                    await this.service.render();
                    return;
                }

                socket.emit("leave", this.workflow.config.data.kernel_id);
                this.workflow.config.data.kernel_id = data.kernel_id
                socket.emit("join", this.workflow.config.data.kernel_id);
                await this.workflow.reload();
                await this.service.render(this.workspace.app.editorLoading = false);
            }
        });

        await this.workflow.render();
        await this.workflow.reload();
    }

    public async onEditorShow() {
        let socket: any = this.editor.workspace.socket;
        let data = this.workflow.data();
        await this.workflow.reload();
        if (this.sidebar.get('code').isOpen) {
            if (this.sidebar.get('code').ref) {
                if (this.sidebar.get('code').ref.instance.monaco_auto_height) {
                    await this.sidebar.get('code').ref.instance.monaco_auto_height();
                }
            }
        }

        socket.emit("join", data.kernel_id);
        this.workspace.bind("*", this.eventHandler);
    }

    public async onEditorHide() {
        let socket: any = this.editor.workspace.socket;
        let data = this.workflow.data();
        socket.emit("leave", data.kernel_id);
        this.workspace.unbind("*", this.eventHandler);
    }

    public async run() {
        this.interrupt = false;
        await this.workflow.api('run');
    }

    public async stop() {
        this.interrupt = true;
        await this.workflow.api('stop');
        await this.workflow.reload();
    }

    public async exit() {
        await this.workflow.api(`kernel/stop`);
        await this.dizest.kernels();
        await this.editor.close();
    }

    public async zoom_out() {
        await this.workflow.drawflow.zoom_out();
        await this.service.render();
    }

    public async zoom_in() {
        await this.workflow.drawflow.zoom_in();
        await this.service.render();
    }

    public async zoom_reset() {
        await this.workflow.drawflow.zoom_reset();
        await this.service.render();
    }

    public sidebar = (() => {
        let obj: any = {};

        obj.items = {
            apps: { id: 'apps', cls: SidebarAppsClass },
            info: { id: 'info', cls: SidebarInfoClass },
            code: { id: 'code', cls: SidebarCodeClass },
            pip: { id: 'pip', cls: SidebarPipClass },
            ai: { id: 'ai', cls: SidebarAIClass },
        };

        obj.get = (name: string) => {
            return obj.items[name];
        }

        obj.open = async (name: string) => {
            if (!obj.items[name]) return;
            let opts = obj.items[name];
            if (!opts.ref) {
                const ref: any = this.ref.createComponent<NodeComponent>(opts.cls);
                ref.instance.app = this;
                ref.instance.sidebar = opts;
                opts.ref = ref;
                opts.close = async () => await obj.close(name);
            }

            if (opts.isOpen) {
                await opts.close();
                return opts;
            }

            let element = opts.ref.location.nativeElement;
            element.classList.add("tab-views");
            element.classList.add("h-full");
            element.classList.add("border-l");
            element.classList.add("border-gray-300");
            this.sidebarElement.nativeElement.insertBefore(element, this.sidebarElement.nativeElement.firstChild);
            opts.isOpen = true;
            await this.service.render();
            if (opts.ref.instance.onSidebarShow)
                await opts.ref.instance.onSidebarShow();
            return opts;
        }

        obj.close = async (name: string) => {
            if (!obj.items[name]) return;
            let opts = obj.items[name];
            if (!opts.ref) return;

            let element = opts.ref.location.nativeElement;
            this.sidebarElement.nativeElement.removeChild(element);
            opts.isOpen = false;
            await this.service.render();
            if (opts.ref.instance.onSidebarHide)
                await opts.ref.instance.onSidebarHide();
        }

        return obj;
    })();

    public async dragover($event: any) {
        $event.stopPropagation();
        $event.preventDefault();
    }

    public async drop($event: any) {
        $event.preventDefault();
        let { clientX, clientY } = $event;

        let x = clientX;
        let y = clientY;

        let app_id = $event.dataTransfer.getData("app-id");
        if (!app_id) return;

        let flow = await this.workflow.spec.createFlow(app_id, { x: x, y: y });
        await this.workflow.node.create(flow.id(), true);
        await this.service.render();
    }

    public async changeExecutable(executable_path) {
        this.service.render(this.workspace.app.editorLoading = true);

        let socket: any = this.editor.workspace.socket;
        socket.emit("leave", this.workflow.data().kernel_id);

        await this.workflow.api(`kernel/stop`);
        await this.dizest.kernels();
        let path = this.editor.path;
        let { code, data } = await this.dizest.api.call(`workflow`, `init`, { path: path, executable_path: executable_path });
        if (code == 200) {
            this.workflow.config.data.kernel_id = data.kernel_id;
            this.workflow.config.data.executable = data.executable;
            await this.workflow.reload();
            socket.emit("join", this.workflow.data().kernel_id);
        }
        this.service.render(this.workspace.app.editorLoading = false);
    }

    public drive: any = (() => {
        let obj = {};

        obj.isShow = false;
        obj.target = null;
        obj.callback = null;

        obj.open = async () => {
            return true;
        }

        obj.show = async (prevalue) => {
            obj.isShow = true;
            obj.target = null;
            if (prevalue)
                obj.target = { id: prevalue };

            await this.service.render();

            let fn = () => new Promise((resolve) => {
                obj.callback = resolve;
            });
            return await fn();
        }

        obj.selected = async (node, ext) => {
            obj.target = node;
            await this.service.render();
        }

        obj.focused = (node) => {
            if (obj.target)
                if (node.id == obj.target.id)
                    return 'bg-indigo-100 text-indigo-500';
            return '';
        }

        obj.close = async () => {
            obj.isShow = false;
            obj.target = null;
            await this.service.render();
        }

        obj.select = async () => {
            let path = obj.target.id;
            if (obj.callback)
                await obj.callback(path);
            await obj.close();
        }

        return obj;
    })();
}