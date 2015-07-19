angular.module('app')
.config(['$stateProvider', function ($stateProvider) {
  $stateProvider.state('movie', {
    url: '/movie',
    views: {
      header: {templateUrl: 'layout/headers/backable.tpl.html'},
      body: {templateUrl: 'layout/view.tpl.html'}
    }
  }).state('movie.details', {
    url: '/:movieid',
    templateUrl: 'modules/movie/details.tpl.html',
    controller: 'MovieDetailsCtrl'
  }).state('movie.tmdb', {
    url: '/tmdb/:movieid',
    templateUrl: 'modules/movie/details.tpl.html',
    controller: 'TMDBMovieDetailsCtrl'
  });
}])