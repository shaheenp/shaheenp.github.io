(function () {
    'use strict';

    class Page {
        constructor() {
            document.addEventListener('DOMContentLoaded', () => this.init());
        }

        init() {
            this.sunsetElement = document.querySelector('img#sunset');
            this.sunriseElement = document.querySelector('img#sunrise');
            this.socialElements = Array.from(document.querySelectorAll('img.social'));

            this.sunsetElement.addEventListener('click', () => this.sunset());
            this.sunriseElement.addEventListener('click', () => this.sunrise());

            if (window.localStorage.getItem('night')) {
                this.sunset();
            }
        }

        sunset() {
            const {sunsetElement, sunriseElement, socialElements} = this;

            document.body.classList.add('night');
            window.localStorage.setItem('night', 'true');
            sunsetElement.style.display = 'none';
            sunriseElement.style.display = '';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? '' : 'none';
            });
        }

        sunrise() {
            const {sunsetElement, sunriseElement, socialElements} = this;

            document.body.classList.remove('night');
            window.localStorage.removeItem('night');
            sunsetElement.style.display = '';
            sunriseElement.style.display = 'none';
            socialElements.forEach(img => {
                img.style.display = img.classList.contains('social-night') ? 'none' : '';
            });
        }
    }

    new Page();
})();
