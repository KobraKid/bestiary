import mongoose from "mongoose";
import path from "path";
import chalk from "chalk";
import sass from "sass";
import { readFile } from "fs/promises";
import Package, { IPackageSchema, ISO639Code } from "./model/Package";
import { ICollectionMetadata } from "./model/Collection";
import Entry, { IEntryMetadata, IEntrySchema } from "./model/Entry";
import Resource from "./model/Resource";
import { IpcMainInvokeEvent } from "electron";
import { isDev, paths } from "./electron";
import { buildLayout } from "./layout_builder";

const dbUrl = "mongodb://127.0.0.1:27017/bestiary";

let isLoading = false;

enum AttributeModifier {
    /** An image located in the collection's image subfolder */
    image = "image",
    /** An image located in any other directory */
    rawimg = "rawimg",
    /** A resource image which should be displayed based on the current language */
    resimg = "resourceimage",
    /** The current language */
    lang = "lang",
    /** A resource string based on the entry */
    resource = "resource",
    /** A resource string not based on an entry */
    rawresource = "rawresource",
    /** Starts a repeating section */
    repeat = "repeat",
    /** Ends a repeating section */
    endrepeat = "endrepeat",
    /** A link to another entry (possibly in another collection) */
    link = "link",
    /** Starts an optional section, only displaying if the given attribute exists on the entry */
    if = "if",
    /** Ends an optional section */
    endif = "endif"
}

/**
 * Set up the database connection
 */
export async function setup() {
    await mongoose.connect(dbUrl);
}

/**
 * Close the database connection
 */
export async function disconnect() {
    await mongoose.disconnect();
}

/**
 * Gets the list of available packages
 * @returns The list of available packages
 */
export function getPackageList(): Promise<IPackageSchema[]> {
    return Package.find({}).transform(pkgs => {
        pkgs.forEach(pkg => {
            pkg.path = path.join(paths.data, pkg.ns);
            pkg.collections = pkg.collections.filter(c => !c.hidden);
        });
        return pkgs;
    }).lean().exec();
}

/**
 * Gets a collection
 * @param pkg The current package
 * @param collection The collection to retrieve
 * @param _lang The language to display in
 * @returns A collection
 */
export async function getCollection(pkg: IPackageSchema, collection: ICollectionMetadata, _lang: ISO639Code): Promise<ICollectionMetadata> {
    const collectionStyle = getCollectionStyle(pkg, collection.ns);
    return { ...collection, style: collectionStyle };
}

/**
 * Loads each entry in a collection and sends the results back to the event's original sender
 * @param event The event that triggered this action
 * @param pkg The current package
 * @param collection The current collection
 * @param lang The language to display in
 */
export async function getCollectionEntries(event: IpcMainInvokeEvent, pkg: IPackageSchema, collection: ICollectionMetadata, lang: ISO639Code): Promise<void> {
    isLoading = true;

    const entries = await Entry.find({ packageId: pkg.ns, collectionId: collection.ns }).lean().exec();
    const collectionLayoutTemplate = await getCollectionLayout(pkg, collection.ns);

    for (const entry of entries) {
        if (!isLoading) { break; }
        const entryLayout = await populateEntryAttributes(collectionLayoutTemplate, pkg, collection.ns, entry, lang, false);
        event.sender.send("pkg:load-collection-entry", { packageId: pkg.ns, collectionId: collection.ns, bid: entry.bid, layout: entryLayout });
    }
}

/**
 * Gets the 'preview' layout template for entries in a collection
 * @param pkg The current package
 * @param collectionNamespace The current collection's namespace
 * @returns A template HTML string
 */
async function getCollectionLayout(pkg: IPackageSchema, collectionNamespace: string): Promise<string> {
    let collectionLayoutTemplate = "";
    try {
        collectionLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, "layout", "preview", `${collectionNamespace}.html`), { encoding: "utf-8" });
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return collectionLayoutTemplate;
}

/**
 * Gets the 'preview' style for entries in a collection
 * @param pkg The current package
 * @param collectionNamespace The current collection's namespace
 * @returns A <style></style> element
 */
