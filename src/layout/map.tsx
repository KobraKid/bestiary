import React, { useCallback, useEffect, useRef, useState, WheelEvent } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { IDataProps, ILayoutElement, ILayoutProps, ILinkableProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import { AttributeValue } from '../model/Attribute';
import '../styles/collection.scss';
import '../styles/map.scss';
import { Link, parseLink } from './relation';

// =============================================================================
// | Map
// =============================================================================
export interface IMapLayoutProps extends ILayoutProps {
  name: string,
  value: string,
  poi: AttributeValue[]
}

export interface IMapProps extends ILayoutElement {
  layout: IMapLayoutProps
}

export const Map = (props: IMapProps) => {
  const { layout, data, onLinkClicked } = props;

  const name = getValueOrLiteral(data, layout.name);
  const image = getValueOrLiteral(data, layout.value);
  if (!image) { return null; }

  const size = (getValueOrLiteral(data, "!size") as string).split(",");
  const pointOfInterest = getValueOrLiteral(data, layout.poi) as AttributeValue[];

  const [scale, setScale] = useState<number>(100);
  const minScale = 10;
  const maxScale = 1000;
  const increment = 10;
  useEffect(() => setScale(100), [image]);

  const style = getStyle(data, layout.style);

  const container = useRef<HTMLElement>(null);
  useEffect(() => container.current?.scrollTo(0, 0), [image]);

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
    <React.Fragment>
      <div className='map-title'><div>{name}</div></div>
      <div onWheel={onWheelZoomCallback}>
        <ScrollContainer className='map-scroll-container' innerRef={container}>
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
    </React.Fragment>
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

  const link = parseLink(point[0] as string);
  const location = (point[1] as string).split(',');
  const size = (point[2] as string).split(',');
  const scale = props.scale / 100;

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === link[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === link[1]);

  if (!linkedCollection || !linkedEntry || !onLinkClicked) {
    window.log.writeError(`Could not establish POI link [${link.toString()}]:${!linkedCollection ? " Missing collection" : ""}${!linkedEntry ? " Missing entry" : ""}${!onLinkClicked ? " Missing click handler" : ""}`);
    return null;
  }

  // extra div to prevent siblings' heights from stacking
  return (
    <div className='poi-container'>
      <div
        className='poi'
        style={{
          position: 'relative',
          left: `calc(max(0px, calc(100vw - 64px - ${parentWidth}px * ${scale})) + ${location[0]}px * ${scale})`,
          top: `calc(-${parentHeight}px * ${scale} + ${location[1]}px * ${scale} - 4px - max(0px, calc(100vh - 64px - ${parentHeight}px * ${scale})))`,
          width: `${+(size[0]!) * scale}px`,
          height: `${+(size[1]!) * scale}px`,
        }}
        onClick={() => onLinkClicked(linkedEntry, linkedCollection, null, data.collection)}>
        <div
          className='poi-preview'
          style={{
            position: 'relative',
            top: `${+(size[1]!) * scale}px`,
            width: 'fit-content'
          }}>
          <Link layout={{ link: point[0]!.toString() }} data={data} onLinkClicked={onLinkClicked} />
        </div>
      </div>
    </div>
  );
}
