"use strict";
/**
 * @overview server
 * Basic Hospital Information Management Application
 *
 * This is the central server of bhima.  It is responsible for setting up the
 * HTTP server, logging infrastructure, and environmental variables.  These are
 * global throughout the application, and are configured here.
 *
 * The application routes are configured in {@link server/config/routes}, while
 * the middleware is configured in {@link server/config/express}.
 *
 * @requires http
 * @requires dotenv
 * @requires express
 * @requires debug
 *
 * @requires config/express
 * @requires config/routes
 *
 * @license GPL-2.0
 * @copyright IMA World Health 2016
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("use-strict");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('app');
const app = express_1.default();
/**
 * @function configureServer
 *
 * @description
 * Set up the HTTP server to listen on the correct
 */
function configureServer() {
    // destruct the environmental variables
    const port = process.env.PORT || '8080';
    const mode = process.env.NODE_ENV || 'production';
    // create the server
    http_1.default.createServer(app)
        .listen(port, () => {
        debug(`configureServer(): Server started in mode ${mode} on port ${port}.`);
    });
}
// run configuration tools
configureServer();
// Configure application middleware stack, inject authentication session
require('./config/express').configure(app);
// Link routes
require('./config/routes').configure(app);
// link error handling
require('./config/express').errorHandling(app);
// ensure the process terminates gracefully when an error occurs.
process.on('uncaughtException', (e) => {
    debug('process.onUncaughException: %o', e);
    process.exit(1);
});
// crash on unhandled promise rejections
process.on('unhandledRejection', (e) => {
    debug('process.onUnhandledRejection: %o', e);
    process.exit(1);
});
process.on('warning', (warning) => {
    debug('process.onWarning: %o', warning);
});
module.exports = app;
