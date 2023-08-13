import { OnInit, OnDestroy } from '@angular/core';
import { Input } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Drawflow } from '@wiz/libs/portal/dizest/drawflow';
import DrawflowNodeComponent from '@wiz/app/portal.dizest.widget.workflow.node';

export class Component implements OnInit, OnDestroy {
    @Input() tab: any = {};

    @ViewChild('drawflow')
    public element: ElementRef;

    public spec: any;
    public specs: any = [];
    public socket: any;
    public alerts: any = [];
    public isRendered: boolean = false;

    public workflow: any;
    public drawflow: Drawflow;
    public DrawflowNodeComponent: any = DrawflowNodeComponent;

    constructor(
        public service: Service,
        public viewContainerRef: ViewContainerRef
    ) { }

    public async ngOnInit() {
        this.drawflow = new Drawflow(this);
        await this.service.init();
        await this.service.render();
    }

    public async ngOnDestroy() {
        for (let i = 0; i < this.alerts.length; i++) {
            if (this.alerts[i].alive) {
                await this.alerts[i].hide();
            }
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket.close();
        }
    }

    public async wizOnTabInit() {
        this.isRendered = false;
        await this.service.render();

        await this.tab.sidebar.toggle("codeflow", false);

        let alert = await this.tab.alert.info(`initialize workflow: ${this.tab.title}`);
        this.alerts.push(alert);

        this.workflow = await this.tab.dizest.workflow(this.tab.id);
        this.tab.workflow = this.workflow;

        this.spec = (await this.workflow.spec()).name;
        this.specs = await this.tab.dizest.specs();

        await this.workflow.init(this.drawflow);
        await this.initSocket();

        this.isRendered = true;
        await this.service.render();
        await this.refresh();

        if (this.workflow.status == 'stop')
            await this.workflow.start();

        await alert.hide();
        this.alerts.remove(alert);

        if (this.workflow.status == 'stop') {
            alert = await this.tab.alert.error(`initialize failed: ${this.tab.title}`);
            this.alerts.push(alert);
        }

        await this.service.render();
    }

    public async wizOnTabHide() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket.close();
            delete this.socket;
        }

        if (this.workflow) {
            this.workflow.destroy();
            delete this.workflow;
        }

        delete this.tab.workflow;
    }

    public async initSocket() {
        let cached = {
            wpstatus: 0,
            status: {},
            index: {}
        };

        let reconnect = 0;

        this.socket = this.tab.socket();

        let socketEmit = (channel: string, data: any = {}) => {
            data.zone = this.workflow.dizest.zone;
            data.workflow_id = this.workflow.id;
            this.socket.emit(channel, data);
        }

        this.socket.on("connect", async () => {
            if (reconnect > 0) {
                if (this.workflow.status == 'stop')
                    await this.workflow.start();
                await this.service.render();
            }
            socketEmit("join");
        });

        this.socket.on("disconnect", async () => {
            reconnect++;
            this.workflow.status = 'stop';
            await this.service.render();
        });


        this.socket.on("workflow.status", async (message: any) => {
            const { value, timestamp } = message;
            let loadActive: boolean = this.workflow.status + '' !== value;
            if (cached.wpstatus > timestamp) return;
            cached.wpstatus = timestamp;
            this.workflow.status = value;
            if (loadActive) await this.tab.dizest.loadActive();
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
            await this.service.render();
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
            await this.service.render();
        });

        this.socket.on("log.append", async (message: any) => {
            const { flow_id, value } = message;
            let flow = this.workflow.flow.get(flow_id);
            if (!flow) return;
            flow.log(value);
            await this.service.render();
        });

        this.socket.on("log.clear", async (message: any) => {
            const { flow_id } = message;
            let flow = this.workflow.flow.get(flow_id);
            if (!flow) return;
            await flow.logclear();
            await this.service.render();
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

    public async refresh() {
        if (!this.drawflow) return;
        await this.drawflow.render();
    }

    public status() {
        if (!this.workflow) return '';
        return this.workflow.status;
    }

    public position() {
        if (!this.drawflow) return {};
        return {
            x: this.drawflow.position.x,
            y: this.drawflow.position.y
        }
    }

    public async zoom_out() {
        await this.drawflow.lib.zoom_out();
        await this.service.render();
    }

    public async zoom_in() {
        await this.drawflow.lib.zoom_in();
        await this.service.render();
    }

    public async zoom_reset() {
        await this.drawflow.lib.zoom_reset();
        await this.service.render();
    }

    public async init_pos() {
        await this.drawflow.init_pos();
    }

    public async run() {
        await this.workflow.run();
    }

    public async update() {
        let res = await this.workflow.update();
        if (!res) {
            await this.tab.alert.error('An error occurred while saving', 3000);
            return;
        }
        await this.tab.alert.info('update workflow', 1000);
    }

    public async changeSpec(item: any) {
        let alert = await this.tab.alert.warning(`change kernel spec: ${this.tab.title}`);
        this.alerts.push(alert);
        await this.workflow.updateSpec(item.name);
        await this.workflow.kill();
        await this.workflow.start();
        await alert.hide();
        this.spec = (await this.workflow.spec()).name;
        await this.service.render();
    }

    public async stop() {
        let alert = await this.tab.alert.warning(`stop workflow: ${this.tab.title}`);
        this.alerts.push(alert);

        await this.workflow.stop();
        alert.hide();
        this.alerts.remove(alert);
    }

    public async kill(tabClose: boolean = true) {
        await this.workflow.kill();
        if (tabClose)
            await this.tab.close();
    }

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
        await this.workflow.flow.create(app_id, { x: x, y: y, drop: true });
    }
}