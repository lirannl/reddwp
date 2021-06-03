import * as path from 'https://deno.land/std@0.97.0/path/mod.ts';
import { safeParse } from "./utils.ts";

const { configFilePath, appFolder } = (() => {
    const dataFolder = Deno.env.get("HOME")?.concat("/.config") || path.normalize(Deno.env.get("LOCALAPPDATA")!);
    const appFolder = path.join(dataFolder, "reddwp");
    const configFilePath = path.join(appFolder, "config.json");
    return { configFilePath, appFolder };
})();

type stringMapping = { [variable: string]: unknown };

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

const defaults: { [p: string]: unknown } = {
    targetFolder: path.join(appFolder, "Downloads"),
    sources: ["r/wallpapers"],
    interval: 20,
    filterNsfw: true,
    maxFolderSize: 500,
    minimumSize: 0.1,
};

if (!fileExists(path.join(appFolder, "config.json"))) {
    // Write defaults as config.json
    await Deno.writeFile(path.join(appFolder, "config.json"), new TextEncoder().encode(
        // Convert object to pretty string
        JSON.stringify(defaults, null, 2)
    ));
}

const configFileVars: stringMapping = await (async () => {
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
    maxFolderSize? /* Megabytes */: number;
    minimumSize? /* Megabytes */: number;
}
const optionals: { [p: string]: unknown } = { minimumSize: 0, maxFolderSize: 0, filterNsfw: true };

const config = new Proxy<appConfig>({ configFilePath, appFolder } as unknown as appConfig, {
    // Either read from environment, or from config
    get(target, variable: string) {
        return Deno.env.get(variable) ?
            safeParse(Deno.env.get(variable)!) || Deno.env.get(variable)
            :
            (target as any)[variable] || configFileVars[variable];
    },
    // Always write to config
    set(_, variable: string, value: unknown) {
        // readonlies
        if (variable == "configFilePath" || variable == "appFolder") throw new TypeError(
            `${variable} is read-only and can only be different based on environment variables.`);
        // Write new config to file
        // Indicate that a write to a nonexistent attribute failed
        if (!Object.keys(defaults).includes(variable))
            throw new RangeError(`Attribute ${variable} isn't valid for the config.`);
        // Indicate that a write with the wrong type failed
        // Allow undefined for optional configs
        if (typeof value == "undefined" && !Object.keys(optionals).includes(variable)) {
            throw new TypeError(`Attribute "${variable}" is required.`);
        }
        else if (typeof configFileVars[variable] != typeof value && typeof optionals[variable] != typeof value)
            throw new TypeError(`Wrong type for attribute ${variable}. Please provide a value of type ${typeof configFileVars[variable]}.`);
        // Write to the object
        configFileVars[variable] = value;
        // Write to the config JSON
        Deno.writeFileSync(configFilePath, new TextEncoder().encode(
            JSON.stringify({ ...configFileVars }, null, 2)
        ));

        return true;
    }
});

export default config;