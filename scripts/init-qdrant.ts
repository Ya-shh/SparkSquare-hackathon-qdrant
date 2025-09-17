import { initQdrantCollections } from "../src/lib/qdrant";

async function main() {
  console.log("Initializing Qdrant collections...");
  const ok = await initQdrantCollections();
  if (!ok) {
    console.error("Failed to initialize Qdrant collections");
    process.exit(1);
  }
  console.log("Qdrant collections are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});






