import $ from "jquery";

export default class Node {
    constructor(public drawflow: any) { }

    public refs: any = {};

    public async create(flow: any, isdrop: boolean = false) {
        const drawflow = this.drawflow;
        const scope = drawflow.scope;
        if (!drawflow.lib) return false;
        if (drawflow.lib.editor_mode === 'fixed') return false;

        // // do not add if app not exists
        let app = flow.app();
        if (!app) return false;

        // load data
        let { pos_x, pos_y } = flow.spec();

        // set position
        let pos = new DOMMatrixReadOnly(drawflow.lib.precanvas.style.transform);
        if (!pos_x) {
            pos_x = -pos.m41 + $(scope.element.nativeElement).width() / 2 - 130;
        } else if (isdrop) {
            pos_x = pos_x * (drawflow.lib.precanvas.clientWidth / (drawflow.lib.precanvas.clientWidth * drawflow.lib.zoom)) - (drawflow.lib.precanvas.getBoundingClientRect().x * (drawflow.lib.precanvas.clientWidth / (drawflow.lib.precanvas.clientWidth * drawflow.lib.zoom)));
        }

        if (!pos_y) {
            pos_y = -pos.m42 + $(scope.element.nativeElement).height() / 3;
        } else if (isdrop) {
            pos_y = pos_y * (drawflow.lib.precanvas.clientHeight / (drawflow.lib.precanvas.clientHeight * drawflow.lib.zoom)) - (drawflow.lib.precanvas.getBoundingClientRect().y * (drawflow.lib.precanvas.clientHeight / (drawflow.lib.precanvas.clientHeight * drawflow.lib.zoom)));
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
        const ref = scope.viewContainerRef.createComponent<NodeComponent>(scope.DrawflowNodeComponent);
        ref.instance.scope = scope;
        ref.instance.flow = flow;
        ref.instance.app = app;

        drawflow.lib.addNode(
            flow.id(), flow.title(), inputs, outputs, pos_x, pos_y,
            "flow-" + flow.id() + ' ' + flow.id() + ' ' + app.id() + ' ' + app.mode(),
            flow.data(),
            ref.location.nativeElement
        );

        this.refs[flow.id()] = ref;

        await scope.service.render();
        return true;
    }

    public async delete(flow: any) {
        if (this.refs[flow.id()]) {
            this.refs[flow.id()].destroy();
            delete this.refs[flow.id()];
        }

        let flow_id = flow.id();
        let node_id = 'node-' + flow_id;
        this.drawflow.lib.removeNodeId(node_id);
    }

    public async scroll(flow_id: string) {
        if (!this.refs[flow_id]) return;
        let element = this.refs[flow_id].instance.debugElement;
        if (!element) return;
        await this.drawflow.scope.service.render(500);
        element = element.nativeElement;
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }

}