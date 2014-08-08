angular.module('marvelize.services', [])

.constant('MARVEL_API', {
  'publicKey': '51053776bff9f684b08a41a47734167b',
  'endpoint': 'http://gateway.marvel.com:80/v1/public/'
})

.factory('APIDataFactory', function($http, $location, $window, $sce, $rootScope, MARVEL_API) {

  $rootScope.loading = false;

  var obj = {
    // 
    pathToURL: function(path) {

      var glue = '?';
      if(path.indexOf('?') > -1) glue = '&';

      var url = MARVEL_API.endpoint+path+glue+'apikey='+MARVEL_API.publicKey+'&limit=100';
      console.log(url);
      return url;
    },

    objectToURLParams: function(object) {
      var URLParams = '';
      var i = 0;
      var glue = '?';

      for(key in object) {
        URLParams = URLParams + glue + key + '=' + object[key];
        if(glue == '?') glue = '&';
      }

      console.log(URLParams);
      return URLParams;
    },
    
    // Algemene functie om een bepaalde lijst op te vragen bij de API
    getList: function(type, URLParamsObject, callback) {

      $rootScope.loading = true;

      var error = '';

      var URLParams = this.objectToURLParams(URLParamsObject);

      $http({method: 'GET', url: this.pathToURL(type+URLParams), cache: true }).success(function(data, status, headers, config) {
        $rootScope.loading = false;

        callback(false, data.data);
      }).error(function(data, status, headers, config) {
        $rootScope.loading = false;
        callback(data, []);
      });

    },

    // Algemene functie om iets op te vragen op basis van ID
    getByID: function(type, id, callback) {

      $rootScope.loading = true;

      var error = '';
      $http({method: 'GET', url: this.pathToURL(type+'/'+id), cache: true }).success(function(data, status, headers, config) {
        $rootScope.loading = false;
        callback(false, data.data.results[0]);
      }).error(function(data, status, headers, config) {
        $rootScope.loading = false;
        callback(data, []);
      });

    },

    search: function(category, query, offset, callback) {

      $rootScope.loading = true;

      switch(category) {
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

      var URLParamsObject = {};
      URLParamsObject[fieldToQuery] = query;
      URLParamsObject.offset = offset;

      this.getList(category, URLParamsObject, callback);
    }
  };

  return obj;
})


.factory('APIDataParser', function() {

  var obj = {
    parse: function(type, data, parsedData) {

      var parsedData = parsedData || [];

      switch(type) {
        case 'characters':
          data.forEach(function(item){
            var parsedItem =
              {
                id: item.id,
                title: item.name,
                description: item.comics.available+' comics available.',
                importance: item.comics.available,
                image: ''
              };
            if(item.thumbnail && item.thumbnail.path && item.thumbnail.extension) parsedItem.image = item.thumbnail.path+'/landscape_amazing.'+item.thumbnail.extension;

            parsedData.push(parsedItem);
          });

          break;
        case 'series':
          data.forEach(function(item){
            var parsedItem =
              {
                id: item.id,
                title: item.title,
                image: item.thumbnail.path+'/landscape_amazing.'+item.thumbnail.extension,
                description: item.comics.available+' comics available',
                importance: item.comics.available
              };
            parsedData.push(parsedItem);
          });

          break;

        case 'comics':
          data.forEach(function(item){
            var date = new Date(item.dates[0].date);
            var parsedItem =
              {
                id: item.id,
                title: item.title,
                image: item.thumbnail.path+'/landscape_amazing.'+item.thumbnail.extension,
                description: 'Released '+date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
                importance: item.dates[0].date
              };
            parsedData.push(parsedItem);
          });

          break;

        case 'events':
          data.forEach(function(item){
            if(item.start == item.end) {
              var description = item.start.slice(0, 10);
            }else{
              var description = item.start.slice(0, 10) +' - ' + item.end.slice(0, 10);
            }

            var parsedItem =
              {
                id: item.id,
                title: item.title,
                image: item.thumbnail.path+'/landscape_amazing.'+item.thumbnail.extension,
                description: description,
                importance: item.comics.available
              };
            parsedData.push(parsedItem);
          });

          break;
      }

      return parsedData;
    }
  };

  return obj;
})

.factory('APIErrorHandler', function($http, $location, $window, $sce, $rootScope, $ionicPopup) {

  var obj = {
    errorSwitch: function() {
    },
    error: function(error) {

      var alertPopup = $ionicPopup.alert({
        title: 'Something went wrong.',
        template: 'We didn\'t get a valid response from Marvel (but error '+error.code+'). This is what they have to say about it: "'+error.status+'".'
      });
      alertPopup.then(function(res) {
        $rootScope.navigate('');
      });
    }
  };

  return obj;
})

.factory('favorites', function($rootScope) {
  // Beginnen met een lege array
  var favorites = [];

  // Favorites ophalen uit storage
  try {
    favorites = JSON.parse(window.localStorage['favorites']);
  } catch(e) {  }

  var obj = {
    // Favorites ophalen
    get: function() {
      return favorites;
    },
    // Favorites opslaan in localStorage
    save: function() {
      window.localStorage['favorites'] = JSON.stringify(favorites);
      $rootScope.$broadcast('favorites.changed', favorites);
    },
    // Check if an item is part of the favorites
    isFavorite: function(item) {
      for(var i=0;i<favorites.length;i++) {
        if(favorites[i].id == item.id && favorites[i].type == item.type) return true;
      }
      return false;
    },
    toggleFavorite: function(item) {
      if(this.isFavorite(item)) {
        this.removeFavorite(item);
      }else{
        this.addFavorite(item);
      }
    },
    addFavorite: function(item) {
      favorites.push(item);
      this.save();
    },
    removeFavorite: function(item) {
      var index = favorites.indexOf(item);
      favorites.splice(index, 1);
      this.save();
    }
  }

  // Save the settings to be safe
  obj.save();
  return obj;
})

.factory('listPreferences', function($rootScope) {
  // Beginnen met een lege array
  var listPreferences = {
      characters: {
        listStyle: 'thumbnail',
        order: 'name',
        descending: false
      },
      series: {
        listStyle: 'thumbnail',
        order: 'title',
        descending: false
      },
      comics: {
        listStyle: 'thumbnail',
        order: 'modified',
        descending: false
      },
      events: {
        listStyle: 'thumbnail',
        order: 'name',
        descending: false
      }
    };

  // preferences ophalen uit storage
  try {
    listPreferences = JSON.parse(window.localStorage['listPreferences']);
  } catch(e) {  }

  var obj = {
    // listPreferences ophalen
    get: function() {
      this.refresh();
      return listPreferences;
    },
    refresh: function() {
      try {
        listPreferences = JSON.parse(window.localStorage['listPreferences']);
      } catch(e) {  }
      return;
    },
    // listPreferences opslaan in localStorage
    save: function() {
      window.localStorage['listPreferences'] = JSON.stringify(listPreferences);
      $rootScope.$broadcast('listPreferences.changed', listPreferences);
    },
    set: function(category, obj) {
      listPreferences[category] = obj;
      this.save();
    }
  }

  // Save the settings to be safe
  obj.save();
  return obj;
});