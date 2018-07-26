import idb from 'idb';

const IDBModule = (function() {

  const restaurantKeyVal = 'restaurants';
  const reviewKeyVal = 'reviews';
  const reviewsIndex = 'restaurantReview';

  const openDatabase = () => {

    // if browser does not support service worker, return
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('main', 1, (upgradeDB) => {
      const restorantStore = upgradeDB.createObjectStore(restaurantKeyVal, {keyPath: 'id'});
      const reviewStore = upgradeDB.createObjectStore(reviewKeyVal, {keyPath: 'id'});

      reviewStore.createIndex(reviewsIndex, 'restaurant_id');
    });
  };

  const database = openDatabase();

  const storeInIDB = (data, keyVal) => {

    database.then((db) => {

      if (!db) {
        return;
      }

      const store = db.transaction(keyVal, 'readwrite').objectStore(keyVal);

      // multiple items are stored in array
      if (Array.isArray(data)) {
        for (const item of data) {
          store.put(item);
        }
      } else {
        store.put(data);
      }

      return store.complete;
    });
  };

  const getCachedRestaurants = (id) => {

    return database.then((db) => {

      if (!db) {
        return;
      }

      const store = db.transaction(restaurantKeyVal).objectStore(restaurantKeyVal);

      if (id) {
        return store.get(parseInt(id, 10));
      }

      return store.getAll();
    });
  };

  const getCachedReviews = (id) => {

    return database.then((db) => {

      if (!db) {
        return;
      }

      const store = db.transaction(reviewKeyVal).objectStore(reviewKeyVal);
      const index = store.index(reviewsIndex);

      return index.getAll(parseInt(id, 10));
    });
  };

  return {
    storeInIDB,
    getCachedRestaurants,
    getCachedReviews,
    restaurantKeyVal,
    reviewKeyVal
  };

}());

export default IDBModule;
