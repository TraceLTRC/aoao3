export type contentHashArray = [number, string];

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
	warnings: string[];
	rating: string;
	categories: string[];
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

export function workFactory(id: string): WorkDocument {
	return {
		authors: [],
		bookmarks: 0,
		categories: [],
		currChapter: 0,
		maxChapter: 0,
		characters: [],
		fandoms: [],
		hits: -1,
		id: id,
		kudos: 0,
		language: '',
		publishedTime: 0,
		rating: '',
		relationships: [],
		tags: [],
		title: '',
		warnings: [''],
		words: -1,
		contentHash: [],
		lastChecked: Date.now(),
		summary: '',
	};
}
