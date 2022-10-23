import { OnInit, AfterViewInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import Drawflow from '@wiz/libs/dizest/drawflow';
import $ from "jquery";

export class Component implements OnInit, AfterViewInit {
    @Input() workflow: any;

    public initialized: boolean = false;

    constructor(public service: Service) { }

    public async ngOnInit() {
    }

    public async ngAfterViewInit() {
        this.initialized = true;
        await this.service.render();

        await this.drawflow.render();
        this.workflow.drawflow = this.drawflow;
    }

    public drawflow: any = ((obj: any = {}) => {
        obj.drawflow = null;

        obj.position = { x: 0, y: 0 };

        obj.init_pos = () => null;

        obj.data = () => obj.drawflow.drawflow.drawflow.Home.data;

        obj.node = {};

        obj.node.create = async (flow: any, isdrop: boolean = false) => {
            let drawflow = obj.drawflow;
            if (drawflow.editor_mode === 'fixed') return false;

            // do not add if app not exists
            let app = flow.app();
            if (!app) return false;

            // load data
            let { pos_x, pos_y } = flow.spec();

            // set position
            let pos = new DOMMatrixReadOnly(drawflow.precanvas.style.transform);
            if (!pos_x) {
                pos_x = -pos.m41 + $('#drawflow').width() / 2 - 130;
            } else if (isdrop) {
                pos_x = pos_x * (drawflow.precanvas.clientWidth / (drawflow.precanvas.clientWidth * drawflow.zoom)) - (drawflow.precanvas.getBoundingClientRect().x * (drawflow.precanvas.clientWidth / (drawflow.precanvas.clientWidth * drawflow.zoom)));
            }

            if (!pos_y) {
                pos_y = -pos.m42 + $('#drawflow').height() / 3;
            } else if (isdrop) {
                pos_y = pos_y * (drawflow.precanvas.clientHeight / (drawflow.precanvas.clientHeight * drawflow.zoom)) - (drawflow.precanvas.getBoundingClientRect().y * (drawflow.precanvas.clientHeight / (drawflow.precanvas.clientHeight * drawflow.zoom)));
            }

            let templates = {};
            templates['number'] = (value) => `<div class="value-data"><input type="number" class="form-control form-control-sm" placeholder="${value.description}" df-${value.name}/></div>`;
            templates['date'] = (value) => `<div class="value-data"><input type="date" class="form-control form-control-sm" placeholder="${value.description}" df-${value.name}/></div>`;
            templates['password'] = (value) => `<div class="value-data"><input type="password" class="form-control form-control-sm" placeholder="${value.description}" df-${value.name}/></div>`;
            templates['list'] = (value) => {
                let vals = value.description;
                vals = vals.replace(/\n/gim, ",").split(",");
                let opts = "";
                for (let j = 0; j < vals.length; j++) {
                    vals[j] = vals[j].split(":");
                    let listkey = vals[j][0].trim();
                    let listval = listkey;
                    if (vals[j].length == 1) {
                        opts = opts + "<option value='" + listval + "'>" + listkey + "</option>"
                    } else if (vals[j].length == 2) {
                        listval = vals[j][1].trim();
                        opts = opts + "<option value='" + listval + "'>" + listkey + "</option>"
                    }
                }
                opts = '<div class="value-data"><select class="form-select form-select-sm" df-' + value.name + '>' + opts + "</select></div>";
                return opts;
            }

            templates['file'] = templates['folder'] = (value) => `
                <div class="value-data" style="display: flex;">
                    <input class="form-control form-control-sm text-left" placeholder="${value.description}" df-${value.name}/>
                    <span class="badge badge-sm bg-secondary" onclick="dizest.drive(this, '${value.inputtype}', '${value.name}')" style="display: flex; align-item: center; cursor: pointer;">
                        <i class="fa-solid fa-upload"></i>
                    </span>
                </div>`;

            templates['textarea'] = (value) => `<div class="value-data"><textarea rows=5 class="form-control form-control-sm text-left" placeholder="${value.description}" df-${value.name}></textarea></div>`;
            templates['default'] = (value) => `<div class="value-data"><input type="text" class="form-control form-control-sm" placeholder="${value.description}" df-${value.name}/></div>`;

            let html =
                `<div class='card-header ${flow.inactive() ? 'bg-white text-blue' : ''}'>
                    <div class="avatar-area avatar-area-sm mr-2">
                        <div class="avatar-container">
                            <span class="avatar" style="background-image: ${app.logo()};"></span>
                        </div>
                    </div>
                    <h2 class="card-title" style="line-height: 1;">
                        ${flow.title()}
                        <br/>
                        <small style="font-size: 10px; font-weight: 100; font-family
                        : 'wiz-r';"> 
                            ${app.version()}
                        </small>
                    </h2>
                    <div class="ml-auto"></div>
                    <button class="btn btn-sm btn-white" onclick="dizest.delete('${flow.id()}')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="card-body actions d-flex p-0">
                    <span class="finish-indicator status-indicator" onclick="dizest.status('${flow.id()}')"></span>
                    <span class="pending-indicator status-indicator status-yellow status-indicator-animated">
                        <span class="status-indicator-circle">
                            <span class="status-indicator-circle"></span>
                            <span class="status-indicator-circle"></span>
                            <span class="status-indicator-circle"></span>
                        </span>
                    </span>
                    
                    <div class="action-btn" onclick="dizest.info('${flow.id()}')">
                        <i class="fa-solid fa-info"></i>
                    </div>

                    <div class="action-btn" onclick="dizest.code('${flow.id()}')">
                        <i class="fa-solid fa-code"></i>
                    </div>

                    <div class="action-btn action-btn-mobile" onclick="dizest.ui('${flow.id()}')">
                        <i class="fa-solid fa-display"></i>
                    </div>

                    <div class="action-btn action-btn-play" onclick="dizest.run('${flow.id()}')">
                        <i class="fa-solid fa-play"></i>
                    </div>

                    <div class="action-btn action-btn-stop" onclick="dizest.stop('${flow.id()}')">
                        <i class="fa-solid fa-stop"></i>
                    </div>
                </div>

                <div class="progress progress-sm" style="border-radius: 0;">
                    <div class="progress-bar bg-primary progress-bar-indeterminate"></div>
                </div>

                <div class='card-body value-container p-0'>
                ${app.inputs().length > 0 && app.inputs().map(
                    (value) => (value && value.type == 'variable') ? 1 : 0
                ).reduce((a, b) => a + b) > 0 ? '<div class="value-header">Variables</div>' : ''}
                
                ${app.inputs().map((value) => (value.type != 'variable' ? '' :
                    `<div class='value-wrapper'>
                        <div class="value-title">${value.name}</div>
                        <div class="value-data">
                            ${templates[value.inputtype] ? templates[value.inputtype](value) : templates['default'](value)}
                        </div>
                    </div>`
                )).join('')}
                </div>           
            `;

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

            drawflow.addNode(flow.id(), flow.title(), inputs, outputs, pos_x, pos_y,
                "flow-" + flow.id() + ' ' + flow.id() + ' ' + app.id() + ' ' + app.mode(),
                flow.data(),
                html
            );

            return true;
        }

        obj.node.delete = (flow: any) => {
            let flow_id = flow.id();
            let node_id = 'node-' + flow_id;
            obj.drawflow.removeNodeId(node_id);
        }

        obj.render = async () => {
            let position: any = { canvas_x: 0, canvas_y: 0 };
            if (obj.drawflow) {
                position = {
                    canvas_x: obj.drawflow.canvas_x,
                    canvas_y: obj.drawflow.canvas_y,
                    pos_x: obj.drawflow.pos_x,
                    pos_y: obj.drawflow.pos_y,
                    mouse_x: obj.drawflow.mouse_x,
                    mouse_y: obj.drawflow.mouse_y,
                    zoom: obj.drawflow.zoom,
                    zoom_last_value: obj.drawflow.zoom_last_value
                };

                obj.drawflow.removeListener();
                obj.drawflow.inactive = true;
                delete obj.drawflow;
            }

            $("#drawflow-container").html('<div id="drawflow"></div>');

            obj.drawflow = new Drawflow(document.getElementById("drawflow"));
            obj.position = { x: Math.round(position.canvas_x), y: Math.round(position.canvas_y) };

            obj.init_pos = async () => {
                obj.position.x = 0;
                obj.position.y = 0;
                obj.drawflow.move({ canvas_x: 0, canvas_y: 0 });
                await this.service.render();
            }

            obj.drawflow.on('translate', async (pos) => {
                let { x, y } = pos;
                obj.position.x = Math.round(x);
                obj.position.y = Math.round(y);
                await this.service.render();
            });

            obj.drawflow.reroute = false;
            obj.drawflow.reroute_fix_curvature = true;
            obj.drawflow.force_first_input = false;
            obj.drawflow.start();

            window.dizest = this.event;

            let flows = this.workflow.flow.list();

            // draw node
            for (let i = 0; i < flows.length; i++) {
                let flow_id = flows[i];
                let flow = this.workflow.flow(flow_id);
                if (!flow) continue;
                await obj.node.create(flow);
            }

            // draw links
            for (let i = 0; i < flows.length; i++) {
                let flow_id = flows[i];
                let flow = this.workflow.flow(flow_id);
                if (!flow) continue;

                let id_input = flow.id();
                for (let input_class in flow.inputs()) {
                    let conn = flow.inputs()[input_class].connections;
                    for (let i = 0; i < conn.length; i++) {
                        let id_output = conn[i].node;
                        let output_class = conn[i].input;
                        try {
                            obj.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
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
                            obj.drawflow.addConnection(id_output, id_input, "output-" + output_class, "input-" + input_class);
                        } catch (e) {
                        }
                    }
                }
            }

            if (position)
                obj.drawflow.move(position);

            obj.drawflow.on("nodeMoved", id => this.event.changed([id]));
            obj.drawflow.on("connectionCreated", val => this.event.changed([val.output_id, val.input_id]));
            obj.drawflow.on("connectionCancel", val => this.event.changed([val.output_id, val.input_id]));
            obj.drawflow.on("connectionRemoved", val => this.event.changed([val.output_id, val.input_id]));
            obj.drawflow.on("nodeDataChanged", id => this.event.changed([id]));

            obj.drawflow.on("nodeSelected", async (id) => {
                await this.workflow.flow.select(id);
            });

            obj.drawflow.on("nodeUnselected", async () => {
                await this.workflow.flow.unselect();
            });

            await this.workflow.refresh(true);

            if (this.workflow.flow.selected) {
                await this.workflow.flow.selected.select();
            }
        }

        return obj;
    })();

    public event: any = ((obj: any = {}) => {
        obj.info = async (flow_id: string) => {
            await this.workflow.flow.select(flow_id);
            if (this.workflow.menubar.isnot('appinfo')) {
                await this.workflow.menubar.toggle("appinfo");
                await this.service.render();
            }
        };

        obj.status = async (flow_id) => {
            $('#drawflow #node-' + flow_id + ' .debug-message').toggleClass('hide');
        }

        obj.code = async (flow_id: string) => {
            await this.workflow.flow.select(flow_id);
            if (this.workflow.menubar.isnot('codeflow')) {
                await this.workflow.menubar.toggle("codeflow");
                await this.service.render();
                await this.service.render(500);
            }
            this.workflow.position.codeflow(flow_id);
        };

        obj.ui = async (flow_id: string) => {
            await this.workflow.flow.select(flow_id);
            if (this.workflow.menubar.isnot('uimode')) {
                await this.workflow.menubar.toggle("uimode");
                await this.service.render();
            }
        };

        obj.delete = async (flow_id: string) => {
            this.workflow.flow.delete(flow_id);
            await this.workflow.flow.unselect();
            await this.service.render();
        };

        obj.stop = async () => {
            await this.workflow.stop();
        };

        obj.run = async (flow_id: string) => {
            await this.workflow.run(flow_id);
        };

        obj.drive = async (element: any, inputtype: string, valiablename: string) => {
            let file = await this.modal.show({ element, inputtype, valiablename });
            let filepath = file.path.substring(2);
            $(element).parent().find("input").val(filepath);
            let event = {}
            event.target = $(element).parent().find("input")[0];
            this.drawflow.drawflow.updateNodeValue(event);
        };

        obj.drop = async ($event) => {
            $event.preventDefault();
            let app_id = $event.dataTransfer.getData("app-id");
            if (!app_id) return;
            this.workflow.flow.create(app_id, { x: $event.clientX, y: $event.clientY, drop: true }, -1);
            await this.service.render();
        }

        obj.dragover = async ($event) => {
            $event.stopPropagation();
            $event.preventDefault();
        }

        obj.changed = (ids: any = []) => {
            for (let id of ids) {
                let origin = this.drawflow.data()[id];
                let target = this.workflow.flow(id);

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
            }
        }

        return obj;
    })();

    public modal: any = ((obj: any = {}) => {
        obj.isshow = false;
        obj.callback = null;
        obj.hide = async () => { }
        obj.action = async () => { }
        obj.binding = {};

        obj.show = async (reqinfo: any) => {
            obj.isshow = true;
            obj.binding.target = $(reqinfo.element).parent().find("input").val();
            obj.binding.selected = null;
            await this.service.render();

            let fn = () => new Promise((resolve) => {
                obj.hide = async () => {
                    obj.isshow = false;
                    await this.service.render();
                    resolve(false);
                }

                obj.action = async (node: any) => {
                    obj.isshow = false;
                    await this.service.render();
                    resolve(node);
                }
            });

            return await fn();
        }

        return obj;
    })();

}