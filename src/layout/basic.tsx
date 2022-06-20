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
  const { type: _, pkg: _pkg, data } = props;

  let value = getValueOrLiteral<string>(data, props.value);
  let color = getValueOrLiteral<string>(data, props.color);
  let backgroundColor = getValueOrLiteral<string>(data, props.backgroundColor);

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
  const { type: _, pkg: _pkg, data, a, b, showAsPercent } = props;

  let aVal = +getValueOrLiteral<number>(data, a);
  let bVal = +getValueOrLiteral<number>(data, b);

  return (
    <p>
      {showAsPercent ?
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
  const { type: _, pkg: _pkg, data } = props;

  let value = +getValueOrLiteral<number>(data, props.value);

  return (
    <p>
      {`${value}%`}
    </p>
  );
}
