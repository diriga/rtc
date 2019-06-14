$(function() {
    'use strict';

    apiRTC.setLogLevel(10);
    var cloudUrl = 'https://cloud.apizee.com';
    var connectedSession = null;
    var connectedConversation = null;
    // var activeConversation = null;
    var localStream = null;


    function joinConference(name) {

        //==============================
        // 1/ CREATE USER AGENT
        //==============================
        var ua = new apiRTC.UserAgent({
            uri: 'apzkey:62178345da65852feb83e1a881e6fd50'
        });

        //==============================
        // 2/ REGISTER
        //==============================
        ua.register({
            cloudUrl: cloudUrl,
        }).then(function(session) {
            // Save session
            connectedSession = session;

            connectedSession
                .on("contactListUpdate", function(updatedContacts) { //display a list of connected users
                    console.log("MAIN - contactListUpdate", updatedContacts);
                    if (connectedConversation !== null) {
                        let contactList = connectedConversation.getContacts();
                        console.info("contactList  connectedConversation.getContacts() :", contactList);
                    }
                });

            //==============================
            // 3/ CREATE CONVERSATION
            //==============================

            //connectedConversation.destroy();
            connectedConversation = connectedSession.getConversation(name);
            var chatId = (new URL(location.href)).searchParams.get('chatId');
            joinConversation(chatId);
            //==========================================================
            // 4/ ADD EVENT LISTENER : WHEN NEW STREAM IS AVAILABLE IN CONVERSATION
            //==========================================================
            connectedConversation.on('streamListChanged', function(streamInfo) {

                console.log("streamListChanged :", streamInfo);

                if (streamInfo.listEventType === 'added') {
                    if (streamInfo.isRemote === true) {

                        connectedConversation.subscribeToMedia(streamInfo.streamId)
                            .then(function(stream) {
                                console.log('subscribeToMedia success');
                            }).catch(function(err) {
                                console.error('subscribeToMedia error', err);
                            });
                    }
                }
            });
            //=====================================================
            // 4 BIS/ ADD EVENT LISTENER : WHEN STREAM WAS REMOVED FROM THE CONVERSATION
            //=====================================================
            connectedConversation.on('streamAdded', function(stream) {
                stream.addInDiv('remote-container', 'remote-media-' + stream.streamId, {}, false);
                document.getElementById('loading').style.display = 'none';
                /*
                                // Subscribed Stream is available for display
                                // Get remote media container
                                var container = document.getElementById('remote-container');
                                // Create media element
                                var mediaElement = document.createElement('video');
                                mediaElement.id = 'remote-media-' + stream.streamId;
                                mediaElement.autoplay = true;
                                mediaElement.muted = false;
                                // Add media element to media container
                                container.appendChild(mediaElement);
                                // Attach stream
                                stream.attachToElement(mediaElement);
                */
            }).on('streamRemoved', function(stream) {
                stream.removeFromDiv('remote-container', 'remote-media-' + stream.streamId);
                //document.getElementById('aviso').style.display = 'block';
                /*
                                document.getElementById('remote-media-' + stream.streamId).remove();
                */
            });

            //==============================
            // 5/ CREATE LOCAL STREAM
            //==============================
            var createStreamOptions = {};
            createStreamOptions.constraints = {
                audio: true,
                video: true
            };

            ua.createStream(createStreamOptions)
                .then(function(stream) {

                    console.log('createStream :', stream);

                    // Save local stream
                    localStream = stream;
                    stream.removeFromDiv('local-container', 'local-media');
                    stream.addInDiv('local-container', 'local-media', {}, true);
                    /*
                                        // Get media container
                                        var container = document.getElementById('local-container');

                                        // Create media element
                                        var mediaElement = document.createElement('video');
                                        mediaElement.id = 'local-media';
                                        mediaElement.autoplay = true;
                                        mediaElement.muted = true;

                                        // Add media element to media container
                                        container.appendChild(mediaElement);

                                        // Attach stream
                                        localStream.attachToElement(mediaElement);
                    */

                    //==============================
                    // 6/ JOIN CONVERSATION
                    //==============================
                    connectedConversation.join()
                        .then(function(response) {
                            //==============================
                            // 7/ PUBLISH OWN STREAM
                            //==============================
                            connectedConversation.publish(localStream, null);

                        }).catch(function(err) {
                            console.error('Conversation join error', err);
                        });

                }).catch(function(err) {
                    console.error('create stream error', err);
                });
        });
    }

    //==============================
    // CREATE CONFERENCE
    //==============================
    $(document).ready(function() {
        console.log("ready!");

        var roomId = (new URL(location.href)).searchParams.get('roomId');
        // Get conference name
        var conferenceName = roomId;
        console.log(conferenceName);
        //document.getElementById('create').style.display = 'none';
        document.getElementById('conference').style.display = 'block';
        document.getElementById('loading').style.display = 'block';
        //document.getElementById('title').innerHTML = 'Sala en espera...';

        // Join conference
        joinConference(conferenceName);

        //CHAT
        if (document.getElementById('divLoadingMobile'))
            document.getElementById('divLoadingMobile').style.display = 'block';
        if (document.getElementById('divLoadingWeb'))
            document.getElementById('divLoadingWeb').style.display = 'block';

        $('#badgeAviso').hide();
        $('#typing-area').attr('disabled', 'disabled');
        $('#send-message').attr('disabled', 'disabled');

        //CHAT

    });

    $('#btnStopConference').click(function(e) {
        open('', '_self').close();
    });

    $('#btnOpenChat').click(function(e) {
        if (document.getElementById('divChatMobile')) {
            document.getElementById('divChatMobile').style.display = 'block';
        }

        if (document.getElementById('divChatWeb')) {
            document.getElementById('divChatWeb').style.display = 'block';
        }
        $('#badgeAviso').hide();


    });


    /// CHAT
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
            $('#message-list').scrollTop($('#message-list').height())

            //Actually send message to active contact
            connectedConversation.sendMessage(message);
        }
    }

    function joinConversation(name) {
        if (name !== '') {
            // activeConversation = connectedSession.getConversation(name);

            //Listen to incoming messages from conversation
            connectedConversation.on('message', function(e) {
                var chat = '<div class="incoming_msg pb-2">' +
                    '<div class="bg-info incoming_msg_img rounded-left text-white" style="7px 7px 7px 5px">C</div>' +
                    '<div class="received_msg">' +
                    '<div class="received_withd_msg">' +
                    '<p>' + e.content + '</p>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                $('#message-list').append('<li>' + chat + '</li>');
                $('#message-list').scrollTop($('#message-list').height());
                // $('#message-list').append('<li><b>' + e.sender.getId() + '</b> : ' + e.content + '</li>');

                if (document.getElementById('divChatMobile')) {
                    if ($('#divChatMobile').css('display') == 'none') {
                        $('#badgeAviso').show();
                    }
                }

                if (document.getElementById('divChatWeb')) {
                    if ($('#divChatWeb').css('display') == 'none') {
                        $('#badgeAviso').show();
                    }
                }



            });
            //Listen for any participants entering or leaving the conversation
            connectedConversation.on('contactJoined', function(contact) {
                    console.log("Contact that has joined :", contact);
                    renderUserList();
                    if (document.getElementById('divLoadingMobile'))
                        document.getElementById('divLoadingMobile').style.display = 'none';
                    if (document.getElementById('divLoadingWeb'))
                        document.getElementById('divLoadingWeb').style.display = 'none';

                    $('#typing-area').removeAttr('disabled');
                    $('#send-message').removeAttr('disabled');

                })
                .on('contactLeft', function(contact) {
                    console.log("Contact that has left :", contact);
                    renderUserList();
                    if (document.getElementById('divLoadingMobile'))
                        document.getElementById('divLoadingMobile').style.display = 'none';
                    if (document.getElementById('divLoadingWeb'))
                        document.getElementById('divLoadingWeb').style.display = 'none';

                });

            // activeConversation.join()
            //     .then(function() {
            //         //Conversation was successfully joined
            //         document.getElementById('active-conversation-name').innerHTML = activeConversation.getName();
            //         showChatBox();
            //         renderUserList();
            //         // if (document.getElementById('divLoading'))
            //         //     document.getElementById('divLoading').style.display = 'none';

            //     })
            //     .catch(function(err) {
            //         //Woops! User agent was not able to join conversation
            //     });
        }
    }

    function renderUserList() {
        var contacts = connectedConversation.getContacts();
        $('#active-users').empty();
        $('#active-users').append('<li><b>Active users</b></li>');
        var keys = Object.keys(contacts);
        for (var i = 0; i < keys.length; i++) {
            $('#active-users').append('<li>' + contacts[keys[i]].getId() + '</li>');
        }
    }

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


    $('#send-message').on('click', function() {
        sendMessageToActiveConversation($('#typing-area').val().toString());
    });

    ///////CHAT




});