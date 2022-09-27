'use strict';

// constants
const SVG_NS = 'http://www.w3.org/2000/svg';
const DAY = 1000 * 60 * 60 * 24;
const TODAY = new Date(new Date().toDateString());
const PCT_MILES = 2653;
const MS_PER_MILE = 3.5;


// status
function getStatus() {
    const statusScript = document.getElementById('status-data');
    const status = Object.assign({
        "startDate": null,
        "lastSeen": null,
        "mileMarker": 0,
        "dailyMileEstimate": 20,
        "previousDaysOffTrail": 0,
        "offTrailSince": null,
        "skippedMiles": [],
        "checkpoints": []
    }, JSON.parse(statusScript.innerHTML.trim()));

    // make Date's
    status.startDate = new Date(status.startDate);
    status.lastSeen = new Date(status.lastSeen);
    status.offTrailSince = status.offTrailSince && new Date(status.offTrailSince);

    // calc accessible values
    status.daysOnTrail = Math.ceil((TODAY - status.startDate + 1) / DAY);
    status.totalSkippedMiles = status.skippedMiles.reduce(function(sum, [start, end]) {
        start = Math.min(start, status.mileMarker);
        end = Math.min(end, status.mileMarker);
        return sum + end - start;
    }, 0);

    let lastHiked = status.offTrailSince || TODAY - DAY;
    let daysSinceSeen = Math.max(0, (lastHiked - status.lastSeen) / DAY);

    status.milesHiked = status.mileMarker - status.totalSkippedMiles;
    status.milesHikedSinceLastSeen = Math.floor(daysSinceSeen * status.dailyMileEstimate);
    status.mileMarkerEstimate = status.mileMarker + status.milesHikedSinceLastSeen;

    return status;
}


// helpers: svg
function createSVGElement(tagName, attributes = {}) {
    let el = document.createElementNS(SVG_NS, tagName);
    for (let key in attributes) {
        el.setAttributeNS(null, key, attributes[key]);
    }
    return el;
}

function createTrailSectionElement(containerEl, {startMile, endMile, skipped} = section) {
    const progress = createSVGElement('polyline', {
        class: skipped ? 'trail-progress-skipped' : 'trail-progress-hiked',
        points: ''
    });

    if (skipped) {
        progress.innerHTML = `<title>Skipped miles ${startMile} - ${endMile}</title>`;
        containerEl.appendChild(progress);
    } else {

        containerEl.insertBefore(progress, containerEl.firstChild);
    }
    return progress;
}


// helpers: trail path
function getPointIndex(points, mile, roundUp) {
    const MILES_PER_POINT = PCT_MILES / points.length;
    const pointIndex = Math.min(mile / MILES_PER_POINT, points.length - 1);
    return roundUp ? Math.ceil(pointIndex) : Math.floor(pointIndex);
}

function getTrailSectionsUntilMile(miles, points, skippedMiles) {

    const addSection = (startMile, endMile, skipped) => {
        sections.push({
            startIndex: getPointIndex(points, startMile),
            endIndex: getPointIndex(points, endMile, true),
            startMile,
            endMile,
            skipped
        });
    };

    const sections = [];

    addSection(0, miles, false);

    for (let [skipStart, skipEnd] of skippedMiles) {

        if (miles < skipStart) {
            break;
        }

        // add skipped section
        addSection(skipStart, skipEnd, true);
    }

    return sections;
}


// render
function animate(state) {
    if (!state.start) {
        state.start = Date.now();
        state.fromIndex = 0;

        if (state.delay) {
            setTimeout(() => animate(state), state.delay);
            return;
        }
    }

    const progressPerc = Math.min((Date.now() - state.start) / state.duration, 1);
    const progressEased = state.ease(progressPerc);
    let toIndex = Math.floor(progressEased * state.points.length);
    let done = false;

    if (toIndex >= state.points.length) {
        toIndex = state.points.length - 1;
        done = true;
    }

    for (let s = 0; s < state.sections.length; s += 1) {
        const section = state.sections[s];
        section.fromIndex = section.fromIndex || section.startIndex;

        if (section.fromIndex < toIndex && toIndex < section.endIndex) {
            let toIndexForSection = Math.min(section.endIndex, toIndex);
            for (let i = section.fromIndex; i <= toIndexForSection; i += 1) {
                section.el.points.appendItem(state.points[i]);
            }
            section.fromIndex = toIndexForSection;
        }
    }

    state.fromIndex = toIndex;

    if (!done) {
        requestAnimationFrame(() => {
            animate(state);
        });
    }
}

