'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DAY = 1000 * 60 * 60 * 24;
const TODAY = new Date(new Date().toDateString());

function getStatus() {
    const statusScript = document.getElementById('status-data');
    const status = Object.assign({
        previousDaysOffTrail: 0,
        skippedMiles: []
    }, JSON.parse(statusScript.innerHTML.trim()));

    let trailStart = new Date(status.startDate).getTime();
    let lastOnTrail = new Date(status.offTrailSince || TODAY);

    status.daysOnTrail = Math.ceil((lastOnTrail - trailStart) / DAY) - status.previousDaysOffTrail;

    let lastSeen = new Date(status.lastSeen);
    let lastHiked = lastOnTrail || TODAY - DAY;
    let daysSinceSeen = Math.max(0, (lastHiked - lastSeen) / DAY);

    status.totalSkippedMiles = status.skippedMiles.reduce(function(sum, [start, end]) {
        start = Math.min(start, status.mileMarker);
        end = Math.min(end, status.mileMarker);
        return sum + end - start;
    }, 0);

    status.miles = status.mileMarker - status.totalSkippedMiles;
    status.milesSinceLastSeen = Math.floor(daysSinceSeen * status.dailyMileEstimate);

    return status;
}

function createSVGElement(tagName, attributes = {}) {
    let el = document.createElementNS(SVG_NS, tagName);
    for (let key in attributes) {
        el.setAttributeNS(null, key, attributes[key]);
    }
    return el;
}

const PCT_MILES = 2653;
const trailPath = document.getElementById('trail-path');
const trailProgress = document.getElementById('trail-progress');
const trailMask = document.getElementById('trail-progress-mask');
const trailMaskPath = document.getElementById('trail-mask-path');
const trailMaskEnd = document.getElementById('trail-mask-end');

function pointAtMile(mile=0) {
    let percentOfTrail = Math.min((mile * 1.04) / PCT_MILES, 1);
    let pathLength = trailPath.getTotalLength();
    let point = trailPath.getPointAtLength(pathLength * percentOfTrail);

    return point;
}

function pointsFromMiles(start, end, increment = 4) {
    let points = [];

    for (let mi = start; mi < end; mi += increment) {
        const point = pointAtMile(mi);
        points.push(point);
    }

    points.push(pointAtMile(end));

    return points;
}

function pathFromPoints(points) {
    return points.map(p => `${p.x},${p.y}`).join(' ');
}

function setTrailMask(miles, lastState) {
    lastState = lastState || {miles: 0, points: []};

    let lastMiles = lastState.miles;
    let newPoints = pointsFromMiles(lastMiles, miles);
    let points = lastState.points.concat(newPoints);

    let pointsString = pathFromPoints(points);
    let lastPoint = points[points.length - 1];

    trailMaskPath.setAttributeNS(null, 'points', pointsString);
    trailMaskEnd.setAttributeNS(null, 'cx', lastPoint.x);
    trailMaskEnd.setAttributeNS(null, 'cy', lastPoint.y);

    return {
        points,
        miles
    };
}

function markSkippedMiles(start, end) {
    let points = pointsFromMiles(start, end);
    let path = pathFromPoints(points);
    let polyline = createSVGElement('polyline', {
        points: path,
        fill: 'none',
        stroke: '#dbab94',
        style: 'stroke-width: 7px; stroke-linejoin: round; stroke-linecap: round;'
    });

    let firstPoint = points[0];
    let lastPoint = points[points.length - 1];

    polyline.innerHTML = `<title>Skipped mile ${start} - ${end}</title>`;

    trailProgress.appendChild(polyline);
}

const status = getStatus();
const statusElements = {
    miles: document.querySelector('.status-value.miles'),
    days: document.querySelector('.status-value.days'),
    lastUpdate: document.querySelector('.info-last-update')
};

statusElements.days.setAttribute('data-days', status.daysOnTrail.toString());
statusElements.days.setAttribute('title', `${status.daysOnTrail} on trail (start date: ${status.startDate})`);

statusElements.miles.setAttribute('data-miles', status.miles.toString());

let milesTitle = `${status.miles} miles hiked since ${status.startDate}`;

if (status.milesSinceLastSeen > 0) {
    statusElements.miles.setAttribute('data-miles-estimate', (status.miles + status.milesSinceLastSeen).toString());
    milesTitle = `${status.miles} miles + ~${status.milesSinceLastSeen} miles since ${status.lastSeen}`;
}

statusElements.miles.setAttribute('title', milesTitle);

// leave as "Today" if lastSeen is set in the future
if (new Date(status.lastSeen) < TODAY) {
    statusElements.lastUpdate.setAttribute('data-last-update', status.lastSeen);
}

for (let [start, end] of status.skippedMiles) {
    markSkippedMiles(start, end);
}

const startMiles = 0;
const endMiles = status.mileMarker + status.milesSinceLastSeen;
const animateMiles = endMiles - startMiles;
const duration = Math.floor(animateMiles * 3.5);
let start;

function animate(fromState) {
    if (!start) {
        start = Date.now();
    }

    function ease(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }

    requestAnimationFrame(() => {
        let now = Date.now();
        let timeProgress = Math.min(1, (now - start) / duration);
        let animProgress = ease(timeProgress);
        let miles = startMiles + (animateMiles * animProgress);

        let maskState = setTrailMask(miles, fromState);

        if (animProgress < 1) {
            animate(maskState);
        } else {
            setTrailMask(endMiles, fromState);
        }
    });
}

setTrailMask(0);
setTimeout(() => {
    animate();
}, 300);
