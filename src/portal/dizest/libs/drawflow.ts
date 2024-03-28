import DrawflowLib from './external/drawflow';
import $ from 'jquery';

export class Node {
    constructor(public drawflow: any) { }

    public refs: any = {};

    public async create(flow: any, isdrop: boolean = false) {
        const drawflow = this.drawflow;
        const scope = drawflow.scope;
        if (!drawflow.lib) return false;
        if (drawflow.lib.editor_mode === 'fixed') return false;

        // // do not add if app not exists
        let app = flow.app();
        if (!app) return false;

        // load data
        let { pos_x, pos_y } = flow.spec();

        // set position
        let pos = new DOMMatrixReadOnly(drawflow.lib.precanvas.style.transform);
        if (!pos_x) {
            pos_x = -pos.m41 + $(scope.element.nativeElement).width() / 2 - 130;
        } else if (isdrop) {
            pos_x = pos_x * (drawflow.lib.precanvas.clientWidth / (drawflow.lib.precanvas.clientWidth * drawflow.lib.zoom)) - (drawflow.lib.precanvas.getBoundingClientRect().x * (drawflow.lib.precanvas.clientWidth / (drawflow.lib.precanvas.clientWidth * drawflow.lib.zoom)));
        }

        if (!pos_y) {
            pos_y = -pos.m42 + $(scope.element.nativeElement).height() / 3;
        } else if (isdrop) {
            pos_y = pos_y * (drawflow.lib.precanvas.clientHeight / (drawflow.lib.precanvas.clientHeight * drawflow.lib.zoom)) - (drawflow.lib.precanvas.getBoundingClientRect().y * (drawflow.lib.precanvas.clientHeight / (drawflow.lib.precanvas.clientHeight * drawflow.lib.zoom)));
        }

        // input & output
        let inputs = [];
        for (let i = 0; i < app.inputs().length; i++) {
            let value = app.inputs()[i];
            if (value.type == 'output') {
                inputs.push("input-" + value.name);
            }
        }

        let outputs = [];
        for (let i = 0; i < app.outputs().length; i++) {
            let value = app.outputs()[i];
            outputs.push("output-" + value.name);
        }

        // create node
        const ref = scope.viewContainerRef.createComponent<NodeComponent>(scope.DrawflowNodeComponent);
        ref.instance.scope = scope;
        ref.instance.flow = flow;
        ref.instance.app = app;

        drawflow.lib.addNode(
            flow.id(), flow.title(), inputs, outputs, pos_x, pos_y,
            "flow-" + flow.id() + ' ' + flow.id() + ' ' + app.id() + ' ' + app.mode(),
            flow.data(),
            ref.location.nativeElement
        );

        this.refs[flow.id()] = ref;

        await scope.service.render();
        return true;
    }

    public async delete(flow: any) {
        if (this.refs[flow.id()]) {
            this.refs[flow.id()].destroy();
            delete this.refs[flow.id()];
        }

        let flow_id = flow.id();
        let node_id = 'node-' + flow_id;
        this.drawflow.lib.removeNodeId(node_id);
    }

    public async scroll(flow_id: string) {
        if (!this.refs[flow_id]) return;
        let element = this.refs[flow_id].instance.debugElement;
        if (!element) return;
        await this.drawflow.scope.service.render(500);
        element = element.nativeElement;
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }
}

export class Drawflow {
    public scope: any = null;

    public events: any = {};
    public lib: any = null;
    public drive: any = null;
    public position: any = { x: 0, y: 0 };
    public init_pos: any = async () => null;

    constructor(scope: any) {
        this.scope = scope;
        this.node = new Node(this);
        this.events = {};
        this.lib = null;
        this.position = { x: 0, y: 0 };
        this.init_pos = async () => null;
    }

    public data() {
        return this.lib.drawflow.drawflow.Home.data;
    }

