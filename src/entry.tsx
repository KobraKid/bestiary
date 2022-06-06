import React from 'react';
import { ILayoutElement } from './interfaces/ILayout';
import { Base } from './layout/base';
import './styles/collection.scss';

interface IEntryProps {
  data: any,
  layout: ILayoutElement | null | undefined,
  path: string,
  className?: string,
  onClick?: () => void | null | undefined,
}

export const Entry = (props: IEntryProps) => {
  const { data, layout, path, className, onClick } = props;

  if (!layout) {
    return null;
  }

  return (
    <div className={className} onClick={onClick}>
      <Base data={data} layout={layout} path={path} />
    </div>
  );
}
