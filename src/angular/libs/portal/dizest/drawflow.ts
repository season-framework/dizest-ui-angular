import { Injectable } from '@angular/core';
import Node from './drawflow/node';
import Drive from './drawflow/drive';
import Drawflow from './external/drawflow';
import $ from 'jquery';

@Injectable({ providedIn: 'root' })
export class DrawflowEditor {
    public scope: any = null;

    public events: any = {};
    public lib: any = null;
    public drive: any = null;
    public position: any = { x: 0, y: 0 };
    public init_pos: any = async () => null;

    constructor() { }

    public async init(scope: any) {
        this.scope = scope;
        this.node = new Node(this);
        this.drive = new Drive(this);
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

        this.lib = new Drawflow(element);
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