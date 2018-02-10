(function () {
    'use strict';

    function onload () {
        const sunsetElement = document.querySelector('img#sunset');
        const sunriseElement = document.querySelector('img#sunrise');
        const socialElements = Array.from(document.querySelectorAll('img.social'));

        sunsetElement.addEventListener('click', () => {
            document.body.classList.add('night');
            sunsetElement.style.display = 'none';
            sunriseElement.style.display = '';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? '' : 'none';
            });
        });

        sunriseElement.addEventListener('click', () => {
            document.body.classList.remove('night');
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? 'none' : '';
            });
        });
    }

    document.addEventListener('DOMContentLoaded', onload);
})();
