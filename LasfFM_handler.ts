/**
 * @file src/assets/LastFM_handler.ts
 * @description LastFM API handler.
 * @author Tom Planche (@tomPlanche)
 */

// IMPORTS ===================================================================================================  IMPORTS
import axios from "axios";
import { LASTFM_APIKEY } from "./secrets";
// END IMPORTS ==========================================================================================   END IMPORTS

// VARIABLES ================================================================================================ VARIABLES
export const LASTFM_ERROR_CODES = {
  // 1 : This error does not exist
  STATUS_INVALID_SERVICE: 2,
  STATUS_INVALID_METHOD: 3,
  STATUS_AUTH_FAILED: 4,
  STATUS_INVALID_FORMAT: 5,
  STATUS_INVALID_PARAMS: 6,
  STATUS_INVALID_RESOURCE: 7,
  STATUS_OPERATION_FAILED: 8,
  STATUS_INVALID_SK: 9,
  STATUS_INVALID_APIKEY: 10,
  STATUS_OFFLINE: 11,
  STATUS_SUBSCRIBERS_ONLY: 12,
  STATUS_INVALID_SIGNATURE: 13,
  STATUS_TOKEN_UNAUTHORIZED: 14,
  STATUS_TOKEN_EXPIRED: 15,
  STATUS_TEMPORARILY_UNAVAILABLE: 16,
  STATUS_LOGIN_REQUIRED: 17,
  STATUS_TRIAL_EXPIRED: 18,
  // # 19 : This error does not exist
  STATUS_NOTENOUGH_CONTENT: 20,
  STATUS_NOTENOUGH_MEMBERS: 21,
  STATUS_NOTENOUGH_FANS: 22,
  STATUS_NOTENOUGH_NEIGHBOURS: 23,
  STATUS_NO_PEAK_RADIO: 24,
  STATUS_RADIO_NOTFOUND: 25,
  STATUS_APIKEY_SUSPENDED: 26,
  STATUS_DEPRECATED: 27,
};

export const METHODS = {
  user: {
    getInfo: "user.getInfo",
    getLovedTracks: "user.getLovedTracks",
    getRecentTracks: "user.getRecentTracks",
    getTopTracks: "user.getTopTracks",
    getPersonalTags: "user.getPersonalTags",
    getFriends: "user.getFriends",
    getTopAlbums: "user.getTopAlbums",
    getTopArtists: "user.getTopArtists",
    getTopTags: "user.getTopTags",
    getWeeklyAlbumChart: "user.getWeeklyAlbumChart",
    getWeeklyArtistChart: "user.getWeeklyArtistChart",
    getWeeklyChartList: "user.getWeeklyChartList",
    getWeeklyTrackChart: "user.getWeeklyTrackChart",
  },
} as const;

// interface(s)
interface ILastFM_handler {
  baseURL: string;
  endURL: string;

  username: string;
  getUsername: TgetUsername;
  setUsername: TsetUsername;
}

// Enum(s)
export enum EPeriod {
  Overall = "overall",
  SevenDay = "7day",
  OneMonth = "1month",
  ThreeMonth = "3month",
  SixMonth = "6month",
  TwelveMonth = "12month",
}

// TYPES ============
// General types
type TImage = {
  size: string;
  "#text": string;
};

type TArtistS = {
  mbid: string;
  "#text": string;
};

type TArtistM = {
  mbid: string;
  name: string;
  url: string;
};

type TArtistL = {
  image: TImage[];
  mbid: string;
  name: string;
  url: string;
};

type TArtistTotal = {
  image: TImage[];
  mbid: string;
  name: string;
  streamable: string;
  url: string;
  playcount: number | string;

  "@attr": {
    rank: number | string;
  };
};

type TStreamableS = {
  fulltrack: boolean | string;
};

type TStreamableL = {
  fulltrack: boolean | string;
  "#text": boolean | string;
};

type TAttr = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  user: string;
};

type TRegistredS = {
  unixtime: number | string;
};

type TRegistredL = {
  unixtime: number | string;
  "#text": Date;
};

type TWeelyXChartAttr = {
  from: number; // UNIX timestamp
  to: number; // UNIX timestamp
  user: string;
};

type TChart = {
  "#text": string;
  from: number; // UNIX timestamp
  to: number; // UNIX timestamp
};

type TTag = {
  name: string;
  count: number | string;
  url: string;
};

type TERROR = {
  code: number;
  message: string;
};

