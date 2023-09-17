import mongoose, { Document, Schema } from "mongoose";

/**
 * Represents an entry in a collection
 */
export interface IEntryMetadata {
    /**
     * Package ID
     */
    packageId: string,
    /**
     * Collection ID
     */
    collectionId: string,
    /**
     * Bestiary ID
     */
    bid: string,
    /**
     * The values to use when grouping this entry
     */
    groupings?: {
        name: string,
        path: string,
        bucketValue: unknown
    }[],
    sortings?: {
        name: string,
        path: string,
        value: unknown
    }[],
    /**
     * Layout string
     */
    layout: string,
    /**
     * Style string
     */
    style?: string,
    /**
     * Script string
     */
    script?: string
}

export interface IEntrySchema extends Pick<IEntryMetadata, "packageId" | "collectionId" | "bid">, Document { }

const EntrySchema = new Schema<IEntrySchema>({
    packageId: { type: String, required: true, ref: "Package" },
    collectionId: { type: String, required: true },
    bid: { type: String, required: true }
    /* ...attributes: any */
}, { collection: "entries", strict: false });
EntrySchema.index({ packageId: 1, collectionId: 1, bid: 1 }, { name: "entry_link" });

// eslint-disable-next-line @typescript-eslint/no-var-requires
EntrySchema.plugin(require("mongoose-lean-id"));

export default mongoose.model<IEntrySchema>("Entry", EntrySchema);