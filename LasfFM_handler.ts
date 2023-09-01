/**
 * @file src/assets/LastFM_handler.ts
 * @description LastFM API handler.
 * @author Tom Planche (@tomPlanche)
 */

// IMPORTS ===================================================================================================  IMPORTS
import {LAST_FM_API_KEY} from "./secrets";
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

// params type(s)
type T_UserTopTracksParams = {
  limit: number;
  page: number;
  period: T_Period;
}

type T_RecentTracksParams = {
  extended: boolean; // Includes extended data in each artist, and whether the user has loved each track
  from: number;
  limit: number;
  page: number;
  to: number;
}

type T_UserLovedTracksParams = {
  limit: number;
  page: number;
}
// track type(s)
type T_Image = {
  size: string;
  "#text": string;
}

type T_ArtistS = {
   mbid: string;
  '#text': string;
}

type T_ArtistM = {
  mbid: string;
  name: string;
  url: string;
}

type T_ArtistL = {
  image: T_Image[];
  mbid: string;
  name: string;
  url: string;
}

type T_StreamableS = {
  fulltrack: boolean | string;
}

type T_StreamableL = {
  fulltrack: boolean | string;
  "#text": boolean | string;
}

type T_Attr = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  user: string;
}

type T_UserTopTracksTrack = {
  artist: T_ArtistM;
  duration: number | string;
  image: T_Image[];
  mbid: string;
  name: string;
  playcount: number | string;
  streamable: T_StreamableL
  url: string;

  "@attr": {
    rank: number | string;
  }
}

type T_RecentTracksTrack = {
  album: {
    mbid: string;
    '#text': string;
  }
  artist: T_ArtistS;
  image: T_Image[];
  mbid: string;
  name: string;
  streamable: T_StreamableS
  url: string;

  '@attr'?: {
    nowplaying: boolean | string;
  }
}

type T_RecentTracksTrackExtended = T_RecentTracksTrack & {
  artist: T_ArtistL;
  loved: boolean;
}

type T_RecentTracksTrackAll = T_RecentTracksTrack | T_RecentTracksTrackExtended;

type T_GoodParams = T_UserTopTracksParams;

type Methods = typeof METHODS;
type Method = Methods["user"][keyof Methods["user"]];

// response type(s)
export type T_UserInfoRes = {
  age: number;
  album_count: number | string;
  artist_count: number | string;
  bootstrap: boolean | string;
  country: string;
  gender: string;
  id: string;
  image: string;
  name: string;
  playcount: number | string;
  playlists: number | string;
  realname: string;
  registered: {
    unixtime: string;
  }
  subscriber: number | string;
  track_count: number | string;
  type: string;
  url: string;
}

type T_RecentTracksRes = {
  recenttracks: {
    track: T_RecentTracksTrackAll[];
    "@attr": T_Attr;
  }
}

type T_UserTopTracksRes = {
  toptracks: {
    track: T_UserTopTracksTrack[];
    "@attr": T_Attr;
  }
}

type T_UserLovedTracksTrack = {
  artist: T_ArtistM;
  date: {
    uts: number
    "#text": Date;
  }
  image: T_Image[];
  mbid: string;
  name: string;
  streamable: T_StreamableL;
  url: string;
}

type T_UserLovedTracksRes = {
  lovedtracks: {
    track: T_UserLovedTracksTrack[];
    "@attr": T_Attr;
  }
}

type T_allResponse =
  T_UserInfoRes
  | T_UserTopTracksRes
  | T_RecentTracksRes
  | T_UserLovedTracksRes;

// Methods types
type T_getInstance = (username?: string) => LastFM_handler;
type T_setUsername = (username: string) => void;
type T_getUsername = () => string;

type T_fetchData = (
  method: Method,
  params: Partial<T_GoodParams>,
) => Promise<T_allResponse>;

type T_getUserInfo = () => Promise<T_UserInfoRes>;
type T_getUserTopTracks = (params?: Partial<T_UserTopTracksParams>) => Promise<T_UserTopTracksRes>;
type T_getRecentTracks = (params?: Partial<T_RecentTracksParams>) => Promise<T_RecentTracksRes>
type T_getUserLovedTracks = (params?: Partial<T_UserLovedTracksParams>) => Promise<T_UserLovedTracksRes>;

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

