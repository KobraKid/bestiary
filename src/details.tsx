import React, { useContext } from 'react';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { CollectionContext, EntryContext } from './context';
import './styles/details.scss';

/**
 * Props for the Details
 */
interface IDetailsProps {
  entry: IEntry | null,
  pkgMenuExpanded: boolean,
}

/**
 * Renders the details for a single entry.
 * 
 * @param props The props
 * @returns A detailed entry
 */
export const Details = (props: IDetailsProps) => {
  const { collection } = useContext(CollectionContext);
  const { entry, pkgMenuExpanded } = props;

  if (!entry) { return null; }

  return (
    <div className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      <EntryContext.Provider value={{ entry, layout: collection.layout }}>
        <Entry />
      </EntryContext.Provider>
    </div>
  );
}
