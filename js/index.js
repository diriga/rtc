$(function() {
    'use strict';

    $('#btnUnirseMobile').click(function(e) {
        location.href = 'mobileconference.html?roomId=' + encodeURI("metrik123");
    });

    $('#btnUnirseWeb').click(function(e) {
        location.href = 'webconference.html?roomId=' + encodeURI("metrik123");
    });
});