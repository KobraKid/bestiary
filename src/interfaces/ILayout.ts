import IPackage from "./IPackage";

export const enum LAYOUT_TYPE {
  /* groupings */
  horizontal = "horizontal",
  vertical = "vertical",
  /* basic */
  string = "string",
  ratio = "ratio",
  percent = "percent",
  /* images */
  sprite = "sprite",
  /* relation */
  link = "link",
  chain = "chain",
  dropTable = "dropTable",
}

export interface ILayoutElement {
  /**
   * The layout type to render
   */
  type?: LAYOUT_TYPE,
  /**
   * The selected package
   */
  pkg?: IPackage,
  /**
   * The entry's attributes
   */
  data: object,
}
