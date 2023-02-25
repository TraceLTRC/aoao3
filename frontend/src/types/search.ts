const workOrders = [
	'author',
	'bookmarks',
	'hits',
	'kudos',
	'lastChecked',
	'lastUpdated',
	'publishedTime',
	'title',
	'words'
] as const;

type workOrder = (typeof workOrders)[number];

export const orderLabels: Record<workOrder, string> = {
	author: 'Author',
	bookmarks: 'Bookmarks',
	hits: 'Hits',
	kudos: 'Kudos',
	lastChecked: 'Date Archived',
	lastUpdated: 'Date Updated',
	publishedTime: 'Date Posted',
	title: 'Title',
	words: 'Words'
};

export type States = true | false | null;
