'use strict';

module.exports = {
  // App Secret can be retrieved from the App Dashboard
  APP_SECRET: process.env.MESSENGER_APP_SECRET,

  // Arbitrary value used to validate a webhook
  VALIDATION_TOKEN: process.env.MESSENGER_VALIDATION_TOKEN,

  // Generate a page access token for your page from the App Dashboard
  PAGE_ACCESS_TOKEN: process.env.MESSENGER_PAGE_ACCESS_TOKEN,

  // URL where the app is running (include protocol). Used to point to scripts and
  // assets located at this address.
  SERVER_URL: process.env.NOW_URL || process.env.SERVER_URL,

}
