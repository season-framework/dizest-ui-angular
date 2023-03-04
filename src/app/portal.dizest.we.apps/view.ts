import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

export class Component implements OnInit, OnDestroy {
    public alert: any;
    public keyword: string = '';

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) {
        this.alert = this.service.alert.localize({
            title: "Are you sure?",
            cancel: 'Cancel',
            message: "Do you really want to remove app? What you've done cannot be undone."
        });
    }

    public async ngOnInit() {
        this.workflow.regist('apps', this);
        this.categories();
    }

    public async ngOnDestroy() {
        this.workflow.unregist('apps');
    }

    public categories() {
        let apps = this.workflow.data.apps;
        let categories = [];
        for (let app_id in apps) {
            let category = apps[app_id].category;
            if (!category) category = 'undefined';
            if (categories.indexOf(category) == -1)
                categories.push(category);
        }
        return categories;
    }

    public appList(category: any = false) {
        let data = this.workflow.data;
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
            await this.workflow.app.create({ title: this.keyword });
        } else {
            await this.workflow.app.create();
        }
        await this.service.render();
    }

    public async import() {
        let dwa = await this.service.file.read({ type: 'json', accept: '.dwa' });
        await this.workflow.app.create(dwa);
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
                        await scope.workflow.app.create(dwa);
                        await scope.service.render();
                    } catch (e) {
                        scope.service.toast.error('Not supported file format');
                    }
                };
                reader.readAsText(event.dataTransfer.files[i]);
            }
        }
    }

    public async add(item: any) {
        await this.workflow.flow.create(item.id, {});
    }

    public async delete(item: any) {
        let res = await this.alert.show();
        if (!res) return;
        await this.workflow.app.delete(item.id);
    }

    public drag(event: any, item: any) {
        event.dataTransfer.setData("app-id", item.id);
    }

    public async hoverin(item: any) {
        await this.workflow.app.hover(item.id);
    }

    public async hoverout(item: any) {
        await this.workflow.app.hover();
    }

}