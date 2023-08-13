export class FlowInstance {
    constructor(
        public ctrl: any,
        public flow_id: string
    ) { }

    private _cache: any = {
        status: null,
        index: null
    };

    private _tab: string = 'code';

    public async tab(tab: any = null) {
        if (tab)
            this._tab = tab;
        await this.ctrl.workflow.service.render();
    }

    public isTab(tab: string) {
        return this._tab == tab;
    }

    public id() {
        return this.flow_id;
    }

    public node() {
        return '#node-' + this.id();
    }

    public spec() {
        let data = this.ctrl.workflow.data;
        return data.flow[this.id()]
    }

    public data() {
        return this.spec().data;
    }

    public title() {
        if (this.spec().title)
            return this.spec().title;
        return this.app().title();
    }

    public inactive() {
        return this.spec().inactive;
    }

    public inputs() {
        return this.spec().inputs;
    }

    public outputs() {
        return this.spec().outputs;
    }

    public app() {
        try {
            let data = this.spec();
            return this.ctrl.workflow.app.get(data.app_id);
        } catch (e) {
        }
        return null;
    }

    public async set(data: any = {}) {
        for (let key in data) {
            this.spec()[key] = data[key];
        }
        await this.ctrl.workflow.service.render();
    }

    public log(data: any = null) {
        let flowdata = this.spec();
        if (data) {
            data = data.replace(/\n/gim, '<br>');
            if (flowdata.log) flowdata.log = flowdata.log + '<br>' + data;
            else flowdata.log = data;
            let d = flowdata.log.split("<br>");
            flowdata.log = d.splice(d.length - 51 > 0 ? d.length - 51 : 0).join("<br>");
            this.ctrl.workflow.service.render();
        }
        let txt = flowdata.log.replace(/\n/gim, '<br>');
        return txt;
    }

    public async logclear() {
        let flowdata = this.spec();
        flowdata.log = '';
        await this.ctrl.workflow.service.render();
    }

    public status(value: any = null) {
        if (value) {
            this._cache.status = value;
            this.set({ status: value });
            this.ctrl.workflow.service.render();
        }

        let res = this._cache.status;
        if (!res) res = this.spec().status;
        if (!res) res = 'idle';
        return res;
    }

    public index(value: any = null) {
        if (value) {
            this._cache.index = value;
            this.set({ index: value });
            this.ctrl.workflow.service.render();
        }

        let res = this._cache.index;
        if (!res) res = this.spec().index;
        if (!res) res = -1;
        return res;
    }

    public async run() {
        let res = await this.ctrl.workflow.update();
        if (!res) {
            await this.ctrl.workflow.service.alert.show({ title: 'Error', message: 'An error occurred while saving', action: 'Close', cancel: null });
            return;
        }
        await this.ctrl.workflow.request('flow/run', { flow_id: this.id() });
    }

    public async stop() {
        await this.ctrl.workflow.request('flow/stop', { flow_id: this.id() });
    }

    public async toggle() {
        this.spec().inactive = !this.spec().inactive;
        this.ctrl.workflow.service.render();
    }

    public async select() {
        await this.ctrl.select(this.id());
    }

    public selected() {
        return this.ctrl.selected == this.id();
    }

    public async delete() {
        await this.ctrl.delete(this.id());
    }

}

export default class Flow {
    constructor(public workflow: any) { }

    public selected: any = null;
    public instances: any = {};

    public list() {
        let data = this.workflow.data;
        let flows = [];
        for (let flow_id in data.flow) {
            flows.push(flow_id);
        }
        return flows;
    }

    public async create(app_id: string, opt: any = {}) {
        let wpdata = this.workflow.data;
        let flow_id = app_id + "-" + new Date().getTime();
        while (wpdata.flow[flow_id])
            flow_id = app_id + "-" + new Date().getTime();
        let spec = {
            app_id: app_id,
            'class': '',
            data: {},
            description: '',
            id: flow_id,
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
        let flow = this.get(flow_id);
        if (this.workflow.drawflow) {
            await this.workflow.drawflow.node.create(flow, opt.drop);
        }

        await this.workflow.service.render();
        return flow;
    }

    public get(flow_id: string) {
        if (this.instances[flow_id])
            return this.instances[flow_id];
        let inst = new FlowInstance(this, flow_id);
        this.instances[flow_id] = inst;
        return this.instances[flow_id];
    }

    public async select(flow_id: any = null) {
        this.selected = flow_id;
        await this.workflow.service.render();
    }

    public async delete(flow_id: any = null) {
        let flow = this.get(flow_id);
        if (!flow) return;

        if (this.workflow.drawflow) {
            await this.workflow.drawflow.node.delete(flow);
        }

        let wpdata = this.workflow.data;
        delete this.instances[flow_id];
        delete wpdata.flow[flow_id];

        await this.workflow.service.render();
    }

}