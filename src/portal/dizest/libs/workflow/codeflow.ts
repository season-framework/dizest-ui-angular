import $ from 'jquery';

export default class Codeflow {
    constructor(public workflow: any) { }

    public codes: any = [];

    public async open(flow: any) {
        if (this.codes.includes(flow)) return await flow.select();;
        this.codes.push(flow);
        await this.workflow.service.render();
        await flow.select();
    }

    public async close(flow: any) {
        if (!this.codes.includes(flow)) return;
        this.codes.remove(flow);
        await this.workflow.service.render();
    }

    public async find(flow_id: string) {
        let codeflow = $(`#codeflow-${flow_id}`);
        if (codeflow.length == 0) return;

        let y_start = $('.workspace-tab-body').scrollTop();
        let y_end = y_start + $('.workspace-tab-body').height();

        let y = codeflow.position().top + y_start;
        let y_h = y + codeflow.height() + y_start;

        let checkstart = y_start < y && y < y_end;
        let checkend = y_start < y_h && y_h < y_end;
        if (!checkstart || !checkend) {
            $('.workspace-tab-body').scrollTop(y);
        }
    }
}