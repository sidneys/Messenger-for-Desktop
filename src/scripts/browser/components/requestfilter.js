import {webContents} from 'electron';
import prefs from 'common/utils/prefs';

/**
 * @default
 * @constant
 */
const defaultDuration = 2000;

/**
 * @typedef {Object} UrlFilter
 * @property {String} id - Unique Filter Identifier
 * @property {String} description - Description
 * @property {Array} urls - Chrome match pattern list
 */

/**
 * Url Filters
 * @type {UrlFilter[]}
 * @default
 */
const defaultUrlFilterList = [{
  id: 'block_seen',
  description: `Don't update "Last Seen..." status`,
  urls: [
    '*://*.facebook.com/*change_read_status*',
    '*://*.messenger.com/*change_read_status*',
    '*://*.facebook.com/*delivery_receipts*',
    '*://*.messenger.com/*delivery_receipts*',
    '*://*.facebook.com/*mark_seen*',
    '*://*.messenger.com/*mark_seen*',
    '*://*.facebook.com/*unread_threads*',
    '*://*.messenger.com/*unread_threads*'
  ]
}, {
  id: 'block_typing',
  description: `Don't send "Typing" indicator`,
  urls: [
    '*://*.facebook.com/*typ.php*',
    '*://*.messenger.com/*typ.php*'
  ]
}, {
  id: 'block_online',
  description: `Suppress "Is Online" status`,
  urls: [
    '*://edge-chat.facebook.com/*',
    '*://0-edge-chat.facebook.com/*',
    '*://1-edge-chat.facebook.com/*',
    '*://2-edge-chat.facebook.com/*',
    '*://3-edge-chat.facebook.com/*',
    '*://4-edge-chat.facebook.com/*',
    '*://5-edge-chat.facebook.com/*',
    '*://6-edge-chat.facebook.com/*',
    '*://7-edge-chat.facebook.com/*',
    '*://8-edge-chat.facebook.com/*',
    '*://9-edge-chat.facebook.com/*',
    '*://www.facebook.com/ajax/bz*',
    '*://www.facebook.com/ajax/chat/*',
    '*://www.facebook.com/chat/*',
    '*://www.facebook.com/ajax/presence/*',
    '*://edge-chat.messenger.com/*',
    '*://0-edge-chat.messenger.com/*',
    '*://1-edge-chat.messenger.com/*',
    '*://2-edge-chat.messenger.com/*',
    '*://3-edge-chat.messenger.com/*',
    '*://4-edge-chat.messenger.com/*',
    '*://5-edge-chat.messenger.com/*',
    '*://6-edge-chat.messenger.com/*',
    '*://7-edge-chat.messenger.com/*',
    '*://8-edge-chat.messenger.com/*',
    '*://9-edge-chat.messenger.com/*',
    '*://www.messenger.com/ajax/bz*',
    '*://www.messenger.com/ajax/chat/*',
    '*://www.messenger.com/chat/*',
    '*://www.messenger.com/ajax/presence/*'
  ]
}];

/**
 * Trim URL to ellipsis
 * @param {String} str - String
 * @param {Number=} max - Maximum length
 * @param {String=} text - Ellipsis text
 * @returns {String} Trimmed
 * @private
 */
let ellipsis = (str, max = 60, text = '...') => {
  return (str.length > max) ? str.substr(0, ((max / (text.length - 1)) + (text.length - 1))) + text + str.substr(str.length - ((max / (text.length - 1)) + (text.length - 1)), str.length) : str;
};

/**
 * Requestfilter
 * @class
 */
class Requestfilter {
  constructor () {
    this.registered = false;
    this.urlfilterList = defaultUrlFilterList;

    if (!this.registered) {
      this.register();
    }
  }

  /**
   * @public
   *
   * Get Enable/disable filter
   * @param {String} id - Identifier
   * @returns {Boolean}
   */
  static isEnabled (id) {
    return prefs.get(`requestfilter:${id}`);
  }

  /**
   * @public
   *
   * @returns {Array}
   */
  static list () {
    return defaultUrlFilterList;
  }

  /**
   * @private
   * Registers filters
   */
  register () {
    log('register');

    // wait for sessions
    let lookupInterval = setInterval(() => {
      // const sessionList = webContents.getAllWebContents().filter(webcontents => webcontents.session);
      const sessionList = webContents.getAllWebContents().map(webcontents => webcontents.session);
      if (sessionList.length === 0) { return; } else { clearInterval(lookupInterval); }
      // loop sessions
      sessionList.forEach((session, sessionIndex, sessionArray) => {
        // loop url filters
        this.urlfilterList.forEach((urlfilter, urlfilterIndex, urlfilterArray) => {
          /**
           * @listens Electron.WebRequest
           */
          session.webRequest.onBeforeRequest({urls: urlfilter.urls}, (details, callback) => {
            const block = Requestfilter.isEnabled(urlfilter.id);
            block ? log('[BLOCKED]', ellipsis(details.url)) : void 0;
            callback({cancel: block});
          });

          // last iteration
          if (sessionArray.length === (sessionIndex + 1)) {
            if ((urlfilterArray.length === (urlfilterIndex + 1))) {
              this.registered = true;
              log('register', 'this.registered', this.registered);
            }
          }
        });
      });
    }, defaultDuration);
  }

  /**
   * @public
   *
   * Enable/disable filter
   * @param {Boolean} enableFilter - On/off
   * @param {String=} id - Identifier
   */
  enable (enableFilter, id) {
    log('enable', 'enable:', enableFilter, 'id:', id);

    // Get list of filter ids (default: all)
    prefs.set(`requestfilter:${id}`, Boolean(enableFilter));
  }
}

/**
 * @exports
 */
module.exports = Requestfilter;
