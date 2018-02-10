(function () {
    'use strict';

    const socialLinks = {
        linkedin: 'https://www.linkedin.com/in/shaheenpage',
        github: 'https://www.github.com/shaheenp'
    };

    function linkifySocialImages () {
        const socialNames = Object.getOwnPropertyNames(socialLinks);

        for (const name of socialNames) {
            document.querySelector(`img[data-social="${name}"]`).addEventListener('click', () => {
                window.location.href = socialLinks[name];
            });
        }
    }

    function onload () {
        const sunsetElement = document.querySelector('img#sunset');
        const sunriseElement = document.querySelector('img#sunrise');
        const socialElements = Array.from(document.querySelectorAll('img.social'));

        linkifySocialImages();

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
