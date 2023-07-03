import { BrowserWindow, KeyboardEvent, MenuItem } from "electron";
import path from "path";
import chalk from "chalk";
import fs, { mkdir } from 'fs/promises';
import envPaths from 'env-paths';
import * as cheerio from 'cheerio';
import { EntryModel, ResourceModel } from "./database";

export function onImportClicked(_menuItem: MenuItem, _browserWindow: BrowserWindow, _event: KeyboardEvent): void {
    let win = new BrowserWindow({
        width: 720,
        height: 480,
        center: true,
        title: `Bestiary Importer`,
        darkTheme: true,
        autoHideMenuBar: true,
        fullscreenable: false,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('importer.html');

    win.webContents.openDevTools({ mode: 'detach' });
}

enum BuiltInImporters {
    dqtact = 'dqtact'
}

export function importBuiltIn(pkgName: string): void {
    switch (pkgName) {
        case BuiltInImporters.dqtact:
            import_dqtact();
            break;
    }
}

interface IDqtactJsonEntry {
    label: string,
    listMethod: "POST" | "GET" | "JS",
    listKey: string,
    nameKey?: string
    descKey?: string
}

const DQTactLangs = ['en', 'ja', 'ko', 'zh_TW'];

async function import_dqtact(): Promise<void> {
    const dqtactJson: IDqtactJsonEntry[] = [
        { label: "Ailments", listMethod: "POST", listKey: "ailments", nameKey: "ailment_name" },
        { label: "Buffs", listMethod: "POST", listKey: "buffs", nameKey: "buff_name" },
        { label: "Drops", listMethod: "GET", listKey: "unitdrop" },
        { label: "Event Groups", listMethod: "JS", listKey: "event_group" },
        { label: "Event Portals", listMethod: "JS", listKey: "event_portal" },
        { label: "Items", listMethod: "POST", listKey: "items", nameKey: "item_name", descKey: "item_desc" },
        { label: "Passives", listMethod: "POST", listKey: "passives", nameKey: "passive_name", descKey: "passive_desc" },
        { label: "Skills", listMethod: "POST", listKey: "skills", nameKey: "skill_name" },
        { label: "Stages", listMethod: "JS", listKey: "stage" },
        { label: "Units", listMethod: "POST", listKey: "units", nameKey: "profile" }
    ]
    const baseURL = 'https://dqtjp.kusoge.xyz';

    // first drop all resources
    // await ResourceModel.collection.deleteMany({ 'packageId': BuiltInImporters.dqtact });

    // for (let collection of dqtactJson) {
    //     let suffix = '';

    //     switch (collection.listMethod) {
    //         case "GET":
    //             suffix = '/0';
    //         case "POST":
    //             const response = await fetch(`${baseURL}/${collection.listKey}/q${suffix}`, { method: collection.listMethod, headers: { 'Content-Type': 'appliaction/json' } });
    //             const jsonResponse = await response.json();

    //             // set the collection for each entry
    //             (jsonResponse as any[]).forEach(element => {
    //                 element.packageId = BuiltInImporters.dqtact;
    //                 element.collectionId = collection.listKey;

    //                 // Do any transformations
    //                 if (element.eleRes) {
    //                     element.eleRes.ele1Icon = __import_dqtact_res_icon(element.eleRes.ele1);
    //                     element.eleRes.ele2Icon = __import_dqtact_res_icon(element.eleRes.ele2);
    //                     element.eleRes.ele3Icon = __import_dqtact_res_icon(element.eleRes.ele3);
    //                     element.eleRes.ele4Icon = __import_dqtact_res_icon(element.eleRes.ele4);
    //                     element.eleRes.ele5Icon = __import_dqtact_res_icon(element.eleRes.ele5);
    //                     element.eleRes.ele6Icon = __import_dqtact_res_icon(element.eleRes.ele6);
    //                     element.eleRes.ele7Icon = __import_dqtact_res_icon(element.eleRes.ele7);
    //                 }
    //                 if (element.ailres) {
    //                     element.ailres.ail1Icon = __import_dqtact_res_icon(element.ailres.ail1);
    //                     element.ailres.ail2Icon = __import_dqtact_res_icon(element.ailres.ail2);
    //                     element.ailres.ail3Icon = __import_dqtact_res_icon(element.ailres.ail3);
    //                     element.ailres.ail4Icon = __import_dqtact_res_icon(element.ailres.ail4);
    //                     element.ailres.ail5Icon = __import_dqtact_res_icon(element.ailres.ail5);
    //                     element.ailres.ail6Icon = __import_dqtact_res_icon(element.ailres.ail6);
    //                     element.ailres.ail7Icon = __import_dqtact_res_icon(element.ailres.ail7);
    //                     element.ailres.ail8Icon = __import_dqtact_res_icon(element.ailres.ail8);
    //                     element.ailres.ail9Icon = __import_dqtact_res_icon(element.ailres.ail9);
    //                     element.ailres.ail10Icon = __import_dqtact_res_icon(element.ailres.ail10);
    //                     element.ailres.ail11Icon = __import_dqtact_res_icon(element.ailres.ail11);
    //                     element.ailres.ail12Icon = __import_dqtact_res_icon(element.ailres.ail12);
    //                     element.ailres.ail13Icon = __import_dqtact_res_icon(element.ailres.ail13);
    //                 }

    //                 // Kick off image downloads
    //                 __import_dqtact_save_image(element.icon, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.family?.icon, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.role?.icon, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.element?.icon, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.rarity?.icon, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.rarity?.frame, baseURL, collection.listKey);
    //                 __import_dqtact_save_image(element.rarity?.background, baseURL, collection.listKey);
    //             });

    //             // delete the old entries and add the new ones
    //             await EntryModel.collection.deleteMany({ 'packageId': BuiltInImporters.dqtact, 'collectionId': collection.listKey });
    //             await EntryModel.collection.insertMany(jsonResponse);

    //             // import the names and descriptions for the collection
    //             __import_dqtact_js(collection.nameKey, collection.listKey);
    //             __import_dqtact_js(collection.descKey, collection.listKey);
    //             break;
    //         case "JS":
    //             __import_dqtact_js(collection.listKey, collection.listKey);
    //             break;
    //     }
    // }

    // second pass to link documents
    for (let collection of dqtactJson) {
        switch (collection.label) {
            case 'Units':
                const unitCursor = EntryModel.collection.find({ packageId: BuiltInImporters.dqtact, collectionId: 'units', 'no': 1 });
                for (let unit = await unitCursor.next(); unit != null; unit = await unitCursor.next()) {
                    // unit drops
                    const dropsCursor = EntryModel.collection.find({ packageId: BuiltInImporters.dqtact, collectionId: 'unitdrop', 'base': unit.code });
                    let drops = [];
                    let dropRates = [];
                    for (let drop = await dropsCursor.next(); drop != null; drop = await dropsCursor.next()) {
                        drops.push(drop.code);
                        dropRates.push(drop.rate);
                    }
                    // skills
                    const unitPage = await fetch(`${baseURL}/unit/${unit.code}`);
                    const $ = cheerio.load(await unitPage.text());
                    const skills = $('.skills a');
                    let skillCodes: string[] = [];
                    skills.each((_: number, el: cheerio.Element) => {
                        const m = $(el).attr('href')?.match(/\/skill\/([0-9]+)/);
                        if (m && typeof m[1] === 'string') {
                            skillCodes.push(m[1]);
                        }
                    });
                    EntryModel.collection.updateOne({ _id: unit._id }, { $set: { 'stageDrop': drops, 'dropRate': dropRates, 'skills': skillCodes } });
                }
                break;
        }
    }

    // extra resources
    __import_dqtact_save_image('ResistanceLevel_ChouZyakuten.png', baseURL, 'units');
    __import_dqtact_save_image('ResistanceLevel_DaiZyakuten.png', baseURL, 'units');
    __import_dqtact_save_image('ResistanceLevel_Hutuu.png', baseURL, 'units');
    __import_dqtact_save_image('ResistanceLevel_Hangen.png', baseURL, 'units');
    __import_dqtact_save_image('ResistanceLevel_Mukou.png', baseURL, 'units');

    __import_dqtact_save_image('ResistanceLevel_ChouZyakuten.png', 'https://dqt.kusoge.xyz', 'units');
    __import_dqtact_save_image('ResistanceLevel_DaiZyakuten.png', 'https://dqt.kusoge.xyz', 'units');
    __import_dqtact_save_image('ResistanceLevel_Hutuu.png', 'https://dqt.kusoge.xyz', 'units');
    __import_dqtact_save_image('ResistanceLevel_Hangen.png', 'https://dqt.kusoge.xyz', 'units');
    __import_dqtact_save_image('ResistanceLevel_Mukou.png', 'https://dqt.kusoge.xyz', 'units');

    ResourceModel.collection.insertMany([
        {
            resId: 'ActiveSkillElement.DisplayName.Mera',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "메라", en: "Frizz", ja: "メラ", zh_TW: "美拉" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Gira',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "기라", en: "Sizz", ja: "ギラ", zh_TW: "基拉" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Hyado',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "히야드", en: "Crack", ja: "ヒャド", zh_TW: "夏德" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Bagi',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "바기", en: "Woosh", ja: "バギ", zh_TW: "巴基" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Io',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "이오", en: "Bang", ja: "イオ", zh_TW: "伊奥" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Dein',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "데인", en: "Zap", ja: "デイン", zh_TW: "迪恩" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Dorma',
            packageId: BuiltInImporters.dqtact,
            values: { ko: "도르마", en: "Zam", ja: "ドルマ", zh_TW: "德爾瑪" }
        }
    ]);
}

function __import_dqtact_js(key: string | undefined, _collection: string): void {
    if (!key) { return; }

    fetch(`https://dqtjp.kusoge.xyz/json/${key}.js`).then(response => {
        response.text().then(textResponse => {
            let combinedLangs: any = {};
            for (const lang of DQTactLangs) {
                const match = textResponse.match(new RegExp(`var ${key}_${lang} = (\{(?:.|\n)*?\});`));
                if (match && match.length > 0) {
                    const json = JSON.parse(match[1]!);
                    Object.keys(json).forEach(resource => {
                        if (!combinedLangs[resource]) {
                            combinedLangs[resource] = {
                                resId: resource,
                                packageId: BuiltInImporters.dqtact,
                                values: { ko: "", en: "", ja: "", zh_TW: "" }
                            };
                        }
                        combinedLangs[resource].values[lang] = json[resource];
                    });
                }
            }
            ResourceModel.collection.insertMany(Object.values(combinedLangs));
        });
    });
}

function __import_dqtact_res_icon(res: number): string {
    switch (res) {
        case -10000:
            return 'ResistanceLevel_ChouZyakuten.png';
        case -5000:
            return 'ResistanceLevel_DaiZyakuten.png';
        case 0:
            return 'ResistanceLevel_Hutuu.png';
        case 5000:
            return 'ResistanceLevel_Hangen.png';
        case 10000:
            return 'ResistanceLevel_Mukou.png';
        default:
            return '';
    }
}

async function __import_dqtact_save_image(img: string | null | undefined, baseURL: string, collection: string) {
    if (!img) { return; }

    try {
        await mkdir(path.join(envPaths('Bestiary', { suffix: '' }).data, BuiltInImporters.dqtact, 'images', collection), { recursive: true })
    } catch (err: any) {
        if (!err.message.startsWith('EEXIST')) { console.log(err.message); }
    } finally {
        // check if the file exists
        fs.stat(path.join(envPaths('Bestiary', { suffix: '' }).data, BuiltInImporters.dqtact, 'images', collection, img))
            .then(_stats => {/* file exists, no need to re-download */ })
            .catch(() => {
                // fetch the file
                fetch(`${baseURL}/img/icon/${img}`).then(imgResponse => {
                    // convert to a blob
                    imgResponse.blob().then(imgBlob => {
                        // convert to a buffer
                        imgBlob.arrayBuffer().then(imgArrayBuffer => {
                            // write to disk
                            fs.writeFile(path.join(envPaths('Bestiary', { suffix: '' }).data, BuiltInImporters.dqtact, 'images', collection, img), Buffer.from(imgArrayBuffer))
                                .catch((err: Error) => console.log(chalk.red('Failed to save to file'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`), err.message));
                        }).catch(() => console.log(chalk.red('Failed to create buffer'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`)));
                    }).catch(() => console.log(chalk.red('Failed to create blob'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`)));
                }).catch(() => console.log(chalk.red('Failed to download'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`)));
            });
    }
}