// Array of standard and vendor-prefixed CSS pseudo-classes and pseudo-elements
// Array of standard and vendor-prefixed CSS pseudo-classes and pseudo-elements
const allPseudos = [
    // Standard Pseudo-Classes
    'active',
    'any-link',
    'checked',
    'default',
    'defined',
    'disabled',
    'empty',
    'enabled',
    'first',
    'first-child',
    'first-of-type',
    'focus',
    'focus-visible',
    'focus-within',
    'fullscreen',
    'future',
    'hover',
    'indeterminate',
    'in-range',
    'invalid',
    'last-child',
    'last-of-type',
    'link',
    'not',
    'nth-child',
    'nth-last-child',
    'nth-last-of-type',
    'nth-of-type',
    'only-child',
    'only-of-type',
    'optional',
    'out-of-range',
    'past',
    'placeholder-shown',
    'read-only',
    'read-write',
    'required',
    'root',
    'scope',
    'target',
    'valid',
    'visited',

    // Standard Pseudo-Elements
    'after',
    'before',
    'cue',
    'first-letter',
    'first-line',
    'grammar-error',
    'marker',
    'placeholder',
    'selection',
    'backdrop',

    // Vendor-Prefixed Pseudo-Classes and Pseudo-Elements
    '-webkit-scrollbar',
    '-webkit-scrollbar-corner',
    '-webkit-scrollbar-thumb',
    '-webkit-scrollbar-track',
    '-webkit-scrollbar-track-hover',
    '-webkit-scrollbar-hover',
    '-webkit-details-marker',
    '-webkit-autofill',
    '-webkit-file-upload-button',
    '-webkit-inner-spin-button',
    '-webkit-outer-spin-button',
    '-webkit-resizer',
    '-webkit-calendar-picker-indicator',
    '-webkit-full-screen',
    // Add any additional pseudos you consider invalid
];



function mergeRanges(existingRanges, newRange) {
    // Combine existing ranges and the new range into one array
    let allRanges = existingRanges.concat([newRange]);

    // Collect all unique boundary points
    let boundaries = new Set();
    allRanges.forEach(range => {
        boundaries.add(range.media_min);
        boundaries.add(range.media_max);
    });
    let boundaryArray = Array.from(boundaries).sort((a, b) => a - b);

    // Create intervals between boundary points
    let intervals = [];
    for (let i = 0; i < boundaryArray.length - 1; i++) {
        intervals.push({
            media_min: boundaryArray[i],
            media_max: boundaryArray[i + 1],
        });
    }

    // Determine the applicable range for each interval
    let intervalRanges = intervals.map(interval => {
        // Find all ranges that cover this interval
        let coveringRanges = allRanges.filter(range => {
            return range.media_min < interval.media_max && range.media_max > interval.media_min;
        });

        if (coveringRanges.length === 0) {
            return null; // No range applies to this interval
        }

        // Determine which range has the highest precedence
        coveringRanges.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score; // Higher score takes precedence
            }
            return b.ruleIndex - a.ruleIndex; // If scores are equal, higher ruleIndex takes precedence
        });

        let topRange = coveringRanges[0];
        return {
            ...topRange,
            media_min: interval.media_min,
            media_max: interval.media_max,
        };
    }).filter(range => range !== null);

    // Merge adjacent intervals with the same properties
    let mergedRanges = [];
    for (let range of intervalRanges) {
        let lastRange = mergedRanges[mergedRanges.length - 1];
        if (lastRange &&
            lastRange.tailwind_classes.join(' ') === range.tailwind_classes.join(' ') &&
            lastRange.score === range.score &&
            lastRange.ruleIndex === range.ruleIndex &&
            lastRange.prop === range.prop) {
            // Extend the last range
            lastRange.media_max = range.media_max;
        } else {
            mergedRanges.push(range);
        }
    }

    return mergedRanges;
}

