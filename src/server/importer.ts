import chalk from "chalk";
import { BrowserWindow, IpcMainEvent } from "electron";
import { existsSync, readFileSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import path from "path";
import Entry, { IEntryMetadata, IEntrySchema } from "../model/Entry";
import { IGroupMetadata } from "../model/Group";
import Layout, { ILayout } from "../model/Layout";
import Package, { IPackageMetadata } from "../model/Package";
import Resource, { IResource } from "../model/Resource";
import { ViewType, getAttribute, getLayout, getScript, getStyle } from "./database";
import { paths } from "./electron";
import { RecompileOption } from "../client/components/tasks/compileView";

type ClientUpdater = (update: string, pctCompletion: number, totalPctCompletion: number) => void;

interface ILink {
    type: "link",
    group: string,
    id: string
}

interface IImportJson {
    metadata?: IPackageMetadata,
    groups?: IGroupMetadata[],
    resources?: IResource[]
}

/**
 * Imports a packages from a JSON file
 * @param window The window handling the import
 * @param files The JSON files opened by the user
 */
export async function onImport(window: BrowserWindow, files: Electron.OpenDialogReturnValue) {
    try {
        for (const filePath of files.filePaths) {
            const pkgJson = JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
            await importJson(pkgJson, (update: string, pctCompletion: number, totalPctCompletion: number) =>
                window.webContents.send("task:task-update", update, pctCompletion, totalPctCompletion));
        }
        window.webContents.send("task:task-complete");
    }
    catch (e) {
        window.webContents.send("task:task-failed");
        console.log(chalk.red.bgWhite(e), e);
    }
}

/**
 * Helper function for importing a packages from a JSON file
 * @param pkgJson The JSON representation of the package to import
 * @param updateClient A callback used to update the client as entries are compiled
 */
async function importJson(pkgJson: IImportJson, updateClient: ClientUpdater) {
    const metadata = pkgJson.metadata;
    const groups: IGroupMetadata[] = pkgJson.groups ?? [];
    const resources: IResource[] = pkgJson.resources ?? [];
    const resourceCount = Math.max(resources.length, 1);

    if (!metadata) { throw new Error("Package contains no metadata."); }

    const totalCompletion = 1 /* package */ + groups.length + 1 /* retries */ + 1 /* resources */;
    let currentCompletion = 1;
    updateClient(`Importing package [${metadata.name}]`, 0, currentCompletion / totalCompletion);
    const icon = await readFile(path.join(paths.data, metadata.ns, metadata.icon));
    const pkg = await Package.findOneAndUpdate(
        { ns: metadata.ns },
        { ...metadata, icon: "data:image/jpeg;base64," + icon.toString("base64") },
        { upsert: true, new: true }
    );

    const retryEntries: { [groupId: string]: IEntryMetadata[] } = {};
    for (const group of groups) {
        currentCompletion++;
        const groupId = group.ns;
        const groupEntries = group.entries;
        if (!groupEntries || groupEntries.length === 0) { continue; }
        updateClient(`Importing group [${groupId}]`, 0, currentCompletion / totalCompletion);

        const entryCount = Math.max(groupEntries.length, 1);
        let currentEntry = 0;
        retryEntries[groupId] = [];

        for (let entry of groupEntries) {
            currentEntry++;
            if (entry.bid === null || entry.bid === undefined) { continue; }
            updateClient(`Importing group [${groupId}] - entry [${entry.bid}]`, currentEntry / entryCount, currentCompletion / totalCompletion);

            let failed = false;
            ({ objWithLinks: entry, failed } = await populateLinks<IEntryMetadata>(pkg, entry, true));

            if (failed) {
                // don't quit here, as another future entry may depend on this entry existing
                // instead, just add this entry to the retry list
                retryEntries[groupId]?.push(entry);
            }

            await Entry.findOneAndUpdate({ packageId: pkg.ns, groupId: groupId, bid: entry.bid }, {
                ...entry,
                packageId: pkg.ns,
                groupId: groupId
            }, { upsert: true, new: true });
        }
    }

    currentCompletion++;
    for (const group of groups) {
        const groupId = group.ns;
        const groupEntries = retryEntries[groupId];
        if (!groupEntries || groupEntries.length === 0) { continue; }

        const entryCount = groupEntries.length;
        let currentEntry = 0;
        for (let entry of groupEntries) {
            currentEntry++;
            updateClient(`Retrying group [${groupId}] - entry [${entry.bid}]`, currentEntry / entryCount, currentCompletion / totalCompletion);

            let failed = false;
            ({ objWithLinks: entry, failed } = await populateLinks<IEntryMetadata>(pkg, entry, false));

            if (failed) {
                // we've failed in the second pass, so something truly is missing
                console.log(chalk.yellowBright(`Failed to parse links for entry [${entry.bid}] in group [${groupId}].`));
            }

            await Entry.findOneAndUpdate({ packageId: pkg.ns, groupId: groupId, bid: entry.bid }, {
                ...entry,
                packageId: pkg.ns,
                groupId: groupId
            }, { upsert: true, new: true });
        }
    }

    currentCompletion++;
    let currentResource = 0;
    for (const resource of resources) {
        currentResource++;
        if (resource.resId === null || resource.resId === undefined || resource.resId.length === 0) { continue; }
        updateClient(`Importing resource [${resource.resId}]`, currentResource / resourceCount, currentCompletion / totalCompletion);

        try {
            if ("type" in resource) {
                switch (resource["type"]) {
                    case "image":
                        if ("basePath" in resource) {
                            const basePath = resource["basePath"];

                            // Locale-independent resource
                            if (existsSync(path.join(paths.data, pkg.ns, "images", basePath as string))) {
                                const img = await readFile(path.join(paths.data, pkg.ns, "images", basePath as string));
                                resource["value"] = img.toString("base64");
                            }

                            // Localized resource
                            else {
                                resource["values"] = {};
                                for (const lang of pkg.langs) {
                                    if (existsSync(path.join(paths.data, pkg.ns, "images", lang, basePath as string))) {
                                        const img = await readFile(path.join(paths.data, pkg.ns, "images", lang, basePath as string));
                                        resource["values"][lang] = img.toString("base64");
                                    }
                                    else {
                                        console.log(chalk.yellowBright(`Resource ${resource.resId} not found for [${lang}].`));
                                    }
                                }
                            }

                            delete resource["type"];
                            delete resource["basePath"];
                        }
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }

        await Resource.findOneAndUpdate({ packageId: pkg.ns, resId: resource.resId }, {
            ...resource,
            packageId: pkg.ns
        }, { upsert: true, new: true });
    }

    updateClient("", 0, 0);
}

/**
 * Populates links for an entry
 * @param pkg The current package
 * @param obj The object being scanned for links
 * @param stopOnFailure Whether to stop as soon as we fail to populate a link
 * @returns The object with links populated, and a boolean indicating whether link population was successful
 */
async function populateLinks<T>(pkg: IPackageMetadata, obj: T, stopOnFailure: boolean): Promise<{ objWithLinks: T, failed: boolean }> {
    let failed = false;
    let objWithLinks = obj;

    if (obj !== null && obj !== undefined) {
        if (isLink(obj)) {
            const link = await getLink(pkg, obj);
            if (link?._id) { objWithLinks = link._id; }
            else { failed = true; } // link was null or undefined
        }
        else if (typeof obj === "object") {
            objKeys: for (const key of Object.keys(obj)) {
                const attribute = obj[key as keyof T];

                if (attribute !== null && attribute !== undefined) {
                    if (isLink(attribute)) {
                        const link = await getLink(pkg, attribute);
                        if (link?._id) { obj[key as keyof T] = link._id; }
                        else { failed = true; } // link was null or undefined
                    }
                    else if (Array.isArray(attribute)) {
                        for (let i = 0; i < attribute.length; i++) {
                            const { objWithLinks: link, failed: f } = await populateLinks(pkg, attribute[i], stopOnFailure);
                            if (!f) {
                                attribute[i] = link;
                            }
                            else {
                                failed = true;  // an inner recursive call failed
                                if (stopOnFailure) { break objKeys; }
                            }
                        }
                    }
                    else if (typeof attribute === "object") {
                        const { objWithLinks: link, failed: f } = await populateLinks(pkg, obj[key as keyof T], stopOnFailure);
                        if (!f) {
                            obj[key as keyof T] = link;
                        }
                        else {
                            failed = true;  // an inner recursive call failed
                            if (stopOnFailure) { break objKeys; }
                        }
                    }
                }
            }
        }
    }
    else { failed = true; } // obj was null or undefined

    return { objWithLinks, failed };
}

/**
 * Determins whether a property is a link
 * @param property The property to check
 * @returns Whether the property is a link
 */
function isLink(property: unknown): property is ILink {
    return (
        typeof property === "object"
        && property !== null
        && property !== undefined
        && "type" in property
        && property["type"] === "link"
        && "group" in property
        && "id" in property
    );
}

/**
 * Gets a linked entry
 * @param pkg The current package
 * @param link The link to get
 * @returns A linked entry
 */
async function getLink(pkg: IPackageMetadata, link: ILink): Promise<IEntrySchema | null> {
    return await Entry.findOne({ packageId: pkg.ns, groupId: link["group"], bid: link["id"] }).exec();
}

/**
 * Compiles entries for production
 * @param event The event that kicked off the compilation
 * @param pkg The current package
 * @param compileAllGroups Whether all groups should be compiled
 * @param recompileOption What should be compiled for each entry - the full view for all entries, the full view for new entreis, or just grouping/sorting values
 * @param groupCompilationSettings If only some groups should be compiled, this array indicates which groups should be compiled
 */
export async function onCompile(event: IpcMainEvent, pkg: IPackageMetadata, compileAllGroups: boolean, recompileOption: RecompileOption, groupCompilationSettings: boolean[]): Promise<void> {
    try {
        await compilePackage(pkg, compileAllGroups, recompileOption, groupCompilationSettings, (update: string, pctCompletion: number, totalPctCompletion: number) =>
            event.sender.send("task:task-update", update, pctCompletion, totalPctCompletion));
        event.sender.send("task:task-complete");
    }
    catch (e) {
        event.sender.send("task:task-failed");
        console.log(chalk.red.bgWhite(e), e);
    }
}

/**
 * Helper function to compile entries for production
 * @param pkg The current package
 * @param compileAllGroups Whether all groups should be compiled
 * @param recompileOption What should be compiled for each entry - the full view for all entries, the full view for new entreis, or just grouping/sorting values
 * @param groupCompilationSettings If only some groups should be compiled, this array indicates which groups should be compiled
 * @param updateClient A callback used to update the client as entries are compiled
 */
async function compilePackage(pkg: IPackageMetadata, compileAllGroups: boolean, recompileOption: RecompileOption, groupCompilationSettings: boolean[], updateClient: ClientUpdater) {
    const outDir = path.join(paths.temp, "output", pkg.ns);
    await mkdir(outDir, { recursive: true });

    const groupsToCompile = pkg.groups.filter((_group, i) => compileAllGroups || groupCompilationSettings[i]);

    const totalCompletion = 1 /* package */ + groupsToCompile.length;
    let currentCompletion = 1;
    updateClient(`Compiling package [${pkg.name}]`, 0, currentCompletion / totalCompletion);

    // Loop over groups
    for (let i = 0; i < groupsToCompile.length; i++) {
        currentCompletion++;
        const group = groupsToCompile[i];
        if (!group) { continue; }

        updateClient(`Compiling group [${group.ns}]`, 0, currentCompletion / totalCompletion);
        const entries = await Entry.find({ packageId: pkg.ns, groupId: group.ns }).lean().exec();

        const entryCount = entries.length;
        let currentEntry = 0;

        // Loop over entries
        for (const entry of entries) {
            currentEntry++;
            updateClient(`Compiling group [${group.ns}] - entry [${entry.bid}]`, currentEntry / entryCount, currentCompletion / totalCompletion);

            // only build new entries
            if ((recompileOption === RecompileOption.NEW) && await Layout.exists({ packageId: pkg.ns, groupId: group.ns, bid: entry.bid }) !== null) {
                continue;
            }

            // only recompute grouping/sorting values
            else if ((recompileOption === RecompileOption.RECOMP_VALS)) {
                const precomputedSortValues = await precomputeSortValues(group, entry);
                const precomputedGroupValues = await precomputeGroupValues(group, entry);

                await Layout.findOneAndUpdate({
                    packageId: pkg.ns,
                    groupId: group.ns,
                    bid: entry.bid,
                    viewType: ViewType.preview
                }, { sortValues: precomputedSortValues, groupValues: precomputedGroupValues });
            }

            else {
                const previewLayout: ILayout = {
                    packageId: pkg.ns,
                    groupId: group.ns,
                    bid: entry.bid,
                    viewType: ViewType.preview,
                    sortValues: {},
                    values: {}
                };
                const viewLayout: ILayout = {
                    packageId: pkg.ns,
                    groupId: group.ns,
                    bid: entry.bid,
                    viewType: ViewType.view,
                    sortValues: {},
                    values: {}
                };

                // Loop over languages
                for (const lang of pkg.langs) {
                    const script = await (await getScript(pkg.ns, group.ns))({ entry, lang });

                    // Preview
                    const previewScripts: { [key: string]: string } = {};
                    previewLayout.values[lang] = {
                        layout: await (await getLayout(pkg.ns, group.ns, ViewType.preview))({ entry, lang, scripts: previewScripts }),
                        style: await getStyle(pkg.ns, group.ns, ViewType.preview, { entry, lang }),
                        script: `${script}${Object.values(previewScripts).join("")}`
                    };

                    // View
                    const viewScripts: { [key: string]: string } = {};
                    viewLayout.values[lang] = {
                        layout: await (await getLayout(pkg.ns, group.ns, ViewType.view))({ entry, lang, scripts: viewScripts }),
                        style: await getStyle(pkg.ns, group.ns, ViewType.view, { entry, lang }),
                        script: `${script}${Object.values(viewScripts).join("")}`
                    };
                }

                const precomputedSortValues = await precomputeSortValues(group, entry);
                previewLayout.sortValues = precomputedSortValues;

                const precomputedGroupValues = await precomputeGroupValues(group, entry);
                previewLayout.groupValues = precomputedGroupValues;

                // Save precomputed layout
                await Layout.findOneAndUpdate({
                    packageId: pkg.ns,
                    groupId: group.ns,
                    bid: entry.bid,
                    viewType: ViewType.preview
                }, previewLayout, { upsert: true });
                await Layout.findOneAndUpdate({
                    packageId: pkg.ns,
                    groupId: group.ns,
                    bid: entry.bid,
                    viewType: ViewType.view
                }, viewLayout, { upsert: true });
            }
        }
    }
}

async function precomputeSortValues(group: IGroupMetadata, entry: IEntrySchema) {
    const precomputedSortValues: { [key: string]: string | string[] } = {};

    // Loop over sort settings
    for (const sortSetting of group.sortSettings) {
        if (typeof sortSetting.path === "string") {
            precomputedSortValues[sortSetting.name] = await getAttribute(entry, sortSetting.path) as string;
        }
        else {
            precomputedSortValues[sortSetting.name] = [];
            for (const p of sortSetting.path) {
                (precomputedSortValues[sortSetting.name] as string[]).push(await getAttribute(entry, p) as string);
            }
        }
    }
    precomputedSortValues["None"] = entry.bid;

    return precomputedSortValues;
}

async function precomputeGroupValues(group: IGroupMetadata, entry: IEntrySchema) {
    const precomputedGroupValues: { [key: string]: number | number[] } = {};

    // Loop over group settings
    for (const groupSetting of group.groupSettings) {
        if (typeof groupSetting.path === "string") {
            const bucketVal = await getAttribute(entry, groupSetting.path) as string;
            const bucketNumber = groupSetting.buckets.findIndex(bucket => bucket.value === bucketVal);
            precomputedGroupValues[groupSetting.name] = (bucketNumber === -1 ? groupSetting.buckets.length : bucketNumber);
        }
        else {
            precomputedGroupValues[groupSetting.name] = [];
            for (const p of groupSetting.path) {
                const bucketVal = await getAttribute(entry, p) as string;
                const bucketNumber = groupSetting.buckets.findIndex(bucket => bucket.value === bucketVal);
                (precomputedGroupValues[groupSetting.name] as number[]).push(bucketNumber === -1 ? groupSetting.buckets.length : bucketNumber);
            }
        }
    }

    return precomputedGroupValues;
}