import { z } from "zod";

// Zod base
const zodStringBoolean = z
	.union([z.literal("false"), z.literal("true")])
	.transform((value) => value.toLowerCase() === "true");

export const zodBooleanUnion = z.union([
	z.literal(0).transform(() => false),
	z.literal(1).transform(() => true),
	z
		.union([z.literal("0"), z.literal("1")])
		.transform((v) => !!Number.parseInt(v, 10)),
	z
		.string()
		.transform((v) => v.toLowerCase())
		.pipe(zodStringBoolean),

	z.boolean(),
]);

const MethodsSchema = z.enum([
	"user.getRecentTracks",
	"user.getLovedTracks",
	"user.getTopTracks",

	"track.getInfo",
]);

export type TMethods = z.infer<typeof MethodsSchema>;

// Error response
export const errorResponseSchema = z.object({
	error: z.coerce.number(),
	message: z.string(),
	links: z.array(z.any()),
});

/**
 * QUERY TYPES
 */

const BaseOptionsSchema = z.object({
	limit: z.coerce.number().min(1).optional(),
});

export const getRecentTracksOptionsSchema = BaseOptionsSchema.extend({
	from: z.coerce
		.date()
		.transform((date) => date.getTime())
		.optional(),
	to: z.coerce
		.date()
		.transform((date) => date.getTime())
		.optional(),
	extended: zodBooleanUnion.optional(),
});

export type TGetRecentTracksOptions = z.infer<
	typeof getRecentTracksOptionsSchema
>;

export const getAllRecentTracksOptionsSchema =
	getRecentTracksOptionsSchema.extend({
		page: z.coerce.number().min(1).optional(),
	});

export type TGetAllRecentTracksOptions = z.infer<
	typeof getAllRecentTracksOptionsSchema
>;

export const getAllTopTracksOptionsSchema = BaseOptionsSchema.extend({
	period: z
		.enum(["overall", "7day", "1month", "3month", "6month", "12month"])
		.optional(),
});
export type TGetAllTopTracksOptions = z.infer<
	typeof getAllTopTracksOptionsSchema
>;

export const getTopTracksOptionsSchema = getAllTopTracksOptionsSchema.extend({
	page: z.coerce.number().min(1).optional(),
});

export const getTrackInfoRequest = z
	.object({
		mbid: z.string().optional(),
		track: z.string().optional(),
		artist: z.string().optional(),
		autocorrect: zodBooleanUnion.optional(),
		limit: z.undefined(),
	})
	.refine(
		(data) => {
			return !!data.mbid || (data.track && data.artist);
		},
		{
			message: "Either 'mbid' or both 'track' and 'artist' are required",
			path: ["mbid", "track", "artist"], // Add this path to indicate where the error occurs
		},
	);

export type TGetTrackInfoRequest = z.infer<typeof getTrackInfoRequest>;

export type TGetTopTracksOptions = z.infer<typeof getTopTracksOptionsSchema>;
/**
 * The base options schema for all the methods
 *
 * limit: The number of items to return per page (mandatory)
 *
 * // GROUP 1
 * from: The date from which to start fetching the data
 * to: The date to which to fetch the data
 * extended: Whether to fetch extended data or not
 *
 * // GROUP 2
 * period: The period for which to fetch the data
 *
 * The groups are mutually exclusive
 */
export const getAllOptionsSchema = z.union([
	getTrackInfoRequest.and(BaseOptionsSchema),
	getAllRecentTracksOptionsSchema,
	getAllTopTracksOptionsSchema,
]);

export type TGetAllOptions = z.infer<typeof getAllOptionsSchema>;

export const BaseResponseSchema = z.object({
	user: z.string(),
	totalPages: z.coerce.number(),
	page: z.coerce.number(),
	perPage: z.coerce.number(),
	total: z.coerce.number(),
});

/**
 * ZOD BASE SCHEMAS
 */
const BaseObjectSchema = z.object({
	mbid: z.string(),
	url: z.string(),
	name: z.string(),
});

const TrackImageSchema = z.object({
	size: z.string(),
	"#text": z.string(),
});

const DateSchema = z.object({
	uts: z.coerce.number().transform((v) => new Date(v * 1000)),

	"#text": z.coerce.date(),
});

const StreamableSchema = z.object({
	fulltrack: z.string(),
	"#text": z.string(),
});

