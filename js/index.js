(function () {
    'use strict';

    function onload () {
        const containerElement = document.querySelector('div#container');
        const sunsetElement = document.querySelector('img#sunset');
        const sunriseElement = document.querySelector('img#sunrise');

        sunsetElement.addEventListener('click', function () {
            containerElement.className = 'night';
            sunriseElement.style.display = '';
            sunsetElement.style.display = 'none';
        });

        sunriseElement.addEventListener('click', function () {
            containerElement.className = 'day';
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
        });
    }

    document.addEventListener('DOMContentLoaded', onload);
})();