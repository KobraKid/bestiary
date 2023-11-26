import chalk from "chalk";
import path from "path";
import { mkdir } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { paths } from "./electron";
import { ICollectionMetadata } from "../model/Collection";
import { ICollectionConfig, IPackageConfig } from "../model/Config";
import { IPackageMetadata } from "../model/Package";
import { IpcMainEvent } from "electron";

/**
 * Loads the configuration data for a package.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @returns The configurtion data for a package
 */
async function createOrLoadConfig(pkg: IPackageMetadata): Promise<IPackageConfig> {
    const pkgConfigPath = path.join(paths.config, path.basename(pkg.ns));
    const pkgConfigFile = path.join(pkgConfigPath, "config.json");

    try {
        await mkdir(pkgConfigPath, { recursive: true });

        if (!existsSync(pkgConfigFile)) {
            console.log(chalk.blue("Creating config file", pkgConfigFile));
            writeFileSync(pkgConfigFile, JSON.stringify(new Object()));
        }

        const pkgConfig: IPackageConfig = JSON.parse(readFileSync(pkgConfigFile, { encoding: "utf-8" }));
        return pkgConfig;
    } catch (err: unknown) {
        console.log(chalk.white.bgRed("❌ Error loading package config at \"" + pkgConfigFile + "\"", err));
    }

    return {};
}

/**
 * Loads the configuration data for a collection from a package's configuration file.
 * If the package doesn't have a configuration file, one is created.
 * 
 * @param pkg The package to load the config file for
 * @param collection The collection to load the config for
 * @returns The configuration data for a collection
 */
async function createOrLoadCollectionConfig(pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<ICollectionConfig | undefined> {
    const pkgConfig = await createOrLoadConfig(pkg);
    let collectionConfig: ICollectionConfig | undefined;
    if (pkgConfig?.collections) {
        collectionConfig = pkgConfig.collections.find(c => c.collectionId === collection.ns) || { collectionId: collection.ns, groups: [] };
    }
    return collectionConfig;
}

export async function loadCollectionConfig(event: IpcMainEvent, pkg: IPackageMetadata, collection: ICollectionMetadata): Promise<void> {
    const config = await createOrLoadCollectionConfig(pkg, collection);
    event.sender.send("context-menu:manage-collection", pkg, collection, config);
}