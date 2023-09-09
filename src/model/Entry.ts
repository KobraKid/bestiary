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
   * Layout string
   */
  layout: string,
  /**
   * Style string
   */
  style?: string
}

export interface IEntrySchema extends Pick<IEntryMetadata, "packageId" | "collectionId" | "bid">, Document { }

const EntrySchema = new Schema<IEntrySchema>({
    packageId: { type: String, required: true, ref: "Package" },
    collectionId: { type: String, required: true },
    bid: { type: String, required: true }
    /* ...attributes: any */
}, { collection: "entries", strict: false });

// eslint-disable-next-line @typescript-eslint/no-var-requires
EntrySchema.plugin(require("mongoose-lean-id"));

export default mongoose.model<IEntrySchema>("Entry", EntrySchema);