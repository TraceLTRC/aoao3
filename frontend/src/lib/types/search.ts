import type { Rating, Category, Warning } from './work';

export const workOrders = [
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

export function isWorkOrder(str: any): str is workOrder {
	return workOrders.includes(str as workOrder);
}

export type workOrder = (typeof workOrders)[number];

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

export type SearchBody = {
	query: string;
	order: workOrder;
	authors?: string[];
	relationships?: string[];
	fandoms?: string[];
	characters?: string[];
	tags?: string[];
	includedRatings?: Rating[];
	includedWarnings?: Warning[];
	includedCategories?: Category[];
	excludedRatings?: Rating[];
	excludedWarnings?: Warning[];
	excludedCategories?: Category[];
};
