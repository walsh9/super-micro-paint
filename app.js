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
        $scope.pen = {};
        $scope.pen.drawing = false;
        $scope.pen.mode = false;
        $scope.pen.start = undefined;
        $scope.pen.last = undefined;
        $scope.pen.finish = false;
        $scope.events = {};
        $scope.events.start = undefined;
        $scope.events.current = undefined;
        $scope.events.finish = undefined;
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
        var setPixel = function (pixel, mode) {
            $scope.currentFrame.set(pixel.x, pixel.y, mode);
        };
        var setUndo = function (frame) {
            var f, frameToSave;
            if (frame === undefined) {
                f = $scope.currentFrameNum;
                frameToSave = $scope.currentFrame;
            } else {
                f = frame;
                frameToSave = $scope.frames[f];
            }
            $scope.undoBuffers[f].push(frameToSave.toString());
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
        var getPixel = function (pixel) {
            return $scope.currentFrame.get(pixel.x, pixel.y);
        };
        var tools = {};
        var buildPointToPointDrawingTool = function (drawingFunction) {
            return {
                'start': function (pen) {
                    $scope.overlay.fill(false);
                },
                'finish': function (pen) {
                    setUndo();
                    $scope.currentFrame[drawingFunction](pen.start.x, pen.start.y, pen.finish.x, pen.finish.y, pen.mode);
                    $scope.overlay.fill(false);
                    clearSelection();
                },
                'update': function (pen) {
                    $scope.overlay.fill(false)[drawingFunction](pen.start.x, pen.start.y, pen.current.x, pen.current.y, true);
                }
            };
        };
        tools.pencil = {
            'start': function (pen) {
                setUndo();
                setPixel(pen.start, pen.mode);
            },
            'finish': function (pen) {
                clearSelection();
            },
            'update': function (pen) {
                $scope.currentFrame.drawLine(pen.last.x, pen.last.y, pen.current.x, pen.current.y, pen.mode);
            }
        };
        tools.fill = {
            'start': function (pen) {
                setUndo();
                $scope.currentFrame.floodFill(pen.start.x, pen.start.y, pen.mode);
            }
        };
        tools.line = buildPointToPointDrawingTool('drawLine');
        tools.rectangle = buildPointToPointDrawingTool('drawRectangle');
        tools.ellipse = buildPointToPointDrawingTool('drawEllipse');
        var drawUpdate = function() {
            var pen = $scope.pen;
            var events = $scope.events;
            if (events.start) {
                pen.drawing = true;
                pen.start = pen.last = pointFromEvent(events.start);
                pen.mode = !getPixel(pen.start);
                events.start = undefined;
                if (tools[$scope.activeTool].start) {
                    tools[$scope.activeTool].start(pen);
                }
            } else if (pen.drawing === true && events.current && !events.finish) {
                pen.current = pointFromEvent(events.current);
                if (tools[$scope.activeTool].update && !(pen.current.x === pen.last.x && pen.current.y === pen.last.y)) {
                    tools[$scope.activeTool].update(pen);
                }
                pen.last = pen.current;
                events.current = undefined;
            } else if (pen.drawing === true && events.finish) {
                pen.drawing = false;
                pen.finish = pointFromEvent(events.finish);
                if (tools[$scope.activeTool].finish) {
                    tools[$scope.activeTool].finish(pen);
                }
                events.finish = events.current = undefined;
            }
            window.requestAnimationFrame(drawUpdate);
        };
        var timeStep = (1 / 60) * 1000;
        var currentTime = Date.now();
        var drawingLoop = function () {
            var newTime = Date.now();
            var frameTime = newTime - currentTime;
            var delta;
            currentTime = newTime;
            while (frameTime > 0) {
                delta = Math.min(frameTime, timeStep);
                frameTime -= delta;
            }
            drawUpdate();
            requestAnimationFrame(drawingLoop);
        };
        drawingLoop();
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
            $event.preventDefault();
            if ($scope.mode != 'copy') {
                $scope.events.start = $event;
            }
        };
        $scope.penOver = function ($event) {
            $event.preventDefault();
            if ($scope.mode != 'copy') {
                $scope.events.current = $event;
            }
        };
        $scope.penUp = function ($event) {
            $event.preventDefault();
            if ($scope.mode != 'copy') {
                $scope.events.finish = $event;
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
                    copyFrame($scope.currentFrame, $scope.frames[n]);
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
                    scope.$parent.currentFrame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawBackground, drawPixelOff, drawPixelOn, scope.$parent.overlay);
                };
                updateCanvas();
            }
        };
    })