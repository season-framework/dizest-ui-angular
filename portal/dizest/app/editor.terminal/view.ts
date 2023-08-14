import { OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';

export class Component implements OnInit, OnDestroy {
    @Input() tab: any = {};

    @ViewChild('terminal')
    public terminal: ElementRef;

    public socket: any;
    public term: any;
    public fit: any;
    public namespace: any;

    constructor(
        public service: Service
    ) { }

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

        let socketEmit = (channel: string, data: any = {}) => {
            data.zone = this.tab.dizest.zone;
            data.namespace = this.namespace;
            this.socket.emit(channel, data);
        }

        term.onData((data) => {
            socketEmit("ptyinput", { input: data })
        });

        socket.on("ptyoutput", function (data) {
            term.write(data.output);
        });

        socket.on("connect", () => {
            fitToscreen();
            socketEmit("join");
            socketEmit("create");
        });

        socket.on("disconnect", () => {
        });

        function fitToscreen() {
            fit.fit();
            const dims = { cols: term.cols, rows: term.rows };
            socketEmit("resize", dims);
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
        let socketEmit = (channel: string, data: any = {}) => {
            data.zone = this.tab.dizest.zone;
            data.namespace = this.namespace;
            this.socket.emit(channel, data);
        }

        socketEmit('close');
        this.socket.close();
    }

}