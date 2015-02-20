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
  var blinkTimer = function() {
    var blinkState = true;
    var blinkStyle = document.createElement('style');
    document.head.appendChild(blinkStyle);
    var blink = function() {
      if (blinkState === true) {
        blinkStyle.innerHTML = ".pixel-blink::after {background-color: rgba(40, 40, 40, .05);}";
      } else {
        blinkStyle.innerHTML = ".pixel-blink::after {background-color: rgba(40, 40, 40, .85); box-shadow: 1px 1px 2px #888;}";
      }
      blinkState = !blinkState;
    };
    window.setInterval(blink, 400);
  }();

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
    var setUndo = function() {
      var f = $scope.currentFrame;
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
        'penDown': function (event) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(event.target, $scope);
          togglePixel(event.target, $scope);
          $scope.lastPixel = event.target;
          return false;
        },
        'penUp': function (event) {
          $scope.pen = false;
          $scope.lastPixel = {};
          clearSelection();
        },
        'penOver': function (event) {
          if ($scope.pen) {
            if ($scope.lastPixel) {
              setLine($scope.lastPixel, event.target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
            }
            $scope.lastPixel = event.target;
          }
        }
    };
    tools.fill = {
        'penDown': function (event) {
          setUndo();
          $scope.penmode = !getPixel(event.target, $scope);
          fillPixels(event.target, $scope);
        }
    };
    tools.line = {
        'penDown': function (event) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(event.target, $scope);
          $scope.penStart = event.target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
          return false;
        },
        'penUp': function (event) {
          $scope.pen = false;
          setLine($scope.penStart, event.target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (event) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setLine($scope.penStart, event.target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = event.target;
          }
        }
    };
    tools.rectangle = {
        'penDown': function (event) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(event.target, $scope);
          $scope.penStart = event.target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
          return false;
        },
        'penUp': function (event) {
          $scope.pen = false;
          setRectangle($scope.penStart, event.target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (event) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setRectangle($scope.penStart, event.target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = event.target;
          }
        }
    };
    tools.ellipse = {
        'penDown': function (event) {
          setUndo();
          $scope.pen = true;
          $scope.penmode = !getPixel(event.target, $scope);
          $scope.penStart = event.target;
          $scope.overlay.fill(false);
          $scope.overlay.set(false);
          return false;
        },
        'penUp': function (event) {
          $scope.pen = false;
          setEllipse($scope.penStart, event.target, $scope.penmode, $scope.frames[$scope.currentFrame], $scope);          
          $scope.penStart = {};
          $scope.overlay.fill(false);
          clearSelection();
        },
        'penOver': function (event) {
          if ($scope.pen) {
            if ($scope.penStart) {
              setEllipse($scope.penStart, event.target, $scope.penStart, $scope.overlay.fill(false), $scope);          
            }
            $scope.lastPixel = event.target;
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
      if (tools[$scope.activeTool].penDown) {
        tools[$scope.activeTool].penDown(event);
        updatePreviews();
        event.preventDefault();
      }
    };
    $scope.penOver = function (event) {
      if (tools[$scope.activeTool].penOver) {
        tools[$scope.activeTool].penOver(event);
        updatePreviews();
        event.preventDefault();
      }
    };
    $scope.setFrame = function (event) {
      // when frame changes
    };
    $scope.penUp = function (event) {
      if (tools[$scope.activeTool].penUp) {
        tools[$scope.activeTool].penUp(event);
      }
      updatePreviews();
      event.preventDefault();
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
        $scope.frames.forEach(function (frame, i) {return frame.fromUrlSafeBase64(location.hash.slice(1 + i * 86));})
      }
    }();
}]);

