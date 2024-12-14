$(function () {
    console.log('current locale used: ', moment.locale());

    const lastFoughtClass = 'lastChallenged';
    const cooldownClass = 'cooldownTime';
    let customized = moment.updateLocale("en", {
        week: {

            // Set the First day of week to Monday
            dow: 1,
        },
    });

    var $accordion = $('#bossesList');
    var $btnLoadClipboard = $('#btnLoadClipboard');
    var $btnLoadModal = $('#btnLoadModal');
    var $btnClear = $('#btnClear');
    var $weekStart = moment.utc('00:00:00', ['h:m a', 'H:m']).clone().weekday(0);
    var $globalBossesCounter = $('#btnGlobalBosses');

    var regionListHtml = '';
    var bossIdMap = {};
    var regionIdMap = {};
    var containerId = $accordion.attr('id');
    var bossTemplate = null;
    var regionTemplate = null;
    var promises = [];
    var bossesList = [];
    var bossRegionMap = {};
    var regionFoughtMap = {};
    var regionBossesCountMap = {};
    var clipText = '';
    var loadedFromLocalStorage = false;
    var timeout = null;

    console.log($weekStart);

    reloadFromLocalStorageIfAvailable();

    if (!loadedFromLocalStorage) {
        console.log('Localstorage data not available...');

        var bossListJsonPromise = $.getJSON('assets/boss-list.json', function (result) {
            bossesList = result;
            localStorage.setItem('bossesList', JSON.stringify(result));
        });
        promises.push(bossListJsonPromise);

        var bossTemplatePromise = $.get('templates/boss.mustache', function (bossTemplateStr) {
            bossTemplate = bossTemplateStr;
            localStorage.setItem('bossTemplate', bossTemplateStr);
        });
        promises.push(bossTemplatePromise);

        var regionTemplatePromise = $.get('templates/region.mustache', function (regionTemplateStr) {
            regionTemplate = regionTemplateStr;
            localStorage.setItem('regionTemplate', regionTemplateStr);
        });
        promises.push(regionTemplatePromise);

        $.when.apply($, promises).done(buildAccordion);
    } else {
        console.log('Loading from localstorage data...');
        buildAccordion();
        clearBossProgress();
        processBossList(null);
    }

    $btnLoadClipboard.on('click', function (evt) {
        evt.preventDefault();

        clearBossProgress();

        navigator.clipboard.readText().then((bossText) => {
            processBossList(bossText);

            clipText = bossText;
            localStorage.setItem('bossProgress', bossText);
        });
    });

    $btnClear.on('click', function (evt) {
        clearBossProgress();
    });

    function processBossList(bossData) {
        var basicBossesInfo = getBasicBossInfo(bossData);

        if (!bossData && !basicBossesInfo) return;

        for (const boss of basicBossesInfo) {
            const bossId = bossIdMap[boss.bossName];

            const foughtDate = moment.utc(boss.lastFought, 'MM/DD/yyyy').add(1, 'seconds');

            if (foughtDate.isAfter($weekStart))
                regionFoughtMap[bossRegionMap[bossId]] += 1;

            if (bossId == null) {
                console.log(`warning: boss ${boss.bossName} couldn't be mapped!`);
            }

            $(`tr#${bossId} td.${lastFoughtClass}`).html(boss.lastFought);
            $(`tr#${bossId} td.${cooldownClass}`).html(boss.cooldown);
        }

        for (var region of Object.values(regionIdMap)) {
            $(`p#${region}_count`).html(`${regionFoughtMap[region]}/${regionBossesCountMap[region]}`);
        }

        updateGlobalBossCounter();

        if (!bossData) {
            timeout = setTimeout(function () {
                clearBossProgress();
                processBossList(null);

            }, 1000);
        }
    }

    function getBossId(bossName, bossIndex) {
        return `${bossName.toLowerCase().replace(/\s/g, '').replace('.', '')}${bossIndex}`;
    }

    function clearBossProgress() {
        $(`tr.boss-row td.${lastFoughtClass}`).html('-');
        $(`tr.boss-row td.${cooldownClass}`).html('-');

        for (var regionId of Object.values(regionIdMap)) {
            regionFoughtMap[regionId] = 0;
            $(`p#${regionId}_count`).html(`0/${regionBossesCountMap[regionId]}`);
        }

        updateGlobalBossCounter();
    }

    function updateGlobalBossCounter() {
        var reduceFn = (initial, accumulator) => initial + accumulator;
        var totalFought = Object.values(regionFoughtMap).reduce(reduceFn);
        var totalCount = Object.values(regionBossesCountMap).reduce(reduceFn);

        $globalBossesCounter.text(`${totalFought}/${totalCount}`);

        $('a[data-bs-toggle=popover]').popover({
            html: true,
            trigger: 'focus',
            content: function () {
                return '<img src="' + $(this).data('bsContent') + '" />';
            }
        });

        var $bossTeamModal = $('#bossTeamModal')
        $bossTeamModal.on('show.bs.modal', function (event) {
            // Button that triggered the modal
            var button = event.relatedTarget
            // Extract info from data-bs-* attributes
            var teamImg = button.getAttribute('data-bs-team')
            // If necessary, you could initiate an AJAX request here
            // and then do the updating in a callback.
            //
            // Update the modal's content.
            var $modalTitle = $('.modal-title', $bossTeamModal);
            var $modalBodyInput = $('.modal-body img', $bossTeamModal);

            $modalTitle.text(`${button.getAttribute('data-bs-name')}'s team (Hard mode)`);
            $modalBodyInput.attr('src', teamImg);
        });
    }

    function buildAccordion() {

        $.each(bossesList, function (regionIndex, region) {
            var bossListHtml = '';
            var tableId = getBossId(region.region, regionIndex);
            regionIdMap[region.region] = tableId;
            regionBossesCountMap[tableId] = region.bossList.length;

            $.each(region.bossList, function (bossIndex, boss) {
                var bossId = getBossId(boss.name, boss.index);
                bossIdMap[boss.name] = bossId;
                bossRegionMap[bossId] = tableId;

                var bossHtml = Mustache.render(bossTemplate, { ...boss, bossId });
                bossListHtml += bossHtml;
            });

            var regionHtml = Mustache.render(regionTemplate, { ...region, regionIndex, containerId, bossesList: bossListHtml, tableId, totalBosses: region.bossList.length });
            regionListHtml += regionHtml;
        });
        $accordion.html(regionListHtml);
        clearBossProgress();
        updateGlobalBossCounter();
    }

    function reloadFromLocalStorageIfAvailable() {
        if (storageAvailable('localStorage')) {
            var _bossesList = localStorage.getItem('bossesList');

            if (_bossesList != null)
                bossesList = JSON.parse(_bossesList);
            else {
                loadedFromLocalStorage = false;

                return;
            }

            var _bossTemplate = localStorage.getItem('bossTemplate');

            if (_bossTemplate != null)
                bossTemplate = _bossTemplate;
            else {
                loadedFromLocalStorage = false;

                return;
            }

            var _regionTemplate = localStorage.getItem('regionTemplate');

            if (_regionTemplate != null)
                regionTemplate = _regionTemplate;
            else {
                loadedFromLocalStorage = false;

                return;
            }

            loadedFromLocalStorage = true;
        }
    }

    function refreshBossInfoCooldown(basicBossesInfo) {
        return basicBossesInfo.map(x => {
            var hasCooldown = x.cooldown.indexOf('Ready') == -1;

            var timeInfo, timeSubstracted, timeFormatted;

            if (hasCooldown) {
                timeInfo = getTimeLeftInfo(x.cooldown);
                timeSubstracted = substractSecond(timeInfo);
                timeFormatted = formatDaysString(timeSubstracted);
            }

            return hasCooldown
                ? Object.assign(x, { cooldown: timeFormatted })
                : x;
        });
    }

    function getBasicBossInfo(bossData) {
        var basicBossesInfo = [];
        var basicUpdatedBossInfo = [];
        var loadedFromCache = false;

        var _basicBossesInfo = localStorage.getItem('basicBossesInfo');

        if (bossData == null && _basicBossesInfo != null) {
            basicBossesInfo = JSON.parse(_basicBossesInfo);
            loadedFromCache = true;

            basicUpdatedBossInfo = refreshBossInfoCooldown(basicBossesInfo);

            localStorage.setItem('basicBossesInfo', JSON.stringify(basicUpdatedBossInfo));

            return basicBossesInfo;
        }

        if (bossData == null && !loadedFromCache) return [];

        const headerText = '#Boss               Last fight  Duration';
        const bossColumn = '#Boss';
        const lastFoughtColumn = 'Last fight';
        const cooldownColumn = 'Duration';
        const bossNameStartIndex = headerText.indexOf(bossColumn);
        const lastFoughtStartIndex = headerText.indexOf(lastFoughtColumn);
        const cooldownStartIndex = headerText.indexOf(cooldownColumn);

        if (bossData.indexOf(headerText) == -1) {
            window.alert('text information to process is not a valid boss list text:\n\n' + bossData);

            return;
        }

        const bossListLines = bossData.split('\n');

        if (bossListLines.length < 2) {
            window.alert('text information to process is an empty boss list text:\n\n' + bossData);

            return;
        }

        for (const boss of bossListLines) {
            if (boss.indexOf(bossColumn) == 0) continue;

            basicBossesInfo.push({
                bossName: boss.substring(bossNameStartIndex, lastFoughtStartIndex).trim(),
                lastFought: boss.substring(lastFoughtStartIndex, cooldownStartIndex).trim(),
                cooldown: boss.substring(cooldownStartIndex).trim()
            });
        }

        basicUpdatedBossInfo = refreshBossInfoCooldown(basicBossesInfo);

        localStorage.setItem('basicBossesInfo', JSON.stringify(basicUpdatedBossInfo));

        return basicBossesInfo;
    }
});

