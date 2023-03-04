export default class Drive {
    public isshow: boolean = false;
    public target: any = null;
    public selected: any = null;
    public callback: any = null;

    constructor(public drawflow: any) { }

    public async request(target: any = null) {
        if (!target) target = null;
        this.selected = null;
        this.target = target;
        this.isshow = true;
        await this.drawflow.scope.service.render();
        let fn = () => new Promise((resolve) => {
            this.callback = resolve;
        });
        return await fn();
    }

    public async hide() {
        this.isshow = false;
        try {
            this.callback();
        } catch (e) {
        }
        await this.drawflow.scope.service.render();
    }

    public async action() {
        let filepath = this.selected.path.substring(2);
        try {
            this.callback(filepath);
        } catch (e) {
        }
        await this.hide();
    }

}