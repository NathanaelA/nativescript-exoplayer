import videoCommon = require("./videoplayer-common");
import videoSource = require("./video-source/video-source");
import dependencyObservable = require("ui/core/dependency-observable");
import proxy = require("ui/core/proxy");
import utils = require("utils/utils");
import timer = require("timer");

/* global com */

global.moduleMerge(videoCommon, exports);

function onVideoSourcePropertyChanged(data: dependencyObservable.PropertyChangeData) {
    let video = <Video>data.object;
    if (!video.android) {
        return;
    }

    video._setNativeVideo(data.newValue ? data.newValue.android : null);
}

// register the setNativeValue callback
(<proxy.PropertyMetadata>videoCommon.Video.videoSourceProperty.metadata).onSetNativeValue = onVideoSourcePropertyChanged;

declare const android: any, java: any, com: any;

const STATE_IDLE: number = 0;
const SURFACE_WAITING: number = 0;
const SURFACE_READY: number = 1;



export class Video extends videoCommon.Video {
    private _textureView: any; /// android.widget.VideoView
    private videoWidth;
    private videoHeight;
    private _src;
    private mediaState;
    private textureSurface;
    private mediaPlayer;
    private mediaController;
    private preSeekTime;
	private _android;
	private _onReadyEmitEvent;

    constructor() {
        super();
        this._textureView = null;
        this._android = null;
        this.videoWidth = 0;
        this.videoHeight = 0;
        this._onReadyEmitEvent = [];

        this._src = null;

        this.mediaState = SURFACE_WAITING;
        this.textureSurface = null;
        this.mediaPlayer = null;
        this.mediaController = null;
        this.preSeekTime = -1;
    }

    get playState(): any {
		if (!this.mediaPlayer) { return STATE_IDLE; }
		return this.mediaPlayer.getPlaybackState();
	}

    get android(): any {
        return this._android;
    }

    public _createUI(): void {
        let that = new WeakRef(this);
		this._android = new android.widget.RelativeLayout (this._context);
        this._textureView = new android.view.TextureView(this._context);
        this._textureView.setFocusable(true);
        this._textureView.setFocusableInTouchMode(true);
        this._textureView.requestFocus();
		this._android.addView(this._textureView);
		this._setupMediaController();
		this._textureView.setOnTouchListener(new android.view.View.OnTouchListener({
            get owner(): Video {
                return that.get();
            },
            onTouch: function (/* view, event */) {
                this.owner.toggleMediaControllerVisibility();
                return false;
            }
        }));

        this._textureView.setSurfaceTextureListener(new android.view.TextureView.SurfaceTextureListener(
            {
                get owner(): Video {
                    return that.get();
                },
                onSurfaceTextureSizeChanged: function (surface, width, height) {
                    //console.log("SurfaceTexutureSizeChange", width, height);
                    // do nothing
                },

                onSurfaceTextureAvailable: function (surface /*, width, height */) {
                    this.owner.textureSurface = new android.view.Surface(surface);
                    this.owner.mediaState = SURFACE_WAITING;
                    this.owner._openVideo();
                },

                onSurfaceTextureDestroyed: function (/* surface */) {
                    // after we return from this we can't use the surface any more
                    if (this.owner.textureSurface !== null) {
                        this.owner.textureSurface.release();
                        this.owner.textureSurface = null;
                    }
                    if (this.owner.mediaController !== null) {
                        this.owner.mediaController.hide();
                    }
                    this.owner.release();

                    return true;
                },

                onSurfaceTextureUpdated: function (/* surface */) {
                    // do nothing
                }
            }
        ));
    }

    public toggleMediaControllerVisibility(): void {
		if (!this.mediaController || !this.mediaPlayer) { return; }
        if (this.mediaController.isVisible()) {
            this.mediaController.hide();
        } else {
            this.mediaController.show();
        }
    }

