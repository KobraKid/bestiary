import { IpcMainInvokeEvent } from "electron";
import { readFile } from "fs/promises";
import { AsyncTemplateDelegate } from "handlebars-async-helpers";
import mongoose, { SortOrder } from "mongoose";
import path from "path";
import sass from "sass";
import { pathToFileURL } from "url";
import Entry, { IEntryMetadata, IEntrySchema } from "../model/Entry";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../model/Group";
import Layout from "../model/Layout";
import { ILandmark, IMap } from "../model/Map";
import Package, { IPackageMetadata, IPackageSchema, ISO639Code } from "../model/Package";
import Resource from "../model/Resource";
import { hb, isDev, paths } from "./electron";
import { createOrLoadGroupConfig } from "./group";

type EntryLayoutContext = { entry: Partial<IEntrySchema>, lang: ISO639Code, scripts?: { [key: string]: string } };
type EntryLayoutFile = AsyncTemplateDelegate<EntryLayoutContext>;

const layoutCache: { [key: string]: AsyncTemplateDelegate<{ entry: IEntrySchema, lang: ISO639Code }> } = {};
const entryCache: { [key: string]: [layout: string, style: string, script: string] } = {};

/** Number of entries per page */
const entriesPerPage = 50;
/** Page number from 0 to page-1 */
let page = 0;
/** Number of pages for this group */
let pages = 0;

const defaultSortOption: [string, SortOrder][] = [["bid", 1]];
let sortOption: [string, SortOrder][] = defaultSortOption;

const defaultGroupOption: IGroupSettings = { "name": "None", "path": "", "buckets": [] };
// TODO: figure out how to apply groupings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let groupOption: IGroupSettings = defaultGroupOption;

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
    pkg: IPackageMetadata,
    group: IGroupMetadata,
    lang: ISO639Code,
    sortBy?: ISortSettings,
    groupBy?: IGroupSettings
}

/**
 * Set up the database connection.
 * @param server The server connection string
 * @param username The username to connect with
 * @param password The password to connect with
 */
export async function setup(server: string, username: string, password: string): Promise<void> {
    const connectionState = mongoose.connection.readyState;
    if (connectionState === mongoose.ConnectionStates.disconnected || connectionState === mongoose.ConnectionStates.uninitialized) {
        const encodedServerUrl = server.replace("<username>", username).replace("<password>", password);
        await mongoose.connect(encodedServerUrl, { dbName: "bestiary" });
    }
    else {
        await disconnect();
        setup(server, username, password);
    }
}

/**
 * Close the database connection.
 */
export async function disconnect(): Promise<void> {
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
        groupSettings: (groupMetadata?.groupSettings.length || 0) > 0 ? [
            { "name": "None", "path": "", "buckets": [] },
            ...groupMetadata?.groupSettings || []
        ] : [],
        sortSettings: [
            ...groupMetadata?.sortSettings?.map(option => { return { ...option, direction: 1 as SortOrder }; }) || []
        ],
        style: groupStyle,
        config: groupConfig
    };
}

/**
 * Navigates to the previous page
 * @param event The event which triggered the page change
 * @param params The remaining parameters
 * @returns A list of entries for the updated page
 */
export async function prevPage(event: IpcMainInvokeEvent, params: GroupEntryParams): Promise<IEntryMetadata[] | null> {
    page = Math.max(page - 1, 0);
    event.sender.send("pkg:update-page-number", page);
    return getGroupEntries(event, params);
}

/**
 * Navigates to the next page
 * @param event The event which triggered the page change
 * @param params The remaining parameters
 * @returns A list of entries for the updated page
 */
export async function nextPage(event: IpcMainInvokeEvent, params: GroupEntryParams): Promise<IEntryMetadata[] | null> {
    page = Math.min(page + 1, pages - 1);
    event.sender.send("pkg:update-page-number", page);
    return getGroupEntries(event, params);
}

/**
 * Loads each entry in a group and sends the results back to the event's original sender.
 * @param event The event that triggered this action.
 * @param params The remaining parameters
 * @returns A list of entries for the group on the current page
 */
export async function getGroupEntries(event: IpcMainInvokeEvent, params: GroupEntryParams): Promise<IEntryMetadata[]> {
    const { pkg, group, sortBy, groupBy } = params;

    if (sortBy) {
        if (typeof sortBy.path === "string") {
            sortOption = [[sortBy.path, sortBy.direction]];
        }
        else {
            sortOption = [
                ...sortBy.path.map((p): [string, SortOrder] => [p, sortBy.direction])
            ];
        }
    }
    if (groupBy) { groupOption = groupBy; }

    const entries = await Entry.find({ packageId: pkg.ns, groupId: group.ns }, ["packageId", "groupId", "bid"])
        .sort(sortOption)
        .skip(entriesPerPage * page)
        .limit(entriesPerPage)
        .lean()
        .exec();

    if (isDev) { getGroupEntriesDev(event, params); }
    else { getGroupEntriesProd(event, params); }

    return entries.map(entry => {
        return {
            ...entry,
            layout: "",
            groupSettings: [],
            sortSettings: []
        };
    });
}

