import * as React from 'react';
import { ILayoutElement, ILayoutProps, LAYOUT_TYPE } from '../model/Layout';
import { Base, getStyle, getValueOrLiteral } from './base';
import { Link } from './relation';
import { String } from './basic';
import '../styles/layout.scss';

// =============================================================================
// | Horizontal Region
// =============================================================================
export interface IHorizontalProps extends ILayoutElement {
  layout: ILayoutProps & {
    elements: ILayoutProps[],
  }
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
export interface IVerticalProps extends ILayoutElement {
  layout: ILayoutProps & {
    elements: ILayoutProps[],
  }
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