$(function() {
    'use strict';

    var cloudUrl = 'https://cloud.apizee.com';
    var connectedSession = null;
    var activeConversation = null;

    function showChatBox() {
        document.getElementById('chat').style.display = 'block';
        document.getElementById('conversation-selector').style.display = 'none';
    }

    //Wrapper to send a message to everyone in the conversation and display sent message in UI
    function sendMessageToActiveConversation(message) {
        if (message !== '') {
            $('#typing-area').val('');
            $("#typing-area").focus();

            var chat = '<div class="outgoing_msg pb-2">' +

                '<div class="sent_msg">' +
                '<p>' + message + '</p>' +
                '</div>' +
                '</div>';

            $('#message-list').append('<li>' + chat + '</li>');
            $('#divMensajes').scrollTop($('#divMensajes').height())

            //Actually send message to active contact
            activeConversation.sendMessage(message);
        }
    }

    function joinConversation(name) {
        if (name !== '') {
            activeConversation = connectedSession.getConversation(name);

            //Listen to incoming messages from conversation
            activeConversation.on('message', function(e) {
                var chat = '<div class="incoming_msg pb-2">' +
                    '<div class="bg-info incoming_msg_img rounded-left text-white" style="padding: 7px 7px 7px 7px">C</div>' +
                    '<div class="received_msg">' +
                    '<div class="received_withd_msg">' +
                    '<p>' + e.content + '</p>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                $('#message-list').append('<li>' + chat + '</li>');
                $('#divMensajes').scrollTop($('#divMensajes').height())
                    // $('#message-list').append('<li><b>' + e.sender.getId() + '</b> : ' + e.content + '</li>');



            });
            //Listen for any participants entering or leaving the conversation
            activeConversation.on('contactJoined', function(contact) {
                    console.log("Contact that has joined :", contact);
                    renderUserList();
                    if (document.getElementById('divLoadingMobile'))
                        document.getElementById('divLoadingMobile').style.display = 'none';
                    if (document.getElementById('divLoadingWeb'))
                        document.getElementById('divLoadingWeb').style.display = 'none';

                })
                .on('contactLeft', function(contact) {
                    console.log("Contact that has left :", contact);
                    renderUserList();
                    if (document.getElementById('divLoadingMobile'))
                        document.getElementById('divLoadingMobile').style.display = 'none';
                    if (document.getElementById('divLoadingWeb'))
                        document.getElementById('divLoadingWeb').style.display = 'none';

                });

            activeConversation.join()
                .then(function() {
                    //Conversation was successfully joined
                    document.getElementById('active-conversation-name').innerHTML = activeConversation.getName();
                    showChatBox();
                    renderUserList();
                    // if (document.getElementById('divLoading'))
                    //     document.getElementById('divLoading').style.display = 'none';

                })
                .catch(function(err) {
                    //Woops! User agent was not able to join conversation
                });
        }
    }

    function renderUserList() {
        var contacts = activeConversation.getContacts();
        $('#active-users').empty();
        $('#active-users').append('<li><b>Active users</b></li>');
        var keys = Object.keys(contacts);
        for (var i = 0; i < keys.length; i++) {
            $('#active-users').append('<li>' + contacts[keys[i]].getId() + '</li>');
        }
    }

    //==============================
    // CREATE USER AGENT
    //==============================
    var ua = new apiRTC.UserAgent({
        uri: 'apzkey:62178345da65852feb83e1a881e6fd50'
    });

    //==============================
    // REGISTER
    //==============================
    ua.register({
        cloudUrl: cloudUrl
    }).then(function(session) {
        // Save session
        connectedSession = session;

        // Display user number
        // document.getElementById('my-number').innerHTML = connectedSession.getId();
        var chatId = (new URL(location.href)).searchParams.get('chatId');
        joinConversation(chatId);

    }).catch(function(error) {
        // errorsend-message
        console.error('User agent registering failed', error);
    });

    //==============================
    // START CHAT
    //==============================

    $('#start-chat').on('click', function(e) {
        // Join conversation from its name

        joinConversation(document.getElementById('conversation-name').value);
    });
    // $('#conversation-name').keypress(function (e) {
    //     if (e.which == 13) {
    //         // Join conversation from its name
    //         joinConversation(document.getElementById('conversation-name').value);
    //         return false;
    //     }
    // });

    //==============================
    // SEND CHAT MESSAGE TO ACTIVE CONVERSATION
    //==============================

    $(document).ready(function() {
        if (document.getElementById('divLoadingMobile'))
            document.getElementById('divLoadingMobile').style.display = 'block';
        if (document.getElementById('divLoadingWeb'))
            document.getElementById('divLoadingWeb').style.display = 'block';
    });

    $('#send-message').on('click', function() {
        sendMessageToActiveConversation($('#typing-area').val().toString());
    });

    $('#btnCerrarChat').on('click', function() {
        if (document.getElementById('divChatMobile'))
            document.getElementById('divChatMobile').style.display = 'none';
        if (document.getElementById('divChatWeb'))
            document.getElementById('divChatWeb').style.display = 'none';
    });

    $('#typing-area').keypress(function(e) {
        if (e.which == 13) {
            sendMessageToActiveConversation($('#typing-area').val().toString());
            return false;
        }
    });
});