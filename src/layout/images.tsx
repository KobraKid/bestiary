import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import { EntryContext, PackageContext } from '../context';
import '../styles/images.scss';

// =============================================================================
// | Sprite
// =============================================================================
export interface ISpriteLayoutProps extends ILayoutProps {
  value: string
}

export const Sprite = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let value = useMemo(() => getValueOrLiteral(entry, pkg, (layout as ISpriteLayoutProps).value), [entry]);
  if (!value) { return null; }

  const [imageExists, setImageExists] = useState<boolean>(false);

  let path = useMemo(() => {
    setImageExists(false);
    return window.path.join(pkg.metadata.path, value.toString());
  }, [value]);

  useEffect(() => {
    window.pkg.fileExists(path).then(exists => {
      if (exists) {
        setImageExists(true);
      }
      else {
        window.log.writeError("❗Could not locate image <" + value + ">");
      }
    });
  }, [path]);

  let style = useMemo(() => getStyle(entry, pkg, layout.style), [layout.style]);

  return (
    imageExists ?
      <img src={path} style={style} />
      : <div style={style}>{/* Placeholder */}</div>
  );
}

// =============================================================================
// | Sprite List
// =============================================================================
export interface ISpriteListLayoutProps extends ILayoutProps {
  values: string[]
}

export const SpriteList = () => {
  const { pkg } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  let values: string[] = [];
  (layout as ISpriteListLayoutProps).values.forEach(image => values.push(window.path.join(pkg.metadata.path, "" + getValueOrLiteral(entry, pkg, image))));

  const [currentImage, setCurrentImage] = useState<number>(0);

  let style = getStyle(entry, pkg, layout.style);

  const onNextClicked = useCallback(() => {
    setCurrentImage(i => i < values.length - 1 ? i + 1 : 0);
  }, []);

  const onPrevClicked = useCallback(() => {
    setCurrentImage(i => i > 0 ? i - 1 : values.length - 1);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <img src={values[currentImage]} style={style} />
      <div className='slideshowRegion' style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', textAlign: 'left' }} onClick={onPrevClicked}>
        <span style={{ position: 'absolute', top: '45%' }}>&lt;</span>
      </div>
      <div className='slideshowRegion' style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', textAlign: 'right' }} onClick={onNextClicked}>
        <span style={{ position: 'absolute', top: '45%', right: 0 }}>&gt;</span>
      </div>
    </div>
  );
}