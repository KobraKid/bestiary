import * as React from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { Base, getStyle } from './base';
import '../styles/layout.scss';

// =============================================================================
// | Horizontal Region
// =============================================================================
export interface IHorizontalLayoutProps extends ILayoutProps {
  elements: ILayoutProps[]
}

export interface IHorizontalProps extends ILayoutElement {
  layout: IHorizontalLayoutProps
}

export const Horizontal = (props: IHorizontalProps) => {
  const { layout, data, onLinkClicked } = props;
  let style = getStyle(data, layout.style);

  return (
    <div className='horizontal' style={style}>
      {layout.elements.map((element, i) => <Base key={i} data={data} layout={element} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}

// =============================================================================
// | Vertical Region
// =============================================================================
export interface IVerticalLayoutProps extends ILayoutProps {
  elements: ILayoutProps[]
}

export interface IVerticalProps extends ILayoutElement {
  layout: IVerticalLayoutProps
}

export const Vertical = (props: IVerticalProps) => {
  const { layout, data, onLinkClicked } = props;
  let style = getStyle(data, layout.style);

  return (
    <div className='vertical' style={style}>
      {layout.elements.map((element, i) => <Base key={i} data={data} layout={element} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}