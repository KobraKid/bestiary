import React from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { ILayoutElement } from '../interfaces/ILayout';
import { ICollection, IEntry } from '../interfaces/IPackage';
import { getValueOrLiteral } from './base';
import '../styles/collection.scss';

export interface IMapProps extends ILayoutElement {
  value: string,
  poi: IPointOfInterestProps[] | null | undefined,
  onLocationClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Map = (props: IMapProps) => {
  const { type: _, data } = props;

  const image = getValueOrLiteral<string>(data.entry.attributes, props.value);
  
  if (!image) { return null; }

  const size = getValueOrLiteral<string>(data.entry.attributes, "size").split(",");
  const pointOfInterest = getValueOrLiteral<IPointOfInterestProps[] | null | undefined>(data.entry.attributes, props.poi);

  return (
    <ScrollContainer style={{ height: "calc(100vh - 72px)", width: "calc(100vw - 72px)" }}>
      <img src={window.path.join(data.pkg.metadata.path, image)} />
      {
        pointOfInterest?.map((point, i) =>
          <PointOfInterest
            key={i}
            data={data}
            link={point.link}
            location={point.location}
            size={point.size}
            parentWidth={size[0]!}
            parentHeight={size[1]!}
            onLocationClicked={props.onLocationClicked} />)
      }
    </ScrollContainer>
  );
}

interface IPointOfInterestProps extends ILayoutElement {
  link: [string, string],
  location: string,
  size: string,
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

  return (
    <div
      className='mapPOI'
      style={{
        position: "relative",
        left: location[0],
        top: `calc(-${props.parentHeight} + ${location[1]} - 4px)`,
        width: size[0],
        height: size[1]
      }}
      onClick={() => props.onLocationClicked(linkedEntry, linkedCollection, null, data.collection)} />
  );
}
