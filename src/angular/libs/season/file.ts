import Service from './service';
import $ from 'jquery';

export default class File {

    public filenode: any = null;

    constructor(private service: Service) {
    }

    public async resize(file, width, quality) {
        let fn: any = () => new Promise((resolve) => {
            if (!quality) quality = 0.8;
            if (!width) width = 64;

            let output = function (canvas, callback) {
                let blob = canvas.toDataURL('image/png', quality);
                callback(blob);
            }

            let _resize = function (dataURL, maxSize, callback) {
                let image = new Image();

                image.onload = function () {
                    let canvas = document.createElement('canvas'),
                        width = image.width,
                        height = image.height;
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                    output(canvas, callback);
                };

                image.onerror = function () {
                    return;
                };

                image.src = dataURL;
            };

            let photo = function (file, maxSize, callback) {
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function (readerEvent) {
                    _resize(readerEvent.target.result, maxSize, callback);
                };
            }

            photo(file, width, (blob) => {
                resolve(blob);
            });
        });

        return await fn();
    }

    public async upload(uopts: any = {}) {
        delete this.filenode;
        let opts: any = {
            type: 'text',  // text, image, json
            accept: null,
            multiple: null,
            width: 512,     // if image type
            quality: 0.8   // if image type
        };

        for (let key in uopts) {
            opts[key] = uopts[key];
        }

        let filenode = this.filenode = $(`<input type='file' ${opts.accept ? `accept='${opts.accept}'` : ''} ${opts.multiple ? 'multiple' : ''} />`);

        let result = {};

        result.text = () => new Promise((resolve) => {
            let fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result);
            };
            fr.readAsText(filenode.prop('files')[0]);
        });

        result.json = () => new Promise((resolve) => {
            let fr = new FileReader();
            fr.onload = async () => {
                let data = fr.result;
                data = JSON.parse(data);
                resolve(data);
            };
            fr.readAsText(filenode.prop('files')[0]);
        });

        result.image = async () => {
            let ifn: any = () => new Promise((resolve, reject) => {
                let file = filenode.prop('files')[0];
                if (!opts.width) opts.width = 512;
                if (!opts.quality) opts.quality = 0.8;
                if (opts.limit) {
                    if (file.length > opts.limit) {
                        reject("Exceeded maximum file size");
                    }
                }
                resolve(file);
            });

            let file = await ifn();
            file = await this.resize(file, opts.width, opts.quality);
            return file;
        }

        if (!result[opts.type]) opts.type = 'text';

        let fn: any = () => new Promise((resolve) => {
            filenode.change(async () => {
                let res = await result[opts.type]();
                filenode.remove();
                delete this.filenode;
                resolve(res);
            });

            filenode.click();
        });

        return await fn();
    }


}