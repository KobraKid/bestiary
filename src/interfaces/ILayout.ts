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
}

export interface ILayoutElement {
  type?: LAYOUT_TYPE,
  data?: any,
  path?: string,
}
