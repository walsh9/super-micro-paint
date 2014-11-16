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
      console.log(x,y,mode);
      console.log(scope.frames[f].set(x, y, mode));
    };
    var getPixel = function(pixel, scope) {
      var x = Math.floor(pixel.getAttribute('data-index').split(',')[0]);
      var y = Math.floor(pixel.getAttribute('data-index').split(',')[1]);
      var f = Math.floor(pixel.getAttribute('data-index').split(',')[2]);
      return scope.frames[f].get(x, y);
    };
    var togglePixel = function (pixel, scope) {
      setPixel(pixel, !getPixel(pixel, scope), scope);
    };
    $scope.penDown = function (event) {
      $scope.pen = true;
      $scope.penmode = !getPixel(event.target, $scope);
      togglePixel(event.target, $scope);
      return false;
    };
    $scope.penOver = function (event) {
      if ($scope.pen) {
        setPixel(event.target, $scope.penmode, $scope);
      }
    };
    $scope.penUp = function (event) {
      $scope.pen = false;
      clearSelection();
    };
}]);

