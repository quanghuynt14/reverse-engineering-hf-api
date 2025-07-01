import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface CollectionItem {
  items?: any[];
  [key: string]: any;
}

// JSON Schema for ApiCollectionOwner (referenced in authorData)
const apiCollectionOwnerSchema = {
  type: "object",
  required: [
    "avatarUrl",
    "fullname",
    "type",
    "name",
    "isHf",
    "isHfAdmin",
    "isMod",
  ],
  additionalProperties: false,
  properties: {
    _id: { type: "string" },
    avatarUrl: { type: "string" },
    fullname: { type: "string" },
    type: { type: "string", enum: ["user", "org"] },
    name: { type: "string" },
    isPro: { type: "boolean" },
    isEnterprise: { type: "boolean" },
    isHf: { type: "boolean" },
    isHfAdmin: { type: "boolean" },
    isMod: { type: "boolean" },
    followerCount: { type: "number" },
  },
};

// JSON Schema for ModelAvailableInferenceProvider
const modelAvailableInferenceProviderSchema = {
  type: "object",
  required: ["provider", "modelStatus", "providerStatus", "providerId", "task"],
  additionalProperties: false,
  properties: {
    provider: { type: "string" },
    modelStatus: { type: "string" },
    providerStatus: { type: "string" },
    providerId: { type: "string" },
    task: { type: "string" },
    adapterWeightsPath: { type: "string" },
    adapterType: { type: "string" },
  },
};

// JSON Schema for SpaceRuntime
const spaceRuntimeSchema = {
  type: "object",
  required: ["stage", "hardware", "storage", "replicas"],
  additionalProperties: false,
  properties: {
    stage: { type: "string" },
    hardware: {
      type: "object",
      required: ["current", "requested"],
      additionalProperties: false,
      properties: {
        current: { type: "string", nullable: true },
        requested: { type: "string", nullable: true },
      },
    },
    storage: { type: "string", nullable: true },
    gcTimeout: { type: "number", nullable: true },
    replicas: {
      type: "object",
      required: ["requested"],
      additionalProperties: false,
      properties: {
        current: { type: "number" },
        requested: {
          oneOf: [{ type: "number" }, { type: "string", enum: ["auto"] }],
        },
      },
    },
    devMode: { type: "boolean" },
    domains: {
      type: "array",
      items: {
        type: "object",
        required: ["domain", "stage"],
        additionalProperties: false,
        properties: {
          domain: { type: "string" },
          stage: { type: "string" },
        },
      },
    },
    sha: { type: "string" },
    errorMessage: { type: "string", nullable: true },
  },
};

// JSON Schema for ApiCollectionItemBase
const apiCollectionItemBaseSchema = {
  type: "object",
  required: ["_id", "position", "type", "id"],
  additionalProperties: true, // Allow additional properties for extended types
  properties: {
    _id: { type: "string" },
    position: { type: "number" },
    type: {
      type: "string",
      enum: ["model", "dataset", "space", "paper", "collection"],
    },
    id: { type: "string" },
    note: {
      type: "object",
      required: ["html", "text"],
      additionalProperties: false,
      properties: {
        html: { type: "string" },
        text: { type: "string" },
      },
    },
    gallery: {
      type: "array",
      items: { type: "string" },
    },
  },
};

// JSON Schema for Model-specific properties only
const apiCollectionItemModelSpecificSchema = {
  type: "object",
  required: [
    "author",
    "authorData",
    "downloads",
    "gated",
    "availableInferenceProviders",
    "lastModified",
    "likes",
    "isLikedByUser",
    "private",
    "repoType",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", const: "model" },
    author: { type: "string" },
    authorData: apiCollectionOwnerSchema,
    downloads: { type: "number" },
    gated: {
      oneOf: [
        { type: "boolean", const: false },
        { type: "string", enum: ["auto", "manual"] },
      ],
    },
    availableInferenceProviders: {
      type: "array",
      items: modelAvailableInferenceProviderSchema,
    },
    lastModified: { type: "string" },
    likes: { type: "number" },
    isLikedByUser: { type: "boolean" },
    pipeline_tag: { type: "string" },
    private: { type: "boolean" },
    repoType: { type: "string" },
    widgetOutputUrls: {
      type: "array",
      items: { type: "string" },
    },
    numParameters: { type: "number" },
  },
};

