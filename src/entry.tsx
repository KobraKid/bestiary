import React, { Fragment, useContext } from 'react';
import { Base } from './layout/base';
import { ICollectionConfig } from './model/Config';
import { CollectionContext, EntryContext, PackageContext } from './context';
import './styles/collection.scss';

/**
 * Props for the Entry
 */
interface IEntryProps {
  collectionConfig?: ICollectionConfig[] | null,
  className?: string,
  onCollect?: (collectionConfigId: number) => void
}

/**
 * Renders a single entry.
 * 
 * If this is a collection view, the layoutPreview will be used to render a preview of the entry.
 * If this is a detailed view, the layout will be used to render the full details of the entry.
 * 
 * @param props The props
 * @returns A single entry
 */
export const Entry = (props: IEntryProps) => {
  const { selectEntry } = useContext(PackageContext);
  const { collection } = useContext(CollectionContext);
  const { entry } = useContext(EntryContext);

  const { collectionConfig, className, onCollect } = props;

  return (
    <Fragment>
      <div className={className}>
        {(collectionConfig && collectionConfig.length > 0 && onCollect) &&
          <div className='collection-tabs'>
            {collectionConfig.map(config =>
              <div
                key={config.id}
                className='collection-tab'
                style={{ backgroundColor: config.color, color: config.textColor }} >
                <input
                  type='checkbox'
                  checked={config.collectedEntryIds.includes(entry.id)}
                  onChange={() => onCollect(config.id)} />
                <span style={{ paddingRight: '8px' }} onClick={() => onCollect(config.id)}>{config.name}</span>
              </div>
            )}
          </div>
        }
        <div onClick={() => selectEntry(entry, collection)}>
          <Base />
        </div>
      </div>
    </Fragment>
  );
}
