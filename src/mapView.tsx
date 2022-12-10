import React, { useContext } from 'react';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { CollectionContext, EntryContext } from './context';

/**
 * Props for the Map
 */
interface IMapViewProps {
    entry: IEntry | null,
    /** Whether the package menu is expanded */
    pkgMenuExpanded: boolean
}

/**
 * Renders a map view.
 * 
 * This is a simple wrapper around an entry, so that we have fine control over how it renders.
 * Map views are different from collection and detail views, in that you only see one entry at a time,
 * but can click on different parts of the map to navigate to other entries in the collection.
 * 
 * @param props The props
 * @returns A map view
 */
export const MapView = (props: IMapViewProps) => {
    const { collection } = useContext(CollectionContext);
    const { entry, pkgMenuExpanded } = props;

    if (!entry) { return null; }

    return (
        <EntryContext.Provider value={{ entry, layout: collection.layout }}>
            <Entry className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`} />
        </EntryContext.Provider>
    );
}