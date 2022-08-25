import React, { useCallback, useEffect, useState, WheelEvent } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { IDataProps, ILayoutElement, ILayoutProps, ILinkableProps } from '../model/Layout';
import { getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import '../styles/collection.scss';

// =============================================================================
// | Map
// =============================================================================
export interface IMapProps extends ILayoutElement {
  layout: ILayoutProps & {
    value: string,
    poi: IPoint[] | null | undefined,
  }
}

export const Map = (props: IMapProps) => {
  const { layout, data, onLinkClicked } = props;

  const image = getValueOrLiteral<string>(data, layout.value);
  if (!image) { return null; }

  const size = getValueOrLiteral<string>(data, "!size").split(",");
  const pointOfInterest = getValueOrLiteral<IPoint[] | null | undefined>(data, layout.poi);
  const [scale, setScale] = useState<number>(100);

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
        style={{ height: "calc(100vh - 72px)", width: "calc(100vw - 72px)", padding: "4px" }}>
        <img
          src={window.path.join(data.pkg.metadata.path, image)}
          style={{
            width: `${+(size[0]!) * scale / 100}px`,
            height: `${+(size[1]!) * scale / 100}px`,
          }} />
        {
          pointOfInterest?.map((point, i) =>
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
interface IPoint {
  link: [string, string],
  location: string,
  size: string,
}
interface IPointOfInterestProps extends ILinkableProps {
  data: IDataProps,
  point: IPoint
  scale: number,
  parentWidth: string,
  parentHeight: string,
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { onLinkClicked, data, point, parentHeight } = props;

  const location = point.location.split(",");
  const size = point.size.split(",");
  const scale = props.scale / 100;

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === point.link[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === point.link[1]);

  if (!linkedCollection || !linkedEntry || !onLinkClicked) { return null; }

  // extra div to prevent siblings' heights from stacking
  return (
    <div style={{ height: "0px" }}>
      <div
        className='mapPOI'
        style={{
          position: "relative",
          left: `${+(location[0]!) * scale}px`,
          top: `calc(-${parentHeight}px * ${scale} + ${location[1]}px * ${scale} - 4px)`,
          width: `${+(size[0]!) * scale}px`,
          height: `${+(size[1]!) * scale}px`,
        }}
        onClick={() => onLinkClicked(linkedEntry, linkedCollection, null, data.collection)} />
    </div>
  );
}
