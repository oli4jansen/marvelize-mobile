angular.module('marvelize.directives', [])

.directive('listView', function() {

  var tabs = 
      '<ul class="tab-buttons no-border">'+
        '<li ng-repeat="tab in tabs" ng-class="{\'active\': tab == currentTab}" ng-click="$parent.changeTab(tab)">{{tab}}</li>'+
      '</ul>';

  var subMenuBar = 
    '<div class="sub-menu-bar">'+
      '<span class="right">{{items.length}} of {{total}} items</span>'+
      '<a class="image-button" ng-click="viewAsGrid()" ng-class="{\'active\': format == \'grid\'}"><i class="ion-grid"></i></a>'+
      '<a class="image-button" ng-click="viewAsList()" ng-class="{\'active\': format == \'list\'}"><i class="ion-navicon"></i></a>'+
      tabs+
    '</div>';

  var footer = '<p ng-if="$parent.loading" class="center"><br><i class="ion-loading-d normal"></i><br><br>Asking Marvel for some data, please be patient..<br><br></p>';

  return {
    restrict: 'EAC',
    scope: {
      format: '=format',
      items: '=items',
      total: '=total',
      tabs: '=',
      currentTab: '='
    },
    template: subMenuBar+'<list-item format="format" ng-repeat="item in items" data="item"></list-item>'+footer,
    link: function(scope, element, attrs) {

      scope.tabs = scope.tabs || [];
      scope.currentTab = scope.currentTab || false;

      scope.viewAsGrid = function() {
        scope.format = 'grid';
      };

      scope.viewAsList = function() {
        scope.format = 'list';
      };

      scope.changeTab = function(tab) {
        if(typeof scope.$parent.changeTab == 'function') scope.$parent.changeTab(tab);
      };

      scope.moreItemsRequests = [];
      scope.moreItemsRequests[0] = true; 

      scope.infiniteScrollTriggered = function() {
        if(!scope.moreItemsRequests[scope.items.length] && scope.items.length !== scope.total) {
          scope.moreItemsRequests[scope.items.length] = true;
          if(typeof scope.$parent.getMoreItemsPlease == 'function') scope.$parent.getMoreItemsPlease();
        }
      };

      // DIRTY, YUK
      scope.$on("$destroy", function() {
        window.onscroll = function() {};
      });

      window.onscroll = function(event) {
        if(element && document.body.scrollHeight - (document.body.scrollTop + window.innerHeight) < 300) {
          scope.infiniteScrollTriggered();
        }
      }
    }
  }
});