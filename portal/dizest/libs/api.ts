import $ from "jquery";

export default class API {
    constructor(public dizest: any) { }

    public url(category: string, uri: string) {
        let zone = this.dizest.zone;
        let url = `/api/dizest/${category}/${zone}/${uri}`;
        return url;
    }

    public async call(category: string, uri: string, data: any = {}) {
        let zone = this.dizest.zone;
        let url = `/api/dizest/${category}/${zone}/${uri}`;
        let request = () => {
            return new Promise((resolve) => {
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data
                }).always(function (res) {
                    resolve(res);
                });
            });
        }

        try {
            let { code, data } = await request();
            return { code, data };
        } catch (e) {
            return { code: 500, data: e };
        }
    }
}