/**
 * Pseudo-Selector Processing Utilities
 *
 * Handles validation and processing of CSS pseudo-selectors
 * for WordPress theme.json element and block styles.
 */

import { VALID_PSEUDO_SELECTORS, ValidPseudoSelector } from "../types/theme-json";

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

export interface PseudoSelectorData {
  selector: ValidPseudoSelector;
  styles: Record<string, any>;
}

/**
 * Validates a pseudo-selector string
 * @param selector The selector to validate (e.g., ":hover")
 * @returns ValidationResult with isValid flag and any warnings
 */
export function validatePseudoSelector(selector: string): ValidationResult {
  const normalized = selector.toLowerCase();
  const isValid = VALID_PSEUDO_SELECTORS.includes(normalized as ValidPseudoSelector);

  return {
    isValid,
    warnings: isValid
      ? []
      : [`Unknown pseudo-selector "${selector}". Valid selectors: ${VALID_PSEUDO_SELECTORS.join(", ")}`],
  };
}

/**
 * Checks if a key is a pseudo-selector (starts with ":")
 * @param key The key to check
 * @returns true if the key starts with ":"
 */
export function isPseudoSelectorKey(key: string): boolean {
  return key.startsWith(":");
}

/**
 * Extracts pseudo-selectors from an object's keys
 * @param obj The object to extract pseudo-selectors from
 * @returns Object containing { pseudoSelectors, otherKeys }
 */
export function extractPseudoSelectors(
  obj: Record<string, any>
): { pseudoSelectors: Record<string, any>; otherKeys: Record<string, any> } {
  const pseudoSelectors: Record<string, any> = {};
  const otherKeys: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPseudoSelectorKey(key)) {
      pseudoSelectors[key] = value;
    } else {
      otherKeys[key] = value;
    }
  }

  return { pseudoSelectors, otherKeys };
}

/**
 * Validates all pseudo-selectors in an object
 * @param obj The object containing potential pseudo-selector keys
 * @returns Array of warning messages for invalid selectors
 */
export function validatePseudoSelectorsInObject(obj: Record<string, any>): string[] {
  const warnings: string[] = [];

  for (const key of Object.keys(obj)) {
    if (isPseudoSelectorKey(key)) {
      const result = validatePseudoSelector(key);
      warnings.push(...result.warnings);
    }
  }

  return warnings;
}

/**
 * Processes an object recursively to validate all pseudo-selectors
 * and collect warnings without modifying the data
 * @param obj The object to process
 * @param path Current path for error messages
 * @returns Array of warning messages
 */
export function validatePseudoSelectorsDeep(
  obj: Record<string, any>,
  path: string = ""
): string[] {
  const warnings: string[] = [];

  if (!obj || typeof obj !== "object") {
    return warnings;
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (isPseudoSelectorKey(key)) {
      const result = validatePseudoSelector(key);
      if (!result.isValid) {
        warnings.push(`At "${currentPath}": ${result.warnings.join(", ")}`);
      }
    }

    // Recurse into nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      warnings.push(...validatePseudoSelectorsDeep(value, currentPath));
    }
  }

  return warnings;
}

/**
 * Normalizes pseudo-selector keys to lowercase
 * @param obj The object with potential pseudo-selector keys
 * @returns New object with normalized pseudo-selector keys
 */
export function normalizePseudoSelectorKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = isPseudoSelectorKey(key) ? key.toLowerCase() : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[normalizedKey] = normalizePseudoSelectorKeys(value);
    } else {
      result[normalizedKey] = value;
    }
  }

  return result;
}

/**
 * Gets element-specific allowed pseudo-selectors
 * Link elements support :visited and :link, others don't
 * @param elementName The element name
 * @returns Array of allowed pseudo-selectors for this element
 */
export function getAllowedPseudoSelectorsForElement(
  elementName: string
): readonly string[] {
  const basePseudoSelectors = [":hover", ":focus", ":active"] as const;
  const linkPseudoSelectors = [":visited", ":link"] as const;

  if (elementName.toLowerCase() === "link") {
    return [...basePseudoSelectors, ...linkPseudoSelectors];
  }

  return basePseudoSelectors;
}

/**
 * Validates pseudo-selectors for a specific element
 * @param elementName The element name
 * @param pseudoSelectors Object containing pseudo-selector keys
 * @returns Array of warning messages
 */
export function validatePseudoSelectorsForElement(
  elementName: string,
  pseudoSelectors: Record<string, any>
): string[] {
  const warnings: string[] = [];
  const allowed = getAllowedPseudoSelectorsForElement(elementName);

  for (const key of Object.keys(pseudoSelectors)) {
    if (isPseudoSelectorKey(key)) {
      const normalized = key.toLowerCase();
      if (!allowed.includes(normalized as any)) {
        warnings.push(
          `Pseudo-selector "${key}" is not supported for element "${elementName}". ` +
          `Allowed: ${allowed.join(", ")}`
        );
      }
    }
  }

  return warnings;
}
