/**
 * utility to defer map loading
 * css gets pre-loaded in HTML
 */
const mapModule = (function() {

  const loadMap = (callback) => {

    // css should be pre-loaded in HTML
    const linkTag = document.createElement('link');
    linkTag.href = 'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css';
    linkTag.setAttribute('integrity', 'sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ==');
    linkTag.setAttribute('rel', 'stylesheet');
    linkTag.setAttribute('crossorigin', true);

    document.body.appendChild(linkTag);

    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js';
    scriptTag.setAttribute('integrity', 'sha512-/Nsx9X4HebavoBvEBuyp3I7od5tA0UzAxs+j83KgC8PU0kgB4XiK4Lfe4y4cgBtaRJQEIFCW+oC506aPT2L1zw==');
    scriptTag.setAttribute('crossorigin', true);

    scriptTag.onload = callback;
    scriptTag.onreadystatechange = callback;

    document.body.appendChild(scriptTag);
  };

  return {
    loadMap
  };

}());

export default mapModule;