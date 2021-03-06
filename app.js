/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
    bodyParser = require( 'body-parser' ),
    express = require( 'express' ),
    https = require( 'https' ),
    envVars = require( './lib/envVars.js' ),
    messengerGeneric = require( './lib/messengerGeneric.js' ),
    botLoop = require( './lib/botLoop.js' );

var app = express();
app.set( 'port', process.env.PORT || 3000 );
app.set( 'view engine', 'ejs' );
app.use( bodyParser.json( {
    verify: messengerGeneric.verifyRequestSignature
} ) );
app.use( express.static( 'public' ) );

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get( '/webhook', function ( req, res ) {
    if ( req.query[ 'hub.mode' ] === 'subscribe' &&
        req.query[ 'hub.verify_token' ] === envVars.VALIDATION_TOKEN ) {
        console.log( "Validating webhook" );
        res.status( 200 ).send( req.query[ 'hub.challenge' ] );
    } else {
        console.error( "Failed validation. Make sure the validation tokens match." );
        res.sendStatus( 403 );
    }
} );


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post( '/webhook', function ( req, res ) {
    var data = req.body;

    // Make sure this is a page subscription
    if ( data.object == 'page' ) {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach( function ( pageEntry ) {

            //process the event
            botLoop.processEvent( pageEntry );
        } );

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus( 200 );
    }
} );

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get( '/authorize', function ( req, res ) {
    var accountLinkingToken = req.query[ 'account_linking_token' ];
    var redirectURI = req.query[ 'redirect_uri' ];

    // Authorization Code should be generated per user by the developer. This will
    // be passed to the Account Linking callback.
    var authCode = "1234567890";

    // Redirect users to this URI on successful login
    var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render( 'authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    } );
} );

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen( app.get( 'port' ), function () {
    console.log( 'Node app is running on port', app.get( 'port' ) );
} );

module.exports = app;