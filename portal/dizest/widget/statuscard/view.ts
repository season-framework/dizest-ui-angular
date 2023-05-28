import { Input } from '@angular/core';

export class Component {
    @Input() title: string = '';
    @Input() items: any = [];

    constructor() {
    }

}