// import dotenv from "dotenv";
// import {
//   deleteCollection,
//   whoAmI,
// } from "../../huggingface.js/packages/hub/dist/index.js";

// dotenv.config();

// const HF_TOKEN = process.env.HF_TOKEN;

// if (!HF_TOKEN) {
//   throw new Error("HF_TOKEN is not set in the environment variables.");
// }

// export const TEST_HUB_URL = "https://hub-ci.huggingface.co";
// export const TEST_USER = "hub.js";
// export const TEST_ACCESS_TOKEN = "hf_hub.js";
// export const TEST_COOKIE = "huggingface-hub.js-cookie";

// const user = await whoAmI({
//   hubUrl: TEST_HUB_URL,
//   accessToken: TEST_ACCESS_TOKEN,
// });

// console.log("User information:", user);

// await deleteCollection({
//   collectionSlug: "hub.js/test-collection-68648904d6d47f75ddcc02ea",
//   accessToken: TEST_ACCESS_TOKEN,
//   hubUrl: TEST_HUB_URL,
// });
