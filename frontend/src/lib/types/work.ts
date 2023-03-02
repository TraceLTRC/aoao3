export const ratingTuple = [
	'Not Rated',
	'General Audiences',
	'Teen And Up Audiences',
	'Mature',
	'Explicit'
] as const;

export type Rating = (typeof ratingTuple)[number];

export function isRating(str: string): str is Rating {
	return ratingTuple.includes(str as Rating);
}

export const ratingLabels: Record<Rating, string> = {
	'General Audiences': 'rating-gen',
	'Not Rated': 'rating-null',
	'Teen And Up Audiences': 'rating-teen',
	Explicit: 'rating-explicit',
	Mature: 'rating-mature'
};

export const categoryTuple = ['F/F', 'M/M', 'F/M', 'Gen', 'Multi', 'Other'] as const;

export type Category = (typeof categoryTuple)[number];

export function isCategory(str: string): str is Category {
	return categoryTuple.includes(str as Category);
}

export const warningTuple = [
	'Creator Chose Not To Use Archive Warnings',
	'Graphic Depictions Of Violence',
	'Major Character Death',
	'No Archive Warnings Apply',
	'Rape/Non-Con',
	'Underage'
] as const;

export type Warning = (typeof warningTuple)[number];

export function isWarning(str: string): str is Warning {
	return warningTuple.includes(str as Warning);
}

type contentHashArray = [number, string];

export type ArchiveMeta = {
	lastChecked: number;
	contentHash: contentHashArray[];
};

export type WorkStats = {
	publishedTime: number;
	lastUpdated?: number;
	words: number;
	currChapter: number;
	maxChapter: number;
	kudos: number;
	bookmarks: number;
	hits: number;
};

export type WorkMeta = {
	title: string;
	authors: string[];
	warnings: Warning[];
	rating: Rating;
	categories: Category[];
	fandoms: string[];
	relationships: string[];
	characters: string[];
	tags: string[];
	language: string;
} & WorkStats;

export type WorkChapter = {
	title: string;
	summary: string;
	beginningNotes: string;
	endingNotes: string;
	content: string;
};

export type WorkContent = {
	beginningNotes: string;
	endingNotes: string;
	skin: string;
	chapters: WorkChapter[];
};

export type Work = {
	id: string;
	summary: string;
} & WorkMeta;

export type WorkDocument = Work & ArchiveMeta;
