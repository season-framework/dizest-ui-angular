import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, FileDataSource } from '@wiz/libs/dizest/file';

import toastr from 'toastr';

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-bottom-left",
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

@dependencies({
    MatTreeModule: '@angular/material/tree'
})
export class Component implements OnInit {
    @Input() workflow: any;
    @Input() mode: any = 'browser';
    @Input() binding: any = {};

    public API: any;
    public path: string = '.';

    public loading: boolean = false;
    public rootNode: FileNode;

    private treeControl: FlatTreeControl<FileNode>;
    private dataSource: FileDataSource;
    private getLevel = (node: FileNode) => node.level;
    private isExpandable = (node: FileNode) => node.extended;
    private isFolder = (_: number, node: FileNode) => node.type == 'folder';
    private isNew = (_: number, node: FileNode) => node.type == 'new.folder' || node.type == 'new.file';
    public rootStyle = { 'padding-top': '16px' };
    public alert: any;

    constructor(public service: Service) {
        this.alert = this.service.alert.localize({
            title: "Are you sure?",
            message: "Do you really want to remove files? What you've done cannot be undone."
        });
    }

    // dropdown
    public isOpen: boolean = false;
    public async toggle() {
        this.isOpen = !this.isOpen;
        await this.service.render();
    }

    public active(node: FileNode | null) {
        if (this.mode == 'browser')
            return node.active;
        if (this.binding.selected)
            return this.binding.selected.path == node.path;
        return false;
    }

    public async list(node: FileNode) {
        let { data } = await this.API.call(`ls/${node.path}`);
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
                toastr.error("invalid filename");
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

        this.API = this.workflow.DRIVE_API;
        this.rootNode = new FileNode('root', this.path, 'folder');
        this.treeControl = new FlatTreeControl<FileNode>(this.getLevel, this.isExpandable);
        this.dataSource = new FileDataSource(this);
        let data = await this.list(this.rootNode);
        this.dataSource.data = data;
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
            toastr.error("Error on change path");
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
        await this.refresh(node);
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