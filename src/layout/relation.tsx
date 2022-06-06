import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

export interface ILinkProps extends ILayoutElement {
  id: string,
  layout: ILayoutElement,
}

export const Link = (props: ILinkProps) => {
  const { type, path, data, id, layout } = props;
  return <Base path={path} data={data} layout={layout} />;
}

export interface IChainProps extends ILayoutElement {
  id: string,
  previous?: string[],
  next?: string[],
  linkLayout: ILayoutElement,
}

export const Chain = (props: IChainProps) => {
  const { type, path, data, id, previous, next, linkLayout } = props;

  return (
    <React.Fragment>
      {previous.map((linkId: string) => <Link id={linkId} layout={linkLayout} />)}
      <Link id={id} layout={linkLayout} />
      {next.map((linkId: string) => <Link id={linkId} layout={linkLayout} />)}
    </React.Fragment
  );
}
