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