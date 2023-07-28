import mongoose, { Types } from 'mongoose';
import envPaths from 'env-paths';
import path from 'path';
import chalk from 'chalk';
import sass from 'sass';
import { readFile } from 'fs/promises';
import Package, { IPackageSchema, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import Entry, { IEntryMetadata, IEntrySchema } from './model/Entry';
import Resource from './model/Resource';
import { IpcMainInvokeEvent } from 'electron';

const dbUrl = 'mongodb://127.0.0.1:27017/bestiary';
const paths = envPaths('Bestiary', { suffix: '' });

let isLoading = false;

enum AttributeModifier {
    image = 'image',
    rawimg = 'rawimg',
    lang = 'lang',
    resource = 'resource',
    rawresource = 'rawresource',
    repeat = 'repeat',
    endrepeat = 'endrepeat'
}

export async function setup() {
    await mongoose.connect(dbUrl);
}

export async function disconnect() {
    await mongoose.disconnect();
}

export function getPackageList(): Promise<IPackageSchema[]> {
    return Package.find({}).transform(pkgs => {
        pkgs.forEach(pkg => {
            pkg.path = path.join(paths.data, pkg.ns);
        });
        return pkgs;
    }).lean().exec();
}

export async function getCollection(pkg: IPackageSchema, collection: ICollectionMetadata, _lang: ISO639Code): Promise<ICollectionMetadata> {
    // get layout files
    let collectionLayoutStyle = "";
    try {
        collectionLayoutStyle = sass.compile(path.join(paths.data, pkg.ns, 'style', `${collection.ns}_preview.scss`)).css;
    }
    catch (err) {
        console.log((err as Error).message);
    }
    return { ...collection, style: `<style>${collectionLayoutStyle}</style>` };
}

export async function getCollectionEntries(event: IpcMainInvokeEvent, pkg: IPackageSchema, collection: ICollectionMetadata, lang: ISO639Code): Promise<void> {
    isLoading = true;

    const entries = await Entry.find({ packageId: pkg.id, collectionId: collection.ns }).lean().exec();

    // get layout
    let collectionLayoutTemplate = ""
    try {
        collectionLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.ns}_preview.html`), { encoding: 'utf-8' });
    }
    catch (err) {
        console.log((err as Error).message);
    }

    for (const entry of entries) {
        const entryLayout = await populateEntryAttributes(collectionLayoutTemplate, pkg, collection.ns, entry, lang);
        event.sender.send('pkg:load-collection-entry', { packageId: pkg.id, collectionId: collection.ns, id: entry.id, layout: entryLayout });
    }
}

export function stopLoadingCollectionEntries(): void {
    isLoading = false;
}

export async function getEntry(pkg: IPackageSchema, collection: ICollectionMetadata, entryId: Types.ObjectId, lang: ISO639Code): Promise<IEntryMetadata | null> {
    const loadedEntry = await Entry.findById(entryId).lean().exec();
    if (!loadedEntry) return null;

    // get layout files
    let entryLayoutTemplate = ""
    try {
        entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.ns}.html`), { encoding: 'utf-8' });
    }
    catch (err) {
        console.log((err as Error).message);
    }
    let entryStyle = "";
    try {
        entryStyle = sass.compile(path.join(paths.data, pkg.ns, 'style', `${collection.ns}.scss`)).css;
    }
    catch (err) {
        console.log((err as Error).message);
    }

    const entryLayout = await populateEntryAttributes(entryLayoutTemplate, pkg, collection.ns, loadedEntry, lang);

    return { packageId: loadedEntry.packageId, collectionId: loadedEntry.collectionId, id: loadedEntry.id, layout: entryLayout, style: `<style>${entryStyle}</style>` };
}

/**
 * Populates an entry template with its attributes
 * 
 * @param layoutTemplate The layout template
 * @param namespace The package namespace
 * @param collectionId The collection ID
 * @param entry The entry
 * @param lang The language to inject resource strings in
 * @returns The entry as a string of HTML
 */
