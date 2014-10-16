angular.module('tamaedit', [])
  .controller('MainCtrl', ['$scope', function($scope){
    $scope.pixels = [
      [ true, false, false, false, false],
      [false,  true, false, false, false],
      [false, false,  true, false, false],
      [false, false, false,  true, false],
      [false, false, false, false,  true]
    ];
    togglePixel = function (pixel, scope) {
      var x = pixel.getAttribute('data-index').split(',')[0];
      var y = pixel.getAttribute('data-index').split(',')[1];
      scope.pixels[y][x] = !scope.pixels[y][x];
    };
    $scope.clickHandler = function (event) {
      togglePixel(event.target, $scope);
      console.log($scope.pixels);
    }
}]);

