export const SHIM_TEMPLATE = `(function() {
  'use strict';
  
  var PlaybackStates = {
    none: 0,
    loading: 1,
    playing: 2,
    paused: 3,
    stopped: 4,
    ended: 5,
    seeking: 6,
    waiting: 7,
    stalled: 8,
    completed: 9
  };

  var PlayerShuffleMode = {
    off: 0,
    songs: 1,
    albums: 2
  };

  var instance = null;

  function MusicKitInstance() {
    this.musicUserToken = null;
    this.developerToken = null;
    this.playbackState = PlaybackStates.stopped;
    this.nowPlayingItem = null;
    this.shuffleMode = PlayerShuffleMode.off;
    this.isAuthorized = true;
    this._listeners = {};
    this._queue = [];
    this._currentIndex = -1;
    this.currentPlaybackTime = 0;
    this.currentPlaybackDuration = 0;

    // Add HTML5 audio player
    this._audio = document.createElement('audio');
    this._audio.preload = 'auto';
    document.body.appendChild(this._audio);
  }

  MusicKitInstance.prototype.addEventListener = function(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  };

  MusicKitInstance.prototype.removeEventListener = function(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(cb) {
      return cb !== callback;
    });
  };

  MusicKitInstance.prototype._trigger = function(event) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(function(callback) {
        try { callback(); } catch (e) { console.error(e); }
      });
    }
  };

  MusicKitInstance.prototype.setQueue = function(options) {
    var self = this;
    return new Promise(function(resolve) {
      console.log('[MusicKit Shim] setQueue:', options);
      var preloaded = options._preloadedAttributes || {};

      if (options.song) {
        self._queue = [{ id: options.song, type: 'songs', attributes: preloaded[options.song] || null }];
        self._currentIndex = 0;
      } else if (options.songs) {
        self._queue = options.songs.map(function(id) {
          return { id: id, type: 'songs', attributes: preloaded[id] || null };
        });
        self._currentIndex = 0;
      } else if (options.playlist) {
        fetch('__TWIN_BASE_URL__/v1/catalog/us/playlists/' + options.playlist)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.data && data.data[0] && data.data[0].relationships && data.data[0].relationships.tracks) {
              self._queue = data.data[0].relationships.tracks.data.map(function(track) {
                return {
                  id: track.id,
                  type: 'songs',
                  attributes: track.attributes
                };
              });
              self._currentIndex = 0;
              self._updateNowPlaying();
              resolve();
            } else {
              self._queue = [{ id: 'mock-track-001', type: 'songs', attributes: null }];
              self._currentIndex = 0;
              self._updateNowPlaying();
              resolve();
            }
          })
          .catch(function() {
            self._queue = [{ id: 'mock-track-001', type: 'songs', attributes: null }];
            self._currentIndex = 0;
            self._updateNowPlaying();
            resolve();
          });
        return;
      }
      self._updateNowPlaying();
      resolve();
    });
  };

  MusicKitInstance.prototype._updateNowPlaying = function() {
    var item = this._queue[this._currentIndex];
    var self = this;
    if (item) {
      if (item.attributes) {
        this.nowPlayingItem = {
          id: item.id,
          attributes: item.attributes
        };
        if (item.attributes.audioUrl) {
          this._audio.src = item.attributes.audioUrl;
          this._audio.load();
          this.currentPlaybackTime = 0;
          this.currentPlaybackDuration = 0;
          this._trigger('playbackTimeDidChange');
          this._trigger('playbackDurationDidChange');
        }
        this._trigger('nowPlayingItemDidChange');
      } else {
        fetch('__TWIN_BASE_URL__/v1/catalog/us/songs/' + item.id)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.data && data.data[0]) {
              // Cache attributes back on the queue item so skips don't re-fetch
              self._queue[self._currentIndex].attributes = data.data[0].attributes;
              self.nowPlayingItem = {
                id: item.id,
                attributes: data.data[0].attributes
              };
              if (data.data[0].attributes.audioUrl) {
                self._audio.src = data.data[0].attributes.audioUrl;
                self._audio.load();
                self.currentPlaybackTime = 0;
                self.currentPlaybackDuration = 0;
                self._trigger('playbackTimeDidChange');
                self._trigger('playbackDurationDidChange');
              }
              self._trigger('nowPlayingItemDidChange');
            }
          });
        return;
      }
    } else {
      this.nowPlayingItem = null;
      this._audio.src = '';
      this.currentPlaybackTime = 0;
      this.currentPlaybackDuration = 0;
      this._trigger('playbackTimeDidChange');
      this._trigger('playbackDurationDidChange');
      this._trigger('nowPlayingItemDidChange');
    }
  };

  MusicKitInstance.prototype.changeToMediaAtIndex = function(index) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (index >= 0 && index < self._queue.length) {
        self._currentIndex = index;
        self._updateNowPlaying();
        resolve();
      } else {
        reject(new Error('Index out of bounds'));
      }
    });
  };

  MusicKitInstance.prototype.changeToMediaItem = function(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var index = self._queue.findIndex(function(item) { return item.id === id; });
      if (index !== -1) {
        self._currentIndex = index;
        self._updateNowPlaying();
        resolve();
      } else {
        reject(new Error('Item not in queue'));
      }
    });
  };

  MusicKitInstance.prototype.play = function() {
    var self = this;
    return new Promise(function(resolve) {
      self.playbackState = PlaybackStates.loading;
      self._trigger('playbackStateDidChange');
      self._audio.play()
        .then(function() { resolve(); })
        .catch(function(e) {
          console.error('[MusicKit Shim] play() failed:', e);
          resolve();
        });
    });
  };

  MusicKitInstance.prototype.pause = function() {
    var self = this;
    return new Promise(function(resolve) {
      self._audio.pause();
      resolve();
    });
  };

  MusicKitInstance.prototype.stop = function() {
    var self = this;
    return new Promise(function(resolve) {
      self._audio.pause();
      self._audio.currentTime = 0;
      self.playbackState = PlaybackStates.stopped;
      self._trigger('playbackStateDidChange');
      resolve();
    });
  };

  // Bug 5 fix: auto-play after skipping
  MusicKitInstance.prototype.skipToNextItem = function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._queue.length > 0) {
        if (self.shuffleMode === PlayerShuffleMode.songs) {
          self._currentIndex = Math.floor(Math.random() * self._queue.length);
        } else {
          self._currentIndex = (self._currentIndex + 1) % self._queue.length;
        }
        self._updateNowPlaying();
        // Auto-play after skip
        setTimeout(function() { self._audio.play().catch(function(){}); }, 150);
      }
      resolve();
    });
  };

  MusicKitInstance.prototype.skipToPreviousItem = function() {
    var self = this;
    return new Promise(function(resolve) {
      if (self._queue.length > 0) {
        self._currentIndex = (self._currentIndex - 1 + self._queue.length) % self._queue.length;
        self._updateNowPlaying();
        // Auto-play after skip
        setTimeout(function() { self._audio.play().catch(function(){}); }, 150);
      }
      resolve();
    });
  };

  window.MusicKit = {
    PlaybackStates: PlaybackStates,
    PlayerShuffleMode: PlayerShuffleMode,
    configure: function(config) {
      return new Promise(function(resolve) {
        instance = new MusicKitInstance();
        instance.developerToken = config.developerToken;

        // Wire audio events
        instance._audio.addEventListener('playing', function() {
          instance.playbackState = PlaybackStates.playing;
          instance._trigger('playbackStateDidChange');
        });
        instance._audio.addEventListener('pause', function() {
          if (instance.playbackState !== PlaybackStates.stopped) {
            instance.playbackState = PlaybackStates.paused;
            instance._trigger('playbackStateDidChange');
          }
        });
        instance._audio.addEventListener('ended', function() {
          instance.playbackState = PlaybackStates.ended;
          instance._trigger('playbackStateDidChange');
        });
        instance._audio.addEventListener('waiting', function() {
          instance.playbackState = PlaybackStates.waiting;
          instance._trigger('playbackStateDidChange');
        });
        instance._audio.addEventListener('timeupdate', function() {
          instance.currentPlaybackTime = instance._audio.currentTime;
          instance._trigger('playbackTimeDidChange');
        });
        instance._audio.addEventListener('durationchange', function() {
          instance.currentPlaybackDuration = instance._audio.duration;
          instance._trigger('playbackDurationDidChange');
        });

        resolve(instance);
      });
    },
    getInstance: function() {
      return instance;
    }
  };

  document.dispatchEvent(new Event('musickitloaded'));
})();
`;

export function generatePlayerShim(baseUrl: string): string {
  return SHIM_TEMPLATE.replace(/__TWIN_BASE_URL__/g, baseUrl);
}
