/**
 * This `middleware` is primarily used to validate the query parameters of the request
 * and to give nicely parsed and formatted data from the LastFM API.
 *
 * ## Features:
 * Get ALL the:
 * - [x] Loved tracks
 * - [x] Recent tracks
 * - [x] Top tracks
 *
 * When no limit is passed, the middleware will fetch all the tracks.
 * Since the LastFM API has a limit of 1000 tracks per request, the middleware will make multiple requests to fetch all the tracks.
 *
 * If the passed limit is greater than 1000, the middleware will parrallelize the requests to fetch the tracks faster.
 * It'll parrallelize the requests in chunks of 5000 tracks since I tried with 10_000 tracks and it worked,
 * so I'm going with 5000 tracks to be safe.
 *
 * ## TODO:
 * - [ ] Add methods:
 *   - [ ] Get (not all) loved tracks
 *   - [ ] Get (not all) recent tracks
 *   - [ ] Get (not all) top tracks
 *
 */

import axios from "axios";
import { z } from "zod";
import {
	type TGetAllOptions,
	type TGetAllRecentTracksOptions,
	type TGetAllTopTracksOptions,
	type TGetRecentTracksResponse,
	type TGetTopTracksResponse,
	type TGetTrackInfoNoUserResponse,
	type TGetTrackInfoRequest,
	type TLovedTrack,
	type TMethods,
	type TRecentTrack,
	type TTopTrack,
	getAllOptionsSchema,
	getAllRecentTracksOptionsSchema,
	getAllTopTracksOptionsSchema,
	getRecentTracksSchema,
	getTopTracksSchema,
	getTrackInfoNoUserResponse,
	getTrackInfoRequest,
	getUserLovedTracksSchema,
} from "./types";

const API_MAX_LIMIT = 1_000;
const CHUNK_SIZE = 5_000;

/**
 * Singleton class that handles the LastFM API

 * @class LastFMHandler
 */
class LastFMHandler {
	static instance: LastFMHandler;

	readonly username: string;

	private readonly baseOptions: TGetAllOptions = {
		limit: 1000,
		page: 1,
	};

	/**
	 * In order to make the class a singleton, the constructor is private
	 *
	 * @param username {string} - The username of the LastFM account
	 *
	 * @private
	 */
	private constructor(username: string) {
		this.username = username;
	}

	/**
   * Get the instance of the LastFMHandler class
   *
   * @param {string} username - The username of the LastFM account

   * @returns {LastFMHandler} The instance of the LastFMHandler class
   */
	static getInstance(username: string): LastFMHandler {
		if (!LastFMHandler.instance) {
			LastFMHandler.instance = new LastFMHandler(username);
		}

		return LastFMHandler.instance;
	}

	/**
	 * Get the loved tracks of the user
	 *
	 * @param {number} limit - The limit of tracks to fetch
	 *
	 * @returns {Promise<TLovedTrack[]} The loved tracks of the user
	 */
	async getUserLovedTracks(limit?: number): Promise<TLovedTrack[]> {
		const finalLimit = limit
			? limit <= (this.baseOptions.limit ?? 1000)
				? limit
				: this.baseOptions.limit
			: this.baseOptions.limit;

		const response = getUserLovedTracksSchema.parse(
			await this.fetch("user.getLovedTracks", {
				...this.baseOptions,
				limit: limit ?? this.baseOptions.limit,
			}),
		);

		const totalPages = response.lovedtracks["@attr"].totalPages;
		const currentPage = response.lovedtracks["@attr"].page;

		while (
			currentPage < totalPages &&
			(limit ? response.lovedtracks.track.length < limit : true)
		) {
			const nextPage = getUserLovedTracksSchema.parse(
				await this.fetch("user.getLovedTracks", {
					...this.baseOptions,
					limit: finalLimit,
					page: currentPage + 1,
				}),
			);

			response.lovedtracks.track.push(...nextPage.lovedtracks.track);
		}

		return response.lovedtracks.track;
	}

