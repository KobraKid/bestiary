import { IpcMainInvokeEvent } from "electron";
import fs, { mkdir } from 'fs/promises';
import envPaths from "env-paths";
import path from "path";
import chalk from "chalk";
import mongoose from "mongoose";
import { BuiltInImporter, getImporterName } from "./BuiltInImporters";
import Package, { IPackageSchema } from "../model/Package";
import Entry from "../model/Entry";

export async function importRocketSlime(event: IpcMainInvokeEvent) {
    const pkg = await Package.findOneAndUpdate({ ns: BuiltInImporter.dqheroesrocketslime }, {
        name: getImporterName(BuiltInImporter.dqheroesrocketslime),
        ns: BuiltInImporter.dqheroesrocketslime,
        icon: "icon.jpg",
        collections: [
            { name: "Slimes", ns: "slimes" },
            { name: "Tanks", ns: "tanks" },
            { name: "Upgrades", ns: "upgrades" },
            { name: "Items", ns: "items" },
            { name: "Recipes", ns: "recipes" },
            { name: "Enemies", ns: "enemies" },
            { name: "Bosses", ns: "bosses" },
            { name: "Locations", ns: "locations" },
        ]
    }, { upsert: true, new: true });

    await __import_slimes(pkg);
    await __import_locations(pkg);
    await __build_links(pkg);

    event.sender.send('importer:import-complete');
}

