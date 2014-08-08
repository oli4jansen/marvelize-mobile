angular.module('marvelize', ['ionic', 'marvelize.services', 'marvelize.filters', 'marvelize.directives'])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    // De basis van de app (menu en view holder)
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    // Home pagina
    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html"
        }
      }
    })

    // Zoek pagina
    .state('app.search', {
      url: "/search/:category/:query",
      views: {
        'menuContent' :{
          templateUrl: "templates/simpleListView.html",
          controller: 'listController'
        }
      }
    })

    // Browse pagina voor de verschillende categorien
    .state('app.browse', {
      url: "/browse/:category",
      views: {
        'menuContent' :{
          templateUrl: 'templates/simpleListView.html',
          controller: 'listController'
        }
      }
    })

    .state('app.association', {
      url: "/browse/:category/:association/:associationWith/:name/:ID",
      views: {
        'menuContent' :{
          templateUrl: 'templates/simpleListView.html',
          controller: 'listController'
        }
      }
    })

    // Detail pagina
    .state('app.details', {
      url: "/details/:category/:id",
      views: {
        'menuContent' :{
          templateUrl: "templates/details.html",
          controller: 'detailsController'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
})

// De basis controller van de app
.controller('AppCtrl', function($scope, $rootScope, $timeout, $location, $ionicSideMenuDelegate, favorites) {
  $scope.searchDisabled = false;

  // Favorites ophalen
  $rootScope.favorites = favorites.get();
 
  $rootScope.navigate = function(path) {
    $location.path('/app/'+path);
    $ionicSideMenuDelegate.toggleLeft(false);
  };

  $scope.search = function(query) {
    $scope.searchDisabled = true;
    $ionicSideMenuDelegate.toggleLeft(false);
    $location.path('/app/search/characters/'+query);
    $timeout(function() {
      $scope.searchDisabled = false;
    }, 200);
  };

  $scope.changeCategory = function(category) {
    var query = $rootScope.searchQuery;
    $location.path('/app/search/'+category+'/'+query);
  };
})

.controller("detailsController", function($scope, $rootScope, $sce, $stateParams, $timeout, $ionicNavBarDelegate, $ionicPopup, $ionicScrollDelegate, APIDataFactory, APIDataParser, APIErrorHandler, favorites){

  $scope.category = $stateParams.category;
  $scope.itemID = $stateParams.id;

  $scope.itemData;

  $rootScope.coverActive = true;

  $scope.init = function() {
    $ionicNavBarDelegate.setTitle('');
    $rootScope.transparentNavBar = true;

    APIDataFactory.getByID($scope.category, $scope.itemID, function(error, result) {
      if(!error) {
        $scope.itemData = result;

        $scope.itemData.descriptionHTML = $sce.trustAsHtml(result.description);

        if(result.thumbnail && result.thumbnail.path && result.thumbnail.extension) {
          $scope.itemData.image = result.thumbnail.path+'/landscape_incredible.'+result.thumbnail.extension;
        }else{
          $scope.itemData.image = '';
        }

        // If item is favorite, enable 'favorite' variable
        if(favorites.isFavorite({ id: $scope.itemData.id, type: $scope.category })) $scope.favorite = true;

        switch($scope.category) {
          case 'characters':
            $scope.lists = [
              {
                name: 'series',
                allPath: 'browse/series/with/character/'+$scope.itemData.name+'/'+$scope.itemData.id
              }, {
                name: 'comics',
                allPath: 'browse/comics/with/character/'+$scope.itemData.name+'/'+$scope.itemData.id
              }, {
                name: 'events',
                allPath: 'browse/events/with/character/'+$scope.itemData.name+'/'+$scope.itemData.id
              }];
            break;

          case 'series':
            $scope.lists = [
              {
                name: 'characters',
                allPath: 'browse/characters/in/series/'+$scope.itemData.title+'/'+$scope.itemData.id
              }, {
                name: 'comics',
                allPath: 'browse/comics/in/series/'+$scope.itemData.title+'/'+$scope.itemData.id
              }, {
                name: 'events',
                allPath: 'browse/events/in/series/'+$scope.itemData.title+'/'+$scope.itemData.id
              }];
            break;

          case 'comics':
            $scope.lists = [
              {
                name: 'characters',
                allPath: 'browse/characters/in/comic/'+$scope.itemData.title+'/'+$scope.itemData.id
              }, {
                name: 'events',
                allPath: 'browse/events/in/comic/'+$scope.itemData.title+'/'+$scope.itemData.id
              }];

            var resourceURISplit = $scope.itemData.series.resourceURI.split("/");
            $scope.seriesID = resourceURISplit[resourceURISplit.length-1];

            break;

          case 'events':
            $scope.lists = [
              {
                name: 'characters',
                allPath: 'browse/characters/in/event/'+$scope.itemData.title+'/'+$scope.itemData.id
              }, {
                name: 'series',
                allPath: 'browse/series/with/event/'+$scope.itemData.title+'/'+$scope.itemData.id
              }, {
                name: 'comics',
                allPath: 'browse/comics/with/event/'+$scope.itemData.title+'/'+$scope.itemData.id
              }];
            break;
        }

        // Wat loopjes om de data te verbeteren
        $scope.itemData.associationsAvailable = false;
        for(var i = 0;i<$scope.lists.length;i++) {
          if($scope.itemData[$scope.lists[i].name].available > 0) $scope.itemData.associationsAvailable = true;
        }

        for(var i = 0;i<$scope.itemData.prices.length;i++) {
          if($scope.itemData[$scope.lists[i].name].available > 0) $scope.itemData.associationsAvailable = true;
        }


      }else{
        APIErrorHandler.error(error);
      }
    });
  };

  $scope.toggleFavorite = function() {

    var item = {
      id: $scope.itemData.id,
      title: $scope.itemData.name || $scope.itemData.title,
      type: $scope.category,
      image: $scope.itemData.image
    };
    favorites.toggleFavorite(item);
    // Favorites ophalen
    $rootScope.favorites = favorites.get();

    $scope.favorite = !$scope.favorite;

  };

  $scope.scroll = function() {
    $timeout(function () {
      var scrollTop = $ionicScrollDelegate.$getByHandle('small').getScrollPosition().top;

      if(scrollTop > 184) {
        console.log('Show navbar');

        var title = $scope.itemData.title || $scope.itemData.name || '';

        $ionicNavBarDelegate.setTitle(title);

        $rootScope.transparentNavBar = false;
        $rootScope.$apply();
      }else if(!$rootScope.transparentNavBar){
        console.log('Hide navbar');
        $rootScope.transparentNavBar = true;
        $ionicNavBarDelegate.setTitle('');
        $rootScope.$apply();
      }

    });
  };

  $scope.$on('$destroy', function() {
    $rootScope.transparentNavBar = false;
  });

})

// Controller voor lijsten (wordt gebruikt om te browsen, zoeken en associaties te ontdekken)
.controller("listController", function($scope, $rootScope, $stateParams, $location, $sce, $filter, $ionicNavBarDelegate, $ionicLoading, $ionicModal, listPreferences, APIDataFactory, APIDataParser, APIErrorHandler){

  /*
    Variabelen
  */

  // Valid categorien
  $scope.allCategories = ['characters', 'series', 'comics', 'events'];
  // Huidige categorie
  $rootScope.category = $stateParams.category;
  // Titel van de pagina
  var title = $stateParams.category;
  // Lege array met items die we gaan laten zien
  $scope.items = [];
  // Object met alle URL parameters die in de request URL voor Marvel moeten komen
  var URLParamsObject = {};

  // Per lijst/categorie mogelijke sorteer opties
  switch($scope.category) {
    case 'characters':
      $scope.possibleOrderOptions = [{
        value: 'name',
        name: 'Name'
      }, {
        value: 'modified',
        name: 'Date modified'
      }];
      break;
    case 'series':
      $scope.possibleOrderOptions = [{
        value: 'title',
        name: 'Title'
      }, {
        value: 'modified',
        name: 'Date modified'
      }, {
        value: 'startYear',
        name: 'Start year'
      }];
      break;
    case 'comics':
      $scope.possibleOrderOptions = [{
        value: 'title',
        name: 'Title'
      }, {
        value: 'modified',
        name: 'Date modified'
      }, {
        value: 'issueNumber',
        name: 'Issue number'
      }, {
        value: 'onsaleDate',
        name: 'Onsale date'
      }];
      break;
    case 'events':
      $scope.possibleOrderOptions = [{
        value: 'name',
        name: 'Name'
      }, {
        value: 'modified',
        name: 'Date modified'
      }, {
        value: 'startDate',
        name: 'Start date'
      }];
      break;
  }

  var oldOrder = 'poep';

  // List preferences ophalen uit storage
  var lP = listPreferences.get();
  // Juiste categorie selecteren
  $scope.listPreferences = lP[$scope.category];

  // Modal voor list preferences aanmaken
  $ionicModal.fromTemplateUrl('listPreferences.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  
  // Init functie wordt aangeroepen bij het laden van een lijst en wijzigen van de sorteeropties
  $scope.init = function(orderOption) {

    // Geldige categorie?
    if($scope.allCategories.indexOf($stateParams.category) == -1) $scope.navigate('');

    /*
      Associatie aangevraagd?
    */
    if($stateParams.association && ($stateParams.association == 'with' || $stateParams.association == 'in')) {

      // Meervoud maken van de categorie...
      var associationWith = $stateParams.associationWith
      // ...behalve bij series want dat heeft geen meervoud
      if($stateParams.associationWith !== 'series') associationWith = associationWith+'s';

      // ID van hetgeen waar een associatie mee gezocht wordt als URL param instellen
      URLParamsObject[associationWith] = $stateParams.ID;

      // De titel is anders bij associaties dan bij normale lijsten
      title = $scope.category + ' ' + $stateParams.association + ' \'' + $stateParams.name + '\'.';

    /*
      Ongeldige associatie?
    */
    }else if($stateParams.association) {
      // Ongeldige associatie, ga terug naar categorie
      $scope.navigate('browse/'+$scope.category);

    /*
      Zoekopdracht?
    */
    }else if($stateParams.query) {
      // De tabs met de categorien laten zien
      $rootScope.showCategoryTabs = true;
      $rootScope.searchQuery = $stateParams.query;

      // de juiste parameter voor de categorie zoeken
      switch($scope.category) {
        case 'characters':
          var fieldToQuery = 'nameStartsWith';
          break;
        case 'series':
          var fieldToQuery = 'titleStartsWith';
          break;
        case 'comics':
          var fieldToQuery = 'titleStartsWith';
          break;
        case 'events':
          var fieldToQuery = 'nameStartsWith';
          break;
        default:
          var fieldToQuery = 'title';
          break;
      }

      // URL parameter instellen
      URLParamsObject[fieldToQuery] = $stateParams.query;
      // Titel aanpassen aan zoekopdracht
      title = 'Searching for \'' + $stateParams.query + '\'';
    }

    /*
      Sorteer opties
    */
    var desc = '';
    if($scope.listPreferences.descending) desc = '-';
    // De sorteervolgorde als parameter instellen
    URLParamsObject.orderBy = desc+$scope.listPreferences.order || 'modified';

    /*
      Loading dingen
    */
    $ionicLoading.show({
      template: '<i class="ion-loading-d spinner"></i>Loading...'
    });

    // orderOption = als init() geladen is vanuit een listPreferences wijziging
    // order mag geen importance zijn (is geen geldige sorteer optie bij Marvel), dit kan pas nadat we weten hoeveel items er zijn
    if(!orderOption && $scope.listPreferences && $scope.listPreferences.order == 'importance') {
      // List preferences ophalen uit storage
      var lP = listPreferences.get();
      // Juiste categorie selecteren en listPreferences resetten
      $scope.listPreferences = lP[$scope.category];
    }

    // Titel instellen
    $ionicNavBarDelegate.setTitle(title);

    // DATA OPHALEN BIJ MARVEL
    APIDataFactory.getList($scope.category, URLParamsObject, function(error, result) {
      if(!error) {
        // Items parsen en in de scope laden
        $scope.items = APIDataParser.parse($scope.category, result.results);
        // Totale aantal items in scope zetten
        $scope.total = result.total;

        // Als het aantal gelaadde items gelijk is aan het totale aantal items:
        if(result.results.length == result.total) {
          // We kunnen nu client-side sorteren
          // 'importance' is tot nu toe de enige factor waarop we sorteren

          // staat importance al tussen de keuzes in het listPreferences scherm?
          var isImportanceAlreadyAnOption = false;
          for(var i = 0;i<$scope.possibleOrderOptions.length;i++) {
            if($scope.possibleOrderOptions[i].value == 'importance') isImportanceAlreadyAnOption = true;
          }

          // Zo nee: zet de keuze ertussen
          if(!isImportanceAlreadyAnOption) $scope.possibleOrderOptions.push({ value: 'importance', name: 'Importance' });

          // De vorige keuze tijdelijk onthouden
          // We willen 'importance' niet opslaan als keuze omdat deze optie niet altijd beschikbaar is 
          // We gebruiken oldOrder om de vorige keuze te onthouden en die opgeslagen te houden
          oldOrder = $scope.listPreferences.order;

          // Tenzij er een andere optie gekozen is, sorteren we nu op importance
          if((orderOption && orderOption == 'importance') || orderOption == undefined || !orderOption) {
            // Sorteren op importance
            $scope.listPreferences.order = 'importance';
            var orderBy = $filter('orderBy');
            $scope.items = orderBy($scope.items, 'importance', true);
          }
        }

        // Loading dingen weghalen
        $ionicLoading.hide();
        $scope.doneLoading = true;
      }else{
        // Loading dingen weghalen
        $ionicLoading.hide();
        $scope.doneLoading = true;

        // To do: errors goed verwerken
        alert('Error: '+JSON.stringify(error));
        $ionicNavBarDelegate.setTitle('Error');
      }
    });
  };

  // Modal met listPreferences openen
  $scope.showListPreferences = function() { $scope.modal.show(); };

  // Modal met listPreferences sluiten en doorvoeren
  $scope.applyListPreferences = function() {
    // De sorteeroptie die we gaan kiezen heet newOrder
    var newOrder = $scope.listPreferences.order;
    // Als de keuze importance is, dan slaan we oldOrder op ipv importance
    if(newOrder == 'importance') $scope.listPreferences.order = oldOrder;
    // List preferences updaten
    listPreferences.set($scope.category, $scope.listPreferences);
    // Lijst opnieuw laden met de keuze als parameter
    $scope.init(newOrder);
    // Verberg opties
    $scope.modal.hide()
  };

  // Het eerste item in de collection repeat list is groter, anders wordt de layout opgefokt
  $scope.getItemHeight = function(item, index) {
    switch($scope.listPreferences.listStyle) {
      case 'small':
        if(index === 0) return 67;
        return 60;
      case 'cozy':
        if(index === 0) return 92;
        return 80;
      case 'grid':
        return 132;
      case 'normal':
      default:
        if(index === 0) return 112;
        return 100;
    }
  };

  $scope.getItemWidth = function(item, index) {
    switch($scope.listPreferences.listStyle) {
      case 'grid':
        return '50%';
      default:
        return '100%';
    }
  };

  // Link naar de detail pagina
  $scope.details = function(item) { $scope.navigate('details/'+$scope.category+'/'+item.id); };

  // Functie die aangeroepen wordt als het einde van de lijst nabij is
  $scope.getMoreItemsPlease = function() {
    if($scope.items.length && $scope.total > $scope.items.length) {

      $rootScope.loading = true;
      URLParamsObject.offset = $scope.items.length;

      APIDataFactory.getList($scope.category, URLParamsObject, function(error, result) {
        if(!error) {
          $scope.items.push.apply($scope.items, APIDataParser.parse($scope.category, result.results));
          $scope.total = result.total;
        }else{
          alert('Error: '+JSON.stringify(error));
        }
        $rootScope.loading = false;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
    }else{
      $rootScope.loading = false;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }
  };

  $scope.$on('$destroy', function() {
    $rootScope.showCategoryTabs = false;
    // Er zeker van zijn dat de modal uit de DOM is
    $scope.modal.remove();
  });

});