function animateTrailProgress(status, elements) {
    const trailPoints = Array.from(elements.originalPath.points);
    const milesToAnimate = status.mileMarkerEstimate;
    const duration = milesToAnimate * MS_PER_MILE;
    const delay = 300;
    const sections = getTrailSectionsUntilMile(milesToAnimate, trailPoints, status.skippedMiles);
    const lastIndex = getPointIndex(trailPoints, milesToAnimate);
    const points = trailPoints.slice(0, lastIndex);

    sections.forEach(section => {
        section.el = createTrailSectionElement(elements.progressContainer, section);
    });

    animate({
        points,
        sections,
        duration,
        delay,
        ease: x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
    });

    const lastPoint = trailPoints[lastIndex];
    const begin = `${duration + delay}ms`;

    Array.from(elements.beginOnAnimationEnd).forEach(pathEl => {
        Array.from(pathEl.children).forEach(el => {
            const attributeName = el.getAttributeNS(null, 'attributeName');
            if (el.tagName === 'set') {
                if (attributeName === 'cx') {
                    el.setAttribute('to', lastPoint.x);
                } else if (attributeName === 'cy') {
                    el.setAttribute('to', lastPoint.y);
                }
            }
            el.setAttributeNS(null, 'begin', begin);
        });
    });
}

function renderStatus(status, elements) {
    const WEEK = DAY * 7;
    const YESTERDAY = new Date(TODAY - DAY);
    const dateFormat = ('Intl' in window) ? date => {
        const dtOptions = date > TODAY - WEEK ? {weekday: 'long'} : {dateStyle: 'medium'};
        const dt = Intl.DateTimeFormat('en-US', dtOptions);

        return dt.format(date);
    } : d => d.toDateString();

    // days
    elements.daysOnTrail.dataset.value = status.daysOnTrail.toString();
    elements.daysOnTrail.setAttribute('title', `${dateFormat(status.daysOnTrail)} on trail (start date: ${dateFormat(status.startDate)})`);

    // miles
    elements.milesHiked.dataset.value = status.milesHiked.toLocaleString();

    let milesTitle = `${status.milesHiked} miles hiked since ${dateFormat(status.startDate)}`;

    if (status.milesHikedSinceLastSeen > 0) {
        elements.milesHiked.dataset.prefix = '~';
        elements.milesHiked.dataset.value = (status.milesHiked + status.milesHikedSinceLastSeen).toLocaleString();
        milesTitle = `${status.milesHiked} miles + ~${status.milesHikedSinceLastSeen.toLocaleString()} miles since ${dateFormat(status.lastSeen)}`;
    }

    elements.milesHiked.setAttribute('title', milesTitle);

    // checkpoint
    let checkpointName = 'PCT';
    let nextCheckpointName;
    let nextCheckpointMile;

    for (let [mile, name] of status.checkpoints) {
        if (status.mileMarkerEstimate > mile) {
            checkpointName = name;
        } else if (!nextCheckpointName) {
            nextCheckpointName = name;
            nextCheckpointMile = mile;
        }
    }

    elements.checkpoint.dataset.value = checkpointName;

    if (nextCheckpointName) {
        elements.checkpointNote.dataset.value = `${nextCheckpointMile - status.mileMarkerEstimate} mi to ${nextCheckpointName}`;
    }

    // info
    let lastSeenString;

    if (status.lastSeen > YESTERDAY) {
        lastSeenString = 'Today';
    } else if (status.lastSeen >= YESTERDAY) {
        lastSeenString = 'Yesterday';
    } else {
        lastSeenString = dateFormat(status.lastSeen);
    }

    elements.lastUpdate.dataset.lastUpdate = lastSeenString;
    elements.startDate.dataset.startDate = dateFormat(status.startDate);
}


// render
const status = getStatus();

renderStatus(status, {
    milesHiked: document.querySelector('.status-value.miles'),
    daysOnTrail: document.querySelector('.status-value.days'),
    checkpoint: document.querySelector('.status-value.checkpoint'),
    checkpointNote: document.querySelector('.status-value.checkpoint-note'),
    startDate: document.querySelector('.info-start-date'),
    lastUpdate: document.querySelector('.info-last-update')
});
animateTrailProgress(status, {
    originalPath: document.getElementById('trail-path'),
    progressContainer: document.getElementById('trail-progress'),
    beginOnAnimationEnd: document.getElementsByClassName('begin-on-animation-end')
});
