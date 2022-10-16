import { OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
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

export class Component implements OnInit, OnDestroy {
    public list: any = [];

    public search: any = {
        page: 1,
        text: ''
    };

    public pagenation: any = {
        end: -1,
        start: -1,
    };

    public created: any = null;
    public selected: any = {};
    public selectedStyle: any = { opacity: 1 };

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public interval_id: number = 0;

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, '/auth/login');
        await this.load();
    }

    public async load(page: number = 1) {
        let { code, data } = await wiz.call("list", { page: page, text: this.search.text });
        if (code != 200) return;
        let { rows, lastpage } = data;
        const startpage = Math.floor((page - 1) / 10) * 10 + 1;

        this.search.page = page;
        this.list = rows;

        this.pagenation.start = startpage;
        this.pagenation.end = lastpage;

        await this.service.render();
    }

    public async pageMove(page: number) {
        await this.load(page);
    }

    public async close() {
        await this.select();
    }

    public async select(item: any = {}) {
        this.selected = item;
        if (this.selected.id) this.selectedStyle = { opacity: 0.3 };
        else this.selectedStyle = { opacity: 1 };
        await this.service.render();
    }

}