import React, { useContext, useMemo } from 'react';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { CollectionConfigContext, CollectionContext, EntryContext, PackageConfigContext, PackageContext } from './context';
import './styles/details.scss';
import { getValueOrLiteral } from './layout/base';

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
  const { pkg } = useContext(PackageContext);
  const { pkgConfig } = useContext(PackageConfigContext);
  const { collection } = useContext(CollectionContext);
  const { entry, pkgMenuExpanded } = props;

  const collectionConfig = useMemo(() => (pkgConfig[collection.name] ?? []).filter(c =>
    c.categories.length < 1 || (entry && c.categories.includes(getValueOrLiteral(entry, pkg, entry.category ?? "").toString()))
  ), [pkg, collection, entry, pkgConfig]);

  if (!entry) { return null; }

  console.log(pkgConfig, collectionConfig, entry?.category);
  return (
    <div className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      <CollectionConfigContext.Provider key={entry.id} value={{ collectionConfig }}>
        <EntryContext.Provider value={{ entry, layout: collection.layout }}>
          <Entry />
        </EntryContext.Provider>
      </CollectionConfigContext.Provider>
    </div>
  );
}
