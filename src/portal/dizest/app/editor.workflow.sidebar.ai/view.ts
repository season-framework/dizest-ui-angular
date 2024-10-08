import { OnInit, Input } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Markdown } from '@wiz/libs/portal/dizest/ui/md';
import showdown from 'showdown';

export class Component implements OnInit {
    constructor(public service: Service) { }

    @ViewChild('scroll')
    public scrollElement: ElementRef;


    @Input() app: any;
    @Input() sidebar: any;

    public query: string = '';
    public running: boolean = false;
    public messages: any = [];

    public async ngOnInit() {
        await this.service.init();
        this.workflow = this.app.workflow;
        await this.service.render();
    }

    public showdown(text) {
        let converter = new showdown.Converter();
        return converter.makeHtml(text);
    }

    public async createLLMData(flow, target) {
        let res = {};
        res.flow_id = flow.id();
        res.code = flow.app().raw()[target];
        res.selection = '';
        let editor = flow.editor;
        if (!editor) return res;
        const selection = editor.getSelection();
        res.selection = editor.getModel().getValueInRange(selection);
        return res;
    }

    public async request() {
        if (!this.query) return;
        if (this.running) {
            this.running = false;
            await this.service.render();
            return;
        }

        let text = this.query + '';
        let context = null;
        try {
            let { flow, codeflow } = await this.app.sidebar.get('code').getFlow();
            let target: any = 'code';
            if (codeflow && codeflow.target) target = codeflow.target;
            let ref = await this.createLLMData(flow, target);
            context = this.app.dizest.config.llm_help_text;
            if (!context) context = "Please refer to the code currently under development below when answering the question."
            if (ref.selection) context += "\n\n#### Highlighted Code:\n```python\n" + ref.selection + "\n```";
            if (ref.code) context += "\n\n#### Entire Code:\n```python\n" + ref.code + "\n```";
        } catch (e) {
            context = null;
        }

        this.running = true;
        this.messages.push({
            mode: 'user',
            data: this.showdown(text),
            context: this.showdown(context)
        });
        await this.service.render(this.query = '');

        let element = this.scrollElement.nativeElement;
        element.scrollTop = element.scrollHeight;

        const params = new URLSearchParams();
        params.append('query', text);
        params.append('context', context);
        params.append('stream', true);

        let item: any = { mode: 'system', data: '', stream: '' };
        this.messages.push(item);

        let response = await fetch(wiz.url("request"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let read: any = async () => {
            let { done, value } = await reader.read();
            if (done || !this.running) {
                item.data = this.showdown(item.stream);
                this.running = false;
                await this.service.render();
                return;
            }
            const chunk = decoder.decode(value);
            item.stream += chunk;
            item.data = this.showdown(item.stream);
            await this.service.render();
            await read();
        }

        await read();
    }

    public async clear() {
        let res = await this.service.modal.show({
            title: "Are you sure?",
            cancel: 'Cancel',
            message: "Do you really want to clear log? What you've done cannot be undone."
        });
        if (!res) return;

        this.messages = [];
        await this.service.render();
    }

    public async download() {
        let css = new Markdown().css();
        let data = `
        <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                <div class="markdown-body" style="padding: 24px;">`;
        for (let i = 0; i < this.messages.length; i++) {
            let item = this.messages[i];
            if (item.mode == 'user') {
                data += `<h4>Question</h4>`;
                data += item.data;
                if (item.context) {
                    data += `<h5>Context</h5>`;
                    data += item.context;
                }
                data += "<hr/>"
            } else {
                data += `<h4>Answer</h4>`;
                data += item.data;
                data += "<hr/>"
            }
        }

        data += "</div></body></html>";

        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "dizestqna.html";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}