import '../css/main.css';

import DBUtilsModule from './modules/db-utils-module';
import lazyImgModule from './modules/lazy-img-module';
import mapModule from './modules/map-module';
import favoriteBtnModule from './modules/favorite-btn-module';
import reviewFormModule from './modules/review-form-module';
import reviewModule from './modules/review-module';

import lazyPlaceholders from '../img/lazyPlaceholders';

let restaurant;
let newMap;

document.addEventListener('DOMContentLoaded', (event) => {
  DBUtilsModule.init();
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {

      mapModule.loadMap(() => {
        self.newMap = L.map('map', {
          center: [restaurant.latlng.lat, restaurant.latlng.lng],
          scrollWheelZoom: false,
          zoom: 16,
        });

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                       '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                       'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          id: 'mapbox.streets',
          mapboxToken: 'pk.eyJ1IjoidGFzZW8iLCJhIjoiY2ppa3FlOXJjMTU4NTNrcGNsZnJyNzd0ciJ9.U5bH0axIXMG6gsMVXf8sjA',
          maxZoom: 18,
        }).addTo(self.newMap);

        DBUtilsModule.mapMarkerForRestaurant(self.restaurant, self.newMap);
      });

      fillBreadcrumb();
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const id = getParameterByName('id');

  // init reviews form
  reviewFormModule.init('review-form', 'submit-review', 'reviews-list', id);

  // fill reviews
  DBUtilsModule.fetchReviews(id, fillReviewsHTML);

  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBUtilsModule.fetchRestaurants((error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    }, id);
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-picture');
  image.classList.add('lazy');

  const webpSource = document.createElement('source');
  webpSource.setAttribute('data-srcset', `img/2x/webp/${restaurant.id}_2x.webp 2x, img/1x/webp/${restaurant.id}_1x_large.webp`);
  webpSource.setAttribute('type', 'image/webp');
  image.appendChild(webpSource);

  const jpgSource = document.createElement('source');
  jpgSource.setAttribute('data-srcset', `img/2x/jpg/${restaurant.id}_2x.jpg 2x, img/1x/jpg/${restaurant.id}_1x_large.jpg`);
  jpgSource.setAttribute('type', 'image/jpg');
  image.appendChild(jpgSource);

  const defaultSource = document.createElement('img');
  defaultSource.setAttribute('data-src', `img/2x/jpg/${restaurant.id}_2x.jpg`);
  defaultSource.setAttribute('src', lazyPlaceholders[restaurant.id]);
  defaultSource.setAttribute('alt', `Photo of ${restaurant.name} restaurant`);
  defaultSource.classList.add('b-r20-r3--top', 'flex', 'shadow-dark');
  image.appendChild(defaultSource);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // init lazy load for images
  lazyImgModule.init();

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  const controlArea = document.createElement('div');
  controlArea.classList.add('flex', 'mt-large');

  controlArea.append(favoriteBtnModule.createBtn(restaurant));
  document.getElementById('about-restaurant').append(controlArea);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.classList.add('seperator');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.classList.add('w--45', 'b-1--bottom', 'b-gray-e');
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.classList.add('b-1--bottom', 'b-gray-e');
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.classList.add('m-medium--v', 'blue-gray', 'fw-3', 'f-5');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');

  reviews.forEach(review => {
    ul.appendChild(reviewModule.createReviewHTML(review));
  });

  container.appendChild(ul);
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.classList.add('dib', 'lh-1', 'breadcrumb-divider');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {

  if (!url) {
    url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
  }
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);

  if (!results) {
    return null;
  }

  if (!results[2]) {
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
