/**
 * utility to lazy load images
 * it looks for containers with class lazy and checks whether those elements are inside viewport
 * when true, it replaces srcset and src data attributes on their children nodes with respective source attributes
 */
const lazyImgModule = (function() {

  let lazyImages;
  let isActive = false;

  const lazyLoad = () => {

    if (isActive === false) {
      isActive = true;

      setTimeout(() => {

        for (const lazyImage of lazyImages) {

          const rect = lazyImage.getBoundingClientRect();

          if (rect.top <= window.innerHeight && rect.bottom >= 0) {

            let childNodes = lazyImage.childNodes;

            for (const node of childNodes) {
              if (node.dataset.srcset) {
                node.srcset = node.dataset.srcset;
              } else {
                node.src = node.dataset.src;
              }
            }

            lazyImage.classList.remove('lazy');

            lazyImages = lazyImages.filter((image) => image !== lazyImage);

            if (lazyImages.length === 0) {
              document.removeEventListener('scroll', lazyLoad);
              window.removeEventListener('resize', lazyLoad);
              window.removeEventListener('orientationchange', lazyLoad);
            }
          }
        }

        isActive = false;
      }, 200);
    }
  };

  return {
    init: () => {
      lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

      document.addEventListener('scroll', lazyLoad);
      window.addEventListener('resize', lazyLoad);
      window.addEventListener('orientationchange', lazyLoad);

      // trigger lazy load on init
      lazyLoad();
    }
  };

}());

export default lazyImgModule;