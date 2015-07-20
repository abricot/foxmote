angular.module('app')
.controller('NavigationCtrl', ['$scope', '$location', '$filter',
  function ($scope, $location, $filter) {
    $scope.medias = [{
      hash: '/movies/all',
      icon: 'icon-film',
      label: 'Movies'
    }, {
      hash: '/tvshows/all',
      icon: 'icon-facetime-video',
      label: 'TV Shows'
    }, {
      hash: '/musics/artists',
      icon: 'icon-music',
      label: 'Musics'
    }];

    $scope.discover = [{
      hash : '/movies/popular',
      icon : 'icon-film',
      label : 'Movies'
    }, {
      hash : '/tvshows/popular',
      icon : 'icon-facetime-video',
      label : 'TV Shows'
    }];

    $scope.controls = [{
      hash: '/',
      icon: 'icon-remote',
      label: 'Remote'
    }, {
      hash: '/hosts',
      icon: 'icon-cogs',
      label: 'Settings'
    }];

    $scope.getLabel = function (item) {
      if (item) {
        return  item.title !== '' ? item.title : item.label;
      }
      return '';
    };

    $scope.hasPoster = function (art) {
      var result = false;
      if (art) {
        if (art['album.thumb'] || art['tvshow.poster'] ||
          art.poster || art.thumb) {
          result =  true;
        }
      }
      return result;
    }

    $scope.isCurrent = function (hash) {
      return hash === $location.path();
    };
  }
]);
