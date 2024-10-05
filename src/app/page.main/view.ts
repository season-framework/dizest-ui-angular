import { OnInit } from "@angpllar/core";
import { Service } from '@wiz/libs/portal/season/service';
import { ElementRef, ViewChild } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workspace } from '@wiz/libs/portal/dizest/ui/workspace';

import DefaultEditor from '@wiz/app/portal.dizest.editor.default';
import ImageEditor from '@wiz/app/portal.dizest.editor.image';
import VideoEditor from '@wiz/app/portal.dizest.editor.video';
import WorkflowEditor from '@wiz/app/portal.dizest.editor.workflow';

import SettingEditor from '@wiz/app/portal.dizest.editor.setting';
import HealthEditor from '@wiz/app/portal.dizest.editor.health';
import TerminalEditor from '@wiz/app/portal.dizest.editor.terminal';

export class Component implements OnInit {
    @ViewChild('editor')
    public editorElement: ElementRef;
    public workspace: any;
    public shortcuts: any = [];

    constructor(
        public service: Service,
        public ref: ViewContainerRef
    ) {
        this.dizest = new Dizest(service);

        this.dizest.editorType.bind({
            cls: ImageEditor,
            trigger: (ext, node) => {
                if (['png', 'jpg', 'jpeg', 'gif', 'ico', 'icon'].includes(ext)) {
                    return true;
                }
            }
        });

        this.dizest.editorType.bind({
            cls: VideoEditor,
            trigger: (ext, node) => {
                if (['mp4', 'avi'].includes(ext)) {
                    return true;
                }
            }
        });

        this.dizest.editorType.bind({
            cls: WorkflowEditor,
            trigger: (ext, node) => {
                if (['dwp'].includes(ext)) {
                    return true;
                }
            }
        });

        this.dizest.editorType.bind({
            cls: DefaultEditor,
            trigger: (ext, node) => {
                return true;
            }
        });

        this.shortcuts.push({
            key: ["cmd + s", "ctrl + s"],
            preventDefault: true,
            command: async () => {
                if (!this.workspace.selected) return;
                if (this.workspace.selected.update)
                    await this.workspace.selected.update();
            }
        }, {
            key: ["alt + w"],
            preventDefault: true,
            command: async () => {
                // if (!this.workspace.selected) return;
                // await this.workspace.selected.close();
            }
        }, {
            key: ["shift + enter"],
            preventDefault: true,
            command: async () => {
                if (!this.workspace.selected) return;
                if (this.workspace.selected.run)
                    await this.workspace.selected.run();
            }
        }, {
            key: ["cmd + r", "ctrl + r"],
            preventDefault: true,
            command: async () => {
                if (!this.workspace.selected) return;
                if (this.workspace.selected.run)
                    await this.workspace.selected.run();
            }
        }, {
            key: ["esc"],
            preventDefault: true,
            command: async () => {
                if (!this.workspace.selected) return;
                if (this.workspace.selected.esc)
                    await this.workspace.selected.esc();
            }
        });

        for (let i = 0; i < this.shortcuts.length; i++)
            this.shortcuts[i].allowIn = ['TEXTAREA', 'INPUT', 'SELECT'];
    }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow("/api/dizest/auth");
        await this.dizest.kernels();
        await this.dizest.loadConfig();
        await this.service.render();

        let socket: any = wiz.socket();
        this.workspace = new Workspace(this, this.editorElement, socket);
    }

    public workspaceSortableOption: any = {
        animation: 0,
        handle: '.view-tab'
    };

    public editorLoading: boolean = false;

    public driveConfig: any = {
        open: async (node, ext) => {
            this.editorLoading = true;
            await this.service.render();
            let opts: any = this.dizest.editorType.select(ext, node);
            opts.extension = ext;
            await this.workspace.open(node.id, opts);
            await this.dizest.kernels();
            this.editorLoading = false;
            await this.service.render();
            return true;
        }
    };

    public async open(menu_id) {
        let mapper: any = {
            setting: { cls: SettingEditor },
            health: { cls: HealthEditor },
            terminal: { cls: TerminalEditor },
        };
        if (!mapper[menu_id]) return;
        await this.workspace.open("#" + menu_id, mapper[menu_id]);
        await this.service.render();
    }

}