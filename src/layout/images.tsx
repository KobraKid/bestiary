import React, { useCallback, useState } from 'react';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import '../styles/images.scss';

// =============================================================================
// | Sprite
// =============================================================================
export interface ISpriteProps extends ILayoutElement {
  layout: ILayoutProps & {
    value: string,
  }
}

export const Sprite = (props: ISpriteProps) => {
  const { layout } = props;
  // console.log(layout.value);
  let value = getValueOrLiteral(props.data, layout.value);
  if (!value) { return null; }

  let style = getStyle(props.data, layout.style);

  return (
    <img src={window.path.join(props.data.pkg.metadata.path, "" + value)} style={style} />
  );
}

// =============================================================================
// | Sprite List
// =============================================================================
export interface ISpriteListProps extends ILayoutElement {
  layout: ILayoutProps & {
    values: string[],
  }
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