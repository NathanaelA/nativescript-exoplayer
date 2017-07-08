import types = require("utils/types");
import fs = require("file-system");
import common = require("./subtitle-source-common");
import definition = require("./subtitle-source");

declare var android, NSString, NSBundle, NSURL;

global.moduleMerge(common, exports);

export class SubtitleSource implements definition.SubtitleSource {
    public android: any; /// String
    public ios: any; /// NSString

    public loadFromResource(name: string): boolean {
        let subtitleUrl = NSBundle.mainBundle().URLForResourceWithExtension(name, null);
        let subtitles = NSString.stringWithContentsOfURLEncodingError(subtitleUrl, NSUTF8StringEncoding, null);
        this.ios = subtitles;
        return this.ios != null;
    }

    public loadFromFile(path: string): boolean {
        var fileName = types.isString(path) ? path.trim() : "";

        if (fileName.indexOf("~/") === 0) {
            fileName = fs.path.join(fs.knownFolders.currentApp().path, fileName.replace("~/", ""));
        }

        let subtitleUrl = NSURL.fileURLWithPath(fileName);
        let subtitles = NSString.stringWithContentsOfURLEncodingError(subtitleUrl, NSUTF8StringEncoding, null);
        this.ios = subtitles;
        return this.ios != null;
    }

    public loadFromUrl(url: string): boolean {
        let subtitleUrl = NSURL.URLWithString(url);
        let subtitles = NSString.stringWithContentsOfURLEncodingError(subtitleUrl, NSUTF8StringEncoding, null);
        this.ios = subtitles;
        return this.ios != null;
    }
}

