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
      return new Array2d($scope.width, $scope.height).fill(false);
    });
    // $scope.frames = _.range(0, numFrames).map(function () {
    //   return new Array2d(numRows, numColumns);
    // }
    $scope.pen = false;
    $scope.penmode = false;
    $scope.lastPixel = {};
    $scope.range = function(n) {
        return new Array(n);
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
      //var f = Math.floor(pixel.getAttribute('data-index').split(',')[2]);
      var currentFrame = scope.frames[scope.currentFrame];
      currentFrame.set(x, y, mode);
      //currentFrame.forLine(x, y, x+5, y+5, function(i,x,y) {currentFrame.set(x, y, true);});
    };
    var setLine = function (pixel0, pixel1, mode, scope) {
      var x0 = Math.floor(pixel0.getAttribute('data-index').split(',')[0]);
      var y0 = Math.floor(pixel0.getAttribute('data-index').split(',')[1]);
      var x1 = Math.floor(pixel1.getAttribute('data-index').split(',')[0]);
      var y1 = Math.floor(pixel1.getAttribute('data-index').split(',')[1]);
      //var f = Math.floor(pixel0.getAttribute('data-index').split(',')[2]);
      var currentFrame = scope.frames[scope.currentFrame];
      currentFrame.forLine(x0, y0, x1, y1, function(val, x, y) {currentFrame.set(x, y, mode);});
    };
    var frameToString = function (f) {
      var bString = f.map( function(n){return n ? 1 : 0;} ).rawArray.join('');
      return(bString); // not efficient
    };
    var stringToFrame = function (bString) {
      var rawArray = bString.split("").map( function(n) {return n == 1;} );
      return new Array2d($scope.width, $scope.height, rawArray);
    };
    var setUndo = function() {
      var f = $scope.currentFrame;
      $scope.undoBuffers[f].push(frameToString($scope.frames[f]));
    };
    var setRedo = function() {
      var f = $scope.currentFrame;
      $scope.redoBuffers[f].push(frameToString($scope.frames[f]));
    };
    $scope.undo = function() {
      var f = $scope.currentFrame;
      if ($scope.undoBuffers[f].length > 0) {
        setRedo();
        $scope.frames[f] = stringToFrame($scope.undoBuffers[f].pop());
      }
    };
    $scope.redo = function() {
      var f = $scope.currentFrame;
      if ($scope.redoBuffers[f].length > 0) {
        setUndo();
        $scope.frames[f] = stringToFrame($scope.redoBuffers[f].pop());
      }
    };
    $scope.canUndo = function() {
      return $scope.undoBuffers[$scope.currentFrame].length > 0;
    };
    $scope.canRedo = function() {
      return $scope.redoBuffers[$scope.currentFrame].length > 0;
    };
    var floodFill = function (frame, x, y, penmode) {
      // if pixel is already toggled, stop
      if (frame.get(x, y) != penmode) {
        frame.set(x, y, penmode);
        // fill up
        if (y > 0) {
          floodFill(frame, x, y - 1, penmode);
        }
        // fill down
        if (y < $scope.height - 1) {
          floodFill(frame, x, y + 1, penmode);          
        }
        // fill left
        if (x > 0) {
          floodFill(frame, x - 1, y, penmode);
        }
        // fill right
        if (x < $scope.width - 1) {
          floodFill(frame, x + 1, y, penmode);          
        }
      }
    };
    var lifeStep = function (f) {
      var newFrame = f.map( function(value, x, y, w, h) {
        var neighbors = [];
        if (x > 0) {
          if (y > 0) { neighbors.push(f.get(x - 1, y - 1)); }
          neighbors.push(f.get(x - 1, y));
          if (y < $scope.height - 1) { neighbors.push(f.get(x - 1, y + 1)); }
        }
        if (y > 0) { neighbors.push(f.get(x, y - 1)); }
        if (y < $scope.height - 1) { neighbors.push(f.get(x, y + 1)); }
        if (x < $scope.width - 1) {
          if (y > 0) { neighbors.push(f.get(x + 1, y - 1)); }
          neighbors.push(f.get(x + 1, y));
          if (y < $scope.height + 1) { neighbors.push(f.get(x + 1, y + 1)); }
        }
        var liveNeighbors = neighbors
          .map(function(isTrue) {return isTrue ? 1 : 0;}) //map bool to int
          .reduce(function(a,b) {return a + b;}); //sum
        if (value === true) { // this cell is 'alive'
          if (liveNeighbors < 2 || liveNeighbors > 3) {
            return false;
          }
          else {
            return true;
          }
        } else { //this cell is 'dead'
          if (liveNeighbors === 3) {
            return true;
          } else {
            return false;
          }
        }
      });
      console.log(newFrame.get(0,0));
      return newFrame;
    };
    var fillPixels = function (pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var currentFrame = scope.frames[scope.currentFrame];
      floodFill(currentFrame, x, y, $scope.penmode);
    };
    var getPixel = function (pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      //var f = Math.floor(pixel.getAttribute('data-index').split(',')[2]);
      var currentFrame = scope.frames[scope.currentFrame];
      return currentFrame.get(x, y);
    };
    var drawLine = function (pixel, pixel2, scope) {

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
              setLine($scope.lastPixel, event.target, $scope.penmode, $scope);          
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
    $scope.doLifeStep = function () {
      setUndo();
      var currentFrame = $scope.frames[$scope.currentFrame];
      $scope.frames[$scope.currentFrame] = lifeStep(currentFrame);
    };
    $scope.penDown = function (event) {
      if (tools[$scope.activeTool].penDown) {
        tools[$scope.activeTool].penDown(event);
      }
    };
    $scope.penOver = function (event) {
      if (tools[$scope.activeTool].penOver) {
        tools[$scope.activeTool].penOver(event);
      }
    };
    $scope.setFrame = function (event) {
      // when frame changes
    };
    $scope.penUp = function (event) {
      if (tools[$scope.activeTool].penUp) {
        tools[$scope.activeTool].penUp(event);
      }
    };
}]);

