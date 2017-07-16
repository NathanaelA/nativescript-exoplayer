import { Observable } from "data/observable";
import { Page } from "ui/page";
import { isAndroid } from "platform";
import { setInterval } from "timer";

export class HelloWorldModel extends Observable {
  public videoSrc: string;
  public subtitlesSrc: string;
  public currentTime: any;
  public videoDuration: any;
  private _videoPlayer: any;
  private completed: boolean;

  constructor(mainpage: Page) {
    super();

    this.completed = false;
    this._videoPlayer = <any>mainpage.getViewById("nativeVideoPlayer");
    this.currentTime = "";
    this.videoDuration = "";
    this.videoSrc = "~/videos/big_buck_bunny.mp4";
    this.subtitlesSrc = "~/videos/sample.srt";
    this.trackVideoCurrentPosition();
  }

  public setEnglishSubtitles() {
    this._videoPlayer.subtitles = "~/videos/sample.srt";
  }

  public setRussianSubtitles() {
    this._videoPlayer.subtitles = "~/videos/sample-ru.srt";
  }

  public disableSubtitles() {
    this._videoPlayer.subtitles = "";
  }

  /**
   * Video Finished callback
   */
  public videoFinished(args) {
    this.completed = true;
  }

  public playbackStart(args) {
  	this.completed = false;
  }

  /**
   * Pause the video
   */
  public pauseVideo() {
    this._videoPlayer.pause();
  }


  /**
   * Play the video
   */
  public playVideo() {
    this._videoPlayer.play();
    this.completed = false;
  }


  /**
   * Stop the video player
   */
  public stopVideo() {
    if (isAndroid) {
      this._videoPlayer.stop();
    }
  }


  /**
   * Get the video duration
   */
  public getVideoDuration() {
    let videoDuration = this._videoPlayer.getDuration();
    console.log("Video Duration: " + videoDuration);
    this.set("videoDuration", videoDuration);
  }


  /**
   * Go to 30 seconds
   */
  public goToTime() {
    try {
      this._videoPlayer.seekToTime(30000);
    } catch (err) {
      console.log(err);
    }
  }


  public animate() {
    console.log("Animation");

    const enums = require("ui/enums");
    this._videoPlayer.animate({
      rotate: 360,
      duration: 3000,
      curve: enums.AnimationCurve.spring
    }).then(() => {
      return this._videoPlayer.animate({
        rotate: 0,
        duration: 3000,
        curve: enums.AnimationCurve.spring
      });
    }).then(() => {
      return this._videoPlayer.animate({
        scale: { x: .5, y: .5 },
        duration: 1000,
        curve: enums.AnimationCurve.spring
      });

    }).then(() => {
      return this._videoPlayer.animate({
        scale: { x: 1.5, y: 1.5 },
        duration: 3000,
        curve: enums.AnimationCurve.spring
      });
    }).then(() => {
      return this._videoPlayer.animate({
        scale: { x: 1.0, y: 1.0 },
        duration: 3000,
        curve: enums.AnimationCurve.spring
      });

    });

  }

  public muteVideo() {
    this._videoPlayer.mute(true);
  }

  public unmuteVideo() {
    this._videoPlayer.mute(false);
  }


  /**
   * Get the video current time
   */
  public getVideoCurrentTime() {
    try {
      let currentTime = this._videoPlayer.getCurrentTime();
      console.log("Current Time: " + currentTime);
    } catch (err) {
      console.log(err);
    }
  }



  /**
   * Change the video src property
   */
  public changeVideoSource() {
    //  this._videoPlayer.src = "~/videos/test_video_rotated.mp4";
    //  return;

    if (this.videoSrc === "~/videos/small.mp4") {
      this._videoPlayer.src = "https://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4";
    } else {
      this._videoPlayer.src = "~/videos/small.mp4";
    }
  }



  private trackVideoCurrentPosition(): number {
    let trackInterval = setInterval(() => {
      let x, y;
      if (this.completed) {
        x = "";
        y = "";
      } else {
        x = this._videoPlayer.getCurrentTime();
        y = this._videoPlayer.getDuration();
      }
      this.set("currentTime", x);
      this.set("videoDuration", y);
    }, 200);
    return trackInterval;

  }


}