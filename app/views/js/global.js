(function ($) {
    'use strict';

    const $actionButton = $('#processInputBtn');
    const $copyBranchName = $('#copyBranchNameToClipboardBtn');
    const $copyPrName = $('#copyPrNameToClipboardBtn');

    const $inputText = $('#taskInput');
    const $branchNameTxt = $('#branchName');
    const $prNameTxt = $('#prName');

    const taskSplitRegExp = /(\D+|\s+)(\d+)(:)(.+)/i;

    $actionButton.click(function (evt) {
        evt.preventDefault();

        if (!$inputText.val()) {
            alert('You must input a valid task/pbi name!!!');

            return;
        }

        var inputText = $inputText.val();
        
        var capturedGroups = inputText.match(taskSplitRegExp);
        const taskType = capturedGroups[1].toLowerCase().trim();
        var taskText = capturedGroups[4].trim();
        console.log(capturedGroups);
        const isPrInput = taskType == 'pull request';
        var taskId = !isPrInput 
            ? capturedGroups[2]
            : taskText.substring(0, taskText.indexOf('|')).trim();

        console.log(`
            Task type: ${taskType}
            Task id: ${taskId}
            Task text: ${taskText}
        `);

        var prText = taskText.trim();
        taskText = taskText
            .substring(taskText.lastIndexOf('|') + 1, taskText.length)
            .trim();

        console.log(`Task id ->${taskId}, task text ->${taskText}`);

        const normalized = taskText.replaceAll(' ', '-')
            .toLowerCase();
        const branchNameResult = `feature/${taskId}-${normalized}`;
        console.log(normalized);
        console.log(branchNameResult);

        
        const prTextResult = !isPrInput 
            ? `${taskId} | ${prText}`
            : prText;

        console.log(`Task id ->${taskId}, pr text ->${prTextResult}`);
        console.log(prTextResult);
        
        $branchNameTxt.val(branchNameResult);
        $prNameTxt.val(prTextResult);
    });

    $copyBranchName.click(function (evt) {
        evt.preventDefault();
        copyToClipboard($branchNameTxt);
    });

    $copyPrName.click(function(evt){
        evt.preventDefault();
        copyToClipboard($prNameTxt);
    });

})(jQuery);

function copyToClipboard($textField) {
    if (!$textField.val()) {
        alert(`There's nothing to copy!!!`);
    }

    navigator.clipboard.writeText($textField.val()).then(function () {
        alert('It worked! Do a CTRL - V to paste');
    }, function () {
        alert('Failure to copy. Check permissions for clipboard');
    });
}