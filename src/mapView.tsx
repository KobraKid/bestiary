import React from 'react';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';

/**
 * Props for the Map
 */
interface IMapViewProps {
    data: {
        pkg: IPackage,
        collection: ICollection,
        entry: IEntry | null,
    }
    /** Whether the package menu is expanded */
    pkgMenuExpanded: boolean,
    /** Callback function for when an entry is clicked */
    onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
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
    const { data, pkgMenuExpanded, onEntryClicked } = props;

    if (!data.entry) { return null; }

    return (
        <Entry
            data={{ ...data, entry: data.entry }}
            className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}
            isPreview={false}
            onLinkClicked={onEntryClicked} />
    );
}