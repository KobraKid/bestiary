export interface IPackageConfig {
    /**
     * The group configuration list
     */
    groups?: IGroupConfig[]
}

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
     * The collected entries
     */
    entries: string[],
    categories?: string[],
    spoilers?: string[],
    hideWhenCollected?: boolean
}