$(function() {
    'use strict';

    $('#btnUnirseMobile').click(function(e) {
        location.href = 'mobileconference.html?roomId=' + encodeURI("roomparamedicshaman") + '&chatId=' + encodeURI("chatparamedicshaman");
    });

    $('#btnUnirseWeb').click(function(e) {
        location.href = 'webconference.html?roomId=' + encodeURI("roomparamedicshaman") + '&chatId=' + encodeURI("chatparamedicshaman");
    });
});