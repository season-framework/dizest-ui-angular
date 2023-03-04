export default class Socket {
    constructor(public editor: any) { }

    public events: any = {
        status: [],
        index: [],
        'log.append': [],
        'log.clear': []
    };

    public bind(namespace: string, fn: any) {
        if (!this.events[namespace]) this.events[namespace] = [];
        this.events[namespace].push(fn);
    }

    public unbind(namespace: string, fn: any) {
        if (!this.events[namespace]) return;
        this.events[namespace].remove(fn);
    }

    public async call(namespace: string, data: any) {
        if (!this.events[namespace]) return;
        for (let fn of this.events[namespace]) {
            try {
                fn(data);
            } catch (e) {
            }
        }
    }
}