import React from 'react';
import { ILayoutElement } from './interfaces/ILayout';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Base } from './layout/base';
import './styles/collection.scss';

interface IEntryProps {
  pkg: IPackage,
  attributes: object,
  layout: ILayoutElement,
  onLinkClicked: (entry: IEntry, collection: ICollection) => void,
  className?: string,
  onClick?: () => void | null | undefined,
}

export const Entry = (props: IEntryProps) => {
  const { pkg, attributes, layout, onLinkClicked, className, onClick } = props;

  return (
    <div className={className} onClick={onClick}>
      <Base pkg={pkg} data={attributes} layout={layout} onLinkClicked={onLinkClicked} />
    </div>
  );
}
