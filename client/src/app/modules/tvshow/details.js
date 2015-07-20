var BaseEpisodeCtrl = function ($scope, $stateParams) {
  $scope.loading = true;
  $scope.updating = false;
  $scope.tvshowid = parseInt($stateParams.tvshowid);
  $scope.season = parseInt($stateParams.season);
  $scope.episodeid = parseInt($stateParams.episodeid);

  $scope.episode  = null;
};

angular.module('app')
.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('episode', {
      url: '/tvshow/:tvshowid/season/:season/episode',
      views: {
        header: {templateUrl: 'layout/headers/backable.tpl.html'},
        body: {templateUrl: 'layout/view.tpl.html'}
      }
    }).state('episode.xbmc', {
      url : '/:episodeid',
      templateUrl : 'modules/tvshow/details.tpl.html',
      controller : 'EpisodeDetailsCtrl'
    }).state('episode.tmdb', {
      url : '/tmdb/:episodeid',
      templateUrl : 'modules/tvshow/details.tpl.html',
      controller : 'TMDBEpisodeDetailsCtrl'
    });
  }
])
.controller('EpisodeDetailsCtrl', ['$scope', '$stateParams', '$location',  '$injector', '$filter',
  function EpisodeDetailsCtrl($scope, $stateParams, $location, $injector, $filter) {
    $injector.invoke(BaseEpisodeCtrl, this, {$scope: $scope, $stateParams: $stateParams});
    
    $scope.isCurrentlyPlaying = false;
    $scope.episodeid = parseInt($stateParams.episodeid);
    var episode = null;

    function isCurrentlyPlaying() {
      return $scope.player.active && $scope.player.item.id === $scope.episode.episodeid;
    };

    function onTvShowDetailsRetrieved(details) {
      episode.genre = details.genre;
      $scope.episode = episode;
      $scope.isCurrentlyPlaying = isCurrentlyPlaying();
      $scope.loading = false;
    };

    function onEpisodeDetailsRetrieved(item) {
      item.type = 'episode';
      episode = item;
      $scope.xbmc.getTVShowDetails(episode.tvshowid, onTvShowDetailsRetrieved);
    };

    var onLoad = function() {
      $scope.loading = true;
      $scope.xbmc.getEpisodeDetails($scope.episodeid, onEpisodeDetailsRetrieved);
    };

    if ($scope.xbmc.isConnected()) {
      onLoad();
    } else {
      $scope.xbmc.register('Websocket.OnConnected', {
        fn: onLoad,
        scope: this
      });
    }

    $scope.$watch('player.item', function (newVal, oldVal) {
      $scope.isCurrentlyPlaying = isCurrentlyPlaying();
    });

    $scope.getFanart = function () {
      return $scope.getImage($scope.episode.thumbnail, 'img/backgrounds/banner.png');
    };

    $scope.getPoster = function () {
      return $scope.getImage($scope.episode.art['tvshow.poster']);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('asset')(image, $scope.host);
      return $filter('fallback')(url, fallback);
    };

    $scope.hasExtra = function () {return true;};
    $scope.play = function(episode) {$scope.xbmc.open({'episodeid': episode.episodeid});};
  }
])
.controller('TMDBEpisodeDetailsCtrl', ['$scope', '$stateParams', '$location',  '$injector', '$filter',
  function TMDBEpisodeDetailsCtrl($scope, $stateParams, $location, $injector, $filter) {
    $injector.invoke(BaseEpisodeCtrl, this, {$scope: $scope, $stateParams: $stateParams});
    
    function onEpisodesRetrieved(result) {
      $scope.loading = false;
      var now = new Date();
      var episodes = result.data.episodes;
      $scope.episodes = episodes.filter(function(episode){
        var airDate = new Date(episode.firstaired);
        return airDate.getTime() < now;
      }).reverse();
      $scope.episode = $scope.episodes[$scope.episodeid];
    };

    function onTvShowRetrieved(result) {
      $scope.show = result.data;

      if($scope.show.seasons.length > 0) {
        $scope.seasons = $scope.show.seasons;
        $scope.tmdb.tv.seasons($scope.tvshowid, $scope.season).then(onEpisodesRetrieved);
      } else {
        $scope.loading = false;
      }
    };

    $scope.tmdb.tv.details($scope.tvshowid).then(onTvShowRetrieved);
    $scope.hasExtra = function () {return false;};

     $scope.getFanart = function () {
      return $scope.getImage($scope.episode.thumbnail);
    };

    $scope.getPoster = function () {
      return $scope.getImage($scope.show.poster, 'img/backgrounds/banner.png');
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('tmdbImage')(image, 'w500');
      return $filter('fallback')(url, fallback);
    };
    $scope.play = function(episode) {
      $scope.tmdb.tv.videos(
        $scope.tvshowid, 
        $scope.season, 
        episode.episode).then(function(result){
          var videos = result.data.results;
          var pluginURL = 'plugin://'+$scope.host.videoAddon+'/?action=play_video&videoid='+videos[0].key;
          $scope.xbmc.open({file: pluginURL});
      });
    };
  }
]);