import { OnInit, OnDestroy, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

@dependencies({
    KeyboardShortcutsModule: 'ng-keyboard-shortcuts',
    MatTreeModule: '@angular/material/tree'
})
@directives({
    DropDirective: '@wiz/libs/portal/dizest/external/drop.directive'
})
export class Component implements OnInit, OnDestroy {
    @Input() zone: string = 'dizest';
    @Input() workflow_id: any;

    public socket: any;
    public shortcuts: any = [];

    public toggle: any = {
        navigator: true,
        action: null
    };

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.bindSocket();
        await this.bindEvent();
        this.workflow.preventBack();

        this.shortcuts.push({
            key: ["cmd + s", "ctrl + s"],
            preventDefault: true,
            command: async () => {
                let res = await this.workflow.update();
                if (!res) {
                    await this.service.alert.show({ title: 'Error', message: 'An error occurred while saving', action: 'Close', cancel: null });
                    return;
                }
                this.service.toast.success('Saved');

                let uimode = this.workflow.component("action.uimode");
                if (uimode)
                    uimode.select(uimode.selected);
            }
        }, {
            key: ["shift + enter"],
            preventDefault: true,
            command: async () => {
                if (!this.workflow.flow.selected) return;
                let flow = this.workflow.flow.get(this.workflow.flow.selected);
                flow.status('pending');
                await flow.logclear();
                await flow.run();
            }
        }, {
            key: ["alt + w"],
            preventDefault: true,
            command: async () => {
                if (!this.workflow.flow.selected) return;
                let flow = this.workflow.flow.get(this.workflow.flow.selected);
                this.workflow.codeflow.close(flow);
                await this.workflow.flow.select();
            }
        }, {
            key: ["cmd + r", "ctrl + r"],
            preventDefault: true,
            command: async () => {
                if (!this.workflow.flow.selected) return;
                let flow = this.workflow.flow.get(this.workflow.flow.selected);
                flow.status('pending');
                await flow.logclear();
                await flow.run();
            }
        }, {
            key: ["esc"],
            preventDefault: true,
            command: async () => {
                await this.workflow.flow.select();
            }
        });

        for (let i = 0; i < this.shortcuts.length; i++)
            this.shortcuts[i].allowIn = ['TEXTAREA', 'INPUT', 'SELECT'];
    }

    public async ngOnDestroy() {
        this.socket.close();
        this.workflow.removePreventBack();
    }

    public async bindEvent() {
        let actionComponent = this.workflow.component("action.menu");
        actionComponent.on("change", async (action) => {
            this.toggle.action = action;
            await this.service.render();
        });
    }

    public async bindSocket() {
        let cached = {
            wpstatus: 0,
            status: {},
            index: {}
        };

        let socketstatus = true;
        this.socket = wiz.socket();

        this.socket.on("connect", async () => {
            if (!socketstatus) {
                this.workflow.removePreventBack();
                location.reload();
                return;
            }
            this.socket.emit("join", { zone: this.zone, workflow_id: this.workflow_id });
        });

        this.socket.on("disconnect", async () => {
            socketstatus = false;
            await this.service.loading.show();
        });

        this.socket.on("workflow.status", async (message: any) => {
            const { value, timestamp } = message;
            if (cached.wpstatus > timestamp)
                return;
            cached.wpstatus = timestamp;
            this.workflow.status = value;
            this.workflow.socket.call('workflow.status', message);
            await this.service.render();
        });

        this.socket.on("flow.status", async (message: any) => {
            const { flow_id, value, timestamp } = message;
            let flow = this.workflow.flow.get(flow_id);
            if (!flow) return;

            if (cached.status[flow_id])
                if (cached.status[flow_id] > timestamp)
                    return;
            cached.status[flow_id] = timestamp;

            flow.status(value);
            this.workflow.socket.call('flow.status', message);
        });

        this.socket.on("flow.index", async (message: any) => {
            const { flow_id, value, timestamp } = message;
            let flow = this.workflow.flow.get(flow_id);
            if (!flow) return;

            if (cached.index[flow_id])
                if (cached.index[flow_id] > timestamp)
                    return;
            cached.index[flow_id] = timestamp;

            flow.index(value);
            this.workflow.socket.call('flow.index', message);
        });

        this.socket.on("log.append", async (message: any) => {
            const { flow_id, value } = message;
            let flow = this.workflow.flow.get(flow_id);
            flow.log(value);
            this.workflow.socket.call('log.append', message);
        });

        this.socket.on("log.clear", async (message: any) => {
            const { flow_id } = message;
            let flow = this.workflow.flow.get(flow_id);
            await flow.logclear();
            this.workflow.socket.call('log.clear', message);
        });

        this.socket.on("flow.api", async (message: any) => {
            const { value } = message;
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
        });

    }

    public async toggleNavigator() {
        this.toggle.navigator = !this.toggle.navigator;
        await this.service.render();
    }
}