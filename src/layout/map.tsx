import React, { useCallback, useEffect, useState, WheelEvent } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { IDataProps, ILayoutElement, ILayoutProps, ILinkableProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import '../styles/collection.scss';
import { AttributeValue } from '../model/Attribute';

// =============================================================================
// | Map
// =============================================================================
export interface IMapLayoutProps extends ILayoutProps {
  value: string,
  poi: AttributeValue[]
}

export interface IMapProps extends ILayoutElement {
  layout: IMapLayoutProps
}

export const Map = (props: IMapProps) => {
  const { layout, data, onLinkClicked } = props;

  const image = getValueOrLiteral(data, layout.value);
  if (!image) { return null; }

  const size = (getValueOrLiteral(data, "!size") as string).split(",");
  const pointOfInterest = getValueOrLiteral(data, layout.poi) as AttributeValue[];
  const [scale, setScale] = useState<number>(100);

  const style = getStyle(data, layout.style);

  useEffect(() => setScale(100), [image]);

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
    <div onWheel={onWheelZoomCallback}>
      <ScrollContainer
        style={{ height: "calc(100vh - 64px)", width: "calc(100vw - 64px)" }}>
        <img
          src={window.path.join(data.pkg.metadata.path, "" + image)}
          style={{
            width: `${+(size[0]!) * scale / 100}px`,
            height: `${+(size[1]!) * scale / 100}px`,
            marginLeft: `max(0px, calc(100vw - 64px - ${+(size[0]!) * scale / 100}px))`,
            marginRight: `max(0px, calc(100vw - 64px - ${+(size[0]!) * scale / 100}px))`,
            marginTop: `max(0px, calc(100vh - 64px - ${+(size[1]!) * scale / 100}px))`,
            marginBottom: `max(0px, calc(100vh - 64px - ${+(size[1]!) * scale / 100}px))`,
            ...style
          }} />
        {pointOfInterest && pointOfInterest?.map((point, i) =>
          <PointOfInterest
            key={i}
            point={point}
            scale={scale}
            parentWidth={size[0]!}
            parentHeight={size[1]!}
            data={data}
            onLinkClicked={onLinkClicked} />)
        }
      </ScrollContainer>
    </div>
  );
}

// =============================================================================
// | Point of Interest
// =============================================================================
interface IPointOfInterestProps extends ILinkableProps {
  data: IDataProps,
  point: AttributeValue,
  scale: number,
  parentWidth: string,
  parentHeight: string,
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { onLinkClicked, data, parentWidth, parentHeight } = props;

  const point = props.point.toString().split('||').map(val => val.trim());

  const link = (point[0] as string).split('|');
  const location = (point[1] as string).split(',');
  const size = (point[2] as string).split(',');
  const scale = props.scale / 100;

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === link[0]?.substring(1));
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === link[1]);

  if (!linkedCollection || !linkedEntry || !onLinkClicked) { return null; }
  console.log(link, location, size);

  // extra div to prevent siblings' heights from stacking
  return (
    <div style={{ height: "0px", width: "0px" }}>
      <div
        className='mapPOI'
        style={{
          position: "relative",
          left: `calc(max(0px, calc(100vw - 64px - ${parentWidth}px * ${scale})) + ${location[0]}px * ${scale})`,
          top: `calc(-${parentHeight}px * ${scale} + ${location[1]}px * ${scale} - 4px)`,
          width: `${+(size[0]!) * scale}px`,
          height: `${+(size[1]!) * scale}px`,
        }}
        onClick={() => onLinkClicked(linkedEntry, linkedCollection, null, data.collection)} />
    </div>
  );
}