// JSON Schema for Dataset-specific properties only
const apiCollectionItemDatasetSpecificSchema = {
  type: "object",
  required: [
    "author",
    "downloads",
    "gated",
    "lastModified",
    "likes",
    "isLikedByUser",
    "private",
    "repoType",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", const: "dataset" },
    author: { type: "string" },
    downloads: { type: "number" },
    gated: {
      oneOf: [
        { type: "boolean", const: false },
        { type: "string", enum: ["auto", "manual"] },
      ],
    },
    lastModified: { type: "string" },
    likes: { type: "number" },
    isLikedByUser: { type: "boolean" },
    private: { type: "boolean" },
    repoType: { type: "string" },
    datasetsServerInfo: {
      type: "object",
      required: ["viewer", "numRows", "libraries"],
      additionalProperties: false,
      properties: {
        viewer: { type: "string" },
        numRows: { type: "number" },
        libraries: {
          type: "array",
          items: { type: "string" },
        },
        formats: {
          type: "array",
          items: { type: "string" },
        },
        modalities: {
          type: "array",
          items: { type: "string" },
        },
        tags: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
};

// JSON Schema for Space-specific properties only
const apiCollectionItemSpaceSpecificSchema = {
  type: "object",
  required: [
    "author",
    "authorData",
    "createdAt",
    "lastModified",
    "likes",
    "isLikedByUser",
    "private",
    "repoType",
    "tags",
    "pinned",
    "emoji",
    "runtime",
    "title",
    "trendingScore",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", const: "space" },
    author: { type: "string" },
    authorData: apiCollectionOwnerSchema,
    createdAt: { type: "string" },
    lastModified: { type: "string" },
    likes: { type: "number" },
    isLikedByUser: { type: "boolean" },
    private: { type: "boolean" },
    repoType: { type: "string" },
    sdk: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    pinned: { type: "boolean" },
    emoji: { type: "string" },
    colorFrom: { type: "string" },
    colorTo: { type: "string" },
    runtime: spaceRuntimeSchema,
    shortDescription: { type: "string" },
    title: { type: "string" },
    ai_short_description: { type: "string" },
    ai_category: { type: "string" },
    trendingScore: { type: "number" },
  },
};

// JSON Schema for Paper-specific properties only
const apiCollectionItemPaperSpecificSchema = {
  type: "object",
  required: [
    "title",
    "thumbnailUrl",
    "upvotes",
    "isUpvotedByUser",
    "publishedAt",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", const: "paper" },
    title: { type: "string" },
    thumbnailUrl: { type: "string" },
    upvotes: { type: "number" },
    isUpvotedByUser: { type: "boolean" },
    publishedAt: { type: "string" },
  },
};

// JSON Schema for Collection-specific properties only
const apiCollectionItemCollectionSpecificSchema = {
  type: "object",
  required: [
    "slug",
    "title",
    "lastUpdated",
    "numberItems",
    "owner",
    "theme",
    "shareUrl",
    "upvotes",
    "isUpvotedByUser",
  ],
  additionalProperties: false,
  properties: {
    type: { type: "string", const: "collection" },
    slug: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    lastUpdated: { type: "string" },
    numberItems: { type: "number" },
    owner: apiCollectionOwnerSchema,
    theme: { type: "string" },
    shareUrl: { type: "string" },
    upvotes: { type: "number" },
    isUpvotedByUser: { type: "boolean" },
  },
};

// Initialize AJV validators
const ajv = new Ajv({ allErrors: true });
const validateItemBase = ajv.compile(apiCollectionItemBaseSchema);
const validateItemModelSpecific = ajv.compile(
  apiCollectionItemModelSpecificSchema,
);
const validateItemDatasetSpecific = ajv.compile(
  apiCollectionItemDatasetSpecificSchema,
);
const validateItemSpaceSpecific = ajv.compile(
  apiCollectionItemSpaceSpecificSchema,
);
const validateItemPaperSpecific = ajv.compile(
  apiCollectionItemPaperSpecificSchema,
);
const validateItemCollectionSpecific = ajv.compile(
  apiCollectionItemCollectionSpecificSchema,
);

// Helper function to get base schema property names
function getBaseSchemaProperties(): Set<string> {
  const baseProps = new Set<string>();
  if (apiCollectionItemBaseSchema.properties) {
    Object.keys(apiCollectionItemBaseSchema.properties).forEach((prop) => {
      baseProps.add(prop);
    });
  }
  return baseProps;
}

// Helper function to filter out base properties for specific validation
function filterBaseProperties(obj: unknown): any {
  const baseProps = getBaseSchemaProperties();
  const filtered: Record<string, any> = {};

  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      if (!baseProps.has(key)) {
        filtered[key] = (obj as Record<string, unknown>)[key];
      }
    });
  }

  return filtered;
}

