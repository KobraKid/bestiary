import { BrowserWindow } from "electron";
import path from "path";
import { readFileSync } from "fs";
import Package from "./model/Package";
import Entry from "./model/Entry";
import fs, { mkdir } from "fs/promises";
import envPaths from "env-paths";
import chalk from "chalk";

const paths = envPaths('Bestiary', { suffix: '' });

export async function onImport(window: BrowserWindow, files: Electron.OpenDialogReturnValue) {
    for (const filePath of files.filePaths) {
        const pkgJson = JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }));
        await importJson(pkgJson);
    }
    window.webContents.send('importer:import-complete');
}

async function importJson(pkgJson: any) {
    const metadata = pkgJson.metadata;
    const collections = pkgJson.collections;
    const images: { url: string, collection: string, name: string }[] = [];

    const pkg = await Package.findOneAndUpdate({ ns: metadata.ns }, metadata, { upsert: true, new: true });

    for (const collection of collections) {
        const collectionId = collection.ns;
        const collectionEntries = collection.entries;
        const collectionImages = collection.images;

        for (const entry of collectionEntries) {
            if (entry.bid === null || entry.bid === undefined) { continue; }
            await Entry.findOneAndUpdate({ packageId: pkg.id, collectionId: collectionId, bid: entry.bid }, {
                ...entry,
                packageId: pkg.id,
                collectionId: collectionId
            }, { upsert: true, new: true });
        }

        for (const img of collectionImages) {
            images.push({ url: img.url, collection: collectionId, name: img.name });
        }
    }

    for (const img of images) {
        try {
            await mkdir(path.join(paths.data, pkg.ns, 'images', img.collection), { recursive: true });
        } catch (err) {
            if (!(err as Error).message.startsWith('EEXIST')) { console.log((err as Error).message); }
        } finally {
            // check if the file exists
            try {
                await fs.stat(path.join(paths.data, pkg.ns, 'images', img.collection, img.name));
                // file exists, no need to re-download
            }
            catch (err) {
                // fetch the file
                try {
                    const imgResponse = await fetch(encodeURI(img.url));
                    // convert to a blob
                    const imgBlob = await imgResponse.blob();
                    // convert to a buffer
                    const imgArrayBuffer = await imgBlob.arrayBuffer();
                    // write to disk
                    await fs.writeFile(path.join(paths.data, pkg.ns, 'images', img.collection, img.name), Buffer.from(imgArrayBuffer));
                }
                catch (err) {
                    console.log(chalk.red('Failed to download'), chalk.red.bgGreen(img.url), chalk.red(`to ${img.collection}/${img.name}`), err.message);
                }
            }
        }
    }
}