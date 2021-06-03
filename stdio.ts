import config from "./config.ts";
import { global } from "./main.ts";
import retriever from "./retriever.ts";

export const handler = async (line: string) => {
    const [cmd, ...args] = line.split(' ');
    switch (cmd) {
        case "config": switch (args[0]) {
            case "set":
                {
                    // Set the desired config based on the prop specified
                    try {
                        (config as unknown as { [p: string]: unknown })[args[1]] = typeof args[2] == "undefined" ? args[2] :
                            JSON.parse(args.slice(2).join(' '));
                    }
                    catch (e) {
                        if (e.name == "SyntaxError") console.error("Value for setting isn't json-compliant");
                        else console.error(e);
                    }
                }
                break;
            case "get":
                {
                    const value = (config as unknown as { [p: string]: unknown })[args[1]];
                    console.log(JSON.stringify(value));
                }
                break;
        } break;
        case "retrieve":
            {
                // Cancel scheduled iteration
                clearTimeout(global.nextIteration);
                global.nextIteration = NaN;
                // Retrieve the next wallpaper
                retriever();
            } break;
        case "exit":
            {
                Deno.exit(0);
            }    
        }
}