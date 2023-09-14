import { OnInit } from "@angular/core";
import { ElementRef, ViewChild } from '@angular/core';
import { ViewContainerRef } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';

// Drive Editor
import WorkflowEditor from '@wiz/app/portal.dizest.editor.workflow';
import TextEditor from '@wiz/app/portal.dizest.editor.text';
import ImageEditor from '@wiz/app/portal.dizest.editor.image';
import VideoEditor from '@wiz/app/portal.dizest.editor.video';

// Setting Editor
import UIModeEditor from '@wiz/app/portal.dizest.editor.uimode';
import SettingEditor from '@wiz/app/portal.dizest.editor.setting';
import TerminalEditor from '@wiz/app/portal.dizest.editor.terminal';

import CodeFlowSidebar from '@wiz/app/portal.dizest.sidebar.codeflow';
import WorkflowInfoSidebar from '@wiz/app/portal.dizest.sidebar.workflowinfo';
import TimerSidebar from '@wiz/app/portal.dizest.sidebar.timer';
import PackagesSidebar from '@wiz/app/portal.dizest.sidebar.packages';

import DrawflowNodeComponent from '@wiz/app/portal.dizest.widget.workflow.node';

export class Component implements OnInit {
    public dizest: Dizest;

    @ViewChild('workflowsidebar')
    public sidebarElement: ElementRef;

    public shortcuts: any = [];

    constructor(
        public service: Service,
        public viewContainerRef: ViewContainerRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, "/authenticate");

