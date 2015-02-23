angular.module('super-micro-paint', [])
  .controller('MainCtrl', ['$scope', function($scope) {
    $scope.numFrames = 4;
    $scope.height = 16;
    $scope.width = 32;
    $scope._ = _;
    $scope.currentFrame = 0;
    $scope.activeTool = 'pencil';
    $scope.undoBuffers = _.range(0, $scope.numFrames).map(function() {return [];});
    $scope.redoBuffers = _.range(0, $scope.numFrames).map(function() {return [];});
    $scope.frames = _.range(0, $scope.numFrames).map(function () {
      return new SuperPixelGrid($scope.width, $scope.height).fill(false);
    });
    $scope.overlay = new SuperPixelGrid($scope.width, $scope.height).fill(false);
    $scope.pen = false;
    $scope.penmode = false;
    $scope.penStart = {};
    $scope.lastPixel = {};
    $scope.mode = 'normal';
    $scope.range = function(n) {
        return new Array(n);
    };

  $scope.getDisplayPixel = function(x, y) {
    if ($scope.overlay.get(x, y)) {
      return 'pixel-blink';
    } else {
      return $scope.frames[$scope.currentFrame].get(x, y) ? 'pixel-on' : 'pixel-off';
    }
  };

  var clearSelection = function () {
    var selection = ('getSelection' in window) ? 
        window.getSelection()
        : 
        ('selection' in document) ? 
          document.selection
          : 
          null;
      if ('removeAllRanges' in selection) {
        selection.removeAllRanges();
      }
      else if ('empty' in selection) {
        selection.empty();
      }
    };
    var setPixel = function (pixel, mode, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var currentFrame = scope.frames[scope.currentFrame];
      currentFrame.set(x, y, mode);
    };
    var setLine = function (pixel0, pixel1, mode, frame, scope) {
      var x0 = Math.floor(pixel0.getAttribute('data-index').split(',')[0]);
      var y0 = Math.floor(pixel0.getAttribute('data-index').split(',')[1]);
      var x1 = Math.floor(pixel1.getAttribute('data-index').split(',')[0]);
      var y1 = Math.floor(pixel1.getAttribute('data-index').split(',')[1]);
      frame.drawLine(x0, y0, x1, y1, mode);
    };
    var setRectangle = function (pixel0, pixel1, mode, frame, scope) {
      var x0 = Math.floor(pixel0.getAttribute('data-index').split(',')[0]);
      var y0 = Math.floor(pixel0.getAttribute('data-index').split(',')[1]);
      var x1 = Math.floor(pixel1.getAttribute('data-index').split(',')[0]);
      var y1 = Math.floor(pixel1.getAttribute('data-index').split(',')[1]);
      frame.drawRectangle(x0, y0, x1, y1, mode);
    };
    var setEllipse = function (pixel0, pixel1, mode, frame, scope) {
      var x0 = Math.floor(pixel0.getAttribute('data-index').split(',')[0]);
      var y0 = Math.floor(pixel0.getAttribute('data-index').split(',')[1]);
      var x1 = Math.floor(pixel1.getAttribute('data-index').split(',')[0]);
      var y1 = Math.floor(pixel1.getAttribute('data-index').split(',')[1]);
      frame.drawEllipse(x0, y0, x1, y1, mode);
    };
    var setUndo = function(frame) {
      var f = frame || $scope.currentFrame;
      $scope.undoBuffers[f].push($scope.frames[f].toString());
    };
    var setRedo = function() {
      var f = $scope.currentFrame;
      $scope.redoBuffers[f].push($scope.frames[f].toString());
    };
    $scope.undo = function() {
      var f = $scope.currentFrame;
      if ($scope.undoBuffers[f].length > 0) {
        setRedo();
        $scope.frames[f] = $scope.frames[f].fromString($scope.undoBuffers[f].pop());
      }
    };
    $scope.redo = function() {
      var f = $scope.currentFrame;
      if ($scope.redoBuffers[f].length > 0) {
        setUndo();
        $scope.frames[f] = $scope.frames[f].fromString($scope.redoBuffers[f].pop());
      }
    };
    $scope.canUndo = function() {
      return $scope.undoBuffers[$scope.currentFrame].length > 0;
    };
    $scope.canRedo = function() {
      return $scope.redoBuffers[$scope.currentFrame].length > 0;
    };
    var fillPixels = function (pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var currentFrame = scope.frames[scope.currentFrame];
      currentFrame.floodFill(x, y, $scope.penmode);
    };
    var getPixel = function (pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var currentFrame = scope.frames[scope.currentFrame];
      return currentFrame.get(x, y);
    };
    var togglePixel = function (pixel, scope) {
      setPixel(pixel, !getPixel(pixel, scope), scope);
    };
    var tools = {};
    tools.pencil = {
        'penDown': function (target) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(target, $scope);
          togglePixel(target, $scope);
          $scope.lastPixel = target;
        },
        'penUp': function (target) {
          $scope.pen = false;
          $scope.lastPixel = {};
          clearSelection();
        },
        'penOver': function (target) {
          if ($scope.pen) {
            if ($scope.lastPixel) {
              setLine($scope.lastPixel, target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
            }
            $scope.lastPixel = target;
          }
        }
    };
    tools.fill = {
        'penDown': function (target) {
          setUndo();
          $scope.penmode = !getPixel(target, $scope);
          fillPixels(target, $scope);
        }
    };
    tools.line = {
        'penDown': function (target) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(target, $scope);
          $scope.penStart = target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
        },
        'penUp': function (target) {
          $scope.pen = false;
          setLine($scope.penStart, target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (target) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setLine($scope.penStart, target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = target;
          }
        }
    };
    tools.rectangle = {
        'penDown': function (target) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(target, $scope);
          $scope.penStart = target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
        },
        'penUp': function (target) {
          $scope.pen = false;
          setRectangle($scope.penStart, target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (target) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setRectangle($scope.penStart, target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = target;
          }
        }
    };
    tools.ellipse = {
        'penDown': function (target) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(target, $scope);
          $scope.penStart = target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
        },
        'penUp': function (target) {
          $scope.pen = false;
          setEllipse($scope.penStart, target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (target) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setEllipse($scope.penStart, target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = target;
          }
        }
    };
    $scope.save = function() {
      location.hash = $scope.frames.map(function(frame) {return frame.toUrlSafeBase64();})
        .reduce(function (a, b) {return a + b;});
    };
    $scope.doLifeStep = function () {
      setUndo();
      var currentFrame = $scope.frames[$scope.currentFrame];
      currentFrame = currentFrame.lifeStep();
    };
    $scope.clear = function () {
      setUndo();
      var currentFrame = $scope.frames[$scope.currentFrame];
      currentFrame.fill(false);
    };
    $scope.nudge = function(xOffset, yOffset) {
      setUndo();
      var currentFrame = $scope.frames[$scope.currentFrame];
      currentFrame.nudge(xOffset, yOffset);
    };
    $scope.invert = function(xOffset, yOffset) {
      setUndo();
      var currentFrame = $scope.frames[$scope.currentFrame];
      currentFrame.invert();
    };
    $scope.penDown = function (event) {
      var target;
      if (event instanceof MouseEvent) {
        target = event.target;
      } else if (event instanceof TouchEvent) {
        target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      }
      event.preventDefault();
      if (target && tools[$scope.activeTool].penDown && $scope.mode === 'normal') {
        tools[$scope.activeTool].penDown(target);
        updatePreviews();
      }
    };
    $scope.penOver = function (event) {
      var target;
      if (event instanceof MouseEvent) {
        target = event.target;
      } else if (event instanceof TouchEvent) {
        target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      }
      event.preventDefault();
      if (target && tools[$scope.activeTool].penOver && $scope.mode === 'normal') {
        tools[$scope.activeTool].penOver(target);
        updatePreviews();
      }
    };
    $scope.penUp = function (event) {
      var target;
      if (event instanceof MouseEvent) {
        target = event.target;
      } else if (event instanceof TouchEvent) {
        target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      }
      event.preventDefault();
      if (target && tools[$scope.activeTool].penUp && $scope.mode === 'normal') {
        tools[$scope.activeTool].penUp(target);
        updatePreviews();
      }
    };
  var updatePreviews = function() {
    $scope.frames.map( function(frame, index) {
      var previewCanvas = document.getElementById('preview' + index);
      drawToCanvas(frame, previewCanvas);
    });
  };
  var aniTimer = function() {
    var aniState = 0;
    var aniCanvas = document.getElementById('previewani');
    var animate = function() {
      drawToCanvas($scope.frames[aniState], aniCanvas);
      if (aniState >= $scope.numFrames - 1) {
        aniState = aniState - 3;
      } else {
        aniState++;
      }
    updatePreviews();
    };
    window.setInterval(animate, 250);
  }();
  $scope.copyStart = function() {
    if ($scope.mode !== 'copy') {
      $scope.mode = 'copy';
    } else {
      $scope.mode = 'normal';
    }
  };
  $scope.previewClick = function(n){
    if ($scope.mode === 'normal') {
      $scope.currentFrame = n;
    } else if ($scope.mode === 'copy') {
      if ($scope.currentFrame != n) {
        setUndo(n);
        copyFrame($scope.currentFrame, n);
        $scope.currentFrame = n;
      } 
      $scope.mode = 'normal';
    }
  };
  var copyFrame = function (from, to) {
    $scope.frames[to].rawArray =  $scope.frames[from].rawArray.slice();
  };
    var drawToCanvas = function(frame, canvas) {
      var ctx = canvas.getContext('2d');
      var pixelScale = 2;
      var offset = 0.0;
      ctx.clearRect (0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(40, 40, 40, .05)';
      ctx.fillRect (0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
      ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
      frame.forEach( function (value, x, y) {
        if (value === true) {
          ctx.fillRect(x * pixelScale + offset, y * pixelScale - offset, pixelScale, pixelScale);
        }
      });
    };
    var init = function() {
      if (location.hash.length > 0) {
        $scope.frames.forEach(function (frame, i) {return frame.fromUrlSafeBase64(location.hash.slice(1 + i * 86));});
      }
      var frame = document.querySelector(".frame");
      frame.addEventListener("touchstart", function (e) {$scope.$apply($scope.penDown(e));}, false);
      frame.addEventListener("touchmove", function (e) {$scope.$apply($scope.penOver(e));}, false);
      frame.addEventListener("touchend", function (e) {$scope.$apply($scope.penUp(e));}, false);
      console.log(frame);
      document.body.addEventListener("touchcancel", $scope.penUp, false);
    }();
}]);

