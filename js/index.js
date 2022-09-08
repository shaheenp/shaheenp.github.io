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

function calcDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function milePosition(mile=0) {
    let percentOfTrail = Math.min(mile / PCT_MILES, 1);
    let pathLength = trailProgress.getTotalLength();
    let rightPercOfPath = (0.511 + (percentOfTrail * 0.491)) % 1;
    let leftPercOfPath = 0.504 - (percentOfTrail * 0.493);
    let rightPoint = trailProgress.getPointAtLength(pathLength * rightPercOfPath);

    let leftPointStart = pathLength * leftPercOfPath;
    let leftPoint = trailProgress.getPointAtLength(leftPointStart);
    let lastDistance = calcDistance(leftPoint, rightPoint);

    for (let d = 0; d < 50; d += 1) {
        let point = trailProgress.getPointAtLength(leftPointStart + d);
        let pointDistance = calcDistance(point, rightPoint);

        if (pointDistance <= lastDistance) {
            leftPoint = point;
            lastDistance = pointDistance;
        } else {
            break;
        }
    }

    for (let d = 0; d > -50; d -= 1) {
        let point = trailProgress.getPointAtLength(leftPointStart + d);
        let pointDistance = calcDistance(point, rightPoint);

        if (pointDistance <= lastDistance) {
            leftPoint = point;
            lastDistance = pointDistance;
        } else {
            break;
        }
    }

    return {
        x1: leftPoint.x,
        y1: leftPoint.y,
        x2: rightPoint.x,
        y2: rightPoint.y,
        x: (leftPoint.x + rightPoint.x) / 2,
        y: (leftPoint.y + rightPoint.y) / 2,
        p1: leftPoint,
        p2: rightPoint
    };
}

function extend(p1, p2, multiplier=1) {
    let xDiff = (p2.x - p1.x) * multiplier;
    let yDiff = (p2.y - p1.y) * multiplier;

    return [
        {x: p1.x - xDiff, y: p1.y - yDiff},
        {x: p2.x + xDiff, y: p2.y + yDiff}
    ];
}

function setTrailMask(miles) {
    const {x, y, x1, y1, x2, y2, p1, p2} = milePosition(miles);
    let [lExt, rExt] = extend(p1, p2, 2);
    let points = [
        [0, 0],
        [2080, 0],
        [2080, y2],
        [rExt.x, rExt.y],
        [x2, y2],
        [x1, y1],
        [lExt.x, lExt.y],
        [0, y1]
    ];
    let pointsString = points.map(p => p.join(',')).join(' ');

    trailMask.firstElementChild.setAttributeNS(null, 'points', pointsString);
    trailCircle.setAttributeNS(null, 'cx', x);
    trailCircle.setAttributeNS(null, 'cy', y);
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
let duration = 1500;

function animate() {
    if (!start) {
        start = Date.now();
    }

    requestAnimationFrame(() => {
        let now = Date.now();
        let animProgress = Math.min(1, (now - start) / duration);
        let miles = startMiles + (animateMiles * animProgress);

        setTrailMask(miles);

        if (animProgress < 1) {
            animate();
        } else {
            setTrailMask(endMiles);
        }
    });
}

setTrailMask(0);
setTimeout(() => {
    animate();
}, 200);
