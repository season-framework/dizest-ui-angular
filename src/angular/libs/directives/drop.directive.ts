import { Directive, Input, ElementRef, HostListener } from '@angular/core';
import $ from 'jquery';

@Directive({
    selector: '[ngDrop]'
})
export class DropDirective {
    @Input() ngDrop: any;
    public overlay: any;

    constructor(private el: ElementRef) {
        this.el.nativeElement.style.position = 'relative';
        this.overlay = $(`<div class="drop-overlay" style="z-index: 9999; width: 100%; height: 100%; position: absolute; left: 0; top: 0; background: rgba(0, 0, 0, .5); display: none; align-items: center; justify-content: center;">
            <h3 style="color: #fff; text-align: center; font-size: 24px;">Drop Here</h3>
        </div>`);
        $(this.el.nativeElement).append(this.overlay);

        $(this.overlay).on("dragleave", async () => {
            $(this.overlay).css("display", "none");
        });
    }

    @HostListener('drop', ['$event']) async onDrop(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        await this.ngDrop(event);
        $(this.overlay).css("display", "none");
    }

    @HostListener('dragover', ['$event']) onDragover(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    @HostListener('dragenter', ['$event']) onDragenter(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        $(this.overlay).css("display", "flex");
    }
}
