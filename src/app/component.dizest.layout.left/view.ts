import { OnInit, Input } from '@angular/core';

export class Component implements OnInit {
    @Input() title: any;

    public async ngOnInit() {
    }
}