function getMediaPrefix(media_min, media_max) {
  // Define Tailwind breakpoints
  const breakpoints = [
    { name: 'sm', min: 640 },
    { name: 'md', min: 768 },
    { name: 'lg', min: 1024 },
    { name: 'xl', min: 1280 },
    { name: '2xl', min: 1536 },
  ];

  // Coerce media_min and media_max to numbers
  media_min = Number(media_min);
  media_max = Number(media_max);

  // Helper function to find breakpoint names by exact min value
  function findBreakpointByExactMin(value) {
    return breakpoints.find(bp => bp.min === value);
  }

  // Helper function to find breakpoint names for max values
  function findBreakpointByExactMax(value) {
    // In Tailwind, max breakpoints are defined as max-width of breakpoint.min - 0.02
    // For instance, max-sm is max-width: 639.98px (since sm is min-width: 640px)
    return breakpoints.find(bp => bp.min - 0.02 === value);
  }

  let minBreakpoint = findBreakpointByExactMin(media_min);
  let maxBreakpoint = findBreakpointByExactMax(media_max);

  if (minBreakpoint && !maxBreakpoint && media_max >= 9999) {
    // Only min breakpoint
    return minBreakpoint.name;
  } else if (!minBreakpoint && maxBreakpoint && media_min <= -1) {
    // Only max breakpoint
    return `max-${maxBreakpoint.name}`;
  } else if (minBreakpoint && maxBreakpoint) {
    // Both min and max breakpoints
    return `${minBreakpoint.name}:max-${maxBreakpoint.name}`;
  } else {
    // Custom sizes using arbitrary values
    if (media_min > -1 && media_max < 9999) {
      // Both min and max
      return `min-[${media_min}px]:max-[${media_max}px]`;
    } else if (media_min > -1 && media_max >= 9999) {
      // Only min
      return `min-[${media_min}px]`;
    } else if (media_min <= -1 && media_max < 9999) {
      // Only max
      return `max-[${media_max}px]`;
    } else {
      // No media query
      return '';
    }
  }
}



// Helper function to perform a deep copy
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Tailwind breakpoints
const tailwindBreakpoints = [640, 768, 1024, 1280, 1536];

// Function to get the closest Tailwind breakpoint
function getClosestTailwindBreakpoint(value, isMinWidth) {
  if (isMinWidth) {
    let breakpoint = tailwindBreakpoints.find(bp => bp >= value);
    return breakpoint !== undefined ? breakpoint : value;
  } else {
    let breakpoint = [...tailwindBreakpoints].reverse().find(bp => bp <= value);
    return breakpoint !== undefined ? breakpoint : value;
  }
}

