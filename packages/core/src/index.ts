// @mdview/core 公共 API 导出
export { render } from './render.js';
export type { RenderOptions, RenderResult, Heading } from './render.js';
export type { MdviewMetadata } from './metadata.js';
export { parseMetadata, mergeMetadata, DEFAULT_METADATA } from './metadata.js';
export {
  MDVIEW_PROTOCOL_VERSION,
  MDVIEW_SOURCE_SCRIPT_TYPE,
  MDVIEW_SOURCE_ID,
  MDVIEW_OUTPUT_ID,
} from './constants.js';
export {
  BUILT_IN_EXTENSIONS,
  applyExtensions,
  registerExtension,
  unregisterExtension,
  listExtensions,
} from './extensions/index.js';
export type { ExtensionFactory } from './extensions/index.js';
