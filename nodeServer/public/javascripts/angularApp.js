var app = angular.module('flapperNews', ['ui.router']);


app.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/home.html',
            resolve: {
                postPromise: function(posts) {
                    //console.log('resolve working');
                    return posts.getAll();
                }
            },
            controller: 'MainCtrl'
        })
        .state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            resolve: {
                post: function($stateParams, posts) {
                    //console.log('resolve working');
                    return posts.get($stateParams.id);
                }
            },
            controller: 'PostsCtrl'
        });

    $urlRouterProvider.otherwise('home');
});



app.controller('MainCtrl', function($scope, posts) {
    $scope.posts = posts.posts;

    $scope.addPost = function() {
        if (!$scope.title || $scope.title === '') {
            return;
        }
        posts.create({
                title: $scope.title,
                link: $scope.link
            })
            /*$scope.posts.push({
                title: $scope.title,
                link: $scope.link,
                upvotes: 0,
                comments: [{
                    author: 'Joe',
                    body: 'Cool post!',
                    upvotes: 0
                }, {
                    author: 'Bob',
                    body: 'Great idea but everything is wrong!',
                    upvotes: 0
                }]
            });*/
        $scope.title = '';
        $scope.link = '';
    };

    $scope.incrementUpvotes = function(post) {
        posts.upvote(post);
    };
});


app.controller('PostsCtrl', function($scope, posts, post) {

    $scope.post = post;

    $scope.addComment = function() {
        if ($scope.body === '') {
            return;
        }
        posts.addComment(post, {
            body: $scope.body,
            author: 'user'
        });
        /*$scope.post.comments.push({
            body: $scope.body,
            author: 'user',
            upvotes: 0
        });*/
        $scope.body = '';
    };

    $scope.incrementUpvotes = function(comment) {
        posts.upvoteComment(post, comment);
    };
});


app.factory('posts', function($http) {

    var o = {
        posts: []
    };

    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            angular.copy(data, o.posts);
        });
    };

    o.create = function(post) {
        return $http.post('/posts', post).success(function(data) {
            o.posts.push(data);
        });
    };

    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote').success(function(data) {
            post.upvotes += 1;
        });
    };

    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res) {
            return res.data;
        });
    };

    o.addComment = function(post, comment) {
        return $http.post('/posts/' + post._id + '/comments', comment).success(function(data) {
            post.comments.push(data);
        });
    };

    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data) {
            comment.upvotes += 1;
        });
    };

    return o;

});
