import API from './src/api';
import EditorType from './src/editortype';

export class Dizest {
    constructor(public service: any) {
        this.api = new API();
        this.editorType = new EditorType();
        this.activeKernels = {};
        this.config = {};
    }

    public async kernels() {
        let { code, data } = await this.api.call(`workflow`, `kernel/list`);
        if (code == 200)
            this.activeKernels = data;
        return this.activeKernels;
    }

    public async loadConfig() {
        let { code, data } = await this.api.call("config", "load");
        if (code == 200)
            this.config = data;
        return this.config;
    }
}

export default Dizest;