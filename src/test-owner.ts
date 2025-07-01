import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface CollectionItem {
  owner?: any;
  authorData?: any;
  [key: string]: any;
}

// JSON Schema for ApiCollectionOwner
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

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true });
const validateSchema = ajv.compile(apiCollectionOwnerSchema);

function validateApiCollectionOwner(
  obj: any,
  propertyPath: string,
): ValidationResult {
  if (!obj) {
    return { isValid: false, errors: [`${propertyPath} is null or undefined`] };
  }

  const isValid = validateSchema(obj);
  const errors: string[] = [];

  if (!isValid && validateSchema.errors) {
    validateSchema.errors.forEach((error) => {
      const field = error.instancePath
        ? `${propertyPath}${error.instancePath}`
        : propertyPath;
      const message = error.message || "validation error";

      switch (error.keyword) {
        case "required":
          errors.push(
            `${propertyPath}.${error.params.missingProperty} is required`,
          );
          break;
        case "type":
          errors.push(
            `${field} should be ${error.params.type}, got ${typeof obj[error.instancePath?.slice(1) || ""]}`,
          );
          break;
        case "enum":
          errors.push(
            `${field} should be one of [${error.params.allowedValues.join(", ")}], got ${error.data}`,
          );
          break;
        case "additionalProperties":
          errors.push(
            `${field} has unexpected property: ${error.params.additionalProperty}`,
          );
          break;
        default:
          errors.push(`${field} ${message}`);
      }
    });
  }

  return {
    isValid,
    errors,
  };
}

function validateCollectionsFile(filePath: string): void {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const collections: CollectionItem[] = JSON.parse(fileContent);

    console.log(`📂 Reading collections from: ${filePath}`);
    console.log(`📊 Total collections found: ${collections.length}\n`);

    let totalErrors = 0;
    let validOwners = 0;
    let validAuthorData = 0;

    collections.forEach((collection, index) => {
      const hasOwner = collection.hasOwnProperty("owner");
      const hasItems =
        collection.hasOwnProperty("items") && Array.isArray(collection.items);

      console.log(
        `\n🔍 Collection ${index + 1} ${collection.slug || "[no slug]"}:`,
      );
      console.log(`   Has owner: ${hasOwner}`);
      console.log(
        `   Has items: ${hasItems} (${hasItems ? collection.items.length : 0} items)`,
      );

      // Validate owner property
      if (hasOwner) {
        const ownerValidation = validateApiCollectionOwner(
          collection.owner,
          `collections[${index}].owner`,
        );
        if (ownerValidation.isValid) {
          console.log(`   ✅ owner is valid`);
          validOwners++;
        } else {
          console.log(`   ❌ owner validation errors:`);
          ownerValidation.errors.forEach((error) => {
            console.log(`      - ${error}`);
            totalErrors++;
          });
        }
      }

      // Validate authorData in items
      if (hasItems) {
        collection.items.forEach((item: any, itemIndex: number) => {
          if (item.hasOwnProperty("authorData")) {
            const authorDataValidation = validateApiCollectionOwner(
              item.authorData,
              `collections[${index}].items[${itemIndex}].authorData`,
            );
            if (authorDataValidation.isValid) {
              console.log(`   ✅ items[${itemIndex}].authorData is valid`);
              validAuthorData++;
            } else {
              console.log(
                `   ❌ items[${itemIndex}].authorData validation errors:`,
              );
              authorDataValidation.errors.forEach((error) => {
                console.log(`      - ${error}`);
                totalErrors++;
              });
            }
          }
        });
      }
    });

    // Summary
    console.log(`\n📋 VALIDATION SUMMARY:`);
    console.log(`   Total collections: ${collections.length}`);
    console.log(
      `   Collections with owner: ${collections.filter((c) => c.hasOwnProperty("owner")).length}`,
    );

    // Count total items with authorData
    const totalItemsWithAuthorData = collections.reduce((count, collection) => {
      if (collection.items && Array.isArray(collection.items)) {
        return (
          count +
          collection.items.filter((item: any) =>
            item.hasOwnProperty("authorData"),
          ).length
        );
      }
      return count;
    }, 0);

    console.log(`   Items with authorData: ${totalItemsWithAuthorData}`);
    console.log(`   Valid owners: ${validOwners}`);
    console.log(`   Valid authorData: ${validAuthorData}`);
    console.log(`   Total errors: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log(
        `\n🎉 All owner and authorData properties match the ApiCollectionOwner interface!`,
      );
    } else {
      console.log(`\n⚠️  Found ${totalErrors} type validation errors.`);
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

console.log("🚀 Starting collections.json type validation...\n");
validateCollectionsFile(filePath);

console.log("\n✅ Validation completed.");
