import { IEntryMetadata } from "./Entry";

export interface IMap extends IEntryMetadata {
    name: string,
    image: string,
    isPixelArt?: boolean,
    width: number,
    height: number,
    landmarks: ILandmark[]
}

export interface ILandmark {
    x: number,
    y: number,
    w: number,
    h: number,
    shape: string,
    link?: string,
    preview: string
}