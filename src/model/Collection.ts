import IEntry, { copyEntry } from "./Entry";
import { ILayoutProps, LAYOUT_TYPE } from "./Layout";

/**
 * Represents a collection
 */
export default interface ICollection {
    /**
     * Collection name
     */
    name: string,
    /**
     * If a source is provided, this collection's data will be loaded from a separate
     * JSON file relative to the package.json file.
     */
    source?: string,
    /**
     * If this is true, this collection will not appear in the collection menu
     * 
     * This can be used to create sub-collections that don't make sense to display as a whole
     */
    hidden?: boolean,
    /**
     * Layout for displaying a single entry in the collection
     */
    layout: ILayoutProps,
    /**
     * Layout for previewing a single entry in the collection
     */
    layoutPreview: ILayoutProps,
    /**
     * Collection's entries
     */
    data: IEntry[],
}

export function buildCollection(name: string): ICollection {
    return {
        name: name,
        hidden: false,
        layout: {
            type: LAYOUT_TYPE.string
        },
        layoutPreview: {
            type: LAYOUT_TYPE.string
        },
        data: []
    };
}

export function copyCollection(collection: ICollection): ICollection {
    let copiedCollection: ICollection = {
        name: collection.name,
        hidden: collection.hidden,
        layout: Object.assign({}, collection.layout),
        layoutPreview: Object.assign({}, collection.layoutPreview),
        data: collection.data.map(entry => copyEntry(entry))
    };
    return copiedCollection;
}