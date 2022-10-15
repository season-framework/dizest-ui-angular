import { OnInit, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import $ from "jquery";

@dependencies({
    KeyboardShortcutsModule: 'ng-keyboard-shortcuts',
    SortablejsModule: '@wiz/libs/ngx-sortablejs'
})
export class Component implements OnInit, OnDestroy, AfterViewInit {
    @Input() wpID: string;
    @Input() wpNamespace: string;
    @Input() wpReturnUrl: string;

    public initialized: boolean = false;
    public socket: any;
    public shortcuts: any = [];

    public data: any = {
        workflow: {},
        kernel: []
    };

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.request.info();
        await this.request.kernel();

        await this.workflow.bind();
        this.initialized = true;
        await this.service.render();

        this.workflow.menubar = this.menubar;
        this.workflow.browser = this.browser;

        this.menubar.toggle('codeflow');
    }

    public async ngAfterViewInit() {
        this.shortcuts.push({
            key: ["cmd + s", "ctrl + s"],
            preventDefault: true,
            command: async () => {
                await this.workflow.update();
            }
        }, {
            key: ["shift + enter"],
            preventDefault: true,
            command: async () => {
                if (!this.workflow.flow.selected) return;
                this.workflow.run(this.workflow.flow.selected.id());
                await this.workflow.flow.next();
                $('#drawflow').click();
                $('#drawflow').focus();
            }
        }, {
            key: ["cmd + r", "ctrl + r"],
            preventDefault: true,
            command: async () => {
                if (!this.workflow.flow.selected) return;
                this.workflow.run(this.workflow.flow.selected.id());
            }
        }, {
            key: ["esc"],
            preventDefault: true,
            command: async () => {
                await this.workflow.flow.unselect();
                $('#drawflow').click();
                $('#drawflow').focus();
            }
        }, {
            key: ["up"],
            preventDefault: true,
            command: async () => {
                await this.workflow.flow.prev();
            }
        }, {
            key: ['down'],
            preventDefault: true,
            command: async () => {
                await this.workflow.flow.next();
            }
        });
        for (let i = 0; i < this.shortcuts.length; i++)
            this.shortcuts[i].allowIn = ['TEXTAREA', 'INPUT', 'SELECT'];

        this.workflow.shortcuts = this.shortcuts;
        await this.service.render();
    }

    public ngOnDestroy() {
        this.workflow.unbind();
    }

    public async requester(path: string, opts: any = {}, origin: boolean = false) {
        if (origin) {
            return await wiz.call(path, { workflow_id: this.wpID, 'namespace': this.wpNamespace, ...opts });
        }
        let { code, data } = await wiz.call(path, { workflow_id: this.wpID, 'namespace': this.wpNamespace, ...opts });
        if (code == 200)
            return data;
        throw new Error(data);
    }

    public request: any = ((scope: any, obj: any = {}) => {
        obj.info = async () => {
            let data: any = await this.requester("get");
            for (let key in data.flow) {
                data.flow[key].log = "";
                data.flow[key].status = "";
                data.flow[key].index = "";
            }
            this.data.workflow = data;
        };

        obj.kernel = async () => {
            this.data.kernel = await this.requester("kernel");
        };

        obj.status = async (log: boolean = false) => {
            let wpstatus = await this.requester("status", { log });
            let flows = this.workflow.flow.list();
            for (let flow_id of flows) {
                let flow_status = wpstatus[flow_id];
                if (!flow_status) continue;
                let flow = this.workflow.flow(flow_id);
                let { status, index, log } = flow_status;
                if (log) {
                    flow.log.clear();
                    flow.log(log);
                }
                flow.status(status);
                flow.index(index);
            }
            await this.service.render();
        };

        return obj;
    })(this);

    public DRIVE_API: any = ((obj: any = {}) => {
        obj.url = (fnname) => {
            let url = wiz.url("drive_api/" + this.wpNamespace + "/" + this.wpID + "/" + fnname);
            return url;
        }

        obj.call = async (fnname, data) => {
            let url = "drive_api/" + this.wpNamespace + "/" + this.wpID + "/" + fnname;
            return await wiz.call(url, data);
        }

        return obj;
    })();

    public display: any = ((scope: any, obj: any = {}) => {
        obj.status = () => {
            try {
                if (this.data.workflow.status == 'stop') return 'status-secondary';
                if (this.data.workflow.status == 'running') return 'status-primary';
            } catch (e) { }
            return 'status-yellow';
        }
        return obj;
    })(this);

    public browser: any = ((scope: any, obj: any = {}) => {
        obj.show = true;
        obj.target = 'drive';
        obj.style = { 'max-width': '320px' };

        obj.toggle = async () => {
            obj.show = !obj.show;
            await scope.service.render();
        }

        obj.tab = async (tab) => {
            obj.target = tab;
            await scope.service.render();
        }

        obj.is = (target: string | null) => {
            return obj.target == target;
        }

        obj.isnot = (target: string | null) => {
            return obj.target != target;
        }

        return obj;
    })(this);

    public menubar: any = ((scope: any, obj: any = {}) => {
        obj.current = '';
        obj.style = { 'max-width': '720px' };

        obj.toggle = async (target: string = '') => {
            if (obj.current == target) obj.current = '';
            else obj.current = target;
            await scope.service.render();
        }

        obj.is = (target: string | null) => {
            return obj.current == target;
        }

        obj.isnot = (target: string | null) => {
            return obj.current != target;
        }

        return obj;
    })(this);

    // Workflow Components
    // - flow component
    // - app component
    // - workflow component
    public flow: any = ((scope: any, id: string, obj: any = {}) => {
        const FLOW_ID = id;
        const NODE_ID = '#node-' + FLOW_ID;

        obj.id = () => FLOW_ID;
        obj.node = () => NODE_ID;

        obj.spec = () => scope.data.workflow.flow[FLOW_ID];

        obj.data = () => obj.spec().data;
        obj.title = () => obj.spec().title ? obj.spec().title : obj.app().title();
        obj.inactive = () => obj.spec().inactive;
        obj.inputs = () => obj.spec().inputs;
        obj.outputs = () => obj.spec().outputs;

        obj.set = async (data: any = {}) => {
            for (let key in data) {
                obj.spec()[key] = data[key];
            }
            await scope.service.render();
        }

        obj.log = (data: string) => {
            data = data.replace(/\n/gim, '<br>');
            let flowdata = obj.spec();
            if (flowdata.log) flowdata.log = flowdata.log + data;
            else flowdata.log = data;

            let d = flowdata.log.split("<br>");
            flowdata.log = d.splice(d.length - 51 > 0 ? d.length - 51 : 0).join("<br>");

            $(NODE_ID + " .debug-message").remove();
            if (flowdata.log) {
                $(NODE_ID).append('<pre class="debug-message">' + flowdata.log + '</pre>');
                let element = $(NODE_ID + " .debug-message")[0];
                if (!element) return;
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }
        }

        obj.log.clear = () => {
            let flowdata = obj.spec();
            flowdata.log = '';
            $(NODE_ID + " .debug-message").remove();
        }

        obj.status = (status: string = '') => {
            let flowdata = obj.spec();
            if (status == '')
                return flowdata.status;
            flowdata.status = status;
            $(NODE_ID).attr('status', status);
        }

        obj.index = async (index: string = '') => {
            $(NODE_ID + ' .finish-indicator').html(index);
            obj.set({ index: index });
        }

        obj.app = () => {
            try {
                let data = obj.spec();
                return scope.workflow.app(data.app_id);
            } catch (e) {
            }
            return {};
        }

        obj.select = async () => {
            await scope.workflow.flow.select(FLOW_ID);
        }

        obj.toggle = async () => {
            obj.spec().inactive = !obj.spec().inactive;
            await scope.workflow.drawflow.render();
            await scope.service.render();
        }

        return obj;
    });

    public app: any = ((scope: any, id: string, obj: any = {}) => {
        const APP_ID = id;
        obj.id = () => APP_ID;

        obj.spec = () => {
            return scope.data.workflow.apps[APP_ID];
        }

        obj.delete = () => {
            scope.workflow.app.delete(APP_ID);
        }

        obj.title = () => obj.spec().title;
        obj.logo = () => obj.spec().logo ? `url(${obj.spec().logo})` : '#fff';
        obj.version = () => obj.spec().version;
        obj.inputs = () => obj.spec().inputs;
        obj.outputs = () => obj.spec().outputs;
        obj.mode = () => obj.spec().mode;

        return obj;
    });

    public workflow: any = ((scope: any, obj: any = {}) => {
        obj.drawflow = null;
        obj.codeflow = null;
        obj.menubar = null;
        obj.browser = null;
        obj.DRIVE_API = this.DRIVE_API;
        obj.returnUrl = () => location.href = this.wpReturnUrl;

        obj.spec = () => {
            return scope.data.workflow;
        }

        obj.kernel = () => scope.data.workflow.kernel;

        // app controller
        obj.app = (app_id: string) => {
            if (scope.data.workflow.apps[app_id])
                return scope.app(scope, app_id);
            return null;
        }

        obj.app.list = () => {
            let data = obj.spec();
            let apps = [];
            for (let app_id in data.apps) {
                apps.push(data.apps[app_id]);
            }
            return apps;
        }

        obj.app.create = () => {
            let wpdata = obj.spec();
            let app_id = this.service.random();
            while (wpdata.apps[app_id])
                app_id = this.service.random();

            let spec = {
                id: app_id,
                title: 'new app',
                version: '1.0.0',
                description: '',
                cdn: { js: [], css: [] },
                inputs: [],
                outputs: [],
                code: '',
                api: '',
                pug: '',
                js: '',
                css: '',
                logo: ''
            };
            wpdata.apps[app_id] = spec;
            return app_id;
        }

        obj.app.delete = (app_id: string) => {
            let wpdata = obj.spec();

            // delete related flow
            for (let flow_id of obj.flow.list()) {
                let flow = obj.flow(flow_id);
                if (flow.app().id() == app_id) {
                    obj.flow.delete(flow_id);
                }
            }
            delete wpdata.apps[app_id]
            obj.flow.unselect();
            $('#drawflow').removeClass('app-hover');
            $('#drawflow .drawflow-node').removeClass('app-hover');
        }

        // flow controller
        obj.flow = (flow_id: string) => {
            if (scope.data.workflow.flow[flow_id])
                return scope.flow(scope, flow_id);
            return null;
        }

        obj.flow.list = () => {
            let data = obj.spec();
            let flows = [];
            for (let flow_id in data.flow) {
                flows.push(flow_id);
            }
            return flows;
        }

        obj.flow.create = (app_id: string, opt: any = {}, position: number = -1) => {
            let wpdata = obj.spec();
            let flow_id = app_id + "-" + new Date().getTime();
            while (wpdata.flow[flow_id])
                flow_id = app_id + "-" + new Date().getTime();
            let spec = {
                app_id: app_id,
                'class': '',
                data: {},
                description: '',
                id: app_id + "-" + new Date().getTime(),
                inputs: {},
                name: '',
                outputs: {},
                pos_x: opt.x,
                pos_y: opt.y,
                log: '',
                status: '',
                typenode: false
            };
            wpdata.flow[flow_id] = spec;
            let newflow = obj.flow(flow_id);
            if (obj.drawflow)
                obj.drawflow.node.create(newflow, opt.drop ? true : false);
            if (obj.codeflow)
                obj.codeflow.add(newflow, position);
            scope.service.render();
            return newflow
        }

        obj.flow.delete = async (flow_id: string) => {
            let wpdata = obj.spec();
            let flow = obj.flow(flow_id);
            if (!flow) return;
            if (obj.codeflow) obj.codeflow.delete(flow);
            if (obj.drawflow) obj.drawflow.node.delete(flow);
            delete wpdata.flow[flow_id];
            await scope.service.render();
        }

        obj.flow.selected = null;

        obj.flow.isSelected = () => obj.flow.selected ? true : false;

        obj.flow.select = async (flow_id: string) => {
            let flow = obj.flow(flow_id);
            if (!flow) return;

            $('#drawflow').addClass('selected');
            $('.drawflow-node').removeClass('selected');
            $('.drawflow .connection path').removeClass('selected');
            $('#node-' + flow_id).addClass('selected');
            $('.node_in_node-' + flow_id + ' path').addClass('selected');
            $('.node_out_node-' + flow_id + ' path').addClass('selected');

            obj.flow.selected = flow;
            await scope.service.render();
        }

        obj.flow.unselect = async () => {
            $('#drawflow').removeClass('selected');
            $('.drawflow-node').removeClass('selected');
            $('.drawflow .connection path').removeClass('selected');
            obj.flow.selected = null;

            if (scope.menubar.is("appinfo") || scope.menubar.is("uimode")) {
                scope.menubar.toggle();
            }

            await scope.service.render();
        }

        obj.flow.next = async () => {
            if (!obj.flow.selected)
                return await obj.flow.select(obj.codeflow.first());
            let next_id = obj.codeflow.next(obj.flow.selected.id());
            if (next_id != null) {
                await obj.flow.select(next_id);
                await obj.position.drawflow(next_id);
                await obj.position.codeflow(next_id);
            }
        }

        obj.flow.prev = async () => {
            if (!obj.flow.selected)
                return await obj.flow.select(obj.codeflow.first());
            let prev_id = obj.codeflow.prev(obj.flow.selected.id());
            if (prev_id != null) {
                await obj.flow.select(prev_id);
                await obj.position.drawflow(prev_id);
                await obj.position.codeflow(prev_id);
            }
        }

        obj.position = {};
        obj.position.codeflow = async (flow_id: string) => {
            if (!obj.codeflow) return;
            if ($('#codeflow-' + flow_id).length == 0)
                return false;

            let y_start = $('.codeflow-body').scrollTop();
            let y_end = y_start + $('.codeflow-body').height();

            let y = $('#codeflow-' + flow_id).position().top + y_start;
            let y_h = y + $('#codeflow-' + flow_id).height() + y_start;

            let checkstart = y_start < y && y < y_end;
            let checkend = y_start < y_h && y_h < y_end;
            if (!checkstart || !checkend) {
                $('.codeflow-body').scrollTop(y - $('#codeflow-' + flow_id + ' .codeflow-desc').height() - $('#codeflow-' + flow_id + ' .codeflow-header').height());
            }
        }

        obj.position.drawflow = async (flow_id: string) => {
            if (!obj.drawflow) return;
            if ($('#node-' + flow_id).length == 0)
                return false;
            let x = $('#node-' + flow_id).position().left;
            let y = $('#node-' + flow_id).position().top;
            let zoom = obj.drawflow.drawflow.zoom;

            let w = $('#drawflow').width() * zoom;
            let h = $('#drawflow').height() * zoom;

            let tx = Math.round(-x + (w / 2.4));
            let ty = Math.round(-y + (h / 4));

            obj.drawflow.drawflow.move({ canvas_x: tx, canvas_y: ty });

            obj.drawflow.position.x = tx;
            obj.drawflow.position.y = ty;
            await scope.service.render();
        }

        // workflow status manager
        obj.is = (status) => {
            if (scope.data.workflow.status == status) {
                return true;
            }
            return false;
        };

        obj.isnot = (status) => {
            if (scope.data.workflow.status == status) {
                return false;
            }
            return true;
        }

        obj.update = async (render: boolean = true) => {
            let codeflow = this.workflow.codeflow.data;
            let orderindex = {};
            for (let i = 0; i < codeflow.length; i++) {
                codeflow[i].order = i + 1;
                orderindex[codeflow[i].id] = i + 1;
            }
            let spec: any = obj.spec();
            let data: any = JSON.parse(JSON.stringify(spec));

            for (let flow_id in data.flow) {
                delete data.flow[flow_id].log;
                delete data.flow[flow_id].status;
                delete data.flow[flow_id].index;
                if (orderindex[flow_id])
                    data.flow[flow_id].order = orderindex[flow_id];
                if (!data.flow[flow_id].order)
                    data.flow[flow_id].order = new Date().getTime();
            }

            data = JSON.stringify(data);
            await scope.requester("update", { data }, true);
            if (render) {
                await obj.drawflow.render();
            }
        }

        obj.refresh = async (log: boolean = false) => {
            await this.request.status(log);
        }

        obj.reload = async () => {
            location.reload();
        }

        obj.stop = async () => {
            await scope.service.loading(true);
            let flows = obj.flow.list();
            for (let i = 0; i < flows.length; i++) {
                let flow = obj.flow(flows[i]);
                if (flow.status() == 'running' || flow.status() == 'pending')
                    flow.status('stop');
            }
            await scope.requester("stop");
        }

        obj.kill = async () => {
            await scope.service.loading(true);
            obj.SIGKILL = true;
            await scope.requester("kill");
            location.reload();
        }

        obj.start = async (spec) => {
            scope.data.workflow.status = 'onstart';
            await scope.service.loading(true);
            await scope.requester("start", { spec: spec });
        }

        obj.run = async (flow_id: string | null = null) => {
            if (flow_id) {
                let flow = obj.flow(flow_id);
                if (flow.status() == 'running' || flow.status() == 'pending')
                    return;
                flow.log.clear();
                flow.status('pending');
                await obj.update(false);
                await obj.flow.select(flow_id);
                await scope.requester("run", { flow: flow_id });
            } else {
                let flows = obj.flow.list();
                for (let i = 0; i < flows.length; i++) {
                    let flow = obj.flow(flows[i]);
                    if (flow.inactive()) continue;
                    flow.log.clear();
                    flow.status('pending');
                }
                await scope.requester("run");
            }
        }

        obj.bind = async () => {
            scope.socket = wiz.socket();
            scope.socket.on("connect", async () => {
                scope.socket.emit("join", { workflow_id: this.wpID, 'namespace': this.wpNamespace });
            });

            scope.socket.on("kernel.status", async (message: any) => {
                if (obj.SIGKILL) return;
                let { data } = message;

                if (scope.data.workflow.status == 'onstart') {
                    if (data == 'ready') {
                        scope.data.workflow.status = data;
                        await scope.service.loading(false);
                    }
                } else {
                    scope.data.workflow.status = data;
                    await scope.service.render(1000);
                    await scope.service.loading(false);
                }
            });

            scope.socket.on("flow.status", async (message: any) => {
                let { flow_id, data } = message;
                let flow = obj.flow(flow_id);
                if (!flow) return;
                flow.status(data);
            });

            scope.socket.on("flow.index", async (message: any) => {
                let { flow_id, data } = message;
                let flow = obj.flow(flow_id);
                if (!flow) return;
                flow.index(data);
            });

            scope.socket.on("flow.log.clear", async (message: any) => {
                let { flow_id } = message;
                let flow = obj.flow(flow_id);
                if (!flow) return;
                flow.log.clear();
            });

            scope.socket.on("flow.log", async (message: any) => {
                let { flow_id, data } = message;
                let flow = obj.flow(flow_id);
                if (!flow) return;
                flow.log(data);
            });
        }

        obj.unbind = async () => {
            scope.socket.disconnect();
        }

        return obj;
    })(this);

}