async function populateEntryAttributes(layoutTemplate: string, pkg: IPackageSchema, collectionId: string, entry: IEntrySchema, lang: ISO639Code): Promise<string> {
    let entryLayout = layoutTemplate;

    const repeats = entryLayout.matchAll(new RegExp(`\\{([A-z0-9\.$-]+)(\\|${AttributeModifier.repeat})\\}`, 'g'));

    for (const repeat of repeats) {
        if (repeat.length >= 3 && typeof repeat[0] === 'string' && typeof repeat[1] === 'string') {
            // Find start and end of repeat section
            const repeatCount = getEntryAttribute(repeat[1], entry).length;
            const startRepeat = entryLayout.match(new RegExp(`\\{${repeat[1]}\\|${AttributeModifier.repeat}\\}\\s*`));
            const endRepeat = entryLayout.match(new RegExp(`\\{${repeat[1]}\\|${AttributeModifier.endrepeat}\\}\\s*`));
            const repeatText = entryLayout.substring(startRepeat ? (startRepeat.index ?? 0) + startRepeat[0].length : 0, endRepeat?.index ?? 0);
            let accumulatedText = '';
            // Replace $ with an index
            for (let i = 0; i < repeatCount; i++) {
                accumulatedText += repeatText.replace(new RegExp(`\\{${repeat[1]}\\.\\$`, 'g'), `{${repeat[1]}.${i}`);
            }
            // Replicate the text in the template the specified number of times
            entryLayout = entryLayout.substring(0, startRepeat?.index ?? 0) + accumulatedText + entryLayout.substring(endRepeat ? (endRepeat.index ?? 0) + endRepeat[0].length : 0);
        }
    }

    const modifiers = `(${AttributeModifier.image}|${AttributeModifier.rawimg}|${AttributeModifier.resource}|${AttributeModifier.rawresource}|${AttributeModifier.lang})`;
    const attributes = entryLayout.matchAll(new RegExp(`\\{([A-z0-9/\.$-]+)(?:\\|${modifiers})?\\}`, 'g'));

    for (const attr of attributes) {
        if (attr.length > 1 && typeof attr[0] === 'string' && typeof attr[1] === 'string') {
            const attrValue = getEntryAttribute(attr[1], entry);
            // the attribtue has a modifier
            if (attr.length >= 3 && typeof attr[2] === 'string') {
                switch (attr[2] as AttributeModifier) {
                    case AttributeModifier.image:
                        // Pull from the image folder
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, pkg.ns, 'images', collectionId, '' + attrValue));
                        break;
                    case AttributeModifier.rawimg:
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, pkg.ns, 'images', ...attr[1].split('/')));
                        break;
                    case AttributeModifier.resource:
                        // Get the correct resource for the current language
                        const resource = await Resource.findOne({ packageId: pkg.id, resId: attrValue }).lean().exec();
                        if (!resource?.values[lang]) {
                            console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attrValue} in lang ${lang}`));
                        }
                        entryLayout = entryLayout.replace(attr[0], resource?.values[lang] ?? '&lt;ERROR: UNKNOWN STRING&gt;');
                        break;
                    case AttributeModifier.rawresource:
                        // Get the correct resource for the current language
                        const rawresource = await Resource.findOne({ packageId: pkg.id, resId: attr[1] }).lean().exec();
                        if (!rawresource?.values[lang]) {
                            console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attrValue} in lang ${lang}`));
                        }
                        entryLayout = entryLayout.replace(attr[0], rawresource?.values[lang] ?? '&lt;ERROR: UNKNOWN STRING&gt;');
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
    return entryLayout;
}

function getEntryAttribute(attribute: string, entry: IEntrySchema): any {
    let attrValue: any = entry;
    let attrPath = attribute.split('.').reverse();

    while (attrPath.length > 0 && typeof attrValue === 'object') {
        const attr = attrPath.pop();
        if (attr) {
            attrValue = attrValue[attr];
        }
    }
    return attrValue;
}