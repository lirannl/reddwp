import config from "./config.ts";
import { getDownloaded, AsyncMode } from "./main.ts";
import { Convert, RedditPost } from "./responses/reddit.ts";
import * as path from 'https://deno.land/std/path/mod.ts';

// Given a reddit post, return the size of its link
const measurePostSize = async (post: RedditPost) => {
    if (post.is_self) return null;
    const res = await fetch(post.url, { method: "HEAD" });
    const possibleSizeStr = res.headers.get('content-length');
    if (possibleSizeStr == null) return possibleSizeStr;
    return parseInt(possibleSizeStr) / 1000000;
}

const postFilter = async (post: RedditPost) => {
    const conditions: (() => boolean | Promise<boolean>)[] = [
        // Don't try to download self posts
        () => !post.is_self
    ];
    // Don't try to download NSFW content if configured not to
    if (config.filterNsfw) conditions.push(() => !post.over_18);
    // Measure minimum file size
    conditions.push(async () => {
        // Don't check the size if a minimum size isn't configured
        if (!config.minimumSize) return true;
        const size = await measurePostSize(post);
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
        console.log("No sources coonfigured.")
        return;
    }
    const source = config.sources[Math.floor(Math.random() * config.sources.length)];
    if (source.startsWith("r/")) {
        const downloads = await getDownloaded();
        const existingPosts = downloads.map(file => file.name.split('.')[0].split('_').reverse()[0]);
        let after: string | undefined;
        let imageBytes: ArrayBuffer = new ArrayBuffer(0);
        let post: RedditPost | undefined;
        while (!post) {
            let url = new URL(`https://www.reddit.com/${source}/hot.json`);
            if (after) {
                url.searchParams.append("after", after);
            }
            // Grab the a new post from the subreddit
            const posts = await fetch(url)
                .then(res => res.text())
                .then(res => {
                    return Convert.toRedditResponse(res).data.children
                })
                .then(items => items.map(({ data }) => data))
                ;
            after = posts[posts.length - 1].id;
            post = await posts.asyncFind(
                async post => !existingPosts.includes(post.id) && await postFilter(post),
                AsyncMode.Parellel
            );
        }
        const fileName = `${source.replace("/", "_")}_${post.id}.${post.url.split(".").reverse()[0]}`;
        console.log(`Downloading ${post.id} from ${source}`);
        imageBytes = await (await fetch(post.url)).arrayBuffer();
        // Download the post
        await Deno.writeFile(path.join(config.targetFolder, fileName),
            new Uint8Array(imageBytes), { create: true });
    }
    setTimeout(() => { retriever() }, config.interval * (1000 * 60));
}

export default retriever;
