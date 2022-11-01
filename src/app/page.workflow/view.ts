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

@directives({
    DropDirective: '@wiz/libs/directives/drop.directive'
})
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

        this.interval_id = setInterval(async () => {
            let { code, data } = await wiz.call("status", { fids: this.list.map(v => v.id).join(",") });
            if (code != 200) return;

            let changecounter = 0;
            for (let i = 0; i < this.list.length; i++) {
                if (data[this.list[i].id]) {
                    this.list[i].status = data[this.list[i].id];
                    changecounter++;
                }
            }

            if (changecounter > 0) await this.service.render();
        }, 1000);
    }

    public async ngOnDestroy() {
        if (this.interval_id > 0)
            clearInterval(this.interval_id);
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

    public async delete(item) {
        let res = await this.service.alert.show({ message: "Do you really want to remove workflow? What you've done cannot be undone." });
        if (!res) return;
        await this.service.loading.show();
        try {
            await wiz.call('delete', { workflow_id: item.id });
        } catch (e) {
        }
        await this.load(this.search.page);
        await this.select();
        await this.service.loading.hide();
    }

    public async clone(wp) {
        let id = wp.id;
        let { data } = await wiz.call("get", { id });
        await this.create(data);
    }

    public async import() {
        let data = await this.service.file.read({ type: 'json', accept: '.dwp' });
        if (!data.flow || !data.apps)
            return toastr.error('Not supported file format');
        await this.create(data);
    }

    public drop: any = () => {
        let scope = this;
        return async (event) => {
            let reader = new FileReader();
            reader.onload = async (readerEvent) => {
                try {
                    let data = JSON.parse(readerEvent.target.result);
                    if (!data.flow || !data.apps)
                        return toastr.error('Not supported file format');
                    await scope.create(data);
                } catch (e) {
                    toastr.error('Not supported file format');
                }
            };

            reader.readAsText(event.dataTransfer.files[0]);
        }
    }

    public async create(reference: any = {}) {
        let data: any = { apps: {}, description: '', featured: '', flow: {}, logo: '', title: '', version: '', visibility: 'private', extra: {} }
        for (let key in reference)
            data[key] = reference[key];

        delete data.id;
        delete data.user_id;
        delete data.created;
        delete data.updated;
        delete data.updatepolicy;

        data.visibility = 'private';

        this.created = data;
        await this.service.render();
    }

    public async requestCreate(created: any) {
        let { code, data } = await wiz.call("create", { data: JSON.stringify(created) });
        if (code != 200)
            return toastr.error('Error: ' + data);
        this.created = null;
        this.search.text = '';
        await this.load(1);
        await this.select();
    }

    public async cancel() {
        this.created = null;
        await this.service.render();
    }

}