apiRTC.setLogLevel(10);
var cloudUrl = 'https://cloud.apizee.com';
var connectedSession = null;
var connectedConversation = null;
// var activeConversation = null;
var localStream = null;
var AIDShamanAPIUrl = "https://telmed.paramedicapps.com.ar/apitest/";
//url: "http://paramedicapps.com.ar:9876/Login/GetDoctorViewModelFromConference/" + sConferenceId,
//url: "https://telmed.paramedicapps.com.ar/api/Login/GetDoctorViewModelFromConference/" + sConferenceId,


$(function () {
    'use strict';
    
    function joinConference(name) {

        //==============================
        // 1/ CREATE USER AGENT
        //==============================
        var ua = new apiRTC.UserAgent({
            uri: 'apzkey:d6ca15327d3a29d40d8c7b1c7af9214d'
        });

        //==============================
        // 2/ REGISTER
        //==============================
        ua.register({
            cloudUrl: cloudUrl,
        }).then(function (session) {
            // Save session
            connectedSession = session;

            connectedSession
                .on("contactListUpdate", function (updatedContacts) { //display a list of connected users
                    console.log("MAIN - contactListUpdate", updatedContacts);
                    if (connectedConversation !== null) {
                        let contactList = connectedConversation.getContacts();
                        console.info("contactList  connectedConversation.getContacts() :", contactList);
                    }
                })
                .on('fileTransferInvitation', function (invitation) {

                    console.log("invitation :", invitation);
                    invitation
                        .on('statusChange', (newStatus) => {
                            console.debug('statusChange :', newStatus);

                            if (newStatus === apiRTC.INVITATION_STATUS_ENDED || newStatus === apiRTC.INVITATION_STATUS_CANCELLED) {
                                console.debug('status ended');
                                //Removing progress bar when ended
                                $("#progressbar").hide();                               
                            }
                        });

                    invitation.accept()
                        .then((fileObj) => {

                            console.log("name :", fileObj.name);
                            console.log("type :", fileObj.type);

                            createDownloadLink(fileObj.file, fileObj.name);

                        }).catch(function (error) {
                            console.error('invitation.accept error :', error);
                        });

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
            connectedConversation.on('streamListChanged', function (streamInfo) {

                console.log("streamListChanged :", streamInfo);

                if (streamInfo.listEventType === 'added') {
                    if (streamInfo.isRemote === true) {

                        connectedConversation.subscribeToMedia(streamInfo.streamId)
                            .then(function (stream) {
                                console.log('subscribeToMedia success');
                            }).catch(function (err) {
                                console.error('subscribeToMedia error', err);
                            });
                    }
                }
            });
            //=====================================================
            // 4 BIS/ ADD EVENT LISTENER : WHEN STREAM WAS REMOVED FROM THE CONVERSATION
            //=====================================================
            connectedConversation.on('streamAdded', function (stream) {
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
            }).on('streamRemoved', function (stream) {
                stream.removeFromDiv('remote-container', 'remote-media-' + stream.streamId);
                
                if (document.getElementById('divLoadingMobile')) {
                    var roomId = (new URL(location.href)).searchParams.get('roomId');
                    var esAndroid = (new URL(location.href)).searchParams.get('android');
        
                    localStorage.setItem('roomId', roomId);
        
                    if(connectedConversation){
        
                        connectedConversation.cancelJoin();
                        connectedConversation.stopRecording();
                        connectedConversation.destroy();
                        connectedConversation = null;
                        localStream = null;
                    }
        
                    if(esAndroid){
                        // window.open('location', '_self', '');
                        // window.close();
                        //history.go(-1);
                    }
                    else{
                        $("#containerFinish").show();
                    }
                }
                if (document.getElementById('divLoadingWeb')) {
                    location.href = "videoconferencefinish.html";
                }


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
                .then(function (stream) {

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
                        .then(function (response) {
                            //==============================
                            // 7/ PUBLISH OWN STREAM
                            //==============================
                            connectedConversation.publish(localStream, null);

                        }).catch(function (err) {
                            console.error('Conversation join error', err);
                        });

                }).catch(function (err) {
                    console.error('create stream error', err);
                });
        });
    }

    //==============================
    // CREATE CONFERENCE
    //==============================

    $(document).ready(function () {
        var roomId = (new URL(location.href)).searchParams.get('roomId');
        var salaGif = (new URL(location.href)).searchParams.get('sala');
        var esAndroid = (new URL(location.href)).searchParams.get('android');

        var roomHist = localStorage.getItem('roomId');

        //Si es android podrá salir haciendo atras o el botón de arriba "Volver a la app"
        if(esAndroid){
            $("#btnStopConference").hide();
        }

        if (roomHist == roomId) {
            $("#containerFinish").show();
            return;
        } else {
            switch (salaGif) {
                case 'shaman':
                    $("#loading").attr('src', 'assets/salashaman.gif')
                    break;
                // case '5688923118':
                //     $("#loading").attr('src', 'assets/emerger.gif')
                //     break;
                // case '4678913118':
                //     $("#loading").attr('src', 'assets/salaparamedic.gif')
                //     break;
                default:
                    $("#loading").attr('src', 'assets/' + salaGif + '.gif')
                    break;
            }

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
            var inputs = document.querySelectorAll('.input-file');
 
            Array.prototype.forEach.call( inputs, function( input ) {
            var label = input.nextElementSibling,
                        labelVal = label.innerHTML;
            
            input.addEventListener( 'change', function( e ) {
                var fileName = '';
                
                if ( this.files && this.files.length > 1 ) {
                fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
                } else {
                fileName = e.target.value.split( '\\' ).pop();
                }
            
                if ( fileName ) {
                    sendFile();
                } 
            });
            });

        }

    });

    $('#btnStopConference').click(function (e) {
       
        stopConference();
    });

    $('#btnOpenChat').click(function (e) {
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

    function stopConference(){

        if (document.getElementById('divLoadingMobile')) {
            var roomId = (new URL(location.href)).searchParams.get('roomId');
            var esAndroid = (new URL(location.href)).searchParams.get('android');

            localStorage.setItem('roomId', roomId);

            if(connectedConversation){

                connectedConversation.cancelJoin();
                connectedConversation.stopRecording();
                connectedConversation.destroy();
                connectedConversation = null;
                localStream = null;
            }

            if(esAndroid){
                // window.open('location', '_self', '');
                // window.close();
                //history.go(-1);
            }
            else{
                $("#containerFinish").show();
            }
        }
        if (document.getElementById('divLoadingWeb')) {
            location.href = "videoconferencefinish.html";
        }
    }

    function createDownloadLink(fileUrl, fileName, emitter) {

        var downloadDiv = null,
            text = null;

        downloadDiv = document.createElement("a");

        if (fileUrl instanceof Blob) {
            downloadDiv.href = (window.URL || window.webkitURL).createObjectURL(fileUrl);
        } else {
            downloadDiv.href = fileUrl || "#";
        }
        downloadDiv.innerHTML = ""; //Cleaning downloadDiv
        downloadDiv.download = fileName;
        text = fileName;
        downloadDiv.innerHTML = '<i class="fa fa-file" aria-hidden="true"> &nbsp;' + text + '</i>';
        downloadDiv.style.display = 'block';
        downloadDiv.style.color = emitter ? 'white' : 'black';

        if (emitter) {
            addFileMessageEmitter(downloadDiv.outerHTML);
        }
        else {
            addFileMessage(downloadDiv.outerHTML);
        }
    }

    function sendFile() {

        var contactList = connectedConversation.getContacts();
        var contactId = Object.keys(contactList)[0];
        var contact = connectedSession.getContact(contactId);

        if (contact !== null) {

            var file = $('#contactFileToSend')[0].files[0];

            if (file === undefined) {
                console.error("You need to select a file");
                return;
            }

            console.log("sendFile file.name :", file.name);
            console.log("sendFile file.type :", file.type);

            var fileInfo = {
                name: file.name,
                type: file.type
            };

            var fileTransferInvitation = contact.sendFile(fileInfo, file);

            createDownloadLink(file.file, file.name, true);
        }
    }

    function addFileMessageEmitter(aLink) {

        var chat = '<div class="outgoing_msg pb-2">' +

            '<div class="sent_msg">' +
            '<p>' + aLink + '</p>' +
            '</div>' +
            '</div>';

        $('#message-list').append('<li>' + chat + '</li>');
        $('#message-list').scrollTop($('#message-list').height())

    }

    function addFileMessage(aLink) {

        var chat = '<div class="incoming_msg pb-2">' +
            '<div class="bg-info incoming_msg_img rounded-left text-white" style="padding: 7px 7px 7px 5px">C</div>' +
            '<div class="received_msg">' +
            '<div class="received_withd_msg">' +
            '<p>' + aLink + '</p>' +
            '</div>' +
            '</div>' +
            '</div>';

        $('#message-list').append('<li>' + chat + '</li>');
        $('#message-list').scrollTop($('#message-list').height());

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
    }

    function sendMessageToActiveConversation(message, isFile) {
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
            connectedConversation.on('message', function (e) {
                var chat = '<div class="incoming_msg pb-2">' +
                    '<div class="bg-info incoming_msg_img rounded-left text-white" style="padding: 7px 7px 7px 5px">C</div>' +
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
            connectedConversation.on('contactJoined', function (contact) {
                console.log("Contact that has joined :", contact);
                renderUserList();
                if (document.getElementById('divLoadingMobile')) {
                    document.getElementById('divLoadingMobile').style.display = 'none';
                    getDoctor();
                }

                if (document.getElementById('divLoadingWeb'))
                    document.getElementById('divLoadingWeb').style.display = 'none';

                $('#typing-area').removeAttr('disabled');
                $('#send-message').removeAttr('disabled');

            })
                .on('contactLeft', function (contact) {
                    console.log("Contact that has left :", contact);
                    renderUserList();
                    if (document.getElementById('divLoadingMobile'))
                        document.getElementById('divLoadingMobile').style.display = 'none';
                    if (document.getElementById('divLoadingWeb'))
                        document.getElementById('divLoadingWeb').style.display = 'none';

                });
        }
    }

    function getDoctor() {
        var sConferenceId = (new URL(location.href)).searchParams.get('roomId').split('room')[1];

        $.ajax({
            url: AIDShamanAPIUrl + "Login/GetDoctorViewModelFromConference/" + sConferenceId,
            success: function (respuesta) {
                $("#divNombreDoctor").show();
                $("#spanDoctor").text(" " + respuesta.Name + " (" + respuesta.Enrollment + ") ");
                console.log(respuesta);
            },
            error: function () {
                $("#divNombreDoctor").hide();
                $("#spanDoctor").text(" Sin datos del doctor");
                console.log("No se ha podido obtener la información");
            }
        });
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

    $('#btnCerrarChat').on('click', function () {
        if (document.getElementById('divChatMobile'))
            document.getElementById('divChatMobile').style.display = 'none';
        if (document.getElementById('divChatWeb'))
            document.getElementById('divChatWeb').style.display = 'none';
    });

    $('#typing-area').keypress(function (e) {
        if (e.which == 13) {
            sendMessageToActiveConversation($('#typing-area').val().toString());
            return false;
        }
    });


    $('#send-message').on('click', function () {
        sendMessageToActiveConversation($('#typing-area').val().toString());
    });
});
