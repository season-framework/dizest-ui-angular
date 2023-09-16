import { OnInit, ElementRef, ViewChild } from '@angular/core';
import UIModeEditor from '@wiz/app/portal.dizest.editor.uimode';

export class Component implements OnInit {
    public scope: any = null;
    public flow: any = null;
    public app: any = null;

    @ViewChild('debug')
    public debugElement: ElementRef;

    constructor() { }

    public ngOnInit() { }

    public actionState() {
        if (this.app.ctrl.hovered) {
            let ishovered = this.app.hovered();
            if (ishovered) {
                return 'node-selected';
            }
            return 'node-transparent';
        }

        if (!this.flow.ctrl.selected && this.flow.status() == 'error') {
            return 'node-error';
        }

        let isselected = this.flow.selected();
        if (isselected)
            return 'node-selected';

        if (this.flow.ctrl.selected)
            return 'node-transparent';
        return '';
    }

    public inputs() {
        let app = this.app;
        return app.inputs();
    }

    public outputs() {
        let app = this.app;
        return app.outputs();
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

    public isActive() {
        return !this.flow.inactive();
    }

    public status() {
        return this.flow.status();
    }

    public index() {
        return this.flow.index();
    }

    public log() {
        return this.flow.log();
    }

    public data() {
        let flow = this.flow;
        return flow.data();
    }

    public async run() {
        this.flow.status('pending');
        await this.flow.logclear();
        await this.flow.run();
    }

    public async stop() {
        await this.flow.stop();
    }

    public async delete() {
        await this.flow.delete();
    }

    public async sorted() {
        await this.scope.drawflow.render();
    }

    public count(type: string) {
        if (type == 'input') type = 'output';
        let inputs = this.inputs();
        let counter = 0;
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].type == type) {
                counter++;
            }
        }
        return counter;
    }

    public async addVariable() {
        let app = this.app;
        app.inputs().push({ type: 'variable', name: 'undefined', inputtype: 'text', description: '' });
        await this.scope.service.render();
    }

    public async addInput() {
        let app = this.app;
        app.inputs().push({ type: 'output', name: 'undefined' });
        await this.scope.service.render();
    }

    public async addOutput() {
        let app = this.app;
        app.outputs().push({ name: 'undefined' });
        await this.scope.service.render();
    }

    public async removeInput(item: any) {
        let app = this.app;
        app.inputs().remove(item);
        await this.scope.service.render();
    }

    public async removeOutput(item: any) {
        let app = this.app;
        app.outputs().remove(item);
        await this.scope.service.render();
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
        await this.scope.service.render();
    }

    public async variableConfigureChanged() {
        await this.scope.service.render();
    }

    public async selectFile(value: any) {
        let data = this.flow.data()[value.name]
        let res = await this.scope.showDrive(value, data);
        this.flow.data()[value.name] = res;
        await this.scope.service.render();
    }

    public async code() {
        await this.scope.tab.sidebar.toggle('codeflow', true);
        await this.scope.workflow.codeflow.open(this.flow);
        await this.scope.workflow.codeflow.find(this.flow.id());
    }

    public async uimode() {
        let rootTab: any = this.scope.tab.rootTab;

        let pretab = rootTab.find(this.scope.tab.id, UIModeEditor);
        if (pretab) await pretab.close();

        let tab: any = {
            id: this.scope.tab.id,
            title: this.flow.title(),
            extension: this.scope.tab.extension,
            workflow: this.scope.tab.workflow,
            dizest: this.scope.tab.dizest,
            render: async () => await this.service.render(),
            flow: this.flow,
            view: UIModeEditor
        };

        await rootTab.open(tab);
        if (this.scope.tab.sidebar.active)
            await this.scope.tab.sidebar.toggle(this.scope.tab.sidebar.active, false);
    }

}