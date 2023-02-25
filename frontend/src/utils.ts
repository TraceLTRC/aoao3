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

// https://stackoverflow.com/questions/35228052/debounce-function-implemented-with-promises
export function debouncePromise<T extends (...args: any[]) => any>(
	fn: T,
	wait: number,
	abortValue: any = undefined
) {
	let cancel = () => {};
	// type Awaited<T> = T extends PromiseLike<infer U> ? U : T
	type ReturnT = Awaited<ReturnType<T>>;
	const wrapFunc = (...args: Parameters<T>): Promise<ReturnT> => {
		cancel();
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => resolve(fn(...args)), wait);
			cancel = () => {
				clearTimeout(timer);
				if (abortValue !== undefined) {
					reject(abortValue);
				}
			};
		});
	};
	return wrapFunc;
}
