import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import $ from "jquery";

export class Component implements OnInit {
    @Input() workflow: any;

    constructor(public service: Service) { }

    public keyword: string = '';

    public async ngOnInit() { }

    public match(item: any, keyword: string) {
        if (item.title.toLowerCase().indexOf(keyword.toLowerCase()) > -1)
            return true;
        return false;
    }

    public async search() {
        await this.service.render();
    }

    public async create() {
        this.workflow.app.create();
        await this.service.render();
    }

    public async import() {
        let dwa = await this.service.file.read({ type: 'json', accept: '.dwa' });
        await this.workflow.app.create(dwa);
        await this.service.render();
    }

    public async add(item: any) {
        this.workflow.flow.create(item.id, {}, -1);
        await this.service.render();
    }

    public async delete(item: any) {
        let res = await this.modal.show();
        if (!res) return;
        this.workflow.app.delete(item.id);
        await this.service.render();
    }

    public drag(event: any, item: any) {
        event.dataTransfer.setData("app-id", item.id);
    }

    public async hoverin(item: any) {
        $('#drawflow').addClass('app-hover');
        $('#drawflow .drawflow-node').removeClass('app-hover');
        $('#drawflow .drawflow-node.' + item.id).addClass('app-hover');
    }

    public async hoverout(item: any) {
        $('#drawflow').removeClass('app-hover');
        $('#drawflow .drawflow-node').removeClass('app-hover');
    }

    public modal: any = ((obj: any = {}) => {
        obj.isshow = false;
        obj.callback = null;
        obj.hide = async () => { }
        obj.action = async () => { }

        obj.show = async () => {
            obj.isshow = true;
            await this.service.render();

            let fn = () => new Promise((resolve) => {
                obj.hide = async () => {
                    obj.isshow = false;
                    await this.service.render();
                    resolve(false);
                }

                obj.action = async () => {
                    obj.isshow = false;
                    await this.service.render();
                    resolve(true);
                }
            });

            return await fn();
        }

        return obj;
    })();
}