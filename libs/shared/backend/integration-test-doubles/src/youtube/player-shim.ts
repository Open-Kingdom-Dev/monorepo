export const SHIM_TEMPLATE = `(function() {
  'use strict';

  var TWIN_BASE = '__TWIN_BASE_URL__';

  var PlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5
  };

  function Player(elementIdOrElement, options) {
    options = options || {};

    // Resolve target container
    this._container = typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

    if (!this._container) {
      throw new Error('YT.Player: target element not found: ' + elementIdOrElement);
    }

    this._options = options;
    this._state = PlayerState.UNSTARTED;
    this._volume = 100;
    this._muted = false;
    this._videoData = {
      video_id: options.videoId || '',
      title: '',
      author: ''
    };

    // Create HTML5 <video> element
    this._video = document.createElement('video');
    this._video.src = TWIN_BASE + '/test-assets/sample.mp4';
    this._video.width = options.width || 640;
    this._video.height = options.height || 360;
    this._video.controls = !!(options.playerVars && options.playerVars.controls !== 0);
    this._video.playsInline = !!(options.playerVars && options.playerVars.playsinline);
    this._video.style.width = '100%';
    this._video.style.height = '100%';
    this._video.style.backgroundColor = '#000';
    this._video.style.display = 'block';

    // Create metadata overlay
    this._overlay = document.createElement('div');
    this._overlay.style.cssText =
      'position:absolute;bottom:0;left:0;right:0;padding:8px 12px;' +
      'background:linear-gradient(transparent, rgba(0,0,0,0.8));' +
      'color:#fff;font-size:14px;font-family:Roboto,Arial,sans-serif;' +
      'pointer-events:none;z-index:10;';
    this._loadVideoMetadata(options.videoId);

    // Wrap in positioned container
    this._wrapper = document.createElement('div');
    this._wrapper.style.cssText = 'position:relative;overflow:hidden;width:' + (options.width ? options.width + 'px' : '100%') + ';height:' + (options.height ? options.height + 'px' : '100%') + ';';
    this._wrapper.appendChild(this._video);
    this._wrapper.appendChild(this._overlay);

    // Replace target element content
    this._container.innerHTML = '';
    this._container.appendChild(this._wrapper);

    // Wire HTML5 video events -> YT state changes
    var self = this;
    this._video.addEventListener('playing', function() {
      self._state = PlayerState.PLAYING;
      self._fireStateChange();
    });
    this._video.addEventListener('pause', function() {
      if (self._video.ended) return; // 'ended' fires separately
      self._state = PlayerState.PAUSED;
      self._fireStateChange();
    });
    this._video.addEventListener('ended', function() {
      self._state = PlayerState.ENDED;
      self._fireStateChange();
    });
    this._video.addEventListener('waiting', function() {
      self._state = PlayerState.BUFFERING;
      self._fireStateChange();
    });

    // Fire onReady asynchronously (matches real YT behavior)
    setTimeout(function() {
      if (options.events && typeof options.events.onReady === 'function') {
        options.events.onReady({ target: self });
      }
    }, 100);

    // Auto-play if configured
    if (options.playerVars && options.playerVars.autoplay === 1) {
      this._video.play().catch(function() {});
    }
  }

  Player.prototype._loadVideoMetadata = function(videoId) {
    if (!videoId) {
      this._overlay.textContent = 'YouTube Twin Player';
      return;
    }

    var self = this;
    fetch(TWIN_BASE + '/youtube/v3/search?q=' + encodeURIComponent(videoId) +
      '&type=video&maxResults=1&key=shim&part=snippet')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        // Check for player error mode injected by twin server
        if (data.__twinErrorMode && data.__twinErrorMode.playerError) {
          setTimeout(function() {
            self._fireError(data.__twinErrorMode.playerError);
          }, 200);
          return;
        }

        if (data.items && data.items.length > 0) {
          var snippet = data.items[0].snippet;
          self._videoData = {
            video_id: videoId,
            title: snippet.title,
            author: snippet.channelTitle
          };
          self._overlay.textContent = snippet.title + ' - ' + snippet.channelTitle;
        } else {
          self._overlay.textContent = 'Video: ' + videoId;
        }
      })
      .catch(function() {
        // If search fails entirely, check error mode endpoint directly
        fetch(TWIN_BASE + '/test/youtube/error-mode')
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.active && data.mode && data.mode.startsWith('player-error-')) {
              var code = parseInt(data.mode.split('-')[2], 10);
              self._fireError(code);
            }
          })
          .catch(function() {});
        self._overlay.textContent = 'Video: ' + videoId;
      });
  };

  Player.prototype._fireStateChange = function() {
    if (this._options.events && typeof this._options.events.onStateChange === 'function') {
      this._options.events.onStateChange({ target: this, data: this._state });
    }
  };

  Player.prototype._fireError = function(code) {
    if (this._options.events && typeof this._options.events.onError === 'function') {
      this._options.events.onError({ target: this, data: code });
    }
  };

  // Playback controls
  Player.prototype.playVideo = function() { this._video.play().catch(function() {}); };
  Player.prototype.pauseVideo = function() { this._video.pause(); };
  Player.prototype.stopVideo = function() { this._video.pause(); this._video.currentTime = 0; };
  Player.prototype.seekTo = function(seconds) { this._video.currentTime = seconds; };

  // Volume controls
  Player.prototype.setVolume = function(vol) {
    this._volume = vol;
    this._video.volume = vol / 100;
  };
  Player.prototype.getVolume = function() { return this._volume; };
  Player.prototype.mute = function() { this._muted = true; this._video.muted = true; };
  Player.prototype.unMute = function() { this._muted = false; this._video.muted = false; };
  Player.prototype.isMuted = function() { return this._muted; };

  // State queries
  Player.prototype.getPlayerState = function() { return this._state; };
  Player.prototype.getCurrentTime = function() { return this._video.currentTime; };
  Player.prototype.getDuration = function() { return this._video.duration || 0; };
  Player.prototype.getVideoUrl = function() {
    return 'https://www.youtube.com/watch?v=' + (this._options.videoId || 'test');
  };
  Player.prototype.getVideoData = function() { return this._videoData; };

  // Sizing
  Player.prototype.setSize = function(w, h) {
    this._video.width = w;
    this._video.height = h;
    if (this._wrapper) {
      this._wrapper.style.width = w + 'px';
      this._wrapper.style.height = h + 'px';
    }
  };

  // Cleanup
  Player.prototype.destroy = function() {
    this._video.pause();
    this._video.src = '';
    this._video.load();
    if (this._container) {
      this._container.innerHTML = '';
    }
  };

  // Install globals
  window.YT = {
    Player: Player,
    PlayerState: PlayerState
  };

  // Fire the API-ready callback
  if (typeof window.onYouTubeIframeAPIReady === 'function') {
    setTimeout(function() { window.onYouTubeIframeAPIReady(); }, 0);
  }
})();`;

export function generatePlayerShim(twinBaseUrl: string): string {
  return SHIM_TEMPLATE.replace(/__TWIN_BASE_URL__/g, twinBaseUrl);
}
