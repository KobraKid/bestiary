import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

// =============================================================================
// | String
// =============================================================================
export interface IStringProps extends ILayoutElement {
  value: string,
}

export const String = (props: IStringProps) => {
  const { type: _, pkg: _pkg, data, value } = props;

  return (
    (value in data) ? 
      <p>
        {data[value as keyof typeof data]}
      </p>
      : null
  );
}
// =============================================================================
// | Ratio
// =============================================================================
export interface IRatioProps extends ILayoutElement {
  a: string,
  b: string,
  showAsPercent?: boolean,
}

export const Ratio = (props: IRatioProps) => {
  const { type: _, pkg: _pkg, data, a, b, showAsPercent } = props;

  return (
    (a in data && b in data) ?
      <p>
        {showAsPercent ? 
          `${data[a as keyof typeof data] / (data[a as keyof typeof data] + data[b as keyof typeof data])}% - ${data[b as keyof typeof data] / (data[a as keyof typeof data] + data[b as keyof typeof data])}` 
          : `${data[a as keyof typeof data]} : ${data[b as keyof typeof data]}`}
      </p>
      : null
  );
}
// =============================================================================
// | Percent
// =============================================================================
export interface IPercentProps extends ILayoutElement {
  value: string,
}

export const Percent = (props: IPercentProps) => {
  const { type: _, pkg: _pkg, data, value } = props;

  return (
    (value in data) ?
      <p>
        {`${data[value as keyof typeof data]}%`}
      </p>
      : null
  );
}
