import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

import toastr from 'toastr';
toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-bottom-center",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": 300,
    "hideDuration": 500,
    "timeOut": 1500,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

export class Component implements OnInit {

    public current: string = '';
    public password: string = '';
    public repeat_password: string = '';
    public checked: boolean = false;

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, '/auth/login');
    }

    public async update() {
        let user = {
            username: this.service.auth.username,
            email: this.service.auth.email,
            current: this.current,
            password: this.password,
            repeat_password: this.repeat_password
        }

        if (!this.checked) {
            let { code, data } = await wiz.call("check", user);
            if (code != 200) return toastr.error(data);
            this.checked = true;
            await this.service.render();
            return;
        }

        if (user.password.length == 0) {
            delete user.current;
            delete user.password;
            delete user.repeat_password;
        }

        if (user.password) {
            if (user.password.length < 8)
                return toastr.error('password must 8 characters or more');
            if (!user.repeat_password)
                return toastr.error('check password');
            if (user.password != user.repeat_password)
                return toastr.error('check password');
        }

        let { code, data } = await wiz.call("update", user);
        if (code != 200) return toastr.error(data);

        this.checked = false;
        this.current = '';
        this.password = '';
        this.repeat_password = '';

        toastr.success('updated');
        await this.service.render();
    }

}