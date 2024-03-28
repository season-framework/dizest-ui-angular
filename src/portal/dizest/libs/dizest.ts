import API from './api';
import Workflow from './workflow';

export class Dizest {

    public cached: any = { active: { time: 0, data: null } };

    constructor(public scope: any, public zone: string) {
        this.api = new API(this);
    }

    public async workflow(wfid: string) {
        return new Workflow(this, wfid);
    }

    public active: any = {};

    public async loadActive() {
        let usingCache: boolean = true;
        if (!this.cached.active.data) usingCache = false;
        let ts: any = new Date().getTime();
        if (ts - this.cached.active.time > 1000) usingCache = false;

        if (usingCache === false) {
            let { data } = await this.api.call("workflow", "active");
            this.active = data;
            this.cached.active.time = new Date().getTime();
            this.cached.active.data = data;
            await this.scope.service.render();
        }
    }

    public async specs() {
        let { data } = await this.api.call("conda", "spec");
        data = data.sort((a, b) => a.name.localeCompare(b.name));
        return data;
    }
}

export default Dizest;