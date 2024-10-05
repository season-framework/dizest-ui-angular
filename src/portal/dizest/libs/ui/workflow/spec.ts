export class Flow {
    public _data: any = {};
    public meta: any = {};

    constructor(private spec: any, flow_id: any) {
        if (!spec.data.flow[flow_id]) return;
        this._data = spec.data.flow[flow_id];
        this._data.id = flow_id;
    }

    public raw() {
        return this._data;
    }

    public id() {
        return this._data.id;
    }

    public title() {
        if (this._data.title)
            return this._data.title;
        return this.app().title();
    }

    public data() {
        return this._data.data;
    }

    public active() {
        return this._data.active;
    }

    public inputs() {
        return this._data.inputs;
    }

    public outputs() {
        return this._data.outputs;
    }

    public width() {
        let w = this._data.width ? this._data.width : 260;
        if (w * 1 < 260) return 260;
        return w * 1;
    }

    public app() {
        try {
            let app_id = this._data.app_id;
            return this.spec.app(app_id);
        } catch (e) {
        }
        return null;
    }

    public set(data: any = {}) {
        for (let key in data) {
            this._data[key] = data[key];
        }
    }
}

export class App {
    public _data: any = {};

    constructor(private spec: any, app_id: any) {
        if (!spec.data.apps[app_id]) return;
        this._data = spec.data.apps[app_id];
        this._data.id = app_id;
    }

    public raw() {
        return this._data;
    }

    public id() {
        return this._data.id;
    }

    public title() {
        if (this._data.title)
            return this._data.title;
        return this.app().title();
    }

    public version() {
        return this._data.version;
    }

    public inputs() {
        return this._data.inputs;
    }

    public outputs() {
        return this._data.outputs;
    }
}

export class Spec {
    constructor(public data: any) { }

    public app(app_id: any) {
        return new App(this, app_id);
    }

    public apps() {
        let apps = [];
        for (let app_id in this.data.apps) {
            apps.push(app_id);
        }
        return apps;
    }

    public deleteApp(app_id) {
        if (this.data.apps[app_id])
            delete this.data.apps[app_id];
    }

    public createApp(data: any = {}) {
        let wpdata = this.data;

        let spec = {
            id: '',
            title: 'new app',
            version: '1.0.0',
            description: '',
            cdn: { js: [], css: [] },
            inputs: [],
            outputs: [],
            code: '',
            api: '',
            html: '',
            js: '',
            css: ''
        };

        for (let key in data) {
            spec[key] = data[key];
        }

        let app_id = this.random();
        while (wpdata.apps[app_id])
            app_id = this.random();
        spec.id = app_id;

        wpdata.apps[app_id] = spec;
        return this.app(app_id);
    }

    public flow(flow_id: any) {
        return new Flow(this, flow_id);
    }

    public flows(app_id: any) {
        let flows = [];
        if (!app_id) {
            for (let flow_id in this.data.flow) {
                flows.push(flow_id);
            }
        } else {
            for (let flow_id in this.data.flow) {
                let flow = this.flow(flow_id)
                if (flow.app().id() == app_id)
                    flows.push(flow);
            }
        }
        return flows;
    }

    public deleteFlow(flow_id) {
        if (this.data.flow[flow_id])
            delete this.data.flow[flow_id];
    }

    public createFlow(app_id: string, opt: any = {}) {
        let wpdata = this.data;
        let flow_id = app_id + "-" + new Date().getTime();
        while (wpdata.flow[flow_id])
            flow_id = app_id + "-" + new Date().getTime();

        let spec = {
            app_id: app_id,
            'class': '',
            data: {},
            active: true,
            description: '',
            id: flow_id,
            inputs: {},
            name: '',
            outputs: {},
            pos_x: opt.x,
            pos_y: opt.y,
            typenode: false
        };

        wpdata.flow[flow_id] = spec;
        let flow = this.flow(flow_id);
        return flow;
    }

    public random(stringLength: number = 16) {
        const fchars = 'abcdefghiklmnopqrstuvwxyz';
        const chars = '0123456789abcdefghiklmnopqrstuvwxyz';
        let randomstring = '';
        for (let i = 0; i < stringLength; i++) {
            let rnum = null;
            if (i === 0) {
                rnum = Math.floor(Math.random() * fchars.length);
                randomstring += fchars.substring(rnum, rnum + 1);
            } else {
                rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }
        }
        return randomstring;
    }
}

export default Spec;