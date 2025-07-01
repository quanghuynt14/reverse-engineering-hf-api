import { join } from "path";
import { listCollections } from "../../huggingface.js/packages/hub/dist/index.js";
import { writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

const res = [];
for await (const model of listCollections({
  limit: 10000,
  accessToken: HF_TOKEN,
})) {
  console.log("My collection:", model);
  res.push(model);
}

// Save res to a JSON file
const outputPath = join(process.cwd(), "generated/collections.json");
writeFileSync(outputPath, JSON.stringify(res, null, 2));
console.log(`Collections saved to: ${outputPath}`);
