import { AsyncMode } from './extensions.ts';
import config, { fileExists } from './config.ts';
import * as path from 'https://deno.land/std/path/mod.ts';
import retriever from './retriever.ts';

// Create target folder if it doesn't exist already
if (!fileExists(config.targetFolder))
    await Deno.mkdir(config.targetFolder, { recursive: true });

// Get downloads
async function getDownloaded(): Promise<(Deno.FileInfo & { name: string })[]> {
    const downloaded: (Deno.FileInfo & { name: string })[] = [];
    for (const { name, isDirectory } of Deno.readDirSync(config.targetFolder)) if (!isDirectory) {
        const file = Deno.statSync(path.join(config.targetFolder, name));
        downloaded.push({ ...file, name });
    }
    return downloaded;
};

export { AsyncMode, getDownloaded };

console.log(`\
Downloader starting.
Config found at ${config.configFilePath}
Files will be downloaded to ${config.targetFolder}`
);
retriever();