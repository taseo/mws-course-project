import idb from 'idb';

const IDBModule = (function() {

  const keyVal = 'restaurants';

  const openDatabase = () => {

    // if browser does not support service worker, return
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('main', 1, (upgradeDB) => {
      const store = upgradeDB.createObjectStore(keyVal, {keyPath: 'id'});
    });
  };

  const storeInIDB = (database, data) => {

    database.then((db) => {

      if (!db) {
        return;
      }

      const store = db.transaction(keyVal, 'readwrite').objectStore(keyVal);

      // restaurant retrieved by ID is not stored in array
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

  const getCachedRestaurants = (database, id) => {

    return database.then((db) => {

      if (!db) {
        return;
      }

      const store = db.transaction(keyVal).objectStore(keyVal);

      if (id) {
        // id that gets retrieved from URL is string
        return store.get(parseInt(id, 10));
      }

      return store.getAll();
    });
  };

  return {
    openDatabase,
    storeInIDB,
    getCachedRestaurants
  };

}());

export default IDBModule;