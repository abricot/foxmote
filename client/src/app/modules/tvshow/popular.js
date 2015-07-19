angular.module('app')
.controller('PopularShowsCtrl', ['$scope', '$filter',
  function PopularShowsCtrl($scope, $filter) {
    $scope.loading = true;
    $scope.fetching = false;
    $scope.tvshows = [];
    $scope.pages = 1;
    $scope.total = Infinity;
    var now = new Date();
    var firstAirDate = (now.getFullYear()-5)+'-01-01';
    var cleanUpResults = function(results) {
      return results.filter(function(show){
        return show.rating > 0;
      });
    };

    function onTvShowsFromSource(response) {
      $scope.total = response.data.totalPages;
      $scope.tvshows = $scope.tvshows.concat(cleanUpResults(response.data.results));
      updateRandomShow();
      $scope.fetching = false;
      $scope.loading = false;
    };

    $scope.tmdb.tv.populars(firstAirDate, 5, $scope.pages).then(onTvShowsFromSource);

     function updateRandomShow() {

      if($scope.tvshows.length) {
        var randomIndex = Math.floor(Math.random()*$scope.tvshows.length);
        $scope.randomShow = $scope.tvshows[randomIndex];
      }
    };

    $scope.hasControls = function () {
      return false;
    };

    $scope.getEpisodesPath = function(show) {
      return '#/tvshow/tmdb/'+show.id;
    };

    $scope.getExtra = function (show) {
      return 'First aired ' + show.firstaired;
    };

    $scope.getFanart = function (show) {
      return $scope.getImage(show.fanart);
    };

    $scope.getPoster = function (show) {
      return $scope.getImage(show.poster);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png';
      var url = $filter('tmdbImage')(image, 'w500');
      return $filter('fallback')(url, fallback);
    }

    $scope.getStudio = function(show) {
      return 'img/icons/default-studio.png';
    };

    $scope.loadMore = function () {
      if( $scope.pages < $scope.total) {
        $scope.fetching = true;
        $scope.tmdb.tv.populars(firstAirDate, 5, ++$scope.pages).then(onTvShowsFromSource);
      }
    };

  }]
);