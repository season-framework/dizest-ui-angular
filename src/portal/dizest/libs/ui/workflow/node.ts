import $ from 'jquery';

export class Node {
    constructor(public workflow: any) { }

    public refs: any = {};

    public async create(flow_id: any, isdrop: boolean = false) {
        if (!this.workflow.drawflow) return false;
        if (this.workflow.drawflow.editor_mode === 'fixed') return false;

        let flow = this.workflow.spec.flow(flow_id)

        // // do not add if app not exists
        let app = flow.app();
        if (!app) return false;

        // load data
        let { pos_x, pos_y } = flow._data;

        // set position
        let element: any = this.workflow.app[this.workflow.config.wrapperElement].nativeElement
        let pos = new DOMMatrixReadOnly(this.workflow.drawflow.precanvas.style.transform);
        if (!pos_x) {
            pos_x = -pos.m41 + $(element).width() / 2 - 130;
        } else if (isdrop) {
            pos_x = pos_x * (this.workflow.drawflow.precanvas.clientWidth / (this.workflow.drawflow.precanvas.clientWidth * this.workflow.drawflow.zoom)) - (this.workflow.drawflow.precanvas.getBoundingClientRect().x * (this.workflow.drawflow.precanvas.clientWidth / (this.workflow.drawflow.precanvas.clientWidth * this.workflow.drawflow.zoom)));
        }

        if (!pos_y) {
            pos_y = -pos.m42 + $(element).height() / 3;
        } else if (isdrop) {
            pos_y = pos_y * (this.workflow.drawflow.precanvas.clientHeight / (this.workflow.drawflow.precanvas.clientHeight * this.workflow.drawflow.zoom)) - (this.workflow.drawflow.precanvas.getBoundingClientRect().y * (this.workflow.drawflow.precanvas.clientHeight / (this.workflow.drawflow.precanvas.clientHeight * this.workflow.drawflow.zoom)));
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
        const ref = this.workflow.app.ref.createComponent<NodeComponent>(this.workflow.config.nodeComponentClass);
        ref.instance.workflow = this.workflow;
        ref.instance.flow = flow;

        let classoverride: string = "flow-" + flow.id() + ' ' + flow.id() + ' ' + app.id();

        this.workflow.drawflow.addNode(
            flow.id(), flow.title(),
            inputs, outputs, pos_x, pos_y,
            classoverride,
            flow.data(),
            ref.location.nativeElement
        );

        this.refs[flow.id()] = ref;

        await this.workflow.app.service.render();
        return true;
    }

    public async delete(flow: any) {
        if (this.refs[flow.id()]) {
            this.refs[flow.id()].destroy();
            delete this.refs[flow.id()];
        }

        let flow_id = flow.id();
        let node_id = 'node-' + flow_id;
        this.workflow.drawflow.removeNodeId(node_id);
        let codeview = this.workflow.app.sidebar.get("code");
        if (codeview.items) codeview.items.remove(flow_id);
        this.workflow.spec.deleteFlow(flow_id);
        this.selected = null;
        await this.workflow.app.service.render();
    }

    public get(flow_id: string) {
        try {
            return this.refs[flow_id].instance;
        } catch (e) {
        }
        return null;
    }

    public async scroll(flow_id: string) {
        if (!this.refs[flow_id]) return;
        let element = this.refs[flow_id].instance.debugElement;
        if (!element) return;
        await this.drawflow.this.workflow.app.service.render(500);
        element = element.nativeElement;
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }
}

export default Node;