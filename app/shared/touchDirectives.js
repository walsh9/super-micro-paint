angular.module('touch-directives', [])
    .directive('ngTouchstart', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            compile: function ($element, attr) {
                var fn = $parse(attr['ngTouchstart'], null, false);
                return function ngEventHandler(scope, element) {
                    element.on('touchstart', function (event) {
                        var callback = function () {
                            fn(scope, {
                                $event: event
                            });
                        };
                        scope.$apply(callback);
                    });
                };
            }
        };
    }])
    .directive('ngTouchmove', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            compile: function ($element, attr) {
                var fn = $parse(attr['ngTouchmove'], null, false);
                return function ngEventHandler(scope, element) {
                    element.on('touchmove', function (event) {
                        var callback = function () {
                            fn(scope, {
                                $event: event
                            });
                        };
                        scope.$apply(callback);
                    });
                };
            }
        };
    }])
    .directive('ngTouchend', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            compile: function ($element, attr) {
                var fn = $parse(attr['ngTouchend'], null, false);
                return function ngEventHandler(scope, element) {
                    element.on('touchend', function (event) {
                        var callback = function () {
                            fn(scope, {
                                $event: event
                            });
                        };
                        scope.$apply(callback);
                    });
                };
            }
        };
    }])
    .directive('ngTouchcancel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            compile: function ($element, attr) {
                var fn = $parse(attr['ngTouchcancel'], null, false);
                return function ngEventHandler(scope, element) {
                    element.on('touchcancel', function (event) {
                        var callback = function () {
                            fn(scope, {
                                $event: event
                            });
                        };
                        scope.$apply(callback);
                    });
                };
            }
        };
    }]);
