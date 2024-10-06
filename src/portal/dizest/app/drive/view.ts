import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    @Input() dizest: any;
    @Input() config: any = {};

    constructor(public service: Service) { }

    public current: any;

    public async ngOnInit() {
        await this.service.init();
        await this.createNodeEvent();
        while (!this.tree.rootNode)
            await this.service.render(100);
        this.current = this.tree.rootNode();
    }

    public async createNodeEvent() {
        let status: any = {};
        status.showHidden = false;
        status.isCreateFile = false;
        status.selectedCreateTarget = null;
        status.createFileData = {};
        status.uploadStatus = {
            uploading: false,
            percent: 0
        };

        let obj: any = {};

        obj.toggleShowHidden = async () => {
            status.showHidden = !status.showHidden;
            await this.service.render();
        }

        obj.uploadProgress = async (percent: number, total: number, position: number) => {
            if (percent == 0) {
                status.uploadStatus.uploading = false;
                status.uploadStatus.percent = 0;
            } else if (percent == 100) {
                status.uploadStatus.uploading = false;
                status.uploadStatus.percent = 0;
            } else {
                status.uploadStatus.uploading = true;
                status.uploadStatus.percent = percent;
            }
            await this.service.render();
        }

        obj.upload = async (node: any) => {
            let files = await this.service.file.select();
            let fd = new FormData();
            for (let i = 0; i < files.length; i++) {
                if (!files[i].filepath) files[i].filepath = files[i].name;
                fd.append('file[]', files[i]);
            }
            let url = this.dizest.api.url('drive', 'upload/' + node.id);
            await this.service.file.upload(url, fd, obj.uploadProgress.bind(this));
            await node.refresh();
        }

        obj.create = async (node: any) => {
            node.newItem = { type: 'folder', root_id: node.id ? node.id : '' };
            await this.service.render();
        }

        obj.createFile = async (node: any) => {
            if (!status.isCreateFile) {
                status.isCreateFile = true;
                status.selectedCreateTarget = node;
                status.createFileData = { type: 'file', root_id: node.id ? node.id : '', title: '' };
                await this.service.render();
                return;
            }

            let fd: any = JSON.parse(JSON.stringify(status.createFileData));
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
            await status.selectedCreateTarget.refresh();
            await obj.cancelCreateFile();
        }

        obj.createFolder = async (node: any) => {
            let data: any = null;
            data = JSON.parse(JSON.stringify(node.newItem));
            delete node.newItem;
            if (!data.title) return;
            await this.dizest.api.call(`drive`, `create`, data);
            await node.refresh();
        }

        obj.cancelCreate = async (node: any) => {
            delete node.newItem;
            await this.service.render();
        }

        obj.cancelCreateFile = async () => {
            status.isCreateFile = false;
            status.selectedCreateTarget = null;
            status.createFileData = {};
            await this.service.render();
        }

        obj.delete = async (node: any) => {
            if (!await this.service.modal.error(`'${node.title}' ${node.type == 'folder' ? '폴더' : '파일'}을 삭제하시겠습니까?`, `취소`, `삭제`)) return;
            await node.flush();
            await this.dizest.api.call(`drive`, `delete`, { id: node.id });
            await node.parent().refresh();
        }

        obj.download = async (node: any) => {
            if (!node) node = this.rootNode;
            let url = this.dizest.api.url('drive', 'download/' + node.id);
            window.open(url, '_blank');
        }

        this.tree.status = status;
        this.tree.event = obj;
    }

    public tree: any = {
        status: { uploadStatus: {} },
        load: async (path: any) => {
            let res = await this.dizest.api.call(`drive`, `tree`, { path: path });
            return res;
        },
        update: async (node: any) => {
            let data = JSON.parse(JSON.stringify(node));
            let changed = data.title != data.rename;
            if (data.rename) data.title = data.rename;
            await this.dizest.api.call(`drive`, `update`, data);
            if (changed) await node.flush();
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
            await this.service.file.upload(url, fd, this.tree.event.uploadProgress.bind(this));
        },
        select: async (node: any) => {
            if (this.config.selected) {
                let ext = node.title.split('.');
                try {
                    ext = ext[ext.length - 1].toLowerCase();
                } catch (e) {
                    ext = '';
                }
                await this.config.selected(node, ext);
            }

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

                await this.tree.event.download(node);
            }
        },
        isShow: (node: any) => {
            if (this.tree.status.showHidden)
                return true;
            if (node.title[0] == ".") return false;
            return true;
        },
        isActive: (node: any) => {
            if (!this.current) return false;
            return node.id === this.current.id;
        }
    }

    public isFocused(item) {
        if (this.config.focused) {
            return this.config.focused(item);
        }
        return '';
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

    public extension(node: any) {
        let ext = node.title.split('.');
        try {
            ext = ext[ext.length - 1].toLowerCase();
        } catch (e) {
            ext = '';
        }
        return ext;
    }

}