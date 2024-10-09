$(function () {
    var $accordion = $('#bossesList');
    var containerId = $accordion.attr('id');
    var bossTemplate = null;
    var regionTemplate = null;
    var promises = [];
    var bossesList = [];

    var bossListJsonPromise = $.getJSON('assets/boss-list.json', function (result) {
        console.log(result);
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
            console.log(region, regionIndex);
            var bossListHtml = '';
            var tableId = getBossId(region.region, regionIndex);

            $.each(region.bossList, function(bossIndex, boss){
                var bossId = getBossId(boss.name, boss.index);
                var bossHtml = Mustache.render(bossTemplate, { ...boss, bossId });
                bossListHtml += bossHtml;
            });
            
            var regionHtml = Mustache.render(regionTemplate, { ...region, regionIndex, containerId, bossesList: bossListHtml, tableId });
            regionListHtml += regionHtml;

            console.log(regionHtml);
        });
        console.log(regionListHtml);
        $accordion.html(regionListHtml);
    });
});

function getBossId(bossName, bossIndex) {
    return `${bossName.toLowerCase().replace(/\s/g, '')}${bossIndex}}`;
}