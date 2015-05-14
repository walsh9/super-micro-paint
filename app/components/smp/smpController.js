angular.module('super-micro-paint', ['touch-directives'])
    .controller('smpController', ['$scope', '$window', function ($scope, $window) {
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
                $scope.save();
            }
        };
        $scope.redo = function () {
            var f = $scope.currentFrameNum;
            if ($scope.redoBuffers[f].length > 0) {
                setUndo();
                $scope.currentFrame = $scope.currentFrame.fromString($scope.redoBuffers[f].pop());
                $scope.save();
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
        $scope.getExportURL = function() {
            return "export/?smp=" + location.hash.slice(1);
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
                    $scope.save();
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
                $scope.save();
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
                $scope.save();
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
                if (events.finish === 'outside') {
                    pen.finish = pen.last;
                } else {
                    pen.finish = pointFromEvent(events.finish);
                }
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
        var updateHash = function() {
            if (window.history.replaceState) {
                return function(hash) {
                    window.history.replaceState(undefined, undefined, '#' + hash);
                };
            } else {
                return function(hash) {
                    location.replace('#' + hash);
                };
            }
        }();
        $scope.save = function () {
            copyFrame($scope.currentFrame, $scope.frames[$scope.currentFrameNum]);
            var frameHash = $scope.frames.map(function (frame) {
                    return frame.toUrlSafeBase64();
                })
                .reduce(function (a, b) {
                    return a + "." + b;
                });
            updateHash(frameHash);
        };
        $scope.doLifeStep = function () {
            setUndo();
            $scope.currentFrame = $scope.currentFrame.lifeStep();
            $scope.save();
        };
        $scope.clear = function () {
            setUndo();
            $scope.currentFrame.fill(false);
            $scope.save();
        };
        $scope.nudge = function (xOffset, yOffset) {
            setUndo();
            $scope.currentFrame.nudge(xOffset, yOffset);
            $scope.save();
        };
        $scope.invert = function (xOffset, yOffset) {
            setUndo();
            $scope.currentFrame.invert();
            $scope.save();
        };
        var pointFromEvent = function ($event) {
            var event = $event.originalEvent;
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
            if ($event === 'outside') {
                if ($scope.pen.drawing) {
                    $scope.events.finish = $event;
                }
            } else {
                $event.stopPropagation();
                $event.preventDefault();
                if ($scope.mode != 'copy' && $scope.pen.drawing) {
                    $scope.events.finish = $event;
                }
            }
        };
        angular.element($window).bind('blur', function (){
          $scope.penUp('outside');
        });
        angular.element($window).bind('mouseup', function (){
          $scope.penUp('outside');
        });
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
                    $scope.save();
                }
                $scope.mode = 'normal';
            }
        };
        var copyFrame = function (from, to) {
            to.rawArray = from.rawArray.slice();
        };
        var drawPreview = function (frame, canvas) {
            var drawCommands = {
                bg: function (w, h, ctx) {
                    ctx.fillStyle = 'rgba(40, 40, 40, .05)';
                    ctx.fillRect(0, 0, w, h);
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                    ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                    ctx.fillRect(x, y, pixelW, pixelH);
                },
                off: function () {}
            };
            var pixelScale = 2;
            frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawCommands);
        };
        var init = function () {
            if (location.hash.length > 0) {
                $scope.frames.forEach(function (frame, i) {
                    frame.fromUrlSafeBase64(location.hash.substring(1).split('.')[i]);
                });
                copyFrame($scope.frames[0], $scope.currentFrame);
            } else {
                $scope.save();
            }
            var frame = document.querySelector(".frame");
        };
        init();
    }])
    .directive('pixelCanvas', function() {
        return {
            restrict: 'E',
            scope: {width: '@', height: '@', currentFrame: '='},
            template: '<canvas width="{{width}}" height="{{height}}"></canvas>',
            link: function (scope, element, attrs) {
                var pointGetter = function (element, pitchX, pitchY) {
                    return function(x, y) {
                        var origin = $(element).offset();
                        var left = origin.left;
                        var top = origin.top;
                        x = Math.floor((x - left) / pitchX);
                        y = Math.floor((y - top) / pitchY);
                        return {
                            x: x,
                            y: y
                        };                        
                    };
                };
                scope.$parent.getPointFromCoords = pointGetter(document.querySelector('pixel-canvas canvas'), 25, 25);
                var updateCanvas = function() {
                    requestAnimationFrame(updateCanvas);
                    var canvas = element.children()[0];
                    var drawCommands = {
                        bg: function (w, h, ctx) {
                            ctx.save();
                            ctx.fillStyle = '#DCF0E6';
                            ctx.fillRect(0, 0, w, h);
                            ctx.restore();
                        },
                        on: function (x, y, pixelW, pixelH, ctx) {
                            ctx.save();
                            ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
                            ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
                            ctx.shadowOffsetX = 1;
                            ctx.shadowOffsetY = 1;
                            ctx.shadowBlur = 2;
                            ctx.shadowColor = '#888';
                            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
                            ctx.restore();
                        },
                        off: function (x, y, pixelW, pixelH, ctx) {
                            ctx.save();
                            ctx.strokeStyle = 'rgba(40, 40, 40, 0.05)';
                            ctx.fillStyle = 'rgba(40, 40, 40, 0.05)';
                            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);              
                            ctx.restore();
                        }
                    };
                    var pixelScale = 25;
                    scope.$parent.currentFrame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawCommands, scope.$parent.overlay);
                };
                updateCanvas();
            }
        };
    });