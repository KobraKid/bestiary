import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

export interface IMapProps extends ILayoutElement {
  src: string,
  poi: IPointOfInterestProps[],
}

export const Map = (props: IMapProps) => {
  const { type: _, pkg, data, src, poi } = props;

  return (
    <div>
      <img src={src} />
      {poi.map((point, i) => <PointOfInterest key={i} pkg={pkg} data={data} name={point.name} location={point.location} />)}
    </div>
  );
}

export interface IPointOfInterestProps extends ILayoutElement {
  name: string,
  location: [number, number],
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { type: _, pkg, data, name, location } = props;

  return <div>{name}</div>;
}
