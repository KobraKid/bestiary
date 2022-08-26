import React from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';

// =============================================================================
// | String
// =============================================================================
export interface IStringLayoutProps extends ILayoutProps {
  label?: string,
  value: string,
}

export interface IStringProps extends ILayoutElement {
  layout: IStringLayoutProps
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
export interface INumberLayoutProps extends ILayoutProps {
  label?: string,
  value: string | number
}

export interface INumberProps extends ILayoutElement {
  layout: INumberLayoutProps
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
export interface IRatioLayoutProps extends ILayoutProps {
  a: string | number,
  b: string | number,
  showAsPercent?: string | boolean
}

export interface IRatioProps extends ILayoutElement {
  layout: IRatioLayoutProps
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
export interface IPercentLayoutProps extends ILayoutProps {
  label?: string,
  value: string | number
}

export interface IPercentProps extends ILayoutElement {
  layout: IPercentLayoutProps
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
export interface IRangeLayoutProps extends ILayoutProps {
  label?: string,
  min: string | number,
  max: string | number
}

export interface IRangeProps extends ILayoutElement {
  layout: IRangeLayoutProps
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
