import fs from "fs";
import path from "path";

// Define paths relative to this script
const backendDir = path.resolve(import.meta.dir, ".."); // apps/backend
const modelsDir = path.resolve(
  backendDir,
  "../frontend-ionic/src/assets/models",
);
const seedFile = path.resolve(backendDir, "src/db/seed-decorations.ts");

async function main() {
  console.log("Syncing decorations from models directory...");
  if (!fs.existsSync(modelsDir)) {
    console.error(`Models directory not found: ${modelsDir}`);
    process.exit(1);
  }

  const modelFiles = fs
    .readdirSync(modelsDir)
    .filter((f) => f.toLowerCase().endsWith(".glb"));
  let seedContent = fs.readFileSync(seedFile, "utf-8");

  // Extract existing names using regex to avoid importing database code
  const existingNames = new Set<string>();
  const nameRegex = /name:\s*"([^"]+)"/g;
  let match;
  while ((match = nameRegex.exec(seedContent)) !== null) {
    existingNames.add(match[1]);
  }

  // Find where the array ends
  // We look for the closing bracket of the decorations array.
  // Assuming the array is defined as `const decorations = [ ... ];`
  const arrayEndIndex = seedContent.lastIndexOf("];");
  if (arrayEndIndex === -1) {
    console.error("Could not find end of decorations array in seed file.");
    process.exit(1);
  }

  const newEntries: string[] = [];

  for (const file of modelFiles) {
    const name = path.basename(file, path.extname(file)); // e.g., "Bicycle" from "Bicycle.glb"

    if (!existingNames.has(name)) {
      // Create new entry with default values as requested
      const entry = `  {
    name: "${name}",
    description: "",
    modelUrl: "/assets/models/${file}",
    category: "",
    isPremium: false,
    priceTokens: 0,
    defaultScale: 0.5,
    floorOnly: true,
    wallMountable: false,
  },`;
      newEntries.push(entry);
      console.log(`  [+] Adding new decoration: ${name}`);
    } else {
      console.log(`  [=] Skipping existing decoration: ${name}`);
    }
  }

  if (newEntries.length > 0) {
    // Insert before the closing bracket
    const insertionPoint = arrayEndIndex;
    // Ensure we handle the comma effectively if the last item doesn't have one,
    // but in JS array syntax trailing commas are fine or if previous had one.
    // To be safe, we adding a newline

    // Check if the character before '];' is a comma or whitespace
    // Simplest is to just prepend to the end.

    const updatedContent =
      seedContent.slice(0, insertionPoint) +
      newEntries.join("\n") +
      "\n" +
      seedContent.slice(insertionPoint);
    fs.writeFileSync(seedFile, updatedContent, "utf-8");
    console.log(
      `Successfully updated seed-decorations.ts with ${newEntries.length} new entries.`,
    );
  } else {
    console.log("No new decorations found to add.");
  }
}

// Run the script
if (import.meta.main) {
  main().catch(console.error);
}
