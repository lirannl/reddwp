import config from "./config.ts";
import { getDownloaded, AsyncMode, global } from "./main.ts";
import { Convert, RedditPost } from "./responses/reddit.ts";
import * as path from 'https://deno.land/std@0.97.0/path/mod.ts';

// Delete old items from a folder to clear space before adding a new item
const trimFolder = async (folder: {
    files: (Deno.FileInfo & { name: string })[]
    path: string
}, newItemSize: number, maxSize: number) => {
    if (newItemSize > maxSize)
        throw new Error(`Maximum size is too small. Please edit the config and set a size larger than ${config.maxFolderSize}MB.`);
    let folderSize = folder.files.reduce((acc, curr) => {
        return acc + curr.size
    }, 0) / 1000000;
    const filesByDate = [...folder.files].sort((a, b) => {
        if (a.birthtime! > b.birthtime!) return -1;
        if (a.birthtime == b.birthtime) return 0;
        return 0;
    })
    while (folderSize > maxSize && filesByDate.length > 0) {
        // Delete the oldest item
        const fileToRemove = filesByDate.pop()!;
        await Deno.remove(path.join(folder.path, fileToRemove.name));
        folderSize -= fileToRemove.size / 1000000;
    }
}

// Given a reddit post, return the size of its link
const measurePostSize = async (post: RedditPost) => {
    if (post.is_self) return null;
    const res = await fetch(post.url, { method: "HEAD" });
    const possibleSizeStr = res.headers.get('content-length');
    if (possibleSizeStr == null) return possibleSizeStr;
    return parseInt(possibleSizeStr) / 1000000;
}

const postFilter = async (existingDownloads: string[], post: RedditPost) => {
    const conditions: (() => boolean | Promise<boolean>)[] = [
        // Don't try to download self posts
        () => !post.is_self,
        // Only try to download posts that link to static files
        () => /[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(post.url),
        () => !/\.(php)|(html)+$/.test(post.url),
        // Don't try to re-download posts
        () => !existingDownloads.includes(post.id),
    ];
    // Don't try to download NSFW content if configured not to
    if (config.filterNsfw) conditions.push(() => !post.over_18);
    // Measure minimum file size
    conditions.push(async () => {
        // Don't check the size if a minimum size isn't configured
        if (!config.minimumSize) return true;
        const size = await measurePostSize(post).catch(_ => null);
        // If the post's size cannot be determined, ignore it
        if (!size) return false;
        return size >= config.minimumSize!;
    })

    // Lazily AND all of the conditions together
    for (const condition of conditions) {
        if (!await condition()) return false;
    }
    return true;
}

async function retriever() {
    if (config.sources.length == 0) {
        console.log("No sources coonfigured.");
        return;
    }
    const source = config.sources[Math.floor(Math.random() * config.sources.length)];
    if (source.startsWith("r/")) {
        const downloads = await getDownloaded();
        let after: string | undefined;
        let numberFetched = 0;
        let post: RedditPost | undefined;
        while (!post) {
            let url = new URL(`https://www.reddit.com/${source}/hot.json`);
            if (after && numberFetched) {
                url.searchParams.append("after", after);
                url.searchParams.append("count", `${numberFetched}`);
            }
            // Grab the a new post from the subreddit
            const posts = await fetch(url)
                .then(res => res.text())
                .then(resText => Convert.toRedditResponse(resText).data.children
                )
                ;
            after = `${posts[posts.length - 1].kind}_${posts[posts.length - 1].data.id}`;
            numberFetched = posts.length;
            const existingPosts = downloads.map(file => file.name.split('.')[0].split('_').reverse()[0]);
            post = (await posts.asyncFind(
                async post => await postFilter(existingPosts, post.data),
                AsyncMode.Parellel
            ))?.data;
        }
        const fileName = `${source.replace(/[\/\\]/, "_")}_${post.id}.${post.url.split(".").reverse()[0]}`;
        console.log(`Downloading ${post.id} from ${source}`);
        const imageBytes = await (await fetch(post.url)).arrayBuffer();
        // If the folder's size will exceed the maximum, delete old items until it won't
        if (config.maxFolderSize) await trimFolder({ files: downloads, path: config.targetFolder },
            imageBytes.byteLength / 1000000, config.maxFolderSize);
        // Download the post
        await Deno.writeFile(path.join(config.targetFolder, fileName),
            new Uint8Array(imageBytes), { create: true });
    }
    // Rerun the retriever based on the interval set in the config
    global.nextIteration = setTimeout(() => { retriever() }, config.interval * (1000 * 60));
}

export default retriever;
