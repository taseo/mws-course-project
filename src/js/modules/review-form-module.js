import reviewModule from './review-module';
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

  // on post request creates new response message, otherwise updates existing element
  const createResponseMessage = (messageTxt, type) => {

    if (!responseMessage) {

      const message = document.createElement('p');
      message.setAttribute('aria-live', 'polite');
      message.classList.add('response', 'mt-large', 'b-1', 'b-transparent', 'b-r-small', type);
      message.innerText = messageTxt;
      responseMessage = message;

      form.append(message);
    } else {

      // cleanup up classes that style response message type
      responseMessage.classList.remove('response-success', 'response-update');
      responseMessage.classList.add(type);
      responseMessage.innerText = messageTxt;
    }
  };

  const handleSubmit = (review, message, messageType) => {

    isPending = false;

    // save review ID for PUT request
    if (!reviewId) {
      reviewId = review.id;
    }

    // inform user about changes
    createResponseMessage(message, messageType);

    // remove previous review element if it gets updated
    if (newReviewElem) {
      newReviewElem.remove();
    }

    // add crated review to the DOM
    newReviewElem = reviewModule.createReviewHTML(review);
    reviewList.prepend(newReviewElem);

    // store posted review in IndexedDB
    IDBModule.storeInIDB(review, IDBModule.reviewKeyVal);
  };

  const postReview = () => {

    fetch('http://localhost:1337/reviews/', {
      method: 'POST',
      body: JSON.stringify({
        ...reviewData,
        restaurant_id: restaurantId
      })
    }).then((response) => response.json())
      .then((review) => {
        handleSubmit(review, 'Thank you! Your review was submitted', 'response-success');
      });
  };

  const updateReview = () => {

    fetch(`http://localhost:1337/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    }).then((response) => response.json())
      .then((review) => {
        handleSubmit(review, 'Thank you! Your review was updated', 'response-update');
      });
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
          updateReview();
        } else {
          postReview();
        }
      } else {
        isPending = false;
      }
    }
  };

  const init = (formId, buttonId, listId, id) => {
    restaurantId = parseInt(id, 10);
    form = document.getElementById(formId);
    reviewList = document.getElementById(listId);
    document.getElementById(buttonId).addEventListener('click', submit);
  };

  return {
    init
  };

}());

export default reviewFormModule;