import idb from 'idb';

export default class IDBHelper {

  static openDatabase() {

    // if browser does not support service worker, return
    if(!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('main', 1, (upgradeDB) => {
      const store = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'})
    })
  }

  static storeInIDB(database, data) {

    database.then((db) => {

      if(!db) {
	return;
      }

      const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');

      // restaurant retrieved by ID is not stored in array
      if(Array.isArray(data)) {
	for (const item of data) {
	  store.put(item);
	}
      } else {
	store.put(data)
      }
    });
  }

  static getCachedRestaurants(database, id) {

    return database.then((db) => {

      if(!db) {
	return;
      }

      const store = db.transaction('restaurants').objectStore('restaurants');

      if(id) {
	// id that gets retrieved from URL is string
	return store.get(parseInt(id, 10));
      }

      return store.getAll();
    })
  }
}