(function () {
    'use strict';

    function onload () {
        const sunsetElement = document.querySelector('img#sunset');
        const sunriseElement = document.querySelector('img#sunrise');
        const socialElements = Array.from(document.querySelectorAll('img.social'));

        function sunset () {
            document.body.classList.add('night');
            window.localStorage.setItem('night', 'true');
            sunsetElement.style.display = 'none';
            sunriseElement.style.display = '';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? '' : 'none';
            });
        }

        sunsetElement.addEventListener('click', sunset);

        function sunrise () {
            document.body.classList.remove('night');
            window.localStorage.removeItem('night');
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? 'none' : '';
            });
        }

        sunriseElement.addEventListener('click', sunrise);

        if (window.localStorage.getItem('night')) {
            sunset();
        }
    }

    document.addEventListener('DOMContentLoaded', onload);
})();
