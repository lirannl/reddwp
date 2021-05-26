import * as path from 'https://deno.land/std/path/mod.ts';
import { safeParse } from "./utils.ts";

const { configFilePath, appFolder } = (() => {
    const dataFolder = Deno.env.get("HOME")?.concat("/.config") || path.normalize(Deno.env.get("LOCALAPPDATA")!);
    const appFolder = path.join(dataFolder, "reddwp");
    const configFilePath = path.join(appFolder, "config.json");
    return { configFilePath, appFolder };
})();

type stringStringMapping = { [variable: string]: string };

export const fileExists = (path: string) => {
    try {
        Deno.statSync(path);
        return true;
    }
    catch (e) {
        if (e.name != "NotFound") throw e;
        return false;
    }
}

if (!fileExists(appFolder))
    // Appdata folder generation
    await Deno.mkdir(appFolder, { recursive: true });

if (!fileExists(path.join(appFolder, "config.json"))) {
    const defaults = {
        targetFolder: path.join(appFolder, "Downloads"),
        sources: ["r/wallpapers"],
        interval: 20,
        filterNsfw: true,
        maxFolderSize: 500,
        minimumSize: 0.1,
    };
    // Write defaults as config.json
    await Deno.writeFile(path.join(appFolder, "config.json"), new TextEncoder().encode(
        // Convert object to pretty string
        JSON.stringify(defaults, null, 2)
    ));
}

const configFileVars: stringStringMapping = await (async () => {
    const configFilePath = path.join(appFolder, "config.json");
    const configFileString = new TextDecoder().decode(await Deno.readFile(configFilePath));
    return JSON.parse(configFileString);
})();

interface appConfig {
    readonly configFilePath: string;
    readonly appFolder: string;
    targetFolder: string;
    interval /* Hours */: number;
    sources: string[];
    filterNsfw?: true;
    maxFolderSize /* Megabytes */: number;
    minimumSize? /* Megabytes */: number;
}

const config = new Proxy<appConfig>({ configFilePath, appFolder } as unknown as appConfig, {
    // Either read from environment, or from config
    get(target, variable: string) {
        return Deno.env.get(variable) ?
            safeParse(Deno.env.get(variable)!) || Deno.env.get(variable)
            :
            (target as any)[variable] || configFileVars[variable];
    },
    // Always write to config
    set(target, variable: string, value) {
        // readonlies
        if (variable == "configFilePath" || variable == "appFolder") return false;

        // Write new config to file
        (target as any)[variable] = value;
        Deno.writeFileSync(configFilePath, new TextEncoder().encode(
            JSON.stringify(target, null, 2)
        ));

        return true;
    }
});

export default config;