import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {

    public current: string = '';
    public password: string = '';
    public repeat_password: string = '';
    public checked: boolean = false;

    constructor(public service: Service) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow(true, "/access");
    }

    public async alert(message: string) {
        return await this.service.alert.show({
            title: "Error",
            message: message,
            cancel: false,
            action: "Confirm"
        });
    }

    public async update() {
        let user = {
            username: this.service.auth.session.username,
            email: this.service.auth.session.email,
            current: this.current,
            password: this.password,
            repeat_password: this.repeat_password
        }

        if (!this.checked) {
            user.current = this.service.auth.hash(user.current);
            let { code, data } = await wiz.call("check", user);
            if (code != 200) return await this.alert(data);
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
                return await this.alert('password must 8 characters or more');
            if (!user.repeat_password)
                return await this.alert('check password');
            if (user.password != user.repeat_password)
                return await this.alert('check password');
        }

        user.current = this.service.auth.hash(user.current);
        user.password = this.service.auth.hash(user.password);
        user.repeat_password = this.service.auth.hash(user.repeat_password);

        let { code, data } = await wiz.call("update", user);
        if (code != 200) return await this.alert(data);

        this.checked = false;
        this.current = '';
        this.password = '';
        this.repeat_password = '';

        this.service.toast.success('updated');
        await this.service.render();
    }
}