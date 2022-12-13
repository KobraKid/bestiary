import React, { useContext } from 'react';
import { EntryContext, PackageContext } from '../context';
import { ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';

// =============================================================================
// | String
// =============================================================================
export interface IStringLayoutProps extends ILayoutProps {
  label?: string,
  value: string,
}

export const String = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let label = getValueOrLiteral(entry, pkg, (layout as IStringLayoutProps).label);
  let value = getValueOrLiteral(entry, pkg, (layout as IStringLayoutProps).value);
  let style = getStyle(entry, pkg, layout.style);

  if (value.toString().length < 1) { return null; }

  return (
    <div style={style}>
      {label ? `${label} ${value}` : value}
    </div>
  );
}

// =============================================================================
// | Number
// =============================================================================
export interface INumberLayoutProps extends ILayoutProps {
  label?: string,
  value: string | number
}

export const Number = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let label = getValueOrLiteral(entry, pkg, (layout as INumberLayoutProps).label);
  let value = getValueOrLiteral(entry, pkg, (layout as INumberLayoutProps).value);
  let style = getStyle(entry, pkg, layout.style);

  if (value.toString().length < 1) { return null; }

  return (
    <div style={style}>
      {label ? `${label} ${value}` : value}
    </div>
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

export const Ratio = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let aVal = +getValueOrLiteral(entry, pkg, (layout as IRatioLayoutProps).a);
  let bVal = +getValueOrLiteral(entry, pkg, (layout as IRatioLayoutProps).b);
  let style = getStyle(entry, pkg, layout.style);

  return (
    <div style={style}>
      {(layout as IRatioLayoutProps).showAsPercent ?
        `${aVal / (aVal + bVal)}% - ${bVal / (aVal + bVal)}`
        : `${aVal} : ${bVal}`}
    </div>
  );
}

// =============================================================================
// | Percent
// =============================================================================
export interface IPercentLayoutProps extends ILayoutProps {
  label?: string,
  value: string | number
}

export const Percent = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let label = getValueOrLiteral(entry, pkg, (layout as IPercentLayoutProps).label);
  let value = +getValueOrLiteral(entry, pkg, (layout as IPercentLayoutProps).value);
  let style = getStyle(entry, pkg, layout.style);

  return (
    <div style={style}>
      {label ? `${label} ${value * 100}%` : `${value * 100}%`}
    </div>
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

export const Range = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let label = getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).label);
  let min = +getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).min);
  let max = +getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).max);
  let style = getStyle(entry, pkg, layout.style);

  return (
    <div style={style}>
      {label ? `${label} ${min}  - ${max}` : `${min}  - ${max}`}
    </div>
  );
}
