import { Injectable } from '@angular/core';
import Request from './request';
import App from './workflow/app';
import Flow from './workflow/flow';
import Codeflow from './workflow/codeflow';
import Socket from './workflow/socket';

@Injectable({ providedIn: 'root' })
export class Workflow {
    public service: any;
    public zone: any;
    public workflow_id: any;

    public app: App;
    public flow: Flow;
    public codeflow: Codeflow;
    public socket: Socket;
    public drawflow: any = null;

    public data: any = null;
    public registed: any = {};
    public status: string = 'idle';

    constructor() { }

    public async init(service: any, kernel_id: any, namespace: any, workflow_id: string) {
        this.service = service;
        this.data = null;
        this.registed = {};
        this.app = new App(this);
        this.flow = new Flow(this);
        this.codeflow = new Codeflow(this);
        this.socket = new Socket(this);
        this.status = 'idle';

        await this.service.render();
        await this.service.loading.show();

        this.namespace = namespace;
        this.kernel_id = kernel_id;
        this.workflow_id = workflow_id;

        await this.load();
        await this.service.loading.hide();
    }

    public async request(path: string, data: any = {}) {
        let request = new Request();
        let workflow_id = this.workflow_id;
        if (this.kernel_id) data.kernel_id = this.kernel_id;
        data.namespace = this.namespace;
        data.workflow_id = workflow_id;
        return await request.post(path, data);
    }

    public async load() {
        let { code, data } = await this.request('/dizest/workflow/info');
        if (code == 200) {
            this.data = data.data;
            if (!data.status) data.status = 'idle';
            this.status = data.status;
            await this.service.render();
            return;
        }

        await this.service.href("/");
    }

    public async update() {
        let spec = this.spec();
        let { code } = await this.request('/dizest/workflow/update', { data: JSON.stringify(spec) });
        if (code != 200) return false;
        return true;
    }

    public regist(namespace: string, component: any) {
        if (component)
            this.registed[namespace] = component;
        return this.registed[namespace];
    }

    public unregist(namespace: string) {
        delete this.registed[namespace];
    }

    public component(namespace: string) {
        return this.registed[namespace];
    }

    public async stop() {
        let res = await this.request('/dizest/workflow/stop');
        this.status = 'idle';
        for (let flow_id of this.flow.list()) {
            let flow = this.flow.get(flow_id);
            flow.status('idle');
            await flow.logclear();
        }
        return res;
    }

    public async run() {
        let res = await this.update();
        if (!res) {
            await this.ctrl.workflow.service.alert.show({ title: 'Error', message: 'An error occurred while saving', action: 'Close', cancel: null });
            return;
        }
        return await this.request('/dizest/workflow/run');
    }

    public spec() {
        return this.data;
    }

    public async unsync() {
        await this.sync(null);
    }

    public async sync(drawflow: any = null) {
        this.drawflow = drawflow;

        if (!drawflow) {
            return;
        }

        let drawflowChanged = async (ids: any = []) => {
            for (let id of ids) {
                let origin = drawflow.data()[id];
                let target = this.flow.get(id);

                let values: any = {
                    inputs: {},
                    outputs: {}
                };

                for (let key in origin.outputs) {
                    let item = JSON.parse(JSON.stringify(origin.outputs[key]));
                    for (let i = 0; i < item.connections.length; i++)
                        item.connections[i].output = item.connections[i].output.substring(6);
                    values.outputs[key.substring(7)] = item
                }

                for (let key in origin.inputs) {
                    let item = JSON.parse(JSON.stringify(origin.inputs[key]));
                    for (let i = 0; i < item.connections.length; i++)
                        item.connections[i].input = item.connections[i].input.substring(7);
                    values.inputs[key.substring(6)] = item
                }

                values.pos_x = origin.pos_x;
                values.pos_y = origin.pos_y;

                await target.set(values);
            }
        };

        drawflow.on('node.moved', drawflowChanged);
        drawflow.on('connection.created', drawflowChanged);
        drawflow.on('connection.cancel', drawflowChanged);
        drawflow.on('connection.removed', drawflowChanged);

        drawflow.on('node.selected', async (id: any) => {
            await this.flow.select(id);
        });

        drawflow.on('node.unselected', async () => {
            await this.flow.select();
        });
    }

    private _preventBack(e) {
        let confirmationMessage = "\o/";
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }

    public preventBack() {
        window.addEventListener("beforeunload", this._preventBack);
    }

    public removePreventBack() {
        window.removeEventListener("beforeunload", this._preventBack);
    }
}