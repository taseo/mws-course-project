const staticCache = 'restaurant-reviews-v1';

self.addEventListener('install', (event) => {

  // create static cache on sw install

  event.waitUntil(
    caches.open(staticCache).then((cache) => {
      return cache.addAll([
	'/',
	'/restaurant.html',
	'/css/main.css',
	'/data/restaurants.json',
	'/js/main.js',
	'/js/utils.js',
	'/js/restaurant_info.js'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {

  // delete outdated cache

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
 	keys.filter((key) => {
 	  return key !== staticCache;
 	}).map((key) => {
 	  return caches.delete(key);
 	})
      );
    })
  );
});

self.addEventListener('fetch', (event) => {

  const requestUrl = new URL(event.request.url);

  if(requestUrl.origin === location.origin) {

    // respond with cached restaurant overview page

    if(requestUrl.pathname === '/restaurant.html') {
      event.respondWith(caches.match('/restaurant.html'))
      return;
    }
  }

  // attempt to respond with cached version

  event.respondWith(
    caches.open(staticCache).then((cache) => {
      return cache.match(event.request).then((response) => {

	// return cached version or try to fetch and cache the new response

 	return response || fetch(event.request).then((response) => {
	  cache.put(event.request, response.clone());
 	  return response;
 	})
      })
    }).catch((error) => {
      console.log(error);
    })
  );
});