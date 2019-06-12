$(function() {
    'use strict';

    $('#btnUnirse').click(function(e) {
        location.href = 'conference.html?roomId=' + encodeURI("metrik123");
    });
});