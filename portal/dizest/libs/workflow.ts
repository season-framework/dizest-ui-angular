import Dizest from './dizest';
import App from './workflow/app';
import Flow from './workflow/flow';
import Codeflow from './workflow/codeflow';

export class Workflow {
    constructor(public dizest: Dizest, public id: any) {
        this.service = dizest.scope.service;
    }

    public service: any;

    public app: App;
    public flow: Flow;
    public codeflow: Codeflow;
    public drawflow: any;

    public data: any = {};
    public status: string = 'stop';

    public async init(drawflow: any) {
        this.status = 'stop';
        let res = await this.load();
        if (!res) return false;

        this.app = new App(this);
        this.flow = new Flow(this);
        this.codeflow = new Codeflow(this);

        await this.initDrawflow(drawflow);

        return true;
    }

    public drawflowEvents: any = {};

    public async initDrawflow(drawflow: any) {
        this.drawflow = drawflow;

        let changed = async (ids: any = []) => {
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

        let selected = async (id: any) => {
            await this.flow.select(id);
        }

        let unselected = async () => {
            await this.flow.select();
        }

        this.drawflowEvents.changed = changed;
        this.drawflowEvents.selected = selected;
        this.drawflowEvents.unselected = unselected;

        if (drawflow) {
            drawflow.on('node.moved', changed);
            drawflow.on('connection.created', changed);
            drawflow.on('connection.cancel', changed);
            drawflow.on('connection.removed', changed);
            drawflow.on('node.selected', selected);
            drawflow.on('node.unselected', unselected);
        }
    }

    public async destroy() {
        let drawflow = this.drawflow;
        let changed = this.drawflowEvents.changed;
        let selected = this.drawflowEvents.selected;
        let unselected = this.drawflowEvents.unselected;

        if (drawflow) {
            drawflow.unbind('node.moved', changed);
            drawflow.unbind('connection.created', changed);
            drawflow.unbind('connection.cancel', changed);
            drawflow.unbind('connection.removed', changed);
            drawflow.unbind('node.selected', selected);
            drawflow.unbind('node.unselected', unselected);
        }
    }

    public async request(action: string, data: any = {}) {
        data.workflow_id = this.id;
        return await this.dizest.api.call("workflow", action, data);
    }

    public async load() {
        let { code, data } = await this.request("load");
        if (code != 200) return false;
        this.data = data.workflow;
        this.status = data.status;
        return true;
    }

    public async check() {
        let { code, data } = await this.request("status");
        if (code != 200) {
            this.status = 'stop';
        } else {
            this.status = data;
        }
        return this.status;
    }

    public async update() {
        let data: any = this.data;
        let { code } = await this.request('update', { data: JSON.stringify(data) });
        if (code != 200) return false;
        return true;
    }

    public async run() {
        let res = await this.update();
        if (res) {
            await this.request('run');
        }
    }

    public async stop() {
        this.status = 'stop';
        let res = await this.request('stop');
        if (res.code == 200) {
            for (let flow_id of this.flow.list()) {
                let flow = this.flow.get(flow_id);
                flow.status('idle');
                await flow.logclear();
            }
            this.status = 'idle';
        }
        return res;
    }

    public async spec() {
        let { code, data } = await this.request("spec");
        if (code == 200)
            return data;
        return {};
    }

    public async updateSpec(spec: string) {
        await this.request("spec/update", { spec: spec });
    }

    public async start() {
        await this.request('start');
        await this.load();
        await this.dizest.loadActive();
        return this.status;
    }

    public async kill() {
        let { code } = await this.request('kill');
        await this.load();
        await this.dizest.loadActive();
        return code == 200;
    }

}

export default Workflow;