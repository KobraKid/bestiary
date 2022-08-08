import React, { useEffect, useState } from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';

/**
 * Props for the Collection
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