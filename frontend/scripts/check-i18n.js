/**
 * Distribution Academy - i18n Translation Parity Checker
 * Validates that all 8 official locales (es, en, fr, de, pt, pl, ro, bg)
 * have 100% key parity with no missing or orphaned translations.
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'pl', 'ro', 'bg'];
const BASE_LOCALE = 'es';
const LOCALES_DIR = path.resolve(__dirname, '../public/locales');

function getLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

console.log('🌐 Distribution Academy - Checking i18n Locales Parity...');
console.log(`📁 Locales directory: ${LOCALES_DIR}`);

const keysPerLocale = {};
let hasErrors = false;

for (const locale of LOCALES) {
  const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing locale file for '${locale}': ${filePath}`);
    hasErrors = true;
    continue;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const leafKeys = getLeafKeys(content);
    keysPerLocale[locale] = new Set(leafKeys);
    console.log(`  ✓ [${locale}] Loaded ${leafKeys.length} translation keys`);
  } catch (err) {
    console.error(`❌ Error parsing JSON for '${locale}':`, err.message);
    hasErrors = true;
  }
}

if (hasErrors || !keysPerLocale[BASE_LOCALE]) {
  console.error('\n🚨 Translation validation aborted due to load errors.');
  process.exit(1);
}

const baseKeys = keysPerLocale[BASE_LOCALE];
let parityFailure = false;

for (const locale of LOCALES) {
  if (locale === BASE_LOCALE) continue;

  const currentKeys = keysPerLocale[locale];
  const missing = [...baseKeys].filter((k) => !currentKeys.has(k));
  const extra = [...currentKeys].filter((k) => !baseKeys.has(k));

  if (missing.length > 0 || extra.length > 0) {
    parityFailure = true;
    console.error(`\n❌ [${locale}] Discrepancy detected vs base locale [${BASE_LOCALE}]:`);
    if (missing.length > 0) {
      console.error(`   - Missing ${missing.length} keys:`);
      missing.slice(0, 10).forEach((k) => console.error(`       • ${k}`));
      if (missing.length > 10) console.error(`       ... and ${missing.length - 10} more`);
    }
    if (extra.length > 0) {
      console.error(`   - Extra ${extra.length} keys:`);
      extra.slice(0, 10).forEach((k) => console.error(`       • ${k}`));
      if (extra.length > 10) console.error(`       ... and ${extra.length - 10} more`);
    }
  }
}

if (parityFailure) {
  console.error('\n🚨 i18n parity validation FAILED. All locales must have matching keys.');
  process.exit(1);
}

console.log(`\n🎉 Success: All ${LOCALES.length} locales are in 100% parity (${baseKeys.size} keys each).`);
process.exit(0);

