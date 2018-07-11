import DBHelper from './partials/utils';

let restaurants;
let neighborhoods;
let cuisines;
let map;
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.init();
  initMap();
  fetchNeighborhoods();
  fetchCuisines();

  document.querySelectorAll('.js-update-restaurants').forEach((elem) => {
    elem.addEventListener('change', updateRestaurants);
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
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
let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
let fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
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
let fillCuisinesHTML = (cuisines = self.cuisines) => {
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
let initMap = () => {
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

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
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
let fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.classList.add('m-center', 'card');

  const picture = document.createElement('picture');

  const webpSource = document.createElement('source');
  webpSource.setAttribute('srcset', `img/2x/webp/${restaurant.id}_2x.webp 2x, img/1x/webp/${restaurant.id}_1x_normal.webp`);
  webpSource.setAttribute('type', 'image/webp');
  picture.appendChild(webpSource);

  const jpgSource = document.createElement('source');
  jpgSource.setAttribute('srcset', `img/2x/jpg/${restaurant.id}_2x.jpg 2x, img/1x/jpg/${restaurant.id}_1x_normal.jpg`);
  jpgSource.setAttribute('type', 'image/jpg');
  picture.appendChild(jpgSource);

  const defaultSource = document.createElement('img');
  defaultSource.setAttribute('src', `img/2x/jpg/${restaurant.id}_2x.jpg`);
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

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.classList.add('absolute', 'mt-large', 'b-1', 'b-r5', 'dib', 'teal', 'no-underline', 'uppercase', 'btn-more');
  wrap.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }

    self.markers.push(marker);
  });
};