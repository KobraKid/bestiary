import * as React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { Base } from './base';
import '../styles/layout.scss';

export interface IHorizontalProps extends ILayoutElement {
  elements: ILayoutElement[],
}

export const Horizontal = (props: IHorizontalProps) => {
  const { type: _, pkg, data, elements } = props;

  return (
    <div className="horizontal">
      {elements.map((element, i) => <Base key={i} pkg={pkg} data={data} layout={element} />)}
    </div>
  );
}

export interface IVerticalProps extends ILayoutElement {
  elements: ILayoutElement[],
}

export const Vertical = (props: IVerticalProps) => {
  const { type: _, pkg, data, elements } = props;

  return (
    <div className="vertical">
      {elements.map((element, i) => <Base key={i} pkg={pkg} data={data} layout={element} />)}
    </div>
  );
}
