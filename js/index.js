(function () {
    'use strict';

    class Page {
        constructor() {
            document.addEventListener('DOMContentLoaded', () => this.init());

            this.prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        init() {
            const {prefersDarkMode} = this;

            this.sunsetElement = document.querySelector('img#sunset');
            this.sunriseElement = document.querySelector('img#sunrise');

            this.sunsetElement.addEventListener('click', () => this.sunset());
            this.sunriseElement.addEventListener('click', () => this.sunrise());

            if (window.localStorage.getItem('darkMode') === 'true' ||
                (prefersDarkMode && window.localStorage.getItem('darkMode') !== 'false')) {
                this.sunset();
            }
        }

        sunset() {
            const {sunsetElement, sunriseElement} = this;

            document.body.classList.add('night');
            window.localStorage.setItem('darkMode', 'true');
            sunsetElement.style.display = 'none';
            sunriseElement.style.display = '';
        }

        sunrise() {
            const {sunsetElement, sunriseElement} = this;

            document.body.classList.remove('night');
            window.localStorage.setItem('darkMode', 'false');
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
        }
    }

    new Page();
})();
