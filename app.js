angular.module('tamaedit', [])
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
    console.log($scope.frames);
    togglePixel = function (pixel, scope) {
      var x = pixel.getAttribute('data-index').split(',')[0];
      var y = pixel.getAttribute('data-index').split(',')[1];
      var f = pixel.getAttribute('data-index').split(',')[2];
      scope.frames[f][y][x] = !scope.frames[f][y][x];
    };
    $scope.clickHandler = function (event) {
      togglePixel(event.target, $scope);
      console.log($scope.pixels);
    }
}]);

