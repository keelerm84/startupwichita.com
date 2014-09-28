(function(angular) {
    'use strict';

    var ResourcesController = [
        '$scope', '$stateParams', '$location', 'Global', 'Resources', 'Tags',
        function ($scope, $stateParams, $location, Global, Resources, Tags) {
            $scope.tagOptions = Tags.query();

            $scope.global = Global;
            $scope.newResource = {};

            $scope.create = function() {
                var resource = new Resources({
                    title: $scope.newResource.title,
                    content: $scope.newResource.content,
                    tags: $scope.newResource.tags.map(function(tag) {
                        return tag.name;
                    }),
                    url: $scope.newResource.url,
                    image: $scope.newResource.image
                });
                resource.$save(function(response) {
                    $location.path('resources/' + response._id);
                }, function () {
                    // TODO Need to show validation errors
                });
            };

            $scope.remove = function(resource) {
                resource.$remove(null, function () {
                    $location.path('resources');
                });
            };

            $scope.update = function() {
                var resource = $scope.resource;

                resource.$update(function() {
                    $location.path('resources/' + resource._id);
                }, function () {
                    // TODO Need to show validation errors
                });
            };

            $scope.find = function() {
                Resources.query(function(resources) {
                    $scope.resources = resources;
                });
            };

            $scope.findOne = function() {
                Resources.get({
                    _id: $stateParams.resourceId
                }, function(resource) {
                    $scope.resource = resource;
                });
            };
        }
    ];

    angular.module('startupwichita.controllers').controller('ResourcesController', ResourcesController);
})(window.angular);