function validateApiCollectionItem(
  obj: any,
  propertyPath: string,
  expectedType?: string,
): ValidationResult {
  if (!obj) {
    return { isValid: false, errors: [`${propertyPath} is null or undefined`] };
  }

  // If expectedType is provided, validate it matches
  if (
    expectedType &&
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    obj.type !== expectedType
  ) {
    return {
      isValid: false,
      errors: [
        `${propertyPath}.type should be "${expectedType}", got "${obj.type}"`,
      ],
    };
  }

  const errors: string[] = [];
  let allValid = true;

  // Always validate base schema first
  const baseValid = validateItemBase(obj);
  if (!baseValid && validateItemBase.errors) {
    allValid = false;
    validateItemBase.errors.forEach((error) => {
      const field = error.instancePath
        ? `${propertyPath}${error.instancePath}`
        : propertyPath;

      switch (error.keyword) {
        case "required":
          errors.push(
            `${propertyPath}.${error.params.missingProperty} is required (base)`,
          );
          break;
        case "type":
          errors.push(
            `${field} should be ${error.params.type}, got ${typeof obj[error.instancePath?.slice(1) || ""]} (base)`,
          );
          break;
        case "enum":
          errors.push(
            `${field} should be one of [${error.params.allowedValues.join(", ")}], got ${error.data} (base)`,
          );
          break;
        default:
          errors.push(`${field} ${error.message || "validation error"} (base)`);
      }
    });
  }

  // Validate type-specific schema
  let specificValidator;
  let schemaName = "Base";

  if (obj.type === "model") {
    specificValidator = validateItemModelSpecific;
    schemaName = "Model";
  } else if (obj.type === "dataset") {
    specificValidator = validateItemDatasetSpecific;
    schemaName = "Dataset";
  } else if (obj.type === "space") {
    specificValidator = validateItemSpaceSpecific;
    schemaName = "Space";
  } else if (obj.type === "paper") {
    specificValidator = validateItemPaperSpecific;
    schemaName = "Paper";
  } else if (obj.type === "collection") {
    specificValidator = validateItemCollectionSpecific;
    schemaName = "Collection";
  }

  if (specificValidator) {
    // Filter out base properties before validating specific schema
    const filteredObj = filterBaseProperties(obj);
    const specificValid = specificValidator(filteredObj);
    if (!specificValid && specificValidator.errors) {
      allValid = false;
      specificValidator.errors.forEach((error) => {
        const field = error.instancePath
          ? `${propertyPath}${error.instancePath}`
          : propertyPath;
        const message = error.message || "validation error";

        switch (error.keyword) {
          case "required":
            errors.push(
              `${propertyPath}.${error.params.missingProperty} is required (${schemaName})`,
            );
            break;
          case "type":
            errors.push(
              `${field} should be ${error.params.type}, got ${typeof filteredObj[error.instancePath?.slice(1) || ""]} (${schemaName})`,
            );
            break;
          case "enum":
            errors.push(
              `${field} should be one of [${error.params.allowedValues.join(", ")}], got ${error.data} (${schemaName})`,
            );
            break;
          case "const":
            errors.push(
              `${field} should be "${error.params.allowedValue}", got "${error.data}" (${schemaName})`,
            );
            break;
          case "additionalProperties":
            errors.push(
              `${field} has unexpected property: ${error.params.additionalProperty} (${schemaName})`,
            );
            break;
          case "oneOf":
            errors.push(
              `${field} should match one of the allowed patterns (false or "auto"/"manual") (${schemaName})`,
            );
            break;
          default:
            errors.push(`${field} ${message} (${schemaName})`);
        }
      });
    }
  }

  return {
    isValid: allValid,
    errors,
  };
}

