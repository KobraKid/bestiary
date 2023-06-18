import mongoose from "mongoose";

/**
 * Represents an entry in a collection
 */
export default interface IEntry {
  /**
   * Entry ID
   */
  entryId: string,
  /**
   * Layout string
   */
  layout: string,
  /**
   * Style string
   */
  style?: string
}