	/**
	 * Get the recent tracks of the user
	 *
	 * @param {TGetAllRecentTracksOptions} params - The parameters to pass to the LastFM API
	 * @param {boolean} debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TRecentTrack[]} The recent tracks of the user
	 */
	async getAllUserRecentTracks(
		params?: TGetAllRecentTracksOptions,
		debug = true,
	): Promise<TRecentTrack[]> {
		debug && console.log("`getAllUserRecentTracks` - params: ", params);

		const options = getAllOptionsSchema.parse({
			...this.baseOptions,
			limit: Number.MAX_SAFE_INTEGER,
			...params,
		});

		debug && console.log("`getAllUserRecentTracks` - options: ", options);

		return this.fetchAllTracks<TRecentTrack>(
			"user.getRecentTracks",
			options,
			debug,
		);
	}

	/**
	 * Get all the top tracks of the user
	 *
	 * @param {TGetAllTopTracksOptions} params - The parameters to pass to the LastFM API
	 * @param {boolean} debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TTopTrack[]} The top tracks of the user
	 */
	async getAllUserTopTracks(
		params: TGetAllTopTracksOptions,
		debug = false,
	): Promise<TTopTrack[]> {
		debug &&
			console.log(
				"[LASTFM_HANDLER] - `getAllUserTopTracks` - params: ",
				params,
			);

		const options = getAllOptionsSchema.parse({
			...this.baseOptions,
			limit: Number.MAX_SAFE_INTEGER,
			...params,
		});

		debug &&
			console.log(
				"[LASTFM_HANDLER] - `getAllUserTopTracks` - options: ",
				options,
			);

		return this.fetchAllTracks<TTopTrack>("user.getTopTracks", options, debug);
	}

	/**
	 * Get track info
	 *
	 * @param {TGetTrackInfoRequest} params - The parameters to pass to the LastFM API
	 * @param {boolean} debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TGetTrackInfoNoUserResponse} The track info
	 */
	async getTrackInfo(
		params: TGetTrackInfoRequest,
		debug = false,
	): Promise<TGetTrackInfoNoUserResponse> {
		debug &&
			console.log("[LASTFM_HANDLER] - `getTrackInfo` - params: ", params);

		const options = getTrackInfoRequest.parse(params);

		debug &&
			console.log("[LASTFM_HANDLER] - `getTrackInfo` - options: ", options);

		const response = await this.fetch("track.getInfo", options);

		debug &&
			console.log("[LASTFM_HANDLER] - `getTrackInfo` - response: ", response);

		return getTrackInfoNoUserResponse.parse(response);
	}

	/**
	 * Get the currently playing track of the user
	 *
	 * @returns {Promise<TRecentTrack | false} The currently playing track of the user
	 */
	async getCurrentlyPlayingTrack(): Promise<TRecentTrack | false> {
		const response = await this.fetch("user.getRecentTracks", {
			...this.baseOptions,
			limit: 1,
		});

		const {
			recenttracks: { track },
		} = getRecentTracksSchema.parse(response);

		return track[0]["@attr"]?.nowplaying ? track[0] : false;
	}

