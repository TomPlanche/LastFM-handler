/**
  * @file src/assets/LastFM_handler.js
  * @description LastFM API handler
  * @author Tom Planche
 */

// IMPORTS ===================================================================================================  IMPORTS
import { LAST_FM_API_KEY } from "./secrets";
// END IMPORTS ==========================================================================================   END IMPORTS

// VARIABLES ================================================================================================ VARIABLES
export const baseURL = "http://ws.audioscrobbler.com/2.0/";
export const endURL = `&api_key=${LAST_FM_API_KEY}&format=json`;

export class NoSongCurrentlyPlaying extends Error {
  constructor() {
    super('No song is currently playing.');
    Object.setPrototypeOf(this, NoSongCurrentlyPlaying.prototype);
  }
}

export class NoUsernameProvided extends Error {
  constructor() {
    super('No username provided.');
    Object.setPrototypeOf(this, NoUsernameProvided.prototype);
  }
}


export interface ITrack {
  "artist": {
    "mbid": string,
    "#text": string
  },
  "streamable": string,
  "image": [
    {
      "size": string,
      "#text": string,
    },
    {
      "size": string,
      "#text": string,
    },
    {
      "size": string,
      "#text": string,
    },
    {
      "size": string,
      "#text": string,
    }
  ],
  "mbid": string,
  "album": {
    "mbid": string,
    "#text": string,
  },
  "name": string,
  "@attr"?: {
    "nowplaying": string,
  },
  "url": string,
}
// END VARIABLES ======================================================================================= END VARIABLES

// DECORATOR ================================================================================================ DECORATOR
/**
 * @function verifyUsername
 * @description This function verifies that the username is not null.
 * Then if the LastFMHandler instance has no username, sets it.
 *
 * @param target {function} The function to decorate.
 * @param propertyKey {string} The property key of the function.
 * @param descriptor {PropertyDescriptor} The descriptor of the function.
 */
function verifyUsername(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    const username = args[0];

    if (username) {
      // @ts-ignore TS2339: Property 'setUsername' does not exist on type 'PropertyDescriptor'.
      this.setUsername(username);
    }

    // @ts-ignore TS2339: Property 'username' does not exist on type 'PropertyDescriptor'.
    if (!this.username) {
      throw new NoUsernameProvided();
    }

    return originalMethod.apply(this, args);
  }

  return descriptor;
}

/**
 * @class LastFM_Handler
 * @description This class is used to handle the LastFM API.
 */
class LastFM_handler {
  static instance: LastFM_handler | null = null;

  username: string | null = null;

  /**
   * @function getInstance
   * @description This function returns the instance of the LastFMHandler class,
   * this allows the singleton pattern.
   *
   * @param {string | null} username The username of the user.
   *
   * @returns {LastFM_handler} The instance of the LastFMHandler class.
   */
  static getInstance = (username: string | null = null) => {
    if (!this.instance) {
      console.log(`Creating new instance of LastFM_handler with${username ? ` username ${username}` : "out username"}.`);
      this.instance = new LastFM_handler(username);
    }
    return this.instance;
  }

  /**
   * @constructor
   * @description This is the constructor of the LastFMHandler class.
   * @param username {string | null} The username of the user.
  */
  constructor(username: string | null = null) {
    this.username = username || null;
  }

  // Getters and setters
  /**
   * @function setUsername
   * @description This function sets the username of the LastFMHandler instance.
   * @param username {string} The username to set.
  */
  setUsername = (username: string) => {
    this.username = username;
  }

  /**
   * @function getUserInfo
   * @description This function gets the user info from the LastFM API.
   * @param username {string} The username to get the info from.
   * @returns {Promise<string>} The user info.
  */
  @verifyUsername
  getUserInfo(username: string | null = null) {
    const url = `${baseURL}?method=user.getinfo&user=${this.username}${endURL}`;

    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            resolve({
              album_count: data.user.album_count,
              artist_count: data.user.artist_count,
              image: data.user.image[2]["#text"],
              name: data.user.name,
              playcount: data.user.playcount,
              // Registered since (unix timestamp) converted to a date
              registered: new Date(data.user.registered['#text'] * 1000),
              url: data.user.url,
            });
          }
        })
        .catch(error => {
          reject({
            error,
            message: "An error occured while fetching the user info.",
          });
        });
    });
  }

  /**
   * @function getUserImage
   * @param username {string} The username to get the image from.
   * @returns {Promise<string | Error>} The user image.
   */
  @verifyUsername
  getUserImage(username: string | null = null): Promise<{ image: string } | Error> {
    const url = `${baseURL}?method=user.getinfo&user=${this.username}${endURL}`;

    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            resolve({
              image: data.user.image[2]["#text"],
            });
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  // Methods
  /**
   * @function getTopArtists
   * @description This function gets the top artists from the LastFM API for the user.
   * @param username {string} The username to get the top artists from.
   * @returns {Promise<string|Error>}
   */
  @verifyUsername
  getTopArtists(username: string | null = null) {
    const url = `${baseURL}?method=user.gettopartists&user=${this.username}${endURL}`;

    // Return a promise
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            resolve(data.topartists.artist);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * @function isCurrentlyPlaying
   * @description This function checks if the user is currently playing a song.
   *
   * @param username {string} The username to check.
   * @returns {Promise<string|Error>} The currently playing song.
   */
  @verifyUsername
  isCurrentlyPlaying(username: string | null = null): Promise<ITrack | Error> {
    const url = `${baseURL}?method=user.getrecenttracks&user=${this.username}${endURL}`;

    // Return a promise
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            if (data.recenttracks.track[0]['@attr']) {
              resolve(data.recenttracks.track[0]);
            } else {
              reject(new NoSongCurrentlyPlaying());
            }
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * @function getRecentTracks
   * @description This function gets the recent tracks from the LastFM API for the user.
   *
   * @param username {string} The username to get the recent tracks from.
   * @param limit {number} The number of tracks to get.
   */
  @verifyUsername
  getRecentTracks(
    username: string | null = null,
    limit: number = 30
  ): Promise<ITrack[] | Error> {
    const url = `${baseURL}?method=user.getrecenttracks&user=${this.username}&limit=${limit}${endURL}`;

    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            resolve(data.recenttracks.track);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * @function getTopTracks
   * @description This function gets the top tracks from the LastFM API for a given country.
   *
   * @param limit {number} The number of tracks to get.
   * @param country {string} The country to get the top tracks from.
   */
  getTopTracks(
    limit: number = 30,
    country: string = "france"
  ): Promise<ITrack[] | Error> {
    const url = `${baseURL}?method=geo.gettoptracks&country=${country}&limit=${limit}${endURL}`;

    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            reject(new Error(data.message));
          } else {
            resolve(data.tracks.track);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

export default LastFM_handler;

/**
 * End of file src/assets/lastFM_handler.js
 */