function parseMediaQueryToTailwind(mediaQueryString, useTailwindBreakpoints = false) {
  if (!mediaQueryString || mediaQueryString.trim() === '') {
    const defaultResult = [{
      tailwind_classes: [],
      media_min: -1,
      media_max: 9999,
    }];
    return deepCopy(defaultResult);      
  }

  if (mediaQueryString.startsWith("@media")) {
    console.warn("mediaQueryString starts with '@media'. Stripping it for parsing.");
    mediaQueryString = mediaQueryString.replace(/^@media\s+/i, '').trim();
    //console.log("Stripped Input Query:", mediaQueryString);
  }  
  
  // Initialize cache for the mediaQueryString if it doesn't exist
  if (!existingQueryRanges[mediaQueryString]) {
    existingQueryRanges[mediaQueryString] = {};
  }

  // Check cache with useTailwindBreakpoints as part of the key
  if (existingQueryRanges[mediaQueryString][useTailwindBreakpoints]) {
    // Return a deep copy of the cached result
    return deepCopy(existingQueryRanges[mediaQueryString][useTailwindBreakpoints]);
  }

  const parsedQuery = MediaQueryParser.parseMediaQuery(mediaQueryString);

  // If media query string is empty or invalid, return default range
  if (!parsedQuery || parsedQuery['_errid'] === 'INVALID_QUERY') {
    //console.log("media query parser error: " + mediaQueryString);   
    const defaultResult = [{
      tailwind_classes: [],
      media_min: -1,
      media_max: 9999,
    }];
    // Save a deep copy to cache
    existingQueryRanges[mediaQueryString][useTailwindBreakpoints] = deepCopy(defaultResult);
    return deepCopy(defaultResult);
  }

  // Define the mapping from media features to Tailwind classes
  const featureToTailwindClass = {
    'prefers-color-scheme': {
      'dark': 'dark',
    },
    'prefers-reduced-motion': {
      'no-preference': 'motion-safe',
      'reduce': 'motion-reduce',
    },
    'prefers-contrast': {
      'more': 'contrast-more',
      'less': 'contrast-less',
    },
    'orientation': {
      'portrait': 'portrait',
      'landscape': 'landscape',
    },
    'hover': {
      'hover': 'hover',
    },
  };

  // Initialize variables to store the results
  let tailwindClasses = [];
  let media_min = null;
  let media_max = null;
  
  //console.log("parsedQuery");
  //console.log(parsedQuery);

  // Add 'print' if the media type is 'print'
  if (parsedQuery.type === 'print') {
    tailwindClasses.push('print');
  }

  // Recursively process the condition tree
  if (parsedQuery.condition) {
    processCondition(parsedQuery.condition);
  }

  // Recursive function to process conditions
  function processCondition(conditionNode) {
    if (conditionNode.op && conditionNode.nodes) {
      conditionNode.nodes.forEach(processNode);
    } else {
      processNode(conditionNode);
    }
  }

  // Process individual nodes
  function processNode(node) {
    if (node._t === 'in-parens') {
      processInParens(node.node);
    } else if (node._t === 'condition') {
      processCondition(node);
    }
  }

  // Process nodes inside parentheses
  function processInParens(node) {
    if (node._t === 'feature') {
      processFeature(node);
    } else if (node._t === 'condition') {
      processCondition(node);
    }
  }

  // Helper function to convert units to pixels
  function convertToPx(valueNode) {
    if (!valueNode) {
      return null;
    }
    const value = valueNode.value;
    const unit = valueNode.unit;
    if (value === undefined || value === null) {
      return null;
    }
    if (!unit) {
      if (valueNode._t === 'number') {
        // Assume pixels if unit is not specified
        return parseFloat(value);
      } else {
        // Unknown unit, cannot convert
        return null;
      }
    }
    if (unit === 'px') {
      return parseFloat(value);
    } else if (unit === 'rem') {
      return parseFloat(value) * 16; // Assuming root font size is 16px
    } else if (unit === 'em') {
      return parseFloat(value) * 16; // Assuming font size is 16px
    } else {
      // Unknown unit
      return null;
    }
  }

  // Map media features to Tailwind classes and extract min/max widths
  function processFeature(featureNode) {
    const feature = featureNode.feature;
    const valueInPx = convertToPx(featureNode.value);

    if (valueInPx === null || valueInPx === undefined) {
      // Unknown unit or value, skip this feature
      return;
    }

    if (feature === 'min-width') {
      media_min = (media_min !== null) ? Math.max(media_min, valueInPx) : valueInPx;
    } else if (feature === 'max-width') {
      media_max = (media_max !== null) ? Math.min(media_max, valueInPx) : valueInPx;
    } else if (feature === 'min-device-width') {
      media_min = (media_min !== null) ? Math.max(media_min, valueInPx) : valueInPx;
    } else if (feature === 'max-device-width') {
      media_max = (media_max !== null) ? Math.min(media_max, valueInPx) : valueInPx;
    } else if (feature === 'width' && featureNode.context === 'range' && featureNode.op) {
      if (featureNode.op === '>=') {
        media_min = (media_min !== null) ? Math.max(media_min, valueInPx) : valueInPx;
        //too small
        media_min = media_min <= 200 ? null : media_min;
        
      } else if (featureNode.op === '<=') {
        media_max = (media_max !== null) ? Math.min(media_max, valueInPx) : valueInPx;
      } else if (featureNode.op === '>') {
        media_min = (media_min !== null) ? Math.max(media_min, valueInPx + 1) : valueInPx + 1;
        media_min = media_min <= 200 ? null : media_min;
        
      } else if (featureNode.op === '<') {
        media_max = (media_max !== null) ? Math.min(media_max, valueInPx - 1) : valueInPx - 1;
      }
    } else if (featureToTailwindClass[feature]) {
      const value = featureNode.value && featureNode.value.value;
      const tailwindClass = featureToTailwindClass[feature][value];
      if (tailwindClass) {
        tailwindClasses.push(tailwindClass);
      }
    }
  }

  // Adjust media_min and media_max to the closest Tailwind breakpoints if required
  if (useTailwindBreakpoints) {
    if (media_min !== null) {
      media_min = getClosestTailwindBreakpoint(media_min, true);
    }
    if (media_max !== null) {
      media_max = getClosestTailwindBreakpoint(media_max, false);
    }
  }

  // Set default values if media_min or media_max are not set
  if (media_min === null) {
    media_min = -1;
  }
  if (media_max === null) {
    media_max = 9999;
  }
  
  function invertRange(media_min, media_max) {
    const ranges = [];
    const MIN_VALUE = -1;
    const MAX_VALUE = 9999;

    if (media_min === MIN_VALUE && media_max === MAX_VALUE) {
      // The original range covers everything; the inverted range is empty
      return [];
    }
    if (media_min > MIN_VALUE) {
      ranges.push({ media_min: MIN_VALUE, media_max: media_min - 1 });
    }
    if (media_max < MAX_VALUE) {
      ranges.push({ media_min: media_max + 1, media_max: MAX_VALUE });
    }
    return ranges;
  }  

  // Construct the result object
  let result;
  if (parsedQuery.prefix === 'not') {
    //console.log("NOT REANGE " + mediaQueryString);
    result = [];
    const invertedRanges = invertRange(media_min, media_max);
    invertedRanges.forEach(range => {
      result.push({
        tailwind_classes: tailwindClasses,
        media_min: range.media_min,
        media_max: range.media_max,
      });
    });
  } else {
    // Construct the result object
    result = [{
      tailwind_classes: tailwindClasses,
      media_min: media_min,
      media_max: media_max,
    }];
  }

  // Save a deep copy of the result to the cache
  existingQueryRanges[mediaQueryString][useTailwindBreakpoints] = deepCopy(result);

  // Return a deep copy of the result
  return deepCopy(result);
}