        let zone = this.service.auth.session.zone;
        this.dizest = new Dizest(this, zone);
        await this.bindShortcuts();
        await this.dizest.loadActive();
        try {
            let res = await this.service.request.post("/setting");
            if (res.data.title)
                document.title = res.data.title;
        } catch (e) {
        }
    }

    public workflow_id: any;

    public view: any = {
        nav: 'drive',
        hideNav: false,
        plugin: null
    };

    public async switchNav(nav: string) {
        this.view.nav = nav;
        await this.service.render();
    }

    public async toggleNav() {
        this.view.hideNav = !this.view.hideNav;
        await this.service.render();
    }

    // define view for filetype
    public findExtMapper(extension) {
        extension = extension.toLowerCase();
        for (let key in this.extMapper)
            if (this.extMapper[key].match && this.extMapper[key].match(extension))
                return this.extMapper[key];
        return this.extMapper._default;
    }

    public extMapper: any = {
        // dizest workflow
        dwp: {
            match: (ext: string) => ext == 'dwp',
            sidebar: [
                { icon: 'fa-solid fa-book', title: 'Workflow Info', id: 'info', view: WorkflowInfoSidebar },
                { icon: 'fa-solid fa-code', title: 'Codeflow', id: 'codeflow', view: CodeFlowSidebar },
                { icon: 'fa-solid fa-stopwatch', title: 'Timer', id: 'timer', view: TimerSidebar },
                { icon: 'fa-brands fa-python', title: 'Packages', id: 'packages', view: PackagesSidebar },
            ],
            editor: async (tab: any) => {
                tab.rootTab = this.tab;
                tab.view = WorkflowEditor;
                tab.alert = this.statusbar.alert;
                tab.dizest = this.dizest;
                tab.socket = () => wiz.socket();
                tab.render = async () => await this.service.render();
                tab.sidebar = this.sidebar;
                tab.onCreatedRef = async (ref: any) => {
                    ref.instance.DrawflowNodeComponent = DrawflowNodeComponent;
                }
                let finded: any = this.tab.find(tab.id);
                tab = await this.tab.open(tab);
                if (!finded)
                    await this.switchNav('apps');
            }
        },
        video: {
            match: (ext: string) => ['mp4'].includes(ext),
            sidebar: [],
            editor: async (tab: any) => {
                tab.view = VideoEditor;
                tab.alert = this.statusbar.alert;
                tab.dizest = this.dizest;
                tab.render = async () => await this.service.render();
                tab.sidebar = this.sidebar;
                tab = await this.tab.open(tab);
            }
        },
        // image viewer
        image: {
            match: (ext: string) => ['png', 'jpg', 'jpeg', 'gif', 'ico', 'icon'].includes(ext),
            sidebar: [],
            editor: async (tab: any) => {
                tab.view = ImageEditor;
                tab.alert = this.statusbar.alert;
                tab.dizest = this.dizest;
                tab.render = async () => await this.service.render();
                tab.sidebar = this.sidebar;
                tab = await this.tab.open(tab);
            }
        },
        // default: text editor
        _default: {
            sidebar: [],
            editor: async (tab: any) => {
                tab.view = TextEditor;
                tab.alert = this.statusbar.alert;
                tab.dizest = this.dizest;
                tab.render = async () => await this.service.render();
                tab.sidebar = this.sidebar;
                tab = await this.tab.open(tab);
            }
        }
    }

    // UI Component Options
    public sidebar: any = {
        active: null,
        ref: null,
        toggle: async (item_id: string, forced: any = null) => {
            if (['setting', 'terminal'].includes(item_id)) {
                let tab = {
                    id: `.dizest/${item_id}`,
                    title: item_id,
                    extension: ''
                };

                if (item_id == 'setting') tab.view = SettingEditor;
                else if (item_id == 'terminal') {
                    tab.view = TerminalEditor;
                    tab.id = `.dizest/${item_id}/` + new Date().getTime();
                }

                tab.alert = this.statusbar.alert;
                tab.dizest = this.dizest;
                tab.render = async () => await this.service.render();
                tab.sidebar = this.sidebar;
                await this.tab.open(tab);
                await this.sidebar.toggle("codeflow", false);
                return;
            }

            let closeSidebar = async () => {
                this.sidebar.active = null;
                this.sidebarElement.nativeElement.innerHTML = "";
                if (this.sidebar.ref) this.sidebar.ref.destroy();
                await this.service.render();
            };

            if (forced === false) {
                await closeSidebar();
                return;
            }

            let item: any = null;
            let ext: string = this.tab.selected.extension;
            let data: any = this.findExtMapper(ext);
            for (let i = 0; i < data.sidebar.length; i++)
                if (data.sidebar[i].id == item_id) {
                    item = data.sidebar[i];
                    break;
                }

            if (!item) return;

            if (this.sidebar.active == item.id) {
                if (!forced) {
                    await closeSidebar();
                    return;
                }
            } else {
                await closeSidebar();
            }

            const ref = this.viewContainerRef.createComponent<NodeComponent>(item.view);

            let sidebar: any = {};
            sidebar.close = async () => {
                await closeSidebar();
            }

            sidebar.selected = this.tab.selected;

            ref.instance.sidebar = sidebar;
            let sidebarElement = ref.location.nativeElement;
            this.sidebarElement.nativeElement.innerHTML = "";
            this.sidebarElement.nativeElement.append(sidebarElement);

            this.sidebar.active = item.id;
            this.sidebar.ref = ref;
            await this.service.render();
        },
        render: () => {
            try {
                let ext = this.tab.selected.extension;
                let data = this.findExtMapper(ext);
                if (data && data.sidebar) return data.sidebar;
            } catch (e) {
            }
            return [];
        }
    };

    public tab: any = {
        onLoad: async () => { },
        on: async (action: string) => {
            if (action == 'open') {
                if (!this.tab.selected.workflow)
                    await this.switchNav('drive');
                if (this.tab.selected.id) {
                    await this.statusbar.setTitle(this.tab.selected.id, "fa-solid fa-hdd");
                } else {
                    await this.statusbar.setTitle("/", "fa-solid fa-hdd");
                    if (this.sidebar.active)
                        await this.sidebar.toggle(this.sidebar.active, false);
                }
            } else if (action == 'close') {
                let tabs: any = this.tab.list();
                let exists: boolean = false;
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].workflow) {
                        exists = true;
                        break;
                    }
                }
                if (!exists)
                    await this.switchNav('drive');
                await this.statusbar.setTitle("/", "fa-solid fa-hdd");
                if (this.sidebar.active)
                    await this.sidebar.toggle(this.sidebar.active, false);
            }

        }
    };

    public drive: any = {
        tab: this.tab,
        open: async (node: any, extension: string) => {
            let tab = {
                id: node.id,
                title: node.title,
                extension: extension
            };

            let extMapper: any = this.findExtMapper(extension);
            if (extMapper) tab = await extMapper.editor(tab);
            if (tab) await this.tab.open(tab);
            return true;
        }
    };

    public apps: any = {
        tab: this.tab
    };

    public statusbar: any = {
        onLoad: async () => {
            await this.statusbar.setTitle("/", "fa-solid fa-hdd");
            await this.statusbar.alert.info('dizest started', 2000);
            await this.service.render();
        }
    };

    public async bindShortcuts() {
        this.shortcuts.push({
            key: ["cmd + s", "ctrl + s"],
            preventDefault: true,
            command: async () => {
                if (!this.tab.selected) return;

                if (this.tab.selected.view == TextEditor) {
                    await this.statusbar.alert.info('update file', 2000);
                    let path = this.tab.selected.id;
                    let data = this.tab.selected.data;
                    await this.dizest.api.call(`drive`, `update_file`, { id: path, data: data });
                } else if (this.tab.selected.view == WorkflowEditor || this.tab.selected.view == UIModeEditor) {
                    let workflow = this.tab.selected.workflow;
                    let res = await workflow.update();
                    if (!res) {
                        await this.statusbar.alert.error('An error occurred while saving', 3000);
                        return;
                    }
                    await this.statusbar.alert.info('update workflow', 1000);
                }
            }
        }, {
            key: ["shift + enter"],
            preventDefault: true,
            command: async () => {
                if (!this.tab.selected || !this.tab.selected.workflow) return;
                let workflow = this.tab.selected.workflow;
                if (!workflow.flow.selected) return;
                let flow = workflow.flow.get(workflow.flow.selected);
                flow.status('pending');
                await flow.logclear();
                await flow.run();
            }
        }, {
            key: ["alt + w"],
            preventDefault: true,
            command: async () => {
                if (!this.tab.selected) return;
                if (this.tab.selected.workflow) {
                    let workflow = this.tab.selected.workflow;
                    if (workflow.flow.selected) {
                        let flow = workflow.flow.get(workflow.flow.selected);
                        workflow.codeflow.close(flow);
                        await workflow.flow.select();
                        return;
                    }
                }

                if (this.sidebar.active) {
                    await this.sidebar.toggle(this.sidebar.active, false);
                    return;
                }

                if (!this.sidebar.active && this.tab.selected.close)
                    await this.tab.selected.close();
            }
        }, {
            key: ["cmd + r", "ctrl + r"],
            preventDefault: true,
            command: async () => {
                if (!this.tab.selected || !this.tab.selected.workflow) return;
                let workflow = this.tab.selected.workflow;
                if (!workflow.flow.selected) return;
                let flow = workflow.flow.get(workflow.flow.selected);
                flow.status('pending');
                await flow.logclear();
                await flow.run();
            }
        }, {
            key: ["alt + 1"],
            preventDefault: true,
            command: async () => {
                await this.switchNav("drive");
            }
        }, {
            key: ["alt + 2"],
            preventDefault: true,
            command: async () => {
                await this.switchNav("apps");
            }
        }, {
            key: ["alt + 3"],
            preventDefault: true,
            command: async () => {
                await this.switchNav("health");
            }
        }, {
            key: ["cmd + 1", "ctrl + 1"],
            preventDefault: true,
            command: async () => {
                let tab = this.tab.findByIndex(0);
                if (tab) await tab.open();
            }
        }, {
            key: ["cmd + 2", "ctrl + 2"],
            preventDefault: true,
            command: async () => {
                let tab = this.tab.findByIndex(1);
                if (tab) await tab.open();
            }
        }, {
            key: ["cmd + 3", "ctrl + 3"],
            preventDefault: true,
            command: async () => {
                let tab = this.tab.findByIndex(2);
                if (tab) await tab.open();
            }
        }, {
            key: ["cmd + 4", "ctrl + 4"],
            preventDefault: true,
            command: async () => {
                let tab = this.tab.findByIndex(3);
                if (tab) await tab.open();
            }
        }, {
            key: ["cmd + 5", "ctrl + 5"],
            preventDefault: true,
            command: async () => {
                let tab = this.tab.findByIndex(4);
                if (tab) await tab.open();
            }
        }, {
            key: ["esc"],
            preventDefault: true,
            command: async () => {
                if (!this.tab.selected || !this.tab.selected.workflow) return;
                let workflow = this.tab.selected.workflow;
                await workflow.flow.select();
            }
        });

        for (let i = 0; i < this.shortcuts.length; i++)
            this.shortcuts[i].allowIn = ['TEXTAREA', 'INPUT', 'SELECT'];

        await this.service.render();
    }

}