// params type(s)
type TUserTopTracksParams = {
  limit: number;
  page: number;
  period: EPeriod;
};

type TRecentTracksParams = {
  extended: boolean; // Includes extended data in each artist, and whether the user has loved each track
  from: number;
  limit: number;
  page: number;
  to: number;
};

type TUserLovedTracksParams = {
  limit: number;
  page: number;
};

type TUserGetFriendsParams = {
  recenttracks: boolean;
  limit: number;
  page: number;
};

type TUserGetTopAlbumsParams = {
  period: EPeriod;
  limit: number;
  page: number;
};

type TUserGetTopArtistsParams = {
  period: EPeriod;
  limit: number;
  page: number;
};

type TUserWeeklyXChartParams = {
  from: number; // UNIX timestamp
  to: number;
};

type TUserGetTopTagsParams = {
  limit: number;
};

// track type(s)
type TUserTopTracksTrack = {
  artist: TArtistM;
  duration: number | string;
  image: TImage[];
  mbid: string;
  name: string;
  playcount: number | string;
  streamable: TStreamableL;
  url: string;

  "@attr": {
    rank: number | string;
  };
};

type TRecentTracksTrack = {
  album: {
    mbid: string;
    "#text": string;
  };
  artist: TArtistS;
  image: TImage[];
  mbid: string;
  name: string;
  streamable: TStreamableS;
  url: string;

  "@attr"?: {
    nowplaying: boolean | string;
  };
};

type TRecentTracksTrackExtended = TRecentTracksTrack & {
  artist: TArtistL;
  loved: boolean;
};

type TRecentTracksTrackAll = TRecentTracksTrack | TRecentTracksTrackExtended;

type TGoodParams =
  | TUserTopTracksParams
  | TRecentTracksParams
  | TUserLovedTracksParams
  | TUserGetFriendsParams
  | TUserGetTopAlbumsParams
  | TUserGetTopArtistsParams
  | TUserWeeklyXChartParams
  | TUserGetTopTagsParams;

type Methods = typeof METHODS;
type Method = Methods["user"][keyof Methods["user"]];

type TUserTopAlbumsAlbum = {
  artist: TArtistM;
  image: TImage[];
  mbid: string;
  name: string;
  playcount: number | string;
  url: string;

  "@attr": {
    rank: number | string;
  };
};

// response type(s)
export type TUserInfoRes = {
  user: {
    age: number;
    album_count: number | string;
    artisTcount: number | string;
    bootstrap: boolean | string;
    country: string;
    gender: string;
    id: string;
    image: string;
    name: string;
    playcount: number | string;
    playlists: number | string;
    realname: string;
    registered: TRegistredS;
    subscriber: boolean | string;
    track_count: number | string;
    type: string;
    url: string;
  };
};

type TRecentTracksRes = {
  recenttracks: {
    track: TRecentTracksTrackAll[];
    "@attr": TAttr;
  };
};

type TUserTopTracksRes = {
  toptracks: {
    track: TUserTopTracksTrack[];
    "@attr": TAttr;
  };
};

type TUserLovedTracksTrack = {
  artist: TArtistM;
  date: {
    uts: number;
    "#text": Date;
  };
  image: TImage[];
  mbid: string;
  name: string;
  streamable: TStreamableL;
  url: string;
};

type TUserLovedTracksRes = {
  lovedtracks: {
    track: TUserLovedTracksTrack[];
    "@attr": TAttr;
  };
};

type TUserFriendsUser = {
  bootstrap: boolean | string;
  country: string;
  image: TImage;
  name: string;
  playlists: number | string;
  playcount: number | string;
  registered: TRegistredL;
  realname: string;
  subscriber: boolean | string;
  type: string;
  url: string;
};

type TUserFriendsRes = {
  friends: {
    "@attr": TAttr;
    user: TUserFriendsUser[];
  };
};

type TUserTopAlbumsRes = {
  topalbums: {
    album: TUserTopAlbumsAlbum[];
    "@attr": TAttr;
  };
};

type TUserTopArtistsRes = {
  topartists: {
    artist: TArtistTotal[];
    "@attr": TAttr;
  };
};

type TUserWeeklyAlbumChartRes = {
  weeklyalbumchart: {
    album: TUserTopAlbumsAlbum[];
    "@attr": TWeelyXChartAttr;
  };
};

type TUserWeeklyArtistChartRes = {
  weeklyartistchart: {
    artist: TArtistTotal[];
    "@attr": TWeelyXChartAttr;
  };
};

