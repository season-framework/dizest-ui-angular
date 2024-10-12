import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) {
        this.modal = this.service.modal.localize({
            title: "Are you sure?",
            cancel: 'Cancel',
            message: "Do you really want to remove app? What you've done cannot be undone."
        });
    }

    @Input() app: any;
    @Input() sidebar: any;

    public keyword: string = '';

    public async ngOnInit() {
        await this.service.init();
        this.workflow = this.app.workflow;
        await this.service.render();
    }

    public categories() {
        let apps = this.workflow.spec.apps();
        let categories = [];
        for (let app_id of apps) {
            let app = this.workflow.spec.app(app_id).raw();
            let category = app.category;
            if (!category) category = 'undefined';
            if (categories.indexOf(category) == -1)
                categories.push(category);
        }
        categories.sort((a, b) => {
            return a.localeCompare(b);
        });
        return categories;
    }

    public onEditing: boolean = false;
    public onEditingTimestamp: boolean = false;

    public async editing() {
        this.onEditingTimestamp = new Date().getTime();
        this.onEditing = true;
        await this.service.sleep(1000);

        let now = new Date().getTime();
        let diff = now - this.onEditingTimestamp;
        if (diff < 1000) return;
        this.onEditing = false;
    }

    public appListCache: any = {};

    public appList(category: any = false) {
        if (this.onEditing && this.appListCache[category])
            return this.appListCache[category];

        let data = this.workflow.spec.data;
        let apps = [];
        if (category) {
            for (let app_id in data.apps) {
                if (category == 'undefined')
                    if (!data.apps[app_id].category || data.apps[app_id].category == '')
                        apps.push(data.apps[app_id]);
                if (data.apps[app_id].category == category)
                    apps.push(data.apps[app_id]);
            }
        } else {
            for (let app_id in data.apps) {
                apps.push(data.apps[app_id]);
            }
        }

        apps.sort((a, b) => {
            return a.title.localeCompare(b.title);
        });

        this.appListCache[category] = apps;
        return apps;
    }

    public match(item: any, keyword: string) {
        if (item.title.toLowerCase().indexOf(keyword.toLowerCase()) > -1)
            return true;
        return false;
    }

    public async search(keyword: any = null) {
        if (keyword !== null) this.keyword = keyword;
        await this.service.render();
    }

    public async create() {
        if (this.keyword) {
            await this.workflow.spec.createApp({ title: this.keyword });
        } else {
            await this.workflow.spec.createApp();
        }
        await this.service.render();
    }

    public async import() {
        let dwas = await this.service.file.read({ type: 'json', accept: '.dwa', multiple: true });
        for (let i = 0; i < dwas.length; i++)
            await this.workflow.spec.createApp(dwas[i]);
        await this.service.render();
    }

    public drop: any = () => {
        let scope = this;
        return async (event) => {
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
                let reader = new FileReader();
                reader.onload = async (readerEvent) => {
                    try {
                        let dwa = JSON.parse(readerEvent.target.result);
                        await scope.workflow.spec.createApp(dwa);
                        await scope.service.render();
                    } catch (e) {

                    }
                };
                reader.readAsText(event.dataTransfer.files[i]);
            }
        }
    }

    public async add(app: any) {
        let flow = await this.workflow.spec.createFlow(app.id, {});
        await this.workflow.node.create(flow.id());
        await this.service.render();
    }

    public async delete(app: any) {
        let res = await this.modal.show();
        if (!res) return;
        let flows = this.workflow.spec.flows(app.id)
        for (let flow of flows) {
            await this.workflow.node.delete(flow);
        }
        await this.workflow.spec.deleteApp(app.id);
        await this.service.render();
    }

    public drag(event: any, item: any) {
        event.dataTransfer.setData("app-id", item.id);
    }

    public async hoverin(item: any) {
        this.workflow.selectedApp = item;
        await this.service.render();
    }

    public async hoverout(item: any) {
        this.workflow.selectedApp = null;
        await this.service.render();
    }

}