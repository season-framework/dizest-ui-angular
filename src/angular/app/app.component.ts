import { Component, OnInit, ChangeDetectorRef, enableProdMode } from '@angular/core';
import { Router } from '@angular/router';
import { Service } from '@wiz/libs/portal/season/service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        public service: Service,
        public router: Router,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        enableProdMode();
        await this.service.init(this);
    }
}