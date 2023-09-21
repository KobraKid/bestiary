import asyncHelpers, { AsyncHandlebars, HelperOptions } from "handlebars-async-helpers";
import chalk from "chalk";
import Formula from "fparser";
import path from "path";
import { SafeString } from "handlebars";
import { paths } from "./electron";
import Entry, { IEntrySchema } from "./model/Entry";
import { ISO639Code } from "./model/Package";
import Resource from "./model/Resource";
import { ViewType, getAttribute, getLayout, getStyle } from "./database";

function getDataFromOptions<T>(options: HelperOptions, data: string): T {
    return options.data.root[data];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDelegateParams(context?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, options?: any): { context: any, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any, options: HelperOptions } {
    // All args are defined
    if (typeof options !== "undefined" && "data" in options && "hash" in options) {
        return { context, arg1, arg2, arg3, arg4, arg5, options };
    }
    // Context + arg1-arg4 are defined
    else if (typeof arg5 !== "undefined" && "data" in arg5 && "hash" in arg5) {
        return { context, arg1, arg2, arg3, arg4, arg5: undefined, options: arg5 };
    }
    // Context + arg1-arg3 are defined
    else if (typeof arg4 !== "undefined" && "data" in arg4 && "hash" in arg4) {
        return { context, arg1, arg2, arg3, arg4: undefined, arg5: undefined, options: arg4 };
    }
    // Context + arg1-arg2 are defined
    else if (typeof arg3 !== "undefined" && "data" in arg3 && "hash" in arg3) {
        return { context, arg1, arg2, arg3: undefined, arg4: undefined, arg5: undefined, options: arg3 };
    }
    // Context + arg1 are defined
    else if (typeof arg2 !== "undefined" && "data" in arg2 && "hash" in arg2) {
        return { context, arg1, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: arg2 };
    }
    // Context is defined
    else if (typeof arg1 !== "undefined" && "data" in arg1 && "hash" in arg1) {
        return { context, arg1: undefined, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: arg1 };
    }
    // No args defined, context is actually options parameter
    return { context: undefined, arg1: undefined, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: context };
}

export function registerHelpers(handlebars: typeof Handlebars): AsyncHandlebars {
    const hb = asyncHelpers(handlebars);

    hb.registerHelper("each", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        // console.log("###OPTIONS###", options, "###ARGS###", _context, _arg1, _arg2, _arg3, _arg4, _arg5);
        return await __eachHelper(hb, context, options);
    });

    hb.registerHelper("view", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __viewHelper(hb, context, options);
    });

    hb.registerHelper("image", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __imageHelper(hb, context, options);
    });

    hb.registerHelper("string", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __stringHelper(hb, context, options);
    });

    return hb;
}

async function __eachHelper(_hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    if (!entry) { return ""; }

    let attributePath = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            attributePath = options.hash[key];
        }
    });

    const array: [] = await getAttribute(entry.packageId, attributePath, context ?? entry, {}) ?? this;
    let result = "";

    for (let i = 0; i < array.length; i++) {
        result += await options.fn(array[i], { data: options.data, blockParams: [array[i], i] });
    }

    return result;
}

async function __viewHelper(hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const lang = getDataFromOptions<ISO639Code>(options, "lang");
    if (entry) {
        const [linkedCollectionId, linkedBid]: [string, string] = (await getAttribute(entry.packageId, options.hash["path"], context ?? entry, {}) as string).split(".") as [string, string];
        const linkedEntry = await Entry.findOne({ packageId: entry.packageId, collectionId: linkedCollectionId, bid: linkedBid }).lean().exec();
        if (linkedEntry) {
            return new hb.SafeString(
                await buildLayout(
                    await getLayout(linkedEntry.packageId, linkedCollectionId, ViewType.preview),
                    linkedEntry.packageId, linkedCollectionId, linkedEntry, lang, {}, true
                )
                + await buildLayout(
                    getStyle(linkedEntry.packageId, linkedCollectionId, ViewType.preview),
                    linkedEntry.packageId, linkedCollectionId, linkedEntry, lang, {}, false
                )
            );
        }
    }
    return "";
}

