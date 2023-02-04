import React, { useCallback, useContext, useEffect, useMemo, useRef, useState, WheelEvent } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import { AttributeValue } from '../model/Attribute';
import { Link, parseLink } from './link';
import { EntryContext, PackageContext } from '../context';
import '../styles/collection.scss';
import '../styles/map.scss';

// =============================================================================
// | Map
// =============================================================================
export interface IMapLayoutProps extends ILayoutProps {
  name: string,
  value: string,
  poi: AttributeValue[]
}

export const Map = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);
  const mapLayout = layout as IMapLayoutProps;

  const name = useMemo(() => getValueOrLiteral(entry, pkg, mapLayout.name), [entry]);
  const image = useMemo(() => getValueOrLiteral(entry, pkg, mapLayout.value), [entry]);
  if (!image) { return null; }

  const size = useMemo(() => (getValueOrLiteral(entry, pkg, "!size") as string).split(","), [entry]);
  if (!Array.isArray(size) || size.length !== 2) { return null; }

  const pointOfInterest = useMemo(() => getValueOrLiteral(entry, pkg, mapLayout.poi) as AttributeValue[], [entry]);
  const style = useMemo(() => getStyle(entry, pkg, mapLayout.style), [mapLayout.style]);

  const [scale, setScale] = useState<number>(100);
  const minScale = 10;
  const maxScale = 1000;
  const increment = 10;

  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    setScale(100);
    container.current?.scrollTo(
      (window.innerWidth - 64 - parseInt('' + size[0])) / 2,
      (window.innerHeight - 64 - parseInt('' + size[1])) / 2);
  }, [image]);

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
      <div className='map-title'><div>{name}</div></div>
      <div onWheel={onWheelZoomCallback}>
        <ScrollContainer className='map-scroll-container' innerRef={container}>
          <img
            src={window.path.join(pkg.metadata.path, "" + image)}
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
              parentHeight={size[1]!} />)
          }
        </ScrollContainer>
      </div>
    </>
  );
}

// =============================================================================
// | Point of Interest
// =============================================================================
interface IPointOfInterestProps {
  point: AttributeValue,
  scale: number,
  parentWidth: string,
  parentHeight: string,
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { pkg, selectEntry } = useContext(PackageContext);

  const { parentWidth, parentHeight } = props;

  const point = useMemo(() => props.point.toString().split('||').map(val => val.trim()), [props.point]);

  const link = useMemo(() => parseLink(point[0] as string), [point]);
  const location = useMemo(() => (point[1] as string).split(','), [point]);
  const size = useMemo(() => (point[2] as string).split(','), [point]);
  const scale = props.scale / 100;

  const linkedCollection = useMemo(() => pkg.collections.find((collection: ICollection) => collection.name === link[0]), [pkg, link[0]]);
  const linkedEntry = useMemo(() => linkedCollection?.data?.find((entry: IEntry) => entry.id === link[1]), [linkedCollection, link[1]]);

  if (!linkedCollection || !linkedEntry) {
    window.log.writeError(`❗Could not establish POI link [${link.toString()}]:${!linkedCollection ? " Missing collection" : ""}${!linkedEntry ? " Missing entry" : ""}`);
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
        onClick={() => selectEntry(linkedEntry, linkedCollection)}>
        <div
          className='poi-preview'
          style={{
            position: 'relative',
            top: `${+(size[1]!) * scale}px`,
            width: 'fit-content'
          }}>
          <Link link={`~${linkedCollection.name}|${linkedEntry.id}`} />
        </div>
      </div>
    </div>
  );
}
