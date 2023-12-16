import chalk from "chalk";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { paths } from "./electron";
import { ICollectionMetadata } from "../model/Collection";
import { ICollectionConfig, IPackageConfig } from "../model/Config";
import { IPackageMetadata } from "../model/Package";
import { IpcMainEvent } from "electron";

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
async function createOrLoadConfig(pkg: IPackageMetadata): Promise<IPackageConfig> {
    if (pkgConfig && pkgConfigFile) {
        saveConfig();
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

    return pkgConfig || { "collections": [] };
}

/**
 * Loads the configuration data for a collection from a package's configuration file.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @param collection The collection to load the config for
 * @returns The configuration data for a collection
 */
export async function createOrLoadCollectionConfig(pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionConfig> {
    if (pkgNamespace !== pkg.ns) {
        await createOrLoadConfig(pkg);
    }
    return pkgConfig?.collections?.find(c => c.collectionId === collection.ns) ?? { collectionId: collection.ns, groups: [] };
}

/**
 * Loads the configuration data for a collection, and sends it back to the client.
 * 
 * @param event The event that triggered this load. The sender receives the resulting configuration data.
 * @param pkg The package to load the config for
 * @param collection The collection to load the config for
 */
export async function loadCollectionConfig(event: IpcMainEvent, pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<void> {
    const config = await createOrLoadCollectionConfig(pkg, collection);
    event.sender.send("context-menu:manage-collection", pkg, collection, config);
}

/**
 * Writes the package configuration to disk.
 */
export function saveConfig(): void {
    try {
        writeFileSync(pkgConfigFile, JSON.stringify(pkgConfig));
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error saving package config at \"" + pkgConfigFile + "\"", err));
    }
}

/**
 * Updates a colleciton's configuration data.
 * 
 * @param collection The collection to update
 * @param config The updated configuration data
 */
export async function updateCollectionConfig(_event: IpcMainEvent, pkg: IPackageMetadata, collection: ICollectionMetadata, config: ICollectionConfig): Promise<void> {
    if (!pkgConfig) {
        await createOrLoadConfig(pkg);
    }

    if (pkgConfig) {

        if (!pkgConfig.collections) {
            pkgConfig.collections = [];
        }

        const index = pkgConfig.collections.findIndex(c => c.collectionId === collection.ns);
        if (index >= 0 && index < pkgConfig.collections?.length) {
            pkgConfig.collections[index]!.groups = config.groups;
        }
        else {
            pkgConfig.collections.push(config);
        }
    }
}

/**
 * Updates the collected status for an entry in a particular group.
 * If the entry is already marked as collected, it is removed.
 * If the entry is not already marked as collected, it is added.
 * 
 * @param _event The event that triggered this update
 * @param collection The collection to update
 * @param groupId The group within the collection to update
 * @param entryId The entry to add or remove
 */
export function updateCollectedStatusForEntry(_event: IpcMainEvent, collection: ICollectionMetadata, groupId: number, entryId: string): void {
    if (pkgConfig?.collections) {
        const config = pkgConfig.collections.find(c => c.collectionId === collection.ns);
        if (config) {
            const group = config.groups.find(g => g.id === groupId);
            if (group?.entries.includes(entryId)) {
                group.entries.splice(group.entries.indexOf(entryId), 1);
            }
            else {
                group?.entries.push(entryId);
            }
        }
    }
}