    private _setupMediaPlayerListeners(): void {
        let that = new WeakRef(this);

		let vidListener = new com.google.android.exoplayer2.SimpleExoPlayer.VideoListener({

			get owner() {
				return that.get();
			},
			onRenderedFirstFrame: function () {
				// Once the first frame has rendered it is ready to start playing...
				this.owner._emit(videoCommon.Video.playbackReadyEvent);
			},
			onVideoSizeChanged: function (width, height, unappliedRotationDegrees, pixelWidthHeightRatio) {
				if (this.owner) {
					this.owner.videoWidth = width;
					this.owner.videoHeight = height;
					if (this.owner.fill !== true) {
						this.owner._setupAspectRatio();
					}
				}
			}
		});
		let evtListener = new com.google.android.exoplayer2.ExoPlayer.EventListener({
			get owner() {
				return that.get();
			},
			onLoadingChanged: function(isLoading) {

			},
			onPlayerError: function(error) {

			},
			onPlayerStateChanged: function(playWhenReady, playbackState) {
				// PlayBackState
				// 1 = IDLE
				// 2 = BUFFERING
				// 3 = Ready
				// 4 = Ended
				// Ready
				if (playbackState === 3) {
					if (this.owner && this.owner._onReadyEmitEvent.length) {
						do {
							this.owner._emit(this.owner._onReadyEmitEvent.shift());
						} while (this.owner._onReadyEmitEvent.length);
					}

				} else if (playbackState === 4) {
					this.owner._emit(videoCommon.Video.finishedEvent);
				}
				//console.log("OPSC", playWhenReady, playbackState);

			},
			onPositionDiscontinuity: function() {

			},
			onTimelineChanged: function(timeline, manifest) {

			},
			onTracksChanged: function(trackGroups, trackSelections) {

			}
		});
		this.mediaPlayer.setVideoListener(vidListener);
		this.mediaPlayer.addListener(evtListener);

    }

    private _setupMediaController(): void {
		if (this.controls !== false || this.controls === undefined) {
			if (this.mediaController == null) {
				this.mediaController = new com.google.android.exoplayer2.ui.PlaybackControlView(this._context);
				this._android.addView(this.mediaController);

				let params = this.mediaController.getLayoutParams();
				params.addRule(14); // Center Horiz
				params.addRule(12); // Align bottom

				this.mediaController.setLayoutParams(params);
			}
			else {
				return;
			}
		}
    }

    private _setupAspectRatio(): void {

        let viewWidth = this._textureView.getWidth();
        let viewHeight = this._textureView.getHeight();
        let aspectRatio = this.videoHeight / this.videoWidth;

        let newWidth;
        let newHeight;
        if (viewHeight > (viewWidth * aspectRatio)) {
            // limited by narrow width; restrict height
            newWidth = viewWidth;
            newHeight = (viewWidth * aspectRatio);
        } else {
            // limited by short height; restrict width
            newWidth = (viewHeight / aspectRatio);
            newHeight = viewHeight;
        }

        let xoff = (viewWidth - newWidth) / 2;
        let yoff = (viewHeight - newHeight) / 2;

        let txform = new android.graphics.Matrix();
        this._textureView.getTransform(txform);
        txform.setScale(newWidth / viewWidth, newHeight / viewHeight);
        txform.postTranslate(xoff, yoff);
        this._textureView.setTransform(txform);

    }

