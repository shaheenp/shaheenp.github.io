(function () {
    'use strict';

    function onload () {
        const sunsetElement = document.querySelector('img#sunset');
        const sunriseElement = document.querySelector('img#sunrise');

        sunsetElement.addEventListener('click', function () {
            document.querySelectorAll('.day').forEach(element => {
                element.className = 'night';
            });
            sunriseElement.style.display = '';
            sunsetElement.style.display = 'none';
        });

        sunriseElement.addEventListener('click', function () {
            document.querySelectorAll('.night').forEach(element => {
                element.className = 'day';
            });
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
        });
    }

    document.addEventListener('DOMContentLoaded', onload);
})();