angular.module('super-micro-paint', [])
  .controller('MainCtrl', ['$scope', function($scope) {
    $scope.numFrames = 4;
    $scope.height = 16;
    $scope.width = 32;
    $scope._ = _;
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
    console.log($scope.frames);

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
    var setPixel = function(pixel, mode, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var f = Math.floor(pixel.getAttribute('data-index').split(',')[2]);
      var currentFrame = scope.frames[f];
      scope.frames[f].set(x, y, mode);
      //currentFrame.forLine(x, y, x+5, y+5, function(i,x,y) {currentFrame.set(x, y, true);});
    };
    var setLine = function(pixel0, pixel1, mode, scope) {
      var x0 = Math.floor(pixel0.getAttribute('data-index').split(',')[0]);
      var y0 = Math.floor(pixel0.getAttribute('data-index').split(',')[1]);
      var x1 = Math.floor(pixel1.getAttribute('data-index').split(',')[0]);
      var y1 = Math.floor(pixel1.getAttribute('data-index').split(',')[1]);
      var f = Math.floor(pixel0.getAttribute('data-index').split(',')[2]);
      var currentFrame = scope.frames[f];
      currentFrame.forLine(x0, y0, x1, y1, function(val, x, y) {currentFrame.set(x, y, mode);});
    };     
    var getPixel = function(pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var f = Math.floor(pixel.getAttribute('data-index').split(',')[2]);
      return scope.frames[f].get(x, y);
    };
    var drawLine = function(pixel, pixel2, scope) {

    };
    var togglePixel = function (pixel, scope) {
      setPixel(pixel, !getPixel(pixel, scope), scope);
    };
    $scope.penDown = function (event) {
      $scope.pen = true;
      $scope.penmode = !getPixel(event.target, $scope);
      togglePixel(event.target, $scope);
      $scope.lastPixel = event.target;
      return false;
    };
    $scope.penOver = function (event) {
      if ($scope.pen) {
        if ($scope.lastPixel) {
          setLine($scope.lastPixel, event.target, $scope.penmode, $scope);          
        }
        $scope.lastPixel = event.target;
        //setPixel(event.target, $scope.penmode, $scope);
      }
    };
    $scope.penUp = function (event) {
      $scope.pen = false;
      $scope.lastPixel = {};
      clearSelection();
    };
}]);

