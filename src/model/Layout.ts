import mongoose, { Document, Schema } from "mongoose";
import { ISO639Code } from "./Package";
import { ViewType } from "../server/database";

export interface ILayout {
    packageId: string,
    groupId: string,
    bid: string,
    viewType: ViewType,
    sortValues?: {
        [key: string]: string | string[]
    },
    groupValues?: {
        [key: string]: number | number[]
    }
    values: {
        [key in ISO639Code]?: {
            layout: string,
            style: string,
            script: string
        }
    }
}

export interface ILayoutSchema extends ILayout, Document { }

const LayoutSchema = new Schema<ILayoutSchema>({
    packageId: { type: String, required: true },
    groupId: { type: String, required: true },
    bid: { type: String, required: true },
    viewType: { type: String, required: true },
    sortValues: { type: Object, required: false },
    groupValues: { type: Object, required: false },
    values: { type: Object, required: true }
}, { collection: "layout", strict: "throw" });
LayoutSchema.index({ packageId: 1, groupId: 1, bid: 1 }, { name: "layout_link" });

export default mongoose.model<ILayoutSchema>("Layout", LayoutSchema);