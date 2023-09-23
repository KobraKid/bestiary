import React from "react";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { IEntryMetadata } from "../../model/Entry";
import "../styles/details.scss";

export interface IEntryProps {
    /**
     * The entry to display
     */
    entry: IEntryMetadata,
    /**
     * Callback for when this entry is clicked
     */
    onClick?: () => void
}

export const Entry: React.FC<IEntryProps> = (props: IEntryProps) => {
    const { entry, onClick } = props;

    return (
        <div className='details'>
            <div onClick={onClick}>
                {convertHtmlToReact(entry.layout)}
            </div>
            {entry.style && convertHtmlToReact(entry.style)}
        </div>
    );
};