export interface IPackageConfig {
    [key: string]: ICollectionConfig[]
}

export interface ICollectionConfig {
    id: string,
    name: string,
    color: string,
    categories: string[],
    spoilers: string[]
}