import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    @Input() workflow: any;

    public list: any = [];
    public query: any = { time: '', spec: '' };

    constructor(public service: Service) { }

    public async ngOnInit() {
        this.query.spec = this.workflow.kernel();
        await this.refresh();
    }

    public async refresh() {
        let { data } = await this.workflow.request.post("cron_list", {}, true);
        this.list = data;
        await this.service.render();
    }

    public async remove(comment) {
        let { code, data } = await this.workflow.request.post("cron_remove", { comment: comment });
        await this.refresh();
    }

    public async add() {
        let { code, data } = await this.workflow.request.post("cron_add", this.query);
        this.query = {};
        await this.refresh();
    }

}