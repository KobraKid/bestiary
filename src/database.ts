import mongoose, { Schema } from 'mongoose';
import envPaths from 'env-paths';
import path from 'path';
import chalk from 'chalk';
import sass from 'sass';
import { readFile } from 'fs/promises';
import { IPackageMetadata, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import IEntry from './model/Entry';

const dbUrl = 'mongodb://127.0.0.1:27017/bestiary';
const paths = envPaths('Bestiary', { suffix: '' });

enum AttributeModifier {
    image = 'image',
    rawimg = 'rawimg',
    lang = 'lang',
    resource = 'resource',
    rawresource = 'rawresource',
    repeat = 'repeat',
    endrepeat = 'endrepeat'
}

const PkgSchema = new Schema<IPackageMetadata>({
    name: { type: String, required: true },
    ns: { type: String, required: true },
    path: { type: String, required: false },
    icon: { type: String, required: true },
    collections: { type: [Object], required: true },
    langs: { type: [String], required: true }
}, { collection: 'packages' });

export const PkgModel = mongoose.model<IPackageMetadata>('PackageMetadata', PkgSchema);

const EntrySchema = new Schema<IEntry>({/* [attribute: string]: any */ }, { collection: 'entries' });

export const EntryModel = mongoose.model<IEntry>('Entry', EntrySchema);

interface IResource {
    resId: string,
    packageId: string,
    values: {
        [ISO639Code: string]: string
    }
}

const ResourceSchema = new Schema<IResource>({
    resId: { type: String, required: true },
    packageId: { type: String, required: true },
    values: { type: Object, required: true }
}, { collection: 'resources' });

export const ResourceModel = mongoose.model<IResource>('Resource', ResourceSchema);

export async function setup() {
    await mongoose.connect(dbUrl);
}

export async function disconnect() {
    await mongoose.disconnect();
}

export function getPackageList(): Promise<IPackageMetadata[]> {
    return PkgModel.find({}).transform(pkgs => {
        pkgs.forEach(pkg => {
            pkg.path = path.join(paths.data, pkg.ns);
        });
        return pkgs;
    }).lean().exec();
}

export async function getCollection(pkg: IPackageMetadata, collection: ICollectionMetadata, lang: ISO639Code): Promise<ICollectionMetadata> {
    const entries = await EntryModel.where('packageId').equals(pkg.ns).where('collectionId').equals(collection.id).lean().exec();
    const entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.id}_preview.html`), { encoding: 'utf-8' });
    const entryAry: IEntry[] = [];

    const layoutStyle = sass.compile(path.join(paths.data, pkg.ns, 'style', `${collection.id}_preview.scss`)).css;

    for (const entry of entries) {
        const entryLayout = await populateEntryAttributes(entryLayoutTemplate, pkg.ns, collection.id, entry, lang);
        entryAry.push({ packageId: pkg.ns, collectionId: collection.id, entryId: entry._id.toString(), layout: entryLayout });
    }

    return { ...collection, style: `<style>${layoutStyle}</style>`, entries: entryAry };
}

export async function getEntry(pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry, lang: ISO639Code): Promise<IEntry> {
    const loadedEntry = await EntryModel.findById<IEntry>(entry.entryId).lean().exec();
    if (!loadedEntry) return { packageId: '', collectionId: '', entryId: '', layout: '' };

    const entryStyle = sass.compile(path.join(paths.data, pkg.ns, 'style', `${collection.id}.scss`)).css;

    const entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.id}.html`), { encoding: 'utf-8' });
    const entryLayout = await populateEntryAttributes(entryLayoutTemplate, pkg.ns, collection.id, loadedEntry, lang);

    return { packageId: loadedEntry.packageId, collectionId: loadedEntry.collectionId, entryId: loadedEntry._id.toString(), style: `<style>${entryStyle}</style>`, layout: entryLayout };
}

/**
 * Populates an entry template with its attributes
 * 
 * @param layoutTemplate The layout template
 * @param packageId The package ID
 * @param collectionId The collection ID
 * @param entry The entry
 * @param lang The language to inject resource strings in
 * @returns The entry as a string of HTML
 */
async function populateEntryAttributes(layoutTemplate: string, packageId: string, collectionId: string, entry: IEntry, lang: ISO639Code): Promise<string> {
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
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, packageId, 'images', collectionId, '' + attrValue));
                        break;
                    case AttributeModifier.rawimg:
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, packageId, 'images', ...attr[1].split('/')));
                        break;
                    case AttributeModifier.resource:
                        // Get the correct resource for the current language
                        const resource = await ResourceModel.findOne({ packageId: packageId, resId: attrValue }).lean().exec();
                        if (!resource?.values[lang]) {
                            console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attrValue} in lang ${lang}`));
                        }
                        entryLayout = entryLayout.replace(attr[0], resource?.values[lang] ?? '&lt;ERROR: UNKNOWN STRING&gt;');
                        break;
                    case AttributeModifier.rawresource:
                        // Get the correct resource for the current language
                        const rawresource = await ResourceModel.findOne({ packageId: packageId, resId: attr[1] }).lean().exec();
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

function getEntryAttribute(attribute: string, entry: IEntry): any {
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