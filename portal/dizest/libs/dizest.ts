import { Injectable } from '@angular/core';
import Request from './request';

@Injectable({ providedIn: 'root' })
export class Dizest {
    public service: any;
    public status: any = null;
    public kernels: any = [];

    constructor() { }

    public async init(service: any) {
        this.service = service;
        await this.check();
    }

    public async check() {
        await this.loader.status();
        await this.loader.kernels();
        await this.service.render();
    }

    public async request(path: string, data: any = {}) {
        let request = new Request();
        return await request.post(path, data);
    }

    public loader: any = {
        status: async () => {
            let request = new Request();
            let { data } = await request.post('/dizest/server/check');
            this.status = data;
        },
        kernels: async () => {
            let request = new Request();
            let { data } = await request.post('/dizest/server/kernels');
            this.kernels = data;
        }
    }

    public server: any = {
        start: async (kernel: any) => {
            await this.service.loading.show();
            try {
                let request = new Request();
                await request.post('/dizest/server/start', kernel);
                await this.check();
            } catch (e) {
            }
            location.reload();
        },
        stop: async () => {
            await this.service.loading.show();
            try {
                let request = new Request();
                await request.post('/dizest/server/stop');
                await this.check();
            } catch (e) {
            }
            await this.service.loading.hide();
        }
    }
}