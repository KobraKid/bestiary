import React from 'react';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';
import './styles/details.scss';

/**
 * Props for the Details
 */
interface IDetailsProps {
  data: {
    pkg: IPackage,
    collection: ICollection,
    entry: IEntry | null,
  }
  pkgMenuExpanded: boolean,
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void
}

/**
 * Renders the details for a single entry.
 * 
 * @param props The props
 * @returns A detailed entry
 */
export const Details = (props: IDetailsProps) => {
  const { data, pkgMenuExpanded, onEntryClicked } = props;

  if (!data.entry) { return null; }

  return (
    <div className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      <Entry data={{ ...data, entry: data.entry! }} isPreview={false} onLinkClicked={onEntryClicked} />
    </div>
  );
}
