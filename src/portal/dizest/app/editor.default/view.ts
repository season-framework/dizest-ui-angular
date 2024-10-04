import { OnInit } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    @Input() dizest: any;
    @Input() editor: any = {};

    public loading: boolean = true;
    public error: boolean = false;
    public monaco: any = {};

    constructor(
        public service: Service
    ) { }

    public async ngOnInit() {
        await this.service.init();

        this.editor.data = "";

        let extension: any = this.editor.extension;
        let viewtypes: any = {
            'sql': { language: 'sql' },
            'md': { language: 'markdown' },
            'ts': { language: 'typescript', renderValidationDecorations: 'off' },
            'js': { language: 'javascript' },
            'css': { language: 'css' },
            'scss': { language: 'scss' },
            'json': { language: 'json' },
            'pug': { language: 'pug' },
            'html': { language: 'html' },
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

    public async onEditorShow() {
        let path = this.editor.path;
        let { code, data } = await this.dizest.api.call(`drive`, `read`, { path: path });

        this.editor.actions = [];
        this.editor.onAction = async (action: any) => {
            if (action.id == 'save') {
                await this.editor.update();
            }

            if (action.id == 'download') {
                await this.download();
            }
        }

        if (code == 200) {
            this.editor.data = data;

            this.editor.update = async () => {
                this.editor.loading = true;
                await this.service.render();

                let path = this.editor.path;
                let data = this.editor.data;
                if (!data) return;
                await this.dizest.api.call(`drive`, `update_file`, { id: path, data: data });

                await this.service.render(500);
                this.editor.loading = false;
                await this.service.render();

            }

            this.editor.actions.push({ id: 'save', icon: 'fa-solid fa-floppy-disk', name: 'Save' });
        } else {
            this.error = true;
        }

        this.editor.actions.push({ id: 'download', icon: 'fa-solid fa-circle-down', name: 'Download' });
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

    public async download() {
        let url = this.dizest.api.url('drive', 'download/' + this.editor.path);
        window.open(url, '_blank');
    }

    public async init(event: any) { }
}