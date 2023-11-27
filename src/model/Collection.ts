import { ICollectionConfig } from "./Config";
import { IEntryMetadata } from "./Entry";

export interface IGrouping {
    /**
     * Grouping name
     */
    name: string,
    /**
     * Attribute path to group on
     */
    path: string,
    /**
     * Buckets to group by.
     * 
     * If buckets contains strings, buckets will be created
     * for each value in the list, and an "Other" bucket
     * will be created if an entry is encountered that does
     * not match any bucket.
     * 
     * If buckets contains numbers, buckets will be created
     * with each number being the inclusive lower bound and
     * each consecutive number being the exclusive upper bound.
     * 
     * In either case, buckets will be displayed in the same
     * order they are listed.
     */
    buckets: {
        /**
         * Bucket name
         */
        name: string,
        /**
         * Bucket value
         */
        value: string
    }[] | {
        /**
         * Bucket name
         */
        name: string,
        /**
         * Bucket value
         */
        value: number
    }[]
}

export interface ISorting {
    /**
     * Sorting name
     */
    name: string,
    /**
     * Attribute path to sort by
     */
    path: string
}

export interface ICollectionMetadata {
    /**
     * Collection name
     */
    name: string,
    /**
     * Collection namespace
     */
    ns: string,
    /**
     * Collection is hidden
     */
    hidden?: boolean,
    /**
     * Collection is a map
     */
    isMap?: boolean,
    /**
     * Entries
     */
    entries: IEntryMetadata[],
    /**
     * Groupings for entries
     */
    groupings: IGrouping[],
    /** 
     * Sorting options for entries
     */
    sortings: ISorting[],
    /**
     * Style string
     */
    style?: string,
    /**
     * Collection configuration
     */
    config?: ICollectionConfig,
}