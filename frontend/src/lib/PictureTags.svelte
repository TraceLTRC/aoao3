<script lang="ts">
	import { error } from '@sveltejs/kit';
	import type { Category, Rating, Warning } from '../types/work';

	export let rating: Rating;
	export let chapter: [number, number];
	export let category: Category[];
	export let warning: Warning[];

	let className = '';
	export { className as class };

	function ratingToImgSrc(rating: Rating) {
		switch (rating) {
			case 'Not Rated':
				return undefined;
			case 'Explicit':
				return 'symbols/ExplicitSymbol.jpg';
			case 'General Audiences':
				return 'symbols/GeneralSymbol.jpg';
			case 'Mature':
				return 'symbols/MatureSymbol.jpg';
			case 'Teen And Up Audiences':
				return 'symbols/TeenSymbol.jpg';
			default:
				throw error(500, 'Invalid rating!');
		}
	}

	function categoryToImgSrc(category: Category[]) {
		if (category.length > 1) {
			return 'symbols/MultiSymbol.jpg';
		} else if (category.length == 1) {
			let soleCategory = category[0];
			switch (soleCategory) {
				case 'Multi':
					return 'symbols/MultiSymbol.jpg';
				case 'F/F':
					return 'symbols/FFSymbol.jpg';
				case 'F/M':
					return 'symbols/FMSymbol.jpg';
				case 'Gen':
					return 'symbols/GenSymbol.jpg';
				case 'M/M':
					return 'symbols/MMSymbol.jpg';
				case 'Other':
					return 'symbols/OtherSymbol.jpg';
			}
		} else {
			return undefined;
		}
	}

	function warningToImgSrc(warning: Warning[]) {
		if (
			warning.includes('Graphic Depictions Of Violence') ||
			warning.includes('Major Character Death') ||
			warning.includes('Rape/Non-Con') ||
			warning.includes('Underage')
		) {
			return 'symbols/WarningsSymbol.jpg';
		} else if (warning.includes('Creator Chose Not To Use Archive Warnings')) {
			return 'symbols/UnknownWarningSymbol.jpg';
		} else {
			return undefined;
		}
	}

	function chapterToImgSrc(chapter: [number, number]) {
		if (chapter[1] == -1) {
			return undefined;
		} else if (chapter[0] == chapter[1]) {
			return 'symbols/CompletedSymbol.jpg';
		} else {
			return 'symbols/IncompleteSymbol.jpg';
		}
	}

	function chapterToStr(chapter: [number, number]) {
		if (chapter[1] == -1) {
			return 'Unknown';
		} else if (chapter[0] == chapter[1]) {
			return 'Completed';
		} else {
			return 'Not completed';
		}
	}

	const rateSrc =
		ratingToImgSrc(rating) ?? 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
	const categorySrc =
		categoryToImgSrc(category) ?? 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
	const warningSrc =
		warningToImgSrc(warning) ?? 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
	const completeSrc =
		chapterToImgSrc(chapter) ?? 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
</script>

<div
	class="w-[68px] h-[68px] grid grid-cols-2 grid-rows-2 flex-none content-start items-center gap-1 {className}"
>
	<img
		src={rateSrc}
		alt="Rating"
		title={rating}
		width="32"
		height="32"
		class="bg-opacity-40 bg-white w-8 h-8 order-1"
	/>
	<img
		src={categorySrc}
		alt="Category"
		title={category.join(', ')}
		width="32"
		height="32"
		class="bg-opacity-40 bg-white w-8 h-8 order-2"
	/>
	<img
		src={warningSrc}
		alt="Warning"
		title={warning.join(', ')}
		width="32"
		height="32"
		class="bg-opacity-40 bg-white w-8 h-8 order-3"
	/>
	<img
		src={completeSrc}
		alt="Completion"
		title={chapterToStr(chapter)}
		width="32"
		height="32"
		class="bg-opacity-40 bg-white w-8 h-8 order-4"
	/>
</div>
