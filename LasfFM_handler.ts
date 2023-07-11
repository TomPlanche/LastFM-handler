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
export const METHODS = {
  user: {
    getInfo: "user.getInfo",
    getLovedTracks: "user.getLovedTracks",
    getRecentTracks: "user.getRecentTracks",
    getTopTracks: "user.getTopTracks",
  }
} as const;

// interface(s)
interface I_LastFM_handler {
  baseURL: string;
  endURL: string;

  username: string;
  getUsername: T_getUsername;
  setUsername: T_setUsername;
}

// type(s)
type T_Period = "overall" | "7day" | "1month" | "3month" | "6month" | "12month";

export type T_UserInfoRes = {
  age: string;
  bootstrap: string;
  country: string;
  gender: string;
  id: string;
  image: string;
  name: string;
  playcount: string;
  playlists: string;
  realname: string;
  registered: {
    unixtime: string;
  }
  subscriber: string;
  url: string;
}

export type T_UserLovedTracksParams = {
  limit: number;
  page: number;
  user: string;
}

export type T_UserTopTracksParams = {
  limit: number;
  page: number;
  period: T_Period;
}

export type T_RecentTracksParams = {
  extended: boolean; // Includes extended data in each artist, and whether the user has loved each track
  from: number;
  limit: number;
  page: number;
  to: number;
}

type T_Image = {
  size: string;
  "#text": string;
}

type T_Streamable = {
  fulltrack: string;
  "#text": string;
}

type T_ArtistFull = {
  image: T_Image[];
  mbid: string;
  name: string;
  url: string;
}

type T_ArtistMid = {
  mbid: string;
  name: string;
  url: string;
}

type T_ArtistShort = {
  mbid: string;
  '#text': string;
}

type T_LovedTrack = {
  artist: T_ArtistMid,
  date: {
    uts: string;
    "#text": string;
  },
  image: T_Image[];
  mbid: string;
  name: string;
  streamable: T_Streamable;
  url: string;
}

export type T_UserLovedTracksRes = {
  lovedtracks: {
    track: T_LovedTrack[];
  }
}

export type T_UserTopTracksTrack = {
  artist: T_ArtistMid,
  duration: number;
  image: T_Image[];
  mbid: string;
  name: string;
  playcount: number;
  streamable: {
    fulltrack: boolean;
    "#text": boolean;
  }
  url: string;
  "@attr": {
    rank: number;
  }
}

export type T_RecentTracksTrack = {
  album: {
    mbid: string;
    '#text': string;
  }
  artist: T_ArtistShort;
  image: T_Image[];
  name: string;
  mbid: string;
  streamable: boolean;
  url: string;
  '@attr'?: {
    nowplaying: boolean;
  }
}

type T_RecentTracksTrackExtended = T_RecentTracksTrack & {
  artist: T_ArtistFull;
  loved: boolean;
}

type T_RecentTracksTrackAll = T_RecentTracksTrack | T_RecentTracksTrackExtended;

type T_TrackAttr = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  user: string;
}

type T_UserTopTracksRes = {
  toptracks: {
    track: T_UserTopTracksTrack[];
    "@attr": T_TrackAttr;
  }
}

type T_RecentTracksRes = {
  recenttracks: {
    track: T_RecentTracksTrackAll[];
    "@attr": T_TrackAttr;
  }
}

type T_GoodParams = T_UserTopTracksParams;

type Methods = typeof METHODS;
type Method = Methods["user"][keyof Methods["user"]];

// Methods types
type T_getInstance = (username?: string) => LastFM_handler;
type T_setUsername = (username: string) => void;
type T_getUsername = () => string;

type T_fetchData = (
  method: Method,
  params: Partial<T_GoodParams>,
) => Promise<T_UserInfoRes | T_UserTopTracksRes | T_RecentTracksRes | T_UserLovedTracksRes>;

type T_getUserInfo = () => Promise<T_UserInfoRes>;
type T_getUserLovedTracks = (params?: Partial<T_UserLovedTracksParams>) => Promise<T_UserLovedTracksRes>;
type T_getUserTopTracks = (params?: Partial<T_UserTopTracksParams>) => Promise<T_UserTopTracksRes>;
type T_getRecentTracks = (params?: Partial<T_RecentTracksParams>) => Promise<T_RecentTracksRes>;
type T_isNowPlaying = () => Promise<T_RecentTracksTrackAll>;

// error class(es)
export class UsernameNotFoundError extends Error {
  constructor(username: string) {
    super(`Username '${username}' not found.`);
  }
}
export class NoCurrentlyPlayingTrackError extends Error {
  constructor() {
    super("No currently playing track.");
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

  /**
   * @function fetchData
   * @description Fetches data from the LastFM API.
   *
   * @param method {Method} The method to call.
   * @param params
   */
  private fetchData: T_fetchData = async (method, params) => {
    const paramsString = Object.keys(params).map((key) => {
      const
        finalKey = key as keyof T_GoodParams,
        finalValue = params[finalKey] as unknown as string;

      return `${encodeURIComponent(finalKey)}=${encodeURIComponent(finalValue)}`;
    }).join('&');

    const url: string = `${this.baseURL}?method=${method}&user=${this.username}${paramsString ? '&' + paramsString : ''}${this.endURL}`;

    console.log(`fetchData: ${url}`)

    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => {
          resolve(response.data as T_UserInfoRes);
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

  /**
   * @function getUserInfo
   * @description Gets the user info.
   *
   * @returns {Promise<T_UserInfoRes>}
   */
  getUserInfo: T_getUserInfo = async () => {
    return await this.fetchData(METHODS.user.getInfo, {}) as T_UserInfoRes;
  }

  getUserLovedTracks: T_getUserLovedTracks = async (params) => {
    return await this.fetchData(METHODS.user.getLovedTracks, params ?? {}) as T_UserLovedTracksRes;
  }

  /**
   * @function getUserTopTracks
   * @description Gets the user top tracks.
   *
   * @param params {T_UserTopTracksParams} The params to pass to the API.
   * @returns {Promise<T_UserTopTracksRes>}
   */
  getUserTopTracks: T_getUserTopTracks = async (params) => {
    return await this.fetchData(METHODS.user.getTopTracks, params ?? {}) as T_UserTopTracksRes;
  }

  getRecentTracks: T_getRecentTracks = async (params) => {
    return await this.fetchData(METHODS.user.getRecentTracks, params ?? {}) as T_RecentTracksRes;
  }

  ifNowPlaying: T_isNowPlaying = async () => {
    const track = await this.fetchData(METHODS.user.getRecentTracks, { limit: 1 }) as T_RecentTracksRes;

    if (track.recenttracks.track[0]["@attr"]?.nowplaying) {
      return await track.recenttracks.track[0] as T_RecentTracksTrackAll;
    } else {
      throw NoCurrentlyPlayingTrackError;
    }

  }
}

export default LastFM_handler;

/**
 * End of file src/assets/lastFM_handler.js
 */
