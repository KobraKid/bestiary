import chalk from "chalk";
import { BrowserWindow } from "electron";
import path from "path";
import { readFileSync } from "fs";
import fs, { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import Entry, { IEntrySchema } from "../model/Entry";
import { IGroupMetadata } from "../model/Group";
import Package, { IPackageMetadata } from "../model/Package";
import Entry, { IEntrySchema } from "../model/Entry";
import fs, { mkdir } from "fs/promises";
import chalk from "chalk";
import Resource, { IResource } from "../model/Resource";
import { isDev, paths } from "./electron";

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

    for (const group of groups) {
        const groupId = group.ns;
        const groupEntries = group.entries ?? [];
        const groupImages = group.images ?? [];

        const entryCount = Math.max(groupEntries.length, 1);
        let currentEntry = 0;
        currentCompletion++;

        for (let entry of groupEntries) {
            if (entry.bid === null || entry.bid === undefined) { continue; }
            updateClient(`Importing entry <${entry.bid}> from group <${groupId}>`, (++currentEntry) / entryCount, currentCompletion / totalCompletion);

            entry = await buildLinks(pkg, entry);
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

    let currentResource = 0;
    currentCompletion++;
    for (const resource of resources) {
        if (resource.resId === null || resource.resId === undefined) { continue; }
        updateClient(`Importing resource <${resource.resId}>`, (++currentResource) / resourceCount, currentCompletion / totalCompletion);
        if ("type" in resource) {
            switch (resource["type"]) {
                case "image":
                    if ("basePath" in resource) {
                        const basePath = resource["basePath"];

                        resource["values"] = {};
                        for (const lang of pkg.langs) {
                            const img = await readFile(path.join(paths.data, pkg.ns, "images", lang, basePath as string));
                            resource["values"][lang] = img.toString("base64");
                        }

                        delete resource["type"];
                        delete resource["basePath"];
                    }
                    break;
            }
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