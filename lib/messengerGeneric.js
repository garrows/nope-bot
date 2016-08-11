'use strict';
/* global console, require, setTimeout, module */
const crypto = require( 'crypto' ),
    request = require( 'request' ),
    envVars = require( './envVars.js' );

let messengerGeneric = {

    /*
     * Send a text message using the Send API.
     *
     */
     sendTextMessage( recipientId, messageText ) {
         var messageData = {
             recipient: {
                 id: recipientId
             },
             message: {
                 text: messageText,
                 metadata: "DEVELOPER_DEFINED_METADATA"
             }
         };

         this.callSendAPI( messageData );
     },

    /*
     * Turn typing indicator on
     *
     */
    sendTypingOn( recipientId ) {
        console.log( "Turning typing indicator on" );

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        this.callSendAPI( messageData );
    },

    /*
     * Turn typing indicator off
     *
     */
    sendTypingOff( recipientId ) {
        console.log( "Turning typing indicator off" );

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        this.callSendAPI( messageData );
    },


    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    callSendAPI( messageData, cb ) {

        //custom callback
        cb = cb || function () {};

        request( {
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: envVars.PAGE_ACCESS_TOKEN
            },
            method: 'POST',
            json: messageData

        }, function ( error, response, body ) {

            if ( !error && response.statusCode == 200 ) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if ( messageId ) {
                    console.log( "Successfully sent message with id %s to recipient %s",
                        messageId, recipientId );
                    cb();
                } else {
                    console.log( "Successfully called Send API for recipient %s",
                        recipientId );
                    cb();
                }
            } else {
                console.error( '!!!!!!!!!!!!!!!!!' );
                console.error( 'ERROR:', response.body.error.message );
            }
        } );
    },

    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    verifyRequestSignature( req, res, buf ) {
        var signature = req.headers[ "x-hub-signature" ];

        if ( !signature ) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error( "Couldn't validate the signature." );
        } else {
            var elements = signature.split( '=' );
            var method = elements[ 0 ];
            var signatureHash = elements[ 1 ];

            var expectedHash = crypto.createHmac( 'sha1', envVars.APP_SECRET )
                .update( buf )
                .digest( 'hex' );

            if ( signatureHash != expectedHash ) {
                throw new Error( "Couldn't validate the request signature." );
            }
        }
    },
    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    receivedAuthentication( event ) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        var passThroughParam = event.optin.ref;

        console.log( "Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam,
            timeOfAuth );

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage( senderID, "Authentication successful" );
    }


};

module.exports = messengerGeneric;