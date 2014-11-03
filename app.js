angular.module('super-micro-paint', [])
  .controller('MainCtrl', ['$scope', function($scope) {
    var numFrames = 4;
    var numRows = 16;
    var numColumns = 32;
    $scope._ = _;
    $scope.frames = _.range(0, numFrames).map(function () {
      var rows = _.range(0, numRows).map(function () {
        var pixels = _.range(0, numColumns).map(function () {
          return false;
        });
        return pixels;
      });
      return rows;
    });
    $scope.pen = false;
    $scope.penmode = false;
    console.log($scope.frames);
    setPixel = function(pixel, mode, scope) {
      var x = pixel.getAttribute('data-index').split(',')[0];
      var y = pixel.getAttribute('data-index').split(',')[1];
      var f = pixel.getAttribute('data-index').split(',')[2];
      scope.frames[f][y][x] = mode;
    };
    getPixel = function(pixel, scope) {
      var x = pixel.getAttribute('data-index').split(',')[0];
      var y = pixel.getAttribute('data-index').split(',')[1];
      var f = pixel.getAttribute('data-index').split(',')[2];
      return scope.frames[f][y][x];
    };
    togglePixel = function (pixel, scope) {
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
    };
}]);

