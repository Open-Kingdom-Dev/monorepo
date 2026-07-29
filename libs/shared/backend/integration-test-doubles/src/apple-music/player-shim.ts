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
      if (options.song) {
        self._queue = [{ id: options.song, type: 'songs' }];
        self._currentIndex = 0;
      } else if (options.songs) {
        self._queue = options.songs.map(function(id) { return { id: id, type: 'songs' }; });
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
              self._queue = [{ id: 'mock-track-001', type: 'songs' }];
              self._currentIndex = 0;
              self._updateNowPlaying();
              resolve();
            }
          })
          .catch(function() {
            self._queue = [{ id: 'mock-track-001', type: 'songs' }];
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
    if (item) {
      if (item.attributes) {
        this.nowPlayingItem = {
          id: item.id,
          attributes: item.attributes
        };
        this._trigger('nowPlayingItemDidChange');
      } else {
        var self = this;
        fetch('__TWIN_BASE_URL__/v1/catalog/us/songs/' + item.id)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.data && data.data[0]) {
              self.nowPlayingItem = {
                id: item.id,
                attributes: data.data[0].attributes
              };
              self._trigger('nowPlayingItemDidChange');
            }
          });
        return;
      }
    } else {
      this.nowPlayingItem = null;
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
      self.playbackState = PlaybackStates.playing;
      self._trigger('playbackStateDidChange');
      resolve();
    });
  };

  MusicKitInstance.prototype.pause = function() {
    var self = this;
    return new Promise(function(resolve) {
      self.playbackState = PlaybackStates.paused;
      self._trigger('playbackStateDidChange');
      resolve();
    });
  };

  MusicKitInstance.prototype.stop = function() {
    var self = this;
    return new Promise(function(resolve) {
      self.playbackState = PlaybackStates.stopped;
      self._trigger('playbackStateDidChange');
      resolve();
    });
  };

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
