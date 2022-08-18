import React from 'react';
import { Entry } from '../entry';
import { ILayoutElement, ILayoutProps } from '../interfaces/IEntry';
import { ICollection, IEntry } from '../interfaces/IPackage';
import '../styles/collection.scss';
import { getValueOrLiteral } from './base';

// =============================================================================
// | Link
// =============================================================================
type Link = [string, string];

export interface ILinkProps extends ILayoutElement {
  layout: ILayoutProps & {
    link: string | Link,
  }
}

export const Link = (props: ILinkProps) => {
  const { layout, data, onLinkClicked } = props;

  const linkInfo: Link = getValueOrLiteral<Link>(data, layout.link);

  if (!linkInfo || linkInfo.length < 2 || !onLinkClicked) { return null; }

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

// =============================================================================
// | Chain
// =============================================================================
export interface IChainProps extends ILayoutElement {
  layout: ILayoutProps & {
    previous?: string,
    next?: string,
  }
}

export const Chain = (_props: IChainProps) => {
  // const { layout, data, onLinkClicked } = props;

  return (
    <React.Fragment>
      {/* {layout.previous ? getValueOrLiteral<Link[] | undefined>(data, layout.previous)?.map((link: Link) => <Link key={link[1]} data={data} link={layout.link} onLinkClicked={onLinkClicked} />) : null}
      <p>(Current Entry)</p>
      {layout.next ? getValueOrLiteral<Link[] | undefined>(data, layout.next)?.map((link: Link) => <Link key={link[1]} {...link} />) : null} */}
    </React.Fragment>
  );
}