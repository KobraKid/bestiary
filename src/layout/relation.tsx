import React from 'react';
import { Entry } from '../entry';
import { ILayoutElement } from '../interfaces/ILayout';
import { ICollection, IEntry } from '../interfaces/IPackage';
import '../styles/collection.scss';

export interface ILinkProps extends ILayoutElement {
  link: string,
}

export const Link = (props: ILinkProps) => {
  const { type: _, pkg, data, link } = props;

  const linkInfo: [string, string] = data[link as keyof typeof data];

  if (!linkInfo || linkInfo.length < 2) { return null; }

  const linkedCollection = pkg?.collections?.find((collection: ICollection) => collection.name === linkInfo[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === linkInfo[1]);

  return (
    (linkedCollection && linkedEntry) ?
      <Entry
        pkg={pkg!}
        attributes={linkedEntry.attributes}
        layout={linkedCollection.layoutPreview}
        className="preview-item" />
      : null
  );
}

export interface IChainProps extends ILayoutElement {
  previous?: string[],
  next?: string[],
}

export const Chain = (props: IChainProps) => {
  const { type: _, pkg, data, previous, next } = props;

  return (
    <React.Fragment>
      {previous?.map((link: string) => <Link pkg={pkg} data={data} link={link} />)}
      <p>(Current Entry)</p>
      {next?.map((link: string) => <Link pkg={pkg} data={data} link={link} />)}
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