type TUserWeeklyChartRes = {
  weeklychartlist: {
    chart: TChart[];
    "@attr": {
      user: string;
    };
  };
};

type TUserWeeklyTrackChartRes = {
  weeklytrackchart: {
    track: TUserTopAlbumsAlbum[];
    "@attr": TWeelyXChartAttr;
  };
};

type TUserGetTopTagsRes = {
  toptags: {
    tag: TTag[];
    "@attr": {
      user: string;
    };
  };
};

type TErrorRes = {
  error: TERROR;
};

type TallResponse =
  | TUserInfoRes
  | TUserTopTracksRes
  | TRecentTracksRes
  | TUserLovedTracksRes
  | TUserFriendsRes
  | TUserTopAlbumsRes
  | TUserTopArtistsRes
  | TUserWeeklyAlbumChartRes
  | TUserWeeklyArtistChartRes
  | TUserWeeklyChartRes
  | TUserWeeklyTrackChartRes
  | TUserGetTopTagsRes;

// Function types

// Class types
type TgetInstance = (username?: string) => LastFM_handler;
type TsetUsername = (username: string) => void;
type TgetUsername = () => string;

// Methods types
type TfetchData = (
  method: Method,
  params: Partial<TGoodParams>,
) => Promise<TallResponse | TErrorRes>;

// User methods types
type TgetUserInfo = () => Promise<TUserInfoRes>;
type TgetUserTopTracks = (
  params?: Partial<TUserTopTracksParams>,
) => Promise<TUserTopTracksRes>;
type TgetUserRecentTracks = (
  params?: Partial<TRecentTracksParams>,
) => Promise<TRecentTracksRes>;
type TgetUserLovedTracks = (
  params?: Partial<TUserLovedTracksParams>,
) => Promise<TUserLovedTracksRes>;
type TgetUserFriends = (
  params?: Partial<TUserGetFriendsParams>,
) => Promise<TUserFriendsRes>;
type TgetUserTopAlbums = (
  params?: Partial<TUserGetTopAlbumsParams>,
) => Promise<TUserTopAlbumsRes>;
type TgetUserTopArtists = (
  params?: Partial<TUserGetTopArtistsParams>,
) => Promise<TUserTopArtistsRes>;
type TgetUserWeeklyAlbumChart = (
  params?: Partial<TUserWeeklyXChartParams>,
) => Promise<TUserWeeklyAlbumChartRes>;
type TgetUserWeeklyArtistChart = (
  params?: Partial<TUserWeeklyXChartParams>,
) => Promise<TUserWeeklyArtistChartRes>;
type TgetUserWeeklyChartList = () => Promise<TUserWeeklyChartRes>;
type TgetUserWeeklyTrackChart = (
  params?: Partial<TUserWeeklyXChartParams>,
) => Promise<TUserWeeklyTrackChartRes>;
type TgetUserTopTags = (
  params?: Partial<TUserGetTopTagsParams>,
) => Promise<TUserGetTopTagsRes>;

type TisNowPlaying = () => Promise<TRecentTracksTrackAll>;

// other types
type TResponseItem = {
  "@attr": {
    rank: number | string;
  };
  playcount: number | string;
};

type TparseResponseItems = (items: TResponseItem[]) => void;
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
const parseResponseItems: TparseResponseItems = (items) => {
  items.forEach((item) => {
    item["@attr"].rank = Number(item["@attr"].rank);
    item.playcount = Number(item.playcount);
  });
};

const parseResponseAttr = (attr: {
  from: string | number;
  to: string | number;
}) => {
  attr.from = Number(attr.from);
  attr.to = Number(attr.to);
};

/**
 * @function castResponse
 * @description Casts the response to the correct type. The API returns types in string, so we need to cast them.
 *
 * @param response {TallResponse} The response to cast.
 * @returns {TallResponse} The cast response.
 */
