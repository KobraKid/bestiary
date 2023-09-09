import { BrowserWindow } from "electron";
import path from "path";
import { readFileSync } from "fs";
import Package, { IPackageMetadata } from "./model/Package";
import Entry from "./model/Entry";
import fs, { mkdir } from "fs/promises";
import chalk from "chalk";
import Resource, { IResource } from "./model/Resource";
import { paths } from "./electron";
import { ICollectionMetadata } from "./model/Collection";

export async function onImport(window: BrowserWindow, files: Electron.OpenDialogReturnValue) {
    try {
        for (const filePath of files.filePaths) {
            const pkgJson = JSON.parse(readFileSync(filePath, { encoding: "utf-8" }));
            await importJson(pkgJson, (update: string, pctCompletion: number) => window.webContents.send("importer:import-update", update, pctCompletion));
        }
        window.webContents.send("importer:import-complete");
    }
    catch (e) {
        window.webContents.send("importer:import-failed");
        console.log(chalk.red.bgWhite(e));
    }
}

async function importJson(pkgJson: { metadata: IPackageMetadata, collections: (ICollectionMetadata & { images: { name: string, url: string }[] })[], resources: IResource[] }, updateClient: (update: string, pctCompletion: number) => void) {
    const metadata = pkgJson.metadata;
    const collections: (ICollectionMetadata & { images: { name: string, url: string }[] })[] = pkgJson.collections;
    const resources: IResource[] = pkgJson.resources;
    const resourceCount = Math.max(resources.length, 1);
    const images: { url: string, collection: string, name: string }[] = [];
    const imageCount = Math.max(images.length, 1);

    updateClient(`Importing package <${metadata.name}>`, 0);
    const pkg = await Package.findOneAndUpdate({ ns: metadata.ns }, metadata, { upsert: true, new: true });

    for (const collection of collections) {
        const collectionId = collection.ns;
        const collectionEntries = collection.entries;
        const collectionImages = collection.images;
        const entryCount = Math.max(collectionEntries.length, 1);
        let currentEntry = 0;

        for (const entry of collectionEntries) {
            if (entry.bid === null || entry.bid === undefined) { continue; }
            updateClient(`Importing entry <${entry.bid}> from collection <${collectionId}>`, (++currentEntry) / entryCount);
            await Entry.findOneAndUpdate({ packageId: pkg.ns, collectionId: collectionId, bid: entry.bid }, {
                ...entry,
                packageId: pkg.ns,
                collectionId: collectionId
            }, { upsert: true, new: true });
        }

        for (const img of collectionImages) {
            images.push({ url: img.url, collection: collectionId, name: img.name });
        }
    }

    let currentResource = 0;
    for (const resource of resources) {
        if (resource.resId === null || resource.resId === undefined) { continue; }
        updateClient(`Importing resource <${resource.resId}>`, (++currentResource) / resourceCount);
        await Resource.findOneAndUpdate({ packageId: pkg.ns, resId: resource.resId }, {
            ...resource,
            packageId: pkg.ns
        }, { upsert: true, new: true });
    }

    let currentImage = 0;
    for (const img of images) {
        try {
            await mkdir(path.join(paths.data, pkg.ns, "images", img.collection), { recursive: true });
        } catch (err) {
            if (!(err as Error).message.startsWith("EEXIST")) { console.log((err as Error).message); }
        } finally {
            // check if the file exists
            try {
                await fs.stat(path.join(paths.data, pkg.ns, "images", img.collection, img.name));
                updateClient(`Image <${img.name}> already imported`, (++currentImage) / imageCount);
                // file exists, no need to re-download
            }
            catch (err) {
                updateClient(`Importing image <${img.name}>`, (++currentImage) / imageCount);
                // fetch the file
                try {
                    const imgResponse = await fetch(encodeURI(img.url));
                    // convert to a blob
                    const imgBlob = await imgResponse.blob();
                    // convert to a buffer
                    const imgArrayBuffer = await imgBlob.arrayBuffer();
                    // write to disk
                    await fs.writeFile(path.join(paths.data, pkg.ns, "images", img.collection, img.name), Buffer.from(imgArrayBuffer));
                }
                catch (err) {
                    console.log(chalk.red("Failed to download"), chalk.red.bgGreen(img.url), chalk.red(`to ${img.collection}/${img.name}`), err.message);
                }
            }
        }
    }
}