function resolveCssVariableValue(varName, elementLabels, cssvarDefinedArr, cssVarMap, seenVars = new Set(), depth = 0) {
    const indent = "  ".repeat(depth);
    const fullVarName = varName.startsWith('--') ? varName : '--' + varName;

    //console.log(indent + "Resolving variable:", fullVarName);

    // Prevent infinite recursion
    if (seenVars.has(fullVarName)) {
        //console.log(indent + `Circular reference detected for variable ${fullVarName}`);
        return [];
    }
    seenVars.add(fullVarName);

    const definitions = cssvarDefinedArr[fullVarName];
    //console.log(indent + "Definitions for " + fullVarName + ":", definitions);
    if (!definitions || definitions.length === 0) {
        //console.log(indent + `No definitions found for ${fullVarName}`);
        return [];
    }

    // Assign specificity scores based on elementLabels
    const specificityMap = {};
    //console.log(indent + "Element labels:", elementLabels);
    elementLabels.forEach((label, index) => {
        specificityMap[label] = elementLabels.length - index; // Higher index means closer ancestor
    });

    // Global scope variables have low specificity (overridden by element-scoped variables)
    // But higher than completely undefined
    specificityMap['__global__'] = 0.5;  // Global scope from stylesheets
    specificityMap['html'] = 0;
    specificityMap['body'] = 0;
    specificityMap[':root'] = 0;
    //console.log(indent + "Specificity map:", specificityMap);

    // Process each definition to create ranges
    let ranges = [];
    definitions.forEach((def, ruleIndex) => {
        const { label, value, media, selector } = def;
        // Use typeof check to handle specificity of 0
        let specificity = (typeof specificityMap[label] !== 'undefined') ? specificityMap[label] : -1;

        // Special handling: if label is __global__, use the selector's specificity
        if (label === '__global__' && selector) {
            if (selector === ':root' || selector.indexOf(':root') >= 0) {
                specificity = 0.5; // :root has higher priority in global scope
            } else if (selector === '*') {
                specificity = 0.1; // * has lowest priority
            } else {
                specificity = 0.5; // Other global selectors (html, body)
            }
        }

        //console.log(indent + "Processing definition:", def);
        //console.log(indent + "Specificity for label " + label + ": " + specificity);
        if (specificity === -1) {
            // Definition doesn't apply to the current element - skip it
            //console.log(indent + "Definition doesn't apply to current element - skipping");
            return;  // Skip this definition
        }

        // Parse media query to get media_min and media_max
        const mediaRanges = parseMediaQueryToTailwind(media);
        //console.log(indent + "Media ranges:", mediaRanges);
        mediaRanges.forEach(mediaRange => {
            const { media_min, media_max } = mediaRange;
            ranges.push({
                value,
                media_min,
                media_max,
                specificity,
                ruleIndex: ruleIndex, // Use positive ruleIndex
            });
        });
    });

    //console.log(indent + "Ranges after processing definitions:", ranges);

    if (ranges.length === 0) {
        //console.log(indent + `No applicable definitions for ${fullVarName}`);
        return [];
    }

    // Sort ranges based on specificity and rule index
    ranges.sort((a, b) => {
        if (a.specificity !== b.specificity) return b.specificity - a.specificity;
        if (a.ruleIndex !== b.ruleIndex) return b.ruleIndex - a.ruleIndex; // Higher ruleIndex overrides
        return 0;
    });

    // Merge overlapping ranges and resolve variable references
    let resolvedRanges = [];
    for (let range of ranges) {
        // Resolve variable references in the value
        const resolvedValue = resolveValue(range.value, elementLabels, cssvarDefinedArr, cssVarMap, seenVars, depth + 1);
        resolvedRanges = mergeRangesVariables(resolvedRanges, {
            concrete_value: resolvedValue,
            media_min: range.media_min,
            media_max: range.media_max,
            specificity: range.specificity,
            ruleIndex: range.ruleIndex,
        });
    }

    // Remove the variable from seenVars to allow other branches to resolve it independently
    seenVars.delete(fullVarName);

    //console.log(indent + `Resolved ranges for ${fullVarName}:`, resolvedRanges);
    return resolvedRanges;
}



