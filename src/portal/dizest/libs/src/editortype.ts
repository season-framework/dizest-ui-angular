
export default class EditorType {
    public data: any = [];

    public bind(obj) {
        this.data.push(obj);
    }

    public select(ext, node) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].trigger(ext, node)) {
                return this.data[i];
            }
        }
    }

}