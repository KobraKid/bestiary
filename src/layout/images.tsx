import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import '../styles/images.scss';

// =============================================================================
// | Sprite
// =============================================================================
export interface ISpriteLayoutProps extends ILayoutProps {
  value: string
}

export interface ISpriteProps extends ILayoutElement {
  layout: ISpriteLayoutProps
}

export const Sprite = (props: ISpriteProps) => {
  const { layout } = props;
  let value = useMemo(() => getValueOrLiteral(props.data, layout.value), []);
  if (!value) { return null; }

  const [imageExists, setImageExists] = useState<boolean>(false);
  let path = useMemo(() => window.path.join(props.data.pkg.metadata.path, value.toString()), []);
  useEffect(() => {
    window.pkg.fileExists(path).then(exists => {
      if (exists) {
        setImageExists(true);
      }
      else {
        window.log.writeError("❗Could not locate image <" + value + ">");
      }
    });
  }, []);

  let style = useMemo(() => getStyle(props.data, layout.style), []);

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

export interface ISpriteListProps extends ILayoutElement {
  layout: ISpriteListLayoutProps
}

export const SpriteList = (props: ISpriteListProps) => {
  const { layout } = props;
  let values: string[] = [];
  layout.values.forEach(image => values.push(
    window.path.join(
      props.data.pkg.metadata.path,
      "" + getValueOrLiteral(props.data, image)
    )
  ));

  const [currentImage, setCurrentImage] = useState<number>(0);

  let style = getStyle(props.data, layout.style);

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