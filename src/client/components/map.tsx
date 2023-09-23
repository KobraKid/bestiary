import React, { WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import ScrollContainer from "react-indiana-drag-scroll";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { ILandmark, IMap } from "../../model/Map";
import "../styles/map.scss";

export interface IMapProps {
    /**
     * The map to display
     */
    map: IMap,
}

export const Map: React.FC<IMapProps> = (props: IMapProps) => {
    const { map } = props;

    const [scale, setScale] = useState<number>(1);
    const minScale = 0.1;
    const maxScale = 10;
    const increment = 0.1;

    const container = useRef<HTMLElement>(null);

    useEffect(() => {
        setScale(1);
        container.current?.scrollTo(
            (window.innerWidth - 64 - map.width) / 2,
            (window.innerHeight - 64 - map.height) / 2);
    }, [map]);

    const onWheelZoomCallback = useCallback((e: WheelEvent<HTMLImageElement>) => {
        if (e.deltaY < 0) {
            // Scroll up (zoom in)
            setScale(scale => (scale < maxScale) ? scale + increment : maxScale);
        }
        else if (e.deltaY > 0) {
            // Scroll down (zoom out)
            setScale(scale => (scale > minScale) ? scale - increment : minScale);
        }
    }, []);

    return (
        <>
            <div className="map-title">{map.name}</div>
            <div onWheel={onWheelZoomCallback}>
                <ScrollContainer className="map-scroll-container" innerRef={container}>
                    <img src={map.image} style={{
                        width: `${map.width * scale}px`,
                        height: `${map.height * scale}px`,
                        marginLeft: `max(0px, calc(100vw - 64px - ${map.width * scale}px))`,
                        marginRight: `max(0px, calc(100vw - 64px - ${map.width * scale}px))`,
                        marginTop: `max(0px, calc(100vh - 64px - ${map.height * scale}px))`,
                        marginBottom: `max(0px, calc(100vh - 64px - ${map.height * scale}px))`,
                        imageRendering: map.isPixelArt ? "pixelated" : "unset"
                    }} />
                    {map.landmarks && map.landmarks.map((landmark, i) =>
                        <Landmark key={i} mapWidth={map.width} mapHeight={map.height} mapScale={scale} landmark={landmark} />
                    )}
                </ScrollContainer>
            </div>
        </>
    );
};

interface ILandmarkProps {
    mapWidth: number,
    mapHeight: number,
    mapScale: number,
    landmark: ILandmark
}

const Landmark: React.FC<ILandmarkProps> = (props: ILandmarkProps) => {
    const { mapWidth, mapHeight, mapScale, landmark } = props;

    return (
        <div className="landmark-container">
            <div
                className="landmark"
                style={{
                    position: "relative",
                    left: `calc(max(0px, calc(100vw - 64px - ${mapWidth}px * ${mapScale})) + ${landmark.x}px * ${mapScale})`,
                    top: `calc(-${mapHeight}px * ${mapScale} + ${landmark.y}px * ${mapScale} - 4px - max(0px, calc(100vh - 64px - ${mapHeight}px * ${mapScale})))`,
                    width: `${landmark.w * mapScale}px`,
                    height: `${landmark.h * mapScale}px`,
                }}>
                <div className="landmark-preview" style={{ position: "relative", top: `${landmark.h * mapScale}px`, width: "fit-content" }}>
                    {landmark.preview && convertHtmlToReact(landmark.preview)}
                </div>
            </div>
        </div>
    );
};