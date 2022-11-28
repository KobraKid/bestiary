import React from 'react';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { IDataProps } from './model/Layout';
import { Base } from './layout/base';
import './styles/collection.scss';
import { ICollectionConfig } from './model/Config';

/**
 * Props for the Entry
 */
interface IEntryProps {
  data: IDataProps,
  collectionConfig?: ICollectionConfig[] | null,
  style?: React.CSSProperties,
  isPreview: boolean,
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
  className?: string,
  onClick?: () => void | null | undefined,
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
  const { data, collectionConfig, style, isPreview, onLinkClicked, className, onClick, onCollect } = props;

  return (
    <div className='entry-wrapper'>
      {(collectionConfig && onCollect) &&
        <div className='collection-tabs'>
          {collectionConfig.map(config =>
            <div
              key={config.id}
              className='collection-tab'
              style={{ backgroundColor: config.color, color: config.textColor }} >
              <input
                type='checkbox'
                checked={config.collectedEntryIds.includes(data.entry.id)}
                onChange={() => onCollect(config.id)} />
              <span style={{ paddingRight: '8px' }} onClick={() => onCollect(config.id)}>{config.name}</span>
            </div>
          )}
        </div>
      }
      <div
        className={className}
        style={style}
        onClick={onClick}>
        <Base
          data={data}
          layout={isPreview ? data.collection.layoutPreview : data.collection.layout}
          onLinkClicked={onLinkClicked} />
      </div>
    </div>
  );
}
