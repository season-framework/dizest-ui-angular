import { Injectable } from '@angular/core';
import Crypto from './crypto';
import Auth from './auth';

@Injectable({ providedIn: 'root' })
export class Service {
    public auth: Auth;
    public app: any;

    constructor() {
        this.crypto = new Crypto();
        this.auth = new Auth(this);
    }

    public async init(app: any) {
        if (app) this.app = app;
        await this.auth.init();
        return this;
    }

    public async render(time: number) {
        let timeout = () => new Promise((resolve) => {
            setTimeout(resolve, time);
        });
        await timeout();
        this.app.ref.detectChanges();
    }

    public async loading(show: boolean) {
        this.app.loading = show;
        await this.render();
    }

    public href(url: any) {
        this.app.router.navigate(url);
    }

    public random(stringLength: number = 16) {
        const fchars = 'abcdefghiklmnopqrstuvwxyz';
        const chars = '0123456789abcdefghiklmnopqrstuvwxyz';
        let randomstring = '';
        for (let i = 0; i < stringLength; i++) {
            let rnum = null;
            if (i === 0) {
                rnum = Math.floor(Math.random() * fchars.length);
                randomstring += fchars.substring(rnum, rnum + 1);
            } else {
                rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }
        }
        return randomstring;
    }

}

export default Service;