import React, { useContext } from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { Base, getStyle } from './base';
import '../styles/layout.scss';
import { EntryContext, PackageContext } from '../context';

// =============================================================================
// | Horizontal Region
// =============================================================================
export interface IHorizontalLayoutProps extends ILayoutProps {
  elements: ILayoutProps[]
}

export const Horizontal = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);
  let style = getStyle(entry, pkg, layout.style);

  return (
    <div className='horizontal' style={style}>
      {(layout as IHorizontalLayoutProps).elements.map((element, i) =>
        <EntryContext.Provider key={i} value={{ entry, layout: element }}>
          <Base />
        </EntryContext.Provider>)}
    </div>
  );
}

// =============================================================================
// | Vertical Region
// =============================================================================
export interface IVerticalLayoutProps extends ILayoutProps {
  elements: ILayoutProps[]
}

export const Vertical = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);
  let style = getStyle(entry, pkg, layout.style);

  return (
    <div className='vertical' style={style}>
      {(layout as IVerticalLayoutProps).elements.map((element, i) =>
        <EntryContext.Provider key={i} value={{ entry, layout: element }}>
          <Base />
        </EntryContext.Provider>)}
    </div>
  );
}