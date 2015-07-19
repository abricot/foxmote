angular.module('app')
.config(['$stateProvider', function ($stateProvider) {
  $stateProvider.state('movies', {
    url: '/movies',
    views: {
      header: {templateUrl: 'layout/headers/basic.tpl.html'},
      body: {
        templateUrl: 'layout/view.tpl.html'
      }
    }
  }).state('movies.all', {
    url : '/all',
    templateUrl: 'modules/movie/list.tpl.html',
    controller: 'MovieListCtrl'
  }).state('movies.popular', {
    url : '/popular',
    templateUrl: 'modules/movie/list.tpl.html',
    controller: 'PopularMoviesCtrl'
  });
}])