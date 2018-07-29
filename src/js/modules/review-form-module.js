import reviewModule from './review-module';
import DBUtilsModule from './db-utils-module';
import IDBModule from './idb-module';

/**
 * utility to operate review form
 */
const reviewFormModule = (function() {

  let form;
  let reviewList;
  let responseMessage;
  let restaurantId;
  let reviewId;

  let isPending = false;

  let isErrorFocused = false;
  let errorElems = {};
  let newReviewElem;
  let errorCount = 0;

  const errorMessage = {
    name: 'Your name cannot be empty',
    comments: 'Your review cannot be empty'
  };

  let reviewData = {};

  const createId = (elemId) => elemId + '-error';

  const createErrorMessage = (elem) => {

    const key = elem.dataset.key;
    const id =  createId(key);

    if (!errorElems[id]) {

      const message = document.createElement('div');

      message.innerHTML = errorMessage[key];
      message.classList.add('absolute', 'form-error', 'red', 'right', 'f-2');

      // associate input and error message with aria-describedby
      message.id = id;
      elem.setAttribute('aria-describedby', id);

      errorElems[id] = message;

      elem.parentNode.append(message);
    }
  };

  /**
   * when input has value (input event was triggered), remove associated event listeners
   * a11y attributes are reset to valid state, error message gets removed
   */
  const resetError = function() {

    const id = createId(this.id);

    this.setAttribute('aria-valid', true);
    this.classList.remove('b-red');
    this.removeAttribute('aria-describedby');

    errorElems[id].remove();

    delete errorElems[id];

    this.removeEventListener('input', resetError);
  };

  /**
   * when field is empty, listen for new input
   * a11y attributes are set to invalid state, error message gets added
   */
  const markAsInvalid = (elem) => {

    errorCount++;

    elem.classList.add('b-red');
    elem.setAttribute('aria-valid', false);

    createErrorMessage(elem);

    elem.addEventListener('input', resetError);

    // focus first occurance of error
    if (!isErrorFocused) {
      elem.focus();
      isErrorFocused = true;
    }
  };

  // store value in object that gets posted to server
  const updateValue = (value, key) => {
    reviewData[key] = value;
  };

  // determine if field is empty
  const validateRequired = (elem) => {

    const value = elem.value.trim();

    if (value) {
      updateValue(value, elem.dataset.key);
    } else {
      markAsInvalid(elem);
    }
  };

  const updateResponseMessage = (messageTxt, messageType) => {

    // cleanup up classes that style response message type
    responseMessage.classList.remove('response-success', 'response-update', 'response-error');
    responseMessage.classList.add(messageType);
    responseMessage.innerText = messageTxt;
  };

  // on post request creates new response message, otherwise updates existing element
  const createResponseMessage = (messageTxt, messageType) => {

    if (!responseMessage) {

      const message = document.createElement('p');
      message.setAttribute('aria-live', 'polite');
      message.classList.add('response', 'mt-large', 'b-1', 'b-transparent', 'b-r-small', messageType);
      message.innerText = messageTxt;
      responseMessage = message;

      form.append(message);
    } else {
      updateResponseMessage(messageTxt, messageType);
    }
  };

  const handleSubmit = (review, messageTxt, messageType, tobeSynced, offlineId) => {

    isPending = false;

    // save review ID for PUT request and ignore offline IDs (should be string that starts with 'offlie-' prefix)
    if (!reviewId && typeof review.id === 'number') {
      reviewId = review.id;
    }

    if (!tobeSynced) {

      // inform user about changes
      createResponseMessage(messageTxt, messageType);

      // remove previous review element if it gets updated
      if (newReviewElem) {
        newReviewElem.remove();
      }

      // add created review to the DOM
      newReviewElem = reviewModule.createReviewHTML(review);
      reviewList.prepend(newReviewElem);
    } else {

      // remove review error (offline warning)
      const reviewItem = document.getElementById(`review-${offlineId}`);

      reviewItem.querySelector('.review-error').remove();
      reviewItem.querySelector('.js-review-title').append(reviewModule.createTimestamp(review.updatedAt));

      // remove newly synced review from offline reviews IDB
      IDBModule.removeFromIDB(offlineId, IDBModule.offlineReviewsKeyVal);

      // update form response message when it exists
      if (responseMessage) {
        updateResponseMessage(messageTxt, messageType);
      }
    }
  };

  const submit = () => {

    if (!isPending) {

      // reset flags and data
      isPending = true;
      isErrorFocused = false;
      errorCount = 0;
      reviewData = {};

      // loop through inputs and call appropriate validation func
      for (let elem of form.elements) {

        if (elem.nodeName === 'INPUT' && elem.type === 'text') {
          validateRequired(elem);
        }

        if (elem.nodeName === 'TEXTAREA') {
          validateRequired(elem);
        }

        // extract checked rating
        if (elem.nodeName === 'INPUT' && elem.type === 'radio') {

          if (elem.checked) {
            updateValue(parseInt(elem.value, 10), elem.dataset.key);
          }
        }
      }

      // proceed with submit
      if (errorCount === 0) {

        if (reviewId) {
          DBUtilsModule.postReview(reviewData, handleSubmit, reviewId);
        } else {
          DBUtilsModule.postReview({
            ...reviewData,
            restaurant_id: restaurantId
          }, handleSubmit);
        }
      } else {
        isPending = false;
      }
    }
  };

  const syncOffline = (reviews) => {

    reviews.forEach((review) => {
      DBUtilsModule.postReview(review, handleSubmit, null, true);
    });
  };

  const init = (formId, buttonId, listId, id) => {
    restaurantId = parseInt(id, 10);
    form = document.getElementById(formId);
    reviewList = document.getElementById(listId);
    document.getElementById(buttonId).addEventListener('click', submit);
  };

  return {
    init,
    syncOffline
  };

}());

export default reviewFormModule;