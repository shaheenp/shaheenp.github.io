'use strict';

function getStatus() {
    const DAY = 1000 * 60 * 60 * 24;
    const TODAY = new Date(new Date().toDateString());
    const statusScript = document.getElementById('status-data');
    const status = Object.assign({
        previousDaysOffTrail: 0
    }, JSON.parse(statusScript.innerHTML.trim()));

    let trailStart = new Date(status.startDate).getTime();
    let lastOnTrail = new Date(status.offTrailSince || TODAY);

    status.daysOnTrail = Math.ceil((lastOnTrail - trailStart) / DAY) - status.previousDaysOffTrail;

    let lastSeen = new Date(status.lastSeen);
    let lastHiked = lastOnTrail || TODAY - DAY;
    let daysSinceSeen = Math.max(0, (lastHiked - lastSeen) / DAY);

    status.milesSinceLastSeen = Math.floor(daysSinceSeen * status.dailyMileEstimate);

    return status;
}

const PCT_MILES = 2653;
const trailProgress = document.getElementById('trail-progress');
const trailMask = document.getElementById('trail-progress-mask');
const trailCircle = document.getElementById('trail-circle');

function pointAtMile(mile=0) {
    let percentOfTrail = Math.min((mile * 1.04) / PCT_MILES, 1);
    let pathLength = trailProgress.getTotalLength();
    let point = trailProgress.getPointAtLength(pathLength * percentOfTrail);

    return point;
}

function setTrailMask(miles, lastState) {
    lastState = lastState || {miles: 0, points: []};

    const endPoint = pointAtMile(miles);
    let points = lastState.points.slice();
    let lastMiles = lastState.miles;

    for (let mi = lastMiles; mi < miles; mi += 5) {
        const point = pointAtMile(mi);
        points.push(point);
    }

    points.push(endPoint);

    let pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    trailMask.firstElementChild.setAttributeNS(null, 'points', pointsString);
    trailCircle.setAttributeNS(null, 'cx', endPoint.x);
    trailCircle.setAttributeNS(null, 'cy', endPoint.y);

    return {
        points,
        miles
    };
}

const status = getStatus();
const statusElements = {
    miles: document.querySelector('.status-value.miles'),
    days: document.querySelector('.status-value.days'),
    lastUpdate: document.querySelector('.info-last-update')
};

statusElements.days.setAttribute('data-days', status.daysOnTrail.toString());
statusElements.days.setAttribute('title', `${status.daysOnTrail} on trail (start date: ${status.startDate})`);

statusElements.miles.setAttribute('data-miles', (status.miles + status.milesSinceLastSeen).toString());

let milesTitle = `${status.miles} miles hiked since ${status.startDate}`;

if (status.milesSinceLastSeen > 0) {
    statusElements.miles.setAttribute('data-miles-since', status.milesSinceLastSeen.toString());
    milesTitle = `${status.miles} miles + ~${status.milesSinceLastSeen} miles since ${status.lastSeen}`;
}

statusElements.miles.setAttribute('title', milesTitle);

// leave as "Today" if lastSeen is set in the future
if (new Date(status.lastSeen) < new Date(new Date().toDateString())) {
    statusElements.lastUpdate.setAttribute('data-last-update', status.lastSeen);
}

let startMiles = 0;
let endMiles = status.miles + status.milesSinceLastSeen;
let animateMiles = endMiles - startMiles;
let start;
let duration = 2000;

function animate(fromState) {
    if (!start) {
        start = Date.now();
    }

    requestAnimationFrame(() => {
        let now = Date.now();
        let animProgress = Math.min(1, (now - start) / duration);
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
