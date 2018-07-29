import '../css/main.css';

import commonModule from './modules/common-module';
import DBUtilsModule from './modules/db-utils-module';
import lazyImgModule from './modules/lazy-img-module';
import mapModule from './modules/map-module';
import favoriteBtnModule from './modules/favorite-btn-module';

import lazyPlaceholders from '../img/lazyPlaceholders';

let restaurants;
let neighborhoods;
let cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  commonModule.initServiceWorker();
  commonModule.initSkipLink();

  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();

  document.querySelectorAll('.js-update-restaurants').forEach((elem) => {
    elem.addEventListener('change', updateRestaurants);
  });

  // sync offline data in background
  DBUtilsModule.silentReviewSync();
  DBUtilsModule.syncOfflineRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBUtilsModule.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBUtilsModule.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {

  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    scrollWheelZoom: false,
    zoom: 12
  });

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                 '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets',
    mapboxToken: 'pk.eyJ1IjoidGFzZW8iLCJhIjoiY2ppa3FlOXJjMTU4NTNrcGNsZnJyNzd0ciJ9.U5bH0axIXMG6gsMVXf8sjA',
    maxZoom: 18
  }).addTo(newMap);

  addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBUtilsModule.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();

      lazyImgModule.init();

      if (!window.L) {
        mapModule.loadMap(initMap);
      }
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }

  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.classList.add('relative', 'm-center', 'card', 'w--100');

  const picture = document.createElement('picture');
  picture.classList.add('lazy');

  const webpSource = document.createElement('source');
  webpSource.setAttribute('data-srcset', `img/2x/webp/${restaurant.id}_2x.webp 2x, img/1x/webp/${restaurant.id}_1x_normal.webp`);
  webpSource.setAttribute('type', 'image/webp');
  picture.appendChild(webpSource);

  const jpgSource = document.createElement('source');
  jpgSource.setAttribute('data-srcset', `img/2x/jpg/${restaurant.id}_2x.jpg 2x, img/1x/jpg/${restaurant.id}_1x_normal.jpg`);
  jpgSource.setAttribute('type', 'image/jpg');
  picture.appendChild(jpgSource);

  const defaultSource = document.createElement('img');
  defaultSource.setAttribute('data-src', `img/2x/jpg/${restaurant.id}_2x.jpg`);
  defaultSource.setAttribute('src', lazyPlaceholders[restaurant.id]);
  defaultSource.setAttribute('alt', `Photo of ${restaurant.name} restaurant`);
  defaultSource.classList.add('b-r20-r3--top', 'flex', 'shadow-dark');
  picture.appendChild(defaultSource);

  li.append(picture);

  const wrap = document.createElement('div');
  wrap.classList.add('relative', 'mb-extralarge', 'pa-medium', 'b-r20-r3--bottom', 'shadow-dark', 'bg-white', 'inner-card');
  li.append(wrap);

  const name = document.createElement('h3');
  name.classList.add('mb-normal', 'uppercase', 'blue-gray', 'fw-3', 'f-5');
  name.innerHTML = restaurant.name;
  wrap.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  wrap.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  wrap.append(address);

  const controlArea = document.createElement('div');
  controlArea.classList.add('absolute', 'mt-large', 'flex', 'items-center', 'justify-between', 'control-area');

  const moreLnk = document.createElement('a');
  moreLnk.innerHTML = 'View Details';
  moreLnk.href = DBUtilsModule.urlForRestaurant(restaurant);
  moreLnk.classList.add('b-1', 'b-r5', 'dib', 'teal', 'no-underline', 'uppercase', 'btn', 'btn-more');

  controlArea.append(moreLnk);
  controlArea.append(favoriteBtnModule.createBtn(restaurant));

  wrap.append(controlArea);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBUtilsModule.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }

    self.markers.push(marker);
  });
};