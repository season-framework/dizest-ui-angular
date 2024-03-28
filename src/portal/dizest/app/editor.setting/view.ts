import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    @Input() tab: any = {};

    public data: any = { conda: [], setting: {} };
    public mode: string = 'system';

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.service.loading.show();
        await this.service.init();
        let { data } = await wiz.call("load", { zone: this.tab.dizest.zone });
        this.data.setting = data;
        this.data.conda = await this.conda.list();
        await this.service.render();
        await this.service.loading.hide();
    }

    public async wizOnTabInit() {
        await this.service.render();
    }

    public async wizOnTabHide() {
        await this.service.render();
    }

    public async switchTab(tab: string) {
        this.mode = tab;
        await this.service.render();
    }

    public async request(mode: string, fnname: string, query: any = {}) {
        let dizest = this.tab.dizest;
        const { code, data } = await dizest.api.call(mode, fnname, query);
        return { code, data };
    }

    public conda: any = ((obj: any = {}) => {
        obj.item = { name: "", python: '3.10' };

        obj.iscreate = false;

        obj.list = async () => {
            let { code, data } = await this.request("conda", "list", { dizest: true });
            data = data.sort((a, b) => a.name.localeCompare(b.name));
            if (code == 200) return data;
            return [];
        }

        obj.create = async () => {
            if (!obj.iscreate) {
                obj.iscreate = true;
                obj.item = { name: "", python: '3.10' };
                await this.service.render();
                return;
            }

            let item = obj.item;

            if (!item.name) return;
            if (item.name.length < 3) return this.service.toast.error("Check name");
            if (!/^[a-z0-9]+$/.test(item.name)) return this.service.toast.error("Check name");

            for (let i = 0; i < this.data.conda.length; i++) {
                if (this.data.conda[i].name == item.name) {
                    this.service.toast.error("Env exists");
                    return;
                }
            }

            await this.service.loading.show();
            await this.request("conda", "create", { name: item.name, python: item.python });
            item.name = "";
            this.data.conda = await obj.list();
            obj.iscreate = false;
            await this.service.render();
            await this.service.loading.hide();
        }

        obj.upgrade = async (item: any) => {
            await this.service.loading.show();
            await this.request("conda", "upgrade", { name: item.name });
            this.data.conda = await obj.list();
            await this.service.render();
            await this.service.loading.hide();
        }

        obj.remove = async (item: any) => {
            if (!item.name) return;
            if (item.name.length < 3) return;
            let res = await this.service.alert.show({ message: "Do you really want to remove env? What you've done cannot be undone.", cancel: 'Cancel', action: 'Remove' });
            if (!res) return;

            await this.service.loading.show();
            await this.request("conda", "remove", { name: item.name });
            item.name = "";
            this.data.conda = await obj.list();
            await this.service.render();
            await this.service.loading.hide();
        }

        obj.cancel = async () => {
            obj.iscreate = false;
            await this.service.render();
        }

        return obj;
    })();

    public async update() {
        await wiz.call("update", { data: JSON.stringify(this.data.setting), zone: this.tab.dizest.zone });
        await this.tab.alert.info(`updated system info`, 2000);
    }

    public async uploadLogo() {
        this.data.setting.logo = await this.service.file.read({ type: 'image', accept: 'image/*', width: 180, quality: 1 });
        await this.service.render();
    }

    public async uploadIcon() {
        this.data.setting.icon = await this.service.file.read({ type: 'image', accept: 'image/*', width: 48, quality: 1 });
        await this.service.render();
    }

    public async restart() {
        let res = await this.service.alert.show({ message: "Do you really want to restart server? All working workflow is stop after restarting.", cancel: 'Cancel', action: 'Restart' });
        if (!res) return;
        await this.service.loading.show();
        try {
            await wiz.call("restart", { zone: this.tab.dizest.zone });
        } catch (e) {
        }
        while (true) {
            try {
                let { code } = await wiz.call("status", { zone: this.tab.dizest.zone });
                if (code == 200) break;
            } catch (e) {
            }
            await this.service.render(500);
        }
        await this.service.loading.hide();
    }

}