import { SortOrder } from "mongoose";
import { IGroupConfig } from "./Config";
import { IEntryMetadata } from "./Entry";

export interface IGroupSettings {
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

export interface ISortSettings {
    /**
     * Sorting name
     */
    name: string,
    /**
     * Attribute path to sort by
     */
    path: string,
    /**
     * Sorting method
     */
    sortType: "string" | "number",
    /**
     * Sort direction
     */
    direction: SortOrder;
}

export interface IGroupMetadata {
    /**
     * Group name
     */
    name: string,
    /**
     * Group namespace
     */
    ns: string,
    /**
     * Group is hidden
     */
    hidden?: boolean,
    /**
     * Group is a map
     */
    isMap?: boolean,
    /**
     * Entries
     */
    entries: IEntryMetadata[],
    /**
     * Groupings for entries
     */
    groupSettings: IGroupSettings[],
    /** 
     * Sorting options for entries
     */
    sortSettings: ISortSettings[],
    /**
     * Style string
     */
    style?: string,
    /**
     * Group configuration
     */
    config?: IGroupConfig,
}