import { OnInit, Input } from '@angular/core';

export class Component implements OnInit {
    @Input() title: string = "";
    @Input() updated: string = "";
    @Input() logo: string = "";
    @Input() cover: string = "";
    @Input() status: string = "";
    @Input() link: string = "";

    public statusClass: any = {
        running: 'bg-blue',
        error: 'bg-red',
        ready: 'bg-yellow'
    };
    public coverStyle: any = {};

    public ngOnInit() {
        this.coverStyle = {
            position: "relative",
            'background-image': "url('" + this.cover + "')"
        };
    }

    public move() {
        if (this.link)
            location.href = this.link;
    }

}