	/**
	 * Fetches the passed method with the passed parameters from the LastFM API.
	 *
	 * @param {string} method - The method to fetch from the LastFM API
	 * @param {Record<string, string>} params - The parameters to pass to the LastFM API
	 */
	private async fetch(method: TMethods, params: TGetAllOptions, debug = false) {
		debug && console.log("`fetch` - method, params: ", method, params);

		const parsedParams = getAllOptionsSchema.parse(params);

		debug && console.log("`fetch` - parsedParams: ", parsedParams);

		const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
			params: {
				api_key: process.env.LASTFM_API_KEY,
				method,
				user: this.username,
				format: "json",
				...parsedParams,
			},
		});

		return response.data;
	}

	/**
	 * Get the good passed limit and the final limit
	 *
	 * @param {number} limit - The limit passed by the user
	 *
	 * @returns {object} result - The result object
	 * @returns {number} result.goodPassedLimit - The good passed limit
	 * @returns {number} result.finalLimit - The final limit
	 */
	private getGoodPassedLimit(limit?: number): {
		goodPassedLimit: number;
		finalLimit: number;
	} {
		const goodPassedLimit = limit || API_MAX_LIMIT;
		const finalLimit =
			goodPassedLimit > API_MAX_LIMIT ? API_MAX_LIMIT : goodPassedLimit;

		return {
			goodPassedLimit,
			finalLimit,
		};
	}

	/**
	 * Generic function to fetch all tracks for a given method
	 *
	 * @template T - {TRecentTrack | TTopTrack}
	 *
	 * @param {string} method - The method to fetch from the LastFM API
	 * @param params {TGetAllOptions} - The parameters to pass to the LastFM API
	 * @param {boolean} debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<T[]} The tracks fetched from the LastFM API
	 */
	private async fetchAllTracks<T extends TRecentTrack | TTopTrack>(
		method: TMethods,
		params: TGetAllOptions,
		debug?: boolean,
	): Promise<T[]> {
		const { limit } = params;

		const { goodPassedLimit, finalLimit } = this.getGoodPassedLimit(limit);

		debug &&
			console.log(
				"`fetchAllTracks` - goodPassedLimit, finalLimit: ",
				goodPassedLimit,
				finalLimit,
			);

		let options: TGetAllRecentTracksOptions | TGetAllTopTracksOptions;
		switch (method) {
			case "user.getRecentTracks":
				options = getAllRecentTracksOptionsSchema.parse(params);
				break;
			case "user.getTopTracks":
				options = getAllTopTracksOptionsSchema.parse(params);
				break;
			default:
				throw new Error("Invalid method");
		}

		let response: TGetRecentTracksResponse | TGetTopTracksResponse;
		let total: number;

		const fetched = await this.fetch(method, { ...params, limit: finalLimit });

		switch (method) {
			case "user.getRecentTracks":
				response = getRecentTracksSchema.parse(fetched);

				total = response.recenttracks["@attr"].total;
				break;
			case "user.getTopTracks":
				response = getTopTracksSchema.parse(fetched);

				total = response.toptracks["@attr"].total;
				break;

			default:
				throw new Error("Invalid method");
		}

		const neededTracks =
			(goodPassedLimit > total ? total : goodPassedLimit) - finalLimit;
		const chunks = Math.ceil(neededTracks / CHUNK_SIZE);

		if (debug) {
			console.log(`\`fetchAllTracks\` - Total tracks: ${total}`);
			console.log(`\`fetchAllTracks\` - Needed tracks: ${neededTracks}`);
			console.log(`\`fetchAllTracks\` - Chunks: ${chunks}`);
		}

		if (finalLimit < goodPassedLimit) {
			for (let i = 0; i < chunks; i++) {
				/**
				 * Calculate the number of API calls needed to fetch the tracks within the chunk
				 */
				const numberOfApiCallWithinChunk = Math.ceil(
					(neededTracks - i * CHUNK_SIZE > CHUNK_SIZE // if we need more than 5000 tracks,
						? CHUNK_SIZE // fetch 5000 tracks
						: neededTracks - i * CHUNK_SIZE) / // else fetch the remaining tracks
						API_MAX_LIMIT, // and divide by 1000 to get the number of API calls needed
				); // ceil to make sure we fetch all the tracks

				const newFetches = await Promise.all(
					Array.from({ length: numberOfApiCallWithinChunk }, (_, j) =>
						this.fetch(method, {
							...options,
							limit: API_MAX_LIMIT,
							page: (i * CHUNK_SIZE) / API_MAX_LIMIT + (j + 2), // since we already fetched the first 1000,
						}),
					),
				);

				switch (method) {
					case "user.getRecentTracks": {
						const newTracks = z.array(getRecentTracksSchema).parse(newFetches);

						(response as TGetRecentTracksResponse).recenttracks.track.push(
							...newTracks.flatMap((t) => t.recenttracks.track),
						);

						break;
					}
					case "user.getTopTracks": {
						const newTracks = z.array(getTopTracksSchema).parse(newFetches);

						(response as TGetTopTracksResponse).toptracks.track.push(
							...newTracks.flatMap((t) => t.toptracks.track),
						);

						break;
					}
				}
			}
		}

		let finalTracks: T[];
		switch (method) {
			case "user.getRecentTracks":
				finalTracks = (response as TGetRecentTracksResponse).recenttracks
					.track as T[];
				break;
			case "user.getTopTracks":
				finalTracks = (response as TGetTopTracksResponse).toptracks
					.track as T[];
				break;
		}

		return finalTracks.slice(0, goodPassedLimit);
	}
}

export default LastFMHandler;
