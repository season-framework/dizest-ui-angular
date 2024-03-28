import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    @Input() tab: any = {};

    public loading: boolean = true;
    public error: boolean = false;
    public monaco: any = {};

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.service.init();

        this.tab.data = "";

        let extension: any = this.tab.extension;
        let viewtypes: any = {
            'sql': { language: 'sql' },
            'md': { language: 'markdown' },
            'ts': { language: 'typescript', renderValidationDecorations: 'off' },
            'js': { language: 'javascript' },
            'css': { language: 'css' },
            'scss': { language: 'scss' },
            'json': { language: 'json' },
            'pug': { language: 'pug' },
            'py': { language: 'python' }
        };

        this.monaco = {
            wordWrap: false,
            roundedSelection: false,
            scrollBeyondLastLine: true,
            glyphMargin: false,
            folding: true,
            fontSize: 14,
            automaticLayout: true,
            minimap: { enabled: false }
        };

        if (viewtypes[extension])
            for (let key in viewtypes[extension])
                this.monaco[key] = viewtypes[extension][key];

        await this.service.render();
    }

    public async wizOnTabInit() {
        this.loading = true;
        await this.service.render();

        let path = this.tab.id;
        let { code, data } = await this.tab.dizest.api.call(`drive`, `read`, { path: path });

        if (code == 200) {
            this.tab.data = data;
        } else {
            this.error = true;
        }

        this.loading = false;
        await this.service.render();
    }

    public async wizOnTabHide() {
        this.loading = true;
        await this.service.render();
    }

    public monaco() {
        let config: any = {
            wordWrap: false,
            roundedSelection: false,
            scrollBeyondLastLine: true,
            glyphMargin: false,
            folding: true,
            fontSize: 14,
            automaticLayout: true,
            minimap: { enabled: false }
        };

        return config;
    }

    public async init(event: any) { }

    public async download() {
        let url = this.tab.dizest.api.url('drive', 'download/' + this.tab.id);
        window.open(url, '_blank');
    }
}