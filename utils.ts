// Folder size in megabytes
export const totalSize = (files: Deno.FileInfo[]) => files.reduce(
    (subtotal, currFile) =>
        subtotal + (currFile.size / 1000000)
    , 0);

// Try parsing. Return undefined on failure
export const safeParse = (str: string) => {
    try {
        return JSON.parse(str);
    }
    catch
    {
        return;
    }
}