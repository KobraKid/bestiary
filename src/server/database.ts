import mongoose, { SortOrder } from "mongoose";
import path from "path";
import sass from "sass";
import { IpcMainInvokeEvent } from "electron";
import { readFile } from "fs/promises";
import { AsyncTemplateDelegate } from "handlebars-async-helpers";
import { hb, isDev, paths } from "./electron";
import Package, { IPackageMetadata, IPackageSchema, ISO639Code } from "../model/Package";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import Entry, { IEntryMetadata, IEntrySchema } from "../model/Entry";
import { ILandmark, IMap } from "../model/Map";
import Resource, { IResource } from "../model/Resource";
import { createOrLoadGroupConfig } from "./group";
import { pathToFileURL } from "url";

type EntryLayoutContext = { entry: Partial<IEntrySchema>, lang: ISO639Code };
type EntryLayoutFile = AsyncTemplateDelegate<EntryLayoutContext>;

const dbUrl = "mongodb://127.0.0.1:27017/bestiary";

const layoutCache: { [key: string]: AsyncTemplateDelegate<{ entry: IEntrySchema, lang: ISO639Code }> } = {};

/** Number of entries per page */
const entriesPerPage = 50;
/** Page number from 0 to page-1 */
let page = 0;
/** Number of pages for this group */
let pages = 0;

const defaultSortOption: ISortSettings = { "name": "None", "path": "bid", "sortType": "string", "direction": 1 };
let sortOption: ISortSettings = defaultSortOption;

const defaultGroupOption: IGroupSettings = { "name": "None", "path": "", "buckets": [] };
// TODO: figure out how to apply groupings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let groupOption: IGroupSettings = defaultGroupOption;

let isLoading = false;

export enum ViewType {
    view = "view",
    preview = "preview",
    any = ""
}

enum FileType {
    layout = "layout",
    script = "scripts",
    style = "style"
}

