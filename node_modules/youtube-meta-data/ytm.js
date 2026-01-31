'use strict';
const cheerio = require("cheerio");
const shnet = require("shark-netlib");
function main(youtube) {
    return new Promise(async (ok, erro) => {
        if (/((http|https):\/\/)?(www\.)?((youtube\.com)|(youtu\.be))(\/)?([a-zA-Z0-9\-\.]+)\/?/.test(youtube)) {
            try {
                const
                    res = await shnet(youtube, true),
                    body = res.body,
                    $ = cheerio.load(body),
                    title = $(`meta[name="title"]`).attr("content"),
                    description = $(`meta[name="description"]`).attr("content"),
                    keywords = $(`meta[name="keywords"]`).attr("content"),
                    shortlinkUrl = $(`link[rel="shortlinkUrl"]`).attr("href"),
                    ur = $(`link[type="application/json+oembed"]`).attr("href");
                const iem = ur&&ur!="" ? (await shnet(ur.replace("http:", "https:"), true)).body : undefined;
                const embedinfo = ur ? (iem ? JSON.parse(iem) : null) : null;
                ok({ title, description, keywords, shortlinkUrl, embedinfo, videourl: res.redirectedto });
            } catch (e) {
                erro({ message: "Error", errorcode: 2, erroca: e });
            }
        } else {
            erro({ message: "Non Valid youtube Link!", errorcode: 1 });
        }
    });
}
module.exports = main;