function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        const x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            e.name === "QuotaExceededError" &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        );
    }
}

// To use when I figure out how to get the exact date+time the boss was fought.
function getTimeLeftInfo(timeStr) {
    if (timeStr.toLowerCase().trim() == 'ready') return null;

    var daysLeft = 0;
    var hoursLeft;
    var minutesLeft;
    var secondsLeft;

    var dayHours = timeStr.split(',');

    if (dayHours.length > 1) {
        daysLeft = parseInt(dayHours[0].trim().split(' ')[0].trim());
        hourComponent = dayHours[1].split(':');
        hoursLeft = parseInt(hourComponent[0].trim());
        minutesLeft = parseInt(hourComponent[1].trim());
        secondsLeft = parseInt(hourComponent[2].trim());
    } else {
        try{
        var hourComponent = dayHours[0].trim().split(':');
        hoursLeft = parseInt(hourComponent[0].trim());
        minutesLeft = parseInt(hourComponent[1].trim());
        secondsLeft = parseInt(hourComponent[2].trim());
        }catch(ex){
            console.log(dayHours, hourComponent);

            throw ex;
        }
    }

    var timeLeft = {
        days: daysLeft,
        hours: hoursLeft,
        minutes: minutesLeft,
        seconds: secondsLeft
    };

    return timeLeft;
}

