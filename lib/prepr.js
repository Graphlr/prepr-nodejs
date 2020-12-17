/**
 * Prepr API methods
 *
 * @module prepr
 */

var http = require('https');
var querystring = require('querystring');
var pkg = require('../package.json');
var extend = Object.assign ? Object.assign : require('util')._extend;

/**
 * module.exports sets configuration
 * and returns an object with methods
 *
 * @param {String} accessToken
 * @param {Integer} timeout
 * @param {Array} features
 * @return {Object}
 */
module.exports = function (accessToken, timeout) {
    var config = {
        accessToken: accessToken,
        timeout: timeout || 5000
    };

    /**
     * httpRequest does the API call and process the response.
     * requestParams.hostname is optional and defaults back to
     * 'api.eu1.prepr.io'.
     *
     * @param {String} requestParams.path
     * @param {Object} requestParams.params
     * @param {Function} callback
     * @param {String} requestParams.hostname
     * @param {Object} requestParams.headers
     * @return {Void}
     */
    function httpRequest(requestParams, callback) {
        var options = {};
        var complete = false;
        var body = null;
        var request;

        if (typeof requestParams === 'function') {
            callback = requestParams;
            requestParams = null;
        }

        /**
         * doCallback prevents multiple callback
         * calls emitted by node's http module
         *
         * @param {Error} err
         * @param {Mixed} res
         * @return {Void}
         */
        function doCallback(err, res) {
            if (!complete) {
                complete = true;
                callback(err, res || null);
            }
        }

        // build request
        options = {
            hostname: requestParams.hostname || 'api.eu1.prepr.io',
            path: requestParams.path,
            method: requestParams.method,
            headers: {
                'Authorization': 'Bearer ' + config.accessToken,
                'User-Agent': 'Prepr/' + pkg.version + '-pkg/' + process.versions.node
            }
        };

        if (options.method === 'POST' || options.method === 'PUT') {
            body = JSON.stringify(requestParams.params);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
        } else {
            options.path += requestParams.params ? '?' + querystring.stringify(requestParams.params) : '';
        }

        // you can override any headers you like
        options.headers = extend(options.headers || {}, requestParams.headers || {})

        request = http.request(options);

        // set timeout
        request.on('socket', function (socket) {
            socket.setTimeout(parseInt(config.timeout, 10));
            socket.on('timeout', function () {
                request.abort();
            });
        });

        // process client error
        request.on('error', function (e) {
            var error = new Error('request failed: ' + e.message);

            if (error.message === 'ECONNRESET') {
                error = new Error('request timeout');
            }

            error.error = e;
            doCallback(error);
        });

        // process response
        request.on('response', function (response) {
            var data = [];
            var size = 0;
            var error = null;

            response.on('data', function (ch) {
                data.push(ch);
                size += ch.length;
            });

            response.on('close', function () {
                doCallback(new Error('request closed'));
            });

            response.on('end', function () {
                data = Buffer.concat(data, size)
                    .toString()
                    .trim();

                if (response.statusCode === 204) {
                    doCallback(null, true);
                    return;
                }

                try {
                    var contentDisposition = response.headers['content-disposition'];

                    // check if response data is downloadable so it can't be parsed to JSON
                    if (contentDisposition && contentDisposition.includes('attachment')) {
                        doCallback(error, data);
                        return;
                    }

                    data = JSON.parse(data);
                    if (data.errors) {
                        var clientErrors = data.errors.map(function (e) {
                            return e.description + ' (code: ' + e.code + (e.parameter ? ', parameter: ' + e.parameter : '') + ')';
                        });
                        error = new Error('api error(s): ' + clientErrors.join(', '));
                        error.statusCode = response.statusCode;
                        error.errors = data.errors;
                        data = null;
                    }
                } catch (e) {
                    error = new Error('response failed');
                    error.statusCode = response.statusCode;
                    error.error = e;
                    data = null;
                }

                doCallback(error, data);
            });
        });

        // do request
        request.end(body);
    }

    // METHODS
    return {
        get: function (path, params, callback, hostname = '', headers = {}) {
            httpRequest({ hostname: hostname, path: path, params: params, method: 'GET', headers: headers }, callback);
        },
        post: function (path, params, callback, hostname = '', headers = {}) {
            httpRequest({ hostname: hostname, path: path, params: params, method: 'POST', headers: headers }, callback);
        },
        put: function (path, params, callback, hostname = '', headers = {}) {
            httpRequest({ hostname: hostname, path: path, params: params, method: 'PUT', headers: headers }, callback);
        }
    };
};
