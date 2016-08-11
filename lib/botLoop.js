'use strict';
/* global console, require, setTimeout, module */

const request = require( 'request' ).defaults( {
    json: true,
} );
const messengerGeneric = require( './messengerGeneric.js' );
const async = require( 'async' );

let botLoop = {
    processEvent: function ( pageEntry ) {

        var pageID = pageEntry.id;
        var timeOfEvent = pageEntry.time;

        // Iterate over each messaging event
        pageEntry.messaging.forEach( function ( messagingEvent ) {
            if ( messagingEvent.optin ) {
                messengerGeneric.receivedAuthentication( messagingEvent );
            } else if ( messagingEvent.message ) {
                this.receivedMessage( messagingEvent );
            } else if ( messagingEvent.delivery ) {
                this.receivedDeliveryConfirmation( messagingEvent );
            } else if ( messagingEvent.postback ) {
                this.receivedPostback( messagingEvent );
            } else if ( messagingEvent.read ) {
                this.receivedMessageRead( messagingEvent );
            } else if ( messagingEvent.account_linking ) {
                this.receivedAccountLink( messagingEvent );
            } else {
                console.log( "Webhook received unknown messagingEvent: ", messagingEvent );
            }
        }, this );
    },

    /*
     * Message Event
     *
     * This event is called when a message is sent to your page. The 'message'
     * object format can vary depending on the kind of message that was received.
     * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
     *
     * For this example, we're going to echo any text that we get. If we get some
     * special keywords ('button', 'generic', 'receipt'), then we'll send back
     * examples of those bubbles to illustrate the special message bubbles we've
     * created. If we receive a message with an attachment (image, video, audio),
     * then we'll simply confirm that we've received the attachment.
     *
     */
    receivedMessage( event ) {

        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;

        console.log( "Received message for user %d and page %d at %d with message:",
            senderID, recipientID, timeOfMessage );
        console.log( 'Message', JSON.stringify( message ) );

        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;

        if ( isEcho ) {
            // Just logging message echoes to console
            console.log( "Received echo for message %s and app %d with metadata %s",
                messageId, appId, metadata );
            return;
        }

        if ( messageText ) {
            if ( [ 'hi', 'hello' ].indexOf( messageText.toLowerCase().trim() ) !== -1 ) return messengerGeneric.sendTextMessage( senderID, 'Hi.' );
            messengerGeneric.sendTypingOn( senderID );
            setTimeout( () => {
                messengerGeneric.sendTextMessage( senderID, 'Nope.' );
            }, messageText.length * 10 < 20000 ? messageText.length * 10 : 20000 );
        }
    },


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation( event ) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;

        if ( messageIDs ) {
            messageIDs.forEach( function ( messageID ) {
                console.log( "Received delivery confirmation for message ID: %s",
                    messageID );
            } );
        }

        console.log( "All message before %d were delivered.", watermark );
    },


    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     *
     */
    receivedPostback( event ) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        var payload = event.postback.payload;

        console.log( "Received postback for user %d and page %d with payload '%s' " +
            "at %d", senderID, recipientID, payload, timeOfPostback );

    },

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    receivedMessageRead( event ) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;

        console.log( "Received message read event for watermark %d and sequence " +
            "number %d", watermark, sequenceNumber );
    },

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    receivedAccountLink( event ) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        var status = event.account_linking.status;
        var authCode = event.account_linking.authorization_code;

        console.log( "Received account link event with for user %d with status %s " +
            "and auth code %s ", senderID, status, authCode );
    }

};

module.exports = botLoop;