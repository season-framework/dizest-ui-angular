import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

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
    public loaded: boolean = false;
    public interval_id: number = 0;
    public created: any = null;
    public selected: any = {};
    public status: string = 'entire';
    public category: string = '';
    public categories: any = [];

    public search: any = {
        page: 1,
        text: ''
    };

    public pagenation: any = {
        end: -1,
        start: -1,
    };

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, "/access");
        await this.load();

        this.interval_id = setInterval(async () => {
            let { code, data } = await wiz.call("status");
            if (code != 200) return;
            let changecounter = 0;
            for (let i = 0; i < this.list.length; i++) {
                this.list[i].status = null;
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

    public async load(page: number = 1, status: any = 'entire') {
        this.status = status;
        this.loaded = false;
        await this.service.render();

        let res = await wiz.call("categories");
        if (res.code == 200)
            this.categories = res.data;

        let category = this.category;
        let pd = { page: page, text: this.search.text, status: status };
        if (category) pd.category = category;

        let { code, data } = await wiz.call("list", pd);
        if (code != 200) return;
        let { rows, lastpage } = data;
        const startpage = Math.floor((page - 1) / 10) * 10 + 1;

        this.search.page = page;
        this.list = rows;

        this.pagenation.start = startpage;
        this.pagenation.end = lastpage;

        this.loaded = true;
        await this.service.render();
    }

    public async pageMove(page: number) {
        await this.load(page);
    }

    public async import() {
        let data = await this.service.file.read({ type: 'json', accept: '.dwp' });
        if (!data.flow || !data.apps)
            return toastr.error('Not supported file format');
        await this.create(data);
    }

    public async create(reference: any = {}) {
        let data: any = { apps: {}, description: '', featured: '', flow: {}, logo: '', title: '', version: '', visibility: 'private', extra: {}, favorite: '0', category: '' }
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

    public async cancel() {
        this.created = null;
        await this.service.render();
    }

    public async requestCreate(created: any) {
        let { code, data } = await wiz.call("create", { data: JSON.stringify(created) });
        if (code != 200)
            return toastr.error('Error: ' + data);
        this.created = null;
        this.search.text = '';
        await this.load(1);
    }

    public drop() {
        let scope = this;
        return async (event: any) => {
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

    public async favorite(item: any) {
        item.favorite = item.favorite == '1' ? '0' : '1';
        const { code } = await wiz.call("favorite", item);
        await this.service.render();
    }

    public async select(item: any = {}) {
        this.selected = {};
        await this.service.render();
        this.selected = item;
        await this.service.render();
    }

    public async close() {
        await this.select();
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

    public async clone(wp: any) {
        let id = wp.id;
        let { data } = await wiz.call("get", { id });
        await this.create(data);
    }

}