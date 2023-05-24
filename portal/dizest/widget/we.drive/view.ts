import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Dizest } from '@wiz/libs/portal/dizest/dizest';
import { Workflow } from '@wiz/libs/portal/dizest/workflow';

import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, FileDataSource } from '@wiz/libs/portal/dizest/external/file';

export class Component implements OnInit {
    @Input() mode: any = 'browser';
    @Input() binding: any = {};

    public path: string = '.';
    public loading: boolean = false;
    public showHiddenFile: boolean = false;

    constructor(
        public service: Service,
        public workflow: Workflow,
        public dizest: Dizest
    ) {
        this.alert = this.service.alert.localize({
            title: "Are you sure?",
            cancel: 'Cancel',
            message: "Do you really want to remove app? What you've done cannot be undone."
        });
    }

    public rootNode: FileNode;

    public alert: any;
    private treeControl: FlatTreeControl<FileNode>;
    private dataSource: FileDataSource;
    private getLevel = (node: FileNode) => node.level;
    private isExpandable = (node: FileNode) => node.extended;
    private isFolder = (_: number, node: FileNode) => node.type == 'folder';
    private isNew = (_: number, node: FileNode) => node.type == 'new.folder' || node.type == 'new.file';
    public rootStyle = { 'padding-top': '16px' };

    public isOpen: boolean = false;
    public async toggle() {
        this.isOpen = !this.isOpen;
        await this.service.render();
    }

    public async toggleHiddenFile() {
        this.showHiddenFile = !this.showHiddenFile;
        await this.service.render();
    }

    public isShowHiddenFile(item) {
        if (this.showHiddenFile) {
            return true;
        }
        if (item.name[0] == ".")
            return false;
        return true;
    }

    public API: any = ((obj: any = {}) => {
        obj.url = (fnname) => {
            let url = '/dizest/drive/' + fnname;
            return url;
        }

        obj.call = async (fnname, data) => {
            let url = '/dizest/drive/' + fnname;
            return await this.workflow.request(url, data);
        }

        return obj;
    })();

    public active(node: FileNode | null) {
        if (this.mode == 'browser')
            return node.active;
        if (this.binding.selected)
            return this.binding.selected.path == node.path;
        return false;
    }

    public async list(node: FileNode) {
        let { code, data } = await this.API.call(`ls/${node.path}`);
        if (code != 200) return;
        data = data.map(item => new FileNode(item.name, `${node.path}/${item.name}`, item.type, node, node.level + 1));
        data.sort((a, b) => {
            if (a.type == b.type)
                return a.path.localeCompare(b.path);
            if (a.type == 'folder') return -1;
            if (b.type == 'folder') return 1;
        });
        return data;
    }

    public async select(node: FileNode) {
        this.binding.selected = node;
        await this.service.render();
    }

    public async open(node: FileNode) {
        this.binding.selected = node;
        if (this.mode == 'browser') {
            if (!node) node = this.rootNode;
            let url = this.API.url('download/' + node.path);
            window.open(url, '_blank');
        } else {
            await this.service.render();
        }
    }

    public async download(node: FileNode | null) {
        if (!node) node = this.rootNode;
        let url = this.API.url('download/' + node.path);
        window.open(url, '_blank');
    }

    public async delete(node: FileNode) {
        if (node.type != "new.folder" && node.type != "new.file") {
            let res = await this.alert.show({
                title: "Are you sure?",
                message: "Do you really want to remove files? What you've done cannot be undone."
            });
            if (!res) return;
            await this.API.call(`remove/${node.parent.path}`, { name: node.name });
        }
        await this.dataSource.delete(node);
    }

    public async create(node: FileNode | null, type: any) {
        if (!node) {
            let newitem = new FileNode('', this.rootNode.path, 'new.' + type, null, 0);
            await this.dataSource.prepend(newitem, null);
            return;
        }

        if (node.type == "new.folder" || node.type == "new.file") {
            let type = node.type.split(".")[1];
            let path = node.path + "/" + node.name;
            let { code } = await this.API.call(`create/${node.path}`, { name: node.name });
            if (code != 200) {
                this.service.toast.error("invalid filename");
                return;
            }

            await this.dataSource.delete(node);
            await this.refresh(node.parent);
        } else {
            if (!this.treeControl.isExpanded(node))
                await this.dataSource.toggle(node, true);
            let newitem = new FileNode('', node.path, 'new.' + type, node, node.level + 1);
            await this.dataSource.prepend(newitem, node);
        }
    }

