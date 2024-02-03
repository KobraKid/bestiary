import chalk from "chalk";
import { BrowserWindow } from "electron";
import { existsSync, readFileSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import path from "path";
import Entry, { IEntryMetadata, IEntrySchema } from "../model/Entry";
import { IGroupMetadata } from "../model/Group";
import Layout, { ILayout } from "../model/Layout";
import Package, { IPackageMetadata } from "../model/Package";
import Resource, { IResource } from "../model/Resource";
import { ViewType, getAttribute, getLayout, getScript, getStyle } from "./database";
import { isDev, paths } from "./electron";

interface IImportJson {
    metadata?: IPackageMetadata,
    groups?: IGroupMetadata[],
    resources?: IResource[]
}

export async function onImport(window: BrowserWindow, files: Electron.OpenDialogReturnValue) {
    try {
        for (const filePath of files.filePaths) {
            const pkgJson = JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
            await importJson(pkgJson, (update: string, pctCompletion: number, totalPctCompletion: number) =>
                window.webContents.send("importer:import-update", update, pctCompletion, totalPctCompletion));
        }
        window.webContents.send("importer:import-complete");
    }
    catch (e) {
        window.webContents.send("importer:import-failed");
        console.log(chalk.red.bgWhite(e), e);
    }
}

async function importJson(
    pkgJson: IImportJson,
    updateClient: (update: string, pctCompletion: number, totalPctCompletion: number) => void) {
    const metadata = pkgJson.metadata;
    const groups: IGroupMetadata[] = pkgJson.groups ?? [];
    const resources: IResource[] = pkgJson.resources ?? [];
    const resourceCount = Math.max(resources.length, 1);

    if (!metadata) { throw new Error("Package contains no metadata."); }

    const totalCompletion = 1 /* package */ + groups.length + 1 /* retries */ + 1 /* resources */;
    let currentCompletion = 1;
    updateClient(`Importing package [${metadata.name}]`, 0, currentCompletion / totalCompletion);
    const pkg = await Package.findOneAndUpdate({ ns: metadata.ns }, metadata, { upsert: true, new: true });

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
            ({ objWithLinks: entry, failed } = await buildLinks<IEntryMetadata>(pkg, entry));

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
            ({ objWithLinks: entry, failed } = await buildLinks<IEntryMetadata>(pkg, entry));

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
}

interface ILink {
    type: "link",
    group: string,
    id: string
}

async function buildLinks<T>(pkg: IPackageMetadata, obj: T): Promise<{ objWithLinks: T, failed: boolean }> {
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
                            const { objWithLinks: link, failed: f } = await buildLinks(pkg, attribute[i]);
                            if (!f) { attribute[i] = link; }
                            else { failed = true; break objKeys; } // an inner recursive call failed
                        }
                    }
                    else if (typeof attribute === "object") {
                        const { objWithLinks: link, failed: f } = await buildLinks(pkg, obj[key as keyof T]);
                        if (!f) { obj[key as keyof T] = link; }
                        else { failed = true; break objKeys; } // an inner recursive call failed
                    }
                }
            }
        }
    }
    else { failed = true; } // obj was null or undefined

    return { objWithLinks, failed };
}

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

async function getLink(pkg: IPackageMetadata, link: ILink): Promise<IEntrySchema | null> {
    return await Entry.findOne({ packageId: pkg.ns, groupId: link["group"], bid: link["id"] }).exec();
}

export async function publishPackage(pkg: IPackageMetadata | null): Promise<void> {
    if (pkg) {
        const outDir = path.join(paths.temp, "output", pkg.ns);
        await mkdir(outDir, { recursive: true });

        // Loop over groups
        for (const group of pkg.groups) {
            console.log("Building group", group.ns);
            const entries = await Entry.find({ packageId: pkg.ns, groupId: group.ns }).lean().exec();

            // Loop over entries
            for (const entry of entries) {
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
                const precomputedSortValues: { [key: string]: string | string[] } = {};

                // Loop over languages
                for (const lang of pkg.langs) {
                    const script = await (await getScript(pkg.ns, group.ns))({ entry, lang });

                    // Preview
                    const previewScripts: { [key: string]: string } = {};
                    previewLayout.values[lang] = {
                        layout: await (await getLayout(pkg.ns, group.ns, ViewType.preview))({ entry, lang, scripts: previewScripts }),
                        style: await getStyle(pkg.ns, group.ns, ViewType.preview, { entry, lang }),
                        script: `<script>${script}${Object.values(previewScripts).join("")}</script>`
                    };

                    // View
                    const viewScripts: { [key: string]: string } = {};
                    viewLayout.values[lang] = {
                        layout: await (await getLayout(pkg.ns, group.ns, ViewType.view))({ entry, lang, scripts: viewScripts }),
                        style: await getStyle(pkg.ns, group.ns, ViewType.view, { entry, lang }),
                        script: `<script>${script}${Object.values(viewScripts).join("")}</script>`
                    };
                }

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
                previewLayout.sortValues = precomputedSortValues;
                viewLayout.sortValues = precomputedSortValues;

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
        console.log("Publishing", pkg.name, "complete!");
    }
    else if (isDev) {
        console.log("Select a package first!");
    }
}