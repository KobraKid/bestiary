import mongoose, { Schema } from 'mongoose';
import envPaths from 'env-paths';
import path from 'path';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { IPackageMetadata, ISO639Code } from './model/Package';
import { ICollectionMetadata } from './model/Collection';
import IEntry from './model/Entry';

const dbUrl = 'mongodb://localhost:27017/bestiary';
const paths = envPaths('Bestiary', { suffix: '' });

enum AttributeModifier {
    image = 'image',
    resource = 'resource'
}

const PkgSchema = new Schema<IPackageMetadata>({
    name: { type: String, required: true },
    ns: { type: String, required: true },
    path: { type: String, required: false },
    icon: { type: String, required: true },
    collections: { type: [String], required: true },
    langs: { type: [String], required: true }
}, { collection: 'packages' });

export const PkgModel = mongoose.model<IPackageMetadata>('PackageMetadata', PkgSchema);

const EntrySchema = new Schema<IEntry>({/* [attribute: string]: any */ }, { collection: 'entries' });

export const EntryModel = mongoose.model<IEntry>('Entry', EntrySchema);

interface IResource {
    resId: string,
    values: {
        [ISO639Code: string]: string
    }
}

const ResourceSchema = new Schema<IResource>({
    resId: { type: String, required: true },
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
    const entries = await EntryModel.where('collection').equals(`${pkg.ns}.${collection.id}`).lean().exec();
    const entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.id}_preview.html`), { encoding: 'utf-8' });
    const entryAry: IEntry[] = [];

    const layoutStyle = await readFile(path.join(paths.data, pkg.ns, 'style', `${collection.id}_preview.css`), { encoding: 'utf-8' });

    for (const entry of entries) {
        const entryLayout = await populateEntryAttributes(entryLayoutTemplate, pkg.ns, collection.id, entry, lang);
        entryAry.push({ entryId: entry._id.toString(), layout: entryLayout });
    }

    return { ...collection, style: `<style>${layoutStyle}</style>`, entries: entryAry };
}

export async function getEntry(pkg: IPackageMetadata, collection: ICollectionMetadata, entry: IEntry, lang: ISO639Code): Promise<IEntry> {
    const loadedEntry = await EntryModel.findById<IEntry>(entry.entryId).lean().exec();
    if (!loadedEntry) return { entryId: '', layout: '' };

    const entryStyle = await readFile(path.join(paths.data, pkg.ns, 'style', `${collection.id}.css`), { encoding: 'utf-8' });

    const entryLayoutTemplate = await readFile(path.join(paths.data, pkg.ns, 'layout', `${collection.id}.html`), { encoding: 'utf-8' });
    const entryLayout = await populateEntryAttributes(entryLayoutTemplate, pkg.ns, collection.id, loadedEntry, lang);

    return { entryId: loadedEntry._id.toString(), style: `<style>${entryStyle}</style>`, layout: entryLayout };
}

async function populateEntryAttributes(layoutTemplate: string, packageId: string, collectionId: string, entry: IEntry, lang: ISO639Code): Promise<string> {
    let entryLayout = layoutTemplate;
    const attributes = entryLayout.matchAll(new RegExp(`\\{([A-z0-9\.-]+)(?:\\|(${AttributeModifier.image}|${AttributeModifier.resource}))?\\}`, 'g'));
    for (const attr of attributes) {
        if (attr.length > 1 && typeof attr[0] === 'string' && typeof attr[1] === 'string') {
            const attrValue = getEntryAttribute(attr[1], entry);
            // the attribtue has a modifier
            if (attr.length >= 3 && typeof attr[2] === 'string') {
                switch (attr[2] as AttributeModifier) {
                    case AttributeModifier.image:
                        entryLayout = entryLayout.replace(attr[0], path.join(paths.data, packageId, 'images', collectionId, attrValue));
                        break;
                    case AttributeModifier.resource:
                        const resource = await ResourceModel.findOne({ resId: `${packageId}.${collectionId}.${attrValue}` }).lean().exec();
                        if (!resource?.values[lang]) {
                            console.log(chalk.red.bgWhiteBright(`Couldn't find resource ${attrValue} in lang ${lang}`));
                        }
                        entryLayout = entryLayout.replace(attr[0], resource?.values[lang] ?? '&lt;ERROR: UNKNOWN STRING&gt;');
                        break;
                }
            }
            // the attribute should be placed directly into the layout
            else {
                entryLayout = entryLayout.replace(attr[0] as string, attrValue);
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