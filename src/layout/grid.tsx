import React from 'react';
import { ILayoutElement, ILayoutProps, LAYOUT_TYPE } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import { Number, Percent, String } from './basic';
import { Link } from './relation';
import { Sprite } from './images';
import '../styles/grid.scss';

// =============================================================================
// | Grid
// =============================================================================
export interface IGridProps extends ILayoutElement {
    layout: ILayoutProps & {
        cols: {
            type: LAYOUT_TYPE,
            header: string,
            style?: React.CSSProperties
        }[]
        rows: any[]
    }
}

export const Grid = (props: IGridProps) => {
    const { layout, data, onLinkClicked } = props;

    if (!layout.cols) { return null; }
    const rows = getValueOrLiteral(data, layout.rows);
    if (!Array.isArray(rows)) { return null; }
    const styles = layout.cols.map(col => getStyle(data, col.style));

    return (
        <table>
            <thead><tr>{layout.cols.map((col, c) => <th key={c}>{col.header}</th>)}</tr></thead>
            <tbody>
                {rows.map((row, r) =>
                    <tr key={r}>
                        {layout.cols.map((col, c) => {
                            if (!Array.isArray(row)) { return null; }
                            let val = row[c];
                            if (!val) { return null; }
                            switch (col.type) {
                                case LAYOUT_TYPE.string:
                                    return <td key={c}><String layout={{ value: val as string, style: styles[c] }} data={data} /></td>;
                                case LAYOUT_TYPE.number:
                                    return <td key={c}><Number layout={{ value: val as number, style: styles[c] }} data={data} /></td>;
                                case LAYOUT_TYPE.percent:
                                    return <td key={c}><Percent layout={{ value: val as number, style: styles[c] }} data={data} /></td>
                                case LAYOUT_TYPE.link:
                                    return <td key={c}><Link layout={{ link: val as string, style: styles[c] }} data={data} onLinkClicked={onLinkClicked} /></td>;
                                case LAYOUT_TYPE.sprite:
                                    return <td key={c}><Sprite layout={{ value: val as string, style: styles[c] }} data={data} /></td>
                                default:
                                    return null;
                            }
                        }
                        )}
                    </tr>
                )}
            </tbody>
        </table>
    );
}