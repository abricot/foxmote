angular.module('app')
    .config(['$stateProvider',
        function($stateProvider) {
            $stateProvider.state('episode', {
                url: '/tvshow/:tvshowid/:season/:episodeid',
                views: {
                    header: {
                        templateUrl: 'layout/headers/backable.tpl.html'
                    },
                    body: {
                        templateUrl: 'tvshow/details.tpl.html',
                        controller: 'EpisodeDetailsCtrl'
                    }
                }
            });
        }
    ])
    .controller('EpisodeDetailsCtrl', ['$scope', '$stateParams', '$location',
        function EpisodeDetailsCtrl($scope, $stateParams, $location) {
            $scope.episodeid = parseInt($stateParams.episodeid);
            var episode = null;
            function onTvShowDetailsRetrieved(details) {
                episode.genre = details.genre;
                $scope.library.item = episode;
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
                $scope.isCurrentlyPlaying = $scope.player.active && $scope.player.item.id === $scope.library.item.episodeid;
            });
        }
    ]);