/**
 * Parses a var() function call with proper parenthesis matching
 * @param {string} str - The string starting with 'var('
 * @param {number} startIndex - Index where 'var(' starts
 * @returns {object} - {varName, defaultValue, endIndex, fullMatch} or null if invalid
 */
function parseVarFunctionHelper(str, startIndex) {
    // Must start with 'var('
    if (!str.substring(startIndex).startsWith('var(')) {
        return null;
    }

    let i = startIndex + 4; // Skip 'var('
    let parenCount = 1;
    let varName = '';
    let defaultValue = null;
    let inVarName = true;
    let buffer = '';

    while (i < str.length && parenCount > 0) {
        const char = str[i];

        if (char === '(') {
            parenCount++;
            buffer += char;
        } else if (char === ')') {
            parenCount--;
            if (parenCount > 0) {
                buffer += char;
            }
        } else if (char === ',' && parenCount === 1 && inVarName) {
            // Found the comma separating var name from default value
            varName = buffer.trim();
            buffer = '';
            inVarName = false;
        } else {
            buffer += char;
        }

        i++;
    }

    // If we exited because parenCount === 0, we found the matching closing paren
    if (parenCount === 0) {
        if (inVarName) {
            varName = buffer.trim();
        } else {
            defaultValue = buffer.trim();
        }

        // varName should start with --
        if (!varName.startsWith('--')) {
            return null;
        }

        return {
            varName: varName,
            defaultValue: defaultValue,
            endIndex: i,
            fullMatch: str.substring(startIndex, i)
        };
    }

    // Unmatched parentheses
    return null;
}

function resolveValue(value, elementLabels, cssvarDefinedArr, cssVarMap, seenVars, depth) {
    let result = value;
    let i = 0;
    const replacements = []; // Array of {start, end, replacement}

    // Find all var() occurrences using proper parenthesis matching
    while (i < result.length) {
        const varIndex = result.indexOf('var(', i);
        if (varIndex === -1) {
            break;
        }

        const parsed = parseVarFunctionHelper(result, varIndex);
        if (!parsed) {
            // Invalid var() syntax, skip this one
            i = varIndex + 4;
            continue;
        }

        const { varName, defaultValue, endIndex, fullMatch } = parsed;

        // Remove the -- prefix for lookup (function expects it without --)
        const innerVarName = varName.startsWith('--') ? varName.substring(2) : varName;

        // Try to resolve the variable
        const resolvedRanges = resolveCssVariableValue(innerVarName, elementLabels, cssvarDefinedArr, cssVarMap, seenVars, depth);
        let resolvedValue = rangesToValue(resolvedRanges);

        // If resolution failed and we have a default value, use it
        if (resolvedValue === '' && defaultValue !== null) {
            // Recursively resolve the default value (it might contain nested var())
            resolvedValue = resolveValue(defaultValue, elementLabels, cssvarDefinedArr, cssVarMap, seenVars, depth);
        }

        // Store replacement
        replacements.push({
            start: varIndex,
            end: endIndex,
            replacement: resolvedValue
        });

        i = endIndex;
    }

    // Apply replacements in reverse order to maintain correct indices
    for (let j = replacements.length - 1; j >= 0; j--) {
        const { start, end, replacement } = replacements[j];
        result = result.substring(0, start) + replacement + result.substring(end);
    }

    return result;
}