interface GroupEntryParams {
    event: IpcMainInvokeEvent,
    pkg: IPackageMetadata,
    group: IGroupMetadata,
    lang: ISO639Code,
    sortBy?: ISortSettings,
    groupBy?: IGroupSettings
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
 * Gets a group.
 * @param event The event that triggered this action.
 * @param pkg The current package.
 * @param group The group to retrieve.
 * @param _lang The language to display in.
 * @returns A group.
 */
export async function getGroup(event: IpcMainInvokeEvent, pkg: IPackageMetadata, group: IGroupMetadata): Promise<IGroupMetadata> {
    // Send page count
    pages = Math.max(Math.ceil(await Entry.countDocuments({ packageId: pkg.ns, groupId: group.ns }).exec() / entriesPerPage), 1);
    event.sender.send("pkg:update-page-count", pages);
    page = 0;
    event.sender.send("pkg:update-page-number", page);

    sortOption = defaultSortOption;
    groupOption = defaultGroupOption;

    const groupMetadata = pkg.groups.find(g => g.ns === group.ns);
    const groupStyle = await getStyle(pkg.ns, group.ns, ViewType.preview);
    const groupConfig = await createOrLoadGroupConfig(pkg, group);

    return {
        ...group,
        entries: group.entries || [],
        groupSettings: [
            { "name": "None", "path": "", "buckets": [] },
            ...groupMetadata?.groupSettings || []
        ],
        sortSettings: [
            { "name": "None", "path": "", "sortType": "string", "direction": -1 },
            ...groupMetadata?.sortSettings?.map(option => { return { ...option, direction: 1 as SortOrder }; }) || []
        ],
        style: groupStyle,
        config: groupConfig
    };
}

export async function prevPage(params: GroupEntryParams) {
    const { event } = params;
    if (isLoading) { return; }
    page = Math.max(page - 1, 0);
    event.sender.send("pkg:update-page-number", page);
    getGroupEntries(params);

}

export async function nextPage(params: GroupEntryParams) {
    const { event } = params;
    if (isLoading) { return; }
    page = Math.min(page + 1, pages - 1);
    event.sender.send("pkg:update-page-number", page);
    getGroupEntries(params);

}

/**
 * Loads each entry in a group and sends the results back to the event's original sender.
 * @param event The event that triggered this action.
 * @param pkg The current package.
 * @param group The current group.
 * @param lang The language to display in.
 */
export async function getGroupEntries(params: GroupEntryParams): Promise<void> {
    const { event, pkg, group, lang, sortBy, groupBy } = params;

    isLoading = true;

    if (sortBy) { sortOption = sortBy; }
    if (groupBy) { groupOption = groupBy; }

    const entries = await Entry.find({ packageId: pkg.ns, groupId: group.ns })
        .sort(sortOption.path ? [[sortOption.path, sortOption.direction]] : undefined)
        .collation({ locale: "en_US", numericOrdering: true })
        .skip(entriesPerPage * page)
        .limit(entriesPerPage)
        .lean()
        .exec();
    const layout = await getLayout(pkg.ns, group.ns, ViewType.preview);

    for (const entry of entries) {
        // const cache = {};
        const entryLayout = await layout({ entry, lang });
        const groupSettings = await Promise.all(
            group.groupSettings?.map(async setting => {
                return {
                    name: setting.name,
                    path: setting.path,
                    bucketValue: 0// await getAttribute(entry.packageId, setting.path, entry, cache)
                };
            }) ?? []
        );
        const sortSettings = await Promise.all(
            group.sortSettings?.map(async setting => {
                return {
                    name: setting.name,
                    path: setting.path,
                    value: 0// await getAttribute(entry.packageId, setting.path, entry, cache)
                };
            }) ?? []
        );
        event.sender.send("pkg:on-entry-loaded", {
            packageId: pkg.ns,
            groupId: group.ns,
            bid: entry.bid,
            groupSettings: groupSettings,
            sortSettings: sortSettings,
            layout: entryLayout
        });
    }
    isLoading = false;
}

/**
 * Whether we stopped loading entries.
 * @returns True if we have stopped loading entries for a group/page
 */
export function stopLoadingGroupEntries(): boolean {
    return !isLoading;
}

/**
 * Gets a single entry.
 * @param pkg The current package.
 * @param groupId The current group.
 * @param entryId The entry to retrieve.
 * @param lang The language to display in.
 * @returns An entry.
 */
export async function getEntry(pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> {
    const loadedEntry = await Entry.findOne({ packageId: pkg.ns, groupId, bid: entryId }).lean().exec();
    if (!loadedEntry) return null;

    if (pkg.groups.find(c => c.ns === groupId)?.isMap) {
        return getMap(pkg, loadedEntry, lang);
    }

    const entryLayout = await (await getLayout(pkg.ns, groupId, ViewType.view))({ entry: loadedEntry, lang });
    const entryScript = await (await getScript(pkg.ns, groupId))({ entry: loadedEntry, lang });
    const entryStyle = await getStyle(pkg.ns, groupId, ViewType.view, { entry: loadedEntry, lang });

    return {
        packageId: loadedEntry.packageId,
        groupId: loadedEntry.groupId,
        bid: loadedEntry.bid,
        layout: entryLayout,
        style: entryStyle,
        script: entryScript
    } as IEntryMetadata;
}

async function getMap(pkg: IPackageMetadata, entry: IEntrySchema, lang: ISO639Code): Promise<IMap> {
    const map = entry as Omit<IEntryMetadata, "layout" | "style" | "script" | "groupSettings" | "sortSettings"> as IMap;
    const name = await Resource.findOne({ packageId: pkg.ns, resId: map.name }).lean().exec() as IResource;
    const landmarks: ILandmark[] = [];
    for (const landmark of map.landmarks) {
        const link = landmark.link?.split(".");
        if (link && link.length === 2) {
            const landmarkEntry = await Entry.findOne({ packageId: pkg.ns, groupId: link[0], bid: link[1] }).lean().exec();
            if (landmarkEntry) {
                const layout = await getLayout(pkg.ns, link[0]!, ViewType.preview);
                const preview = await layout({ entry: landmarkEntry, lang });
                const style = getStyle(pkg.ns, link[0]!, ViewType.preview);
                landmarks.push({ ...landmark, preview: preview + style });
            }
        }
    }
    return {
        ...map,
        name: name.values[lang] ?? "",
        image: path.join(paths.data, pkg.ns, "images", map.image),
        landmarks
    };
}

/**
 * Gets the layout for an entry.
 * @param pkg The current package.
 * @param groupNamespace The current group's namespace.
 * @param viewType The type of view we are loading.
 * @returns An HTML string populated with attributes from the current entry.
 */
export async function getLayout(pkgId: string, groupNamespace: string, viewType: ViewType): Promise<EntryLayoutFile> {
    const filePath = getFilePath(pkgId, groupNamespace, FileType.layout, viewType);
    return getFile(pkgId, groupNamespace, filePath, viewType);
}

/**
 * Gets the script for an entry.
 * @param pkg The current package.
 * @param groupNamespace The current group's namespace.
 * @returns JavaScript code.
 */
export async function getScript(pkgId: string, groupNamespace: string): Promise<EntryLayoutFile> {
    const filePath = getFilePath(pkgId, groupNamespace, FileType.script, ViewType.any);
    return getFile(pkgId, groupNamespace, filePath, ViewType.any);
}

/**
 * Gets the style for an entry.
 * @param pkg The current package.
 * @param groupNamespace The current group's namespace.
 * @returns A <style></style> element.
 */
export async function getStyle(pkgId: string, groupNamespace: string, viewType: ViewType, context?: EntryLayoutContext): Promise<string> {
    const filePath = getFilePath(pkgId, groupNamespace, FileType.style, viewType);

    if (context) {
        const file = await getFile(pkgId, groupNamespace, filePath, viewType);
        const parsedFile = await file(context);
        return compileStyle(parsedFile, filePath);
    } else {
        try {
            return `<style>${sass.compile(path.join(paths.data, pkgId, "style", viewType, `${groupNamespace}.scss`)).css}</style>`;
        }
        catch (err) {
            console.log((err as Error).message);
        }
        return "";
    }
}

function compileStyle(style: string, filePath: string): string {
    try {
        return `<style>${sass.compileString(style, {
            importers: [{
                findFileUrl(url) {
                    if (!url.startsWith("..")) { return null; }
                    return new URL(url, pathToFileURL(filePath).toString());
                }
            }]
        }).css}</style>`;
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return "";
}

async function getFile(pkgId: string, groupNamespace: string, filePath: string, viewType: ViewType): Promise<EntryLayoutFile> {
    const key = `${pkgId}-${groupNamespace}-${viewType}`;
    if (!layoutCache[key] || isDev) {
        try {
            const file = await readFile(filePath, { encoding: "utf-8" });
            layoutCache[key] = hb.compile(file.toString(), { noEscape: true });
        }
        catch (err) {
            console.log((err as Error).message);
            layoutCache[key] = async () => { return ""; }; // cache an empty string to skip trying to re-get file on each cache miss
        }
    }
    return layoutCache[key]!; // we guarantee that the cache holds a value even when an error is thrown
}

function getFilePath(pkgId: string, groupNamespace: string, fileType: FileType, viewType: ViewType): string {
    const ext = (fileType === FileType.script) ? "js" : (fileType === FileType.style) ? "scss" : "hbs";
    return path.join(paths.data, pkgId, fileType, viewType, `${groupNamespace}.${ext}`);
}

/**
 * Gets an attribute from an entry.
 * @param entry The entry containing the attribute
 * @param attribute The attribute path to search for
 * @returns An attribute value if one is found, otherwise the entry
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAttribute(entry: any, attribute: string): Promise<unknown> {
    const attributePath = attribute.split(".");
    let attributeValue = entry;

    for (let i = 0; i < attributePath.length; i++) {
        const node = attributePath[i]!;

        if (attributeValue != null && attributeValue instanceof mongoose.Types.ObjectId) {
            attributeValue = await Entry.findById(attributeValue).lean().exec();
        }

        if (attributeValue != null && typeof attributeValue === "object" && node in attributeValue) {
            if (attributeValue[node] instanceof mongoose.Types.ObjectId) {
                attributeValue[node] = await Entry.findById(attributeValue[node]).lean().exec();
            }
            attributeValue = attributeValue[node];
        } else {
            break;
        }
    }

    if (attributeValue instanceof mongoose.Types.ObjectId) {
        attributeValue = await Entry.findById(attributeValue).lean().exec();
    }
    return attributeValue;
}