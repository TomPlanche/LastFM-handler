/**
 * This `middleware` is primarily used to validate the query parameters of the request
 * and to give nicely parsed and formatted data from the LastFM API.
 *
 * ## Features:
 * Get ALL the:
 * - [x] Loved tracks
 * - [x] Recent tracks
 *
 * When no limit is passed, the middleware will fetch all the tracks.
 * Since the LastFM API has a limit of 1000 tracks per request, the middleware will make multiple requests to fetch all the tracks.
 *
 * If the passed limit is greater than 1000, the middleware will parrallelize the requests to fetch the tracks faster.
 * It'll parrallelize the requests in chunks of 5000 tracks since I tried with 10_000 tracks and it worked,
 * so I'm going with 5000 tracks to be safe.
 *
 * ## TODO:
 * - [ ] Refactor the functions that fetches ALL the tracks since they use the same logic..
 *
 */

import axios from "axios";
import { z } from "zod";
import {
	type TBaseOptions,
	type TLovedTrack,
	type TMethods,
	type TPeriod,
	type TRecentTrack,
	type TTopTrack,
	getRecentTracksOptionsSchema,
	getRecentTracksSchema,
	getTopTracksOptionsSchema,
	getTopTracksSchema,
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

	private readonly baseOptions: TBaseOptions = {
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
			? limit <= this.baseOptions.limit
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
	 * @param {object} params - The parameters to pass to the LastFM API
	 * @param {number} params.limit - The limit of tracks to fetch
	 * @param {number} params.from - The timestamp to fetch from
	 * @param {number} params.to - The timestamp to fetch to
	 * @param {boolean} params.extended - Should the function fetch extended information (default: false)
	 *
	 * @param {boolean} params.debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TRecentTrack[]} The recent tracks of the user
	 */
	async getAllUserRecentTracks({
		limit,
		extended,
		debug,
	}: {
		limit?: number;
		from?: number;
		to?: number;
		extended?: boolean;
		debug?: boolean;
	} = {}): Promise<TRecentTrack[]> {
		const goodPassedLimit = limit || API_MAX_LIMIT;
		const finalLimit =
			goodPassedLimit > API_MAX_LIMIT ? API_MAX_LIMIT : goodPassedLimit;

		const baseOptions = getRecentTracksOptionsSchema.parse({
			...this.baseOptions,
			limit: finalLimit,
			extended,
		});

		debug && console.log("Base options: ", baseOptions);

		const response = getRecentTracksSchema.parse(
			await this.fetch("user.getRecentTracks", baseOptions),
		);

		debug &&
			console.log("Fetched tracks: ", response.recenttracks.track.length);

		const { total } = response.recenttracks["@attr"];

		if (finalLimit < goodPassedLimit) {
			const neededTracks = goodPassedLimit - finalLimit;
			const chunks = Math.ceil(neededTracks / CHUNK_SIZE);

			if (debug) {
				console.log(`Total tracks: ${total}`);
				console.log(`Needed tracks: ${neededTracks}`);
				console.log(`Chunks: ${chunks}`);
			}

			for (let i = 0; i < chunks; i++) {
				const numberOfApiCallWithinChunk = Math.ceil(
					(neededTracks - i * CHUNK_SIZE > CHUNK_SIZE
						? CHUNK_SIZE
						: neededTracks - i * CHUNK_SIZE) / API_MAX_LIMIT,
				);

				const newTracks = z.array(getRecentTracksSchema).parse(
					await Promise.all(
						Array.from({ length: numberOfApiCallWithinChunk }, (_, j) =>
							this.fetch("user.getRecentTracks", {
								...this.baseOptions,
								limit: API_MAX_LIMIT,
								page: (i * CHUNK_SIZE) / API_MAX_LIMIT + (j + 2), // since we already fetched the first 1000,
							}),
						),
					),
				);

				response.recenttracks.track.push(
					...newTracks.flatMap((t) => t.recenttracks.track),
				);
			}
		}

		return response.recenttracks.track.slice(0, goodPassedLimit);
	}

	/**
	 * Get the recent tracks of the user
	 *
	 * @param {object} params - The parameters to pass to the LastFM API
	 * @param {number} params.limit - The limit of tracks to fetch
	 * @param {number} params.from - The timestamp to fetch from
	 * @param {number} params.to - The timestamp to fetch to
	 * @param {boolean} params.extended - Should the function fetch extended information (default: false)
	 *
	 * @param {boolean} params.debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TRecentTrack[]} The recent tracks of the user
	 */
	async getUserRecentTracks({
		limit,
		from,
		to,
		extended,
		debug,
	}: {
		limit?: number;
		from?: number;
		to?: number;
		extended?: boolean;
		debug?: boolean;
	} = {}): Promise<TRecentTrack[]> {
		const { goodPassedLimit, finalLimit } = this.getGoodPassedLimit(limit);

		debug && console.log("from, to, extended", from, to, extended);

		const baseOptions = getRecentTracksOptionsSchema.parse({
			...this.baseOptions,
			limit: finalLimit,
			from,
			to,
			extended,
		});

		debug && console.log("baseOptions: ", baseOptions);

		const response = getRecentTracksSchema.parse(
			await this.fetch("user.getRecentTracks", baseOptions),
		);

		debug &&
			console.log(
				"response.recenttracks.track.length: ",
				response.recenttracks.track.length,
			);

		const { total } = response.recenttracks["@attr"];

		if (finalLimit < goodPassedLimit) {
			const neededTracks = goodPassedLimit - finalLimit;
			const chunks = Math.ceil(neededTracks / CHUNK_SIZE);

			if (debug) {
				console.log(`Total tracks: ${total}`);
				console.log(`Needed tracks: ${neededTracks}`);
				console.log(`Chunks: ${chunks}`);
			}

			for (let i = 0; i < chunks; i++) {
				const numberOfApiCallWithinChunk = Math.ceil(
					(neededTracks - i * CHUNK_SIZE > CHUNK_SIZE
						? CHUNK_SIZE
						: neededTracks - i * CHUNK_SIZE) / API_MAX_LIMIT,
				);

				const newTracks = z.array(getRecentTracksSchema).parse(
					await Promise.all(
						Array.from({ length: numberOfApiCallWithinChunk }, (_, j) =>
							this.fetch("user.getRecentTracks", {
								...this.baseOptions,
								limit: API_MAX_LIMIT,
								page: (i * CHUNK_SIZE) / API_MAX_LIMIT + (j + 2), // since we already fetched the first 1000,
							}),
						),
					),
				);

				for (const track of newTracks) {
					response.recenttracks.track.push(...track.recenttracks.track);
				}
			}
		}

		return response.recenttracks.track.slice(0, goodPassedLimit);
	}

	/**
	 * Get the top tracks of the user
	 *
	 * @param {object} params - The parameters to pass to the LastFM API
	 * @param {number} params.limit - The limit of tracks to fetch
	 * @param {string} params.period - The period of the top tracks (default: "overall")
	 * @param {boolean} params.debug - Should the function log debug information (default: false)
	 *
	 * @returns {Promise<TTopTrack[]} The loved tracks of the user
	 */
	async getUserTopTracks({
		limit,
		period,
		debug,
	}: { limit?: number; period?: TPeriod; debug?: boolean } = {}): Promise<
		TTopTrack[]
	> {
		const { goodPassedLimit, finalLimit } = this.getGoodPassedLimit(limit);

		const baseOptions = getTopTracksOptionsSchema.parse({
			...this.baseOptions,
			limit: finalLimit,
			period,
		});

		const response = getTopTracksSchema.parse(
			await this.fetch("user.getTopTracks", baseOptions),
		);

		const { total } = response.toptracks["@attr"];

		if (finalLimit < goodPassedLimit) {
			const neededTracks = goodPassedLimit - finalLimit;
			const chunks = Math.ceil(neededTracks / CHUNK_SIZE);

			if (debug) {
				console.log(`Total tracks: ${total}`);
				console.log(`Needed tracks: ${neededTracks}`);
				console.log(`Chunks: ${chunks}`);
			}

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

				const newTracks = z.array(getTopTracksSchema).parse(
					await Promise.all(
						Array.from({ length: numberOfApiCallWithinChunk }, (_, j) =>
							this.fetch("user.getTopTracks", {
								...this.baseOptions,
								limit: API_MAX_LIMIT,
								page: (i * CHUNK_SIZE) / API_MAX_LIMIT + (j + 2), // since we already fetched the first 1000,
							}),
						),
					),
				);

				response.toptracks.track.push(
					...newTracks.flatMap((t) => t.toptracks.track),
				);
			}
		}

		return response.toptracks.track.slice(0, goodPassedLimit);
	}

	/**
	 * Get the currently playing track of the user
	 *
	 * @returns {Promise<TRecentTrack | null} The currently playing track of the user
	 */
	async getCurrentlyPlayingTrack(): Promise<TRecentTrack | null> {
		const response = await this.fetch("user.getRecentTracks", {
			...this.baseOptions,
			limit: 1,
		});

		const {
			recenttracks: { track },
		} = getRecentTracksSchema.parse(response);

		return track[0]["@attr"]?.nowplaying ? track[0] : null;
	}

	/**
	 * Fetches the passed method with the passed parameters from the LastFM API.
	 *
	 * @param {string} method - The method to fetch from the LastFM API
	 * @param {Record<string, string>} params - The parameters to pass to the LastFM API
	 */
	private async fetch(
		method: TMethods,
		params: TBaseOptions &
			(
				| { from?: number; to?: number; extended?: boolean } // getRecentTracks
				| { period: TPeriod } // getTopTracks
			),
	) {
		const parsedParams = getRecentTracksOptionsSchema.parse(params);

		const response = await axios.get("http://ws.audioscrobbler.com/2.0/", {
			params: {
				api_key: process.env.LASTFM_API_KEY,
				method,
				user: this.username,
				format: "json",
				...params,
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
}

export default LastFMHandler;
