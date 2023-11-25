import React from "react";

interface IOptionsProps {
    show: boolean;
}

export const Options: React.FC<IOptionsProps> = (props: IOptionsProps) => {
    const { show } = props;

    if (!show) {
        return null;
    }

    return (
        <div style={{position: "absolute", zIndex: "999", backgroundColor: "yellow"}}>
            Options!
        </div>
    );
};