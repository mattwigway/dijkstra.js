/**
 * Logging setup.
 */

window.log = log4javascript.getLogger();

var app = new log4javascript.BrowserConsoleAppender();
window.log.addAppender(app);

log.info('Logging initialized.')
