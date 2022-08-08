import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { getValueOrLiteral } from './base';

// =============================================================================
// | String
// =============================================================================
export interface IStringProps extends ILayoutElement {
  value: string,
  color?: string,
  backgroundColor?: string,
}

export const String = (props: IStringProps) => {
  let value = getValueOrLiteral<string>(props.data.entry.attributes, props.value);
  let color = getValueOrLiteral<string>(props.data.entry.attributes, props.color);
  let backgroundColor = getValueOrLiteral<string>(props.data.entry.attributes, props.backgroundColor);

  return (
    <p style={{ color: color, backgroundColor: backgroundColor }}>
      {value}
    </p>
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
  let aVal = +getValueOrLiteral<number>(props.data.entry.attributes, props.a);
  let bVal = +getValueOrLiteral<number>(props.data.entry.attributes, props.b);

  return (
    <p>
      {props.showAsPercent ?
        `${aVal / (aVal + bVal)}% - ${bVal / (aVal + bVal)}`
        : `${aVal} : ${bVal}`}
    </p>
  );
}
// =============================================================================
// | Percent
// =============================================================================
export interface IPercentProps extends ILayoutElement {
  value: string,
}

export const Percent = (props: IPercentProps) => {
  let value = +getValueOrLiteral<number>(props.data.entry.attributes, props.value);

  return (
    <p>
      {`${value}%`}
    </p>
  );
}
