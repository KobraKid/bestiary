import { IEntryMetadata } from "./Entry";

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
     * Entries
     */
    entries: IEntryMetadata[],
    /**
     * Groupings for entries
     */
    groupings: {
        /**
         * Grouping name
         */
        name: string,
        /**
         * Attribute to group on
         */
        attribute: string
    }[],
    /**
     * Style string
     */
    style?: string
}