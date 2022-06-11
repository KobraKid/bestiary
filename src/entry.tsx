import React from 'react';
import { ILayoutElement } from './interfaces/ILayout';
import IPackage from './interfaces/IPackage';
import { Base } from './layout/base';
import './styles/collection.scss';

interface IEntryProps {
  pkg: IPackage,
  attributes: object,
  layout: ILayoutElement,
  className?: string,
  onClick?: () => void | null | undefined,
}

export const Entry = (props: IEntryProps) => {
  const { pkg, attributes, layout, className, onClick } = props;

  return (
    <div className={className} onClick={onClick}>
      <Base pkg={pkg} data={attributes} layout={layout} />
    </div>
  );
}
