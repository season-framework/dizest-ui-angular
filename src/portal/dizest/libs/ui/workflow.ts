import Drawflow from '../external/drawflow';
import Node from './workflow/node';
import Spec from './workflow/spec';
import $ from 'jquery';

export class Workflow {
    constructor(public app: any, public config: any = {}) {
        let defaultConfig: any = {
            data: {},
            wrapperElement: 'element',
            nodeComponentClass: null
        };

        for (let key in defaultConfig)
            if (!config[key])
                config[key] = defaultConfig[key];

        this.node = new Node(this);
        this.spec = new Spec(this.config.data);
    }

    public status: any;
    public node: Node;
    public spec: Spec;
    public drawflow: any = null;
    public position: any = { x: 0, y: 0 };
    public selectedApp: any;

    public data() {
        return this.config.data;
    }

    public async api(uri: string, params: any = {}) {
        params.kernel_id = this.data().kernel_id;
        let res = await this.app.dizest.api.call('workflow', uri, params);
        if (res.code != 200)
            if (this.config.onError)
                await this.config.onError();
        return res;
    }

    public async update() {
        await this.api("update", { data: JSON.stringify(this.spec.data) });
    }

    public async reload() {
        this.data().executable_name = 'base';
        try {
            if (this.app.dizest.config.executables && this.data().executable) {
                for (let i = 0; i < this.app.dizest.config.executables.length; i++) {
                    if (this.app.dizest.config.executables[i].executable_path == this.data().executable) {
                        this.data().executable_name = this.app.dizest.config.executables[i].name;
                        break;
                    }
                }
            }
        } catch (e) {
        }

        let { code, data } = await this.api("status");
        this.status = data.workflow;

        let flowstatus: any = data.flow;
        for (let flow_id in flowstatus) {
            let node = this.node.get(flow_id);
            if (!node) continue;
            let { index, log, status } = flowstatus[flow_id];
            node.log = log;
            node.status = status;
            node.index = index;
        }

        await this.app.service.render();
    }

    public async render() {
        let element: any = this.app[this.config.wrapperElement].nativeElement;
        let position: any = { canvas_x: 0, canvas_y: 0 };

        if (this.drawflow) {
            position = {
                canvas_x: this.drawflow.canvas_x,
                canvas_y: this.drawflow.canvas_y,
                pos_x: this.drawflow.pos_x,
                pos_y: this.drawflow.pos_y,
                mouse_x: this.drawflow.mouse_x,
                mouse_y: this.drawflow.mouse_y,
                zoom: this.drawflow.zoom,
                zoom_last_value: this.drawflow.zoom_last_value
            };

            this.drawflow.removeListener();
            this.drawflow.inactive = true;
            this.drawflow.precanvas.remove();
            this.drawflow = null;
        }

        this.drawflow = new Drawflow(element);
        this.position = { x: Math.round(position.canvas_x), y: Math.round(position.canvas_y) };

        this.drawflow.on('translate', async (pos) => {
            let { x, y } = pos;
            this.position.x = Math.round(x);
            this.position.y = Math.round(y);
            await this.app.service.render();
        });

        this.drawflow.reroute = false;
        this.drawflow.reroute_fix_curvature = true;
        this.drawflow.force_first_input = false;
        this.drawflow.start();

        let flows = this.spec.flows();
        // create node
        for (let flow_id of flows)
            await this.node.create(flow_id);

        // create link
        for (let flow_id of flows) {
            let flow = this.spec.flow(flow_id);
            if (!flow) continue;

            let id_input = flow.id();
            for (let input_class in flow.inputs()) {
                let conn = flow.inputs()[input_class].connections;
                for (let i = 0; i < conn.length; i++) {
                    let id_output = conn[i].node;
                    let output_class = conn[i].input;
                    try {
                        this.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                    } catch (e) {
                    }
                }
            }

            let id_output = flow.id();
            for (let output_class in flow.outputs()) {
                let conn = flow.outputs()[output_class].connections;
                for (let i = 0; i < conn.length; i++) {
                    id_input = conn[i].node;
                    let input_class = conn[i].output;
                    try {
                        this.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                    } catch (e) {
                    }
                }
            }
        }

        // drawflow sync events
        let changed = async (ids: any = []) => {
            for (let id of ids) {
                if (!id) continue;
                let origin = this.drawflow.drawflow.drawflow.Home.data[id];
                let target = this.spec.flow(id);

                if (!origin) return;
                if (!target) return;

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

                target.set(values);
                await this.app.service.render();
            }
        };

        let selected = async (id: any) => {
            this.node.selected = id;
            await this.app.service.render();
        }

        let unselected = async () => {
            this.node.selected = null;
            await this.app.service.render();
        }

        this.drawflow.on("nodeMoved", id => changed([id]));
        this.drawflow.on("connectionCreated", val => changed([val.output_id, val.input_id]));
        this.drawflow.on("connectionCancel", val => changed([val.output_id, val.input_id]));
        this.drawflow.on("connectionRemoved", val => changed([val.output_id, val.input_id]));
        this.drawflow.on("nodeSelected", id => selected(id));
        this.drawflow.on("nodeUnselected", id => unselected(id));
    }

    public async init_pos() {
        if (!this.drawflow) return;
        this.position.x = 0;
        this.position.y = 0;
        this.drawflow.move({ canvas_x: 0, canvas_y: 0 });
        await this.app.service.render();
    }

    public async moveToFlow(flow_id) {
        let element: any = this.app[this.config.wrapperElement].nativeElement;
        let node = $('#node-' + flow_id);
        if (node.length == 0)
            return false;
        let x = node.position().left;
        let y = node.position().top;
        let zoom = this.drawflow.zoom;

        let w = $(element).width() * zoom;
        let h = $(element).height() * zoom;

        let tx = Math.round(-x + (w / 2.4));
        let ty = Math.round(-y + (h / 4));

        this.drawflow.move({ canvas_x: tx, canvas_y: ty });
        this.position.x = tx;
        this.position.y = ty;
        await this.app.service.render();
    }
}

export default Workflow;