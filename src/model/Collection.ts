import IEntry from "./Entry";

export interface ICollectionMetadata {
    /**
     * Collection name
     */
    name: string,
    /**
     * Collection ID
     */
    id: string,
    /**
     * Entries
     */
    entries: IEntry[],
    /**
     * Style string
     */
    style?: string
}