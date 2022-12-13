import React, { useContext, useMemo } from 'react';
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

  let label = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IStringLayoutProps).label), [entry]);
  let value = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IStringLayoutProps).value), [entry]);
  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

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

  let label = useMemo(() => getValueOrLiteral(entry, pkg, (layout as INumberLayoutProps).label), [entry]);
  let value = useMemo(() => getValueOrLiteral(entry, pkg, (layout as INumberLayoutProps).value), [entry]);
  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

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

  let aVal = useMemo(() => +getValueOrLiteral(entry, pkg, (layout as IRatioLayoutProps).a), [entry]);
  let bVal = useMemo(() => +getValueOrLiteral(entry, pkg, (layout as IRatioLayoutProps).b), [entry]);
  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

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

  let label = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IPercentLayoutProps).label), [entry]);
  let value = useMemo(() => +getValueOrLiteral(entry, pkg, (layout as IPercentLayoutProps).value), [entry]);
  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

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

  let label = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).label), [entry]);
  let min = useMemo(() => +getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).min), [entry]);
  let max = useMemo(() => +getValueOrLiteral(entry, pkg, (layout as IRangeLayoutProps).max), [entry]);
  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

  return (
    <div style={style}>
      {label ? `${label} ${min}  - ${max}` : `${min}  - ${max}`}
    </div>
  );
}
