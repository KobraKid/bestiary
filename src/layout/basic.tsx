import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

// =============================================================================
// | String
// =============================================================================
export interface IStringProps extends ILayoutElement {
  value: string,
}

export const String = (props: IStringProps) => {
  const { type, path, data, value } = props;

  return <p>{data[value]}</p>;
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
  const { type, path, data, a, b, showAsPercent } = props;

  return <p>{showAsPercent ? `${data[a] / (data[a] + data[b])}% - ${data[b] / (data[a] + data[b])}` : `${data[a]} : ${data[b]}`}</p>;
}
// =============================================================================
// | Percent
// =============================================================================
export interface IPercentProps extends ILayoutElement {
  value: string,
}

export const Percent = (props: IPercentProps) => {
  const { type, path, data, value } = props;

  return <p>{`${data[value]}%`}</p>;
}
