import { OnInit, Input } from '@angular/core';
import toastr from "toastr";

export class Component implements OnInit {
    public title : string = "Title";

    public async ngOnInit() {
    }

    public async click() {
        toastr.success("Hello");
    }
}