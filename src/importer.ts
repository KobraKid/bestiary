import { BrowserWindow, KeyboardEvent, MenuItem } from "electron";
import path from "path";
import chalk from "chalk";
import fs, { mkdir } from 'fs/promises';
import envPaths from 'env-paths';
import * as cheerio from 'cheerio';
import Package, { IPackageSchema } from "./model/Package";
import Resource from "./model/Resource";
import Entry, { IEntrySchema } from "./model/Entry";

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

    const pkg = await Package.findOneAndUpdate({ ns: BuiltInImporters.dqtact }, {
        name: "Dragon Quest Tact",
        ns: BuiltInImporters.dqtact,
        icon: "icon.webp",
        collections: [
            { name: "Units", ns: "units", groupings: [{ name: "Rarity", attribute: "rarity.code" }, { name: "Family", attribute: "family.code" }, { name: "Role", attribute: "role.code" }] },
            { name: "Skills", ns: "skills", groupings: [{ name: "Rarity", attribute: "rarity.code" }, { name: "Element", attribute: "element.code" }] },
            { name: "Items", ns: "items", groupings: [{ name: "Rank", attribute: "rankItem.code" }] }
        ],
        langs: ["en", "ja", "ko", "zh_TW"]
    }, { upsert: true, new: true });

    // first drop all resources for the package
    await Resource.collection.deleteMany({ packageId: pkg.id });

    for (let collection of dqtactJson) {
        let suffix = '';

        switch (collection.listMethod) {
            case "GET":
                suffix = '/0';
            case "POST":
                const response = await fetch(`${baseURL}/${collection.listKey}/q${suffix}`, { method: collection.listMethod, headers: { 'Content-Type': 'appliaction/json' } });
                const jsonResponse = await response.json();

                // set the collection for each entry
                (jsonResponse as any[]).forEach(element => {
                    (element as IEntrySchema).packageId = pkg.id;
                    (element as IEntrySchema).collectionId = collection.listKey;

                    // Do any transformations
                    if (element.eleRes) {
                        element.eleRes.ele1Icon = __import_dqtact_res_icon(element.eleRes.ele1);
                        element.eleRes.ele2Icon = __import_dqtact_res_icon(element.eleRes.ele2);
                        element.eleRes.ele3Icon = __import_dqtact_res_icon(element.eleRes.ele3);
                        element.eleRes.ele4Icon = __import_dqtact_res_icon(element.eleRes.ele4);
                        element.eleRes.ele5Icon = __import_dqtact_res_icon(element.eleRes.ele5);
                        element.eleRes.ele6Icon = __import_dqtact_res_icon(element.eleRes.ele6);
                        element.eleRes.ele7Icon = __import_dqtact_res_icon(element.eleRes.ele7);
                    }
                    if (element.ailres) {
                        element.ailres.ail1Icon = __import_dqtact_res_icon(element.ailres.ail1);
                        element.ailres.ail2Icon = __import_dqtact_res_icon(element.ailres.ail2);
                        element.ailres.ail3Icon = __import_dqtact_res_icon(element.ailres.ail3);
                        element.ailres.ail4Icon = __import_dqtact_res_icon(element.ailres.ail4);
                        element.ailres.ail5Icon = __import_dqtact_res_icon(element.ailres.ail5);
                        element.ailres.ail6Icon = __import_dqtact_res_icon(element.ailres.ail6);
                        element.ailres.ail7Icon = __import_dqtact_res_icon(element.ailres.ail7);
                        element.ailres.ail8Icon = __import_dqtact_res_icon(element.ailres.ail8);
                        element.ailres.ail9Icon = __import_dqtact_res_icon(element.ailres.ail9);
                        element.ailres.ail10Icon = __import_dqtact_res_icon(element.ailres.ail10);
                        element.ailres.ail11Icon = __import_dqtact_res_icon(element.ailres.ail11);
                        element.ailres.ail12Icon = __import_dqtact_res_icon(element.ailres.ail12);
                        element.ailres.ail13Icon = __import_dqtact_res_icon(element.ailres.ail13);
                    }

                    // Kick off image downloads
                    __import_dqtact_save_image(element.icon, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.family?.icon, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.role?.icon, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.element?.icon, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.rarity?.icon, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.rarity?.frame, baseURL, collection.listKey);
                    __import_dqtact_save_image(element.rarity?.background, baseURL, collection.listKey);
                });

                // delete the old entries and add the new ones
                await Entry.collection.deleteMany({ packageId: pkg.id, collectionId: collection.listKey });
                await Entry.collection.insertMany(jsonResponse);

                // import the names and descriptions for the collection
                __import_dqtact_js(collection.nameKey, pkg);
                __import_dqtact_js(collection.descKey, pkg);
                break;
            case "JS":
                __import_dqtact_js(collection.listKey, pkg);
                break;
        }
    }

    // second pass to link documents
    for (let collection of dqtactJson) {
        switch (collection.label) {
            case 'Units':
                const unitCursor = Entry.collection.find<IEntrySchema>({ packageId: pkg.id, collectionId: 'units', 'no': 1 });
                for (let unit = await unitCursor.next(); unit != null; unit = await unitCursor.next()) {
                    // unit drops
                    const dropsCursor = Entry.collection.find({ packageId: pkg.id, collectionId: 'unitdrop', 'base': (unit as any).code });
                    let drops = [];
                    let dropRates = [];
                    for (let drop = await dropsCursor.next(); drop != null; drop = await dropsCursor.next()) {
                        drops.push(drop.code);
                        dropRates.push(drop.rate);
                    }
                    // skills
                    const unitPage = await fetch(`${baseURL}/unit/${(unit as any).code}`);
                    const $ = cheerio.load(await unitPage.text());
                    const skills = $('.skills a');
                    let skillCodes: string[] = [];
                    skills.each((_: number, el: cheerio.Element) => {
                        const m = $(el).attr('href')?.match(/\/skill\/([0-9]+)/);
                        if (m && typeof m[1] === 'string') {
                            skillCodes.push(m[1]);
                        }
                    });
                    Entry.collection.updateOne({ id: unit.id }, { $set: { 'stageDrop': drops, 'dropRate': dropRates, 'skills': skillCodes } });
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

    __import_dqtact_save_image('SkillButtonBase_Attack.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Attack_2.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Attack_3.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Attack_4.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Debuff.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Debuff_2.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Debuff_3.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Debuff_4.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Heal.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Heal_2.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Heal_3.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Heal_4.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Extra.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Extra_2.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Extra_3.png', baseURL, 'skills');
    __import_dqtact_save_image('SkillButtonBase_Extra_4.png', baseURL, 'skills');

    Resource.collection.insertMany([
        {
            resId: 'ActiveSkillElement.DisplayName.Mera',
            packageId: pkg.id,
            values: { ko: "메라", en: "Frizz", ja: "メラ", zh_TW: "美拉" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Gira',
            packageId: pkg.id,
            values: { ko: "기라", en: "Sizz", ja: "ギラ", zh_TW: "基拉" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Hyado',
            packageId: pkg.id,
            values: { ko: "히야드", en: "Crack", ja: "ヒャド", zh_TW: "夏德" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Bagi',
            packageId: pkg.id,
            values: { ko: "바기", en: "Woosh", ja: "バギ", zh_TW: "巴基" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Io',
            packageId: pkg.id,
            values: { ko: "이오", en: "Bang", ja: "イオ", zh_TW: "伊奥" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Dein',
            packageId: pkg.id,
            values: { ko: "데인", en: "Zap", ja: "デイン", zh_TW: "迪恩" }
        },
        {
            resId: 'ActiveSkillElement.DisplayName.Dorma',
            packageId: pkg.id,
            values: { ko: "도르마", en: "Zam", ja: "ドルマ", zh_TW: "德爾瑪" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Slime',
            packageId: pkg.id,
            values: { ko: "슬라임", en: "Slime", ja: "スライム", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Dragon',
            packageId: pkg.id,
            values: { ko: "드래곤", en: "Dragon", ja: "ドラゴン", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Nature',
            packageId: pkg.id,
            values: { ko: "자연", en: "Nature", ja: "自然", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Beast',
            packageId: pkg.id,
            values: { ko: "마수", en: "Beast", ja: "魔獣", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Material',
            packageId: pkg.id,
            values: { ko: "물질", en: "Inorganic", ja: "物質", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Devil',
            packageId: pkg.id,
            values: { ko: "악마", en: "Demon", ja: "悪魔", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Zombie',
            packageId: pkg.id,
            values: { ko: "좀비", en: "Undead", ja: "ゾンビ", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Unknown',
            packageId: pkg.id,
            values: { ko: "???", en: "???", ja: "？？？", zh_TW: "" }
        },
        {
            resId: 'MonsterFamily.AbbrevDisplayName.Hero',
            packageId: pkg.id,
            values: { ko: "영웅", en: "Hero", ja: "英雄", zh_TW: "" }
        },
        {
            resId: 'MonsterRole.AbbrevDisplayName.Tank',
            packageId: pkg.id,
            values: { ko: "방어", en: "Defence", ja: "ぼうぎょ", zh_TW: "" }
        },
        {
            resId: 'MonsterRole.AbbrevDisplayName.Attacker',
            packageId: pkg.id,
            values: { ko: "공격", en: "Attack", ja: "こうげき", zh_TW: "" }
        },
        {
            resId: 'MonsterRole.AbbrevDisplayName.Magician',
            packageId: pkg.id,
            values: { ko: "마법", en: "Magic", ja: "まほう", zh_TW: "" }
        },
        {
            resId: 'MonsterRole.AbbrevDisplayName.Supporter',
            packageId: pkg.id,
            values: { ko: "보조", en: "Support", ja: "ほじょ", zh_TW: "" }
        },
        {
            resId: 'MonsterRole.AbbrevDisplayName.Debuffer',
            packageId: pkg.id,
            values: { ko: "방해", en: "Debuff", ja: "ぼうがい", zh_TW: "" }
        }
    ]);
}

function __import_dqtact_js(key: string | undefined, pkg: IPackageSchema): void {
    if (!key) { return; }

    try {
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
                                    packageId: pkg.id,
                                    values: { ko: "", en: "", ja: "", zh_TW: "" }
                                };
                            }
                            combinedLangs[resource].values[lang] = json[resource];
                        });
                    }
                }
                Resource.collection.insertMany(Object.values(combinedLangs));
            });
        });
    } catch (err: any) {
        console.log("[" + key + "]:", err);
    }
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
                        }).catch((err: Error) => console.log(chalk.red('Failed to create buffer'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`), err.message));
                    }).catch((err: Error) => console.log(chalk.red('Failed to create blob'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`), err.message));
                }).catch((err: Error) => console.log(chalk.red('Failed to download'), chalk.red.bgGreen(`${baseURL}/img/icon/${img}`), err.message));
            });
    }
}