import mongoose, { Document, Schema } from "mongoose";
import { ISO639Code } from "./Package";

export interface ILayout {
    bid: string,
    packageId: string,
    values: {
        [key in ISO639Code]?: {
            preview: string,
            view: string
        }
    }
}

export interface ILayoutSchema extends ILayout, Document { }

const LayoutSchema = new Schema<ILayoutSchema>({
    bid: { type: String, required: true },
    packageId: { type: String, required: true },
    values: { type: Object, required: true }
}, { collection: "layout" });
LayoutSchema.index({ packageId: 1, bid: 1 }, { name: "layout_link" });

export default mongoose.model<ILayoutSchema>("Layout", LayoutSchema);