async function getGroupEntriesDev(event: IpcMainInvokeEvent, params: GroupEntryParams): Promise<void> {
    const { pkg, group, lang } = params;

    const currentPage = page;
    const entries = await Entry.find({ packageId: pkg.ns, groupId: group.ns })
        .sort(sortOption)
        .skip(entriesPerPage * page)
        .limit(entriesPerPage)
        .lean()
        .exec();

    const layout = await getLayout(pkg.ns, group.ns, ViewType.preview);

    for (const entry of entries) {
        if (currentPage !== page) { continue; }
        const key = getEntryCacheKey(pkg.ns, group.ns, entry.bid, ViewType.preview);
        if ((entryCache[key] ?? "").length === 0) {
            entryCache[key] = [await layout({ entry, lang }), "", ""];
        }

        const [entryLayout] = entryCache[key] ?? ["", "", ""];

        const groupSettings = await Promise.all(
            group.groupSettings?.map(async setting => {
                return {
                    name: setting.name,
                    path: setting.path,
                    bucketValue: 0 // await getAttribute(entry.packageId, setting.path, entry, cache)
                };
            }) ?? []
        );
        const sortSettings = await Promise.all(
            group.sortSettings?.map(async setting => {
                return {
                    name: setting.name,
                    path: setting.path,
                    value: 0 // await getAttribute(entry.packageId, setting.path, entry, cache)
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
}

async function getGroupEntriesProd(event: IpcMainInvokeEvent, params: GroupEntryParams): Promise<void> {
    const { pkg, group, lang } = params;

    const currentPage = page;
    const entries = await Layout.find({ packageId: pkg.ns, groupId: group.ns, viewType: ViewType.preview })
        // TODO
        // .sort(sortOption ? [["sortValues." + sortOption.name, sortOption.direction]] : undefined)
        .skip(entriesPerPage * page)
        .limit(entriesPerPage)
        .lean()
        .exec();

    for (const entry of entries) {
        if (currentPage !== page) { continue; }
        event.sender.send("pkg:on-entry-loaded", {
            packageId: pkg.ns,
            groupId: group.ns,
            bid: entry.bid,
            layout: entry.values[lang]?.layout ?? ""
        });
    }
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
    if (isDev) { return getEntryDev(pkg, groupId, entryId, lang); }
    else { return getEntryProd(pkg, groupId, entryId, lang); }
}

async function getEntryDev(pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata | IMap | null> {
    const entry = await Entry.findOne({ packageId: pkg.ns, groupId, bid: entryId }).lean().exec();
    if (!entry) return null;

    if (pkg.groups.find(c => c.ns === groupId)?.isMap) {
        return getMap(pkg, entry, lang);
    }

    const key = getEntryCacheKey(pkg.ns, groupId, entryId, ViewType.view);
    if ((entryCache[key] ?? "").length === 0) {
        entryCache[key] = [
            await (await getLayout(pkg.ns, groupId, ViewType.view))({ entry, lang }),
            await (await getScript(pkg.ns, groupId))({ entry, lang }),
            await getStyle(pkg.ns, groupId, ViewType.view, { entry, lang })
        ];
    }
    const [entryLayout, entryScript, entryStyle] = entryCache[key] ?? ["", "", ""];

    return {
        packageId: entry.packageId,
        groupId: entry.groupId,
        bid: entry.bid,
        layout: entryLayout,
        script: entryScript,
        style: entryStyle
    } as IEntryMetadata;
}

async function getEntryProd(pkg: IPackageMetadata, groupId: string, entryId: string, lang: ISO639Code): Promise<IEntryMetadata> {
    const key = getEntryCacheKey(pkg.ns, groupId, entryId, ViewType.view);

    if ((entryCache[key] ?? "").length === 0) {
        const entry = await Layout.findOne({
            packageId: pkg.ns, groupId: groupId, bid: entryId, viewType: ViewType.view
        }).lean().exec();
        entryCache[key] = [
            entry?.values[lang]?.layout ?? "",
            entry?.values[lang]?.script ?? "",
            entry?.values[lang]?.style ?? ""
        ];
    }

    const [entryLayout, entryScript, entryStyle] = entryCache[key]!;

    return {
        packageId: pkg.ns,
        groupId: groupId,
        bid: entryId,
        layout: entryLayout,
        script: entryScript,
        style: entryStyle
    } as IEntryMetadata;
}

async function getMap(pkg: IPackageMetadata, entry: IEntrySchema, lang: ISO639Code): Promise<IMap> {
    const map = entry as Omit<IEntryMetadata, "layout" | "style" | "script" | "groupSettings" | "sortSettings"> as IMap;
    const name = await getResource(pkg.ns, map.name, lang);
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
        name: name,
        image: path.join(paths.data, pkg.ns, "images", map.image),
        landmarks
    };
}

/**
 * Gets the layout for an entry.
 * @param pkg The current package.
 * @param groupId The current group.
 * @param viewType The type of view we are loading.
 * @returns An HTML string populated with attributes from the current entry.
 */
export async function getLayout(pkgId: string, groupId: string, viewType: ViewType): Promise<EntryLayoutFile> {
    const filePath = getFilePath(pkgId, groupId, FileType.layout, viewType);
    return getFile(pkgId, groupId, filePath, FileType.layout, viewType);
}

/**
 * Gets the script for an entry.
 * @param pkg The current package.
 * @param groupId The current group.
 * @returns JavaScript code.
 */
export async function getScript(pkgId: string, groupId: string): Promise<EntryLayoutFile> {
    const filePath = getFilePath(pkgId, groupId, FileType.script, ViewType.any);
    return getFile(pkgId, groupId, filePath, FileType.script, ViewType.any);
}

/**
 * Gets the style for an entry.
 * @param pkg The current package.
 * @param groupId The current group.
 * @returns A <style></style> element.
 */
export async function getStyle(pkgId: string, groupId: string, viewType: ViewType, context?: EntryLayoutContext): Promise<string> {
    const filePath = getFilePath(pkgId, groupId, FileType.style, viewType);

    if (context) {
        const file = await getFile(pkgId, groupId, filePath, FileType.style, viewType);
        const parsedFile = await file(context);
        return compileStyle(parsedFile, filePath);
    } else {
        try {
            return `<style>${sass.compile(path.join(paths.data, pkgId, "style", viewType, `${groupId}.scss`)).css}</style>`;
        }
        catch (err) {
            console.log((err as Error).message);
        }
        return "";
    }
}

/**
 * Compiles a SASS stylesheet for an entry.
 * @param style The SASS code to compile.
 * @param filePath The location of the SASS file.
 * @returns A string containing the compiled HTML style element.
 */
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

/**
 * Gets a file (layout, style, or script) for an entry.
 * @param pkgId The current package.
 * @param groupId The current group.
 * @param filePath The location of the file to load.
 * @param fileType The type of file to load.
 * @param viewType The view type to load.
 * @returns The file compiled through handlebars.
 */
async function getFile(pkgId: string, groupId: string, filePath: string, fileType: FileType, viewType: ViewType): Promise<EntryLayoutFile> {
    const key = `${pkgId}.${groupId}.${fileType}.${viewType}`;
    if (!layoutCache[key] || isDev) {
        try {
            const file = await readFile(filePath, { encoding: "utf-8" });
            layoutCache[key] = hb.compile(file.toString(), { noEscape: true });
        }
        catch (err) {
            if (!(err as Error).message.startsWith("ENOENT")) { // ignore file not found errors
                console.log((err as Error).message);
            }
            layoutCache[key] = async () => { return ""; }; // cache an empty string to skip trying to re-get file on each cache miss
        }
    }
    return layoutCache[key]!; // we guarantee that the cache holds a value even when an error is thrown
}

/**
 * Builds a file path for an entry based on the fileType and viewType.
 * @param pkgId The current package.
 * @param groupId The current group.
 * @param fileType The type of file to load.
 * @param viewType The view type to load.
 * @returns The file path that should be used to load the file.
 */
function getFilePath(pkgId: string, groupId: string, fileType: FileType, viewType: ViewType): string {
    const ext = (fileType === FileType.script) ? "js" : (fileType === FileType.style) ? "scss" : "hbs";
    return path.join(paths.data, pkgId, fileType, viewType, `${groupId}.${ext}`);
}

/**
 * Generates a unique key for an entry based on the viewType.
 * @param packageId The current package.
 * @param groupId The current group.
 * @param bid The current entry.
 * @param viewType The view type to load.
 * @returns A unique key to store in the entry cache.
 */
function getEntryCacheKey(packageId: string, groupId: string, bid: string, viewType: ViewType) {
    return `${packageId}.${groupId}.${bid}.${viewType}`;
}

export function clearEntryCache() {
    for (const key in entryCache) {
        delete entryCache[key];
    }
}

export function clearLayoutCache() {
    for (const key in layoutCache) {
        delete layoutCache[key];
    }
}

/**
 * Gets a resource string in the current locale
 * @param pkgId The current package
 * @param resId The resource ID
 * @param lang The ISO-639 code of the language to load
 * @returns A resource string
 */
export async function getResource(pkgId: string, resId: string, lang: ISO639Code): Promise<string> {
    if (typeof resId !== "string") {
        console.debug("Caution - expected resId to be a string, got", resId);
        return "";
    }

    const resource = await Resource.findOne({ packageId: pkgId, resId: resId }).lean().exec();
    if (resource?.value !== undefined) {
        return resource.value;
    } else if (resource?.values !== undefined) {
        return resource.values[lang] ?? resource.values[(Object.keys(resource.values).at(0) ?? ISO639Code.English) as ISO639Code] ?? "";
    }
    return "";
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