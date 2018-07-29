import DBUtilsModule from './db-utils-module';

// utility to create and operate add/remove restaurant as favorite button
const favoriteBtnModule = (function() {

  const setActive = (button, restaurantName) => {
    button.classList.add('favorited');
    button.setAttribute('title', `Unmark ${restaurantName} restaurant as favorite`);
  };

  const setChecked = (button) => {
    button.setAttribute('aria-checked', true);
  };

  const setInactive = (button, restaurantName) => {
    button.classList.remove('favorited');
    button.setAttribute('title', `Mark ${restaurantName} restaurant as favorite`);
  };

  const setNotChecked = (button) => {
    button.setAttribute('aria-checked', false);
  };

  const blockPageScroll = (event) => {

    if (event.keyCode === 32) {
      event.preventDefault();
    }
  };

  // updates button state when offline changes were synced
  const updateButton = (id, restaurantName) => {

    const favoriteBtn = document.getElementById(`favorite-btn-${id}`);

    if (favoriteBtn.classList.contains('favorite')) {
      setInactive(favoriteBtn, restaurantName);
    } else {
      setActive(favoriteBtn, restaurantName);
    }
  };

  const eventHandler = function(id, restaurantName, event) {

    // on keyup event return if other than spacebar was pressed
    if (event.type === 'keyup' && event.keyCode !== 32) {
      return;
    }

    const isFavorite = this.classList.contains('favorited');
    let isFavoriteAction = isFavorite ? 'false' : 'true';

    /**
     * checkbox state is announced immediately upon action by screen reader
     * when changed after PUT request, invalid values are announced
     */
    if (isFavorite) {
      setNotChecked(this);
    } else {
      setChecked(this);
    }

    DBUtilsModule.favoriteRestaurant(id, isFavoriteAction, (restaurantData) => {

      const liveArea = this.parentNode.childNodes[1];

      // announce to screen reader that action was completed
      if (restaurantData.is_favorite === 'true') {
        setActive(this, restaurantName);
        liveArea.innerText = `You marked ${restaurantName} restaurant as favorite`;
      } else {
        setInactive(this, restaurantName);
        liveArea.innerText = `You unmarked ${restaurantName} restaurant as favorite`;
      }
    });
  };

  const createBtn = (restaurant) => {

    const wrap = document.createElement('div');
    wrap.classList.add('favorite-btn-wrap');

    const liveArea = document.createElement('div');
    liveArea.classList.add('sr-only');
    liveArea.setAttribute('aria-live', 'polite');

    const favoriteBtn = document.createElement('div');
    favoriteBtn.id = `favorite-btn-${restaurant.id}`;
    favoriteBtn.setAttribute('role', 'checkbox');
    favoriteBtn.setAttribute('tabindex', 0);
    favoriteBtn.classList.add('favorite-btn');

    if (restaurant.is_favorite === 'true') {
      setActive(favoriteBtn, restaurant.name);
      setChecked(favoriteBtn);
    } else {
      setInactive(favoriteBtn, restaurant.name);
      setNotChecked(favoriteBtn);
    }

    favoriteBtn.addEventListener('click', eventHandler.bind(favoriteBtn, restaurant.id, restaurant.name));
    favoriteBtn.addEventListener('keyup', eventHandler.bind(favoriteBtn, restaurant.id, restaurant.name));

    // on keydown suppress page scroll when spacebar is pressed
    favoriteBtn.addEventListener('keydown', blockPageScroll);

    wrap.append(favoriteBtn);
    wrap.append(liveArea);

    return wrap;
  };

  return {
    createBtn,
    updateButton
  };

}());

export default favoriteBtnModule;