const slimes: { name: string, sprite: string, locationId: number, rewardId: number, tactics?: string[], crewDescription?: string, id?: mongoose.Types.ObjectId }[] = [
    { name: 'Anjello', sprite: 'anjello.png', locationId: 3, rewardId: 0 },
    { name: 'Baron Blubba', sprite: 'baron-blubba.png', locationId: 1, rewardId: 0 },
    { name: 'Big Daddy', sprite: 'big-daddy.png', locationId: 0, rewardId: 0 },
    { name: 'Bitsy', sprite: 'bitsy.png', locationId: 3, rewardId: 0 },
    { name: 'Blingaling', sprite: 'blingaling.png', locationId: 0, rewardId: 0 },
    { name: 'Bo', sprite: 'bo.png', locationId: 4, rewardId: 0 },
    { name: 'Bouncer', sprite: 'bouncer.png', locationId: 0, rewardId: 0 },
    { name: 'Bubbilly', sprite: 'bubbilly.png', locationId: 1, rewardId: 0 },
    { name: 'Bud', sprite: 'bud.png', locationId: 2, rewardId: 0 },
    { name: 'Bunny', sprite: 'bunny.png', locationId: 2, rewardId: 0 },
    { name: 'Cheruboing', sprite: 'cheruboing.png', locationId: 0, rewardId: 0 },
    { name: 'Clawdia', sprite: 'clawdia.png', locationId: 0, rewardId: 0 },
    { name: 'Clawrence', sprite: 'clawrence.png', locationId: 0, rewardId: 0 },
    { name: 'Count Calories', sprite: 'count-calories.png', locationId: 0, rewardId: 0 },
    { name: 'Count Dragoola', sprite: 'count-dragoola.png', locationId: 3, rewardId: 0 },
    { name: 'Crystal Chronicler', sprite: 'crystal-chronicler.png', locationId: 3, rewardId: 0 },
    { name: 'Curate Rollo', sprite: 'curate-rollo.png', locationId: 2, rewardId: 0 },
    { name: 'Curator', sprite: 'curator.png', locationId: 0, rewardId: 0 },
    { name: 'Curedon Bleu', sprite: 'curedon-bleu.png', locationId: 2, rewardId: 0 },
    { name: 'Diablob', sprite: 'diablob.png', locationId: 3, rewardId: 0 },
    { name: 'Dragory', sprite: 'dragory.png', locationId: 3, rewardId: 0 },
    { name: 'Drake', sprite: 'drake.png', locationId: 4, rewardId: 0 },
    { name: 'Duke Swellington', sprite: 'duke-swellington.png', locationId: 0, rewardId: 0 },
    { name: 'Dummy', sprite: 'dummy.png', locationId: 3, rewardId: 0 },
    { name: 'Earl Luminem', sprite: 'earl-luminem.png', locationId: 1, rewardId: 0 },
    { name: 'Early Burly', sprite: 'early-burly.png', locationId: 4, rewardId: 0 },
    { name: 'Eggbard', sprite: 'eggbard.png', locationId: 0, rewardId: 0 },
    { name: 'Fangummy Bob', sprite: 'fangummy-bob.png', locationId: 0, rewardId: 0 },
    { name: 'Flabbot Flancisco', sprite: 'flabbot-flancisco.png', locationId: 0, rewardId: 0 },
    { name: 'Flanpa', sprite: 'flanpa.png', locationId: 3, rewardId: 0 },
    { name: 'Flan Spinel', sprite: 'flan-spinel.png', locationId: 0, rewardId: 0 },
    { name: 'Flantenna', sprite: 'flantenna.png', locationId: 1, rewardId: 0 },
    { name: 'Flopsy', sprite: 'flopsy.png', locationId: 0, rewardId: 0 },
    { name: 'Frankenslime', sprite: 'frankenslime.png', locationId: 0, rewardId: 0 },
    { name: 'George', sprite: 'george.png', locationId: 1, rewardId: 0 },
    { name: 'Goobrielle', sprite: 'goobrielle.png', locationId: 3, rewardId: 0 },
    { name: 'Goochie', sprite: 'goochie.png', locationId: 0, rewardId: 0 },
    { name: 'Goodith', sprite: 'goodith.png', locationId: 2, rewardId: 0 },
    { name: 'Goolia', sprite: 'goolia.png', locationId: 2, rewardId: 0 },
    { name: 'Goopid', sprite: 'goopid.png', locationId: 3, rewardId: 0 },
    { name: 'Goosashi', sprite: 'goosashi.png', locationId: 4, rewardId: 0 },
    { name: 'Gooshido', sprite: 'gooshido.png', locationId: 4, rewardId: 0 },
    { name: 'Gootrude', sprite: 'gootrude.png', locationId: 2, rewardId: 0 },
    { name: 'Goozanna', sprite: 'goozanna.png', locationId: 1, rewardId: 0 },
    { name: 'Gregg', sprite: 'gregg.png', locationId: 0, rewardId: 0 },
    { name: 'Her Royal Wobbliness', sprite: 'her-royal-wobbliness.png', locationId: 0, rewardId: 0 },
    { name: 'His Royal Wobbliness', sprite: 'his-royal-wobbliness.png', locationId: 1, rewardId: 0 },
    { name: 'Hooly', sprite: 'hooly.png', locationId: 2, rewardId: 0 },
    { name: 'Itsy', sprite: 'itsy.png', locationId: 3, rewardId: 0 },
    { name: 'Jewelian', sprite: 'jewelian.png', locationId: 0, rewardId: 0 },
    { name: 'Jumpy', sprite: 'jumpy.png', locationId: 1, rewardId: 0 },
    { name: 'Kworry', sprite: 'kworry.png', locationId: 3, rewardId: 0 },
    { name: 'Lady Poly', sprite: 'lady-poly.png', locationId: 3, rewardId: 0 },
    { name: 'Lord Lard', sprite: 'lord-lard.png', locationId: 0, rewardId: 0 },
    { name: 'Lord Roly', sprite: 'lord-roly.png', locationId: 0, rewardId: 0 },
    { name: 'Mag Max', sprite: 'mag-max.png', locationId: 3, rewardId: 0 },
    { name: 'Mama Mia', sprite: 'mama-mia.png', locationId: 0, rewardId: 0 },
    { name: 'Meggan', sprite: 'meggan.png', locationId: 0, rewardId: 0 },
    { name: 'Merc', sprite: 'merc.png', locationId: 3, rewardId: 0 },
    { name: 'Michelle', sprite: 'michelle.png', locationId: 0, rewardId: 0 },
    { name: 'Morrie Morrie', sprite: 'morrie-morrie.png', locationId: 0, rewardId: 0 },
    { name: 'Mother Glooperior', sprite: 'mother-glooperior.png', locationId: 1, rewardId: 0 },
    { name: 'Mr. Hooly', sprite: 'mr-hooly.png', locationId: 0, rewardId: 0 },
    { name: 'Mrs. Hooly', sprite: 'mrs-hooly.png', locationId: 0, rewardId: 0 },
    { name: 'Namby', sprite: 'namby.png', locationId: 2, rewardId: 0 },
    { name: 'Pamby', sprite: 'pamby.png', locationId: 0, rewardId: 0 },
    { name: 'Patch', sprite: 'patch.png', locationId: 0, rewardId: 0 },
    { name: 'Pebbles', sprite: 'pebbles.png', locationId: 3, rewardId: 0 },
    { name: 'Peewee', sprite: 'peewee.png', locationId: 1, rewardId: 0 },
    { name: 'Perry', sprite: 'perry.png', locationId: 2, rewardId: 0 },
    { name: 'Plopstar', sprite: 'plopstar.png', locationId: 1, rewardId: 0 },
    { name: 'Poxie', sprite: 'poxie.png', locationId: 2, rewardId: 0 },
    { name: 'Prince Pigummy', sprite: 'prince-pigummy.png', locationId: 2, rewardId: 0 },
    { name: 'Princess Gluttonella', sprite: 'princess-gluttonella.png', locationId: 0, rewardId: 0 },
    { name: 'Roboglob', sprite: 'roboglob.png', locationId: 0, rewardId: 0 },
    { name: 'Rocky', sprite: 'rocky.png', locationId: 3, rewardId: 0 },
    { name: 'Rustle Sprout', sprite: 'rustle-sprout.png', locationId: 2, rewardId: 0 },
    { name: 'Sheala', sprite: 'sheala.png', locationId: 1, rewardId: 0 },
    { name: 'Shelby', sprite: 'shelby.png', locationId: 2, rewardId: 0 },
    { name: 'Sir Sudsy', sprite: 'sir-sudsy.png', locationId: 0, rewardId: 0 },
    { name: 'Sliborg', sprite: 'sliborg.png', locationId: 0, rewardId: 0 },
    { name: 'Slimechanic', sprite: 'slimechanic.png', locationId: 2, rewardId: 0 },
    { name: 'Sliminator', sprite: 'sliminator.png', locationId: 0, rewardId: 0 },
    { name: 'Soapia', sprite: 'soapia.png', locationId: 0, rewardId: 0 },
    { name: 'Speckles', sprite: 'speckles.png', locationId: 1, rewardId: 0 },
    { name: 'Splatrick', sprite: 'splatrick.png', locationId: 3, rewardId: 0 },
    { name: 'Splodgy Dave', sprite: 'splodgy-dave.png', locationId: 0, rewardId: 0 },
    { name: 'Spot', sprite: 'spot.png', locationId: 0, rewardId: 0 },
    { name: 'Starthur', sprite: 'starthur.png', locationId: 1, rewardId: 0 },
    { name: 'Startist', sprite: 'startist.png', locationId: 2, rewardId: 0 },
    { name: 'Stony', sprite: 'stony.png', locationId: 1, rewardId: 0 },
    { name: 'Swotsy', sprite: 'swotsy.png', locationId: 1, rewardId: 0 },
    { name: 'Teeny', sprite: 'teeny.png', locationId: 0, rewardId: 0 },
    { name: 'Tickled Pink', sprite: 'tickled-pink.png', locationId: 1, rewardId: 0 },
    { name: 'Tickles', sprite: 'tickles.png', locationId: 0, rewardId: 0 },
    { name: 'Tokyo Tom', sprite: 'tokyo-tom.png', locationId: 4, rewardId: 0 },
    { name: 'Viscount Viscous', sprite: 'viscount-viscous.png', locationId: 0, rewardId: 0 },
    { name: 'Weeny', sprite: 'weeny.png', locationId: 0, rewardId: 0 },
    { name: 'Wild Fang', sprite: 'wild-fang.png', locationId: 0, rewardId: 0 },
    { name: 'Winkles', sprite: 'winkles.png', locationId: 2, rewardId: 0 },
];

