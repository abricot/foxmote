angular.module('app')
.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('playing', {
      url: '/now/playing',
      views: {
        header: {
          templateUrl: 'layout/headers/backable.tpl.html'
        },
        body: {
          templateUrl: 'modules/now/playing.tpl.html',
          controller: 'NowPlayingCtrl'
        }
      }
    });
  }
])
.controller('NowPlayingCtrl', ['$scope', '$filter',
  function NowPlayingCtrl($scope, $filter) {
    $scope.loading = true;
    $scope.showAudioSelect = false;
    $scope.showSubtitleSelect = false;
    $scope.showTimePicker = false;

    $scope.stream = 0;
    $scope.sub = 0;

    $scope.$watch('player.current', function (newVal, oldVal) {
      if($scope.player.current) {
        if( $scope.player.current.audiostream) {
          $scope.stream = $scope.player.current.audiostream.index;
        }
        if($scope.player.current.subtitle) {
          $scope.sub = $scope.player.current.subtitle.index || 'off';
        }
      }
    });

    var timeFilter = $filter('time');
    $scope.seekTime = timeFilter($scope.player.seek.time);

    function onPlayerItemRetrieved(item) {
      
      if($scope.library.item.type === 'episode') {
        $scope.xbmc.getTVShowDetails(item.tvshowid, function(details){
          item.genre = details.genre;
          $scope.episode = item;
          $scope.loading = false;
        });
      } else if($scope.library.item.type === 'movie') {
        $scope.movie = item;
        $scope.loading = false;
      } else {
        $scope.library.item = item;
        $scope.loading = false;
      }
    };

    function onPlayersRetrieved(players) {
      if (players.length > 0) {
        var player = players[0];
        $scope.xbmc.getPlayerItem(onPlayerItemRetrieved, player.playerid);
      } else {
        $scope.go('/');
      }
    };

    var onLoad = function() {
      $scope.xbmc.getActivePlayers(onPlayersRetrieved);
    };
    if ($scope.xbmc.isConnected()) {
      onLoad();
    } else {
      $scope.xbmc.register('Websocket.OnConnected', {
        fn: onLoad,
        scope: this
      });
    }
    $scope.hasExtra = function () {
      return true;
    };
    $scope.getFanart = function () {
      return $scope.getImage($scope.episode.thumbnail, 'img/backgrounds/banner.png');
    };

    $scope.getPoster = function () {
      return $scope.getImage($scope.episode.art['tvshow.poster']);
    };

    $scope.getImage = function (path) {
      var url = $filter('asset')(path, $scope.host);
      return $filter('fallback')(url, 'img/icons/foxy-512.png');
    };

    $scope.isTypeVideo = function() {
      return $scope.player.type === 'video' ||
      $scope.player.type === 'movie' ||
      $scope.player.type === 'episode';
    };

    $scope.isSelected = function(current, obj) {
      if (typeof obj === 'string') {
        return obj === current;
      } else {
        return obj.index === current.index;
      }
    };

    $scope.onSeekbarChanged = function(newValue) {
      $scope.updateSeek(newValue);
    };

    var removeTime = function(date) {
      date.setSeconds(0);
      date.setHours(0);
      date.setMinutes(0);
      return date;
    };

    $scope.onValidateSeekTime = function() {
      var startTime = removeTime(new Date()).getTime();
      var totalTime = timeFilter($scope.player.seek.totaltime).getTime();
      var seekTime = $scope.seekTime.getTime();
      var percent = (seekTime - startTime) / (totalTime - startTime) * 100;
      $scope.updateSeek(Math.floor(percent));
      $scope.showTimePicker = false;
    };

    $scope.onValidateAudioStream = function() {
      $scope.showAudioSelect = false;
      $scope.xbmc.setAudioStream($scope.stream);
    };

    $scope.onValidateSubtitles = function() {
      $scope.showSubtitleSelect = false;
      $scope.xbmc.setSubtitle($scope.sub);
    };

    $scope.toggleAudioStreams = function() {
      $scope.showAudioSelect = !$scope.showAudioSelect;
    };

    $scope.toggleSubtitles = function() {
      $scope.showSubtitleSelect = !$scope.showSubtitleSelect;
    };

    $scope.toggleTimePicker = function() {
      $scope.seekTime = timeFilter($scope.player.seek.time);
      $scope.showTimePicker = !$scope.showTimePicker;
    };

    $scope.updateSeek = function(newValue) {
      newValue = Math.min(newValue, 100);
      newValue = Math.max(newValue, 0);
      $scope.xbmc.seek(newValue);
    },

    $scope.$watch('player.item', function() {
      $scope.library.item = $scope.player.item;
    }, true);
  }
]);