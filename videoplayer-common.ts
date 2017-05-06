// import dependencyObservable = require("ui/core/dependency-observable");
import videoSource = require("./video-source/video-source");
import * as definitions from "./index";
import enums = require("ui/enums");
import platform = require("platform");
import utils = require("utils/utils");
import * as types from "utils/types";
import { View, Property, booleanConverter } from "ui/core/view";

// on Android we explicitly set propertySettings to None because android will invalidate its layout (skip unnecessary native call).
// var AffectsLayout = platform.device.os === platform.platformNames.android ? dependencyObservable.PropertyMetadataSettings.None : dependencyObservable.PropertyMetadataSettings.AffectsLayout;

function onSrcPropertyChanged(view, oldValue, newValue) {

    const video = view;
    let value = newValue;

    if (types.isString(value)) {
        value = value.trim();
        video.videoSource = null;
        video["_url"] = value;

        video.isLoadingProperty = true;

        if (utils.isFileOrResourcePath(value)) {
            console.log("utils.isFileOrResourcePath(value)", utils.isFileOrResourcePath(value));
            console.log("video.videoSource", video.videoSource);
            video.videoSource = videoSource.fromFileOrResource(value);
            console.log("video.videoSource", video.videoSource);
            video.isLoadingProperty = false;
        } else {
            if (video["_url"] === value) {
                video.videoSource = videoSource.fromUrl(value);

                video.isLoadingProperty = false;
            }
        }
    } else if (value instanceof videoSource.VideoSource) {
        video.videoSource = value;
    } else {
        video.videoSource = videoSource.fromNativeSource(value);
    }
}


export class Video extends View {
    public static finishedEvent: string = "finished";
    public static playbackReadyEvent: string = "playbackReady";
    public static playbackStartEvent: string = "playbackStart";
    public static seekToTimeCompleteEvent: string = "seekToTimeComplete";
    public static currentTimeUpdatedEvent: string = "currentTimeUpdated";

    public _emit: any;
    public android: any;
    public ios: any;
    public src: string; /// video source file
    public loop: boolean = false; /// whether the video loops the playback after extends
    public autoplay: boolean = false; /// set true for the video to start playing when ready
    public controls: boolean = true; /// set true to enable the media player's playback controls
    public observeCurrentTime: boolean; // set to true if want to observe current time.
}

export const srcProperty = new Property<Video, any>({
    name: "src",
    valueChanged: onSrcPropertyChanged
});
srcProperty.register(Video);

export const videoSourceProperty = new Property<Video, any>({
    name: "videoSource"
});
videoSourceProperty.register(Video);

export const isLoadingProperty = new Property<Video, boolean>({
    name: "isLoading",
    valueConverter: booleanConverter,
});
isLoadingProperty.register(Video);

export const observeCurrentTimeProperty = new Property<Video, boolean>({
    name: "observeCurrentTime",
    valueConverter: booleanConverter,
});
observeCurrentTimeProperty.register(Video);

export const autoplayProperty = new Property<Video, boolean>({
    name: "autoplay",
    valueConverter: booleanConverter,
});
autoplayProperty.register(Video);

export const controlsProperty = new Property<Video, boolean>({
    name: "controls",
    valueConverter: booleanConverter,
});
controlsProperty.register(Video);

export const loopProperty = new Property<Video, boolean>({
    name: "loop",
    valueConverter: booleanConverter,
});
loopProperty.register(Video);

export const mutedProperty = new Property<Video, boolean>({
    name: "muted",
    valueConverter: booleanConverter,
});
mutedProperty.register(Video);

export const fillProperty = new Property<Video, boolean>({
    name: "fill",
    valueConverter: booleanConverter,
});
fillProperty.register(Video);