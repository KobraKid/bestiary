import chalk from "chalk";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { paths } from "./electron";
import { IGroupMetadata } from "../model/Group";
import { IGroupConfig, IPackageConfig } from "../model/Config";
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
 * @param config The updated configuration data
 */
export async function updateGroupConfig(event: IpcMainEvent, pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig): Promise<void> {
    if (!pkgConfig) {
        await createOrLoadPkgConfig(pkg);
    }

    if (pkgConfig) {

        if (!pkgConfig.groups) {
            pkgConfig.groups = [];
        }

        await setCollectionMaximums(pkg, group, config);

        const index = pkgConfig.groups.findIndex(c => c.groupId === group.ns);
        if (index >= 0 && index < pkgConfig.groups?.length) {
            pkgConfig.groups[index]!.collections = config.collections;
        }
        else {
            pkgConfig.groups.push(config);
        }
    }
    event.sender.send("config:updated-group-config", config);
}

/**
 * Updates the collected status for an entry in a particular group.
 * If the entry is already marked as collected, it is removed.
 * If the entry is not already marked as collected, it is added.
 * 
 * @param event The event that triggered this update
 * @param group The group to update
 * @param groupId The group within the group to update
 * @param entryId The entry to add or remove
 */
export function updateCollectedStatusForEntry(event: IpcMainEvent, group: IGroupMetadata, groupId: number, entryId: string): void {
    if (pkgConfig?.groups) {
        const config = pkgConfig.groups.find(c => c.groupId === group.ns);
        if (config) {
            const group = config.collections.find(g => g.id === groupId);
            if (group?.entries.includes(entryId)) {
                group.entries.splice(group.entries.indexOf(entryId), 1);
            }
            else {
                group?.entries.push(entryId);
            }
            event.sender.send("config:updated-group-config", config);
        }
    }
}

async function setCollectionMaximums(pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig) {
    for (const collection of config.collections) {
        collection.max = await Entry.find({ packageId: pkg.ns, groupId: group.ns }).count().exec();
    }
}