const castResponse = <T extends TallResponse | TErrorRes>(response: T): T => {
  if ("error" in response) {
    const errorName = Object.keys(LASTFM_ERROR_CODES).find((key) => {
      const finalKey = key as keyof typeof LASTFM_ERROR_CODES;

      return LASTFM_ERROR_CODES[finalKey] === Number(response.error);
    });

    const finalResponse = response as TErrorRes;

    throw {
      code: finalResponse.error.code,
      message: `${errorName} (${finalResponse.error.code}): ${finalResponse.error.message}`,
    };
  }

  // Check which type the response is
  if ("recenttracks" in response) {
    response.recenttracks.track.forEach((track) => {
      track["@attr"] = track["@attr"] || { nowplaying: false };
      // @ts-ignore
      track.streamable = track.streamable === "1";
    });

    return response;
  }

  if ("toptracks" in response) {
    response.toptracks.track.forEach((track) => {
      track.streamable.fulltrack = track.streamable.fulltrack === "1";
      track.streamable["#text"] = track.streamable["#text"] === "1";
      track.duration = Number(track.duration);
      track.playcount = Number(track.playcount);

      track["@attr"].rank = Number(track["@attr"].rank);
    });

    return response;
  }

  if ("lovedtracks" in response) {
    response.lovedtracks.track.forEach((track) => {
      track.streamable.fulltrack = track.streamable.fulltrack === "1";
      track.streamable["#text"] = track.streamable["#text"] === "1";

      track.date.uts = Number(track.date.uts);
      track.date["#text"] = new Date(track.date["#text"]);
    });

    return response;
  }

  if ("friends" in response) {
    response.friends.user.forEach((user) => {
      user.bootstrap = user.bootstrap === "1";
      user.playlists = Number(user.playlists);
      user.playcount = Number(user.playcount);
      user.registered.unixtime = Number(user.registered.unixtime);
      user.subscriber = user.subscriber === "1";
    });

    return response;
  }

  if ("topalbums" in response) {
    response.topalbums.album.forEach((album) => {
      album["@attr"].rank = Number(album["@attr"].rank);
      album.playcount = Number(album.playcount);
    });

    response.topalbums["@attr"].page = Number(response.topalbums["@attr"].page);

    return response;
  }

  if ("topartists" in response) {
    response.topartists.artist.forEach((artist) => {
      artist["@attr"].rank = Number(artist["@attr"].rank);
      artist.playcount = Number(artist.playcount);
    });

    response.topartists["@attr"].page = Number(
      response.topartists["@attr"].page,
    );

    return response;
  }

  if (
    "weeklyalbumchart" in response ||
    "weeklyartistchart" in response ||
    "weeklytrackchart" in response
  ) {
    if ("weeklyalbumchart" in response) {
      parseResponseItems(response.weeklyalbumchart.album);
      parseResponseAttr(response.weeklyalbumchart["@attr"]);
    } else if ("weeklyartistchart" in response) {
      parseResponseItems(response.weeklyartistchart.artist);
      parseResponseAttr(response.weeklyartistchart["@attr"]);
    } else if ("weeklytrackchart" in response) {
      parseResponseItems(response.weeklytrackchart.track);
      parseResponseAttr(response.weeklytrackchart["@attr"]);
    }

    return response;
  }

  if ("weeklychartlist" in response) {
    response.weeklychartlist.chart.forEach((chart) => {
      chart.from = Number(chart.from);
      chart.to = Number(chart.to);
    });

    return response;
  }

  if ("toptags" in response) {
    response.toptags.tag.forEach((tag) => {
      tag.count = Number(tag.count);
    });

    return response;
  }

  // else its a user info response
  const user = response.user as TUserInfoRes["user"];

  user.age = Number(user.age);
  user.album_count = Number(user.album_count);
  user.artisTcount = Number(user.artisTcount);
  user.bootstrap = user.bootstrap === "1";
  user.playcount = Number(user.playcount);
  user.playlists = Number(user.playlists);
  user.registered.unixtime = Number(user.registered.unixtime);
  user.subscriber = user.subscriber === "1";
  user.track_count = Number(user.track_count);

  response.user = user;

  return response;
};

// END FUNCTIONS ======================================================================================== END FUNCTIONS
/**
 * Singleton class to handle LastFM API requests.
 * @class LastFM_handler
 */
class LastFM_handler implements ILastFM_handler {
  static instance: LastFM_handler;

  readonly baseURL: string = "https://ws.audioscrobbler.com/2.0/";
  readonly endURL: string = `&apIkey=${LASTFM_APIKEY}&format=json`;

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
  static getInstance: TgetInstance = (username) => {
    if (!LastFM_handler.instance) {
      LastFM_handler.instance = new LastFM_handler(username ?? "RJ");
    }

    if (username) {
      LastFM_handler.instance.setUsername(username);
    }

    return LastFM_handler.instance;
  };

