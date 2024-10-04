import $ from "jquery";

export default class API {
    public url(action: string, uri: string) {
        let url = `/api/dizest/${action}/${uri}`;
        return url;
    }

    public async call(action: string, uri: string, data: any = {}) {
        let url = `/api/dizest/${action}/${uri}`;
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