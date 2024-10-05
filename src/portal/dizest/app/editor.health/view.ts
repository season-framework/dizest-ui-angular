import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() dizest: any;
    @Input() editor: any = {};

    public isUpdate: boolean = false;
    public data: any = {};

    public async ngOnInit() {
        await this.service.init();
        await this.dizest.loadConfig();
        this.data = JSON.parse(JSON.stringify(this.dizest.config));
        await this.service.render();

        this.editor.update = async () => {
            await this.update();
        }
    }

    public currentTab: string = 'system';

    public async changeTab(tab: string) {
        this.currentTab = tab;
        await this.service.render();
    }

    // main settings
    public async uploadLogo() {
        this.data.logo = await this.service.file.read({ type: 'image', accept: 'image/*', width: 180, quality: 1 });
        await this.service.render();
    }

    public async uploadIcon() {
        this.data.icon = await this.service.file.read({ type: 'image', accept: 'image/*', width: 48, quality: 1 });
        await this.service.render();
    }

    public async update() {
        await this.service.render(this.isUpdate = true);
        await this.service.render(500);
        await this.dizest.api.call("config", "update", { data: JSON.stringify(this.data) });
        await this.dizest.loadConfig();
        this.data = JSON.parse(JSON.stringify(this.dizest.config));
        await this.service.render(this.isUpdate = false);
    }

    public async restart() {
        let res = await this.service.modal.show({ message: "Do you really want to restart server? All working workflow is stop after restarting.", cancel: 'Cancel', action: 'Restart' });
        if (!res) return;
        await this.service.status.show('loading');
        try {
            await wiz.call("restart");
        } catch (e) {
        }
        while (true) {
            try {
                let { code } = await wiz.call("status");
                if (code == 200) break;
            } catch (e) {
            }
            await this.service.render(500);
        }
        await this.service.status.hide('loading');
    }

    // executable settings
    public newExecObj: any = {
        name: '',
        executable_path: '',
        isBlocked: false,
        isVerified: false
    };

    public async cancelAddExecutable() {
        this.newExecObj.name = '';
        this.newExecObj.executable_path = '';
        this.newExecObj.isBlocked = false;
        this.newExecObj.isVerified = false;
        await this.service.render();
    }

    public async addNewExecutable() {
        let data = this.newExecObj;
        if (data.isBlocked) return;
        data.isBlocked = true;
        await this.service.render();

        if (!data.isVerified) {
            let res = await wiz.call("verify", { path: data.executable_path });
            if (res.data) {
                data.isVerified = true;
            } else {
                await this.service.modal.error("The system cannot find the Python environment.");
            }

            await this.service.render(data.isBlocked = false);
            return
        }

        let target: any = { name: data.name, executable_path: data.executable_path };
        if (!this.data.executables) this.data.executables = [];

        if (target.name == 'base') {
            await this.service.modal.error("Already exists name. change name to another.");
            await this.service.render(data.isBlocked = false);
            return;
        }

        for (let i = 0; i < this.data.executables.length; i++) {
            if (this.data.executables[i].name == target.name) {
                await this.service.modal.error("Already exists name. change name to another.");
                await this.service.render(data.isBlocked = false);
                return;
            }
        }

        this.data.executables.push(target);
        await this.update();
        await this.cancelAddExecutable();
        await this.service.render(data.isBlocked = false);
    }

    public async removeExecutable(item) {
        let res = await this.service.modal.show({ message: "Do you really want to delete?", cancel: 'Cancel', action: 'Delete' });
        if (!res) return;
        this.data.executables.remove(item);
        await this.update();
    }

}