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
    values?: {
        [lang in ISO639Code]?: string
    },
    /**
     * The resource value if it is the same across all languages
     */
    value?: string
}

export interface IResourceSchema extends IResource, Document { }

const ResourceSchema = new Schema<IResourceSchema>({
    resId: { type: String, required: true },
    packageId: { type: String, required: true },
    values: { type: Object, required: false },
    value: { type: String, required: false }
}, { collection: "resources", strict: "throw" });
ResourceSchema.index({ packageId: 1, resId: 1 }, { name: "resource_link" });

export default mongoose.model<IResourceSchema>("Resource", ResourceSchema);