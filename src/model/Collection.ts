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
        layout: Object.assign({}, collection.layout),
        layoutPreview: Object.assign({}, collection.layoutPreview),
        data: collection.data.map(entry => copyEntry(entry))
    };
    return copiedCollection;
}