  /**
   * @function fetchData
   * @description Fetches data from the LastFM API.
   *
   * @param method {Method} The method to call.
   * @param params {TGoodParams} The params to use.
   *
   * @returns {Promise<TallResponse | TErrorRes>}
   */
  private fetchData: TfetchData = async (
    method: Method,
    params: Partial<TGoodParams>,
  ): Promise<TallResponse | TErrorRes> => {
    const paramsString = Object.keys(params)
      .map((key) => {
        const finalKey = key as keyof TGoodParams,
          finalValue = params[finalKey] as unknown as string;

        return `${encodeURIComponent(finalKey)}=${encodeURIComponent(finalValue)}`;
      })
      .join("&");

    const url = `${this.baseURL}?method=${method}&user=${this.username}${paramsString ? "&" + paramsString : ""}${this.endURL}`;

    return new Promise((resolve, reject) => {
      axios
        .get(url)
        .then((response) => {
          resolve(response.data);
        })
        // if the error is like {error: 6, message: "User not found"}
        .catch((error) => {
          // Check if error is due to Network problem
          if (error.code === "ERR_NETWORK") {
            reject({
              error: 0,
              message: "Network error.",
            });
            // Reject does not cancel the thread - not sure
            return;
          }

          const errorName = Object.keys(LASTFM_ERROR_CODES).find((key) => {
            const finalKey = key as keyof typeof LASTFM_ERROR_CODES;

            return (
              LASTFM_ERROR_CODES[finalKey] === Number(error.response.data.error)
            );
          });

          if (errorName) {
            reject({
              error: error.response.data.error,
              message: `${errorName} (${error.response.data.error}): ${error.response.data.message}`,
            });

            return;
          }

          reject({
            error: -1,
            message: `Unknown error: ${error.response.data.error} - ${error.response.data.message}`,
          });
        });
    });
  };

  /**
   * @function setUsername
   * @description Sets the username.
   *
   * @param username {string} The username to set.
   * @returns {void}
   */
  setUsername: TsetUsername = (username: string): void => {
    this.username = username;
  };

  /**
   * @function getUsername
   * @description Gets the username.
   *
   * @returns {string} The username.
   */
  getUsername: TgetUsername = (): string => {
    return this.username;
  };

  /**
   * @function getUserInfo
   * @description Gets the user info.
   *
   * @returns {Promise<TUserInfoRes>}
   */
  getUserInfo: TgetUserInfo = async (): Promise<TUserInfoRes> => {
    return castResponse(
      (await this.fetchData(METHODS.user.getInfo, {})) as TUserInfoRes,
    );
  };

