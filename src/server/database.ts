import mongoose from "mongoose";
import path from "path";
import sass from "sass";
import { readFile } from "fs/promises";
import { AsyncTemplateDelegate } from "handlebars-async-helpers";
import Package, { IPackageMetadata, IPackageSchema, ISO639Code } from "../model/Package";
import { ICollectionMetadata } from "../model/Collection";
import Entry, { IEntryMetadata, IEntrySchema } from "../model/Entry";
import { IpcMainInvokeEvent } from "electron";
import { hb, isDev, paths } from "./electron";

type EntryLayoutContext = { entry: IEntrySchema, lang: ISO639Code };
type EntryLayoutFile = AsyncTemplateDelegate<EntryLayoutContext>;

const dbUrl = "mongodb://127.0.0.1:27017/bestiary";

const layoutCache: { [key: string]: AsyncTemplateDelegate<{ entry: IEntrySchema, lang: ISO639Code }> } = {};

let isLoading = false;

export enum ViewType {
    view = "view",
    preview = "preview"
}

enum FileType {
    layout = "layout",
    script = "scripts",
    style = "style"
}

/**
 * Set up the database connection.
 */
export async function setup() {
    await mongoose.connect(dbUrl);
}

/**
 * Close the database connection.
 */
export async function disconnect() {
    await mongoose.disconnect();
}

/**
 * Gets the list of available packages.
 * @returns The list of available packages.
 */
export function getPackageList(): Promise<IPackageSchema[]> {
    return Package.find({}).transform(pkgs => {
        pkgs.forEach(pkg => {
            pkg.path = path.join(paths.data, pkg.ns);
        });
        return pkgs;
    }).lean().exec();
}

/**
 * Gets a collection.
 * @param pkg The current package.
 * @param collection The collection to retrieve.
 * @param _lang The language to display in.
 * @returns A collection.
 */
export async function getCollection(pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionMetadata> {
    const collectionStyle = getStyle(pkg.ns, collection.ns, ViewType.preview);
    return { ...collection, style: collectionStyle };
}

/**
 * Loads each entry in a collection and sends the results back to the event's original sender.
 * @param event The event that triggered this action.
 * @param pkg The current package.
 * @param collection The current collection.
 * @param lang The language to display in.
 */
export async function getCollectionEntries(event: IpcMainInvokeEvent, pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code): Promise<void> {
    isLoading = true;

    const entries = await Entry.find({ packageId: pkg.ns, collectionId: collection.ns }).lean().exec();
    const layout = await getLayout(pkg.ns, collection.ns, ViewType.preview);

    for (const entry of entries) {
        if (!isLoading) { break; }
        const cache = {};
        const entryLayout = await layout({ entry, lang });
        const groupings = await Promise.all(
            collection.groupings?.map(async grouping => {
                return {
                    name: grouping.name,
                    path: grouping.path,
                    bucketValue: await getAttribute(entry.packageId, grouping.path, entry, cache)
                };
            }) ?? []
        );
        const sortings = await Promise.all(
            collection.sortings?.map(async sorting => {
                return {
                    name: sorting.name,
                    path: sorting.path,
                    value: await getAttribute(entry.packageId, sorting.path, entry, cache)
                };
            }) ?? []
        );
        event.sender.send("pkg:load-collection-entry", {
            packageId: pkg.ns,
            collectionId: collection.ns,
            bid: entry.bid,
            groupings: groupings,
            sortings: sortings,
            layout: entryLayout
        });
    }
}

export function stopLoadingCollectionEntries(): void {
    isLoading = false;
}

/**
 * Gets a single entry.
 * @param pkg The current package.
 * @param collectionId The current collection.
 * @param entryId The entry to retrieve.
 * @param lang The language to display in.
 * @returns An entry.
 */
export async function getEntry(pkg: IPackageMetadata, collectionId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | null> {
    const loadedEntry = await Entry.findOne({ packageId: pkg.ns, collectionId: collectionId, bid: entryId }).lean().exec();
    if (!loadedEntry) return null;

    const entryLayout = await (await getLayout(pkg.ns, collectionId, ViewType.view))({ entry: loadedEntry, lang });
    const entryScript = await (await getScript(pkg.ns, collectionId))({ entry: loadedEntry, lang });
    const entryStyle = getStyle(pkg.ns, collectionId, ViewType.view);

    return { packageId: loadedEntry.packageId, collectionId: loadedEntry.collectionId, bid: loadedEntry.bid, layout: entryLayout, style: entryStyle, script: entryScript };
}

/**
 * Gets the layout for an entry.
 * @param pkg The current package.
 * @param collectionNamespace The current collection's namespace.
 * @param viewType The type of view we are loading.
 * @returns An HTML string populated with attributes from the current entry.
 */
export async function getLayout(pkgId: string, collectionNamespace: string, viewType: ViewType): Promise<EntryLayoutFile> {
    return getFile(pkgId, collectionNamespace, FileType.layout, viewType);
}

/**
 * Gets the script for an entry.
 * @param pkg The current package.
 * @param collectionNamespace The current collection's namespace.
 * @returns JavaScript code.
 */
export async function getScript(pkgId: string, collectionNamespace: string): Promise<EntryLayoutFile> {
    return getFile(pkgId, collectionNamespace, FileType.script);
}

/**
 * Gets the style for an entry.
 * @param pkg The current package.
 * @param collectionNamespace The current collection's namespace.
 * @returns A <style></style> element.
 */
export function getStyle(pkgId: string, collectionNamespace: string, viewType: ViewType): string | undefined {
    try {
        return `<style>${sass.compile(path.join(paths.data, pkgId, "style", viewType, `${collectionNamespace}.scss`)).css}</style>`;
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return undefined;
}

async function getFile(pkgId: string, collectionNamespace: string, fileType: FileType, viewType?: ViewType): Promise<EntryLayoutFile> {
    const key = `${pkgId}${collectionNamespace}${viewType}`;
    if (!layoutCache[key] || isDev) {
        try {
            const file = await readFile(path.join(paths.data, pkgId, fileType, viewType ?? "", `${collectionNamespace}.${fileType === FileType.script ? "js" : "hbs"}`), { encoding: "utf-8" });
            layoutCache[key] = hb.compile(file.toString());
        }
        catch (err) {
            console.log((err as Error).message);
            layoutCache[key] = async () => { return ""; }; // cache an empty string to skip trying to re-get file on each cache miss
        }
    }
    return layoutCache[key]!; // we guarantee that the cache holds a value even when an error is thrown
}

/**
 * Gets an attribute from an Entry (or generic object),
 * can retrieve top-level and sub properties.
 * 
 * @param attribute The attribute to retrieve, can be period- or arrow-delimited.
 * @param obj The object to retrieve attributes from.
 * @param cache A cache of linked entries.
 * @returns The value of the attribute.
 */
export async function getAttribute(packageId: string, attribute: string, obj: object, cache: { [link: string]: object | null }): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let attrValue: any = obj;
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
                            cache[attrLink] = await Entry.findOne({ packageId, collectionId: link[0], bid: link[1] }).lean().exec();
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