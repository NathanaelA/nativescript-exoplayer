import definition = require("./subtitle-source");
const types = require("utils/types");
const utils = require("utils/utils");
const  fs = require("file-system");


export * from './subtitle-source-common';

declare var android: any;

export class SubtitleSource implements definition.SubtitleSource {
    public android: any; /// String - url or resource
    public ios: any; /// NSString

    public loadFromResource(name: string): boolean {
        this.android = null;

        var res = utils.ad.getApplicationContext().getResources();
        if (res) {
            var UrlPath = "android.resource://org.nativescript.videoPlayer/R.raw." + name;
            this.android = UrlPath;

        }

        return this.android != null;
    }

    public loadFromUrl(url: string): boolean {
        this.android = null;
        this.android = url;
        return this.android != null;
    }

    public loadFromFile(path: string): boolean {

        var fileName = types.isString(path) ? path.trim() : "";
        if (fileName.indexOf("~/") === 0) {
            fileName = fs.path.join(fs.knownFolders.currentApp().path, fileName.replace("~/", ""));
        }

        this.android = fileName;
        return this.android != null;
    }

}