function rangesToValue(ranges) {
    if (ranges.length === 0) return '';
    if (ranges.length === 1) return ranges[0].concrete_value;

    // Filter ranges that cover the default media range
    const defaultMediaMin = -1;
    const defaultMediaMax = 9999;
    let applicableRanges = ranges.filter(range => range.media_min <= defaultMediaMin && range.media_max >= defaultMediaMax);

    if (applicableRanges.length === 0) {
        // No ranges cover the default media range, pick ranges with the largest media range
        const maxMediaRange = Math.max(...ranges.map(r => r.media_max - r.media_min));
        applicableRanges = ranges.filter(r => (r.media_max - r.media_min) === maxMediaRange);
    }

    // Now sort the ranges
    applicableRanges.sort((a, b) => {
        if (a.specificity !== b.specificity) return b.specificity - a.specificity;
        if (a.ruleIndex !== b.ruleIndex) return b.ruleIndex - a.ruleIndex; // Higher ruleIndex overrides
        return 0;
    });

    return applicableRanges[0].concrete_value;
}


function mergeRangesVariables(existingRanges, newRange) {
    existingRanges.push(newRange);
    // Merge overlapping ranges with the same value
    existingRanges.sort((a, b) => a.media_min - b.media_min);
    let merged = [];
    for (let range of existingRanges) {
        if (merged.length === 0) {
            merged.push(range);
        } else {
            let last = merged[merged.length - 1];
            if (last.concrete_value === range.concrete_value && last.media_max >= range.media_min) {
                last.media_max = Math.max(last.media_max, range.media_max);
            } else {
                merged.push(range);
            }
        }
    }
    return merged;
}

var getPseudos = function (cssSelector) {
    // Define valid Tailwind pseudo-selectors (without colons)
    const validPseudos = [
        'hover', 'focus', 'focus-within', 'focus-visible', 'active',
        'visited', 'target', 'first', 'last', 'only', 'odd', 'even',
        'first-of-type', 'last-of-type', 'only-of-type', 'empty',
        'disabled', 'enabled', 'checked', 'indeterminate', 'default',
        'required', 'valid', 'invalid', 'in-range', 'out-of-range',
        'placeholder-shown', 'autofill', 'read-only', 'before', 'after',
        'placeholder', 'file', 'marker', 'selection', 'first-line',
        'first-letter', 'dark', 'print', 'portrait', 'landscape'
    ];

    // Parse the selector into an AST using Parsel
    let ast;
    try {
        ast = parsel.parse(cssSelector);
    } catch (error) {
        console.error('Error parsing CSS selector:', error);
        return [];
    }

    // Helper function to recursively traverse the AST and check for 'hover'
    const containsHover = (node) => {
        if (!node) return false;

        // Check current node's list for 'hover' pseudo-class
        if (node.list && Array.isArray(node.list)) {
            for (let token of node.list) {
                if (
                    (token.type === "pseudo-class" || token.type === "pseudo-element") &&
                    token.name === 'hover'
                ) {
                    return true;
                }
            }
        }

        // Recursively check left and right nodes if they exist
        if (node.left && containsHover(node.left)) {
            return true;
        }
        if (node.right && containsHover(node.right)) {
            return true;
        }

        return false;
    };

    // Determine if 'hover' exists anywhere in the AST
    const hoverExists = containsHover(ast);

    // Helper function to get the rightmost compound node
    const getRightmostNode = (node) => {
        if (node.type === "complex" && node.right) {
            return getRightmostNode(node.right);
        }
        return node;
    };

    // Get the rightmost node (corresponding to the last element in the selector)
    const rightmostNode = getRightmostNode(ast);

    // Extract pseudo-selectors from the rightmost node
    let pseudos = (rightmostNode.list || [])
        .filter(token => 
            (token.type === "pseudo-class" || token.type === "pseudo-element") &&
            validPseudos.includes(token.name)
        )
        .map(token => token.name);
    
    // Remove any potential duplicates by converting to a Set and back to an array
    pseudos = Array.from(new Set(pseudos));

    // Sort the pseudos alphabetically in ascending order
    pseudos.sort((a, b) => a.localeCompare(b));
    
    // If 'hover' exists anywhere and isn't already in the pseudos array, add it
    if (hoverExists && !pseudos.includes('hover')) {
        pseudos.push('hover');
    }
    
    return pseudos;
};

