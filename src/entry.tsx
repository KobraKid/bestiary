import React from 'react';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Base } from './layout/base';
import './styles/collection.scss';

interface IEntryProps {
  data: {
    pkg: IPackage,
    collection: ICollection,
    entry: IEntry,
  }
  isPreview: boolean,
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
  className?: string,
  onClick?: () => void | null | undefined,
}

export const Entry = (props: IEntryProps) => {
  const { data, isPreview, onLinkClicked, className, onClick } = props;

  return (
    <div className={className} onClick={onClick}>
      <Base data={data} layout={isPreview ? data.collection.layoutPreview : data.collection.layout} onLinkClicked={onLinkClicked} />
    </div>
  );
}
