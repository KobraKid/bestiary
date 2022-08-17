import * as React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { Base } from './base';
import '../styles/layout.scss';
import { ICollection, IEntry } from '../interfaces/IPackage';

// =============================================================================
// | Horizontal Region
// =============================================================================
export interface IHorizontalProps extends ILayoutElement {
  elements: ILayoutElement[],
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Horizontal = (props: IHorizontalProps) => {
  const { type: _, style, data, elements, onLinkClicked } = props;

  return (
    <div className='horizontal' style={style}>
      {elements.map((element, i) => <Base key={i} data={data} layout={element} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}

// =============================================================================
// | Vertical Region
// =============================================================================
export interface IVerticalProps extends ILayoutElement {
  elements: ILayoutElement[],
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Vertical = (props: IVerticalProps) => {
  const { type: _, style, data, elements, onLinkClicked } = props;

  return (
    <div className='vertical' style={style}>
      {elements.map((element, i) => <Base key={i} data={data} layout={element} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}
