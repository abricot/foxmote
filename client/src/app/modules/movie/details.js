var BaseMovieDetailsCtrl = function ($scope, $stateParams) {
  $scope.movieid = parseInt($stateParams.movieid);
  $scope.loading = true;
  $scope.isCurrentlyPlaying = false;

  $scope.movie  = null;

  $scope.getActors = function () {
    return $scope.movie.cast.filter(function(actor) {
      return actor.role !== '' && typeof actor.thumbnail !== 'undefined';
    })
  };
};

angular.module('app')
.controller('MovieDetailsCtrl', ['$scope', '$stateParams', '$location', '$injector', '$filter',
  function MovieDetailsCtrl($scope, $stateParams, $location, $injector, $filter) {
    $injector.invoke(BaseMovieDetailsCtrl, this, {$scope: $scope, $stateParams: $stateParams});

    function isCurrentlyPlaying() {
      return $scope.player.active && $scope.player.item.id === $scope.movie.movieid;
    };

    function onMovieRetrieved (item) {
      item.type = 'movie';
      $scope.movie = item;
      $scope.isCurrentlyPlaying = isCurrentlyPlaying();
      $scope.loading = false;
    };
    var onLoad = function () {
      $scope.xbmc.getMovieDetails($scope.movieid, onMovieRetrieved);
    };
    if ($scope.xbmc.isConnected()) {
      onLoad();
    } else {
      $scope.xbmc.register('Websocket.OnConnected', { fn : onLoad, scope : this});
    }

    $scope.getImage = function (path) {
      var url = $filter('asset')(path, $scope.host);
      return $filter('fallback')(url, 'img/icons/foxy-512.png');
    };

    $scope.hasAdditionalInfo = function () {
      return true;
    };

    $scope.imdb = function (imdbnumber) {
      window.open('http://www.imdb.com/title/' + imdbnumber + '/', '_blank');
    };

    $scope.isUsingExternalAddon = function () {
      return false;
    };

    $scope.play = function(movie) {
      $scope.xbmc.open({'movieid': movie.movieid});
    };

     $scope.queue = function(movie) {
      $scope.xbmc.queue({'movieid': movie.movieid});
    };

    $scope.$watch('player.item', function (newVal, oldVal) {
      $scope.isCurrentlyPlaying = isCurrentlyPlaying();
    });
  }
])
.controller('TMDBMovieDetailsCtrl', ['$scope', '$stateParams', '$injector', '$filter', '$http', '$interpolate',
  function TMDBMovieDetailsCtrl($scope, $stateParams, $injector, $filter, $http, $interpolate) {
    $injector.invoke(BaseMovieDetailsCtrl, this, {$scope: $scope, $stateParams: $stateParams});
    var playFn = $interpolate('http://{{ip}}:{{port}}/jsonrpc?request={ "jsonrpc": "2.0", "method": "Player.Open", "params" : {"item": { "file": "{{path}}" }}, "id": {{uid}}}');

    $scope.tmdb.movies.details($scope.movieid).then(function(result) {
      $scope.movie = result.data;
      $scope.tmdb.movies.credits($scope.movieid).then(function(result){
        $scope.movie.cast = result.data.cast;
        var crew = result.data.crew;
        $scope.movie.director = crew.filter(function(member){
          return member.job.toLowerCase() === 'director';
        }).map(function(obj) {
          return obj.name;
        });
        $scope.movie.writer = crew.filter(function(member){
          return member.job.toLowerCase() === 'writer';
        }).map(function(obj) {
          return obj.name;
        });
        $scope.loading = false;
      });
      $scope.tmdb.movies.videos($scope.movieid).then(function(result){
        var videos = result.data.results;
        if(videos && videos.length > 0) {
          $scope.movie.trailer = 'plugin://plugin.video.youtube/?action=play_video&videoid='+videos[0].key;
        }
      })
    });

    $scope.getImage = function (path, size) {
      var url = $filter('tmdbImage')(path, size || 'original');
      return $filter('fallback')(url, 'img/icons/foxy-512.png');
    };

    $scope.hasAdditionalInfo = function () {
      return false;
    };

    $scope.isUsingExternalAddon = function () {
      return true;
    };

    $scope.play = function(movie) {
      //if($scope.host.videoAddon.toLowerCase().indexOf('youtube')>-1) {
        $scope.xbmc.open({'file': movie.trailer});
      /*} else {
        var path = '/movie/'+$scope.movie.imdbnumber+'/play';
        var url = playFn({
          ip : $scope.host.ip,
          port : $scope.host.httpPort,
          path : 'plugin://'+$scope.host.videoAddon + path,
          uid : Date.now()
        });
        $http.get(url);
      }*/
    };

    $scope.queue = function(movie) {};
  }
]);

