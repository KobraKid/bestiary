import * as React from 'react';
import { ILayoutElement, ILayoutProps, LAYOUT_TYPE } from '../interfaces/IEntry';
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
  let style = getStyle(data.entry.attributes, layout.style);

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
  let style = getStyle(data.entry.attributes, layout.style);

  return (
    <div className='vertical' style={style}>
      {layout.elements.map((element, i) => <Base key={i} data={data} layout={element} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}

// =============================================================================
// | List
// =============================================================================
export interface IListProps extends ILayoutElement {
  layout: ILayoutProps & {
    elements: string | ILayoutProps[],
    processAs: LAYOUT_TYPE,
  }
}

export const List = (props: IListProps) => {
  const { layout, data, onLinkClicked } = props;
  let style = getStyle(data.entry.attributes, layout.style);
  const elements = getValueOrLiteral<any[]>(data.entry.attributes, layout.elements);

  switch (layout.processAs) {
    case LAYOUT_TYPE.string:
      return (
        <React.Fragment>
          {elements.map((element, i) =>
            <String key={i} layout={{type: layout.processAs, style: style, value: element}} data={data} />)}
        </React.Fragment>
      );
    case LAYOUT_TYPE.link:
      return (
        <React.Fragment>
          {elements.map((element, i) =>
            <Link key={i} layout={{ type: layout.processAs, style: style, link: element }} data={data} onLinkClicked={onLinkClicked} />)}
        </React.Fragment>
      );
    default:
      return null;
  }
}