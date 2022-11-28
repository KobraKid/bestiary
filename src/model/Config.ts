export interface IPackageConfig {
    [key: string]: ICollectionConfig[]
}

export interface ICollectionConfig {
    id: number,
    name: string,
    color: string,
    textColor: string,
    categories: string[],
    spoilers: string[],
    collectedEntryIds: string[],
}