export interface IPackageConfig {
    collections?: ICollectionConfig[]
}

export interface ICollectionConfig {
    collectionId: string,
    groups: IGroupConfig[]
}

export interface IGroupConfig {
    id: number,
    name: string,
    backgroundColor: string,
    color: string,
    entries: string[],
    categories?: string[],
    spoilers?: string[],
    hideWhenCollected?: boolean
}