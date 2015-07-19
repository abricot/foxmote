angular.module('app')
.config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('tvshows', {
      url: '/tvshows',
      views: {
        header: { templateUrl: 'layout/headers/basic.tpl.html'},
        body: { templateUrl: 'layout/view.tpl.html'}
      }
    }).state('tvshows.all', {
      url : '/all',
      templateUrl: 'modules/tvshow/list.tpl.html',
      controller: 'TvShowListCtrl'
    }).state('tvshows.popular', {
      url : '/popular',
      templateUrl: 'modules/tvshow/list.tpl.html',
      controller: 'PopularShowsCtrl'
    });
  }
])