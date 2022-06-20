import React from 'react';
import { Entry } from '../entry';
import { ILayoutElement } from '../interfaces/ILayout';
import { ICollection, IEntry } from '../interfaces/IPackage';
import '../styles/collection.scss';
import { getValueOrLiteral } from './base';

type Link = [string, string];

export interface ILinkProps extends ILayoutElement {
  link: string | Link,
  onLinkClicked: (entry: IEntry, collection: ICollection) => void,
}

export const Link = (props: ILinkProps) => {
  const { type: _, pkg, data, link, onLinkClicked } = props;

  const linkInfo: Link = getValueOrLiteral<Link>(data, link);

  if (!linkInfo || linkInfo.length < 2) { return null; }

  const linkedCollection = pkg?.collections?.find((collection: ICollection) => collection.name === linkInfo[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === linkInfo[1]);

  return (
    (linkedCollection && linkedEntry) ?
      <Entry
        pkg={pkg!}
        attributes={linkedEntry.attributes}
        layout={linkedCollection.layoutPreview}
        onLinkClicked={onLinkClicked}
        onClick={() => {
          console.log(linkedEntry, linkedCollection);
          onLinkClicked(linkedEntry, linkedCollection);
        }}
        className='preview-item' />
      : null
  );
}

export interface IChainProps extends ILayoutElement {
  previous?: string,
  next?: string,
  onLinkClicked: (entry: IEntry, collection: ICollection) => void,
}

export const Chain = (props: IChainProps) => {
  const { type: _, pkg, data, previous, next, onLinkClicked } = props;

  return (
    <React.Fragment>
      {previous ? getValueOrLiteral<Link[]>(data, previous).map((link: Link) => <Link key={link[1]} pkg={pkg} data={data} link={link} onLinkClicked={onLinkClicked} />) : null}
      <p>(Current Entry)</p>
      {next ? getValueOrLiteral<Link[]>(data, next).map((link: Link) => <Link key={link[1]} pkg={pkg} data={data} link={link} onLinkClicked={onLinkClicked} />) : null}
    </React.Fragment>
  );
}

export interface IDropTableProps extends ILayoutElement {
  dropList: object[],
}

export const DropTable = (props: IDropTableProps) => {
  const { type: _, pkg, data, dropList } = props;

  return (
    <ul>
      {dropList}
    </ul>
  );
}