    private _openVideo(): void {
		if (this._src === null || this.textureSurface === null) {
			return;
		}
		this.release();

		let am = utils.ad.getApplicationContext().getSystemService(android.content.Context.AUDIO_SERVICE);
		am.requestAudioFocus(null, android.media.AudioManager.STREAM_MUSIC, android.media.AudioManager.AUDIOFOCUS_GAIN);
		try {
			let bm = new com.google.android.exoplayer2.upstream.DefaultBandwidthMeter();
			let trackSelection = new com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection.Factory(bm);
			let trackSelector = new com.google.android.exoplayer2.trackselection.DefaultTrackSelector(trackSelection);
			let loadControl = new com.google.android.exoplayer2.DefaultLoadControl();
			this.mediaPlayer =
				com.google.android.exoplayer2.ExoPlayerFactory.newSimpleInstance(this._context, trackSelector, loadControl);
			this.mediaPlayer.setVideoSurface(this.textureSurface);
			let dsf = new com.google.android.exoplayer2.upstream.DefaultDataSourceFactory(this._context, "NativeScript", bm);
			let ef = new com.google.android.exoplayer2.extractor.DefaultExtractorsFactory();

			let vs;
			if (this._src instanceof String || typeof this._src === "string") {
				let uri = android.net.Uri.parse(this._src);
				vs = new com.google.android.exoplayer2.source.ExtractorMediaSource(uri, dsf, ef, null, null, null);

				if (this.loop) {
					vs = new com.google.android.exoplayer2.source.LoopingMediaSource(vs);
				}
			} else {
				vs = this._src;
			}

			this.mediaController.setPlayer(this.mediaPlayer);
			this._setupMediaPlayerListeners();
			this.mediaPlayer.prepare(vs);
			if (this.autoplay === true) {
				this.mediaPlayer.setPlayWhenReady(true);
			}
			if (this.preSeekTime > 0) {
				this.mediaPlayer.seekTo(this.preSeekTime);
				this.preSeekTime = -1;
			}
			this.mediaState = SURFACE_READY;

		}
		catch (ex) {
			console.log("Error:", ex, ex.stack);
		}
    }

    public _setNativeVideo(nativeVideo: any): void {
        this._src = nativeVideo;
        this._openVideo();
    }

    public setNativeSource(nativePlayerSrc: string): void {
        this._src = nativePlayerSrc;
        this._openVideo();
    }

    public play(): void {
		if (this.mediaState === SURFACE_WAITING) {
			this._openVideo();
		}
		else if (this.playState === 4) {
			this.mediaPlayer.seekToDefaultPosition();
		} else {
			this.mediaPlayer.setPlayWhenReady(true);
		}
    }

    public pause(): void {
		if (this.mediaPlayer) {
			this.mediaPlayer.setPlayWhenReady(false);
		}
    }

    public mute(mute: boolean): void {
		if (this.mediaPlayer) {
			if (mute === true) {
				this.mediaPlayer.setVolume(0);
			}
			else if (mute === false) {
				this.mediaPlayer.setVolume(1);
			}
		}
    }

    public stop(): void {
		if (this.mediaPlayer) {
			this.mediaPlayer.stop();
			this.release();
		}
    }

    private _addReadyEvent(value: any) {
		if (this._onReadyEmitEvent.indexOf(value)) { return; }
		this._onReadyEmitEvent.push(value);
	}

    public seekToTime(ms: number): void {
		this._addReadyEvent(videoCommon.Video.seekToTimeCompleteEvent);

		if (!this.mediaPlayer) {
			this.preSeekTime = ms;
			return;
		}
		else {
			this.preSeekTime = -1;
		}
		this.mediaPlayer.seekTo(ms);
    }

    public isPlaying(): boolean {
        if (!this.mediaPlayer) { return false; }
        return this.mediaPlayer.isPlaying();
    }

    public getDuration(): number {
        if (!this.mediaPlayer || this.mediaState === SURFACE_WAITING || this.playState === STATE_IDLE) {
            return 0;
        }
		let duration = this.mediaPlayer.getDuration();
		if (isNaN(duration)) { return 0; }
		else { return duration; }
    }

    public getCurrentTime(): number {
        if (!this.mediaPlayer) {
            return 0;
        }
        return this.mediaPlayer.getCurrentPosition();
    }

    public setVolume(volume: number) {
        this.mediaPlayer.setVolume(volume);
    }

    public destroy() {
        this.release();
        this.src = null;
        this._textureView = null;
        this.mediaPlayer = null;
        this.mediaController = null;
    }

    private release(): void {
		if (this.mediaPlayer !== null) {
			this.mediaState = SURFACE_WAITING;
			this.mediaPlayer.release();
			this.mediaPlayer = null;
			if (this.mediaController && this.mediaController.isVisible()) {
				this.mediaController.hide();
			}
			let am = utils.ad.getApplicationContext().getSystemService(android.content.Context.AUDIO_SERVICE);
			am.abandonAudioFocus(null);
		}
    }

    public suspendEvent(): void {
        this.release();
    }

    public resumeEvent(): void {
        this._openVideo();
    }

}