/**
 * Checks if the given CSS selector contains any pseudo-selectors from the allPseudos array.
 * @param {string} selector - The CSS selector string to check.
 * @returns {boolean} - Returns true if any pseudo-selector is found, false otherwise.
 */
function containsPseudo(selector) {
    // If there's no colon, there are no pseudo-selectors
    if (!selector.includes(':')) {
        return false;
    }

    // Iterate through all known pseudo-selectors
    for (let pseudo of allPseudos) {
        // Construct both single and double colon versions
        const singleColon = `:${pseudo}`;
        const doubleColon = `::${pseudo}`;

        // Search for single colon pseudo
        let pos = selector.indexOf(singleColon);
        while (pos !== -1) {
            // Check if the colon is not escaped
            if (pos === 0 || selector[pos - 1] !== '\\') {
                return true;
            }
            // Look for the next occurrence
            pos = selector.indexOf(singleColon, pos + 1);
        }

        // Search for double colon pseudo
        pos = selector.indexOf(doubleColon);
        while (pos !== -1) {
            // Check if the colon is not escaped
            if (pos === 0 || selector[pos - 1] !== '\\') {
                return true;
            }
            // Look for the next occurrence
            pos = selector.indexOf(doubleColon, pos + 1);
        }
    }

    // No pseudo-selectors found
    return false;
}

function hasInvalidPseudos(selector) {
  const invalidPseudos = [
        'backdrop',
        '-webkit-scrollbar',
        'selection',
        '-webkit-scrollbar-thumb',
        '-webkit-scrollbar-track',
        '-webkit-scrollbar:hover',
        '-webkit-scrollbar-track:hover',
        'placeholder',
        'marker',
        'spelling-error',
        '::grammar-error',
        '-webkit-file-upload-button',
        '-webkit-inner-spin-button',
        '-webkit-outer-spin-button',
        '-webkit-resizer',
        '-webkit-calendar-picker-indicator',
        '-webkit-details-marker',
        '-webkit-scrollbar-corner',
        'cue',
        '-webkit-autofill',
        '-webkit-full-screen'
    ];
    
    // Iterate through all invalid pseudo-selectors
    for (let pseudo of invalidPseudos) {
        // Construct both single and double colon versions
        const singleColon = `:${pseudo}`;
        const doubleColon = `::${pseudo}`;

        // Search for single colon pseudo
        let pos = selector.indexOf(singleColon);
        while (pos !== -1) {
            // Check if the colon is not escaped
            if (pos === 0 || selector[pos - 1] !== '\\') {
                return true; // Invalid pseudo found
            }
            // Look for the next occurrence
            pos = selector.indexOf(singleColon, pos + 1);
        }

        // Search for double colon pseudo
        pos = selector.indexOf(doubleColon);
        while (pos !== -1) {
            // Check if the colon is not escaped
            if (pos === 0 || selector[pos - 1] !== '\\') {
                return true; // Invalid pseudo found
            }
            // Look for the next occurrence
            pos = selector.indexOf(doubleColon, pos + 1);
        }
    }

    // No invalid pseudos found
    return false;
}

function stripPseudos(cssSelector) {
    // Tokenize the selector
    let tokens = parsel.tokenize(cssSelector);
    
    // Filter out pseudo-classes and pseudo-elements
    tokens = tokens.filter(token => 
        token.type !== 'pseudo-class' && 
        token.type !== 'pseudo-element'
    );
    
    // Rebuild the selector
    return parsel.stringify(tokens);
}


function parseStyleAttribute(styleAttr) {
  const declarations = [];
  let buffer = '';
  let inQuotes = false;
  let quoteChar = '';
  let prop = '';
  let val = '';
  let expecting = 'property';

  for (let i = 0; i < styleAttr.length; i++) {
    const char = styleAttr[i];

    if (inQuotes) {
      if (char === quoteChar) {
        inQuotes = false;
      }
      buffer += char;
    } else {
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
        buffer += char;
      } else if (char === ':' && expecting === 'property') {
        prop = buffer.trim();
        buffer = '';
        expecting = 'value';
      } else if (char === ';' && expecting === 'value') {
        val = buffer.trim();
        buffer = '';
        declarations.push({ property: prop, value: val });
        expecting = 'property';
      } else {
        buffer += char;
      }
    }
  }

  // Add the last declaration if there's no trailing semicolon
  if (buffer.trim() !== '') {
    val = buffer.trim();
    declarations.push({ property: prop, value: val });
  }

  return declarations;
}

