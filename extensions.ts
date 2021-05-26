enum AsyncMode {
    Sequential, Parellel
}

declare global {
    interface Array<T> {
        asyncFind(predicate: (this: void, item: T, index: number, obj: T[]) => Promise<any>, mode?: AsyncMode): Promise<T | undefined>
    }
}

Array.prototype.asyncFind = async function <T>(
    predicate: (this: void, item: T, index: number, obj: T[]) => Promise<any>,
    // asyncFind is sequential by default
    mode = AsyncMode.Sequential) {
    const arr = this as T[];
    switch (mode) {
        // Avoids flooding the system with requests - minimises resource load
        case AsyncMode.Sequential:
            {
                let index = 0;
                for (const item of arr) {
                    // Fire only the promise in question
                    if (await predicate(item, index, arr))
                        return item;
                    else index++;
                }
            }
            break;

        // Doesn't wait for each predicate to resolve - can be much faster
        case AsyncMode.Parellel:
            {
                let index = 0;
                // Fire off all promises immediately
                const promises = arr.map(predicate);
                // One by one, wait for each predicate to be determined
                for await (const result of promises) {
                    // Stop as soon as one matches
                    if (result) return arr[index];
                    else index++;
                }
            }
            break;
    }
}

export { AsyncMode };