function validateCollectionsItems(filePath: string): void {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const collections: CollectionItem[] = JSON.parse(fileContent);

    console.log(`📂 Reading collections from: ${filePath}`);
    console.log(`📊 Total collections found: ${collections.length}\n`);

    let totalErrors = 0;
    let totalItems = 0;
    let validItems = 0;
    const itemsByType: Record<string, number> = {};
    const validItemsByType: Record<string, number> = {};

    collections.forEach((collection, collectionIndex) => {
      const hasItems =
        collection.hasOwnProperty("items") && Array.isArray(collection.items);

      console.log(
        `\n🔍 Collection ${collectionIndex + 1} ${collection.slug || "[no slug]"}:`,
      );
      console.log(
        `   Has items: ${hasItems} (${hasItems && collection.items ? collection.items.length : 0} items)`,
      );

      if (hasItems && collection.items) {
        collection.items.forEach((item: any, itemIndex: number) => {
          totalItems++;
          const itemType = item.type || "unknown";
          itemsByType[itemType] = (itemsByType[itemType] || 0) + 1;

          console.log(`\n   📄 Item ${itemIndex + 1} (${itemType}):`);

          const itemValidation = validateApiCollectionItem(
            item,
            `collections[${collectionIndex}].items[${itemIndex}]`,
          );

          if (itemValidation.isValid) {
            console.log(`      ✅ Item is valid`);
            validItems++;
            validItemsByType[itemType] = (validItemsByType[itemType] || 0) + 1;
          } else {
            console.log(`      ❌ Item validation errors:`);
            itemValidation.errors.forEach((error) => {
              console.log(`         - ${error}`);
              totalErrors++;
            });
          }

          // Additional logging for model items
          if (itemType === "model") {
            console.log(`      Author: ${item.author || "N/A"}`);
            console.log(`      Downloads: ${item.downloads || "N/A"}`);
            console.log(`      Likes: ${item.likes || "N/A"}`);
            console.log(`      Gated: ${item.gated}`);
            console.log(`      Pipeline tag: ${item.pipeline_tag || "N/A"}`);
            console.log(
              `      Inference providers: ${item.availableInferenceProviders?.length || 0}`,
            );
          } else if (itemType === "dataset") {
            console.log(`      Author: ${item.author || "N/A"}`);
            console.log(`      Downloads: ${item.downloads || "N/A"}`);
            console.log(`      Likes: ${item.likes || "N/A"}`);
            console.log(`      Gated: ${item.gated}`);
            if (item.datasetsServerInfo) {
              console.log(
                `      Viewer: ${item.datasetsServerInfo.viewer || "N/A"}`,
              );
              console.log(
                `      Rows: ${item.datasetsServerInfo.numRows || "N/A"}`,
              );
              console.log(
                `      Libraries: [${item.datasetsServerInfo.libraries?.join(", ") || "N/A"}]`,
              );
              console.log(
                `      Formats: [${item.datasetsServerInfo.formats?.join(", ") || "N/A"}]`,
              );
              console.log(
                `      Modalities: [${item.datasetsServerInfo.modalities?.join(", ") || "N/A"}]`,
              );
            } else {
              console.log(`      Datasets Server Info: Missing`);
            }
          } else if (itemType === "space") {
            console.log(`      Author: ${item.author || "N/A"}`);
            console.log(`      Likes: ${item.likes || "N/A"}`);
            console.log(`      Private: ${item.private}`);
            console.log(`      SDK: ${item.sdk || "N/A"}`);
            console.log(`      Tags: [${item.tags?.join(", ") || "N/A"}]`);
            console.log(`      Pinned: ${item.pinned}`);
            console.log(`      Emoji: ${item.emoji || "N/A"}`);
            console.log(`      Title: ${item.title || "N/A"}`);
            console.log(
              `      Short Description: ${item.shortDescription || "N/A"}`,
            );
            if (item.runtime) {
              console.log(
                `      Runtime Stage: ${item.runtime.stage || "N/A"}`,
              );
              console.log(
                `      Hardware: ${item.runtime.hardware?.current || "N/A"} (requested: ${item.runtime.hardware?.requested || "N/A"})`,
              );
              console.log(`      Storage: ${item.runtime.storage || "N/A"}`);
            } else {
              console.log(`      Runtime: Missing`);
            }
          } else if (itemType === "paper") {
            console.log(`      Title: ${item.title || "N/A"}`);
            console.log(`      Thumbnail URL: ${item.thumbnailUrl || "N/A"}`);
            console.log(`      Upvotes: ${item.upvotes || "N/A"}`);
            console.log(`      Published At: ${item.publishedAt || "N/A"}`);
          } else if (itemType === "collection") {
            console.log(`      Slug: ${item.slug || "N/A"}`);
            console.log(`      Title: ${item.title || "N/A"}`);
            console.log(`      Description: ${item.description || "N/A"}`);
            console.log(`      Last Updated: ${item.lastUpdated || "N/A"}`);
            console.log(`      Number of Items: ${item.numberItems || "N/A"}`);
            console.log(`      Owner: ${item.owner?.fullname || "N/A"}`);
            console.log(`      Theme: ${item.theme || "N/A"}`);
            console.log(`      Share URL: ${item.shareUrl || "N/A"}`);
            console.log(`      Upvotes: ${item.upvotes || "N/A"}`);
          }
        });
      }
    });

    // Summary
    console.log(`\n📋 ITEM VALIDATION SUMMARY:`);
    console.log(`   Total collections: ${collections.length}`);
    console.log(`   Total items: ${totalItems}`);
    console.log(`   Valid items: ${validItems}`);
    console.log(`   Total errors: ${totalErrors}`);

    console.log(`\n📊 ITEMS BY TYPE:`);
    Object.entries(itemsByType).forEach(([type, count]) => {
      const validCount = validItemsByType[type] || 0;
      console.log(`   ${type}: ${count} total, ${validCount} valid`);
    });

    if (totalErrors === 0) {
      console.log(
        `\n🎉 All items match their respective interface definitions!`,
      );
    } else {
      console.log(
        `\n⚠️  Found ${totalErrors} type validation errors in items.`,
      );
    }

    // Type-specific summaries
    if (itemsByType.model > 0) {
      console.log(`\n🤖 MODEL ITEMS ANALYSIS:`);
      console.log(`   Total models: ${itemsByType.model}`);
      console.log(`   Valid models: ${validItemsByType.model || 0}`);

      if (validItemsByType.model > 0) {
        console.log(
          `   ✅ All required ApiCollectionItemModel properties are present and valid`,
        );
      }
    }

    if (itemsByType.dataset > 0) {
      console.log(`\n📊 DATASET ITEMS ANALYSIS:`);
      console.log(`   Total datasets: ${itemsByType.dataset}`);
      console.log(`   Valid datasets: ${validItemsByType.dataset || 0}`);

      if (validItemsByType.dataset > 0) {
        console.log(
          `   ✅ All required ApiCollectionItemDataset properties are present and valid`,
        );
      }
    }

    if (itemsByType.space > 0) {
      console.log(`\n🚀 SPACE ITEMS ANALYSIS:`);
      console.log(`   Total spaces: ${itemsByType.space}`);
      console.log(`   Valid spaces: ${validItemsByType.space || 0}`);

      if (validItemsByType.space > 0) {
        console.log(
          `   ✅ All required ApiCollectionItemSpace properties are present and valid`,
        );
      }
    }

    if (itemsByType.paper > 0) {
      console.log(`\n📄 PAPER ITEMS ANALYSIS:`);
      console.log(`   Total papers: ${itemsByType.paper}`);
      console.log(`   Valid papers: ${validItemsByType.paper || 0}`);

      if (validItemsByType.paper > 0) {
        console.log(
          `   ✅ All required ApiCollectionItemPaper properties are present and valid`,
        );
      }
    }

    if (itemsByType.collection > 0) {
      console.log(`\n📚 COLLECTION ITEMS ANALYSIS:`);
      console.log(`   Total collections: ${itemsByType.collection}`);
      console.log(`   Valid collections: ${validItemsByType.collection || 0}`);

      if (validItemsByType.collection > 0) {
        console.log(
          `   ✅ All required ApiCollectionItemCollection properties are present and valid`,
        );
      }
    }
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error("❌ Invalid JSON format:", error.message);
    } else if (error.code === "ENOENT") {
      console.error("❌ File not found:", filePath);
    } else {
      console.error("❌ Error reading file:", error.message);
    }
  }
}

const filePath = path.join(process.cwd(), "generated/collections.json");

console.log("🚀 Starting collections.json items type validation...\n");
validateCollectionsItems(filePath);

console.log("\n✅ Item validation completed.");
