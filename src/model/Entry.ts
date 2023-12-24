import mongoose, { Document, Schema } from "mongoose";
import { IGroupSettings, ISortSettings } from "./Group";

/**
 * Represents an entry in a group
 */
export interface IEntryMetadata {
    /**
     * Package ID
     */
    packageId: string,
    /**
     * Group ID
     */
    groupId: string,
    /**
     * Bestiary ID
     */
    bid: string,
    /**
     * The values to use when grouping this entry
     */
    groupSettings: IGroupSettings[],
    /**
     * The values to use when sorting this entry
     */
    sortSettings: ISortSettings[],
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

export interface IEntrySchema extends Pick<IEntryMetadata, "packageId" | "groupId" | "bid">, Document { }

const EntrySchema = new Schema<IEntrySchema>({
    packageId: { type: String, required: true, ref: "Package" },
    groupId: { type: String, required: true },
    bid: { type: String, required: true }
    /* ...attributes: any */
}, { collection: "entries", strict: false });
EntrySchema.index({ packageId: 1, groupId: 1, bid: 1 }, { name: "entry_link" });

export default mongoose.model<IEntrySchema>("Entry", EntrySchema);