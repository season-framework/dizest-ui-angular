import { OnInit, ChangeDetectorRef } from "@angular/core";
import { Service } from '@wiz/libs/season/service';

export class Component implements OnInit {

    public releases: any = [];

    constructor(
        public service: Service,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow('admin', '/');

        this.releases.push({
            name: "3.1.11",
            log: [
                "[ui] support app category"
            ]
        });

        this.releases.push({
            name: "3.1.10",
            log: [
                "[ui] bug fixed",
                "[ui] support file drop wrokfrom and apps"
            ]
        });

        this.releases.push({
            name: "3.1.9",
            log: [
                "[ui] Select previous file on workflow"
            ]
        });

        this.releases.push({
            name: "3.1.8",
            log: [
                "[core] kernel api update"
            ]
        });

        this.releases.push({
            name: "3.1.7",
            log: [
                "[core] drive api update (filename to download_name)"
            ]
        });

        this.releases.push({
            name: "3.1.6",
            log: [
                "[ui] kernel display name bug fixed"
            ]
        });

        this.releases.push({
            name: "3.1.5",
            log: [
                "[ui] mobile nav bug fixed"
            ]
        });

        this.releases.push({
            name: "3.1.4",
            log: [
                "[ui] cron bug fixed"
            ]
        });

        this.releases.push({
            name: "3.1.3",
            log: [
                "[ui] pwa bug fixed",
                "[ui] safari bug fixed (URLPattern)"
            ]
        });

        this.releases.push({
            name: "3.1.2",
            log: [
                "[core] kernel bug fixed"
            ]
        });

        this.releases.push({
            name: "3.1.1",
            log: [
                "[ui] run command bug fixed"
            ]
        });

        this.releases.push({
            name: "3.1.0",
            log: [
                "[ui] upgrade to angular",
                "[ui] full change ui component",
                "[core] upgrade to wiz 2",
                "[core] built-in was bundle"
            ]
        });

        await this.service.render();
    }
}