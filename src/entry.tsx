import React from 'react';
import { convertHtmlToReact } from '@hedgedoc/html-to-react';
import IEntry from './model/Entry';

export interface IEntryProps {
    entry: IEntry | null,
    onClick: () => void
}

export const Entry: React.FC<IEntryProps> = (props: IEntryProps) => {
    const { entry, onClick } = props;
    if (!entry) { return null; }
    return (
        <div onClick={onClick}>
            {convertHtmlToReact(entry.layout)}
        </div>
    );
}