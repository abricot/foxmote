var BaseSeasonsCtrl = function ($scope, $stateParams) {
  $scope.loading = true;
  $scope.updating = false;
  $scope.tvshowid = parseInt($stateParams.tvshowid);

  $scope.seasons  = [];
};


angular.module('app')
.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('seasons', {
      url: '/tvshow',
      views: {
        header: {templateUrl: 'layout/headers/backable.tpl.html'},
        body: {templateUrl: 'layout/view.tpl.html'}
      }
    }).state('seasons.details', {
      url : '/:tvshowid',
      templateUrl : 'modules/tvshow/seasons.tpl.html',
      controller : 'TvShowSeasonsCtrl'
    }).state('seasons.tmdb', {
      url : '/tmdb/:tvshowid',
      templateUrl : 'modules/tvshow/seasons.tpl.html',
      controller : 'TMDBTvShowSeasonsCtrl'
    });
  }
])
.controller('TvShowSeasonsCtrl', ['$scope', '$stateParams', '$location', '$injector', '$filter',
  function TvShowSeasonsCtrl($scope, $stateParams, $location, $injector, $filter) {
    $injector.invoke(BaseSeasonsCtrl, this, {$scope: $scope, $stateParams: $stateParams});

    function onSeasonsRetrieved(seasons) {
      $scope.seasons = seasons || [];
      $scope.loading = false;
      $scope.updating = false;
    };
    var onLoad = function() {
      $scope.xbmc.getSeasons($scope.tvshowid, onSeasonsRetrieved);
    };

    $scope.xbmc.register('VideoLibrary.OnScanFinished', {
      fn: onLoad,
      scope: this
    });
    if ($scope.xbmc.isConnected()) {
      onLoad();
    } else {
      $scope.xbmc.register('Websocket.OnConnected', {
        fn: onLoad,
        scope: this
      });
    }

    $scope.hasControls = function() {
      return true;
    }

    $scope.getPoster = function (season) {
      return $scope.getImage(season.thumbnail);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('asset')(image, $scope.host);
      return $filter('fallback')(url, fallback);
    };

    $scope.getSeasonPath = function (season) {
      return '#/tvshow/' + $scope.tvshowid + '/season/' + season.season;
    };

    $scope.scan = function () {
      $scope.updating = true;
      $scope.xbmc.scan('VideoLibrary');
    };
  }
])
.controller('TMDBTvShowSeasonsCtrl', ['$scope', '$stateParams', '$location', '$injector', '$filter',
  function TMDBTvShowSeasonsCtrl($scope, $stateParams, $location, $injector, $filter) {
    $injector.invoke(BaseSeasonsCtrl, this, {$scope: $scope, $stateParams: $stateParams});

    function onTvShowRetrieved(result) {
      $scope.seasons = result.data.seasons || [];
      $scope.seasons.forEach(function(season) {
        season.showtitle = result.data.name;
        season.label = 'Season '+season.season;
        season.fanart = result.data.fanart;
      });
      $scope.loading = false;
      $scope.updating = false;
    };

    $scope.tmdb.tv.details($scope.tvshowid).then(onTvShowRetrieved);

    $scope.hasControls = function() {
      return false;
    }

    $scope.getPoster = function (season) {
      return $scope.getImage(season.poster);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png'
      var url = $filter('tmdbImage')(image, 'w500');
      return $filter('fallback')(url, fallback);
    };

    $scope.getSeasonPath = function (season) {
      return '#/tvshow/' + $scope.tvshowid + '/season/tmdb/' + season.season;
    };
  }
]);