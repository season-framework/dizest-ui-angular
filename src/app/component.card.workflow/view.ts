import { OnInit, Input } from '@angular/core';

export class Component implements OnInit {
    @Input() title: string = "";
    @Input() updated: string = "";
    @Input() logo: string = "";
    @Input() cover: string = "";
    @Input() status?: string = "";

    public statusClass: string;
    public coverStyle: any = {};

    public ngOnInit() {
        this.statusClass = (this.status == 'running' ? 'bg-blue' : 'bg-yellow');
        this.coverStyle = {
            position: "relative",
            'background-image': "url('" + this.cover + "')"
        };
    }

}