const locations: { name: string, id?: mongoose.Types.ObjectId }[] = [
    { name: "Boingburg" },
    { name: "Forewood Forest" },
    { name: "Tootinschleiman's Tomb" },
    { name: "Mt. Krakatroda" },
    { name: "Backwoods" },
    { name: "Callmigh Bluff" },
    { name: "Flucifer's Necropolis" },
    { name: "Flying Clawtress" },
];

async function __import_slimes(pkg: IPackageSchema) {
    for (let i = 0; i < slimes.length; i++) {
        const entry = slimes[i]!;
        const doc = await Entry.findOneAndUpdate({ packageId: pkg.id, collectionId: 'slimes', no: i },
            {
                packageId: pkg.id,
                collectionId: 'slimes',
                no: i,
                name: entry.name,
                sprite: entry.sprite,
                tactics: entry.tactics,
                crewDescription: entry.crewDescription
            }, { upsert: true, new: true });
        entry.id = doc.id;
    }
    try {
        await mkdir(path.join(envPaths('Bestiary', { suffix: '' }).data, pkg.ns, 'images', 'slimes'), { recursive: true });
    } catch (err) {
        if (!(err as Error).message.startsWith('EEXIST')) { console.log((err as Error).message); }
    } finally {
        for (const entry of slimes) {
            try {
                await fs.stat(path.join(envPaths('Bestiary', { suffix: '' }).data, pkg.ns, 'images', 'slimes', entry.sprite));
                // file exists, no need to re-download
            }
            catch (err) {
                // fetch the file
                try {
                    const imgResponse = await fetch(encodeURI('https://www.realmofdarkness.net/dq/wp-content/img/ds/rs/rescue/' + entry.sprite));
                    // convert to a blob
                    const imgBlob = await imgResponse.blob();
                    // convert to a buffer
                    const imgArrayBuffer = await imgBlob.arrayBuffer();
                    // write to disk
                    await fs.writeFile(path.join(envPaths('Bestiary', { suffix: '' }).data, pkg.ns, 'images', 'slimes', entry.sprite), Buffer.from(imgArrayBuffer));
                }
                catch (err) {
                    console.log(chalk.red('Failed to download'), chalk.red.bgGreen('https://www.realmofdarkness.net/dq/wp-content/img/ds/rs/rescue/' + entry.sprite), chalk.red('to slimes'), err.message)
                }
            }
        }
    }
}

async function __import_locations(pkg: IPackageSchema) {
    for (let i = 0; i < locations.length; i++) {
        const entry = locations[i]!;
        const doc = await Entry.findOneAndUpdate({ packageId: pkg.id, collectionId: 'locations', no: i },
            {
                packageId: pkg.id,
                collectionId: 'locations',
                no: i,
                name: entry.name
            }, { upsert: true, new: true });
        entry.id = doc.id;
    }
}

async function __build_links(pkg: IPackageSchema) {
    // Slimes to locations
    for (let i = 0; i < slimes.length; i++) {
        const slime = slimes[i]!;
        await Entry.findOneAndUpdate({ packageId: pkg.id, collectionId: 'slimes', no: i },
            {
                locationId: locations[slime.locationId]!.id
            });
    }
}