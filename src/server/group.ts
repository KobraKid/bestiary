import chalk from "chalk";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { paths } from "./electron";
import { IGroupMetadata } from "../model/Group";
import { GroupForConfig, ICollection, IGroupConfig, IPackageConfig } from "../model/Config";
import { IPackageMetadata } from "../model/Package";
import { IpcMainEvent } from "electron";
import Entry from "../model/Entry";

let pkgNamespace = "";
let pkgConfig: IPackageConfig | null = null;
let pkgConfigFile = "";

/**
 * Loads the configuration data for a package.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @returns The configurtion data for a package
 */
async function createOrLoadPkgConfig(pkg: IPackageMetadata): Promise<IPackageConfig> {
    if (pkgConfig && pkgConfigFile) {
        savePkgConfig();
        pkgConfig = null;
    }

    pkgNamespace = pkg.ns;
    const pkgConfigPath = path.join(paths.config, path.basename(pkgNamespace));
    pkgConfigFile = path.join(pkgConfigPath, "config.json");

    try {
        await mkdir(pkgConfigPath, { recursive: true });

        if (!existsSync(pkgConfigFile)) {
            console.log(chalk.blue("Creating config file", pkgConfigFile));
            writeFileSync(pkgConfigFile, JSON.stringify(new Object()));
        }

        pkgConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: "utf-8" }));
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error loading package config at \"" + pkgConfigFile + "\"", err));
    }

    return pkgConfig || { "groups": [] };
}

/**
 * Loads the configuration data for a group from a package's configuration file.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @param group The group to load the config for
 * @returns The configuration data for a group
 */
export async function createOrLoadGroupConfig(pkg: IPackageMetadata, group: IGroupMetadata): Promise<IGroupConfig> {
    if (pkgNamespace !== pkg.ns) {
        await createOrLoadPkgConfig(pkg);
    }
    const groupConfig = pkgConfig?.groups?.find(c => c.groupId === group.ns) ?? { groupId: group.ns, collections: [] };
    await setCollectionMaximums(pkg, group, groupConfig);
    return groupConfig;
}

/**
 * Loads the configuration data for a group, and sends it back to the client.
 * 
 * @param event The event that triggered this load. The sender receives the resulting configuration data.
 * @param pkg The package to load the config for
 * @param group The group to load the config for
 */
export async function loadGroupConfig(event: IpcMainEvent, pkg: IPackageMetadata, group: IGroupMetadata): Promise<void> {
    const config = await createOrLoadGroupConfig(pkg, group);
    event.sender.send("context-menu:manage-group", pkg, group, config);
}

/**
 * Writes the package configuration to disk.
 */
export function savePkgConfig(): void {
    try {
        writeFileSync(pkgConfigFile, JSON.stringify(pkgConfig));
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error saving package config at \"" + pkgConfigFile + "\"", err));
    }
}

/**
 * Updates a colleciton's configuration data.
 * 
 * @param group The group to update
 * @param updatedConfig The updated configuration data
 */
export async function updateGroupConfig(event: IpcMainEvent, pkg: IPackageMetadata, group: IGroupMetadata, updatedConfig: GroupForConfig): Promise<void> {
    if (!pkgConfig) {
        await createOrLoadPkgConfig(pkg);
    }

    if (pkgConfig) {

        if (!pkgConfig.groups) {
            pkgConfig.groups = [];
        }

        const config: IGroupConfig = {
            ...updatedConfig,
            collections: await setCollectionMaximums(pkg, group, updatedConfig)
        };

        const index = pkgConfig.groups.findIndex(c => c.groupId === group.ns);
        if (index >= 0 && index < pkgConfig.groups?.length) {
            pkgConfig.groups[index]!.collections = config.collections;
        }
        else {
            pkgConfig.groups.push(config);
        }
    }
    event.sender.send("config:updated-group-config", updatedConfig);
}

/**
 * Updates the collected status for an entry in a particular group.
 * If the entry is already marked as collected, it is removed.
 * If the entry is not already marked as collected, it is added.
 * 
 * @param event The event that triggered this update
 * @param updatedGroup The group to update
 * @param collectionId The collection within the group to update
 * @param entryId The entry to add or remove
 * @param value: The new numeric value of the entry, if the type of this collection is number
 */
export function updateCollectedStatusForEntry(event: IpcMainEvent, updatedGroup: IGroupMetadata, collectionId: number, entryId: string, value?: number): void {
    if (pkgConfig?.groups) {
        const group = pkgConfig.groups.find(g => g.groupId === updatedGroup.ns);
        if (!group) { return; }

        const collection = group.collections.find(c => c.id === collectionId);
        if (!collection) { return; }

        let bucketToRemoveFrom = "";
        let bucketToAddTo = "";

        switch (collection.type) {
            case "boolean":
                if (collection.buckets["collected"] && collection.buckets["collected"].includes(entryId)) {
                    bucketToRemoveFrom = "collected";
                } else {
                    bucketToAddTo = "collected";
                }
                break;
            case "number":
                for (const bucket in Object.keys(collection.buckets)) {
                    if (collection.buckets[bucket]?.includes(entryId)) {
                        bucketToRemoveFrom = bucket;
                        break;
                    }
                }
                bucketToAddTo = "" + value ?? 0;
                break;
        }

        if (bucketToRemoveFrom !== "") {
            console.log(`Removing ${collection.name} ${entryId} from ${bucketToRemoveFrom}`);
            collection.buckets[bucketToRemoveFrom]?.splice(collection.buckets[bucketToRemoveFrom]!.indexOf(entryId), 1);
        }
        if (bucketToAddTo !== "") {
            console.log(`Adding ${collection.name} ${entryId} to ${bucketToAddTo}`);
            collection.buckets[bucketToAddTo]?.push(entryId);
        }

        event.sender.send("config:updated-group-config", group);
    }
}

async function setCollectionMaximums(pkg: IPackageMetadata, group: IGroupMetadata, config: GroupForConfig): Promise<ICollection[]> {
    const collections: ICollection[] = [];
    for (const collection of config.collections) {
        collections.push({
            ...collection,
            available: await Entry.find({ packageId: pkg.ns, groupId: group.ns }).count().exec()
        });
    }
    return collections;
}