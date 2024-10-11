$(function () {
    const lastFoughtClass = 'lastChallenged';
    const cooldownClass = 'cooldownTime';

    var $accordion = $('#bossesList');
    var $btnLoadClipboard = $('#btnLoadClipboard');
    var $btnLoadModal = $('#btnLoadModal');
    var $btnClear = $('#btnClear');
    var $weekStart = moment.utc('00:00:00', ['h:m a', 'H:m']).clone().weekday(1);
    var $globalBossesCounter = $('#btnGlobalBosses');

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

    var bossListJsonPromise = $.getJSON('assets/boss-list.json', function (result) {
        bossesList = result;
    });
    promises.push(bossListJsonPromise);

    var bossTemplatePromise = $.get('templates/boss.mustache', function (bossTemplateStr) {
        bossTemplate = bossTemplateStr;
    });
    promises.push(bossTemplatePromise);

    var regionTemplatePromise = $.get('templates/region.mustache', function (regionTemplateStr) {
        regionTemplate = regionTemplateStr;
    });
    promises.push(regionTemplatePromise);

    $.when.apply($, promises).done(function(){
        var regionListHtml = '';
        $.each(bossesList, function(regionIndex, region){
            var bossListHtml = '';
            var tableId = getBossId(region.region, regionIndex);
            regionIdMap[region.region] = tableId;
            regionBossesCountMap[tableId] = region.bossList.length;

            $.each(region.bossList, function(bossIndex, boss){
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
    });

    $btnLoadClipboard.on('click', function(evt){
        evt.preventDefault();

        navigator.clipboard.readText().then((clipText) => {
            processBossList(clipText);
        });
    });

    $btnClear.on('click', function(evt){
        clearBossProgress();
    });

    function processBossList(bossData){
        const headerText = '#Boss               Last fight  Duration';
        const bossColumn = '#Boss';
        const lastFoughtColumn = 'Last fight';
        const cooldownColumn = 'Duration';
        const bossNameStartIndex = headerText.indexOf(bossColumn);
        const lastFoughtStartIndex = headerText.indexOf(lastFoughtColumn);
        const cooldownStartIndex = headerText.indexOf(cooldownColumn);
    
        var basicBossesInfo = [];
    
        if (bossData.indexOf(headerText) == -1){
            window.alert('text information to process is not a valid boss list text:\n\n' + bossData);
    
            return;
        }
    
        const bossListLines = bossData.split('\n');
    
        if (bossListLines.length < 2){
            window.alert('text information to process is an empty boss list text:\n\n' + bossData);
    
            return;
        }
    
        for(const boss of bossListLines){
            if (boss.indexOf(bossColumn) == 0) continue;
    
            basicBossesInfo.push({
                bossName: boss.substring(bossNameStartIndex, lastFoughtStartIndex).trim(),
                lastFought: boss.substring(lastFoughtStartIndex, cooldownStartIndex).trim(),
                cooldown: boss.substring(cooldownStartIndex).trim()
            });
        }
        console.log(basicBossesInfo);
    
        console.log(bossIdMap);

        for(const boss of basicBossesInfo){
            const bossId = bossIdMap[boss.bossName];

            const foughtDate  = moment.utc(boss.lastFought, 'MM/DD/yyyy').add(1, 'seconds');

            if (foughtDate.isAfter($weekStart))
                regionFoughtMap[bossRegionMap[bossId]] += 1;

            if (bossId == null) {
                console.log(`warning: boss ${boss.bossName} couldn't be mapped!`);
            }

            $(`tr#${bossId} td.${lastFoughtClass}`).html(boss.lastFought);
            $(`tr#${bossId} td.${cooldownClass}`).html(boss.cooldown);
        }

        console.log(regionFoughtMap);
        console.log(regionBossesCountMap);

        for(var region of Object.values(regionIdMap)){
            $(`p#${region}_count`).html(`${regionFoughtMap[region]}/${regionBossesCountMap[region]}`);
        }

        updateGlobalBossCounter();
    }

    function getBossId(bossName, bossIndex) {
        return `${bossName.toLowerCase().replace(/\s/g, '').replace('.', '')}${bossIndex}`;
    }
    
    function clearBossProgress(){
        $(`tr.boss-row td.${lastFoughtClass}`).html('-');
        $(`tr.boss-row td.${cooldownClass}`).html('-');

        for(var regionId of Object.values(regionIdMap)){
            regionFoughtMap[regionId] = 0;
            $(`p#${regionId}_count`).html(`0/${regionBossesCountMap[regionId]}`);
        }

        updateGlobalBossCounter();
    }

    function updateGlobalBossCounter(){
        var reduceFn = (initial, accumulator) => initial + accumulator;
        var totalFought = Object.values(regionFoughtMap).reduce(reduceFn);
        var totalCount = Object.values(regionBossesCountMap).reduce(reduceFn);

        $globalBossesCounter.text(`${totalFought}/${totalCount}`);
    }
});

