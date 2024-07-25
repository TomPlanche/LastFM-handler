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
	limit: z.coerce.number().min(1).max(1000),
	page: z.coerce.number().min(1),
});

export const getRecentTracksOptionsSchema = BaseOptionsSchema.extend({
	from: z.coerce
		.date()
		.transform((d) => d.getTime())
		.optional(),
	to: z.coerce
		.date()
		.transform((d) => d.getTime())
		.optional(),
	extended: z.coerce.number().pipe(z.coerce.boolean()).optional(),
});

const PeriodSchema = z.enum([
	"overall",
	"7day",
	"1month",
	"3month",
	"6month",
	"12month",
]);

export type TPeriod = z.infer<typeof PeriodSchema>;

export const getTopTracksOptionsSchema = BaseOptionsSchema.extend({
	period: PeriodSchema.optional(),
});

export type TBaseOptions = z.infer<typeof BaseOptionsSchema>;

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

export const getTopTracksSchema = z.object({
	toptracks: z.object({
		track: z.array(TopTrackSchema),
		"@attr": BaseResponseSchema,
	}),
});
