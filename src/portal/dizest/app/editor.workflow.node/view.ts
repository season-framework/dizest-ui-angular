import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { ElementRef, ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

export class Component implements OnInit {
    constructor(public service: Service, public sanitizer: DomSanitizer) { }

    @ViewChild('rootelement')
    public rootElement: ElementRef;

    @Input() workflow: any;
    @Input() flow: any;

    public log: any = [];
    public status: any = 'idle';
    public index: any = -1;
    public isUIMode: boolean = false;
    public uiModeSrc: any;

    public async ngOnInit() {
        await this.service.init();

        this.rootElement.nativeElement.style.width = this.flow.width() + "px";
        if (this.flow.raw().height)
            this.rootElement.nativeElement.style.height = this.flow.raw().height + "px";
    }

    public async eventHandler(eventname: string, data: any) {
        if (eventname == 'log.clear') {
            this.log = [];
        } else if (eventname == 'log.append') {
            data = data.replace('text-red', 'text-red-500');
            this.log.push(data);
            this.log = this.log.splice(this.log.length - 51 > 0 ? this.log.length - 51 : 0);
            await this.service.render();
            let debug = this.rootElement.nativeElement.querySelector('.debug-message');
            debug.scrollTop = debug.scrollHeight;
        } else if (eventname == 'flow.status') {
            this.status = data;
        } else if (eventname == 'flow.index') {
            this.index = data;
        }
        await this.service.render();
    }

    public async optionSelectEvent(item, value) {
        this.flow.data()[item.name] = value;
        await this.service.render();
    }

    public optionSelectValue(opts, value) {
        let map = {};
        for (let i = 0; i < opts.length; i++) {
            map[opts[i].value] = opts[i].key;
        }
        return map[value] ? map[value] : 'Undefined';
    }

    public options(vals: any) {
        let res = [];
        try {
            vals = vals.replace(/\n/gim, ",").split(",");
            for (let j = 0; j < vals.length; j++) {
                vals[j] = vals[j].split(":");
                let listkey = vals[j][0].trim();
                let listval = listkey;
                if (vals[j].length == 2) {
                    listval = vals[j][1].trim();
                }

                if (!listkey || !listval) continue;

                vals[j].key = listkey;
                vals[j].value = listval;
                res.push(vals[j]);
            }
        } catch (e) {
        }
        return res;
    }

    public async run() {
        if (this.status != 'idle') {
            await this.stop();
        } else {
            this.workflow.app.interrupt = false;
            let flow_id: string = this.flow.id();
            this.status = 'pending';
            this.log = [];
            await this.service.render();
            await this.workflow.update();
            await this.workflow.api('flow/run', { flow_id: flow_id });
        }
    }

    public async stop() {
        if (this.status == 'idle') {
            await this.run();
        } else {
            this.workflow.app.interrupt = false;
            let flow_id: string = this.flow.id();
            await this.workflow.api('flow/stop', { flow_id: flow_id });
        }
    }

    public async delete() {
        await this.workflow.node.delete(this.flow);
    }

    public async code() {
        let view = this.workflow.app.sidebar.get('code');
        if (!view.items) view.items = [];
        if (!view.isOpen)
            await this.workflow.app.sidebar.open('code');
        if (!view.items.includes(this.flow.id()))
            view.items.push(this.flow.id());
        this.workflow.node.selected = this.flow.id();
        await this.service.render();
    }

    // ui mode codes
    public async uimode() {
        if (this.isUIMode) {
            this.isUIMode = false;
            await this.service.render();
            return;
        }

        let flow_id = this.flow.id();
        let kernel_id = this.workflow.data().kernel_id;
        let url = `/ui/${kernel_id}/${flow_id}/render`;
        this.uiModeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isUIMode = true;
        await this.service.render();
    }

    public async uimodeReload() {
        let flow_id = this.flow.id();
        let kernel_id = this.workflow.data().kernel_id;
        let url = `/ui/${kernel_id}/${flow_id}/render`;
        this.uiModeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isUIMode = true;
        await this.service.render();
    }

    public async uimodeOpen() {
        let flow_id = this.flow.id();
        let kernel_id = this.workflow.data().kernel_id;
        let url = `/ui/${kernel_id}/${flow_id}/render`;
        window.open(url, '_blank');
        this.isUIMode = false;
        await this.service.render();
    }

    // variables & inputs & outputs
    public async addVariable() {
        let app = this.flow.app();
        app.inputs().push({ type: 'variable', name: 'undefined', inputtype: 'text', description: '' });
        await this.service.render();
        this.autoResize();
    }

    public async addInput() {
        let app = this.flow.app();
        app.inputs().push({ type: 'output', name: 'undefined' });
        await this.service.render();
        this.autoResize();
    }

    public async addOutput() {
        let app = this.flow.app();
        app.outputs().push({ name: 'undefined' });
        await this.service.render();
        this.autoResize();
    }

    public async removeInput(item: any) {
        let app = this.flow.app();
        app.inputs().remove(item);
        await this.service.render();
        this.autoResize();
        this.workflow.drawflow.updateConnectionNodes('node-' + this.flow.id());
    }

    public async removeOutput(item: any) {
        let app = this.flow.app();
        app.outputs().remove(item);
        await this.service.render();
        this.autoResize();
        this.workflow.drawflow.updateConnectionNodes('node-' + this.flow.id());
    }

    public async variableConfigure(item: any) {
        if (item.inputtype == 'list') {
            if (item.conf && item.cache) {
                let vals = item.cache;
                for (let i = 0; i < vals.length; i++) {
                    if (!vals[i].value) vals[i].value = vals[i].key;
                    if (!vals[i].key) vals[i].key = vals[i].value;
                    vals[i] = vals[i].key + ":" + vals[i].value;
                }
                item.description = vals.join(",");
                delete item.cache;
            } else {
                item.cache = this.options(item.description);
            }
        }
        item.conf = !item.conf;
        await this.service.render();
    }

    public async variableConfigureChanged(item) {
        if (item.inputtype == 'list') {
            if (!item.cache) {
                item.cache = this.options(item.description);
            }
        }
        await this.service.render();
    }

    public async selectFile(value) {
        let prevalue = this.flow.data()[value.name];
        let path = await this.workflow.app.drive.show(prevalue);
        this.flow.data()[value.name] = path;
        await this.service.render();
    }

    // resize node
    public resizing: boolean = false;

    public async autoResize() {
        const boxElement = this.rootElement.nativeElement;
        const headerElement = this.rootElement.nativeElement.querySelector(".node-header");
        const debugElement = this.rootElement.nativeElement.querySelector(".debug-inner");

        let minHeight = headerElement.offsetHeight + (debugElement.offsetHeight > 120 ? 120 : debugElement.offsetHeight) + 8;
        let newHeight = boxElement.offsetHeight;

        if (newHeight < minHeight) newHeight = minHeight;
        this.flow.raw().height = newHeight;
        boxElement.style.height = newHeight + 'px';
    }

    public async resize(event: MouseEvent) {
        this.resizing = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        event.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (!this.resizing) return;

        const deltaX = event.clientX - this.lastX;
        const deltaY = event.clientY - this.lastY;

        const boxElement = this.rootElement.nativeElement;
        const headerElement = this.rootElement.nativeElement.querySelector(".node-header");
        const debugElement = this.rootElement.nativeElement.querySelector(".debug-inner");

        let minHeight = headerElement.offsetHeight + (debugElement.offsetHeight > 120 ? 120 : debugElement.offsetHeight) + 8;

        let newWidth = boxElement.offsetWidth + deltaX;
        let newHeight = boxElement.offsetHeight + deltaY;

        if (newWidth < 260) newWidth = 260;
        if (newHeight < minHeight) newHeight = minHeight;

        this.flow.raw().width = newWidth;
        this.flow.raw().height = newHeight;

        boxElement.style.width = newWidth + 'px';
        boxElement.style.height = newHeight + 'px';

        this.workflow.drawflow.updateConnectionNodes('node-' + this.flow.id());

        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }

    @HostListener('document:mouseup')
    onMouseUp(): void {
        this.resizing = false;
    }

    public checkOpacity() {
        let workflow = this.workflow;
        let flow = this.flow;

        if (workflow.selectedApp) {
            if (workflow.selectedApp.id != flow.app().id())
                return true;
            return false;
        }

        if (workflow.node.selected) {
            if (workflow.node.selected != flow.id())
                return true;
        }
        return false;
    }
}