import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    public list: any = [];

    public search: any = {
        page: 1,
        text: ''
    };

    public pagenation: any = {
        end: -1,
        start: -1,
    };

    public selected: any = {};
    public selectedStyle: any = { opacity: 1 };

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, '/auth/login');
        await this.load();
    }

    public async load(page: number = 1) {
        let { code, data } = await wiz.call("list", { page: page, text: this.search.text });
        if (code != 200) return;
        let { rows, lastpage } = data;
        const startpage = Math.floor((this.search.page - 1) / 10) * 10 + 1;

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