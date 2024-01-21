import chalk from "chalk";
import { BrowserWindow } from "electron";
import { existsSync, readFileSync } from "fs";
import fs, { mkdir, readFile } from "fs/promises";
import path from "path";
import Entry, { IEntrySchema } from "../model/Entry";
import { IGroupMetadata } from "../model/Group";
import Package, { IPackageMetadata } from "../model/Package";
import Resource, { IResource } from "../model/Resource";
import { ViewType, getAttribute, getLayout, getScript, getStyle } from "./database";
import { isDev, paths } from "./electron";
import Layout, { ILayout } from "../model/Layout";

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
    pkgJson: { metadata: IPackageMetadata, groups: (IGroupMetadata & { images: { name: string, url: string }[] })[], resources: IResource[] },
    updateClient: (update: string, pctCompletion: number, totalPctCompletion: number) => void) {
    const metadata = pkgJson.metadata;
    const groups: (IGroupMetadata & { images: { name: string, url: string }[] })[] = pkgJson.groups;
    const resources: IResource[] = pkgJson.resources ?? [];
    const resourceCount = Math.max(resources.length, 1);
    const images: { url: string, group: string, name: string }[] = [];
    const imageCount = Math.max(images.length, 1);

    updateClient(`Importing package <${metadata.name}>`, 0, 0);
    let currentCompletion = 1;
    const totalCompletion = groups.length + 3; // Package + Resources + Images
    updateClient("Importing package", 0, currentCompletion / totalCompletion);
    const pkg = await Package.findOneAndUpdate({ ns: metadata.ns }, metadata, { upsert: true, new: true });

    for (let i = 0; i < 2; i++) { // import entries twice to parse links
        for (const group of groups) {
            const groupId = group.ns;
            const groupEntries = group.entries ?? [];
            const groupImages = group.images ?? [];

            const entryCount = Math.max(groupEntries.length, 1);
            let currentEntry = 0;
            currentCompletion += 0.5; // account for the second pass

            for (let entry of groupEntries) {
                if (entry.bid === null || entry.bid === undefined) { continue; }
                updateClient(`Importing entry <${entry.bid}> from group <${groupId}>`, (++currentEntry) / entryCount, currentCompletion / totalCompletion);

                if (i === 1) { entry = await buildLinks(pkg, entry); } // only attempt to parse links after the initial load

                await Entry.findOneAndUpdate({ packageId: pkg.ns, groupId: groupId, bid: entry.bid }, {
                    ...entry,
                    packageId: pkg.ns,
                    groupId: groupId
                }, { upsert: true, new: true });
            }

            for (const img of groupImages) {
                images.push({ url: img.url, group: groupId, name: img.name });
            }
        }
    }

    let currentResource = 0;
    currentCompletion++;
    for (const resource of resources) {
        if (resource.resId === null || resource.resId === undefined || resource.resId.length === 0) { continue; }
        updateClient(`Importing resource <${resource.resId}>`, (++currentResource) / resourceCount, currentCompletion / totalCompletion);

        try {
            if ("type" in resource) {
                switch (resource["type"]) {
                    case "image":
                        if ("basePath" in resource) {
                            const basePath = resource["basePath"];

                            // Language-independent resource
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
                                        console.log(chalk.yellowBright(`Resource ${resource.resId} not found for [${lang}]`));
                                        resource["values"][lang] = ""; // this resource doesn't exist for the current language
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

    let currentImage = 0;
    currentCompletion++;
    for (const img of images) {
        try {
            await mkdir(path.join(paths.data, pkg.ns, "images", img.group), { recursive: true });
        } catch (err) {
            if (!(err as Error).message.startsWith("EEXIST")) { console.log((err as Error).message); }
        } finally {
            // check if the file exists
            try {
                await fs.stat(path.join(paths.data, pkg.ns, "images", img.group, img.name));
                updateClient(`Image <${img.name}> already imported`, (++currentImage) / imageCount, currentCompletion / totalCompletion);
                // file exists, no need to re-download
            }
            catch (err) {
                updateClient(`Importing image <${img.name}>`, (++currentImage) / imageCount, currentCompletion / totalCompletion);
                // fetch the file
                try {
                    const imgResponse = await fetch(encodeURI(img.url));
                    // convert to a blob
                    const imgBlob = await imgResponse.blob();
                    // convert to a buffer
                    const imgArrayBuffer = await imgBlob.arrayBuffer();
                    // write to disk
                    await fs.writeFile(path.join(paths.data, pkg.ns, "images", img.group, img.name), Buffer.from(imgArrayBuffer));
                }
                catch (err) {
                    console.log(chalk.red("Failed to download"), chalk.red.bgGreen(img.url), chalk.red(`to ${img.group}/${img.name}`), err.message);
                }
            }
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildLinks(pkg: IPackageMetadata, o: any): Promise<any> {
    if (o != null) {
        if (isLink(o)) {
            const link = await getLink(pkg, o);
            if (link?._id) {
                return link._id;
            }
        }
        else if (typeof o === "object") {
            for (const key of Object.keys(o)) {
                const attribute = o[key as keyof typeof o];

                if (attribute != null) {
                    if (isLink(attribute)) {
                        const link = await getLink(pkg, attribute);
                        if (link?._id) {
                            o[key as keyof typeof o] = link._id;
                        }
                    }
                    else if (Array.isArray(attribute)) {
                        for (let i = 0; i < attribute.length; i++) {
                            attribute[i] = await buildLinks(pkg, attribute[i]);
                        }
                    }
                    else if (typeof attribute === "object") {
                        o[key] = await buildLinks(pkg, o[key]);
                    }
                }
            }
        }
    }
    return o;
}

function isLink(property: object): boolean {
    return typeof property === "object" && "type" in property && property["type"] === "link" && "group" in property && "id" in property;
}

async function getLink(pkg: IPackageMetadata, attribute: object): Promise<IEntrySchema | null> {
    const property = attribute as { "group": string, "id": string };
    return await Entry.findOne({ packageId: pkg.ns, groupId: property["group"], bid: property["id"] }).exec();
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
                const precomputedSortValues: { [key: string]: string } = {};

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
                    precomputedSortValues[sortSetting.name] = await getAttribute(entry, sortSetting.path) as string;
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