    public async render() {
        this.scope.initialized = false;
        await this.scope.service.render();
        this.scope.initialized = true;
        await this.scope.service.render();

        let element = this.scope.element.nativeElement;
        element.innerHTML = '';
        let position: any = { canvas_x: 0, canvas_y: 0 };
        if (this.lib) {
            position = {
                canvas_x: this.lib.canvas_x,
                canvas_y: this.lib.canvas_y,
                pos_x: this.lib.pos_x,
                pos_y: this.lib.pos_y,
                mouse_x: this.lib.mouse_x,
                mouse_y: this.lib.mouse_y,
                zoom: this.lib.zoom,
                zoom_last_value: this.lib.zoom_last_value
            };

            this.lib.removeListener();
            this.lib.inactive = true;
            this.lib = null;
        }

        this.lib = new DrawflowLib(element);
        this.position = { x: Math.round(position.canvas_x), y: Math.round(position.canvas_y) };

        this.init_pos = async () => {
            this.position.x = 0;
            this.position.y = 0;
            this.lib.move({ canvas_x: 0, canvas_y: 0 });
            await this.scope.service.render();
        }

        this.lib.on('translate', async (pos) => {
            let { x, y } = pos;
            this.position.x = Math.round(x);
            this.position.y = Math.round(y);
            await this.scope.service.render();
        });

        this.lib.reroute = false;
        this.lib.reroute_fix_curvature = true;
        this.lib.force_first_input = false;
        this.lib.start();

        let workflow = this.scope.workflow;
        let flows = workflow.flow.list();
        for (let flow_id of flows) {
            let flow = workflow.flow.get(flow_id);
            await this.node.create(flow);
        }

        for (let flow_id of flows) {
            let flow = workflow.flow.get(flow_id);
            if (!flow) continue;

            let id_input = flow.id();
            for (let input_class in flow.inputs()) {
                let conn = flow.inputs()[input_class].connections;
                for (let i = 0; i < conn.length; i++) {
                    let id_output = conn[i].node;
                    let output_class = conn[i].input;
                    try {
                        this.lib.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
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
                        this.lib.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                    } catch (e) {
                    }
                }
            }
        }

        if (position)
            this.lib.move(position);

        this.lib.on("connectionCreated", val => this.call('connection.created', [val.output_id, val.input_id]));
        this.lib.on("connectionCancel", val => this.call('connection.cancel', [val.output_id, val.input_id]));
        this.lib.on("connectionRemoved", val => this.call('connection.removed', [val.output_id, val.input_id]));

        this.lib.on("nodeMoved", id => this.call('node.moved', [id]));
        this.lib.on("nodeSelected", id => this.call('node.selected', id));
        this.lib.on("nodeUnselected", id => this.call('node.unselected', id));
    }

    public async find(flow_id: string) {
        if (!this.lib) return;
        let element = this.scope.element.nativeElement;
        let node = $('#node-' + flow_id);
        if (node.length == 0)
            return false;
        let x = node.position().left;
        let y = node.position().top;
        let zoom = this.lib.zoom;

        let w = $(element).width() * zoom;
        let h = $(element).height() * zoom;

        let tx = Math.round(-x + (w / 2.4));
        let ty = Math.round(-y + (h / 4));

        this.lib.move({ canvas_x: tx, canvas_y: ty });
        this.position.x = tx;
        this.position.y = ty;
        await this.scope.service.render();
    }

    public unbind(namespace: string, fn: any) {
        if (!this.events[namespace]) this.events[namespace] = [];
        this.events[namespace].remove(fn);
    }

    public on(namespace: string, fn: any) {
        if (!this.events[namespace]) this.events[namespace] = [];
        this.events[namespace].push(fn);
    }

    public async call(namespace: string, data: any) {
        if (!this.events[namespace]) return;
        for (let fn of this.events[namespace]) {
            try {
                fn(data);
            } catch (e) {
            }
        }
    }
}

export default Drawflow;