function getCollectionStyle(pkg: IPackageSchema, collectionNamespace: string): string {
    let collectionLayoutStyle = "";
    try {
        collectionLayoutStyle = sass.compile(path.join(paths.data, pkg.ns, "style", "preview", `${collectionNamespace}.scss`)).css;
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return `<style>${collectionLayoutStyle}</style>`;
}

export function stopLoadingCollectionEntries(): void {
    isLoading = false;
}

/**
 * Gets a single entry
 * @param pkg The current package
 * @param collection The current collection
 * @param entryId The entry to retrieve
 * @param lang The language to display in
 * @returns An entry
 */
export async function getEntry(pkg: IPackageSchema, collection: ICollectionMetadata, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | null> {
    const loadedEntry = await Entry.findOne({ packageId: pkg.ns, collectionId: collection.ns, bid: entryId }).lean().exec();
    if (!loadedEntry) return null;

    const entryLayout = await getEntryLayout(pkg, collection.ns, loadedEntry, lang);
    const entryStyle = getEntryStyle(pkg, collection.ns);

    return { packageId: loadedEntry.packageId, collectionId: loadedEntry.collectionId, bid: loadedEntry.bid, layout: entryLayout, style: entryStyle };
}

/**
 * Gets the 'view' layout for an entry
 * @param pkg The current package
 * @param collectionNamespace The current collection's namespace
 * @param entry The current entry
 * @param lang The language to display in
 * @returns An HTML string populated with attributes from the current entry
 */
async function getEntryLayout(pkg: IPackageSchema, collectionNamespace: string, entry: IEntrySchema, lang: ISO639Code): Promise<string> {
    let entryLayoutTemplate = "";
    try {
        entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, "layout", "view", `${collectionNamespace}.html`), { encoding: "utf-8" });
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return await buildLayout(entryLayoutTemplate, pkg, collectionNamespace, entry, lang, {}, false); // await populateEntryAttributes(entryLayoutTemplate, pkg, collectionNamespace, entry, lang, true);
}

/**
 * Gets the 'view' style for an entry
 * @param pkg The current package
 * @param collectionNamespace The current collection's namespace
 * @returns A <style></style> element
 */
function getEntryStyle(pkg: IPackageSchema, collectionNamespace: string): string {
    let entryStyle = "";
    try {
        entryStyle = sass.compile(path.join(paths.data, pkg.ns, "style", "view", `${collectionNamespace}.scss`)).css;
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return `<style>${entryStyle}</style>`;
}

/**
 * Gets the 'link' layout for an entry - falls back to the 'preview' layout if a 'link' layout doesn't exist
 * @param pkg The current package
 * @param collectionNamespace The linked entry's collection namespace
 * @param entry The linked entry
 * @param lang The language to display in
 * @returns An HTML string populated with attributes from the linked entry
 */
export async function getLinkLayout(pkg: IPackageSchema, collectionNamespace: string): Promise<string> {
    let linkLayoutTemplate = "";
    try {
        linkLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, "layout", "link", `${collectionNamespace}.html`), { encoding: "utf-8" });
    }
    catch (err) {
        linkLayoutTemplate = await getCollectionLayout(pkg, collectionNamespace);
    }
    return linkLayoutTemplate;
}

/**
 * Gets the 'link' style for an entry
 * @param pkg The current package
 * @param collectionNamespace The linked entry's collection namespace
 * @returns A <style></style> element
 */
export function getLinkStyle(pkg: IPackageSchema, collectionNamespace: string): string {
    let linkStyle = "";
    try {
        linkStyle = `<style>${sass.compile(path.join(paths.data, pkg.ns, "style", "link", `${collectionNamespace}.scss`)).css}</style>`;
    }
    catch (err) {
        linkStyle = getCollectionStyle(pkg, collectionNamespace);
    }
    return linkStyle;
}

/**
 * Removes spaces between HTML tags
 * @param layout The layout HTML string
 * @returns The layout HTML string with spaces removed between tags
 */
function removeSpaceBetweenTags(layout: string): string {
    return layout.replace(/>\s+|\s+</g, match => match.trim());
}

interface IReplacement {
    start: number,
    end: number,
    replacement: string
}

