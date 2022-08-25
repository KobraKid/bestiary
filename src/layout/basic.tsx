import React from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';

// =============================================================================
// | String
// =============================================================================
export interface IStringProps extends ILayoutElement {
  layout: ILayoutProps & {
    label?: string,
    value: string,
  }
}

export const String = (props: IStringProps) => {
  const { layout, data } = props;
  let label = getValueOrLiteral(data, layout.label);
  let value = getValueOrLiteral(data, layout.value);
  let style = getStyle(data, layout.style);

  return (
    <span style={style}>
      {label ? `${label}: ${value}` : value}
    </span>
  );
}

// =============================================================================
// | Number
// =============================================================================
export interface INumberProps extends ILayoutElement {
  layout: ILayoutProps & {
    label?: string,
    value: number,
  }
}

export const Number = (props: INumberProps) => {
  const { layout, data } = props;
  let label = getValueOrLiteral(data, layout.label);
  let value = getValueOrLiteral(data, layout.value);
  let style = getStyle(data, layout.style);

  return (
    <span style={style}>
      {label ? `${label}: ${value}` : value}
    </span>
  );
}

// =============================================================================
// | Ratio
// =============================================================================
export interface IRatioProps extends ILayoutElement {
  layout: ILayoutProps & {
    a: number,
    b: number,
    showAsPercent?: boolean,
  }
}

export const Ratio = (props: IRatioProps) => {
  const { layout, data } = props;
  let aVal = +getValueOrLiteral(data, layout.a);
  let bVal = +getValueOrLiteral(data, layout.b);
  let style = getStyle(data, layout.style);

  return (
    <span style={style}>
      {layout.showAsPercent ?
        `${aVal / (aVal + bVal)}% - ${bVal / (aVal + bVal)}`
        : `${aVal} : ${bVal}`}
    </span>
  );
}

// =============================================================================
// | Percent
// =============================================================================
export interface IPercentProps extends ILayoutElement {
  layout: ILayoutProps & {
    label?: string,
    value: number,
  }
}

export const Percent = (props: IPercentProps) => {
  const { layout, data } = props;
  let label = getValueOrLiteral(data, layout.label);
  let value = +getValueOrLiteral(data, layout.value);
  let style = getStyle(data, layout.style);

  return (
    <span style={style}>
      {label ? `${label}: ${value * 100}%` : `${value * 100}%`}
    </span>
  );
}

// =============================================================================
// | Range
// =============================================================================
export interface IRangeProps extends ILayoutElement {
  layout: ILayoutProps & {
    label?: string,
    min: number,
    max: number,
  }
}

export const Range = (props: IRangeProps) => {
  const { layout, data } = props;
  let label = getValueOrLiteral(data, layout.label);
  let min = +getValueOrLiteral(data, layout.min);
  let max = +getValueOrLiteral(data, layout.max);
  let style = getStyle(data, layout.style);

  return (
    <span style={style}>
      {label ? `${label}: ${min}  - ${max}` : `${min}  - ${max}`}
    </span>
  );
}
