import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { getStyle, getValueOrLiteral } from './base';

// =============================================================================
// | String
// =============================================================================
export interface IStringProps extends ILayoutElement {
  value: string,
}

export const String = (props: IStringProps) => {
  let value = getValueOrLiteral<string>(props.data.entry.attributes, props.value);
  let style = getStyle(props.data.entry.attributes, props.style);

  return (
    <span style={style}>
      {value}
    </span>
  );
}

// =============================================================================
// | Ratio
// =============================================================================
export interface IRatioProps extends ILayoutElement {
  a: number,
  b: number,
  showAsPercent?: boolean,
}

export const Ratio = (props: IRatioProps) => {
  let aVal = getValueOrLiteral<number>(props.data.entry.attributes, props.a);
  let bVal = getValueOrLiteral<number>(props.data.entry.attributes, props.b);
  let style = getStyle(props.data.entry.attributes, props.style);

  return (
    <span style={style}>
      {props.showAsPercent ?
        `${aVal / (aVal + bVal)}% - ${bVal / (aVal + bVal)}`
        : `${aVal} : ${bVal}`}
    </span>
  );
}

// =============================================================================
// | Percent
// =============================================================================
export interface IPercentProps extends ILayoutElement {
  label: string,
  value: number,
}

export const Percent = (props: IPercentProps) => {
  let label = getValueOrLiteral<string>(props.data.entry.attributes, props.label);
  let value = getValueOrLiteral<number>(props.data.entry.attributes, props.value);
  let style = getStyle(props.data.entry.attributes, props.style);

  return (
    <span style={style}>
      {`${label}: ${value * 100}%`}
    </span>
  );
}

// =============================================================================
// | Range
// =============================================================================
export interface IRangeProps extends ILayoutElement {
  label: string,
  min: number,
  max: number,
}

export const Range = (props: IRangeProps) => {
  let label = getValueOrLiteral<string>(props.data.entry.attributes, props.label);
  let min = getValueOrLiteral<number>(props.data.entry.attributes, props.min);
  let max = getValueOrLiteral<number>(props.data.entry.attributes, props.max);
  let style = getStyle(props.data.entry.attributes, props.style);

  return (
    <span style={style}>
      {`${label}: ${min}  - ${max}`}
    </span>
  );
}