function formatDaysString(daysFull) {
    if (daysFull == null) return 'Ready';

    //Get Days
    const days = daysFull.days;
    const daysFormatted = days ? `${days} days , ` : ''; // if no full days then do not display it at all

    //Get Hours
    const hours = daysFull.hours;
    const hoursFormatted = `${hours < 10 ? '0' : ''}${hours}:`;

    //Get Minutes
    const minutes = daysFull.minutes;
    const minutesFormatted = minutes === 0
        ? '00:'
        : minutes < 10
            ? `0${minutes}:`
            : `${minutes}:`;

    //Get Seconds
    const seconds = daysFull.seconds;
    const secondsFormatted = seconds == 0
        ? '00'
        : (seconds < 10)
            ? `0${seconds}`
            : `${seconds}`;

    return (days === 0 && minutes === 0 && seconds === 0)
        ? 'Ready'
        : [daysFormatted, hoursFormatted, minutesFormatted, secondsFormatted].join('');
}

function substractSecond(daysFull) {
    if (daysFull.days === 0 && daysFull.minutes === 0 && daysFull.seconds === 0) return null;

    var source = moment().startOf('month').set({ hour: 0, minute: 0, second: 0 })
        .add({ days: daysFull.days, hour: daysFull.hours, minute: daysFull.minutes, second: daysFull.seconds });
        
    source = source.subtract(1, 'seconds');

    return {
        days: (daysFull.days > 0) ? source.date() - 1: daysFull.days,
        hours: source.hours(),
        minutes: source.minutes(),
        seconds: source.seconds()
    };
}

function durationAsString(start, end) {
    const duration = moment.duration(moment(end).diff(moment(start)));

    //Get Days
    const days = Math.floor(duration.asDays()); // .asDays returns float but we are interested in full days only
    const daysFormatted = days ? `${days} days ,` : ''; // if no full days then do not display it at all

    //Get Hours
    const hours = duration.hours();
    const hoursFormatted = `${hours}:`;

    //Get Minutes
    const minutes = duration.minutes();
    const minutesFormatted = minutes == 0
        ? '00:'
        : `${minutes}:`;

    //Get Seconds
    const seconds = duration.seconds();
    const secondsFormatted = (seconds < 10)
        ? `0${seconds}`
        : `${seconds}`;

    return ((days ?? 0) == minutes == seconds == 0)
        ? 'Ready'
        : [daysFormatted, hoursFormatted, minutesFormatted, secondsFormatted].join('');
}

(function(){
    console.log('runing unit tests...');
})();