async function __imageHelper(hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");

    if (!entry) { return ""; }

    // full image path
    let src = "";

    // constructed image path (prefix + path + suffix)
    let prefix = "";
    let attributePath = "";
    let suffix = "";

    const attributes: string[] = [];

    Object.keys(options.hash).forEach(key => {
        if (key === "src") {
            src = options.hash[key];
        }
        else if (key === "prefix") {
            prefix = options.hash[key];
        }
        else if (key === "path") {
            attributePath = options.hash[key];
        }
        else if (key === "suffix") {
            suffix = options.hash[key];
        }
        else {
            attributes.push(`${key}="${options.hash[key]}"`);
        }
    });

    if (src === "") {
        src = prefix + await getAttribute(entry.packageId, attributePath, context ?? entry, {}) + suffix;
    }

    return new hb.SafeString(`<img src="${path.join(paths.data, entry.packageId, "images", src)}" ${attributes.join(" ")} />`);
}

async function __stringHelper(_hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const lang = getDataFromOptions<ISO639Code>(options, "lang");

    let path = "";
    let resId = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            path = options.hash[key];
        }
        else if (key === "resId") {
            resId = options.hash[key];
        }
    });

    if (resId === "" && path !== "") {
        resId = await getAttribute(entry.packageId, path, context ?? entry, {}) as string;
    }

    const resource = await Resource.findOne({ packageId: entry.packageId, resId }).lean().exec();
    return resource?.values[lang] ?? "";
}

