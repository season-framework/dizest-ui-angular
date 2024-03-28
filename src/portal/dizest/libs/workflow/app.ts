export class AppInstance {
    constructor(
        public ctrl: any,
        public app_id: string
    ) { }

    public id() {
        return this.app_id;
    }

    public spec() {
        let data = this.ctrl.workflow.data;
        return data.apps[this.id()]
    }

    public title() {
        return this.spec().title;
    }

    public logo() {
        return this.spec().logo ? `url(${this.spec().logo})` : '#fff';
    }

    public version() {
        return this.spec().version;
    }

    public inputs() {
        return this.spec().inputs;
    }

    public outputs() {
        return this.spec().outputs;
    }

    public mode() {
        return this.spec().mode;
    }

    public async set(data: any = {}) {
        for (let key in data) {
            this.spec()[key] = data[key];
        }
        await this.ctrl.workflow.service.render();
    }

    public async select() {
        await this.ctrl.select(this.id());
    }

    public selected() {
        return this.ctrl.selected == this.id();
    }

    public hovered() {
        return this.ctrl.hovered == this.id();
    }
}

export default class App {
    constructor(public workflow: any) { }

    public hovered: any = null;
    public selected: any = null;
    public instances: any = {};

    public list() {
        let data = this.workflow.data;
        let apps = [];
        for (let app_id in data.apps) {
            apps.push(app_id);
        }
        return apps;
    }

    public create(data: any = {}) {
        let wpdata = this.workflow.data;

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
            pug: '',
            js: '',
            css: '',
            logo: ''
        };

        for (let key in data) {
            spec[key] = data[key];
        }

        let app_id = this.workflow.service.random();
        while (wpdata.apps[app_id])
            app_id = this.workflow.service.random();
        spec.id = app_id;

        wpdata.apps[app_id] = spec;
        return this.get(app_id);
    }

    public get(app_id: string) {
        if (this.instances[app_id])
            return this.instances[app_id];
        let inst = new AppInstance(this, app_id);
        this.instances[app_id] = inst;
        return this.instances[app_id];
    }

    public async select(app_id: any = null) {
        this.selected = app_id;
        await this.workflow.service.render();
    }

    public async hover(app_id: any = null) {
        this.hovered = app_id;
        await this.workflow.service.render();
    }

    public async delete(app_id: string) {
        let app = this.get(app_id);
        if (!app) return;

        let flows = this.workflow.flow.list();
        for (let flow_id of flows) {
            let flow = this.workflow.flow.get(flow_id);
            if (flow && flow.app().id() == app_id)
                await this.workflow.flow.delete(flow_id);
        }

        let wpdata = this.workflow.data;
        delete this.instances[app_id];
        delete wpdata.apps[app_id];
        await this.workflow.service.render();
    }
}