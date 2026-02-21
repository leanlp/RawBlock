import en from "../lib/i18n/en";
import es from "../lib/i18n/es";

let hasError = false;

// We use Record<string, unknown> here because we're structurally traversing unknown depths
function checkKeys(obj1: Record<string, unknown>, obj2: Record<string, unknown>, path: string = "") {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check that every key in EN exists in ES and matches the structure
    for (const key of keys1) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj2)) {
            console.error(`❌ Missing key in Spanish (ES) dictionary: ${fullPath}`);
            hasError = true;
        } else if (typeof obj1[key] === "object" && obj1[key] !== null && !Array.isArray(obj1[key])) {
            if (typeof obj2[key] !== "object" || obj2[key] === null || Array.isArray(obj2[key])) {
                console.error(`❌ Type mismatch in ES dictionary at ${fullPath}. Expected object.`);
                hasError = true;
            } else {
                checkKeys(obj1[key] as Record<string, unknown>, obj2[key] as Record<string, unknown>, fullPath); // recurse deeper
            }
        }
    }

    // Checking for extra keys in ES that don't exist in EN
    for (const key of keys2) {
        const fullPath = path ? `${path}.${key}` : key;
        if (!(key in obj1)) {
            console.error(`⚠️ Extra redundant key found in Spanish (ES) dictionary: ${fullPath}`);
            hasError = true;
        }
    }
}

console.log("Running i18n Structural Integrity Check...");
checkKeys(en, es);

if (hasError) {
    console.error("\\n❌ i18n Translation Integrity Test failed. Please fix the missing or extra keys.");
    process.exit(1);
} else {
    console.log("✅ All i18n keys match perfectly between English and Spanish!");
    process.exit(0);
}
