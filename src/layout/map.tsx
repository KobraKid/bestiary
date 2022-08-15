import React, { useCallback, useState, WheelEvent } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { ILayoutElement } from '../interfaces/ILayout';
import { ICollection, IEntry } from '../interfaces/IPackage';
import { getValueOrLiteral } from './base';
import '../styles/collection.scss';

// =============================================================================
// | Map
// =============================================================================
export interface IMapProps extends ILayoutElement {
  value: string,
  poi: IPointOfInterestProps[] | null | undefined,
  onLocationClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Map = (props: IMapProps) => {
  const { type: _, data } = props;

  const image = getValueOrLiteral<string>(data.entry.attributes, props.value);

  if (!image) { return null; }

  const size = getValueOrLiteral<string>(data.entry.attributes, "!size").split(",");
  const pointOfInterest = getValueOrLiteral<IPointOfInterestProps[] | null | undefined>(data.entry.attributes, props.poi);
  const [scale, setScale] = useState<number>(100);

  const onWheelZoomCallback = useCallback((e: WheelEvent<HTMLImageElement>) => {
    if (e.deltaY < 0) {
      // Scroll up (zoom in)
      setScale(scale => (scale < 1000) ? scale + 10 : 1000);
    }
    else if (e.deltaY > 0) {
      // Scroll down (zoom out)
      setScale(scale => (scale > 10) ? scale - 10 : 10);
    }
  }, []);


  return (
    <ScrollContainer style={{ height: "calc(100vh - 72px)", width: "calc(100vw - 72px)", padding: "4px" }}>
      <img src={window.path.join(data.pkg.metadata.path, image)} style={{ transform: `scale(${scale / 100}, ${scale / 100})` }} useMap={`#${props.value}`} onWheel={onWheelZoomCallback} />
      {
        pointOfInterest?.map((point, i) =>
          <PointOfInterest
            key={i}
            data={data}
            link={point.link}
            location={point.location}
            size={point.size}
            scale={scale}
            parentWidth={size[0]!}
            parentHeight={size[1]!}
            onLocationClicked={props.onLocationClicked} />)
      }
    </ScrollContainer>
  );
}

// =============================================================================
// | Point of Interest
// =============================================================================
interface IPointOfInterestProps extends ILayoutElement {
  link: [string, string],
  location: string,
  size: string,
  scale: number,
  parentHeight: string,
  parentWidth: string,
  onLocationClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { type: _, data } = props;

  const location = props.location.split(",");
  const size = props.size.split(",");

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === props.link[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === props.link[1]);

  if (!linkedCollection || !linkedEntry) { return null; }

  // extra div to prevent siblings' heights from stacking
  return (
    <div style={{ height: "0px" }}>
      <div
        className='mapPOI'
        style={{
          position: "relative",
          left: `${location[0]}px`,
          top: `calc(-${props.parentHeight}px + ${location[1]}px - 4px)`,
          width: `${size[0]}px`,
          height: `${size[1]}px`,
          transform: `scale(${props.scale / 100}, ${props.scale / 100}) translate(calc(${location[0]}px * ${(props.scale / 100)-1}), calc((-${props.parentHeight}px + ${location[1]}px - 4px) * ${(props.scale / 100)-1}))`,
        }}
        onClick={() => props.onLocationClicked(linkedEntry, linkedCollection, null, data.collection)} />
    </div>
  );
}
