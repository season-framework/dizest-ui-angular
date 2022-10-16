import { OnInit, Input } from '@angular/core';

export class Component implements OnInit {
    @Input() title: string = "";
    @Input() updated: string = "";
    @Input() logo: string = "";
    @Input() cover: string = "";
    @Input() status: string = "";
    @Input() link: string = "";

    public statusClass: string;
    public coverStyle: any = {};

    public ngOnInit() {
        this.statusClass = (this.status == 'running' ? 'bg-blue' : 'bg-yellow');
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