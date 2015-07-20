var BaseEpisodesCtrl = function ($scope, $stateParams) {
  $scope.loading = true;
  $scope.tvshowid = parseInt($stateParams.tvshowid);
  $scope.season = parseInt($stateParams.season);

  $scope.episodes  = [];
};

angular.module('app')
.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('episodes', {
      url: '/tvshow/:tvshowid/season',
      views: {
        header: {templateUrl: 'layout/headers/backable.tpl.html'},
        body: {templateUrl: 'layout/view.tpl.html'}
      }
    }).state('episodes.xbmc', {
      url : '/:season',
      templateUrl : 'modules/tvshow/episodes.tpl.html',
      controller : 'TvShowEpisodesCtrl'
    }).state('episodes.tmdb', {
      url : '/tmdb/:season',
      templateUrl : 'modules/tvshow/episodes.tpl.html',
      controller : 'TMDBTvShowEpisodesCtrl'
    });
  }
])
.controller('TvShowEpisodesCtrl', ['$scope', '$stateParams', '$injector', '$filter',
  function TvShowEpisodesCtrl($scope, $stateParams, $injector, $filter) {
    $injector.invoke(BaseEpisodesCtrl, this, {$scope: $scope, $stateParams: $stateParams});

    $scope.queue = [];

    var playlistAdd = function () {
      if($scope.queue.length > 0) {
        $scope.xbmc.queue({episodeid: $scope.queue[0].episodeid});
        $scope.queue = $scope.queue.slice(1);
        if ($scope.queue.length > 0) {
          window.setTimeout(playlistAdd.bind(this), 500);
        }
      }
    };

    $scope.$watch('playlist', function () {
      playlistAdd();
    }, true);

    function onEpisodesRetrieved(episodes) {
      $scope.loading = false;
      $scope.episodes = episodes;
    };

    var onLoad = function() {
      $scope.laoding = true;
      $scope.xbmc.getEpisodes($scope.tvshowid, $scope.season, onEpisodesRetrieved);
    };

    if ($scope.xbmc.isConnected()) {
      onLoad();
    } else {
      $scope.xbmc.register('Websocket.OnConnected', {
        fn: onLoad,
        scope: this
      });
    }

    $scope.getEpisodePath = function (episode) {
      return '/tvshow/' + $scope.tvshowid + '/season/'+$scope.season+'/episode/'+episode.episodeid;
    };

    $scope.getFanart = function () {
      return $scope.getImage($scope.episodes[0].art['tvshow.fanart'], 'img/backgrounds/banner.png');
    };

    $scope.getPoster = function (episode) {
      return $scope.getImage(episode.thumbnail);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('asset')(image, $scope.host);
      return $filter('fallback')(url, fallback);
    };

    $scope.hasControls = function () {
      return true;
    };

    $scope.queueAll = function () {
      $scope.xbmc.queue({episodeid : $scope.episodes[0].episodeid});
      $scope.queue = $scope.episodes.slice(1);
    };
  }
])
.controller('TMDBTvShowEpisodesCtrl', ['$scope', '$stateParams', '$injector', '$filter',
  function TMDBTvShowEpisodesCtrl($scope, $stateParams, $injector, $filter) {
    $injector.invoke(BaseEpisodesCtrl, this, {$scope: $scope, $stateParams: $stateParams});

    function onEpisodesRetrieved(result) {
      $scope.loading = false;
      var now = new Date();
      var episodes = result.data.episodes;
      $scope.episodes = episodes.filter(function(episode){
        var airDate = new Date(episode.firstaired);
        return airDate.getTime() < now;
      }).reverse();

    };

    function onTvShowRetrieved(result) {
      $scope.show = result.data;
      if($scope.show.seasons.length > 0) {
        $scope.tmdb.tv.seasons($scope.tvshowid, $scope.season).then(onEpisodesRetrieved);
      } else {
        $scope.loading = false;
      }
    };

    $scope.tmdb.tv.details($scope.tvshowid).then(onTvShowRetrieved);

    $scope.hasControls = function () {
      return false;
    };

    $scope.getEpisodePath = function (episode, index) {
      return '/tvshow/' + $scope.tvshowid + '/season/'+$scope.season+'/episode/tmdb/'+index;
    };

    $scope.getFanart = function () {
      return $scope.getImage($scope.show.fanart, 'img/backgrounds/banner.png');
    };

    $scope.getPoster = function (episode) {
      return $scope.getImage(episode.thumbnail);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('tmdbImage')(image, 'w500');
      return $filter('fallback')(url, fallback);
    };
  }
]);