import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @Input() dizest: Dizest;
    @Input() config: any = {};

    public async ngOnInit() {
        await this.service.init();
        while (!this.treeConfig.rootNode)
            await this.service.render(100);
        this.current = this.treeConfig.rootNode();
    }

    public async alert(message: string, action: string = '확인') {
        return await this.service.alert.show({
            title: "",
            message: message,
            cancel: "취소",
            actionBtn: "error",
            action: action,
            status: "error"
        });
    }

    public extension(node: any) {
        let ext = node.title.split('.');
        try {
            ext = ext[ext.length - 1].toLowerCase();
        } catch (e) {
            ext = '';
        }
        return ext;
    }

    public icon(node: any, checkopen: boolean = true) {
        if (node.type == 'folder') {
            if (node.isOpen() && checkopen)
                return 'fa-regular fa-folder-open';
            else
                return 'fa-solid fa-folder';
        }

        let ext = this.extension(node);
        if (ext == 'dwp') {
            if (this.dizest.active)
                if (this.dizest.active[node.id]) {
                    if (this.dizest.active[node.id].status == 'pending')
                        return 'fa-solid fa-circle-pause text-yellow';
                    if (this.dizest.active[node.id].status == 'idle')
                        return 'fa-solid fa-cube text-blue';
                    return 'fa-solid fa-circle-play text-blue';
                }
            return 'fa-solid fa-cube';
        }
        return 'fa-regular fa-file-lines';
    }

    public treeConfig: any = {
        load: async (path: any) => {
            let res = await this.dizest.api.call(`drive`, `tree`, { path: path });
            await this.dizest.loadActive();
            return res;
        },
        update: async (node: any) => {
            let data = JSON.parse(JSON.stringify(node));
            let changed = data.title != data.rename;
            if (data.rename) data.title = data.rename;

            let pre_id: string = node.id;
            let new_id: string = (node.root_id ? node.root_id + "/" : "") + data.title;

            if (new_id != pre_id) {
                let ptab = this.config.tab.find(pre_id);
                if (ptab) {
                    ptab.id = new_id;
                    ptab.title = data.title;
                    if (ptab.workflow) {
                        ptab.workflow.id = new_id;
                        ptab.workflow.data.id = new_id;
                    }
                }
            }

            await this.dizest.api.call(`drive`, `update`, data);
            if (changed) await node.flush();

            let ext = this.extension(node);
            if (ext == 'dwp') {
                let tab = this.config.tab.find(new_id);

                let workflow = null;
                if (tab && tab.workflow) {
                    workflow = tab.workflow;
                } else {
                    workflow = await this.dizest.workflow(new_id);
                    await workflow.init();
                    await workflow.update();
                }

                let workflowRestart: any = async () => {
                    await workflow.stop();
                    await workflow.kill(false);
                    await workflow.load();
                    await this.service.render();
                    await workflow.start();
                    await this.service.render();
                }

                if (workflow.status != 'stop') {
                    workflowRestart();
                }
                await this.service.render();
            }

            await this.dizest.loadActive();
            await this.service.render();
        },
        upload: async (node: any, files: any) => {
            if (node.type == 'file')
                node = node.parent();
            let fd = new FormData();
            let filepath = [];
            for (let i = 0; i < files.length; i++) {
                if (!files[i].filepath) files[i].filepath = files[i].name;
                filepath.push(files[i].filepath);
                fd.append('file[]', files[i]);
            }

            fd.append('path', JSON.stringify(filepath));
            let url = this.dizest.api.url('drive', 'upload/' + node.id);
            await this.service.file.upload(url, fd, this.uploadProgress.bind(this));
        },
        select: async (node: any) => {
            if (node.type == 'folder') {
                if (node.id != this.current.id)
                    await node.toggle();
            } else {
                if (this.config.open) {
                    let ext = node.title.split('.');
                    try {
                        ext = ext[ext.length - 1].toLowerCase();
                    } catch (e) {
                        ext = '';
                    }

                    let res = await this.config.open(node, ext);
                    if (res) return;
                }

                await this.download(node);
            }
        },
        isShow: (node: any) => {
            if (this.showHidden)
                return true;
            if (node.title[0] == ".") return false;
            return true;
        },
        isActive: (node: any) => {
            if (this.config.tab.selected.id == node.id) return true;
            if (!this.current) return false;
            return node.id === this.current.id;
        }
    }

    public showHidden: boolean = false;
    public current: any;

    public async toggleShowHidden() {
        this.showHidden = !this.showHidden;
        await this.service.render();
    }

    public async create(node: any, onTree: boolean = true) {
        node.newItem = { type: 'folder', root_id: node.id ? node.id : '' };
        await this.service.render();
    }

    public isCreateFile: boolean = false;
    public selectedCreateTarget: any;
    public createFileData: any = {};

    public async createFile(node: any) {
        if (!this.isCreateFile) {
            this.isCreateFile = true;
            this.selectedCreateTarget = node;
            this.createFileData = { type: 'file', root_id: node.id ? node.id : '', title: '' };
            await this.service.render();
            return;
        }

        let fd: any = JSON.parse(JSON.stringify(this.createFileData));
        if (fd.type == "workflow") {
            let data: any = {
                apps: {},
                description: '',
                featured: '',
                flow: {},
                logo: '',
                title: fd.title + '',
                version: '',
                visibility: 'private',
                extra: {},
                favorite: '0',
                category: ''
            };
            fd.data = JSON.stringify(data);
            fd.title = fd.title + ".dwp";
        } else {
            fd.data = "";
        }

        await this.dizest.api.call(`drive`, `create`, fd);
        await this.selectedCreateTarget.refresh();
        await this.cancelCreateFile();
    }

    public async cancelCreateFile() {
        this.isCreateFile = false;
        this.selectedCreateTarget = null;
        this.createFileData = {};
        await this.service.render();
    }

    public async createFolder(node: any, onTree: boolean = true) {
        let data: any = null;
        data = JSON.parse(JSON.stringify(node.newItem));
        delete node.newItem;
        if (!data.title) return;
        await this.dizest.api.call(`drive`, `create`, data);
        await node.refresh();
    }

    public async cancelCreate(node: any, onTree: boolean = true) {
        delete node.newItem;
        await this.service.render();
    }

    public async delete(node: any) {
        if (!await this.alert(`'${node.title}' ${node.type == 'folder' ? '폴더' : '파일'}을 삭제하시겠습니까?`, `삭제`)) return;
        await node.flush();
        await this.dizest.api.call(`drive`, `delete`, { id: node.id });
        await node.parent().refresh();
    }

    public async rename(node: any) {
        node.editable = true;
        await this.service.render();
    }

    public async download(node: any) {
        if (!node) node = this.rootNode;
        let url = this.dizest.api.url('drive', 'download/' + node.id);
        window.open(url, '_blank');
    }

    public uploadStatus: any = {
        uploading: false,
        percent: 0
    };

    public async upload(node: any) {
        let files = await this.service.file.select();
        let fd = new FormData();
        for (let i = 0; i < files.length; i++) {
            if (!files[i].filepath) files[i].filepath = files[i].name;
            fd.append('file[]', files[i]);
        }
        let url = this.dizest.api.url('drive', 'upload/' + node.id);
        await this.service.file.upload(url, fd, this.uploadProgress.bind(this));
        await node.refresh();
    }

    public async uploadProgress(percent: number, total: number, position: number) {
        if (percent == 0) {
            this.uploadStatus.uploading = false;
            this.uploadStatus.percent = 0;
        } else if (percent == 100) {
            this.uploadStatus.uploading = false;
            this.uploadStatus.percent = 0;
        } else {
            this.uploadStatus.uploading = true;
            this.uploadStatus.percent = percent;
        }
        await this.service.render();
    }
}