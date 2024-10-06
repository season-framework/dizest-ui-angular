import { OnInit, OnDestroy, Input } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';

export class Component implements OnInit, OnDestroy {
    constructor(public service: Service) { }

    @Input() dizest: any;
    @Input() editor: any = {};

    @ViewChild('terminal')
    public terminal: ElementRef;

    public socket: any;
    public term: any;
    public fit: any;
    public namespace: any;

    public async socketEmit(channel: string, data: any = {}) {
        data.namespace = this.namespace;
        this.socket.emit(channel, data);
    }

    public async ngOnInit() {
        await this.service.init();
        await this.service.render();

        const generateRandomString = (num) => {
            const characters = 'abcdefghijklmnopqrstuvwxyz';
            let result = '';
            const charactersLength = characters.length;
            for (let i = 0; i < num; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        this.namespace = generateRandomString(8);

        const modw = 9;
        const modh = 17;

        let { offsetWidth, offsetHeight } = this.terminal.nativeElement;

        let cols = Math.floor(offsetWidth / modw) - 1;
        let rows = Math.floor(offsetHeight / modh);

        await this.service.render();
        const term = new Terminal({ cursorBlink: true, macOptionIsMeta: true });
        const fit = new FitAddon();
        term.loadAddon(new WebLinksAddon());
        term.loadAddon(new SearchAddon());
        term.loadAddon(fit);

        term.resize(cols, rows);

        term.open(this.terminal.nativeElement);
        term.writeln("Welcome to dizest terminal!");
        term.writeln('');

        const socket = wiz.socket();

        term.onData((data) => {
            this.socketEmit("ptyinput", { input: data })
        });

        socket.on("ptyoutput", async (data) => {
            term.write(data.output);
        });

        socket.on("exit", async (data) => {
            await this.editor.close();
        });

        socket.on("connect", () => {
            fitToscreen();
            const dims = { cols: term.cols, rows: term.rows };
            this.socketEmit("join");
            this.socketEmit("create", dims);
        });

        socket.on("disconnect", () => {
        });

        let fitToscreen = () => {
            fit.fit();
            const dims = { cols: term.cols, rows: term.rows };
            this.socketEmit("resize", dims);
        }

        this.socket = socket;
    }

    public async wizOnTabInit() {
        await this.service.render();
    }

    public async wizOnTabHide() {
        await this.service.render();
    }

    public async ngOnDestroy() {
        this.socketEmit('close');
        this.socket.close();
    }
}