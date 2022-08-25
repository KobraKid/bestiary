import React from 'react';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';
import './styles/details.scss';
import leftArrow from './assets/icons/left.png';

interface IDetailsProps {
  data: {
    pkg: IPackage,
    collection: ICollection,
    entry: IEntry | null,
  }
  pkgMenuExpanded: boolean,
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
  onReturnToCollectionClicked: () => void,
}

export const Details = (props: IDetailsProps) => {
  const { data, pkgMenuExpanded, onEntryClicked, onReturnToCollectionClicked } = props;

  if (!data.entry) { return null; }

  return (
    <div className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      <div>
        <img src={leftArrow} style={{ padding: 16, width: 32, height: 32 }} onClick={onReturnToCollectionClicked} />
      </div>
      <Entry data={{ ...data, entry: data.entry! }} isPreview={false} onLinkClicked={onEntryClicked} />
    </div>
  );
}
