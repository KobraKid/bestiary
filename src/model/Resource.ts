import mongoose, { Document, Schema } from "mongoose";
import { ISO639Code } from "./Package";

/**
 * Represents a translatable resource
 */
export interface IResource {
    /**
     * Resource name
     */
    resId: string,
    /** 
     * Resource package ID
     */
    packageId: string,
    /**
     * The resource values for each supported language
     */
    values: {
        [lang in ISO639Code]: string
    }
}

export interface IResourceSchema extends IResource, Document { }

const ResourceSchema = new Schema<IResourceSchema>({
    resId: { type: String, required: true },
    packageId: { type: String, required: true },
    values: { type: Object, required: true }
}, { collection: "resources" });
ResourceSchema.index({ packageId: 1, resId: 1 }, { name: "resource_link" });

export default mongoose.model<IResourceSchema>("Resource", ResourceSchema);