  /**
   * @function getUserTopTracks
   * @description Gets the user top tracks.
   *
   * @param params {Partial<TUserTopTracksParams>} The params to use.
   * @returns {Promise<TUserTopTracksRes>}
   */
  getUserTopTracks: TgetUserTopTracks = async (
    params?: Partial<TUserTopTracksParams>,
  ): Promise<TUserTopTracksRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getTopTracks,
        params ?? {},
      )) as TUserTopTracksRes,
    );
  };

  /**
   * @function getUserRecentTracks
   * @description Gets the user recent tracks.
   *
   * @param params {Partial<TRecentTracksParams>} The params to use.
   * @returns {Promise<TRecentTracksRes>}
   */
  getUserRecentTracks: TgetUserRecentTracks = async (
    params?: Partial<TRecentTracksParams>,
  ): Promise<TRecentTracksRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getRecentTracks,
        params ?? {},
      )) as TRecentTracksRes,
    );
  };

  /**
   * @function getUserLovedTracks
   * @description Gets the user loved tracks.
   *
   * @param params {Partial<TUserLovedTracksParams>} The params to use.
   * @returns {Promise<TUserLovedTracksRes>}
   */
  getUserLovedTracks: TgetUserLovedTracks = async (
    params?: Partial<TUserLovedTracksParams>,
  ): Promise<TUserLovedTracksRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getLovedTracks,
        params ?? {},
      )) as TUserLovedTracksRes,
    );
  };

  /**
   * @function getUserFriends
   * @description Gets the user friends.
   *
   * @param params {Partial<TUserGetFriendsParams>} The params to use.
   * @returns {Promise<TUserFriendsRes>}
   */
  getUserFriends: TgetUserFriends = async (
    params?: Partial<TUserGetFriendsParams>,
  ): Promise<TUserFriendsRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getFriends,
        params ?? {},
      )) as TUserFriendsRes,
    );
  };

  /**
   * @function getUserTopAlbums
   * @description Gets the user top albums.
   *
   * @param params {Partial<TUserGetTopAlbumsParams>} The params to use.
   * @returns {Promise<TUserTopAlbumsRes>}
   */
  getUserTopAlbums: TgetUserTopAlbums = async (
    params?: Partial<TUserGetTopAlbumsParams>,
  ): Promise<TUserTopAlbumsRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getTopAlbums,
        params ?? {},
      )) as TUserTopAlbumsRes,
    );
  };

  /**
   * @function getUserTopArtists
   * @description Gets the user top artists.
   *
   * @param params {Partial<TUserGetTopArtistsParams>} The params to use.
   * @returns {Promise<TUserTopArtistsRes>}
   */
  getUserTopArtists: TgetUserTopArtists = async (
    params?: Partial<TUserGetTopArtistsParams>,
  ): Promise<TUserTopArtistsRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getTopArtists,
        params ?? {},
      )) as TUserTopArtistsRes,
    );
  };

  /**
   * @function getUserWeeklyAlbumChart
   * @description Gets the user weekly album chart.
   *
   * @param params {Partial<TUserWeeklyXChartParams>} The params to use.
   * @returns {Promise<TUserWeeklyAlbumChartRes>}
   */
  getUserWeeklyAlbumChart: TgetUserWeeklyAlbumChart = async (
    params?: Partial<TUserWeeklyXChartParams>,
  ): Promise<TUserWeeklyAlbumChartRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getWeeklyAlbumChart,
        params ?? {},
      )) as TUserWeeklyAlbumChartRes,
    );
  };

  /**
   * @function getUserWeeklyArtistChart
   * @description Gets the user weekly artist chart.
   *
   * @param params {Partial<TUserWeeklyXChartParams>} The params to use.
   * @returns {Promise<TUserWeeklyArtistChartRes>}
   */
  getUserWeeklyArtistChart: TgetUserWeeklyArtistChart = async (
    params?: Partial<TUserWeeklyXChartParams>,
  ): Promise<TUserWeeklyArtistChartRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getWeeklyArtistChart,
        params ?? {},
      )) as TUserWeeklyArtistChartRes,
    );
  };

  /**
   * @function getUserWeeklyChartList
   * @description Gets the user weekly chart list.
   *
   * @returns {Promise<TUserWeeklyChartRes>}
   */
  getUserWeeklyChartList: TgetUserWeeklyChartList =
    async (): Promise<TUserWeeklyChartRes> => {
      return castResponse(
        (await this.fetchData(
          METHODS.user.getWeeklyChartList,
          {},
        )) as TUserWeeklyChartRes,
      );
    };

  /**
   * @function getUserWeeklyTrackChart
   * @description Gets the user weekly track chart.
   *
   * @param params {Partial<TUserWeeklyXChartParams>} The params to use.
   * @returns {Promise<TUserWeeklyTrackChartRes>}
   */
  getUserWeeklyTrackChart: TgetUserWeeklyTrackChart = async (
    params?: Partial<TUserWeeklyXChartParams>,
  ): Promise<TUserWeeklyTrackChartRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getWeeklyTrackChart,
        params ?? {},
      )) as TUserWeeklyTrackChartRes,
    );
  };

  /**
   * @function getUserTopTags
   * @description Gets the user top tags.
   *
   * @param params {Partial<TUserGetTopTagsParams>} The params to use.
   * @returns {Promise<TUserGetTopTagsRes>}
   */
  getUserTopTags: TgetUserTopTags = async (
    params?: Partial<TUserGetTopTagsParams>,
  ): Promise<TUserGetTopTagsRes> => {
    return castResponse(
      (await this.fetchData(
        METHODS.user.getTopTags,
        params ?? {},
      )) as TUserGetTopTagsRes,
    );
  };

  /**
   * @function ifNowPlaying
   * @description Checks if the user is currently playing a track.
   *
   * @returns {Promise<TRecentTracksTrackAll>}
   */
  ifNowPlaying: TisNowPlaying = async (): Promise<TRecentTracksTrackAll> => {
    const track = castResponse(
      (await this.fetchData(METHODS.user.getRecentTracks, {
        limit: 1,
      })) as TRecentTracksRes,
    );

    if (!track.recenttracks.track[0]) throw NoCurrentlyPlayingTrackError;

    // The '@attr' property is only present if the track is currently playing.
    if (track.recenttracks.track[0]["@attr"]?.nowplaying) {
      return track.recenttracks.track[0] as TRecentTracksTrackAll;
    }

    throw NoCurrentlyPlayingTrackError;
  };
}

export default LastFM_handler;
