import path from "path";
import chalk from "chalk";
import Entry, { IEntrySchema } from "./model/Entry";
import { IPackageSchema, ISO639Code } from "./model/Package";
import { paths } from "./electron";
import Resource from "./model/Resource";
import { getLinkLayout, getLinkStyle } from "./database";
import Formula from "fparser";

export async function buildLayout(layoutTemplate: string, pkg: IPackageSchema, collectionNamespace: string, entry: IEntrySchema, lang: ISO639Code, cache: { [link: string]: IEntrySchema | null }, debug: boolean): Promise<string> {
    let depth = 0;
    const param1 = "[A-z0-9/.>$()*/+-]+";
    const param2 = "{{eval\\|[A-z0-9\\[\\].>$()*/+-]+}}";
    const commandRegex = new RegExp(`^\\s?(\\w+)(?:\\|(${param1}))?(?:\\|(${param2}|${param1}))?\\s*`);
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
                            layout += await getEntryAttribute(getParam<string>(command, 1), entry, cache);
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
                                image = await getEntryAttribute(getParam<string>(command, 1), entry, cache);
                            }
                            layout += path.join(paths.data, pkg.ns, "images", image);
                        }
                        break;
                    case "resource":
                        {
                            const isStatic = getParam<string>(command, 2);
                            let resource = null;
                            if (isStatic === "static") {
                                resource = await Resource.findOne({ packageId: pkg.ns, resId: getParam<string>(command, 1) }).lean().exec();
                                if (!resource?.values[lang]) {
                                    console.log(chalk.red.bgWhiteBright(`Couldn't find resource @${getParam<string>(command, 1)} in lang ${lang} on ${collectionNamespace} ${entry.bid}`));
                                }
                            }
                            else {
                                const attributePath = await getEntryAttribute(getParam<string>(command, 1), entry, cache);
                                resource = await Resource.findOne({ packageId: pkg.ns, resId: attributePath }).lean().exec();
                                if (!resource?.values[lang]) {
                                    console.log(chalk.red.bgWhiteBright(`Couldn't find resource @${attributePath} (${getParam<string>(command, 1)}) in lang ${lang} on ${collectionNamespace} ${entry.bid}`));
                                }
                            }
                            layout += escapeResource(resource?.values[lang] ?? "");
                        }
                        break;
                    case "preview":
                        {
                            const linkParam: string = await getEntryAttribute(getParam<string>(command, 1), entry, cache);
                            const link = linkParam.split(".");
                            if (link.length === 2) {
                                if (!cache[linkParam]) {
                                    cache[linkParam] = await Entry.findOne({ packageId: pkg.ns, collectionId: link[0], bid: link[1] }).lean().exec();
                                }
                                const linkedEntry = cache[linkParam];
                                if (linkedEntry) {
                                    const linkedLayout = await buildLayout(
                                        await getLinkLayout(pkg, link[0]!),
                                        pkg, link[0]!, linkedEntry, lang, cache, true);
                                    const linkedStyle = getLinkStyle(pkg, link[0]!);
                                    layout += (linkedLayout + linkedStyle);
                                }
                            }
                        }
                        break;
                    case "if":
                        {
                            const ifProp = await getEntryAttribute(getParam<string>(command, 1), entry, cache);
                            const compare = getParam<string>(command, 2);
                            if (compare === undefined) {
                                passesCheck = !!ifProp;
                            }
                            else {
                                if (compare.startsWith("{{eval")) {
                                    passesCheck = ifProp == await buildLayout(compare, pkg, collectionNamespace, entry, lang, cache, false);
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
                                forLoopCount = await getEntryAttribute(getParam<string>(command, 2) + ".length", entry, cache);
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
                    layout += await buildLayout(layoutTemplate.substring(ifStart, i), pkg, collectionNamespace, entry, lang, cache, false);
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
                    layout += await buildLayout(repeatPiece.replace(replaceValue, forLoopReplacement + j), pkg, collectionNamespace, entry, lang, cache, false);
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

/**
 * Gets an attribute from an entry. Can retrieve top-level and sub properties
 * @param attribute The attribute to retrieve, can be period-delimited
 * @param entry The entry to retrieve attributes from
 * @param cache A cache of linked entries
 * @returns The value of the attribute
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEntryAttribute(attribute: string, entry: IEntrySchema, cache: { [link: string]: IEntrySchema | null }): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let attrValue: any = entry;
    if (attribute == null) { return ""; }
    const attrPath = attribute.split(".").reverse();

    while (attrPath.length > 0 && typeof attrValue === "object") {
        const attr = attrPath.pop();
        if (attr) {
            // We're jumping to a new entry's attributes
            if (attr.includes("->")) {
                const jump = attr.split("->",);
                if (jump.length >= 2) {
                    const prevAttr: string = jump[0] ?? "";
                    const attrLink: string = attrValue[prevAttr];
                    // Cache links
                    if (attrLink && !cache[attrLink]) {
                        const link: string[] = attrLink.split(".");
                        if (link.length === 2) {
                            cache[attrLink] = await Entry.findOne({ packageId: entry.packageId, collectionId: link[0], bid: link[1] }).lean().exec();
                        }
                        else {
                            return ""; // bad link
                        }
                    }
                    attrValue = cache[attrLink];
                    if (!attrValue) {
                        return ""; // link not found
                    }
                    // queue remaining attributes
                    attrPath.push(jump.slice(1).join("->"));
                }
                else {

                    return ""; // bad jump
                }
            }
            // We're just getting a normal attribute
            else {
                attrValue = attrValue[attr];
            }
        }
    }
    return attrValue ?? "";
}

function escapeResource(resource: string | undefined): string | undefined {
    if (!resource) return undefined;
    return resource.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}