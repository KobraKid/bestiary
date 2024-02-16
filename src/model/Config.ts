//#region App Config
/**
 * Application config
 */
export interface IAppConfig {
    serverConfig: IServerConfig,
    appearance: IAppearanceConfig
}

/**
 * Server config
 */
export interface IServerConfig {
    serverList: IServerInstance[]
}

export interface IServerInstance {
    url: string,
    username: string,
    password: string
}

/**
 * Appearance config
 */
export interface IAppearanceConfig {
    bgColor: string,
}
//#endregion
//#region Package config
/**
 * Package config
 */
export interface IPackageConfig {
    /**
     * The group configuration list
     */
    groups?: IGroupConfig[]
}

/**
 * Group config
 */
export interface IGroupConfig {
    /** 
     * The group ID
     */
    groupId: string,
    /**
     * The group's collections
     */
    collections: ICollection[]
}
//#endregion
//#region Collection config
export type CollectionType = "boolean" | "number";

/**
 * Collection config
 */
export interface ICollection {
    /**
     * The collection ID
     */
    id: number,
    /**
     * The collection name
     */
    name: string,
    /**
     * The collection background color
     */
    backgroundColor: string,
    /**
     * The collection text color
     */
    color: string,
    /**
     * The type of the collection
     */
    type: CollectionType,
    /**
     * The minimum value entries in this collection can have
     */
    min?: number,
    /**
     * The maximum value entries in this collection can have
     */
    max?: number,
    /**
     * The buckets containing collected entries.
     * 
     * If the collection type is "boolean," one bucket will
     * exist for the collected entries.
     * 
     * If the collection type is "number," a bucket will
     * exist for each number between `min` and `max` inclusive.
     */
    buckets: { [key: string]: string[] },
    categories?: string[],
    spoilers?: string[],
    hideWhenCollected?: boolean,
    /**
     * The available number of collectible entries
     */
    available?: number,
}

export type CollectionForConfig = Omit<ICollection, "available">;
export type GroupForConfig = Omit<IGroupConfig, "collections"> & { collections: CollectionForConfig[] };
//#endregion