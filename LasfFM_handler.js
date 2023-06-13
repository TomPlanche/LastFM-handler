"use strict";
/**
  * @file src/assets/LastFM_handler.ts
  * @description LastFM API handler.
  * @author Tom Planche
 */
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS ===================================================================================================  IMPORTS
const secrets_1 = require("./secrets");
// END VARIABLES ======================================================================================= END VARIABLES
/**
 * Singleton class to handle LastFM API requests.
 * @class LastFM_handler
 */
class LastFM_handler {
    constructor() {
        this.baseURL = "http://ws.audioscrobbler.com/2.0/";
        this.endURL = `&api_key=${secrets_1.LAST_FM_API_KEY}&format=json`;
    }
    /**
     * @function getInstance
     * @description Returns the instance of the class.
     */
    static getInstance() {
        if (!LastFM_handler.instance) {
            LastFM_handler.instance = new LastFM_handler();
        }
        return LastFM_handler.instance;
    }
}
exports.default = LastFM_handler;
/**
 * End of file src/assets/lastFM_handler.js
 */