/**
 * Populates an entry template with its attributes
 * @param layoutTemplate The layout template
 * @param pkg The current package
 * @param collectionNamespace The collection namespace
 * @param entry The current entry
 * @param lang The language to inject resource strings in
 * @returns The entry as a string of HTML
 */
async function populateEntryAttributes(layoutTemplate: string, pkg: IPackageSchema, collectionNamespace: string, entry: IEntrySchema, lang: ISO639Code, debug: boolean): Promise<string> {
    let entryLayout = layoutTemplate;
    const linkCache = {};
    const startTime = debug ? performance.now() : 0;

    let replacements: IReplacement[] = [];
    const ifdefs = entryLayout.matchAll(new RegExp(`\\{([A-z0-9.$->_]+)\\|${AttributeModifier.if}\\|?([A-z0-9.$-_]+)?\\}`, "g"));
    for (const ifdef of ifdefs) {
        if (ifdef.length >= 2 && ifdef.index !== undefined && typeof ifdef[0] === "string" && typeof ifdef[1] === "string") {
            const startIf = ifdef.index;
            const endIf = entryLayout.indexOf(`{${ifdef[1]}|endif}`, startIf);
            const optionalText = entryLayout.substring(startIf + ifdef[0].length, endIf);
            const attrValue = await getEntryAttribute(ifdef[1], entry, linkCache);
            if (ifdef.length > 2 && typeof ifdef[2] === "string") {
                const matchValue = ifdef[2];
                replacements.push({
                    start: startIf,
                    end: endIf + ifdef[1].length + 8,
                    replacement: (attrValue == matchValue) ? optionalText : ""
                });
            }
            else {
                replacements.push({
                    start: startIf,
                    end: endIf + ifdef[0].length + 3,
                    replacement: (attrValue !== null && attrValue !== undefined) ? optionalText : ""
                });
            }
        }
    }
    replacements.reverse();
    replacements.forEach(replacement => {
        entryLayout = entryLayout.substring(0, replacement.start) + replacement.replacement + entryLayout.substring(replacement.end);
    });

    const ifTime = debug ? performance.now() : 0;

    replacements = [];
    const repeats = entryLayout.matchAll(new RegExp(`\\{([A-z0-9.$->_]+)\\|${AttributeModifier.repeat}\\}`, "g"));
    for (const repeat of repeats) {
        if (repeat.length >= 2 && repeat.index !== undefined && typeof repeat[0] === "string" && typeof repeat[1] === "string") {
            // Find start and end of repeat section
            const startRepeat = repeat.index;
            const endRepeat = entryLayout.indexOf(`{${repeat[1]}|endrepeat}`, startRepeat);
            const repeatCount = (await getEntryAttribute(repeat[1], entry, linkCache)).length;
            const repeatText = entryLayout.substring(startRepeat + repeat[0].length, endRepeat);
            let accumulatedText = "";
            // Replace $ with an index
            for (let i = 0; i < repeatCount; i++) {
                accumulatedText += repeatText.replace(new RegExp(`\\{${repeat[1]}\\.\\$`, "g"), `{${repeat[1]}.${i}`);
            }
            replacements.push({
                start: startRepeat,
                end: endRepeat + repeat[0].length + 3,
                replacement: accumulatedText
            });
        }
    }
    replacements.reverse();
    replacements.forEach(replacement => entryLayout = entryLayout.substring(0, replacement.start) + replacement.replacement + entryLayout.substring(replacement.end));

    const repeatTime = debug ? performance.now() : 0;

    const modifiers = `(${Object.keys(AttributeModifier).join("|")})`;
    const attributes = entryLayout.matchAll(new RegExp(`\\{([A-z0-9.$->/_]+)(?:\\|${modifiers})?\\}`, "g"));

    for (const attr of attributes) {
        if (attr.length > 1 && typeof attr[0] === "string" && typeof attr[1] === "string") {
            const attrValue = await getEntryAttribute(attr[1], entry, linkCache);
            // the attribtue has a modifier
            if (attr.length >= 3 && typeof attr[2] === "string") {
                switch (attr[2] as AttributeModifier) {
                    case AttributeModifier.link:
                        {
                            const link = attrValue?.split(".") ?? [];
                            if (link.length === 2) {
                                const linkCollection = link[0]!;
                                const linkEntry = await Entry.findOne({ packageId: pkg.ns, collectionId: linkCollection, bid: link[1] }).exec();
                                if (linkEntry) {
                                    const linkLayout = await getLinkLayout(pkg, linkCollection);
                                    const linkStyle = getLinkStyle(pkg, linkCollection);
                                    entryLayout = entryLayout.replace(attr[0], linkLayout + linkStyle);
                                }
                                else {
                                    entryLayout = entryLayout.replace(attr[0], attributeError("Link not found", link.toString()));
                                }
                            }
                            else {
                                entryLayout = entryLayout.replace(attr[0], attributeError("No link available", attrValue));
                            }
                        }
                        break;
                    case AttributeModifier.image:
                        // Pull from the image folder
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, pkg.ns, "images", attrValue));
                        break;
                    case AttributeModifier.rawimg:
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, pkg.ns, "images", ...attr[1].split("/")));
                        break;
                    case AttributeModifier.resource:
                        {
                            // Get the correct resource for the current language
                            const resource = await Resource.findOne({ packageId: pkg.ns, resId: attrValue }).lean().exec();
                            if (!resource?.values[lang]) {
                                console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attrValue ?? "<unknown>"} (${attr[1]}) in lang ${lang} on ${collectionNamespace} ${entry.bid}`));
                            }
                            entryLayout = entryLayout.replace(attr[0], escapeResource(resource?.values[lang]) ?? attributeError("Resource not found", attrValue));
                        }
                        break;
                    case AttributeModifier.rawresource:
                        {
                            // Get the correct resource for the current language
                            const rawresource = await Resource.findOne({ packageId: pkg.ns, resId: attr[1] }).lean().exec();
                            if (!rawresource?.values[lang]) {
                                console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attr[1]} in lang ${lang}`));
                            }
                            entryLayout = entryLayout.replace(attr[0], escapeResource(rawresource?.values[lang]) ?? attributeError("Resource not found", attr[1]));
                        }
                        break;
                    case AttributeModifier.lang:
                        entryLayout = entryLayout.replace(attr[0], lang);
                        break;
                }
            }
            // the attribute should be placed directly into the layout
            else {
                entryLayout = entryLayout.replace(attr[0], attrValue);
            }
        }
    }
    if (debug) {
        console.log(chalk.gray(`Loading ${collectionNamespace}.${entry.bid}
    v
    |- Computing ifs took        ${chalk.red((ifTime - startTime).toFixed(2))} ms
    |- Computing repeats took    ${chalk.green((repeatTime - ifTime).toFixed(2))} ms
    |- Computing attributes took ${chalk.blue((performance.now() - repeatTime).toFixed(2))} ms
    |- ${chalk.white(Object.keys(linkCache).length)} objects in cache
    ^`));
    }
    return entryLayout;
}

/**
 * Gets an attribute from an entry. Can retrieve top-level and sub properties
 * @param attribute The attribute to retrieve, can be period-delimited
 * @param entry The entry to retrieve attributes from
 * @param cache A cache of linked entries
 * @returns The value of the attribute
 */
async function getEntryAttribute(attribute: string, entry: IEntrySchema, cache: { [link: string]: IEntrySchema | null }): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let attrValue: any = entry;
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
                    if (!cache[attrLink]) {
                        const link: string[] = attrLink.split(".");
                        if (link.length === 2) {
                            cache[attrLink] = await Entry.findOne({ packageId: entry.packageId, collectionId: link[0], bid: link[1] }).exec();
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

/**
 * Displays an error when an attribute fails to parse
 * @param err The error
 * @param attr The attribute that produced the error
 * @returns A stylized error string
 */
function attributeError(err: string, attr: string): string {
    return isDev ? `<span style='color:red;background-color:black;font-weight:bold;'>&lt;ERROR: ${err} [${attr}]&gt;</span>` : "";
}

function escapeResource(resource: string | undefined): string | undefined {
    if (!resource) return undefined;
    return resource.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}