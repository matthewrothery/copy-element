export {
  DEFAULT_OG_IMAGE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_BRAND,
  SITE_TAGLINE,
} from "./constants";
export { buildNoIndexMetadata, buildPageMetadata } from "./metadata";
export type { BuildPageMetadataInput } from "./metadata";
export { buildComparisonMetadata } from "./compare";
export { STATIC_SITEMAP_ROUTES } from "./routes";
export {
  absoluteSchemaUrl,
  articleSchema,
  breadcrumbListSchema,
  collectionPageSchema,
  faqPageSchema,
  itemListSchema,
  organizationSchema,
  softwareApplicationSchema,
  webApplicationSchema,
  webPageSchema,
  webSiteSchema,
} from "./schema";
export type { BreadcrumbSchemaItem, FaqSchemaItem } from "./schema";
