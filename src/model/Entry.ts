import mongoose, { Document, Schema, Types } from "mongoose";

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
   * Entry ID
   */
  id: Types.ObjectId,
  /**
   * Layout string
   */
  layout: string,
  /**
   * Style string
   */
  style?: string
}

export interface IEntrySchema extends Pick<IEntryMetadata, 'packageId' | 'collectionId'>, Document { }

const EntrySchema = new Schema<IEntrySchema>({
  packageId: { type: String, required: true, ref: 'Package' },
  collectionId: { type: String, required: true }
  /* ...attributes: any */
}, { collection: 'entries', strict: false });

EntrySchema.plugin(require('mongoose-lean-id'));

export default mongoose.model<IEntrySchema>('Entry', EntrySchema);