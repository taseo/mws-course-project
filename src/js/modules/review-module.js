// utility to create review item
const reviewModule = (function() {

  const createTimestamp = (postDate) => {

    postDate = new Date(postDate);

    const timestamp = document.createElement('p');
    timestamp.innerHTML = postDate.toLocaleString();
    timestamp.classList.add('f-2', 'gray-b8');

    return timestamp;
  };

  const createReviewHTML = (review) => {
    const li = document.createElement('li');
    li.id = `review-${review.id}`;
    li.classList.add('mb-extralarge');

    const titleWrap = document.createElement('span');
    titleWrap.classList.add('p-large--h', 'p-small--v', 'w--100', 'b-r20-r3--top', 'flex', 'justify-between', 'items-center', 'bg-dark', 'white', 'shadow-dark', 'js-review-title');
    li.append(titleWrap);

    const name = document.createElement('p');
    name.innerHTML = review.name;
    name.classList.add('fw-7', 'f-4');
    titleWrap.appendChild(name);

    // updatedAt property is available only for reviews that are synced with server
    if (review.updatedAt) {
      titleWrap.appendChild(createTimestamp(review.updatedAt));
    } else {
      const offline = document.createElement('p');
      offline.innerText = 'Offline';
      offline.classList.add('p-large--h', 'b-1', 'b-r-small', 'b-red', 'red', 'bg-white', 'review-error');
      titleWrap.appendChild(offline);

      // update ID
      li.id = `review-${review.id}`;
    }

    const wrap = document.createElement('span');
    wrap.classList.add('pa-medium', 'w--100', 'b-r20-r3--bottom', 'dib', 'bg-white', 'shadow-dark');
    li.append(wrap);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    rating.classList.add('mb-normal', 'p-small--h', 'dib', 'b-1', 'b-r3', 'uppercase', 'fw-7', 'ls-1', 'lh-17');
    wrap.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    comments.classList.add('lh-17');
    wrap.appendChild(comments);

    return li;
  };

  return {
    createReviewHTML,
    createTimestamp
  };

}());

export default reviewModule;