// FUNCTIONS ================================================================================================ FUNCTIONS
/**
 * @function castResponse
 * @description Casts the response to the correct type. The API returns types in string, so we need to cast them.
 *
 * @param response {T_allResponse} The response to cast.
 * @returns {T_allResponse} The cast response.
 */
const castResponse = <T extends T_allResponse>(response: T): T => {
  // Check which type the response is
  if ("recenttracks" in response) {
    response.recenttracks.track.forEach((track) => {
      track['@attr'] = track['@attr'] || {nowplaying: false};
      // @ts-ignore
      track.streamable = track.streamable === "1";
    })

    return response;
  }

  if ("toptracks" in response) {
    response.toptracks.track.forEach((track) => {
      track.streamable.fulltrack = track.streamable.fulltrack === "1";
      track.streamable["#text"] = track.streamable["#text"] === "1";
      track.duration = Number(track.duration);
      track.playcount = Number(track.playcount);
      track["@attr"].rank = Number(track["@attr"].rank);
    })

    return response;
  }

  if ("lovedtracks" in response) {
    response.lovedtracks.track.forEach((track) => {
      track.streamable.fulltrack = track.streamable.fulltrack === "1";
      track.streamable["#text"] = track.streamable["#text"] === "1";

      track.date.uts = Number(track.date.uts);
      track.date["#text"] = new Date(track.date["#text"]);
    })

    return response;
  }

  response.age = Number(response.age);
  response.album_count = Number(response.album_count);
  response.artist_count = Number(response.artist_count);
  response.bootstrap = response.bootstrap === "1";
  response.playcount = Number(response.playcount);
  response.playlists = Number(response.playlists);
  response.subscriber = Number(response.subscriber);
  response.track_count = Number(response.track_count);

  return response;
}

// END FUNCTIONS ======================================================================================== END FUNCTIONS
/**
 * Singleton class to handle LastFM API requests.
 * @class LastFM_handler
 */
class LastFM_handler implements I_LastFM_handler {
  static instance: LastFM_handler;

  readonly baseURL: string = "http://ws.audioscrobbler.com/2.0/";
  readonly endURL: string = `&api_key=${LAST_FM_API_KEY}&format=json`;

  username = "LASTFM_USERNAME";

  constructor(username?: string) {
    if (username) {
      this.username = username;
    }
  }

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

  setUsername: T_setUsername = (username) => {
    this.username = username;
  }

  getUsername: T_getUsername = () => {
    return this.username;
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

  getUserTopTracks: T_getUserTopTracks = async (params) => {
    return await this.fetchData(METHODS.user.getTopTracks, params ?? {}) as T_UserTopTracksRes;
  }

  getRecentTracks: T_getRecentTracks = async (params) => {
    return await this.fetchData(METHODS.user.getRecentTracks, params ?? {}) as T_RecentTracksRes;
  }

  getUserLovedTracks: T_getUserLovedTracks = async (params) => {
    return await this.fetchData(METHODS.user.getLovedTracks, params ?? {}) as T_UserLovedTracksRes;
  }

  ifNowPlaying: T_isNowPlaying = async () => {
    const track = castResponse(
      await this.fetchData(METHODS.user.getRecentTracks, {limit: 1}) as T_RecentTracksRes
    );

    if (!track.recenttracks.track[0]) throw NoCurrentlyPlayingTrackError

    // The '@attr' property is only present if the track is currently playing.
    if (track.recenttracks.track[0]["@attr"]?.nowplaying) {
      return track.recenttracks.track[0] as T_RecentTracksTrackAll;
    }

    throw NoCurrentlyPlayingTrackError;
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

    const url = `${this.baseURL}?method=${method}&user=${this.username}${paramsString ? '&' + paramsString : ''}${this.endURL}`;

    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => {
          resolve(response.data as T_UserInfoRes);
        })
        // if the error is like {error: 6, message: "User not found"}
        .catch((error) => {
          // Check if error is due to Network problem
          if (error.code === "ERR_NETWORK") {
            reject(new Error("No internet connexion found, switching to auto mode."))
            // Reject does not cancel the thread - not sure
            return
          }

          if (error.response.data.message === "User not found") {
            reject(new UsernameNotFoundError(this.username));
          }

          console.log(`Error not classified: ${error.response.data}`);
          reject(error);
        })
    });
  }
}

export default LastFM_handler;

/**
 * End of file src/assets/lastFM_handler.js
 */
