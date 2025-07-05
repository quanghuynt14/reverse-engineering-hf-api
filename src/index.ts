import { join } from "path";
import { listCollections } from "../../huggingface.js/packages/hub/dist/index.js";
import { writeFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  throw new Error("HF_TOKEN is not set in the environment variables.");
}

const res = [];
for await (const model of listCollections({
  limit: 10,
  accessToken: HF_TOKEN,
  search: {
    // owner: ["google", "quanghuynt14"],
    item: ["models/quanghuynt14/TestModel"],
  },
  sort: "lastModified",
})) {
  // console.log("My collection:", model);
  res.push(model);
}

// Save res to a JSON file
const outputPath = join(process.cwd(), "generated/collections1.json");
writeFileSync(outputPath, JSON.stringify(res, null, 2));
// console.log(`Collections saved to: ${outputPath}`);
