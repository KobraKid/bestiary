import { createContext } from "react";
import ICollection from "./model/Collection";

const CollectionContext = createContext<ICollection>({
    name: "",
    layout: {},
    layoutPreview: {},
    data: []
});

export default CollectionContext;