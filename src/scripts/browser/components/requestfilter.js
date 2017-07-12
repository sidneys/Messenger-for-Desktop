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
 * Filters
 * @type {UrlFilter[]}
 * @default
 */
const defaultFilters = [{
  id: 'block_seen',
  description: `Do not update "Last Seen..." status`,
  urls: [
    '*://*.facebook.com/ajax/mercury/change_read_status.php*',
    '*://*.facebook.com/ajax/mercury/delivery_receipts.php*',
    '*://*.facebook.com/ajax/mercury/mark_seen.php*',
    '*://*.facebook.com/ajax/mercury/unread_threads.php*',
    '*://*.facebook.com/ajax/notifications/mark_read.php*',
    '*://*.messenger.com/ajax/mercury/change_read_status.php*',
    '*://*.messenger.com/ajax/mercury/delivery_receipts.php*',
    '*://*.messenger.com/ajax/mercury/mark_seen.php*',
    '*://*.messenger.com/ajax/mercury/unread_threads.php*',
    '*://*.messenger.com/ajax/notifications/mark_read.php*'
  ]
}, {
  id: 'block_typing',
  description: `Do not send "is typing" indicator`,
  urls: [
    '*://*.facebook.com/ajax/messaging/typ.php*',
    '*://*.messenger.com/ajax/messaging/typ.php*'
  ]
}, {
  id: 'block_online',
  description: `Suppress "is online" status`,
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
    '*://*.facebook.com/ajax/bz*',
    '*://*.facebook.com/ajax/chat/*',
    '*://*.facebook.com/chat/*',
    '*://*.facebook.com/ajax/presence/*',
    '*://*.facebook.com/rtc/*',
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
    '*://*.messenger.com/ajax/bz*',
    '*://*.messenger.com/ajax/chat/*',
    '*://*.messenger.com/chat/*',
    '*://*.messenger.com/ajax/presence/*',
    '*://*.messenger.com/rtc/*'
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
let ellipsis = (str, max = 80, text = '...') => {
  return (str.length > max) ? str.substr(0, ((max / (text.length - 1)) + (text.length - 1))) + text + str.substr(str.length - ((max / (text.length - 1)) + (text.length - 1)), str.length) : str;
};

/**
 * Requestfilter
 * @class
 */
class Requestfilter {
  constructor () {
    this.isEnabled = false;
    this.patternList = [];

    if (!this.isEnabled) {
      this.register();
    }
  }

  /**
   * Update active url blocking patterns
   * @private
   */
  updatePatternList () {
    // Reset pattern list
    this.patternList = [];
    log('removed all url filters');

    // Check preferences and compose active patterns
    defaultFilters.forEach((urlfilter, urlfilterIndex, urlfilterArray) => {
      const enabled = prefs.get(`requestfilter:${urlfilter.id}`);
      if (enabled) {
        this.patternList = this.patternList.concat(urlfilter.urls);
        log('enabled filter:', `"${urlfilter.id}"`);
        urlfilter.urls.forEach(pattern => log('added url:', `"${pattern}"`));
      }
    });

    // Optimize 
    this.patternList = [...new Set(this.patternList)];

    log('enabled url filters:', this.patternList.length);
  }

  /**
   * Get available filters
   * @returns {Array}
   * @public
   */
  static list () {
    return defaultFilters;
  }

  /**
   * Registers filters
   * @public
   */
  register () {
    // wait for sessions
    let lookupInterval = setInterval(() => {
      const sessionList = [];

      webContents.getAllWebContents().forEach((contents) => {
        contents.getURL().startsWith('http') ? sessionList.push(contents.session) : void 0;
      });

      if (sessionList.length === 0) { return; } else { clearInterval(lookupInterval); }

      // Update patterns
      this.updatePatternList();

      // enable for each session
      sessionList.forEach((session, sessionIndex, sessionArray) => {
        /** @listens Electron.WebRequest */
        session.webRequest.onBeforeRequest({urls: this.patternList}, (details, callback) => {
          const hasActiveFilterPattern = this.patternList.length > 0;
          hasActiveFilterPattern ? log('[BLOCKED]', ellipsis(details.url)) : void 0;
          callback({cancel: hasActiveFilterPattern});
        });

        // last iteration
        if (sessionArray.length === (sessionIndex + 1)) {
          this.isEnabled = true;
        }

      });
    }, defaultDuration);
  }
}

/**
 * @exports
 */
module.exports = Requestfilter;
