import { z } from "zod";

const MethodsSchema = z.enum([
	"user.getRecentTracks",
	"user.getLovedTracks",
	"user.getTopTracks",
]);

export type TMethods = z.infer<typeof MethodsSchema>;

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
	extended: z
		.string()
		.transform((value) => {
			if (value === "true" || value === "1") {
				return true;
			}

			if (value === "false" || value === "0") {
				return false;
			}

			throw new Error("Invalid boolean value");
		})
		.or(z.coerce.boolean())
		.optional(),
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
export const getAllOptionsSchema = BaseOptionsSchema.extend({
	limit: z.coerce.number().min(1).optional().default(100),
}).and(getAllRecentTracksOptionsSchema.or(getAllTopTracksOptionsSchema));

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