export const LovedTrackSchema = BaseObjectSchema.extend({
	artist: BaseObjectSchema,
	date: DateSchema,
	image: z.array(TrackImageSchema),
	streamable: StreamableSchema,
});

export type TLovedTrack = z.infer<typeof LovedTrackSchema>;

const RecentTrackArtistSchema = z.object({
	mbid: z.string(),
	"#text": z.string(),
});

const RecentTrackExtendedArtistSchema = RecentTrackArtistSchema.extend({
	"#text": z.union([z.undefined(), z.never()]), // Not present in the response
	image: z.array(TrackImageSchema),
});

export const RecentTrackSchema = BaseObjectSchema.extend({
	artist: z.union([
		z.object({
			mbid: z.string(),
			"#text": z.string(),
		}),
		RecentTrackExtendedArtistSchema,
	]),
	streamable: z.coerce.number().pipe(z.coerce.boolean()),
	image: z.array(TrackImageSchema),
	album: z.object({
		mbid: z.string(),
		"#text": z.string(),
	}),
	"@attr": z
		.object({
			nowplaying: z
				.union([z.literal("true"), z.literal("false")])
				.transform((v) => v === "true"),
		})
		.optional(),
	date: DateSchema.optional(),
	// the 'loved' field is not present in the response

	loved: z.coerce.number().pipe(z.coerce.boolean()).optional(),
});

export type TRecentTrack = z.infer<typeof RecentTrackSchema>;

export const TopTrackSchema = BaseObjectSchema.extend({
	streamable: StreamableSchema,
	image: z.array(TrackImageSchema),
	artist: BaseObjectSchema,
	duration: z.coerce.number(),
	playcount: z.coerce.number(),
	"@attr": z.object({
		rank: z.coerce.number(),
	}),
});

export type TTopTrack = z.infer<typeof TopTrackSchema>;

export const getUserLovedTracksSchema = z.object({
	lovedtracks: z.object({
		track: z.array(LovedTrackSchema),
		"@attr": BaseResponseSchema,
	}),
});

export const getRecentTracksSchema = z.object({
	recenttracks: z.object({
		track: z.array(RecentTrackSchema),
		"@attr": BaseResponseSchema,
	}),
});

export type TGetRecentTracksResponse = z.infer<typeof getRecentTracksSchema>;

export const getTopTracksSchema = z.object({
	toptracks: z.object({
		track: z.array(TopTrackSchema),
		"@attr": BaseResponseSchema,
	}),
});

export type TGetTopTracksResponse = z.infer<typeof getTopTracksSchema>;

const getTrackInfoAlbumSchema = z.object({
	artist: z.string(),
	title: z.string(),
	mbid: z.string(),
	url: z.string(),
	image: z.array(TrackImageSchema),
	"@attr": z.object({
		position: z.coerce.number(),
	}),
});

const getTrackInfoNoUser = BaseObjectSchema.extend({
	duration: z.coerce.number().transform((v) => msToTime(v)),
	streamable: StreamableSchema,
	listeners: z.coerce.number(),
	playcount: z.coerce.number(),
	artist: BaseObjectSchema,
	album: getTrackInfoAlbumSchema,
	toptags: z.object({
		tag: z.array(z.object({ name: z.string(), url: z.string() })),
	}),
	wiki: z.object({
		published: z.coerce.date(),
		summary: z.string(),
		content: z.string(),
	}),
});

const getTrackInfoWithUser = getTrackInfoNoUser.extend({
	userplaycount: z.coerce.number(),
	userloved: z.coerce.number().pipe(z.coerce.boolean()),
});

export const getTrackInfoNoUserResponse = z
	.object({
		track: z.union([getTrackInfoNoUser, getTrackInfoWithUser]),
	})
	.or(errorResponseSchema);

export type TGetTrackInfoNoUserResponse = z.infer<
	typeof getTrackInfoNoUserResponse
>;

/**
 * Convert miliseconds to object
 *
 * @param ms The number of miliseconds
 *
 */
export const msToTime = (ms: number) => {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

	const stringified = {
		seconds: seconds.toString().padStart(2, "0"),
		minutes: minutes.toString().padStart(2, "0"),
		hours: hours.toString().padStart(2, "0"),
	};

	return {
		hours,
		minutes,
		seconds,
		string:
			hours > 0
				? `${stringified.hours}:${stringified.minutes}:${stringified.seconds}`
				: minutes > 0
					? `${stringified.minutes}:${stringified.seconds}`
					: `${stringified.seconds}`,
	};
};
