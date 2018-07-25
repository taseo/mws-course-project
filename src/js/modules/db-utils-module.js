import IDBModule from './idb-module';

/**
 * Common database helper functions.
 */
const DBUtilsModule = (function() {

  const apiURL = 'http://localhost:1337/';

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

  const init = () => {

    // register service worker
    if (navigator.serviceWorker) {

      navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service worker registered successfully');
      }).catch(() => {
        console.log('Service worker could not register');
      });
    }

    // provide functionality for skip to content link
    const mainContent = document.getElementById('content-start');

    document.getElementById('skip-content').addEventListener('click', (e) => {
      e.preventDefault();

      mainContent.setAttribute('tabindex', '1');
      mainContent.focus();
      mainContent.removeAttribute('tabindex');
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
    init
  };

}());

export default DBUtilsModule;