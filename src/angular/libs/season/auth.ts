import Service from './service';
import Request from './request';

export default class Auth {
    public id: string | null = null;
    public username: string | null = null
    public email: string | null = null
    public role: string | null = null
    public status: boolean = false;
    public timestamp: number = 0;

    constructor(private service: Service) {
        this.request = new Request();
    }

    public async init() {
        let now = new Date().getTime();
        if (this.status && now - this.timestamp < 30000)
            return;

        let { code, data } = await this.request.post('/auth/check');
        if (code != 200) return this;

        this.status = data.status;
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.role = data.role;
        this.timestamp = new Date().getTime();
        return this;
    }

    public allow(roles: any, redirect: string | null = null) {
        if (typeof roles == 'boolean') {
            if (roles === this.status) return true;
        } else {
            if (typeof roles == 'string')
                roles = [roles];
            if (roles.indexOf(this.role) >= 0)
                return true;
        }

        if (redirect) {
            location.href = redirect;
        }

        return false;
    }

}