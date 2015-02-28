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
                point = $scope.getPointFromCoords(event.pageX, event.pageY);
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
                ctx.save();
                ctx.fillStyle = 'rgba(40, 40, 40, .05)';
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            };
            var drawPixelOn = function (x, y, pixelW, pixelH, ctx) {
                ctx.save();
                ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.fillRect(x, y, pixelW, pixelH);
                ctx.restore();
            };
            var drawPixelOff = function () {};
            var pixelScale = 2;
            frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawBackground, drawPixelOff, drawPixelOn);
        };
        var drawCurrentFrame = function () {
            canvas = document.getElementById('canvas'); 
            var drawBackground = function (w, h, ctx) {
                ctx.save();
                ctx.fillStyle = '#DCF0E6';
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            };
            var drawPixelOn = function (x, y, pixelW, pixelH, ctx) {
                ctx.save();
                ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                ctx.shadowBlur = 2;
                ctx.shadowColor = '#888';
                ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
                ctx.restore();
            };
            var drawPixelOff = function () {
                ctx.save();
                ctx.strokeStyle = 'rgba(40, 40, 40, 0.05)';
                ctx.fillStyle = 'rgba(40, 40, 40, 0.05)';
                ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);              
                ctx.restore();
            };
            var pixelScale = 25;
            $scope.currentFrame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawBackground, drawPixelOff, drawPixelOn);
        };
        var init = function () {
            if (location.hash.length > 0) {
                $scope.frames.forEach(function (frame, i) {
                    return frame.fromUrlSafeBase64(location.hash.slice(1 + i * 86));
                });
            }
            var frame = document.querySelector(".frame");
        };
        init();
    }])
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
    }])
    .directive('pixelCanvas', function() {
        return {
            restrict: 'E',
            scope: {width: '@', height: '@', currentFrame: '='},
            template: '<canvas width="{{width}}" height="{{height}}"></canvas>',
            link: function (scope, element, attrs) {
                var fastPointGetter = function (element, pitchX, pitchY) {
                    var origin = $(element).offset();
                    var left = origin.left;
                    var top = origin.top;
                    return function (x, y) {
                        x = Math.floor((x - left) / pitchX);
                        y = Math.floor((y - top) / pitchY);
                        return {
                            x: x,
                            y: y
                        };
                    };
                };
                scope.$parent.getPointFromCoords = fastPointGetter(document.querySelector('pixel-canvas canvas'), 25, 25);
                var updateCanvas = function() {
                    requestAnimationFrame(updateCanvas);
                    var canvas = element.children()[0];
                    var drawBackground = function (w, h, ctx) {
                        ctx.save();
                        ctx.fillStyle = '#DCF0E6';
                        ctx.fillRect(0, 0, w, h);
                        ctx.restore();
                    };
                    var drawPixelOn = function (x, y, pixelW, pixelH, ctx) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                        ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                        ctx.shadowBlur = 2;
                        ctx.shadowColor = '#888';
                        ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
                        ctx.restore();
                    };
                    var drawPixelOff = function (x, y, pixelW, pixelH, ctx) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(40, 40, 40, 0.05)';
                        ctx.fillStyle = 'rgba(40, 40, 40, 0.05)';
                        ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);              
                        ctx.restore();
                    };
                    var pixelScale = 25;
                    scope.$parent.currentFrame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawBackground, drawPixelOff, drawPixelOn);
                };
                updateCanvas();
            }
        };
    });