    public async refresh(node: FileNode | null = null) {
        if (node) {
            await this.dataSource.toggle(node, false);
            await this.dataSource.toggle(node, true);
        } else {
            let data = await this.list(this.rootNode);
            this.dataSource.data = data;
        }
        await this.service.render();
    }

    public async loader(status) {
        this.loading = status;
        await this.service.render();
    }

    public async ngOnInit() {
        if (this.mode != 'browser')
            this.rootStyle = {};

        this.rootNode = new FileNode('root', this.path, 'folder');
        this.treeControl = new FlatTreeControl<FileNode>(this.getLevel, this.isExpandable);
        this.dataSource = new FileDataSource(this);
        let data = await this.list(this.rootNode);
        this.dataSource.data = data;
        let startpath = "./" + this.binding.target;

        let depth = 0;
        let isfinded = false;
        let toggled: any = {};
        while (!isfinded) {
            for (let node of this.dataSource.data) {
                if (toggled[node.path]) continue;

                if (node.path == startpath) {
                    isfinded = true;
                    await this.select(node);
                    break;
                }

                if (startpath.includes(node.path)) {
                    await this.dataSource.toggle(node, true);
                    toggled[node.path] = true;
                }

            }

            depth++;
            if (depth > 10) break;
        }

    }

    public donothover: boolean = false;

    public async move(node: FileNode) {
        let { name, rename, path } = node;
        if (name == rename) {
            node.editable = false;
            return;
        }

        let to: any = path.split("/");
        to[to.length - 1] = rename;
        to = to.join("/");
        let parent_path = to.split("/").slice(0, to.split("/").length - 1).join("/");

        let { code } = await this.API.call(`rename/${node.parent.path}`, { name: name, rename: rename });

        if (code !== 200) {
            this.service.toast.error("Error on change path");
            return;
        }

        node.parent = null;
        for (let i = 0; i < this.dataSource.data.length; i++) {
            if (this.dataSource.data[i].path == parent_path) {
                node.parent = this.dataSource.data[i];
                break;
            }
        }

        await this.dataSource.delete(node);
        await this.refresh(node.parent);
    }

    public async upload(node: FileNode, files: any) {
        await this.loader(true);
        let fd = new FormData();
        let filepath = [];
        for (let i = 0; i < files.length; i++) {
            if (!files[i].filepath) files[i].filepath = files[i].name;
            fd.append('file[]', files[i]);
            filepath.push(files[i].filepath);
        }
        fd.append("filepath", JSON.stringify(filepath));

        let url = this.API.url('upload/' + node.path);
        await this.service.file.upload(url, fd);
        if (node.name == 'root') {
            await this.refresh();
        } else {
            await this.refresh(node);
        }
        await this.loader(false);
    }

    public async file(node: FileNode | null = null) {
        if (!node) node = this.rootNode;
        let files = await this.service.file.select();
        await this.upload(node, files);
    }

    public async drop($event, node: FileNode | null = null) {
        $event.stopPropagation();
        $event.preventDefault();
        if (!node) node = this.rootNode;
        let files = await this.service.file.drop($event);
        await this.upload(node, files);
    }

    public async dragover($event, node: FileNode | null = null) {
        $event.stopPropagation();
        $event.preventDefault();
        if (!node) node = this.rootNode;
    }

    public async dragenter($event, node: FileNode | null = null) {
        $event.stopPropagation();
        $event.preventDefault();
        if (!node) node = this.rootNode;
        node.active = true;
        this.donothover = true;
        await this.service.render();
    }

    public async dragleave($event, node: FileNode | null = null) {
        $event.stopPropagation();
        $event.preventDefault();
        if (!node) node = this.rootNode;
        node.active = false;
        this.donothover = false;
        await this.service.render();
    }

}