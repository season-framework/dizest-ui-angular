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

    public kernelspec: any = [];
    public selected: any;
    public installed: any = [];
    public text: string = "";

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow('admin', '/');
        await this.loadKernel();
    }

    public async loadKernel() {
        let { data } = await wiz.call("kernelspec");
        this.kernelspec = data;
        this.selected = this.kernelspec[0].name;
        await this.load();
        await this.service.render();
    }

    public async load() {
        this.service.loading.show();
        let { code, data } = await wiz.call('load', { kernel_name: this.selected });
        if (code != 200) this.installed = [];
        else this.installed = data;
        this.service.loading.hide();
    }

    public async install() {
        this.service.loading.show();
        let { code, data } = await wiz.call('package_installer', { kernel_name: this.selected, package: this.text });
        if (code != 200) toastr.error(data);
        await this.load();
    }
}