export function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatBytes(bytes: number, decimals = 2) {
	if (!+bytes) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function removeFromArray<T extends string | number>(arr: T[], el: T) {
	if (arr.includes(el)) arr.splice(arr.indexOf(el), 1);
}

export function debounce(fn: (...args: any[]) => Promise<any>, ms: number = 300) {
	let id: ReturnType<typeof setTimeout>;

	return function (...args: any[]) {
		clearTimeout(id);
		return new Promise((res) => {
			id = setTimeout(() => {
				fn(...args).then((val) => {
					res(val);
				});
			}, ms);
		});
	};
}

export function clickOutside(node: Node) {
	const handleClick = (event: any) => {
		if (!node.contains(event.target)) {
			node.dispatchEvent(new CustomEvent('outclick'));
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
