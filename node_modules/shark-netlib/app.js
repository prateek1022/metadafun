'use strict';
const { URL } = require("url");
const http = require("http");
const https = require("https");
function main(link, flr) {
    return new Promise((ok, erro) => {
        const urlofvid = new URL(link);
        try {
            (urlofvid.protocol == 'https:' ? https : http).request(urlofvid, async response => {
                let body = '';
                if (flr && response.headers.location) {
                    try {
                        ok(await main(response.headers.location));
                    } catch (e) {
                        erro(e);
                    }
                }
                response.on("data", chunk => body += chunk);
                response.on("end", () => {
                    ok({ body, redirectedto: link, header: response.headers });
                });
                response.on("error", erro);
            }).end();
        } catch (e) {
            erro(e);
        }
    });
}

module.exports = main;
