// utility to create review item
const reviewModule = (function() {

  const createReviewHTML = (review) => {
    const li = document.createElement('li');
    li.classList.add('mb-extralarge');

    const titleWrap = document.createElement('span');
    titleWrap.classList.add('p-large--h', 'p-small--v', 'w--100', 'b-r20-r3--top', 'flex', 'justify-between', 'items-center', 'bg-dark', 'white', 'shadow-dark');
    li.append(titleWrap);

    const name = document.createElement('p');
    name.innerHTML = review.name;
    name.classList.add('fw-7', 'f-4');
    titleWrap.appendChild(name);

    const timestamp = new Date(review.updatedAt);

    const date = document.createElement('p');
    date.innerHTML = timestamp.toLocaleString();
    date.classList.add('f-2', 'gray-b8');
    titleWrap.appendChild(date);

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
    createReviewHTML
  };

}());

export default reviewModule;
