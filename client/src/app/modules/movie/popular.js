angular.module('app')
.controller('PopularMoviesCtrl', ['$scope', '$filter',
  function PopularMoviesCtrl($scope, $filter) {
    $scope.loading = true;
    $scope.fetching = false;

    $scope.pages = 1;
    $scope.total = Infinity;
    $scope.movies = [];

    var now = new Date();
    var firstReleaseDate = (now.getFullYear()-2)+'-01-01';
    var cleanUpResults = function(results) {
      return results;
    };


    function onMoviesFromSource(response) {
      $scope.total = response.data.totalPages;
      $scope.movies = $scope.movies.concat(cleanUpResults(response.data.results));
      updateRandomMovie();
      $scope.fetching = false;
      $scope.loading = false;
    };

    function updateRandomMovie () {
      if($scope.movies.length) {
        var randomIndex = Math.floor(Math.random()*$scope.movies.length);
        $scope.randomMovie = $scope.movies[randomIndex];
      }
    };

    $scope.tmdb.movies.populars(firstReleaseDate, 5, $scope.pages).then(onMoviesFromSource);

    $scope.getMoviesPath = function(movie) {
      return '#/movie/tmdb/'+movie.id;
    };

    $scope.getPoster = function (movie) {
      return $scope.getImage(movie.poster);
    };

    $scope.getImage = function (image, fallback) {
      fallback = fallback || 'img/icons/foxy-512.png';
      var url = $filter('tmdbImage')(image, 'w500');
      return $filter('fallback')(url, fallback);
    };

    $scope.hasControls = function () {
      return false;
    };

    $scope.loadMore = function () {
      if( $scope.pages < $scope.total) {
        $scope.fetching = true;
        $scope.tmdb.movies.populars(firstReleaseDate, 5, ++$scope.pages).then(onMoviesFromSource);
      }
    };
  }]
);