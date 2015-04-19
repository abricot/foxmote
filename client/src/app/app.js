"use strict";
RAL.FileManifest.reset();

angular.module('app', [
  'ngTouch',
  'ui.state',
  'ui.bootstrap',
  'directives.image',
  'directives.flipper',
  'directives.hold',
  'directives.keybinding',
  'directives.rating',
  'directives.seekbar',
  'directives.streamdetails',
  'directives.spinner',
  'filters.xbmc',
  'filters.fallback',
  'services.xbmc',
  'services.storage',
  'templates.abricot',
  'templates.app',
  'lrInfiniteScroll'
  ]);

// this is where our app definition is
angular.module('app')
.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/");
  }
])
.controller('AppCtrl', ['$scope', '$rootScope', '$state', '$location', '$filter', 'xbmc', 'storage',
  function($scope, $rootScope, $state, $location, $filter, xbmc, storage) {
    var asChromeApp = window.chrome && window.chrome.storage;
    var analyticsService, analyticsTracker;
    if(asChromeApp) {
      analyticsService  = analytics.getService('Foxmote');
      analyticsTracker = analyticsService.getTracker('UA-55050807-1');
    }

    $scope.theme = 'yin';
    storage.getItem('theme', function(theme) {
      $scope.theme = theme;
    });
    $scope.$state = $state;
    $scope.connected = false;
    $scope.initialized = true;
    $scope.isMaximized = false;
    $scope.application = {};
    $scope.player = {
      id: -1,
      active: false,
      audiostreams: [],
      current: {},
      intervalId: -1,
      item: {},
      seek: {},
      speed: 0,
      subtitles: [],
      type: ''
    };
    $scope.playlist = -1;
    $scope.library = {
      item: {},
      criteria: ''
    };

    $scope.hosts = [];
    $scope.host = null;
    $scope.webserverURL = 'about:blank';
    $scope.xbmc = xbmc;

    $scope.back = function() {
      $scope.go($scope.previousHash);
    };

    $scope.go = function(path) {
      if ($scope.isMaximized) {
        $scope.isMaximized = !$scope.isMaximized;
      }
      $location.path(path);
      if(asChromeApp) {
        analyticsTracker.sendAppView(path);
      }
    };

    $scope.hasFooter = function() {
      return $scope.$state.current.views && $scope.$state.current.views.footer;
    };

    $scope.initialize = function(host) {
      if($scope.xbmc.isConnected()) {
        $scope.xbmc.disconnect();
      }
      $scope.xbmc.connect(host.ip, host.port);
      if(host.username !== '' && host.password !== '') {
        //Let RAL knows that we should use credentials
        RAL.authorization = {
          username : host.username,
          password : host.password
        };
        var authentificationPrefix = host.username + ':' + host.password + '@';
        $scope.webserverURL = 'http://'+authentificationPrefix+host.ip+':'+host.httpPort;
      }
      $scope.initialized = true;
      var hash = window.location.hash;
      var path = hash.replace('#', '');
      $scope.go(path === '' ? '/' : path);
    };

    $scope.isConnected = function() {
      return xbmc.isConnected()
    };

    $scope.toggleDrawer = function() {
      $scope.isMaximized = !$scope.isMaximized;
    };

    $scope.toggleTheme = function() {
      $scope.theme = $scope.theme === 'yin' ? 'yang' : 'yin';
      storage.setItem('theme', $scope.theme);
    };

    $scope.hideDrawer = function() {
      $scope.isMaximized = false;
    };

    $scope.showDrawer = function() {
      $scope.isMaximized = true;
    };

    function onApplicationPropertiesRetrieved(properties) {
      $scope.application = properties;
    }

    function onPlayerPropertiesRetrieved(properties) {
      if (properties) {
        var timeFilter = $filter('time');
        $scope.player.audiostreams = properties.audiostreams;
        $scope.player.current = {
          audiostream: properties.currentaudiostream,
          subtitle: properties.currentsubtitle
        };
        $scope.player.seek = {
          time: timeFilter(properties.time),
          totaltime: timeFilter(properties.totaltime),
          percentage: properties.percentage
        };
        $scope.player.speed = properties.speed;
        $scope.player.subtitles = properties.subtitles;
        $scope.player.type = properties.type;

        $scope.playlist = properties.playlistid;
        xbmc.setActivePlaylist(properties.playlistid);
        if (properties.speed === 1) {
          window.clearInterval($scope.player.intervalId);
          $scope.player.intervalId = window.setInterval(updateSeek, 1000);
        }
      }
    };

    function onPlayerItemRetrieved(item) {
      $scope.player.item = item;
      xbmc.getPlayerProperties(onPlayerPropertiesRetrieved);
    };

    function onPlayersRetrieved(players) {
      if (players.length > 0) {
        var player = players[0];
        $scope.player.id = player.playerid;
        $scope.player.active = true;
        xbmc.setActivePlayer($scope.player.id);
        xbmc.getPlayerItem(onPlayerItemRetrieved);
      }
    };

    function onVolumeChanged(obj) {
      $scope.application.volume = obj.params.data.volume;
      $scope.application.muted = obj.params.data.muted;
    };

    var updateSeek = function() {
      $scope.$apply(function() {
        $scope.player.seek.time++;
        $scope.player.seek.percentage = $scope.player.seek.time / $scope.player.seek.totaltime * 100;
        var now = Date.now();
        if (now - $scope.player.seek.lastUpdate > 5000) {
          xbmc.getPlayerProperties(onPlayerPropertiesRetrieved);
        } else {
          $scope.player.seek.lastUpdate = now;
        }
      });
    };

    var onPlayerPause = function() {
      $scope.player.speed = 0;
      window.clearInterval($scope.player.intervalId);
    };

    var onPlayerPlay = function(obj) {
      $scope.$apply(function() {
        var player = obj.params.data.player;
        $scope.player.id = player.playerid;
        $scope.player.active = true;
        xbmc.setActivePlayer(player.playerid);

        xbmc.getPlayerItem(onPlayerItemRetrieved);
      });
    };

    var onPlayerStop = function(obj) {
      window.clearInterval($scope.player.intervalId);
      $scope.player.seek.time = $scope.player.seek.totaltime;
      $scope.player.seek.percentage = 100;
      $scope.player.seek.lastUpdate = Date.now();
      $scope.player.active = false;
    };

    var onPlayerSeek = function(obj) {
      var data = obj.params.data;
      var time = data.player.time;
      var timeFilter = $filter('time');
      var seek = $scope.player.seek;
      seek.time = timeFilter(time);
      seek.percentage = seek.time / seek.totaltime * 100;
    };

    var onPlaylistClear = function() {
      $scope.playlist = -1;
      xbmc.setActivePlaylist(-1);
    };

    xbmc.register('Player.OnPause', {
      fn: onPlayerPause,
      scope: this
    });
    xbmc.register('Player.OnPlay', {
      fn: onPlayerPlay,
      scope: this
    });
    xbmc.register('Player.OnStop', {
      fn: onPlayerStop,
      scope: this
    });
    xbmc.register('Player.OnSeek', {
      fn: onPlayerSeek,
      scope: this
    });
    xbmc.register('Playlist.OnClear', {
      fn: onPlaylistClear,
      scope: this
    });
    xbmc.register('Application.OnVolumeChanged', {
      fn: onVolumeChanged,
      scope : this
    });

    var onLoad = function() {
      $scope.$apply(function() {
        $scope.connected = true;
      });
      xbmc.getApplicationProperties(onApplicationPropertiesRetrieved);
      xbmc.getActivePlayers(onPlayersRetrieved);
    }
    var onDisconnect = function() {
      $scope.connected = false;
      $scope.initialized = true;
    };

    if (xbmc.isConnected()) {
      onLoad();
    } else {
      xbmc.register('Websocket.OnConnected', {
        fn: onLoad,
        scope: this
      });
      xbmc.register('Websocket.OnDisconnected', {
        fn: onDisconnect,
        scope: this
      });
      storage.getItem('xbmchost').then(function(value) {
        if (value !== null) {
          //Old version of the app
          var defaultHost = value.host;
          defaultHost.default = true;
          storage.removeItem('xbmchost');
          $scope.hosts = [defaultHost];
          storage.setItem('hosts', $scope.hosts);
          $scope.initialize(defaultHost);
        } else {
          //New version of the app migration was done. Default behavior
          storage.getItem('hosts').then(function(value) {
            if (value !== null) {
              var filterDefault = function(el) {
                return el.default;
              };
              $scope.hosts = value;
              var defaultHost = $scope.hosts.filter(filterDefault)[0];
              $scope.initialize(defaultHost);
            } else {
              $scope.initialized = true;
              $scope.go('/host/wizard');
            }
          });

        }
      })
    }

    $scope.previousState = null;
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      var hash = fromState.url;
      angular.forEach(fromParams, function(value, key) {
        hash = hash.replace(':' + key, value);
      });
      $scope.previousHash = hash;
    });
    $scope.$watch('hosts', function(newVal, oldVal) {
      var filterDefault = function(el) {
        return el.default;
      }
      var filtered = $scope.hosts.filter(filterDefault);
      $scope.host = filtered[0];
    });
  }
]);