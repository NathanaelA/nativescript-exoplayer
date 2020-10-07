const utils = require("utils/utils");

// This is used for definition purposes only, it does not generate JavaScript for it.
//import definition = require("./video-source");
import { VideoSource } from './video-source';

export function fromResource(name: string): VideoSource {
    const video = new VideoSource();
    return video.loadFromResource(name) ? video : null;
}

export function fromFile(path: string): VideoSource { 
    const video = new VideoSource();
    return video.loadFromFile(path) ? video : null;
}

export function fromNativeSource(source: any): VideoSource {
    const video = new VideoSource();
    return video.setNativeSource(source) ? video : null;
}

export function fromUrl(url: string): VideoSource {
    const video = new VideoSource();
    return video.loadFromUrl(url) ? video : null;
}

export function fromFileOrResource(path: string): VideoSource {
    if (!isFileOrResourcePath(path)) {
        throw new Error("Path \"" + "\" is not a valid file or resource.");
    }

    if (path.indexOf(utils.RESOURCE_PREFIX) === 0) {
        return fromResource(path.substr(utils.RESOURCE_PREFIX.length));
    }
    return fromFile(path);
}

export function isFileOrResourcePath(path: string): boolean {
    return utils.isFileOrResourcePath(path);
}