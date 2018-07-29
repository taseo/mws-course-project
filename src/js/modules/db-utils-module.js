import IDBModule from './idb-module';
import favoriteBtnModule from './favorite-btn-module';

/**
 * Common database helper functions.
 */
const DBUtilsModule = (function() {

  const apiURL = 'http://localhost:1337/';
  let onlineListenerCallback;

  // fetch all restaurants
  const fetchRestaurants = (callback, id = null) => {

    let url = `${apiURL}restaurants`;

    if (id) {
      url += `/${id}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        IDBModule.storeInIDB(data, IDBModule.restaurantKeyVal);
        callback(null, data);
      }).catch((error) => {

        // attempt to retrieve cached restaurants
        IDBModule.getCachedRestaurants(id).then((data) => {
          callback(null, data);
        });
      });
  };

  const fetchReviews = (id, callback) => {

    return fetch(`${apiURL}reviews/?restaurant_id=${id}`)
      .then((response) => response.json())
      .then((reviews) => {

        // sort review placing newest at the top
        reviews = reviews.sort((a, b) => {
          const dateA = new Date(a.updatedAt);
          const dateB = new Date(b.updatedAt);

          return dateB.getTime() - dateA.getTime();
        });

        IDBModule.storeInIDB(reviews, IDBModule.reviewKeyVal);
        callback(reviews);
      }).catch((error) => {

        // attempt to retrieve cached reviews
        IDBModule.getCachedReviews(id).then((reviews) => {
          callback(reviews);
        });
      });
  };

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  const fetchRestaurantByCuisine = (cuisine, callback) => {
    // Fetch all restaurants  with proper error handling
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  };

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  const fetchRestaurantByNeighborhood = (neighborhood, callback) => {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  };

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  const fetchRestaurantByCuisineAndNeighborhood = (cuisine, neighborhood, callback) => {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        callback(null, results);
      }
    });
  };

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  const fetchNeighborhoods = (callback) => {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        callback(null, uniqueNeighborhoods);
      }
    });
  };

  /**
   * Fetch all cuisines with proper error handling.
   */
  const fetchCuisines = (callback) => {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        callback(null, uniqueCuisines);
      }
    });
  };

  /**
   * Restaurant page URL.
   */
  const urlForRestaurant = (restaurant) => {
    return (`./restaurant.html?id=${restaurant.id}`);
  };

  /**
   * Restaurant image URL.
   */
  const imageUrlForRestaurant = (restaurant) => {
    return (`/img/${restaurant.photograph}`);
  };

  /**
   * Map marker for a restaurant.
   */
  const mapMarkerForRestaurant = (restaurant, map) => {

    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        alt: restaurant.name,
        title: restaurant.name,
        url: urlForRestaurant(restaurant)
      }
    );

    marker.addTo(newMap);
    return marker;
  };

  const postReview = (data, callback, reviewId, wasOffline) => {

    // check if we have active internet connection
    if (navigator.onLine) {

      let url = `${apiURL}reviews`;
      let method = 'POST';

      if (reviewId) {
        url += `/${reviewId}`;
        method = 'PUT';
      }

      fetch(url, {
        method: method,
        body: JSON.stringify(data)
      }).then((response) => response.json())
        .then((review) => {

          /**
           * wasOffline flag indicates that we are synced review that previously was offline
           * calls callback with appropriate message to indicate changes to the user
           */
          if (wasOffline) {

            if (method === 'POST') {
              callback(review, 'Thank you! Your offline review was synchronized', 'response-success', true, data.id);
            } else {
              callback(review, 'Thank you! Your offline changes were synchronized', 'response-update', true, data.id);
            }
          } else {

            if (method === 'POST') {
              callback(review, 'Thank you! Your review was submitted', 'response-success');
            } else {
              callback(review, 'Thank you! Your review was updated', 'response-update');
            }
          }

          IDBModule.storeInIDB(review, IDBModule.reviewKeyVal);
        });
    } else {

      const onLineCallback = () => {
        postReview(data, callback, reviewId, true);
        window.removeEventListener('online', onLineCallback);
      };

      // inform user that form submit is not possible as user appears to be offline
      if (!wasOffline) {

        // generate random ID (to be used to reference entry in offline reviews IDB) when entry does not have it allready
        data.id = reviewId || 'offline-' + Math.random();

        callback(data, 'It appears you are offline! We will try to re-submit your review as soon as you come back online', 'response-error');

        IDBModule.storeInIDB(data, IDBModule.offlineReviewsKeyVal);

        // when user tried to post review when offline and after that tried to change it, remove previous online event listener
        if (onlineListenerCallback) {
          window.removeEventListener('online', onlineListenerCallback);
        }

        onlineListenerCallback = onLineCallback;
      }

      // listen of connection to come back online
      window.addEventListener('online', onLineCallback);
    }
  };

  // sync offline review in background
  const postOfflineReview = (review) => {

    // determine if it should be PUT or POST
    let url = `${apiURL}reviews`;
    let method = 'POST';

    if (review.id && typeof review.id === 'number') {
      url += `/${review.id}`;
      method = 'PUT';
    }

    fetch(url, {
      method: method,
      body: JSON.stringify(review)
    }).then((response) => response.json())
      .then((syncedReview) => {

        IDBModule.storeInIDB(syncedReview, IDBModule.reviewKeyVal);
        IDBModule.removeFromIDB(review.id, IDBModule.offlineReviewsKeyVal);
      });
  };

  // check if we have any offline reviews to be synced in background
  const silentReviewSync = () => {

    IDBModule.getUnsyncedData(IDBModule.offlineReviewsKeyVal).then((offlineReviews) => {

      if (offlineReviews) {

        offlineReviews.forEach((review) => {

          if (navigator.onLine) {
            postOfflineReview(review);
          } else {

            // wait for user to come back online and try to re-sync
            window.addEventListener('online', function _callback() {
              postOfflineReview(review);
              window.removeEventListener('online', _callback);
            });
          }
        });
      }

    });
  };

  // waits for connection and attempts to sync restaurant data
  const syncRestaurantData = (id, isFavoriteAction, updateDom) => {

    window.addEventListener('online', function _callback() {

      fetch(`${apiURL}restaurants/${id}/?is_favorite=${isFavoriteAction}`, {
        method: 'PUT'
      }).then((response) => response.json())
        .then((restaurantData) => {
          IDBModule.storeInIDB(restaurantData, IDBModule.restaurantKeyVal);
          IDBModule.removeFromIDB(restaurantData.id, IDBModule.offlineRestaurantKeyVal);

          window.removeEventListener('online', _callback);

          // change favorite btn DOM element to reflect the correct state
          if (updateDom) {
            favoriteBtnModule.updateButton(restaurantData.id, restaurantData.name);
          }
        });
    });
  };

  const favoriteRestaurant = (id, isFavoriteAction, callback) => {

    if (navigator.onLine) {

      fetch(`${apiURL}restaurants/${id}/?is_favorite=${isFavoriteAction}`, {
        method: 'PUT'
      }).then((response) => response.json())
        .then((restaurantData) => {
          callback(restaurantData);
          IDBModule.storeInIDB(restaurantData, IDBModule.restaurantKeyVal);
        });
    } else {

      // when offline, fetch cached property, mark/unmark it as favorite and attempt to sync when online
      IDBModule.getCachedRestaurants(id).then((restaurant) => {

        restaurant.is_favorite = isFavoriteAction;
        callback(restaurant);

        IDBModule.storeInIDB(restaurant, IDBModule.restaurantKeyVal);
        IDBModule.storeInIDB(restaurant, IDBModule.offlineRestaurantKeyVal);

        syncRestaurantData(id, isFavoriteAction);
      });
    }
  };

  // syncs unsaved changes to restaurant data in background
  const syncOfflineRestaurants = () => {

    IDBModule.getUnsyncedData(IDBModule.offlineRestaurantKeyVal).then((reviews) => {

      reviews.forEach((review) => {

        /**
         * when online, sync changes and update favorite state in DOM
         *  otherwise wait for connection to come back online
         */
        if (navigator.onLine) {
          fetch(`${apiURL}restaurants/${review.id}/?is_favorite=${review.is_favorite}`, {
            method: 'PUT'
          }).then((response) => response.json())
            .then((restaurantData) => {
              IDBModule.storeInIDB(restaurantData, IDBModule.restaurantKeyVal);
              IDBModule.removeFromIDB(restaurantData.id, IDBModule.offlineRestaurantKeyVal);

              favoriteBtnModule.updateButton(restaurantData.id, restaurantData.name);
            });
        } else {
          syncRestaurantData(id, isFavoriteAction, true);
        }
      });
    });
  };

  return {
    fetchRestaurants,
    fetchReviews,
    fetchRestaurantByCuisineAndNeighborhood,
    fetchNeighborhoods,
    fetchCuisines,
    urlForRestaurant,
    mapMarkerForRestaurant,
    postReview,
    silentReviewSync,
    syncOfflineRestaurants,
    favoriteRestaurant
  };

}());

export default DBUtilsModule;