angular.module('marvelize.filters', [])

.filter('tempInt', function() {
  return function(input) {
    return parseInt(input);
  }
});