export async function buildLayout(layoutTemplate: string | undefined, pkgId: string, collectionNamespace: string, entry: IEntrySchema, lang: ISO639Code, cache: { [link: string]: IEntrySchema | null }, debug: boolean): Promise<string> {
    if (layoutTemplate === null || layoutTemplate === undefined) return "";

    let depth = 0;
    const param = "[A-z0-9\\[\\].>$()*/+-]+";
    const evalParam = `{{eval\\|${param}}}`;
    const attrParam = `{{attribute\\|${param}}}`;
    const commandRegex = new RegExp(`^\\s?(\\w+)(?:\\|(${param}))?(?:\\|(${evalParam}|${attrParam}|${param}))?\\s*`);
    let layout = "";

    let forLoopStart = 0;
    let forLoopDepth = 0;
    let forLoopCount = 0;
    let forLoopProp = "";
    let forLoopReplacement = "";

    let ifStart = 0;
    let ifDepth = 0;
    let passesCheck = false;

    const startTime = debug ? performance.now() : 0;
    let charsParsed = 0;

    for (let i = 0; i < layoutTemplate.length; i++) {
        charsParsed++;
        const char = layoutTemplate.charAt(i);
        if (char === "{" && layoutTemplate.charAt(i + 1) === "{") {
            i++; // skip next character, since we already checked it
            depth++; // increase nested {{ }} depth counter

            if (ifDepth || forLoopDepth) { continue; } // we'll parse the inner text recursively later

            const command = layoutTemplate.substring(++i).match(commandRegex);
            if (command) {
                const commandName = command[1];
                switch (commandName) {
                    case "attribute":
                        {
                            layout += await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache);
                        }
                        break;
                    case "eval":
                        {
                            layout += Formula.calc(getParam<string>(command, 1), {});
                        }
                        break;
                    case "image":
                        {
                            const isStatic = getParam<string>(command, 2);
                            let image = "";
                            if (isStatic === "static") {
                                image = getParam<string>(command, 1);
                            }
                            else {
                                image = await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache) as string;
                            }
                            layout += paths.data.replace(/\\/g, "/") + "/" + pkgId + "/" + "images" + "/" + image; // path.join(paths.data, pkgId.ns, "images", image);
                        }
                        break;
                    case "resource":
                        {
                            const isStatic = getParam<string>(command, 2);
                            let resource = null;
                            if (isStatic === "static") {
                                resource = await Resource.findOne({ packageId: pkgId, resId: getParam<string>(command, 1) }).lean().exec();
                                if (!resource?.values[lang]) {
                                    console.log(chalk.red.bgWhiteBright(`Couldn't find resource @${getParam<string>(command, 1)} in lang ${lang} on ${collectionNamespace} ${entry.bid}`));
                                }
                            }
                            else {
                                const attributePath = await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache);
                                resource = await Resource.findOne({ packageId: pkgId, resId: attributePath }).lean().exec();
                                if (!resource?.values[lang]) {
                                    console.log(chalk.red.bgWhiteBright(`Couldn't find resource @${attributePath} (${getParam<string>(command, 1)}) in lang ${lang} on ${collectionNamespace} ${entry.bid}`));
                                }
                            }
                            layout += escapeResource(resource?.values[lang] ?? "");
                        }
                        break;
                    case "preview":
                        {
                            const linkParam = await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache) as string;
                            const link = linkParam.split(".");
                            if (link.length === 2) {
                                if (!cache[linkParam]) {
                                    cache[linkParam] = await Entry.findOne({ packageId: pkgId, collectionId: link[0], bid: link[1] }).lean().exec();
                                }
                                const linkedEntry = cache[linkParam];
                                if (linkedEntry) {
                                    layout +=
                                        await buildLayout(await getLayout(pkgId, link[0]!, ViewType.preview), pkgId, link[0]!, linkedEntry, lang, cache, false)
                                        + await buildLayout(getStyle(pkgId, link[0]!, ViewType.preview), pkgId, link[0]!, linkedEntry, lang, cache, false);
                                }
                            }
                        }
                        break;
                    case "link":
                        {
                            const link = await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache) as string;
                            layout += `data-bestiary-link="${link}"`;
                        }
                        break;
                    case "if":
                        {
                            const ifProp = await getAttribute(entry.packageId, getParam<string>(command, 1), entry, cache);
                            const compare = getParam<string>(command, 2);
                            if (compare === undefined) {
                                passesCheck = !!ifProp;
                            }
                            else {
                                if (compare.startsWith("{{eval") || compare.startsWith("{{attribute")) {
                                    passesCheck = ifProp == await buildLayout(compare, pkgId, collectionNamespace, entry, lang, cache, false);
                                }
                                else {
                                    passesCheck = ifProp == compare;
                                }
                            }
                            ifStart = i + command[0].length;
                            ifDepth = depth;
                        }
                        break;
                    case "for":
                        {
                            forLoopProp = getParam<string>(command, 1);
                            const range = getParam<string>(command, 2).match(/^\$range\((\d+)\)/);
                            if (range?.length === 2) {
                                forLoopCount = parseInt(range[1]!);
                                forLoopReplacement = ""; // replace prop with #
                            }
                            else {
                                forLoopCount = await getAttribute(entry.packageId, getParam<string>(command, 2) + ".length", entry, cache) as number;
                                forLoopReplacement = getParam<string>(command, 2) + "."; // replace prop with attribute.#
                            }
                            forLoopStart = i + command[0].length; // add the full length of the matched command
                            forLoopDepth = depth;
                        }
                        break;

                }
                i += command[0].length - 1; // skip remaining command characters
            }
        }
        else if (char === "}" && layoutTemplate.charAt(i + 1) === "}") {
            if (ifDepth === depth) {
                if (passesCheck) {
                    layout += await buildLayout(layoutTemplate.substring(ifStart, i), pkgId, collectionNamespace, entry, lang, cache, false);
                }
                ifDepth = 0;
            }
            if (forLoopDepth === depth) {
                // get repeated section
                const repeatPiece = layoutTemplate.substring(forLoopStart, i);
                // get text to replace
                const replaceValue = new RegExp(`\\[\\[${forLoopProp}\\]\\]`, "g");
                for (let j = 0; j < forLoopCount; j++) {
                    // build the sub-layout for each repeated piece
                    layout += await buildLayout(repeatPiece.replace(replaceValue, forLoopReplacement + j), pkgId, collectionNamespace, entry, lang, cache, false);
                }
                forLoopDepth = 0;
            }
            depth--; // decrease nested {{ }} depth counter
            i++; // skip next character, since we already checked it
        }
        else if (depth === 0) {
            // only accumulate if we're in raw HTML, not inside a command
            layout += char;
        }
    }

    if (debug) {
        console.log(chalk.gray(`Loading ${collectionNamespace}.${entry.bid}
    v
    |- Computing took ${chalk.yellow((performance.now() - startTime).toFixed(2))} ms
    |- ${chalk.white(Object.keys(cache).length)} objects in cache
    |- ${charsParsed} characters parsed, ${layoutTemplate.length - charsParsed} characters skipped (${(1 - (charsParsed / layoutTemplate.length)).toFixed(2)}%)
    ^`));
    }
    return layout;
}

function getParam<T>(command: RegExpMatchArray, paramNumber: number): T {
    return command[paramNumber + 1]! as T;
}

function escapeResource(resource: string | undefined): string | undefined {
    if (!resource) return undefined;
    return resource.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}