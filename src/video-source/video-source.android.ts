import definition = require("./video-source");

const app = require('@nativescript/core/application');
const types = require("utils/types");

const utils = require("utils/utils");
const fs = require("file-system");

export * from './video-source-common';

export class VideoSource implements definition.VideoSource {
    public android: any; /// android.widget.VideoView
    public ios: any; /// AVPlayer

    public loadFromResource(name: string): boolean {
        this.android = null;

        const res = utils.ad.getApplicationContext().getResources();
        if (res) {
                const packageName = app.android.context.getPackageName();
                this.android = `android.resource://${packageName}/R.raw.${name}`;
        }

        return this.android != null;
    }

    public loadFromUrl(url: string): boolean {
        this.android = null;
        this.android = url;
        return this.android != null;
    }

    public loadFromFile(path: string): boolean {

        let fileName = types.isString(path) ? path.trim() : "";
        if (fileName.indexOf("~/") === 0) {
            fileName = fs.path.join(fs.knownFolders.currentApp().path, fileName.replace("~/", ""));
        }

        this.android = fileName;
        return this.android != null;
    }

    public setNativeSource(source: any): boolean {
        this.android = source;
        return source != null;
    }


    get height(): number {
        if (this.android && typeof this.android.getHeight === 'function') {
            return this.android.getHeight();
        }

        return NaN;
    }

    get width(): number {
        if (this.android && typeof this.android.getWidth === 'function') {
            return this.android.getWidth();
        }

        return NaN;
    }

}