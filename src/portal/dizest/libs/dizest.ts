import API from './src/api';
import EditorType from './src/editortype';

export class Dizest {
    constructor(public service: any) {
        this.api = new API();
        this.editorType = new EditorType();
    }
}

export default Dizest;