import mongoose, { Document, Schema } from "mongoose";
import { ICollectionMetadata } from "./Collection";

export enum ISO639Code {
    Chinese = "zh",
    English = "en",
    Japanese = "ja",
    Korean = "ko",
}

export function getLangDisplayName(lang: ISO639Code) {
    switch (lang) {
        case ISO639Code.Chinese:
            return "Chinese";
        case ISO639Code.English:
            return "English";
        case ISO639Code.Japanese:
            return "Japanese";
        case ISO639Code.Korean:
            return "Korean";
    }
}

/**
 * Represents a package's metadata
 */
export interface IPackageMetadata {
    /**
     * Package name
     */
    name: string,
    /** 
     * Package namespace
     */
    ns: string,
    /**
     * Package location
     */
    path: string,
    /**
     * Package icon
     */
    icon: string,
    /**
     * List of collections contained in this package
     */
    collections: ICollectionMetadata[],
    /**
     * List of supported languages, as ISO 639-1 codes
     */
    langs: ISO639Code[]
}

export interface IPackageSchema extends IPackageMetadata, Document { }

const PkgSchema = new Schema<IPackageSchema>({
    name: { type: String, required: true },
    ns: { type: String, required: true },
    path: { type: String, required: false },
    icon: { type: String, required: true },
    collections: [{
        ns: { type: String, required: true },
        name: { type: String, required: true },
        hidden: { type: Boolean, required: false },
        groupings: {
            type: [{
                name: { type: String, required: true },
                attribute: { type: String, required: true }
            }],
            required: false
        }
    }],
    langs: { type: [String], required: true }
}, { collection: "packages" });

// eslint-disable-next-line @typescript-eslint/no-var-requires
PkgSchema.plugin(require("mongoose-lean-id"));

export default mongoose.model<IPackageSchema>("PackageMetadata", PkgSchema);