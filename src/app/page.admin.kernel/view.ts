import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

import toastr from 'toastr';
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-bottom-center",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": 300,
    "hideDuration": 500,
    "timeOut": 1500,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

export class Component implements OnInit {

    public initialized: boolean = false;
    public data: any = { kernel: [], conda: [], script: [] };
    public mode: string = 'kernel';

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.loading.show();
        await this.service.init();
        await this.service.auth.allow('admin', '/');
        await this.load();
        this.initialized = true;
        await this.service.loading.hide();
    }

    public async load() {
        let { data } = await wiz.call("load");
        this.data.kernel = data;
        this.data.conda = await this.conda.list();
        await this.service.render();
    }

    public async tab(tab: string) {
        this.mode = tab;
        await this.service.render();
    }

    public kernel: any = ((obj: any = {}) => {
        obj.item = { name: "", title: "", env: '' };
        obj.iscreate = false;

        obj.create = async () => {
            if (!obj.iscreate) {
                obj.iscreate = true;
                obj.item = { name: "", title: "", conda: "" };
                try {
                    obj.item.conda = this.data.conda[0].name;
                } catch (e) {
                }
                await this.service.render();
                return;
            }

            let item = obj.item;

            if (!item.name) return;
            if (item.name.length < 3) return toastr.error("Check name");
            if (!/^[a-z0-9]+$/.test(item.name)) return toastr.error("Check name");

            for (let i = 0; i < this.data.kernel.length; i++) {
                if (this.data.kernel[i].name == item.name) {
                    toastr.error("Kernel exists")
                    return;
                }
            }

            this.data.kernel.push(JSON.parse(JSON.stringify(item)));
            obj.iscreate = false;
            await obj.update();
            await this.service.render();
        }

        obj.remove = async (item: any) => {
            if (!item.name) return;
            if (item.name.length < 3) return;
            let res = await this.service.alert.show({ message: "Do you really want to remove env? What you've done cannot be undone." });
            if (!res) return;
            this.data.kernel.remove(item);
            await obj.update();
            await this.service.render();
        }

        obj.cancel = async () => {
            obj.iscreate = false;
            await this.service.render();
        }

        obj.update = async () => {
            let data = JSON.stringify(this.data.kernel);
            await wiz.call("update", { data });
            toastr.success("Updated");
        }

        return obj;
    })();

    public conda: any = ((obj: any = {}) => {
        obj.item = { name: "", python: '3.10' };

        obj.iscreate = false;

        obj.list = async () => {
            let { code, data } = await wiz.call("conda/list");
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
            if (item.name.length < 3) return toastr.error("Check name");
            if (!/^[a-z0-9]+$/.test(item.name)) return toastr.error("Check name");

            for (let i = 0; i < this.data.conda.length; i++) {
                if (this.data.conda[i].name == item.name) {
                    toastr.error("Env exists");
                    return;
                }
            }

            await this.service.loading.show();
            await wiz.call("conda/create", { name: item.name, python: item.python });
            item.name = "";
            this.data.conda = await obj.list();
            obj.iscreate = false;
            await this.service.render();
            await this.service.loading.hide();
        }

        obj.remove = async (item: any) => {
            if (!item.name) return;
            if (item.name.length < 3) return;
            let res = await this.service.alert.show({ message: "Do you really want to remove env? What you've done cannot be undone." });
            if (!res) return;

            await this.service.loading.show();
            await wiz.call("conda/remove", { name: item.name });
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

}