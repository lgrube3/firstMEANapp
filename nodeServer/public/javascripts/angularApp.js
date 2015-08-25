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
        })
        .state('login', {
            url: '/login',
            templateUrl: '/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        })
        .state('register', {
            url: '/register',
            templateUrl: '/register.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        });

    $urlRouterProvider.otherwise('home');
});



app.controller('MainCtrl', function($scope, posts, auth) {
    $scope.posts = posts.posts;
    $scope.isLoggedIn = auth.isLoggedIn;

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
    $scope.incrementDownvotes = function(post) {
        posts.downvote(post);
    };
});


app.controller('PostsCtrl', function($scope, posts, post, auth) {

    $scope.post = post;
    $scope.isLoggedIn = auth.isLoggedIn;

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

app.controller('NavCtrl', function($scope, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
});


app.controller('AuthCtrl', function($scope, $state, auth) {
    $scope.user = {};

    $scope.register = function() {
        auth.register($scope.user).error(function(error) {
            $scope.error = error;
        }).then(function() {
            $state.go('home');
        });
    };

    $scope.logIn = function() {
        auth.logIn($scope.user).error(function(error) {
            $scope.error = error;
        }).then(function() {
            $state.go('home');
        });
    };
});


app.factory('posts', function($http, auth) {

    var o = {
        posts: []
    };

    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            angular.copy(data, o.posts);
        });
    };

    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            o.posts.push(data);
        });
    };

    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            post.upvotes += 1;
        });
    };

    o.downvote = function(post) {
        return $http.put('/posts/' + post._id + '/downvote', null, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            post.upvotes -= 1;
        });
    };

    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res) {
            return res.data;
        });
    };

    o.addComment = function(post, comment) {
        return $http.post('/posts/' + post._id + '/comments', comment, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            post.comments.push(data);
        });
    };

    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            comment.upvotes += 1;
        });
    };

    return o;

});


app.factory('auth', function($http, $window) {
    var auth = {};

    auth.saveToken = function(token) {
        $window.localStorage['firstMeanApp-token'] = token;
    };

    auth.getToken = function() {
        return $window.localStorage['firstMeanApp-token'];
    };

    auth.isLoggedIn = function() {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    auth.register = function(user) {
        return $http.post('/register', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function(user) {
        return $http.post('/login', user).success(function(data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function() {
        $window.localStorage.removeItem('firstMeanApp-token');
    };

    return auth;
});
