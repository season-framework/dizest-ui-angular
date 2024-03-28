import { OnInit, OnDestroy } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export class Component implements OnInit, OnDestroy {
    @Input() tab: any = null;

    public menu: any = 'viewer';
    public monaco: any = null;
    public url: any = null;
    public loading: any = null;

    constructor(
        public service: Service,
        public sanitizer: DomSanitizer
    ) { }

    public async ngOnInit() {
        await this.service.init();
        this.menu = "viewer";
        await this.viewer();
        await this.service.render();
    }

    public async ngOnDestroy() {
    }

    public async switchMenu(menu: string) {
        if (this.menu == menu) return;

        if (menu != 'viewer') {
            this.monaco = null;
            await this.service.render();

            let languageMap: any = { html: 'html', js: 'javascript', css: 'scss', api: 'python' };

            this.monaco = {
                wordWrap: false,
                roundedSelection: false,
                scrollBeyondLastLine: true,
                glyphMargin: false,
                folding: true,
                fontSize: 14,
                automaticLayout: true,
                minimap: { enabled: false },
                language: languageMap[menu]
            };
        }

        this.menu = menu;
        await this.service.render();
    }

    public getUrl() {
        return this.tab.dizest.api.url("ui", `${this.tab.workflow.data.spawner_id}/${this.tab.flow.id()}/render`);
    }

    public async viewer() {
        this.url = null;
        await this.service.render();
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.getUrl());
        await this.service.render();
    }

    public async open() {
        window.open(this.getUrl(), '_blank');
    }

    public async update() {
        await this.tab.workflow.update();
    }

    public async onLoad() {
        this.loading = false;
        await this.service.render();
    }

}