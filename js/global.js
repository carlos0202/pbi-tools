(function ($) {
    'use strict';

    const $actionButton = $('#processInputBtn');
    const $copyBranchName = $('#copyBranchNameToClipboardBtn');
    const $copyPrName = $('#copyPrNameToClipboardBtn');
    const $clearButton = $('#clearBtn');

    const $inputText = $('#taskInput');
    const $branchNameTxt = $('#branchName');
    const $prNameTxt = $('#prName');

    const taskSplitRegExp = /(\D+|\s+)(\d+)(:)(.+)/i;
    const unwantedChars = ["{", "}", "[", "]", "(", ")", ".", "@", "!", "^", "*", "&", "+", "=", "#", "%", "/", "\\", "'", "_"];
    const finalCleanupRegExp = /(-)+/g;
    const charSeparator = "-";
    const branchNameLength = 80;

    $actionButton.click(function (evt) {
        evt.preventDefault();

        if (!$inputText.val()) {
            alert('You must input a valid task/pbi name!!!');

            return;
        }

        var inputText = $inputText.val();
        
        var capturedGroups = inputText.match(taskSplitRegExp);
        var taskType = capturedGroups[1].toLowerCase().trim();
        var taskText = capturedGroups[4].trim();
        console.log(capturedGroups);
        var isPrInput = taskType == 'pull request';
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

        var normalized = taskText.replaceAll(' ', charSeparator)
            .toLowerCase();

        unwantedChars.forEach(charToRemove => {
            normalized = normalized.replaceAll(charToRemove, charSeparator);
        });
        var branchNameResult = `feature/${taskId}-${normalized}`;
        console.log(normalized);
        console.log(branchNameResult);

        branchNameResult = branchNameResult.replace(finalCleanupRegExp, charSeparator);
        console.log(branchNameResult);
        
        var prTextResult = !isPrInput 
            ? `${taskId} | ${prText}`
            : prText;
        prTextResult = prTextResult.replace(finalCleanupRegExp, charSeparator);

        console.log(`Task id ->${taskId}, pr text ->${prTextResult}`);
        console.log(prTextResult);
        
        $branchNameTxt.val(branchNameResult.slice(0, branchNameLength));
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

    $clearButton.click(function(evt){
        evt.preventDefault();

        clearTextFields();
    });

    function clearTextFields(){
        $inputText.val('');
        $branchNameTxt.val('');
        $prNameTxt.val('');
    }
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