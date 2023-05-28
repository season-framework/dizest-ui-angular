import { OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Kernel } from '@wiz/libs/portal/dizest/kernel';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';
import { DrawflowEditor } from '@wiz/libs/portal/dizest/drawflow';
import DrawflowNodeComponent from '@wiz/app/portal.dizest.we.drawflow.node';

export class Component implements OnInit, OnDestroy {
    public initialized: boolean = false;
    public logger: any = null;
    public DrawflowNodeComponent: any = DrawflowNodeComponent;

    @ViewChild('drawflow')
    public element: ElementRef;

    constructor(
        public service: Service,
        public workflow: Workflow,
        public kernel: Kernel,
        public drawflow: DrawflowEditor,
        public viewContainerRef: ViewContainerRef
    ) { }

    public async ngOnInit() {
        await this.workflow.regist('drawflow', this);
        await this.drawflow.init(this);
        await this.workflow.sync(this.drawflow);
        await this.refresh();

        this.workflow.socket.bind('log.append', this.onLogAppend())
    }

    public async ngOnDestroy() {
        this.workflow.unregist('drawflow');
        await this.workflow.unsync();
        this.workflow.socket.unbind('log.append', this.onLogAppend())
    }

    public onLogAppend() {
        let self = this;
        if (!this.logger)
            this.logger = async (message: any) => {
                let { flow_id } = message;
                await self.drawflow.node.scroll(flow_id);
            }
        return this.logger;
    }

    public status() {
        return this.workflow.status;
    }

    public async refresh() {
        await this.drawflow.render();
    }

    public position() {
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

    public async server_stop() {
        let res = await this.service.alert.show({ title: 'Stop Server', message: 'If you shut down the server, all workflows will be terminated.', action: 'Shutdown', cancel: 'Cancel' });
        if (!res) return;
        await this.kernel.server.stop();
    }

    public async stop(action: string = 'Stop') {
        let res = await this.service.alert.show({ title: `${action} Workflow`, message: `If you ${action}, this workflow will be initialized.`, action: action, cancel: 'Cancel' });
        if (!res) return;
        await this.workflow.stop();
    }

    public async run() {
        await this.workflow.run();
    }

    public async update() {
        let res = await this.workflow.update();
        if (!res) {
            await this.service.alert.show({ title: 'Error', message: 'An error occurred while saving', action: 'Close', cancel: null });
            return;
        }
        this.service.toast.success('Saved');
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

    public async reload() {
        let res = await this.service.alert.show({ title: 'Would you like to refresh the site?', message: 'Changes may not be saved.', action: 'Reload', cancel: 'Cancel' });
        if (!res) return;
        this.workflow.removePreventBack();
        location.reload();
    }
}