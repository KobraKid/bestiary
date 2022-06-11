import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

export interface IMapProps extends ILayoutElement {
  src: string,
  poi: IPointOfInterestProps[],
}

export const Map = (props: IMapProps) => {
  const { type, path, data, src, poi } = props;

  return (
    <div>
      <img src={src} />
      {poi.map((point, i) => <PointOfInterest name={poi.name} location={poi.location} />)}
    </div>
  );
}

export interface IPointOfInterestProps extends ILayoutElement {
  name: string,
  location: [number, number],
}

export const PointOfInterest = (props: IPointOfInterestProps) => {
  const { type, path, data, name, location } = props;

  return <div>{name}</div>;
}
