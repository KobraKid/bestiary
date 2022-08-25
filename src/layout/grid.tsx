import React from 'react';
import { ILayoutElement, ILayoutProps, LAYOUT_TYPE } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import { Number, Percent, String } from './basic';
import { Link } from './relation';
import '../styles/grid.scss';
import { Sprite } from './images';

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

    const cols = getValueOrLiteral<{ type: LAYOUT_TYPE, header: string }[]>(data, layout.cols);
    if (!cols) { return null; }
    const rows = getValueOrLiteral<any[]>(data, layout.rows);
    if (!rows) { return null; }
    const styles = layout.cols.map(col => getStyle(data, col.style));

    return (
        <React.Fragment>
            <table>
                <thead><tr>{cols.map((col, c) => <th key={c}>{col.header}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, r) =>
                        <tr key={r}>
                            {cols.map((col, c) => {
                                switch (col.type) {
                                    case LAYOUT_TYPE.string:
                                        return <td key={c}><String layout={{ value: row[c], style: styles[c] }} data={data} /></td>;
                                    case LAYOUT_TYPE.number:
                                        return <td key={c}><Number layout={{ value: row[c], style: styles[c] }} data={data} /></td>;
                                    case LAYOUT_TYPE.percent:
                                        return <td key={c}><Percent layout={{ value: row[c], style: styles[c] }} data={data} /></td>
                                    case LAYOUT_TYPE.link:
                                        return <td key={c}><Link layout={{ link: row[c], style: styles[c] }} data={data} onLinkClicked={onLinkClicked} /></td>;
                                    case LAYOUT_TYPE.sprite:
                                        return <td key={c}><Sprite layout={{ value: row[c], style: styles[c] }} data={data} /></td>
                                    default:
                                        return null;
                                }
                            }
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
        </React.Fragment>
    );
}