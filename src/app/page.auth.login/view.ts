import { OnInit, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/season/service';
import toastr from 'toastr';

export class Component implements OnInit {

    public username: string = '';
    public password: string = '';

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
        await this.service.auth.allow(false, '/main');
    }

    public async login(id, password) {
        let { code, data } = await wiz.call("login", { id, password });
        if (code == 200) {
            location.href = "/";
            return;
        }
        toastr.error(data);
    }
}