import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import $ from "jquery";

export class Component implements OnInit {
    constructor(public service: Service) { }

    public BASEURL: any;
    public PATH: any;

    public inputs: any = [];
    public outputs: any = [];
    public values: any = {};
    public response: any;
    public running: boolean = false;
    public mode: string = 'run';

    @Input() app: any;
    @Input() sidebar: any;

    public async ngOnInit() {
        await this.service.init();
        this.BASEURL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        this.PATH = window.location.pathname.substring(10);
        this.PATH = this.PATH.substring(0, this.PATH.length - 4);
        await this.service.render();
    }

    public async onSidebarShow() {
        await this.load();
    }

    public async load() {
        const { code, data } = await wiz.call("load", { path: this.app.editor.path });

        this.values = {};
        this.running = false;
        this.response = "";

        this.inputs = [];
        for (let name in data.input)
            this.inputs.push({ name: name, flow: data.input[name] });

        this.outputs = [];
        for (let name in data.output)
            this.outputs.push({ name: name, flow: data.output[name] });

        await this.service.render();
    }

    public async clickFlow(flow_id: any) {
        this.app.workflow.node.selected = flow_id;
        await this.app.workflow.moveToFlow(flow_id);
        await this.service.render();
    }

    public async changeMode(mode: string) {
        this.mode = mode;
        await this.service.render();
    }

    public valueString() {
        return new URLSearchParams(this.values).toString()
    }

    public async testAPI() {
        if (this.running) {
            this.running = false;
            await this.service.render();
            return;
        }

        this.response = "";
        this.running = true;
        await this.service.render();

        try {
            let api_key = this.app.dizest.config.external_api_key;
            let url = `/dizest/api/${this.mode}/${this.PATH}`;

            if (this.mode == 'run') {
                let request = () => {
                    return new Promise((resolve) => {
                        $.ajax({
                            url: url,
                            type: "POST",
                            data: this.values,
                            headers: {
                                "Authorization": "Bearer " + api_key
                            }
                        }).always(function (res) {
                            resolve(res);
                        });
                    });
                }

                this.response = JSON.stringify(await request(), null, '\t');
            } else {
                const params = new URLSearchParams();
                for (let key in this.values) {
                    params.append(key, this.values[key]);
                }

                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        "Authorization": "Bearer " + api_key
                    },
                    body: params.toString()
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let read: any = async () => {
                    let { done, value } = await reader.read();
                    if (done) {
                        return;
                    }
                    const chunk = decoder.decode(value);
                    this.response += chunk;
                    await this.service.render();
                    await read();
                }

                await read();
            }

        } catch (e) {
        }

        this.running = false;
        await this.service.render();

    }

}