import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, FileDataSource } from '@wiz/libs/dizest/file';

@dependencies({
    MatTreeModule: '@angular/material/tree'
})
export class Component implements OnInit {
    @Input() workflow: any;

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

    constructor(public service: Service) { }

    // dropdown
    public isOpen: boolean = false;
    public async toggle() {
        this.isOpen = !this.isOpen;
        await this.service.render();
    }

    public active(node: FileNode | null) {
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

    public async open(node: FileNode) {
        if (!node) node = this.rootNode;
        let url = this.API.url('download/' + node.path);
        window.open(url, '_blank');
    }

    public async download(node: FileNode | null) {
        if (!node) node = this.rootNode;
        let url = this.API.url('download/' + node.path);
        window.open(url, '_blank');
    }

    public async delete(node: FileNode) {
        await this.API.call(`remove/${node.parent.path}`, { name: node.name });
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
            await this.refresh(node);
        } else {
            if (!this.treeControl.isExpanded(node))
                await this.dataSource.toggle(node, true);
            let newitem = new FileNode('', node.path, 'new.' + type, node, node.level + 1);
            await this.dataSource.prepend(newitem, node);
        }
    }

    public async refresh(node: FileNode | null = null) {
        if (node && node.parent) {
            await this.dataSource.toggle(node.parent, false);
            await this.dataSource.toggle(node.parent, true);
        } else {
            let data = await this.list(this.rootNode);
            this.dataSource.data = data;
        }
    }

    public async loader(status) {
        this.loading = status;
        await this.scope.render();
    }

    public async ngOnInit() {
        this.API = this.workflow.DRIVE_API;
        this.rootNode = new FileNode('root', this.path, 'folder');
        this.treeControl = new FlatTreeControl<FileNode>(this.getLevel, this.isExpandable);
        this.dataSource = new FileDataSource(this);
        let data = await this.list(this.rootNode);
        this.dataSource.data = data;
    }

}