import React from 'react';
import { Entry } from '../entry';
import { ILayoutElement } from '../interfaces/ILayout';
import { ICollection, IEntry } from '../interfaces/IPackage';
import '../styles/collection.scss';
import { getValueOrLiteral } from './base';

type Link = [string, string];

export interface ILinkProps extends ILayoutElement {
  link: string | Link,
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Link = (props: ILinkProps) => {
  const { type: _, data, link, onLinkClicked } = props;

  const linkInfo: Link = getValueOrLiteral<Link>(data.entry.attributes, link);

  if (!linkInfo || linkInfo.length < 2) { return null; }

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === linkInfo[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === linkInfo[1]);

  return (
    (linkedCollection && linkedEntry) ?
      <Entry
        data={{ pkg: data.pkg, collection: linkedCollection, entry: linkedEntry }}
        isPreview
        onLinkClicked={onLinkClicked}
        onClick={() => onLinkClicked(linkedEntry, linkedCollection, data.entry, data.collection)}
        className='preview-item' />
      : null
  );
}

export interface IChainProps extends ILayoutElement {
  previous?: string,
  next?: string,
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Chain = (props: IChainProps) => {
  const { type: _, data, previous, next, onLinkClicked } = props;

  return (
    <React.Fragment>
      {previous ? getValueOrLiteral<Link[] | undefined>(data.entry.attributes, previous)?.map((link: Link) => <Link key={link[1]} data={data} link={link} onLinkClicked={onLinkClicked} />) : null}
      <p>(Current Entry)</p>
      {next ? getValueOrLiteral<Link[] | undefined>(data.entry.attributes, next)?.map((link: Link) => <Link key={link[1]} data={data} link={link} onLinkClicked={onLinkClicked} />) : null}
    </React.Fragment>
  );
}

export interface IDropTableProps extends ILayoutElement {
  dropList: object[],
}

export const DropTable = (props: IDropTableProps) => {
  const { type: _, data, dropList } = props;

  return (
    <ul>
      {dropList}
    </ul>
  );
}