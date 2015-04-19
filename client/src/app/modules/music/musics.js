angular.module('app')
.config(['$stateProvider', function ($stateProvider) {
  $stateProvider.state('music', {
    url: '/musics',
    views: {
      header: {templateUrl: 'layout/headers/basic.tpl.html'},
      body: {
        templateUrl: 'modules/music/musics.tpl.html',
        controller: 'MusicCtrl'
      }
    }
  }).state('music.albums', {
    url : '/albums',
    templateUrl: 'modules/music/albums.tpl.html',
    controller: 'MusicAlbumsCtrl'
  }).state('music.artists', {
    url : '/artists',
    templateUrl: 'modules/music/artists.tpl.html',
    controller: 'MusicArtistsCtrl'
  }).state('music.songs', {
    url : '/songs',
    templateUrl: 'modules/music/songs.tpl.html',
    controller: 'MusicSongsCtrl'
  });
}])
.controller('MusicCtrl', ['$scope',
  function MusicCtrl($scope, $stateParams) {
    var states = ['music.albums','music.artists','music.songs'];
    var paths = ['/musics/albums', '/musics/artists', '/musics/songs'];
    $scope.isSelected = function (category) {
      return $scope.$state.current.name === category;
    }
  }
]);