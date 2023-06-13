/**
  * @file src/assets/LastFM_handler.ts
  * @description LastFM API handler.
  * @author Tom Planche
 */

// IMPORTS ===================================================================================================  IMPORTS
import { LAST_FM_API_KEY } from "./secrets";
import axios from 'axios';
// END IMPORTS ==========================================================================================   END IMPORTS

// VARIABLES ================================================================================================ VARIABLES
// interface(s)
interface I_LastFM_handler {
  baseURL: string;
  endURL: string;

  username: string;

  setUsername: T_setUsername;
  getUsername: T_getUsername;

}

// type(s)
type T_getInstance = (username?: string) => LastFM_handler;
type T_setUsername = (username: string) => void;
type T_getUsername = () => string;

export type T_UserInfo = {
  id: string;
  name: string;
  realname: string;
  url: string;
  image: string;
  country: string;
  age: string;
  gender: string;
  subscriber: string;
  playcount: string;
  playlists: string;
  bootstrap: string;
  registered: {
    unixtime: string;
  }
}

type T_GoodParams = {
  page: number;
  limit: number;
}

type T_fetchData = (
  method: string,
  params: Partial<T_GoodParams>,
) => Promise<T_UserInfo>;

// error class(es)
export class UsernameNotFoundError extends Error {
  constructor(username: string) {
    super(`Username '${username}' not found.`);
  }
}
// END VARIABLES ======================================================================================= END VARIABLES
/**
 * Singleton class to handle LastFM API requests.
 * @class LastFM_handler
 */
class LastFM_handler implements I_LastFM_handler{
  readonly baseURL: string = "http://ws.audioscrobbler.com/2.0/";
  readonly endURL: string = `&api_key=${LAST_FM_API_KEY}&format=json`;

  static instance: LastFM_handler;

  /**
   * @function getInstance
   * @description Returns the instance of the class.
   */
  static getInstance: T_getInstance = (username) => {
    if (!LastFM_handler.instance) {
      LastFM_handler.instance = new LastFM_handler(username);
    }

    return LastFM_handler.instance;
  }

  username: string = "LASTFM_USERNAME";

  constructor(username?: string) {
    if (username) {
      this.username = username;
    }
  }

  setUsername: T_setUsername = (username) => {
    this.username = username;
  }

  getUsername: T_getUsername = () => {
    return this.username;
  }


  fetchData: T_fetchData = async (method, params) => {
    const paramsString = Object.keys(params).map((key) => {
      const
        finalKey = key as keyof T_GoodParams,
        finalValue = params[finalKey] as unknown as string;

      return `${encodeURIComponent(finalKey)}=${encodeURIComponent(finalValue)}`;
    }).join('&');

    console.log(`paramsString: ${paramsString}`)

    const url: string = `${this.baseURL}?method=${method}&user=${this.username}${paramsString ? '?' + paramsString : ''}${this.endURL}`;

    console.log(`fetchData: ${url}`)

    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => {
          resolve(response.data as T_UserInfo);
        })
        // if the error is like {error: 6, message: "User not found"}
        .catch((error) => {
          if (error.response.data.message === "User not found") {
            reject(new UsernameNotFoundError(this.username));
          }

          console.log(error.response.data);

          reject(error);
        })
    });
  }
}

export default LastFM_handler;

/**
 * End of file src/assets/lastFM_handler.js
 */
