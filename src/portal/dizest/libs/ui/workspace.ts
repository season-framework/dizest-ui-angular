export class Workspace {
    constructor(
        public app: any,
        public editorElement: any,
        public socket: any
    ) {
        socket.on("connect", async () => { });
        socket.onAny(async (eventname: any, data: any) => {
            if (this.__event__['*'])
                for (let i = 0; i < this.__event__['*'].length; i++)
                    await this.__event__['*'][i](eventname, data);
            if (this.__event__[eventname])
                for (let i = 0; i < this.__event__[eventname].length; i++)
                    await this.__event__[eventname][i](data);
        });
    }

    public __event__: any = {};
    public current: any = null;
    public selected: any = null;
    public editors: any = [];

    public bind(eventname: any, fn: any) {
        if (!this.__event__[eventname]) this.__event__[eventname] = [];
        this.__event__[eventname].push(fn);
        return fn;
    }

    public unbind(eventname: any, fn: any) {
        if (!this.__event__[eventname]) this.__event__[eventname] = [];
        if (fn) this.__event__[eventname].remove(fn);
        else this.__event__[eventname] = [];
    }

    public find(path: string) {
        for (let i = 0; i < this.editors.length; i++)
            if (this.editors[i].path == path)
                return this.editors[i];
        return null;
    }

    public async close(path: string) {
        let editor: any = this.find(path);
        if (!editor) return;

        let indexOf = this.editors.indexOf(editor);
        this.editors.remove(editor);

        if (editor.ref.instance.onEditorHide) {
            await editor.ref.instance.onEditorHide();
        }

        if (editor.ref.instance.onEditorClose) {
            await editor.ref.instance.onEditorClose();
        }

        if (editor.path == this.current) {
            if (this.editors[indexOf]) {
                await this.editors[indexOf].open();
            } else if (this.editors[this.editors.length - 1]) {
                await this.editors[this.editors.length - 1].open();
            } else {
                this.current = null;
                this.selected = null;
                await this.app.service.href("/workflow");
                this.editorElement.nativeElement.innerHTML = "";
            }
        }

        await editor.ref.destroy();

        for (let key in editor) {
            delete editor[key];
        }

        await this.app.service.render();
    }

    public async open(path: string, opts: any = {}) {
        if (this.current == path) return;

        this.editorElement.nativeElement.innerHTML = "";

        let editor: any = this.find(path);
        if (!editor) {
            editor = {};
            editor.workspace = this;
            editor.loading = false;
            editor.path = path;
            editor.name = path.split("/")[path.split("/").length - 1];
            for (let key in opts)
                editor[key] = opts[key];
            this.editors.push(editor);

            editor.open = async () => {
                return await this.open(editor.path, editor);
            }

            editor.close = async () => {
                return await this.close(editor.path);
            }
        }

        let inited: boolean = false;
        if (!editor.ref) {
            const ref: any = this.app.ref.createComponent<NodeComponent>(editor.cls);
            ref.instance.workspace = editor.workspace;
            ref.instance.editor = editor;
            ref.instance.dizest = this.app.dizest;
            editor.ref = ref;
            inited = true;
        }

        let pre = this.find(this.current);
        if (pre && pre.ref) {
            pre.ref.instance.loading = true;
            await this.app.service.render();
            if (pre.ref.instance.onEditorHide) {
                await pre.ref.instance.onEditorHide();
            }
        }

        editor.ref.instance.loading = true;
        await this.app.service.render();
        editor.ref.instance.loading = false;
        await this.app.service.render();

        if (inited && editor.ref.instance.onEditorInit)
            await editor.ref.instance.onEditorInit();

        if (editor.ref.instance.onEditorShow)
            await editor.ref.instance.onEditorShow();

        this.current = path;
        this.selected = editor;

        let editorElement = editor.ref.location.nativeElement;
        this.editorElement.nativeElement.append(editorElement);

        await this.app.service.href("/workflow/" + path);
        await this.app.service.render();

        return editor;
    }
}

export default Workspace;