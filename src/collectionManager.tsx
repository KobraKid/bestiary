import React from "react";
import ICollection from "./model/Collection";
import './styles/collectionManager.scss';

export interface ICollectionManagerProps {
    collection: ICollection | null,
    show: boolean,
    onAccept: () => void,
    onCancel: () => void
}

export const CollectionManager = (props: ICollectionManagerProps) => {
    const { collection, show, onAccept, onCancel } = props;
    return ((show && collection) ?
        <div className='manager'>
            <div>{collection.name} - {collection.data.length} entries</div>
            <button onClick={onAccept}>Accept</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
        : null
    );
}