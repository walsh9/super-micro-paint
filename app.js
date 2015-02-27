angular.module('super-micro-paint', [])
    .controller('MainCtrl', ['$scope', function ($scope) {
        $scope.numFrames = 4;
        $scope.height = 16;
        $scope.width = 32;
        $scope._ = _;
        $scope.activeTool = 'pencil';
        $scope.undoBuffers = _.range(0, $scope.numFrames)
            .map(function () {
                return [];
            });
        $scope.redoBuffers = _.range(0, $scope.numFrames)
            .map(function () {
                return [];
            });
        $scope.frames = _.range(0, $scope.numFrames)
            .map(function () {
                return new SuperPixelGrid($scope.width, $scope.height)
                    .fill(false);
            });
        $scope.currentFrameNum = 0;
        $scope.currentFrame = new SuperPixelGrid($scope.width, $scope.height)
            .fill(false);
        $scope.overlay = new SuperPixelGrid($scope.width, $scope.height)
            .fill(false);
        $scope.pen = false;
        $scope.penmode = false;
        $scope.penStart = {};
        $scope.lastPixel = {};
        $scope.mode = 'normal';
        $scope.range = function (n) {
            return new Array(n);
        };
        var switchToFrame = function (n) {
            copyFrame($scope.currentFrame, $scope.frames[$scope.currentFrameNum]);
            $scope.currentFrameNum = n;
            copyFrame($scope.frames[n], $scope.currentFrame);
        };
        var clearSelection = function () {
            var selection = ('getSelection' in window) ? window.getSelection() : ('selection' in document) ? document.selection : null;
            if ('removeAllRanges' in selection) {
                selection.removeAllRanges();
            } else if ('empty' in selection) {
                selection.empty();
            }
        };
        var setPixel = function (pixel, mode, scope) {
            scope.currentFrame.set(pixel.x, pixel.y, mode);
        };
        var setUndo = function (frame) {
            var f = frame || $scope.currentFrameNum;
            $scope.undoBuffers[f].push($scope.frames[f].toString());
        };
        var setRedo = function () {
            var f = $scope.currentFrameNum;
            $scope.redoBuffers[f].push($scope.currentFrame.toString());
        };
        $scope.undo = function () {
            var f = $scope.currentFrameNum;
            if ($scope.undoBuffers[f].length > 0) {
                setRedo();
                $scope.currentFrame = $scope.currentFrame.fromString($scope.undoBuffers[f].pop());
            }
        };
        $scope.redo = function () {
            var f = $scope.currentFrameNum;
            if ($scope.redoBuffers[f].length > 0) {
                setUndo();
                $scope.currentFrame = $scope.currentFrame.fromString($scope.redoBuffers[f].pop());
            }
        };
        $scope.canUndo = function () {
            return $scope.undoBuffers[$scope.currentFrameNum].length > 0;
        };
        $scope.canRedo = function () {
            return $scope.redoBuffers[$scope.currentFrameNum].length > 0;
        };
        var getPixel = function (pixel, scope) {
            return $scope.currentFrame.get(pixel.x, pixel.y);
        };
        var tools = {};
        var buildPointToPointDrawingTool = function (drawingFunction) {
            return {
                'penDown': function (point) {
                    setUndo();
                    $scope.pen = true;
                    $scope.penmode = !getPixel(point, $scope);
                    $scope.penStart = point;
                    $scope.overlay.fill(false);
                    $scope.overlay.set(false);
                },
                'penUp': function (point) {
                    var ps = $scope.penStart;
                    $scope.pen = false;
                    $scope.currentFrame[drawingFunction](ps.x, ps.y, point.x, point.y, $scope.penmode);
                    $scope.penStart = {};
                    $scope.overlay.fill(false);
                    clearSelection();
                },
                'penOver': function (point) {
                    if ($scope.pen) {
                        if ($scope.penStart) {
                            var ps = $scope.penStart;
                            $scope.overlay.fill(false)[drawingFunction](ps.x, ps.y, point.x, point.y, true);
                        }
                        $scope.lastPixel = point;
                    }
                }
            };
        };
        tools.pencil = {
            'penDown': function (point) {
                setUndo();
                $scope.pen = true;
                $scope.penmode = !getPixel(point, $scope);
                setPixel(point, !getPixel(point, $scope), $scope);
                $scope.lastPixel = point;
            },
            'penUp': function (point) {
                $scope.pen = false;
                $scope.lastPixel = {};
                clearSelection();
            },
            'penOver': function (point) {
                if ($scope.pen) {
                    var lp = $scope.lastPixel;
                    if (lp && !(lp.x === point.x && lp.y === point.y)) {
                        $scope.currentFrame.drawLine(lp.x, lp.y, point.x, point.y, $scope.penmode);
                    }
                    $scope.lastPixel = point;
                }
            }
        };
        tools.fill = {
            'penDown': function (point) {
                setUndo();
                $scope.penmode = !getPixel(point, $scope);
                $scope.currentFrame.floodFill(point.x, point.y, $scope.penmode);
            }
        };
        tools.line = buildPointToPointDrawingTool('drawLine');
        tools.rectangle = buildPointToPointDrawingTool('drawRectangle');
        tools.ellipse = buildPointToPointDrawingTool('drawEllipse');
        $scope.save = function () {
            location.hash = $scope.frames.map(function (frame) {
                    return frame.toUrlSafeBase64();
                })
                .reduce(function (a, b) {
                    return a + b;
                });
        };
        $scope.doLifeStep = function () {
            setUndo();
            $scope.currentFrame = $scope.currentFrame.lifeStep();
        };
        $scope.clear = function () {
            setUndo();
            $scope.currentFrame.fill(false);
        };
        $scope.nudge = function (xOffset, yOffset) {
            setUndo();
            $scope.currentFrame.nudge(xOffset, yOffset);
        };
        $scope.invert = function (xOffset, yOffset) {
            setUndo();
            $scope.currentFrame.invert();
        };
        var pointFromEvent = function ($event) {
            event = $event.originalEvent;
            var point = {};
            if (event instanceof MouseEvent) {
                point.x = Math.floor(event.target.getAttribute('data-index')
                    .split(',')[0]);
                point.y = Math.floor(event.target.getAttribute('data-index')
                    .split(',')[1]);
                var testpoint = $scope.getPointFromCoords(event.pageX, event.pageY);
            }
            if (('ontouchstart' in window || navigator.msMaxTouchPoints) && event instanceof TouchEvent) {
                var touch = event.changedTouches[0];
                point = $scope.getPointFromCoords(touch.pageX, touch.pageY);
            }
            return point;
        };
        $scope.penDown = function ($event) {
            var point = pointFromEvent($event);
            event.preventDefault();
            if (tools[$scope.activeTool].penDown && $scope.mode === 'normal') {
                tools[$scope.activeTool].penDown(point);
                updatePreviews();
            }
        };
        $scope.penOver = function ($event) {
            var point = pointFromEvent($event);
            event.preventDefault();
            if (tools[$scope.activeTool].penOver && $scope.mode === 'normal') {
                tools[$scope.activeTool].penOver(point);
                updatePreviews();
            }
        };
        $scope.penUp = function ($event) {
            var point = pointFromEvent($event);
            event.preventDefault();
            if (tools[$scope.activeTool].penUp && $scope.mode === 'normal') {
                tools[$scope.activeTool].penUp(point);
                updatePreviews();
            }
        };
        var updatePreviews = function () {
            $scope.frames.map(function (frame, index) {
                var previewCanvas = document.getElementById('preview' + index);
                if (index === $scope.currentFrameNum) {
                    drawPreview($scope.currentFrame, previewCanvas);
                } else {
                    drawPreview(frame, previewCanvas);
                }
            });
        };
        var aniTimer = function () {
            var aniState = 0;
            var aniCanvas = document.getElementById('previewani');
            var animate = function () {
                if (aniState === $scope.currentFrameNum) {
                    drawPreview($scope.currentFrame, aniCanvas);
                } else {
                    drawPreview($scope.frames[aniState], aniCanvas);
                }
                if (aniState >= $scope.numFrames - 1) {
                    aniState = aniState - 3;
                } else {
                    aniState++;
                }
                updatePreviews();
            };
            window.setInterval(animate, 250);
        }();
        $scope.copyStart = function () {
            if ($scope.mode !== 'copy') {
                $scope.mode = 'copy';
            } else {
                $scope.mode = 'normal';
            }
        };
        $scope.previewClick = function (n) {
            if ($scope.mode === 'normal') {
                switchToFrame(n);
            } else if ($scope.mode === 'copy') {
                if ($scope.currentFrameNum != n) {
                    setUndo(n);
                    switchToFrame(n);
                }
                $scope.mode = 'normal';
            }
        };
        var copyFrame = function (from, to) {
            to.rawArray = from.rawArray.slice();
        };
        var drawPreview = function (frame, canvas) {
            var drawBackground = function (w, h, ctx) {
                ctx.fillStyle = 'rgba(40, 40, 40, .05)';
                ctx.fillRect(0, 0, w, h);
            };
            var drawPixelOn = function (x, y, pixelW, pixelH, ctx) {
                ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.fillRect(x, y, pixelW, pixelH);
            };
            var drawPixelOff = function () {};
            var pixelScale = 2;
            frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawBackground, drawPixelOff, drawPixelOn);
        };
        var init = function () {
            if (location.hash.length > 0) {
                $scope.frames.forEach(function (frame, i) {
                    return frame.fromUrlSafeBase64(location.hash.slice(1 + i * 86));
                });
            }
            var frame = document.querySelector(".frame");

            function getOffsetRect(elem) {
                var box = elem.getBoundingClientRect();
                var body = document.body;
                var docElem = document.documentElement;
                var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
                var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
                var clientTop = docElem.clientTop || body.clientTop || 0;
                var clientLeft = docElem.clientLeft || body.clientLeft || 0;
                var top = box.top + scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;
                return {
                    top: Math.round(top),
                    left: Math.round(left)
                };
            }
            var fastPointGetter = function () {
                var origin = getOffsetRect(document.querySelector("span[data-index^='0,0']"));
                var left = origin.left;
                var top = origin.top;
                var width = getOffsetRect(document.querySelector("span[data-index^='1,0,']"))
                    .left - left;
                var height = getOffsetRect(document.querySelector("span[data-index^='0,1,']"))
                    .top - top;
                return function (x, y) {
                    x = Math.floor((x - left) / width);
                    y = Math.floor((y - top - 11) / height);
                    return {
                        x: x,
                        y: y
                    };
                };
            };
            $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
                $scope.getPointFromCoords = fastPointGetter();
            });
        };
        init();
    }])
    .directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('ngRepeatFinished');
                    });
                }
            }
        };
    })
    .directive('ngTouchstart', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            compile: function ($element, attr) {
                var fn = $parse(attr['ngTouchstart'], null, true);
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
                var fn = $parse(attr['ngTouchmove'], null, true);
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
                var fn = $parse(attr['ngTouchend'], null, true);
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
                var fn = $parse(attr['ngTouchcancel'], null, true);
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