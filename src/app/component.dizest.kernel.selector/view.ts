import { OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {
    @Input() list: any = [];
    @Input() kernel: string;
    @Input() returnUrl: string | null = null;
    @Output() onStart = new EventEmitter<number>();

    public selected: any = null;
    public isOpen: boolean = false;

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].name == this.kernel) {
                this.selected = this.list[i];
                break;
            }
        }

        await this.service.render();
    }

    public async select(spec: any) {
        this.kernel = spec.name;
        this.selected = spec;
        await this.toggle()
    }

    public start() {
        this.onStart.emit(this.kernel);
    }

    public async toggle() {
        this.isOpen = !this.isOpen;
        await this.service.render();
    }
}