

// Helper function to handle width and height properties
// Helper function to handle width and height properties
function handleSize(dimension, sizeType) {
    // Define the prefix based on sizeType
    const prefix = sizeType === 'min' ? `min-${dimension}` :
                   sizeType === 'max' ? `max-${dimension}` :
                   dimension;

    // Predefined sizes for 'width' and 'height' (sizeType 'none')
    const predefinedSizesNone = {
        // Fractional sizes
        '1/2': `${prefix}-1/2`,
        '1/3': `${prefix}-1/3`,
        '2/3': `${prefix}-2/3`,
        '1/4': `${prefix}-1/4`,
        '2/4': `${prefix}-1/2`,
        '3/4': `${prefix}-3/4`,
        '1/5': `${prefix}-1/5`,
        '2/5': `${prefix}-2/5`,
        '3/5': `${prefix}-3/5`,
        '4/5': `${prefix}-4/5`,
        '1/6': `${prefix}-1/6`,
        '2/6': `${prefix}-1/3`,
        '3/6': `${prefix}-1/2`,
        '4/6': `${prefix}-2/3`,
        '5/6': `${prefix}-5/6`,
        '1/12': `${prefix}-1/12`,
        '2/12': `${prefix}-1/6`,
        '3/12': `${prefix}-1/4`,
        '4/12': `${prefix}-1/3`,
        '5/12': `${prefix}-5/12`,
        '6/12': `${prefix}-1/2`,
        '7/12': `${prefix}-7/12`,
        '8/12': `${prefix}-2/3`,
        '9/12': `${prefix}-3/4`,
        '10/12': `${prefix}-5/6`,
        '11/12': `${prefix}-11/12`,
        // Percentage mappings
        '50%': `${prefix}-1/2`,
        '33.333333%': `${prefix}-1/3`,
        '66.666667%': `${prefix}-2/3`,
        '25%': `${prefix}-1/4`,
        '75%': `${prefix}-3/4`,
        '20%': `${prefix}-1/5`,
        '40%': `${prefix}-2/5`,
        '60%': `${prefix}-3/5`,
        '80%': `${prefix}-4/5`,
        '16.666667%': `${prefix}-1/6`,
        '83.333333%': `${prefix}-5/6`,
        // Tailwind spacing scale
        '0': `${prefix}-0`,
        '1': `${prefix}-1`,
        '2': `${prefix}-2`,
        '3': `${prefix}-3`,
        '4': `${prefix}-4`,
        '5': `${prefix}-5`,
        '6': `${prefix}-6`,
        '8': `${prefix}-8`,
        '10': `${prefix}-10`,
        '12': `${prefix}-12`,
        '14': `${prefix}-14`,
        '16': `${prefix}-16`,
        '20': `${prefix}-20`,
        '24': `${prefix}-24`,
        '28': `${prefix}-28`,
        '32': `${prefix}-32`,
        '36': `${prefix}-36`,
        '40': `${prefix}-40`,
        '44': `${prefix}-44`,
        '48': `${prefix}-48`,
        '52': `${prefix}-52`,
        '56': `${prefix}-56`,
        '60': `${prefix}-60`,
        '64': `${prefix}-64`,
        '72': `${prefix}-72`,
        '80': `${prefix}-80`,
        '96': `${prefix}-96`,
        // Common sizes
        'auto': `${prefix}-auto`,
        'px': `${prefix}-px`,
        'full': `${prefix}-full`,
        'screen': `${prefix}-screen`,
        'min': `${prefix}-min`,
        'max': `${prefix}-max`,
        'fit': `${prefix}-fit`,
    };

    // Predefined sizes for 'min' and 'max' sizeTypes
    const predefinedSizesMinMax = {
        // Tailwind supports only specific classes for min/max widths/heights
        '0': `${prefix}-0`,
        'full': `${prefix}-full`,
        'min': `${prefix}-min`,
        'max': `${prefix}-max`,
        'fit': `${prefix}-fit`,
        'screen': sizeType === 'min' ? `${prefix}-screen` : undefined, // 'min-h-screen' exists
        // For 'max-w', Tailwind has specific sizes
        'none': sizeType === 'max' ? `${prefix}-none` : undefined,
        'xs': sizeType === 'max' && dimension === 'w' ? `${prefix}-xs` : undefined,
        'sm': sizeType === 'max' && dimension === 'w' ? `${prefix}-sm` : undefined,
        'md': sizeType === 'max' && dimension === 'w' ? `${prefix}-md` : undefined,
        'lg': sizeType === 'max' && dimension === 'w' ? `${prefix}-lg` : undefined,
        'xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-xl` : undefined,
        '2xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-2xl` : undefined,
        '3xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-3xl` : undefined,
        '4xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-4xl` : undefined,
        '5xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-5xl` : undefined,
        '6xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-6xl` : undefined,
        '7xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-7xl` : undefined,
        // Screen sizes
        'screen-sm': sizeType === 'max' && dimension === 'w' ? `${prefix}-screen-sm` : undefined,
        'screen-md': sizeType === 'max' && dimension === 'w' ? `${prefix}-screen-md` : undefined,
        'screen-lg': sizeType === 'max' && dimension === 'w' ? `${prefix}-screen-lg` : undefined,
        'screen-xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-screen-xl` : undefined,
        'screen-2xl': sizeType === 'max' && dimension === 'w' ? `${prefix}-screen-2xl` : undefined,
    };

    // Select the appropriate predefined sizes
    const predefinedSizes = sizeType === 'none' ? predefinedSizesNone : predefinedSizesMinMax;

    return (value) => {
        const trimmedValue = value.trim();

        // Check if the value is one of the predefined sizes
        if (predefinedSizes[trimmedValue]) {
            return predefinedSizes[trimmedValue];
        }

        // If the value is not supported, use arbitrary value syntax
        let escapedValue = escapeValue(trimmedValue);
        escapedValue = spacesToUnderscore(escapedValue);
        return `${prefix}-[${escapedValue}]`;
    };
}


// Helper function to handle border-radius properties
function handleBorderRadius(property) {
    // Map CSS border-radius properties to Tailwind prefixes
    const propertyMap = {
        'border-radius': 'rounded',
        'border-top-left-radius': 'rounded-tl',
        'border-top-right-radius': 'rounded-tr',
        'border-bottom-left-radius': 'rounded-bl',
        'border-bottom-right-radius': 'rounded-br',
        'border-top-radius': 'rounded-t',
        'border-right-radius': 'rounded-r',
        'border-bottom-radius': 'rounded-b',
        'border-left-radius': 'rounded-l',
    };

    // Get the Tailwind prefix based on the CSS property
    const prefix = propertyMap[property];

    // If the property is not recognized, fallback to arbitrary property
    if (!prefix) {
        return (value) => {
            const escapedValue = escapeValue(value);
            return `[${property}:${escapedValue}]`;
        };
    }

    // Predefined border-radius mappings based on Tailwind's default scale
    const predefinedBorderRadius = {
        '0px': `${prefix}-none`,
        '0': `${prefix}-none`,
        '2px': `${prefix}-sm`,
        '4px': `${prefix}`,
        '6px': `${prefix}-md`,
        '8px': `${prefix}-lg`,
        '12px': `${prefix}-xl`,
        '16px': `${prefix}-2xl`,
        '24px': `${prefix}-3xl`,
        '9999px': `${prefix}-full`,
        '100%': `${prefix}-full`,
        'none': `${prefix}-none`,
        'sm': `${prefix}-sm`,
        'md': `${prefix}-md`,
        'lg': `${prefix}-lg`,
        'xl': `${prefix}-xl`,
        '2xl': `${prefix}-2xl`,
        '3xl': `${prefix}-3xl`,
        'full': `${prefix}-full`,
    };

    return (value) => {
        const trimmedValue = value.trim();
        const values = trimmedValue.split(/\s+/);

        // If there's only one value, handle it normally
        if (values.length === 1) {
            const v = values[0];
            const standardizedValue = standardizeBorderRadiusValue(v);
            if (predefinedBorderRadius[standardizedValue]) {
                return predefinedBorderRadius[standardizedValue];
            } else {
                // Use arbitrary value syntax for any other cases
                const escapedValue = escapeValue(v);
                return `${prefix}-[${escapedValue}]`;
            }
        } else {
            // For multiple values, combine them into a single arbitrary class
            const combinedValue = values.join('_');
            const escapedCombinedValue = escapeValue(combinedValue);
            return `[${property}:${escapedCombinedValue}]`;
        }
    };
}

function standardizeBorderRadiusValue(value) {
    value = value.trim().toLowerCase();
    // First, check if value is a known keyword
    if (['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'].includes(value)) {
        return value;
    }
    // Try to convert to px
    const pxValue = getPxValue(value);
    if (pxValue !== null) {
        // Round to nearest integer for matching
        const roundedPxValue = Math.round(pxValue);
        return `${roundedPxValue}px`;
    } else {
        // Return the original value
        return value;
    }
}

function getPxValue(value) {
    value = value.trim().toLowerCase();
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    if (value.endsWith('rem')) {
        return numValue * 16; // Assuming 1rem = 16px
    } else if (value.endsWith('px')) {
        return numValue;
    } else if (value.endsWith('em')) {
        return numValue * 16; // Assuming 1em = 16px
    } else if (value.endsWith('%')) {
        if (value === '100%') {
            // Special case for 100%
            return 9999;
        } else {
            // Cannot convert other percentages without context
            return null;
        }
    } else {
        // If no unit, assume px
        return numValue;
    }
}

// Helper function to handle padding and margin properties
// Helper function to handle padding and margin properties
function handleSpacing(property) {
    // Define the mapping from CSS property to Tailwind prefix
    const propertyMap = {
        // Padding
        'padding': 'p',
        'padding-top': 'pt',
        'padding-right': 'pr',
        'padding-bottom': 'pb',
        'padding-left': 'pl',
        'padding-horizontal': 'px',
        'padding-vertical': 'py',
        'padding-inline': 'px', // Maps to horizontal padding (LTR)
        'padding-inline-start': 'pl',
        'padding-inline-end': 'pr',

        // Margin
        'margin': 'm',
        'margin-top': 'mt',
        'margin-right': 'mr',
        'margin-bottom': 'mb',
        'margin-left': 'ml',
        'margin-horizontal': 'mx',
        'margin-vertical': 'my',
        'margin-inline': 'mx', // Maps to horizontal margin (LTR)
        'margin-inline-start': 'ml',
        'margin-inline-end': 'mr',
        
        // Gap
        'gap': 'gap',
        'gap-x': 'gap-x',
        'gap-y': 'gap-y',
    };

    // Get the Tailwind prefix based on the CSS property
    const prefix = propertyMap[property];

    // If the property is not recognized, fallback to arbitrary value
    if (!prefix) {
        return (value) => {
            const escapedValue = escapeValue(value);
            return `[${property}:${escapedValue}]`;
        };
    }

    // Predefined spacing scale based on Tailwind's default scale
    const predefinedSpacing = {
        '0': `${prefix}-0`,
        'px': `${prefix}-px`,
        '0.5': `${prefix}-0.5`,
        '1': `${prefix}-1`,
        '1.5': `${prefix}-1.5`,
        '2': `${prefix}-2`,
        '2.5': `${prefix}-2.5`,
        '3': `${prefix}-3`,
        '3.5': `${prefix}-3.5`,
        '4': `${prefix}-4`,
        '5': `${prefix}-5`,
        '6': `${prefix}-6`,
        '7': `${prefix}-7`,
        '8': `${prefix}-8`,
        '9': `${prefix}-9`,
        '10': `${prefix}-10`,
        '11': `${prefix}-11`,
        '12': `${prefix}-12`,
        '14': `${prefix}-14`,
        '16': `${prefix}-16`,
        '20': `${prefix}-20`,
        '24': `${prefix}-24`,
        '28': `${prefix}-28`,
        '32': `${prefix}-32`,
        '36': `${prefix}-36`,
        '40': `${prefix}-40`,
        '44': `${prefix}-44`,
        '48': `${prefix}-48`,
        '52': `${prefix}-52`,
        '56': `${prefix}-56`,
        '60': `${prefix}-60`,
        '64': `${prefix}-64`,
        '72': `${prefix}-72`,
        '80': `${prefix}-80`,
        '96': `${prefix}-96`,
        'auto': `${prefix}-auto`,
        // Add more predefined spacings if necessary
    };

    return (value) => {
        const trimmedValue = value.trim();

        // Tokenize the value while respecting parentheses
        const values = [];
        let currentToken = '';
        let parenCount = 0;

        for (let i = 0; i < trimmedValue.length; i++) {
            const char = trimmedValue[i];

            if (char === '(') {
                parenCount++;
                currentToken += char;
            } else if (char === ')') {
                parenCount--;
                currentToken += char;
            } else if (/\s/.test(char) && parenCount === 0) {
                if (currentToken.trim()) {
                    values.push(currentToken.trim());
                }
                currentToken = '';
            } else {
                currentToken += char;
            }
        }

        if (currentToken.trim()) {
            values.push(currentToken.trim());
        }

        // Determine the appropriate prefixes
        const isMargin = prefix.startsWith('m');
        const isGap = prefix.startsWith('gap');

        // For logical properties, adjust prefixes accordingly
        let finalPrefix = prefix;

        // Specific prefixes for logical properties
        let sidePrefix = '';
        if (property.endsWith('-start')) {
            sidePrefix = isMargin ? 'ml' : 'pl';
        } else if (property.endsWith('-end')) {
            sidePrefix = isMargin ? 'mr' : 'pr';
        } else {
            sidePrefix = finalPrefix;
        }

        // Handle values
        if (values.length === 1) {
            // One value: apply to the specific side or both sides
            const v = values[0];
            return predefinedSpacing[v] || `${sidePrefix}-[${spacesToUnderscore(escapeValue(v))}]`;
        } else if (values.length === 2) {
            // Two values: start and end
            const [v1, v2] = values;
            const startClass = predefinedSpacing[v1]
                ? predefinedSpacing[v1].replace(prefix, isMargin ? 'ml' : 'pl')
                : `${isMargin ? 'ml' : 'pl'}-[${spacesToUnderscore(escapeValue(v1))}]`;
            const endClass = predefinedSpacing[v2]
                ? predefinedSpacing[v2].replace(prefix, isMargin ? 'mr' : 'pr')
                : `${isMargin ? 'mr' : 'pr'}-[${spacesToUnderscore(escapeValue(v2))}]`;
            return [startClass, endClass].join(' ');
        } else {
            // Invalid number of values, fallback to arbitrary value
            return `${sidePrefix}-[${spacesToUnderscore(escapeValue(trimmedValue))}]`;
        }
    };
}

// Function to handle gap spacing properties
function handleGapSpacing(property) {
    // Map property to Tailwind prefix
    const prefixMap = {
        'row-gap': 'gap-y',
        'column-gap': 'gap-x',
        'grid-row-gap': 'gap-y',
        'grid-column-gap': 'gap-x',
    };
    const prefix = prefixMap[property];

    return (value) => {
        const trimmedValue = value.trim();

        // Predefined spacing values based on Tailwind's default scale
        const predefinedSpacing = {
            '0': `${prefix}-0`,
            'px': `${prefix}-px`,
            '0.5': `${prefix}-0.5`,
            '1': `${prefix}-1`,
            '1.5': `${prefix}-1.5`,
            '2': `${prefix}-2`,
            '2.5': `${prefix}-2.5`,
            '3': `${prefix}-3`,
            '3.5': `${prefix}-3.5`,
            '4': `${prefix}-4`,
            '5': `${prefix}-5`,
            '6': `${prefix}-6`,
            '7': `${prefix}-7`,
            '8': `${prefix}-8`,
            '9': `${prefix}-9`,
            '10': `${prefix}-10`,
            '11': `${prefix}-11`,
            '12': `${prefix}-12`,
            '14': `${prefix}-14`,
            '16': `${prefix}-16`,
            '20': `${prefix}-20`,
            '24': `${prefix}-24`,
            '28': `${prefix}-28`,
            '32': `${prefix}-32`,
            '36': `${prefix}-36`,
            '40': `${prefix}-40`,
            '44': `${prefix}-44`,
            '48': `${prefix}-48`,
            '52': `${prefix}-52`,
            '56': `${prefix}-56`,
            '60': `${prefix}-60`,
            '64': `${prefix}-64`,
            '72': `${prefix}-72`,
            '80': `${prefix}-80`,
            '96': `${prefix}-96`,
        };

        // Check if the value matches a predefined spacing value
        if (predefinedSpacing[trimmedValue]) {
            return predefinedSpacing[trimmedValue];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }
    };
}

// Function to handle gap spacing properties
function handleGapSpacing(property) {
    // Map property to Tailwind prefix
    const prefixMap = {
        'row-gap': 'gap-y',
        'column-gap': 'gap-x',
        'grid-row-gap': 'gap-y',
        'grid-column-gap': 'gap-x',
    };
    const prefix = prefixMap[property];

    return (value) => {
        const trimmedValue = value.trim();

        // Predefined spacing values based on Tailwind's default scale
        const predefinedSpacing = {
            '0': `${prefix}-0`,
            'px': `${prefix}-px`,
            '0.5': `${prefix}-0.5`,
            '1': `${prefix}-1`,
            '1.5': `${prefix}-1.5`,
            '2': `${prefix}-2`,
            '2.5': `${prefix}-2.5`,
            '3': `${prefix}-3`,
            '3.5': `${prefix}-3.5`,
            '4': `${prefix}-4`,
            '5': `${prefix}-5`,
            '6': `${prefix}-6`,
            '7': `${prefix}-7`,
            '8': `${prefix}-8`,
            '9': `${prefix}-9`,
            '10': `${prefix}-10`,
            '11': `${prefix}-11`,
            '12': `${prefix}-12`,
            '14': `${prefix}-14`,
            '16': `${prefix}-16`,
            '20': `${prefix}-20`,
            '24': `${prefix}-24`,
            '28': `${prefix}-28`,
            '32': `${prefix}-32`,
            '36': `${prefix}-36`,
            '40': `${prefix}-40`,
            '44': `${prefix}-44`,
            '48': `${prefix}-48`,
            '52': `${prefix}-52`,
            '56': `${prefix}-56`,
            '60': `${prefix}-60`,
            '64': `${prefix}-64`,
            '72': `${prefix}-72`,
            '80': `${prefix}-80`,
            '96': `${prefix}-96`,
        };

        // Check if the value matches a predefined spacing value
        if (predefinedSpacing[trimmedValue]) {
            return predefinedSpacing[trimmedValue];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }
    };
}


// Helper function to handle the 'flex' property
function handleFlex() {
    // Predefined flex value mappings based on Tailwind's default classes
    const predefinedFlex = {
        '1': 'flex-1',
        'auto': 'flex-auto',
        'initial': 'flex-initial',
        'none': 'flex-none',
    };

    return (value) => {
        const trimmedValue = value.trim();

        // Check if the value is one of the predefined flex classes
        if (predefinedFlex[trimmedValue]) {
            return predefinedFlex[trimmedValue];
        }

        // Handle complex flex values (e.g., '0 1 auto')
        // Replace spaces with underscores to conform to Tailwind's arbitrary value syntax
        // Example: '0 1 auto' -> 'flex-[0_1_auto]'
        const isComplexFlex = /^(\d+|\d+\.\d+|\*)(\s+)(\d+|\d+\.\d+|\*)(\s+)(auto|initial|none|\d+%|\d+px|\d+rem)$/.test(trimmedValue);

        if (isComplexFlex) {
            const escapedValue = escapeValue(trimmedValue).replace(/\s+/g, '_');
            return `flex-[${escapedValue}]`;
        }

        // Handle arbitrary flex values using Tailwind's arbitrary value syntax
        // Replace spaces with underscores and escape necessary characters
        const escapedValue = escapeValue(trimmedValue).replace(/\s+/g, '_');
        return `flex-[${escapedValue}]`;
    };
}


// Helper function to handle position properties (left, top, right, bottom)
function handlePosition(property) {
    // Map CSS position properties to Tailwind prefixes
    const prefixMap = {
        'top': 'top',
        'right': 'right',
        'bottom': 'bottom',
        'left': 'left',
    };

    const prefix = prefixMap[property];

    // Predefined spacing values based on Tailwind's default scale
    const predefinedSpacing = {
        '0': `${prefix}-0`,
        'px': `${prefix}-px`,
        '0.5': `${prefix}-0.5`,
        '1': `${prefix}-1`,
        '1.5': `${prefix}-1.5`,
        '2': `${prefix}-2`,
        '2.5': `${prefix}-2.5`,
        '3': `${prefix}-3`,
        '3.5': `${prefix}-3.5`,
        '4': `${prefix}-4`,
        '5': `${prefix}-5`,
        '6': `${prefix}-6`,
        '7': `${prefix}-7`,
        '8': `${prefix}-8`,
        '9': `${prefix}-9`,
        '10': `${prefix}-10`,
        '11': `${prefix}-11`,
        '12': `${prefix}-12`,
        '14': `${prefix}-14`,
        '16': `${prefix}-16`,
        '20': `${prefix}-20`,
        '24': `${prefix}-24`,
        '28': `${prefix}-28`,
        '32': `${prefix}-32`,
        '36': `${prefix}-36`,
        '40': `${prefix}-40`,
        '44': `${prefix}-44`,
        '48': `${prefix}-48`,
        '52': `${prefix}-52`,
        '56': `${prefix}-56`,
        '60': `${prefix}-60`,
        '64': `${prefix}-64`,
        '72': `${prefix}-72`,
        '80': `${prefix}-80`,
        '96': `${prefix}-96`,
        'auto': `${prefix}-auto`,
    };

    return (value) => {
        const standardizedValue = standardizeSpacingValue(value);
        if (predefinedSpacing[standardizedValue]) {
            return predefinedSpacing[standardizedValue];
        } else {
            // Use arbitrary value syntax for any other cases
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }
    };
}

// Helper function to standardize spacing values
function standardizeSpacingValue(value) {
    value = value.trim().toLowerCase();
    // First, check if value is a known keyword or predefined value
    if (['auto', 'px', '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96'].includes(value)) {
        return value;
    }
    // Try to convert to px
    const pxValue = getPxValue(value);
    if (pxValue !== null) {
        // Check if the pxValue corresponds to a predefined spacing
        const predefinedPxValues = {
            0: '0',
            1: 'px',
            2: '0.5',
            4: '1',
            6: '1.5',
            8: '2',
            10: '2.5',
            12: '3',
            14: '3.5',
            16: '4',
            20: '5',
            24: '6',
            28: '7',
            32: '8',
            36: '9',
            40: '10',
            44: '11',
            48: '12',
            56: '14',
            64: '16',
            80: '20',
            96: '24',
            112: '28',
            128: '32',
            144: '36',
            160: '40',
            176: '44',
            192: '48',
            208: '52',
            224: '56',
            240: '60',
            256: '64',
            288: '72',
            320: '80',
            384: '96',
        };

        const roundedPxValue = Math.round(pxValue);

        if (predefinedPxValues[roundedPxValue]) {
            return predefinedPxValues[roundedPxValue];
        } else {
            // Return the px value as is (e.g., '5px')
            return `${roundedPxValue}px`;
        }
    } else {
        // Return the original value
        return value;
    }
}


function handleGridTemplate(property) {
    return (value) => {
        const trimmedValue = value.trim();

        // Handle the 'none' keyword
        if (trimmedValue === 'none') {
            return 'grid-cols-none';
        }

        // Check if the value is a simple repeat pattern like 'repeat(n, 1fr)'
        const repeatMatch = trimmedValue.match(/^repeat\((\d+),\s*1fr\)$/);
        if (repeatMatch) {
            const count = repeatMatch[1];
            if (property === 'grid-template-columns') {
                return `grid-cols-${count}`;
            } else if (property === 'grid-template-rows') {
                return `grid-rows-${count}`;
            }
        }

        // Check if the value is a simple fraction pattern like '1fr 2fr'
        const fractionMatch = trimmedValue.match(/^(\d+fr)(\s+\d+fr)*$/);
        if (fractionMatch) {
            // Replace spaces with underscores for Tailwind's arbitrary syntax
            const escapedValue = escapeValue(trimmedValue).replace(/\s+/g, '_');
            if (property === 'grid-template-columns') {
                return `grid-cols-[${escapedValue}]`;
            } else if (property === 'grid-template-rows') {
                return `grid-rows-[${escapedValue}]`;
            }
        }

        // For any other complex or custom definitions, use arbitrary value syntax
        const escapedValue = escapeValue(trimmedValue)
            // Remove this line to keep commas intact
            // .replace(/,/g, '_')      // Remove this line
            .replace(/\s+/g, '_');  // Replace spaces with underscores

        if (property === 'grid-template-columns') {
            return `grid-cols-[${escapedValue}]`;
        } else if (property === 'grid-template-rows') {
            return `grid-rows-[${escapedValue}]`;
        }

        // Fallback to arbitrary value syntax if property is neither columns nor rows
        return `[${property}:${trimmedValue}]`;
    };
}

function handleGridColumnStart() {
    return (value) => {
        // Handle auto
        if (value === 'auto') {
            return 'col-start-auto';
        }
        
        // Handle span values
        const spanMatch = value.match(/^span\s+(\d+)$/i);
        if (spanMatch) {
            return `col-span-${spanMatch[1]}`;
        }

        // Handle numeric values (grid lines)
        if (/^\d+$/.test(value)) {
            return `col-start-[${value}]`;
        }

        // Handle custom names and other values
        const escapedValue = escapeValue(value);
        return `[grid-column-start:${escapedValue}]`;
    };
}

function handleGridColumnEnd() {
    return (value) => {
        // Handle auto
        if (value === 'auto') {
            return 'col-end-auto';
        }

        // Handle span values
        const spanMatch = value.match(/^span\s+(\d+)$/i);
        if (spanMatch) {
            return `col-span-${spanMatch[1]}`;
        }

        // Handle numeric values (grid lines)
        if (/^\d+$/.test(value)) {
            return `col-end-[${value}]`;
        }

        // Handle custom names and other values
        const escapedValue = escapeValue(value);
        return `[grid-column-end:${escapedValue}]`;
    };
}

function handleGridRowStart() {
    return (value) => {
        // Handle auto
        if (value === 'auto') {
            return 'row-start-auto';
        }
        
        // Handle span values
        const spanMatch = value.match(/^span\s+(\d+)$/i);
        if (spanMatch) {
            return `row-span-${spanMatch[1]}`;
        }
        // Handle numeric values (grid lines)
        if (/^\d+$/.test(value)) {
            return `row-start-[${value}]`;
        }
        // Handle custom names and other values
        const escapedValue = escapeValue(value);
        return `[grid-row-start:${escapedValue}]`;
    };
}

function handleGridRowEnd() {
    return (value) => {
        // Handle auto
        if (value === 'auto') {
            return 'row-end-auto';
        }
        // Handle span values
        const spanMatch = value.match(/^span\s+(\d+)$/i);
        if (spanMatch) {
            return `row-span-${spanMatch[1]}`;
        }
        // Handle numeric values (grid lines)
        if (/^\d+$/.test(value)) {
            return `row-end-[${value}]`;
        }
        // Handle custom names and other values
        const escapedValue = escapeValue(value);
        return `[grid-row-end:${escapedValue}]`;
    };
}

function handleBorderWidth(property) {
    // Get the side from property name if present (e.g., 'border-left-width' -> 'l')
    const side = property.match(/border-(top|right|bottom|left)-width/);
    const prefix = side ? `border-${side[1][0]}` : 'border'; // border-t, border-r, etc or just border

    return (value) => {
        const widthMap = {
            'thin': prefix,
            'medium': `${prefix}-2`,
            'thick': `${prefix}-4`,
            '0': `${prefix}-0`,
            '1px': prefix,
            '2px': `${prefix}-2`,
            '4px': `${prefix}-4`,
            '8px': `${prefix}-8`
        };
        if (widthMap[value]) {
            return widthMap[value];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }        
    };
}

// Helper function for border style properties
function handleBorderStyle(property) {
    // Get the side from property name if present
    const side = property.match(/border-(top|right|bottom|left)-style/);
    const prefix = side ? `border-${side[1][0]}` : 'border'; // For specific sides, will be used if Tailwind adds support

    return (value) => {
        const styleMap = {
            'none': 'border-none',
            'hidden': 'border-none',
            'solid': 'border-solid',
            'dashed': 'border-dashed',
            'dotted': 'border-dotted',
            'double': 'border-double',
            'groove': '[border-style:groove]',
            'ridge': '[border-style:ridge]',
            'inset': '[border-style:inset]',
            'outset': '[border-style:outset]'
        };
        // For now, Tailwind doesn't support per-side border styles
        // So we fall back to arbitrary value if it's a side-specific style
        if (side) {
            return `[${property}:${value}]`;
        }
        if (styleMap[value]) {
            return styleMap[value];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }            
    };
}

// Helper function for border color properties
function handleBorderColor(property) {
    // Get the side from property name if present
    const side = property.match(/border-(top|right|bottom|left)-color/);
    const prefix = side ? `border-${side[1][0]}` : 'border';

    return (value) => {
        // Common color mappings
        const colorMap = {
            'transparent': `${prefix}-transparent`,
            'current': `${prefix}-current`,
            'black': `${prefix}-black`,
            'white': `${prefix}-white`,
            'inherit': `${prefix}-inherit`,
            'currentColor': `${prefix}-current`
        };

        // Check for named colors
        if (colorMap[value]) {
            return colorMap[value];
        }

        // Check for hex colors
        if (/^#([0-9a-fA-F]{3,8})$/.test(value)) {
            return `${prefix}-[${value}]`;
        }

        // Check for rgb/rgba colors
        if (/^rgb[a]?\([\d\s,%.]+\)$/.test(value)) {
            const escapedValue = value.replace(/\s+/g, '_');
            return `${prefix}-[${escapedValue}]`;
        }

        // Check for hsl/hsla colors
        if (/^hsl[a]?\([\d\s%,.]+\)$/.test(value)) {
            const escapedValue = value.replace(/\s+/g, '_');
            return `${prefix}-[${escapedValue}]`;
        }

        // Check for CSS variables
        if (value.startsWith('var(')) {
            return `${prefix}-[${value}]`;
        }

        // Handle Tailwind color notation (e.g., 'red-500')
        if (/^[a-z]+-\d+$/.test(value)) {
            return `${prefix}-${value}`;
        }

        // For any other values
        let escapedValue = escapeValue(value.trim());
        escapedValue = spacesToUnderscore(escapedValue);
        return `${prefix}-[${escapedValue}]`;
    };
}

// Handler for 'outline-width' property
function handleOutlineWidth(property) {
    // Tailwind doesn't have built-in outline-width classes, so we'll use arbitrary values
    return (value) => {
        const prefix = 'outline';
        const widthMap = {
            '0': `${prefix}-0`,
            '1px': `${prefix}-[0.0625rem]`, // 1px = 0.0625rem
            '2px': `${prefix}-[0.125rem]`,  // 2px = 0.125rem
            '4px': `${prefix}-[0.25rem]`,   // 4px = 0.25rem
            '8px': `${prefix}-[0.5rem]`,    // 8px = 0.5rem
        };

        if (widthMap[value]) {
            return widthMap[value];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }
    };
}

// Handler for 'outline-style' property
function handleOutlineStyle(property) {
    // Tailwind doesn't have built-in outline-style classes, so we'll use arbitrary values
    return (value) => {
        const prefix = 'outline';
        const styleMap = {
            'none': 'outline-none',
            'solid': `${prefix}-[solid]`,
            'dashed': `${prefix}-[dashed]`,
            'dotted': `${prefix}-[dotted]`,
            'double': `${prefix}-[double]`,
            'groove': `${prefix}-[groove]`,
            'ridge': `${prefix}-[ridge]`,
            'inset': `${prefix}-[inset]`,
            'outset': `${prefix}-[outset]`,
        };

        if (styleMap[value]) {
            return styleMap[value];
        } else {
            // For arbitrary values, escape special characters and replace spaces with underscores
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `${prefix}-[${escapedValue}]`;
        }
    };
}



// Escape values - DOES NOT CONVERT SPACES TO UNDERSCORE.  YOU MUST USE FUNCTION BELOW TO DO THAT
function escapeValue(value) {
    return value
        .replace(/\\/g, '\\\\')   // Escape backslashes
        .replace(/\]/g, '\\]')     // Escape closing brackets
        .replace(/\[/g, '\\[')     // Escape opening brackets
        .replace(/"/g, '\\"')      // Escape double quotes
        .replace(/'/g, "\\'");     // Escape single quotes
}

function spacesToUnderscore(value){
    value = value.replace(/\s+/g, '_');
    return value;
}

function cssToTailwind(property, value) {
    try{
            
    const mappings = {
        'position': {
            'static': 'static',
            'relative': 'relative',
            'absolute': 'absolute',
            'fixed': 'fixed',
            'sticky': 'sticky',
        },
        'clear': {
            'none': 'clear-none',
            'left': 'clear-left',
            'right': 'clear-right',
            'both': 'clear-both',
        }, 
        'resize': {
            'none': 'resize-none',
            'y': 'resize-y',
            'x': 'resize-x',
            'both': 'resize'
        },        
        'background': (value) => {
            const escapedValue = spacesToUnderscore(escapeValue(value));
            
            //fuck
            //return `bg-[${escapedValue}]`;        
            
            return `[background:${escapedValue}]`;
        },
        'object-fit': {
            'contain': 'object-contain',
            'cover': 'object-cover',
            'fill': 'object-fill',
            'none': 'object-none',
            'scale-down': 'object-scale-down',
        },        
        'min-height': handleSize('h', 'min'),
        'max-height': handleSize('h', 'max'),
        'min-width': handleSize('w', 'min'),
        'max-width': handleSize('w', 'max'),
        'width': handleSize('w', 'none'),
        'height': handleSize('h', 'none'),    
        'padding': (value) => {
            console.error("padding SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("padding not expanded");            
        },  
        'padding-top': handleSpacing('padding-top'),
        'padding-right': handleSpacing('padding-right'),
        'padding-bottom': handleSpacing('padding-bottom'),
        'padding-left': handleSpacing('padding-left'),
        'padding-horizontal': handleSpacing('padding-horizontal'),
        'padding-vertical': handleSpacing('padding-vertical'),
        'padding-inline': handleSpacing('padding-inline'),
        'padding-inline-start': handleSpacing('padding-inline-start'),
        'padding-inline-end': handleSpacing('padding-inline-end'),
        
        'margin': (value) => {
            console.error("margin SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("margin not expanded");            
        },  
        'margin-top': handleSpacing('margin-top'),
        'margin-right': handleSpacing('margin-right'),
        'margin-bottom': handleSpacing('margin-bottom'),
        'margin-left': handleSpacing('margin-left'),
        'margin-horizontal': handleSpacing('margin-horizontal'),
        'margin-vertical': handleSpacing('margin-vertical'),   
        'margin-inline': handleSpacing('padding-inline'),
        'margin-inline-start': handleSpacing('padding-inline-start'),
        'margin-inline-end': handleSpacing('padding-inline-end'),  
        
        'grid-row-gap': handleGapSpacing('row-gap'),
        'row-gap': handleGapSpacing('row-gap'), 
        'grid-column-gap': handleGapSpacing('column-gap'),
        'column-gap': handleGapSpacing('column-gap'),
        'grid-template-columns': handleGridTemplate('grid-template-columns'),
        'grid-template-rows': handleGridTemplate('grid-template-rows'), 
        'gap': handleSpacing('gap'),
        'gap-x': handleSpacing('gap-x'),
        'gap-y': handleSpacing('gap-y'),
        'grid-column': (value) => {
            console.error("grid-column SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("grid-column not expanded");            
        },
        'grid-row': (value) => {
            console.error("grid-row SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("grid-row not expanded");            
        },        
        'grid-template': (value) => {
            console.error("grid-template SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("grid-template not expanded");            
        },        
        'grid-area': (value) => {
            console.error("grid-column SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("grid-column not expanded");            
        },            
        'grid-column-start': handleGridColumnStart(),
        'grid-column-end': handleGridColumnEnd(),
        'grid-row-start': handleGridRowStart(),
        'grid-row-end': handleGridRowEnd(),          
        'grid-auto-flow': (value) => {
            // Split the value into parts to handle multiple values
            const parts = value.trim().split(/\s+/);

            // Define basic mappings
            const flowMappings = {
                'row': 'grid-flow-row',
                'column': 'grid-flow-col',
                'row dense': 'grid-flow-row-dense',
                'column dense': 'grid-flow-col-dense',
                'dense': 'grid-flow-dense'
            };

            // If the full value exists in our mappings, use it
            if (flowMappings[value]) {
                return flowMappings[value];
            }

            // For any other values, use arbitrary value syntax
            const escapedValue = escapeValue(value);
            return `[grid-auto-flow:${escapedValue}]`;
        },     
        'grid-auto-columns': (value) => {
            const autoColMappings = {
                'auto': 'grid-auto-cols-auto',
                'min-content': 'grid-auto-cols-min',
                'max-content': 'grid-auto-cols-max',
                '1fr': 'grid-auto-cols-fr'
            };

            // Check if the value exists in predefined mappings
            if (autoColMappings[value]) {
                return autoColMappings[value];
            }

            // For arbitrary values, use the arbitrary value syntax
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `grid-auto-cols-[${escapedValue}]`;
        },
        'grid-auto-rows': (value) => {
            const autoRowMappings = {
                'auto': 'grid-auto-rows-auto',
                'min-content': 'grid-auto-rows-min',
                'max-content': 'grid-auto-rows-max',
                '1fr': 'grid-auto-rows-fr'
            };

            // Check if the value exists in predefined mappings
            if (autoRowMappings[value]) {
                return autoRowMappings[value];
            }

            // For arbitrary values, use the arbitrary value syntax
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `grid-auto-rows-[${escapedValue}]`;
        },        
        'grid-gap': (value) => {
            // Since grid-gap is an alias for gap, we can use the same gap utilities
            const trimmedValue = value.trim();

            // Predefined spacing values based on Tailwind's default scale
            const predefinedSpacing = {
                '0': 'gap-0',
                'px': 'gap-px',
                '0.5': 'gap-0.5',
                '1': 'gap-1',
                '1.5': 'gap-1.5',
                '2': 'gap-2',
                '2.5': 'gap-2.5',
                '3': 'gap-3',
                '3.5': 'gap-3.5',
                '4': 'gap-4',
                '5': 'gap-5',
                '6': 'gap-6',
                '7': 'gap-7',
                '8': 'gap-8',
                '9': 'gap-9',
                '10': 'gap-10',
                '11': 'gap-11',
                '12': 'gap-12',
                '14': 'gap-14',
                '16': 'gap-16',
                '20': 'gap-20',
                '24': 'gap-24',
                '28': 'gap-28',
                '32': 'gap-32',
                '36': 'gap-36',
                '40': 'gap-40',
                '44': 'gap-44',
                '48': 'gap-48',
                '52': 'gap-52',
                '56': 'gap-56',
                '60': 'gap-60',
                '64': 'gap-64',
                '72': 'gap-72',
                '80': 'gap-80',
                '96': 'gap-96',
            };

            // Check if the value matches a predefined spacing value
            if (predefinedSpacing[trimmedValue]) {
                return predefinedSpacing[trimmedValue];
            } else {
                // For arbitrary values, escape special characters and replace spaces with underscores
                const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
                return `gap-[${escapedValue}]`;
            }
        },        
        'left': handlePosition('left'),
        'top': handlePosition('top'),
        'right': handlePosition('right'),
        'bottom': handlePosition('bottom'),
        'z-index': (value) => {
            const predefinedZIndex = {
                '0': 'z-0',
                '10': 'z-10',
                '20': 'z-20',
                '30': 'z-30',
                '40': 'z-40',
                '50': 'z-50',
                'auto': 'z-auto',
            };

            // Check if the value exists in the predefined mappings
            if (predefinedZIndex[value]) {
                return predefinedZIndex[value];
            }

            // For other values, use Tailwind's arbitrary value syntax
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `z-[${escapedValue}]`;
        },
        'color': (value) => {
            const colorMappings = {
                'black': 'text-black',
                'white': 'text-white',
                'slate-50': 'text-slate-50',
                'slate-100': 'text-slate-100',
                'slate-200': 'text-slate-200',
                'slate-300': 'text-slate-300',
                'slate-400': 'text-slate-400',
                'slate-500': 'text-slate-500',
                'slate-600': 'text-slate-600',
                'slate-700': 'text-slate-700',
                'slate-800': 'text-slate-800',
                'slate-900': 'text-slate-900',
                'gray-50': 'text-gray-50',
                'gray-100': 'text-gray-100',
                'gray-200': 'text-gray-200',
                'gray-300': 'text-gray-300',
                'gray-400': 'text-gray-400',
                'gray-500': 'text-gray-500',
                'gray-600': 'text-gray-600',
                'gray-700': 'text-gray-700',
                'gray-800': 'text-gray-800',
                'gray-900': 'text-gray-900',
                'red-50': 'text-red-50',
                'red-100': 'text-red-100',
                'red-200': 'text-red-200',
                'red-300': 'text-red-300',
                'red-400': 'text-red-400',
                'red-500': 'text-red-500',
                'red-600': 'text-red-600',
                'red-700': 'text-red-700',
                'red-800': 'text-red-800',
                'red-900': 'text-red-900',
                'blue-50': 'text-blue-50',
                'blue-100': 'text-blue-100',
                'blue-200': 'text-blue-200',
                'blue-300': 'text-blue-300',
                'blue-400': 'text-blue-400',
                'blue-500': 'text-blue-500',
                'blue-600': 'text-blue-600',
                'blue-700': 'text-blue-700',
                'blue-800': 'text-blue-800',
                'blue-900': 'text-blue-900',
                'green-50': 'text-green-50',
                'green-100': 'text-green-100',
                'green-200': 'text-green-200',
                'green-300': 'text-green-300',
                'green-400': 'text-green-400',
                'green-500': 'text-green-500',
                'green-600': 'text-green-600',
                'green-700': 'text-green-700',
                'green-800': 'text-green-800',
                'green-900': 'text-green-900',
                'yellow-50': 'text-yellow-50',
                'yellow-100': 'text-yellow-100',
                'yellow-200': 'text-yellow-200',
                'yellow-300': 'text-yellow-300',
                'yellow-400': 'text-yellow-400',
                'yellow-500': 'text-yellow-500',
                'yellow-600': 'text-yellow-600',
                'yellow-700': 'text-yellow-700',
                'yellow-800': 'text-yellow-800',
                'yellow-900': 'text-yellow-900',
                'transparent': 'text-transparent',
                'current': 'text-current',
                'inherit': 'text-inherit'
            };
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return colorMappings[value] || `text-[${escapedValue}]`;
        },

        'outline-color': (value) => {
            const outlineColorMappings = {
                'black': 'outline-black',
                'white': 'outline-white',
                'slate-50': 'outline-slate-50',
                'slate-100': 'outline-slate-100',
                'slate-200': 'outline-slate-200',
                'slate-300': 'outline-slate-300',
                'slate-400': 'outline-slate-400',
                'slate-500': 'outline-slate-500',
                'slate-600': 'outline-slate-600',
                'slate-700': 'outline-slate-700',
                'slate-800': 'outline-slate-800',
                'slate-900': 'outline-slate-900',
                'gray-50': 'outline-gray-50',
                'gray-100': 'outline-gray-100',
                'gray-200': 'outline-gray-200',
                'gray-300': 'outline-gray-300',
                'gray-400': 'outline-gray-400',
                'gray-500': 'outline-gray-500',
                'gray-600': 'outline-gray-600',
                'gray-700': 'outline-gray-700',
                'gray-800': 'outline-gray-800',
                'gray-900': 'outline-gray-900',
                'red-50': 'outline-red-50',
                'red-100': 'outline-red-100',
                'red-200': 'outline-red-200',
                'red-300': 'outline-red-300',
                'red-400': 'outline-red-400',
                'red-500': 'outline-red-500',
                'red-600': 'outline-red-600',
                'red-700': 'outline-red-700',
                'red-800': 'outline-red-800',
                'red-900': 'outline-red-900',
                'blue-50': 'outline-blue-50',
                'blue-100': 'outline-blue-100',
                'blue-200': 'outline-blue-200',
                'blue-300': 'outline-blue-300',
                'blue-400': 'outline-blue-400',
                'blue-500': 'outline-blue-500',
                'blue-600': 'outline-blue-600',
                'blue-700': 'outline-blue-700',
                'blue-800': 'outline-blue-800',
                'blue-900': 'outline-blue-900',
                'green-50': 'outline-green-50',
                'green-100': 'outline-green-100',
                'green-200': 'outline-green-200',
                'green-300': 'outline-green-300',
                'green-400': 'outline-green-400',
                'green-500': 'outline-green-500',
                'green-600': 'outline-green-600',
                'green-700': 'outline-green-700',
                'green-800': 'outline-green-800',
                'green-900': 'outline-green-900',
                'yellow-50': 'outline-yellow-50',
                'yellow-100': 'outline-yellow-100',
                'yellow-200': 'outline-yellow-200',
                'yellow-300': 'outline-yellow-300',
                'yellow-400': 'outline-yellow-400',
                'yellow-500': 'outline-yellow-500',
                'yellow-600': 'outline-yellow-600',
                'yellow-700': 'outline-yellow-700',
                'yellow-800': 'outline-yellow-800',
                'yellow-900': 'outline-yellow-900',
                'transparent': 'outline-transparent',
                'current': 'outline-current',
                'inherit': 'outline-inherit'
            };
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return outlineColorMappings[value] || `outline-[${escapedValue}]`;
        },           
        'outline-width': handleOutlineWidth('outline-width'),
        'outline-style': handleOutlineStyle('outline-style'),        
        'border-radius': handleBorderRadius('border-radius'),
        'border-top-left-radius': handleBorderRadius('border-top-left-radius'),
        'border-top-right-radius': handleBorderRadius('border-top-right-radius'),
        'border-bottom-left-radius': handleBorderRadius('border-bottom-left-radius'),
        'border-bottom-right-radius': handleBorderRadius('border-bottom-right-radius'),
        'border-top-radius': handleBorderRadius('border-top-radius'),
        'border-right-radius': handleBorderRadius('border-right-radius'),
        'border-bottom-radius': handleBorderRadius('border-bottom-radius'),
        'border-left-radius': handleBorderRadius('border-left-radius'),
        'border': (value) => {
            console.error("border SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("border not expanded");
        },  
        'border-bottom': (value) => {
            console.error("borderbottom SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("border not expanded");
        },  
        'border-left': (value) => {
            console.error("borderleft SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("borderleft not expanded");
        },  
        'border-top': (value) => {
            console.error("bordertop SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("bordertopnot expanded");
        },  
        'border-right': (value) => {
            console.error("borderright SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("borderright not expanded");
        },          
        // Main border properties
        'border-width': handleBorderWidth('border-width'),
        'border-style': handleBorderStyle('border-style'),
        'border-color': handleBorderColor('border-color'),

        // Top border properties
        'border-top-width': handleBorderWidth('border-top-width'),
        'border-top-style': handleBorderStyle('border-top-style'),
        'border-top-color': handleBorderColor('border-top-color'),

        // Right border properties
        'border-right-width': handleBorderWidth('border-right-width'),
        'border-right-style': handleBorderStyle('border-right-style'),
        'border-right-color': handleBorderColor('border-right-color'),

        // Bottom border properties
        'border-bottom-width': handleBorderWidth('border-bottom-width'),
        'border-bottom-style': handleBorderStyle('border-bottom-style'),
        'border-bottom-color': handleBorderColor('border-bottom-color'),

        // Left border properties
        'border-left-width': handleBorderWidth('border-left-width'),
        'border-left-style': handleBorderStyle('border-left-style'),
        'border-left-color': handleBorderColor('border-left-color'),
        'opacity': (value) => {
            // Convert the opacity value to a number
            const opacityValue = parseFloat(value);

            // Check if it's a valid number
            if (isNaN(opacityValue)) {
                return `opacity-[${value}]`;
            }

            // Multiply by 100 and round to the nearest integer
            const percentage = Math.round(opacityValue * 100);

            // Tailwind's opacity classes use percentages (0, 5, 10, 20, etc.)
            // Handle common opacity values
            const predefinedOpacities = {
                0: 'opacity-0',
                5: 'opacity-5',
                10: 'opacity-10',
                20: 'opacity-20',
                25: 'opacity-25',
                30: 'opacity-30',
                40: 'opacity-40',
                50: 'opacity-50',
                60: 'opacity-60',
                70: 'opacity-70',
                75: 'opacity-75',
                80: 'opacity-80',
                90: 'opacity-90',
                95: 'opacity-95',
                100: 'opacity-100'
            };

            // Return the predefined class if it exists
            if (predefinedOpacities[percentage]) {
                return predefinedOpacities[percentage];
            }
            
            // For any other values, use arbitrary value syntax
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[opacity:${escapedValue}]`;            
        },
        'flex': handleFlex(),
        'flex-direction': {
            'row': 'flex-row',
            'row-reverse': 'flex-row-reverse',
            'column': 'flex-col',
            'column-reverse': 'flex-col-reverse',
        },        
        'justify-content': {
            'normal': 'justify-normal',
            'flex-start': 'justify-start',
            'start': 'justify-start',
            'left': 'justify-start',
            'flex-end': 'justify-end',
            'end': 'justify-end',
            'right': 'justify-end',
            'center': 'justify-center',
            'space-between': 'justify-between',
            'space-around': 'justify-around',
            'space-evenly': 'justify-evenly',
        },
        'flex-flow': (value) => {
            console.error("flex-flow SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("flex-flow not expanded");
        },  
        'place-self': (value) => {
            console.error("place-self SHOULD NEVER BE CALLED - IS EXPANDED IN tailwind_shortlong.js");
            throw new Error("place-self not expanded");
        },  
        'align-self': {
            'auto': 'self-auto',
            'flex-start': 'self-start',
            'flex-end': 'self-end',
            'center': 'self-center',
            'stretch': 'self-stretch',
            'baseline': 'self-baseline',
            'initial': '[align-self:initial]',
            'inherit': '[align-self:inherit]'
        },
        'justify-self': {
            'auto': 'justify-self-auto',
            'start': 'justify-self-start',
            'end': 'justify-self-end', 
            'center': 'justify-self-center',
            'stretch': 'justify-self-stretch',
            'initial': '[justify-self:initial]',
            'inherit': '[justify-self:inherit]',
            'baseline': 'justify-self-baseline',
            'first baseline': 'justify-self-first',
            'last baseline': 'justify-self-last'
        },                      
        'overflow': {
            'visible': 'overflow-visible',
            'hidden': 'overflow-hidden',
            'auto': 'overflow-auto',
            'scroll': 'overflow-scroll',
            'clip': 'overflow-clip',
        },
        'overflow-x': {
            'visible': 'overflow-x-visible',
            'hidden': 'overflow-x-hidden',
            'auto': 'overflow-x-auto',
            'scroll': 'overflow-x-scroll',
            'clip': 'overflow-x-clip',
        },
        'overflow-y': {
            'visible': 'overflow-y-visible',
            'hidden': 'overflow-y-hidden',
            'auto': 'overflow-y-auto',
            'scroll': 'overflow-y-scroll',
            'clip': 'overflow-y-clip',
        },        
        'float': {
            'left': 'float-left',
            'right': 'float-right',
            'none': 'float-none',
        },        
        'line-break': {
            'normal': 'break-normal',
            'anywhere': 'break-anywhere',
            'keep-all': 'break-keep',
        },        
        'font-weight': {
            '100': 'font-thin',
            '200': 'font-extralight',
            '300': 'font-light',
            '400': 'font-normal',
            '500': 'font-medium',
            '600': 'font-semibold',
            '700': 'font-bold',
            '800': 'font-extrabold',
            '900': 'font-black',
            'thin': 'font-thin',
            'extralight': 'font-extralight',
            'light': 'font-light',
            'normal': 'font-normal',
            'medium': 'font-medium',
            'semibold': 'font-semibold',
            'bold': 'font-bold',
            'extrabold': 'font-extrabold',
            'black': 'font-black',
        },  
        'font-style': (value) => {
            const predefinedStyles = {
                'normal': 'not-italic',
                'italic': 'italic',
            };
            if (predefinedStyles[value]) {
                return predefinedStyles[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[font-style:${escapedValue}]`;
            }
        },        
        'font-feature-settings': (value) => {
            // Common OpenType feature mappings to Tailwind classes
            const featureMappings = {
                '"liga" 0': 'font-ligatures-none',
                '"liga" 1': 'font-ligatures-normal',
                'normal': 'font-normal',
                '"kern"': 'font-kerning-auto',
                '"kern" 0': 'font-kerning-none',
                '"kern" 1': 'font-kerning-normal',
                '"clig" 0': 'font-common-ligatures-none',
                '"clig" 1': 'font-common-ligatures-normal'
            };

            if (featureMappings[value]) {
                return featureMappings[value];
            }

            // For any other values, use arbitrary value syntax
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[font-feature-settings:${escapedValue}]`;
        },

        'font-variation-settings': (value) => {
            // Handle basic font variation settings
            if (value === 'normal') {
                return 'font-normal';
            }

            // For any other values, use arbitrary value syntax
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[font-variation-settings:${escapedValue}]`;
        },        
        'text-align': {
            'left': 'text-left',
            'right': 'text-right',
            'center': 'text-center',
            'justify': 'text-justify',
        },        
        'text-transform': {
            'none': 'normal-case',
            'capitalize': 'capitalize',
            'uppercase': 'uppercase',
            'lowercase': 'lowercase',
        },
        'text-decoration-style': {
            'solid': 'decoration-solid',
            'double': 'decoration-double',
            'dotted': 'decoration-dotted',
            'dashed': 'decoration-dashed',
            'wavy': 'decoration-wavy'
        },
        'text-decoration-thickness': {
            'auto': 'decoration-auto',
            'from-font': 'decoration-from-font',
            '0': 'decoration-0',
            '1': 'decoration-1',
            '2': 'decoration-2',
            '4': 'decoration-4',
            '8': 'decoration-8'
        },       
        'text-wrap': {
            'balance': 'text-balance',
            'pretty': 'text-pretty',
            'nowrap': 'text-nowrap',
            'wrap': 'text-wrap',
            'normal': '[text-wrap:normal]',
            'initial': '[text-wrap:initial]',
            'inherit': '[text-wrap:inherit]'
        },

        'scrollbar-width': {
            'none': 'hide-scrollbar',
            'thin': 'scrollbar-thin',
            'auto': 'scrollbar',
        },        
        'vertical-align': (value) => {
            const predefinedMappings = {
                'baseline': 'align-baseline',
                'top': 'align-top',
                'middle': 'align-middle',
                'bottom': 'align-bottom',
                'text-top': 'align-text-top',
                'text-bottom': 'align-text-bottom',
                'sub': 'align-sub',
                'super': 'align-super',
            };

            return predefinedMappings[value] || `align-[${escapeValue(value)}]`;
        },        
        'line-height': (value) => {
            // Handle predefined line heights
            const predefinedLineHeights = {
                '1': 'leading-none',
                '1.25': 'leading-tight',
                '1.375': 'leading-snug', 
                '1.5': 'leading-normal',
                '1.625': 'leading-relaxed',
                '2': 'leading-loose',
                '0.75rem': 'leading-3',
                '1rem': 'leading-4',
                '1.25rem': 'leading-5',
                '1.5rem': 'leading-6',
                '1.75rem': 'leading-7',
                '2rem': 'leading-8',
                '2.25rem': 'leading-9',
                '2.5rem': 'leading-10',
            };

            // Check for predefined values first
            if (predefinedLineHeights[value]) {
                return predefinedLineHeights[value];
            }

            // For any other values (including numbers, units, etc)
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `leading-[${escapedValue}]`;
        },
        'border-collapse': {
            'collapse': 'border-collapse',
            'separate': 'border-separate',
            'inherit': '[border-collapse:inherit]',
            'initial': '[border-collapse:initial]',
            'revert': '[border-collapse:revert]',
            'unset': '[border-collapse:unset]'
        },
        'caption-side': {
            'top': 'caption-top',
            'bottom': 'caption-bottom',
            'inherit': '[caption-side:inherit]',
            'initial': '[caption-side:initial]',
            'revert': '[caption-side:revert]',
            'unset': '[caption-side:unset]'
        },

        'empty-cells': {
            'show': '[empty-cells:show]',
            'hide': '[empty-cells:hide]',
            'inherit': '[empty-cells:inherit]',
            'initial': '[empty-cells:initial]',
            'revert': '[empty-cells:revert]',
            'unset': '[empty-cells:unset]'
        },
        'text-indent': (value) => {
            // Handle 0 case
            if (value === '0' || value === '0px') {
                return 'indent-0';
            }

            // Handle negative values
            if (value.startsWith('-')) {
                let positiveValue = value.slice(1);
                let escapedValue = escapeValue(positiveValue);
                escapedValue = spacesToUnderscore(escapedValue);
                return `-indent-[${escapedValue}]`;
            }

            // Handle all other values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `indent-[${escapedValue}]`;
        },        
        'border-spacing': (value) => {
            // Handle single value that applies to both x and y
            if (!value.includes(' ')) {
                // Check if it's 0 or 0px
                if (value === '0' || value === '0px') {
                    return 'border-spacing-0';
                }
                let escapedValue = escapeValue(value);
                escapedValue = spacesToUnderscore(escapedValue);
                return `border-spacing-[${escapedValue}]`;
            }

            // Handle x y values (e.g. "0 10px")
            const [x, y] = value.split(' ').map(v => v.trim());

            // If both values are the same, use single class
            if (x === y) {
                if (x === '0' || x === '0px') {
                    return 'border-spacing-0';
                }
                let escapedX = escapeValue(x);
                escapedX = spacesToUnderscore(escapedX);
                return `border-spacing-[${escapedX}]`;
            }

            // Different values - use separate x/y classes
            let xClass, yClass;

            if (x === '0' || x === '0px') {
                xClass = 'border-spacing-x-0';
            } else {
                let escapedX = escapeValue(x);
                escapedX = spacesToUnderscore(escapedX);
                xClass = `border-spacing-x-[${escapedX}]`;
            }

            if (y === '0' || y === '0px') {
                yClass = 'border-spacing-y-0';
            } else {
                let escapedY = escapeValue(y);
                escapedY = spacesToUnderscore(escapedY);
                yClass = `border-spacing-y-[${escapedY}]`;
            }

            return `${xClass} ${yClass}`;
        },        
        'text-decoration': {
            'underline': 'underline',
            'overline': 'overline',
            'line-through': 'line-through',
            'none': 'no-underline',
        },
        'text-decoration-line': {
            'underline': 'underline',
            'overline': 'overline',
            'line-through': 'line-through',
            'none': 'no-underline',
        },
        'text-decoration-color': (value) => {
            // Tailwind uses decoration-{color} for text decoration colors
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `decoration-[${escapedValue}]`;
        },
        'text-decoration-style': {
            'solid': 'decoration-solid',
            'double': 'decoration-double',
            'dotted': 'decoration-dotted',
            'dashed': 'decoration-dashed',
            'wavy': 'decoration-wavy',
        },
        'text-decoration-thickness': (value) => {
            // Handle predefined values
            const predefinedThickness = {
                'auto': 'decoration-auto',
                'from-font': 'decoration-from-font',
                '0': 'decoration-0',
                '0px': 'decoration-0',
                '1px': 'decoration-1',
                '2px': 'decoration-2',
                '4px': 'decoration-4',
                '8px': 'decoration-8',
            };

            if (predefinedThickness[value]) {
                return predefinedThickness[value];
            }

            // Use arbitrary value for other cases
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `decoration-[${escapedValue}]`;
        },
        'text-underline-offset': (value) => {
            // Handle predefined values
            const predefinedOffsets = {
                'auto': 'underline-offset-auto',
                '0': 'underline-offset-0',
                '0px': 'underline-offset-0',
                '1px': 'underline-offset-1',
                '2px': 'underline-offset-2',
                '4px': 'underline-offset-4',
                '8px': 'underline-offset-8',
            };

            if (predefinedOffsets[value]) {
                return predefinedOffsets[value];
            }

            // Use arbitrary value for other cases
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `underline-offset-[${escapedValue}]`;
        },
        'text-decoration-skip-ink': (value) => {
            // No direct Tailwind equivalent, use arbitrary property
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[text-decoration-skip-ink:${escapedValue}]`;
        },
        'transform': (value) => {
            console.error("transform SHOULD NEVER BE CALLED - HAS SPECIAL FUNCTION");
            throw new Error("transform not expanded");            
        },  
        'aspect-ratio': (value) => {
            // Handle predefined aspect ratios
            const predefinedRatios = {
                'auto': 'aspect-auto',
                '1/1': 'aspect-square',
                'square': 'aspect-square',
                '16/9': 'aspect-video'
            };

            // Check for predefined values first
            if (predefinedRatios[value]) {
                return predefinedRatios[value];
            }

            // Handle single number (e.g., "1" should become "1/1")
            if (/^\d+$/.test(value)) {
                return `aspect-[${value}/1]`;
            }

            // Handle fraction format (e.g., "16/9")
            if (/^\d+\/\d+$/.test(value)) {
                return `aspect-[${value}]`;
            }

            // For any other values (including decimal numbers)
            return `aspect-[${value}]`;
        },
        'transition-duration': (value) => {
            const durationMap = {
                '75ms': 'duration-75',
                '100ms': 'duration-100',
                '150ms': 'duration-150',
                '200ms': 'duration-200',
                '300ms': 'duration-300',
                '500ms': 'duration-500',
                '700ms': 'duration-700',
                '1000ms': 'duration-1000',
            };
            if(durationMap[value]){
               return durationMap[value];
            }
             
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
          
            return `duration-[${escapedValue}]`;
        },
        'transition-property': (value) => {
            const transitionMappings = {
                'none': 'transition-none',
                'all': 'transition-all',
                'colors': 'transition-colors',
                'opacity': 'transition-opacity',
                'shadow': 'transition-shadow',
                'transform': 'transition-transform',
                'height': 'transition-[height]',
                'width': 'transition-[width]',
                'spacing': 'transition-[spacing]',
                'default': 'transition' // This is Tailwind's default transition settings
            };

            // Check for predefined values
            if (transitionMappings[value]) {
                return transitionMappings[value];
            }

            // For custom values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `transition-[${escapedValue}]`;
        },  
        'transition-timing-function': (value) => {
            const timingMap = {
                'linear': 'ease-linear',
                'ease': 'ease-in-out',
                'ease-in': 'ease-in',
                'ease-out': 'ease-out',
                'ease-in-out': 'ease-in-out',
            };
          
            if(timingMap[value]){
               return timingMap[value];
            }
             
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
        
            return `ease-[${escapedValue}]`;
        },
        'transition': (value) => {
            const predefinedTransform = {
                'none': 'transition-none',
                'all': 'transition-all',
                'colors': 'transition-colors',
                'opacity': 'transition-opacity',
                'shadow': 'transition-shadow',
                'transform': 'transition-transform'
            };
            if(predefinedTransform[value]){
                return predefinedTransform[value];
            }
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);                
            return `[transition:${value.replace(/\s+/g, '_')}]`;
        },  
        'animation': (value) => {
            let trimmedValue = value.trim();
            const escapedValue = spacesToUnderscore(escapeValue(trimmedValue));
            return `[animation:${escapedValue}]`;
        },
        'animation-timing-function': (value) => {
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `[animation-timing-function:${escapedValue}]`;
        },
        'animation-duration': (value) => {
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `[animation-duration:${escapedValue}]`;
        },
        'animation-delay': (value) => {
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `[animation-delay:${escapedValue}]`;
        },
        'animation-iteration-count': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-iteration-count:${escapedValue}]`;
        },
        'animation-direction': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-direction:${escapedValue}]`;
        },
        'animation-fill-mode': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-fill-mode:${escapedValue}]`;
        },
        'animation-play-state': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-play-state:${escapedValue}]`;
        },
        'animation-name': (value) => {
            if (value === 'none') {
                return 'animate-none';
            }
            const escapedValue = spacesToUnderscore(escapeValue(value));
            return `[animation-name:${escapedValue}]`;
        },
        'animation-composition': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-composition:${escapedValue}]`;
        },
        'animation-timeline': (value) => {
            const escapedValue = escapeValue(value);
            return `[animation-timeline:${escapedValue}]`;
        },
        'mix-blend-mode': {
            'normal': 'mix-blend-normal',
            'multiply': 'mix-blend-multiply',
            'screen': 'mix-blend-screen',
            'overlay': 'mix-blend-overlay',
            'darken': 'mix-blend-darken',
            'lighten': 'mix-blend-lighten',
            'color-dodge': 'mix-blend-color-dodge',
            'color-burn': 'mix-blend-color-burn',
            'difference': 'mix-blend-difference',
            'exclusion': 'mix-blend-exclusion'
        },
        'text-overflow': {
           'ellipsis': 'text-ellipsis',
           'clip': 'text-clip'
        },   
        'word-break': {
            'break-all': 'break-all',
            'break-word': 'break-words',
            'normal': 'break-normal'
        },
        'isolation': {
            'isolate': 'isolate',
            'auto': 'isolation-auto'
        },        
        'white-space': {
            'normal': 'whitespace-normal',
            'nowrap': 'whitespace-nowrap',
            'pre': 'whitespace-pre',
            'pre-line': 'whitespace-pre-line',
            'pre-wrap': 'whitespace-pre-wrap'
        },    
        'will-change': {
            'auto': '[will-change:auto]',
            'scroll-position': '[will-change:scroll-position]',
            'contents': '[will-change:contents]',
            'transform': '[will-change:transform]',
            // For any other values, it will fall back to arbitrary value syntax
        },
        'transform-style': {
            'flat': '[transform-style:flat]',
            'preserve-3d': '[transform-style:preserve-3d]',
        },        
        'box-shadow': (value) => {
            const predefinedShadows = {
                '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-sm',
                '0 1px 3px 0 rgba(0, 0, 0, 0.1)': 'shadow',
                '0 4px 6px -1px rgba(0, 0, 0, 0.1)': 'shadow-md',
                '0 10px 15px -3px rgba(0, 0, 0, 0.1)': 'shadow-lg',
                '0 20px 25px -5px rgba(0, 0, 0, 0.1)': 'shadow-xl',
                '0 25px 50px -12px rgba(0, 0, 0, 0.25)': 'shadow-2xl',
                'inset 0 2px 4px 0 rgba(0,0,0,0.05)': 'shadow-inner',
                'none': 'shadow-none',
            };
            return predefinedShadows[value] || `shadow-[${value.replace(/\s+/g, '_')}]`;
        },
        'font-family': (value) => {
          const builtInTailwindFamilies = {
            // Tailwind's built-in classes for font-family:
            'sans-serif': 'font-sans',
            'serif': 'font-serif',
            'monospace': 'font-mono',
          };

          // Split on commas so we can handle fallbacks
          const families = value.split(',').map(f => f.trim());

          // If there's exactly one family and it's one of the built-ins, just return it
          if (families.length === 1) {
            const single = families[0].toLowerCase();
            if (builtInTailwindFamilies[single]) {
              return builtInTailwindFamilies[single];  // e.g. "font-sans"
            } else {
              // Not a built-in family name => use bracket syntax
              // If it's multi-word and not already quoted, wrap in quotes:
              const isMultiWord = /\s/.test(families[0]);
              const isQuoted =
                (families[0].startsWith("'") && families[0].endsWith("'")) ||
                (families[0].startsWith('"') && families[0].endsWith('"'));
              const finalFamily =
                isMultiWord && !isQuoted ? `'${families[0]}'` : families[0];
              return `font-[${finalFamily}]`;
            }
          }

          // Otherwise, we have multiple fallback families.
          // We'll build a single bracketed utility: font-['Family One','Family Two',sans-serif]
          const parsedFamilies = families.map((fam) => {
            const lowerFam = fam.toLowerCase();
            // If it's a built-in fallback like sans-serif, just use that
            // (We do NOT want the Tailwind class 'font-sans' inside the bracket,
            //  because that won't be recognized as a valid fallback inside the CSS)
            if (builtInTailwindFamilies[lowerFam]) {
              // For fallback, we keep the standard keyword (sans-serif, serif, etc.)
              // rather than 'font-sans'
              return lowerFam;
            }

            // Otherwise, quote multi-word families if not already quoted
            const isMultiWord = /\s/.test(fam);
            const isQuoted =
              (fam.startsWith("'") && fam.endsWith("'")) ||
              (fam.startsWith('"') && fam.endsWith('"'));
            return isMultiWord && !isQuoted ? `'${fam}'` : fam;
          });

          // Join them into a bracketed list
          // e.g. ['"Basis Grotesque Mono Pro"', sans-serif]
          const familyStr = parsedFamilies.join(',');
          return `font-[${familyStr}]`;
        },
        'box-sizing': {
            'border-box': 'box-border',
            'content-box': 'box-content',
        },
        'flex-wrap': {
            'nowrap': 'flex-nowrap',
            'wrap': 'flex-wrap',
            'wrap-reverse': 'flex-wrap-reverse',
        },
        'flex-basis': (value) => {
            value = value.trim();
            const basisMappings = {
                'auto': 'basis-auto',
                '0': 'basis-0',
                '1': 'basis-1',
                '0px': 'basis-0',
                '0.5': 'basis-1/2',
                '0.25': 'basis-1/4',
                '0.33': 'basis-1/3',
                '0.66': 'basis-2/3',
                '0.75': 'basis-3/4',
                '1.0': 'basis-full',
                '100%': 'basis-full',
                '50%': 'basis-1/2',
                '33.333333%': 'basis-1/3',
                '66.666667%': 'basis-2/3',
                '25%': 'basis-1/4',
                '75%': 'basis-3/4',
            };
            // Convert percentage to decimal for comparison
            const numericValue = value.replace('%', '') / 100;
            if(basisMappings[value]){
                return basisMappings[value];
            }else if(basisMappings[numericValue]){
                return basisMappings[numericValue];
            }
            
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `basis-[${escapedValue}]`;            
        },
        'flex-grow': (value) => {
            value = value.trim();
            const growMappings = {
                '0': 'grow-0',
                '1': 'grow',
                'auto': '[flex-grow:auto]', // Automatic growth
                'initial': 'grow-0',   // Maps to no growth (default)
                'inherit': '[flex-grow:inherit]', // Inherits value from parent
                'unset': '[flex-grow:unset]'  // Resets to initial or inherit
            };
            
            if(growMappings[value]){
                return growMappings[value];
            }
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `grow-[${escapedValue}]`;
        },  
        'column-count': (value) => {
            const columnMappings = {
                '1': 'columns-1',
                '2': 'columns-2',
                '3': 'columns-3',
                '4': 'columns-4',
                '5': 'columns-5',
                '6': 'columns-6',
                '7': 'columns-7',
                '8': 'columns-8',
                '9': 'columns-9',
                '10': 'columns-10',
                '11': 'columns-11',
                '12': 'columns-12',
                'auto': 'columns-auto',
                'initial': '[column-count:initial]',
                'inherit': '[column-count:inherit]'
            };

            if(columnMappings[value]){
                return columnMappings[value];
            }
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `columns-[${escapedValue}]`;            
        },        
        'flex-shrink': (value) => {
            const shrinkMappings = {
                '0': 'shrink-0',
                '1': 'shrink',
                'initial': 'shrink-0',
                'inherit': '[flex-shrink:inherit]'
            };
            if(shrinkMappings[value]){
                return shrinkMappings[value];
            }
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `shrink-[${escapedValue}]`;             
        },           
        'align-items': {
            'stretch': 'items-stretch',
            'flex-start': 'items-start',
            'flex-end': 'items-end',
            'center': 'items-center',
            'baseline': 'items-baseline',
            'initial': '[align-items:initial]',
            'inherit': '[align-items:inherit]',
        },
        'align-content': {
            'normal': 'content-normal',
            'center': 'content-center',
            'start': 'content-start',
            'end': 'content-end',
            'flex-start': 'content-start',
            'flex-end': 'content-end',
            'space-between': 'content-between',
            'space-around': 'content-around',
            'space-evenly': 'content-evenly',
            'baseline': 'content-baseline',
            'stretch': 'content-stretch',
            'initial': '[align-content:initial]',
            'inherit': '[align-content:inherit]',
        },
        'cursor': {
            'auto': 'cursor-auto',
            'default': 'cursor-default',
            'pointer': 'cursor-pointer',
            'wait': 'cursor-wait',
            'text': 'cursor-text',
            'move': 'cursor-move',
            'not-allowed': 'cursor-not-allowed',
            'help': 'cursor-help',
            'progress': 'cursor-progress',
            'cell': 'cursor-cell',
            'crosshair': 'cursor-crosshair',
            'vertical-text': 'cursor-vertical-text',
            'alias': 'cursor-alias',
            'copy': 'cursor-copy',
            'no-drop': 'cursor-no-drop',
            'grab': 'cursor-grab',
            'grabbing': 'cursor-grabbing',
            'all-scroll': 'cursor-all-scroll',
            'col-resize': 'cursor-col-resize',
            'row-resize': 'cursor-row-resize',
            'n-resize': 'cursor-n-resize',
            'e-resize': 'cursor-e-resize',
            's-resize': 'cursor-s-resize',
            'w-resize': 'cursor-w-resize',
            'ne-resize': 'cursor-ne-resize',
            'nw-resize': 'cursor-nw-resize',
            'se-resize': 'cursor-se-resize',
            'sw-resize': 'cursor-sw-resize',
            'ew-resize': 'cursor-ew-resize',
            'ns-resize': 'cursor-ns-resize',
            'nesw-resize': 'cursor-nesw-resize',
            'nwse-resize': 'cursor-nwse-resize',
            'zoom-in': 'cursor-zoom-in',
            'zoom-out': 'cursor-zoom-out'
        },
        'outline': (value) => {
            const outlineMappings = {
                '0': 'outline-none',
                'none': 'outline-none',
                '1px solid': 'outline',
                '2px solid': 'outline-2',
                '4px solid': 'outline-4',
                '8px solid': 'outline-8',
                'solid': 'outline',
                'dashed': 'outline-dashed',
                'dotted': 'outline-dotted',
                'double': 'outline-double',
                'hidden': 'outline-none',
                'inherit': '[outline:inherit]',
                'initial': '[outline:initial]',
                'revert': '[outline:revert]',
                'unset': '[outline:unset]',
                'auto': '[outline:auto]'
            };

            // Handle offset variations
            if (value.includes('offset')) {
                return `outline-offset-[${value}]`;
            }

            // Check for direct matches first
            if (outlineMappings[value]) {
                return outlineMappings[value];
            }

            // Handle width + style combinations
            const parts = value.split(' ');
            if (parts.length >= 2) {
                // Check if first part is a width and second is a style
                const width = parts[0];
                const style = parts[1];

                // Handle width+style combinations
                if (width.endsWith('px') && style === 'solid') {
                    const pixelValue = width.replace('px', '');
                    if (['1', '2', '4', '8'].includes(pixelValue)) {
                        return pixelValue === '1' ? 'outline' : `outline-${pixelValue}`;
                    }
                }

                // Handle style+color combinations
                if (['solid', 'dashed', 'dotted', 'double'].includes(parts[0])) {
                    return `outline-${parts[0]}`;
                }
            }

            // For any other values (including color values)
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `outline-[${escapedValue}]`;
        },
        'outline-offset': (value) => {
            const offsetMappings = {
                '0': 'outline-offset-0',
                '1': 'outline-offset-1',
                '2': 'outline-offset-2',
                '4': 'outline-offset-4',
                '8': 'outline-offset-8'
            };

            // Check if it's a predefined value
            if (offsetMappings[value]) {
                return offsetMappings[value];
            }

            // Handle arbitrary values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `outline-offset-[${escapedValue}]`;
        },      
        'inset': (value) => {
            const insetMappings = {
                '0': 'inset-0',
                '0px': 'inset-0',
                'auto': 'inset-auto',
                '50%': 'inset-1/2',
                '100%': 'inset-full',
                '1': 'inset-1',
                '2': 'inset-2',
                '3': 'inset-3',
                '4': 'inset-4',
                '5': 'inset-5',
                '6': 'inset-6',
                '8': 'inset-8',
                '10': 'inset-10',
                '12': 'inset-12',
                '16': 'inset-16',
                '20': 'inset-20',
                '24': 'inset-24',
                '32': 'inset-32',
                '36': 'inset-36',
                '40': 'inset-40',
                '44': 'inset-44',
                '48': 'inset-48',
                '52': 'inset-52',
                '56': 'inset-56',
                '60': 'inset-60',
                '64': 'inset-64',
                '72': 'inset-72',
                '80': 'inset-80',
                '96': 'inset-96',
                '25%': 'inset-1/4',
                '33%': 'inset-1/3',
                '33.333333%': 'inset-1/3',
                '66.666667%': 'inset-2/3',
                '75%': 'inset-3/4',
                'initial': '[inset:initial]',
                'inherit': '[inset:inherit]'
            };

            // Handle negative values
            if (value.startsWith('-')) {
                const positiveValue = value.slice(1);
                const positiveClass = insetMappings[positiveValue];
                if (positiveClass) {
                    return `-${positiveClass}`;
                }
            }

            // Check direct mapping
            if (insetMappings[value]) {
                return insetMappings[value];
            }

            // Handle pixel values
            if (value.endsWith('px')) {
                const numericValue = value.replace('px', '');
                if (insetMappings[numericValue]) {
                    return insetMappings[numericValue];
                }
            }

            // Handle rem values
            if (value.endsWith('rem')) {
                const remValue = parseFloat(value) * 4;  // Convert rem to Tailwind's spacing scale
                if (insetMappings[remValue.toString()]) {
                    return insetMappings[remValue.toString()];
                }
            }

            // For any other values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `inset-[${escapedValue}]`;
        },        
        'display': {
            'none': 'hidden',          
            'block': 'block',
            'inline-block': 'inline-block',
            'inline': 'inline',
            'flex': 'flex',
            'inline-flex': 'inline-flex',
            'grid': 'grid',
            'inline-grid': 'inline-grid',
            'contents': 'contents',
            'list-item': 'list-item',
            'table': 'table',
            'table-row': 'table-row',
            'table-cell': 'table-cell',
        },
        'visibility': (value) => {
            const visibilityMappings = {
                'visible': 'visible',
                'hidden': 'invisible',
            };
            if (visibilityMappings[value]) {
                return visibilityMappings[value];
            } else {
                // Use arbitrary value syntax
                const escapedValue = escapeValue(value);
                return `[visibility:${escapedValue}]`;
            }
        },  
        'list-style': (value) => {
            const escapedValue = escapeValue(value);
            return `[list-style:${escapedValue}]`;
        },
        'list-style-type': (value) => {
            const listStyleMappings = {
                'none': 'list-none',
                'disc': 'list-disc',
                'decimal': 'list-decimal',
            };

            // Check if it's a predefined value
            if (listStyleMappings[value]) {
                return listStyleMappings[value];
            }

            // Handle arbitrary values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[list-style-type:${escapedValue}]`;
        },                
        'list-style-position': (value) => {
            const listPositionMappings = {
                'inside': 'list-inside',
                'outside': 'list-outside',
            };
            // Check if it's a predefined value
            if (listPositionMappings[value]) {
                return listPositionMappings[value];
            }
            // Handle arbitrary values
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `[list-style-position:${escapedValue}]`;
        },
        'list-style-image': (value) => {
            const trimmedValue = value.trim();

            if (trimmedValue === 'none') {
                return '[list-style-image:none]';
            }

            const urlMatch = trimmedValue.match(/^url\((['"]?)(.*?)\1\)$/);
            if (urlMatch) {
                const url = urlMatch[2].replace(/'/g, "\\'");
                return `list-[url('${url}')]`;
            }

            // Use arbitrary value syntax for other cases
            const escapedValue = escapeValue(trimmedValue);
            return `[list-style-image:${escapedValue}]`;
        },        
        'font-size': (value) => {
            const sizeMappings = {
                '0.75rem': 'text-xs',
                '0.875rem': 'text-sm',
                '1rem': 'text-base',
                '1.125rem': 'text-lg',
                '1.25rem': 'text-xl',
                '1.5rem': 'text-2xl',
                '1.875rem': 'text-3xl',
                '2.25rem': 'text-4xl',
                '3rem': 'text-5xl',
                '3.75rem': 'text-6xl',
                '4.5rem': 'text-7xl',
                '6rem': 'text-8xl',
                '8rem': 'text-9xl',
            };

            // If it's in our predefined mappings, use that
            if (sizeMappings[value]) {
                return sizeMappings[value];
            }

            // Determine if we need to add the 'length:' prefix
            let prefix = '';
            if (value.startsWith('var')) {
                prefix = 'length:';
            }

            // Escape the value and replace spaces with underscores
            let escapedValue = spacesToUnderscore(escapeValue(value));

            // For any other value, use the arbitrary value syntax
            return `text-[${prefix}${escapedValue}]`;
        },
        'letter-spacing': (value) => {
            // Define predefined Tailwind tracking classes with their em equivalents
            const predefinedMappings = [
                { value: -0.05, class: 'tracking-tighter' },   // -0.05em
                { value: -0.025, class: 'tracking-tight' },    // -0.025em
                { value: 0, class: 'tracking-normal' },        // 0em
                { value: 0.025, class: 'tracking-wide' },       // 0.025em
                { value: 0.05, class: 'tracking-wider' },       // 0.05em
                { value: 0.1, class: 'tracking-widest' },       // 0.1em
            ];

            // Helper function to calculate percentage difference
            function calculatePercentageDifference(a, b) {
                if (a === 0 && b === 0) return 0;
                if (a === 0 || b === 0) return Infinity;
                return Math.abs((a - b) / a) * 100;
            }

            // Helper function to find the closest mapping within a threshold
            function findClosestMapping(emValue, thresholdPercent) {
                let closest = null;
                let smallestDifference = Infinity;

                predefinedMappings.forEach(mapping => {
                    const difference = calculatePercentageDifference(emValue, mapping.value);
                    if (difference < smallestDifference) {
                        smallestDifference = difference;
                        closest = mapping;
                    }
                });

                if (smallestDifference <= thresholdPercent) {
                    return closest.class;
                } else {
                    return null;
                }
            }

            // Convert the input value to em units
            let emValue;
            if (value.endsWith('px')) {
                emValue = parseFloat(value) / 16; // Assuming 1rem = 16px
            } else if (value.endsWith('em')) {
                emValue = parseFloat(value);
            } else if (value === 'normal' || value === '0') {
                return 'tracking-normal';
            } else {
                // Use arbitrary value syntax for unsupported units
                let escapedValue = escapeValue(value);
                escapedValue = spacesToUnderscore(escapedValue);
                return `tracking-[${escapedValue}]`;
            }

            // Find the closest predefined Tailwind tracking class within 3% threshold
            const closestClass = findClosestMapping(emValue, 3); // 3% threshold

            if (closestClass) {
                return closestClass;
            } else {
                // Use arbitrary value syntax if no close match is found
                let escapedValue = escapeValue(value);
                escapedValue = spacesToUnderscore(escapedValue);
                return `tracking-[${escapedValue}]`;
            }
        },      
        'fill': (value) => {
            const fillMappings = {
                'none': 'fill-none',
                'currentColor': 'fill-current',
                'current': 'fill-current',
                'inherit': 'fill-inherit',
                'transparent': 'fill-transparent',
                'black': 'fill-black',
                'white': 'fill-white'
            };

            // Check if it's a predefined value
            if (fillMappings[value]) {
                return fillMappings[value];
            }

            // Handle hex colors, rgb, hsl etc
            if (/^#([0-9a-fA-F]{3,8})$/.test(value) || 
                /^rgb/.test(value) || 
                /^hsl/.test(value)) {
                let escapedValue = escapeValue(value);
                escapedValue = escapedValue.replace(/\s+/g, '_');
                return `fill-[${escapedValue}]`;
            }

            // For any other values including CSS variables
            let escapedValue = escapeValue(value);
            escapedValue = spacesToUnderscore(escapedValue);
            return `fill-[${escapedValue}]`;
        },
        'break-inside': {
            'auto': 'break-inside-auto',
            'avoid': 'break-inside-avoid',
            'avoid-page': 'break-inside-avoid-page',
            'avoid-column': 'break-inside-avoid-column',
            'initial': '[break-inside:initial]',
            'inherit': '[break-inside:inherit]'
        },        
        'background-color': (value) => {
            const bgColorMappings = {
                'transparent': 'bg-transparent',
                'currentColor': 'bg-current',
                'black': 'bg-black',
                'white': 'bg-white',
                'none': 'bg-none'
                // Add more named CSS colors if needed
            };

            // Trim the value to remove any surrounding whitespace
            const trimmedValue = value.trim();

            // Check if the value matches a predefined CSS color
            if (bgColorMappings[trimmedValue]) {
                return bgColorMappings[trimmedValue];
            }

            // Handle hex colors, RGB, RGBA, HSL, HSLA functions
            if (/^#([0-9a-fA-F]{3,8})$/.test(trimmedValue) || /^rgb/.test(trimmedValue) || /^hsl/.test(trimmedValue)) {
                let escapedValue = escapeValue(trimmedValue);
                escapedValue = escapedValue.replace(/\s+/g, '_');
                return `bg-[${escapedValue}]`;
            }

            // Handle CSS variables
            if (/^var\(--.*\)$/.test(trimmedValue)) {
                let escapedValue = escapeValue(trimmedValue);
                return `bg-[${escapedValue}]`;
            }

            // Handle other valid CSS color values (e.g., named colors not in bgColorMappings)
            // You can expand this section based on your requirements
            let escapedValue = escapeValue(trimmedValue);
            escapedValue = escapedValue.replace(/\s+/g, '_');
            return `bg-[${escapedValue}]`;
        },
       'background-image': (value) => {
            if (value === 'none') {
                return 'bg-none';
            } else if (value.startsWith('url(')) {
                // Extract the URL inside url(...)
                const urlMatch = value.match(/^url\((['"]?)(.*)\1\)$/);
                if (urlMatch) {
                    let url = urlMatch[2];
                    // Replace spaces with underscores in the URL
                    url = url.replace(/\s+/g, '_');
                    // Escape special characters that need to be escaped in class names
                    let escapedUrl = url.replace(/([\[\]'"`\\])/g, '\\$1');
                    escapedUrl = spacesToUnderscore(escapedUrl);      
                    // Return the Tailwind class with single quotes
                    return `bg-[url('${escapedUrl}')]`;
                } else {
                    // Handle malformed url(...) functions
                    let escapedValue = value.replace(/([\[\]'"`\\])/g, '\\$1');
                    escapedValue = spacesToUnderscore(escapedValue); 
                    return `bg-[${escapedValue}]`;
                }
            } else if (/^(linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient)/.test(value)) {
                // Keep gradients clean by only escaping necessary characters
                let escapedValue = value.replace(/([\[\]'"`\\])/g, '\\$1');
                escapedValue = spacesToUnderscore(escapedValue); 
                return `bg-[${escapedValue}]`;
            } else {
                // Handle arbitrary values with proper escaping
                let escapedValue = value.replace(/([\[\]'"`\\])/g, '\\$1');
                escapedValue = spacesToUnderscore(escapedValue); 
                return `[background-image:${escapedValue}]`;
            }
        },
        'mask-image': (value) => {
            value = value.trim();

            if (value === 'none') {
                return 'mask-none';
            } else if (value.startsWith('url(')) {
                // Extract the URL inside url(...)
                const urlMatch = value.match(/^url\((['"]?)(.*?)\1\)$/);
                if (urlMatch) {
                    let url = urlMatch[2];
                    // Escape any single quotes in the URL
                    url = url.replace(/'/g, "\\'");
                    // Replace spaces with underscores in the URL
                    url = url.replace(/\s+/g, '_');
                    // Return the Tailwind class with single quotes
                    return `mask-[url('${url}')]`;
                } else {
                    // Handle malformed url(...) functions
                    const escapedValue = escapeValue(value);
                    return `mask-[${escapedValue}]`;
                }
            } else if (/^(linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient)/.test(value)) {
                // Escape special characters and replace spaces with underscores
                const escapedValue = value
                    .replace(/\\/g, '\\\\')    // Escape backslashes
                    .replace(/\]/g, '\\]')     // Escape closing brackets
                    .replace(/\[/g, '\\[')     // Escape opening brackets
                    .replace(/"/g, '\\"')      // Escape double quotes
                    .replace(/'/g, "\\'")      // Escape single quotes
                    .replace(/\s+/g, '_');     // Replace spaces with underscores
                return `mask-[${escapedValue}]`;
            } else {
                // Handle arbitrary values with proper escaping
                const escapedValue = value
                    .replace(/\\/g, '\\\\')    // Escape backslashes
                    .replace(/\]/g, '\\]')     // Escape closing brackets
                    .replace(/\[/g, '\\[')     // Escape opening brackets
                    .replace(/"/g, '\\"')      // Escape double quotes
                    .replace(/'/g, "\\'")      // Escape single quotes
                    .replace(/\s+/g, '_');     // Replace spaces with underscores
                return `[mask-image:${escapedValue}]`;
            }
        },        
        'background-repeat': (value) => {
            const repeatMappings = {
                'repeat': 'bg-repeat',
                'no-repeat': 'bg-no-repeat',
                'repeat-x': 'bg-repeat-x',
                'repeat-y': 'bg-repeat-y',
                'round': 'bg-repeat-round',
                'space': 'bg-repeat-space',
            };
            if (repeatMappings[value]) {
                return repeatMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-repeat:${escapedValue}]`;
            }
        },

        'background-position': (value) => {
            const positionMappings = {
                'bottom': 'bg-bottom',
                'center': 'bg-center',
                'left': 'bg-left',
                'left bottom': 'bg-left-bottom',
                'left top': 'bg-left-top',
                'right': 'bg-right',
                'right bottom': 'bg-right-bottom',
                'right top': 'bg-right-top',
                'top': 'bg-top',
            };
            if (positionMappings[value]) {
                return positionMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-position:${escapedValue}]`;
            }
        },

        'background-size': (value) => {
            const sizeMappings = {
                'auto': 'bg-auto',
                'cover': 'bg-cover',
                'contain': 'bg-contain',
            };
            if (sizeMappings[value]) {
                return sizeMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-size:${escapedValue}]`;
            }
        },

        'background-attachment': (value) => {
            const attachmentMappings = {
                'fixed': 'bg-fixed',
                'local': 'bg-local',
                'scroll': 'bg-scroll',
            };
            if (attachmentMappings[value]) {
                return attachmentMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-attachment:${escapedValue}]`;
            }
        },

        'background-origin': (value) => {
            const originMappings = {
                'border-box': 'bg-origin-border',
                'padding-box': 'bg-origin-padding',
                'content-box': 'bg-origin-content',
            };
            if (originMappings[value]) {
                return originMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-origin:${escapedValue}]`;
            }
        },

        'background-clip': (value) => {
            const clipMappings = {
                'border-box': 'bg-clip-border',
                'padding-box': 'bg-clip-padding',
                'content-box': 'bg-clip-content',
                'text': 'bg-clip-text',
            };
            if (clipMappings[value]) {
                return clipMappings[value];
            } else {
                const escapedValue = escapeValue(value);
                return `[background-clip:${escapedValue}]`;
            }
        },
        'clip-path': (value) => {
            let escapedValue = escapeValue(value);
            // Replace spaces with underscores to ensure valid class names
            escapedValue = spacesToUnderscore(escapedValue);
            // Return the Tailwind class using arbitrary value syntax
            return `[clip-path:${escapedValue}]`;
        },
        '-webkit-text-stroke-width': (value) => {
            // Use arbitrary value syntax to apply text stroke width
            let escapedValue = escapeValue(value.trim());
            escapedValue = spacesToUnderscore(escapedValue);
            return `[-webkit-text-stroke-width:${escapedValue}]`;
        },
        '-webkit-text-stroke-color': (value) => {
            // Use arbitrary value syntax to apply text stroke color
            let escapedValue = escapeValue(value.trim());
            escapedValue = spacesToUnderscore(escapedValue);
            return `[-webkit-text-stroke-color:${escapedValue}]`;
        },        
        '-webkit-text-fill-color': (value) => {
          // If it's 'transparent', return Tailwind's 'text-transparent'
          if (value === 'transparent') {
            return 'text-transparent';
          }
          // Otherwise, store as an arbitrary custom property
          const escapedValue = escapeValue(value);
          return `[--webkit-text-fill-color:${escapedValue}]`;
        },
        '-webkit-background-clip': (value) => {
          const clipMappings = {
            'border-box': 'bg-clip-border',
            'padding-box': 'bg-clip-padding',
            'content-box': 'bg-clip-content',
            'text': 'bg-clip-text',
          };
          if (clipMappings[value]) {
            return clipMappings[value];
          } else {
            const escapedValue = escapeValue(value);
            // Could store a custom property or just do arbitrary:
            // [--webkit-background-clip:content-box]
            return `[--webkit-background-clip:${escapedValue}]`;
          }
        },

    };
    // Initialize importantSetting
    let importantSetting = "";
    if (value.includes('!important')) {
        // Remove '!important' and any surrounding whitespace
        value = value.replace(/\s*!important\s*/g, '').trim();
        // Set importantSetting to '!'
        importantSetting = '!';
    }
    
    // Check for vendor prefixes and skip if present
    if (property === '-webkit-text-fill-color' || property === '-webkit-background-clip' ||
         property === '-webkit-text-stroke-color' || property === '-webkit-text-stroke-width') {
      // Handle them specifically below
    } else {
      // For all other vendor prefixes, skip them
      const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
      for (let prefix of vendorPrefixes) {
        if (property.startsWith(prefix)) {
          return null; // Skip these
        }
      }
    }  
    
    const mapping = mappings[property];

    if (mapping) {
        if (typeof mapping === 'function') {
            const tailwindClass = mapping(value);            
            return `${importantSetting}${tailwindClass}`;
        } else if (typeof mapping === 'object') {
            const tailwindClass = mapping[value];
            if (tailwindClass) {
                return `${importantSetting}${tailwindClass}`;
            } else {
                // For unsupported values, use arbitrary value syntax
                return `${importantSetting}[${property}:${value}]`;
            }
        } else {
            return `${importantSetting}${property}-[${value}]`;
        }
    } else {
        consoleLogBuffer("TAILWIND UNSUPPORTED PROPERTY FOUND------");
        consoleLogBuffer(property);
        // Use arbitrary property notation for unsupported properties
        const tailwindProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return `${importantSetting}${tailwindProperty}-[${value}]`;
    }
  }
  catch (error) {
        consoleLogBuffer("cssToTailwind error for property, val");
        consoleLogBuffer(property);
        consoleLogBuffer(value);
        console.error(error);
        return null;
  }  
}



//special case for margin or padding to get best classes
function getBestTailwindClasses(property, pOverwritten) {
    // property is 'margin' or 'padding'
    // pOverwritten is an object with keys like 'margin-top', 'margin-right', etc., and their values

    // Define the sides
    const sides = ['top', 'right', 'bottom', 'left'];

    // Map of side to value
    const sideValues = sides.reduce((acc, side) => {
        acc[side] = pOverwritten[`${property}-${side}`];
        return acc;
    }, {});

    // Extract the values for easy comparison
    const values = sides.map(side => sideValues[side]);

    // Check if all values are the same
    const allSame = values.every(val => val === values[0]);

    let tailClasses = [];

    // Function to map CSS value to Tailwind value
    function mapValueToTailwind(value) {
        if (value === '0' || value === '0px') {
            return '0';
        }              
        // Tailwind's default spacing scale in pixels
        const tailwindSpacingScale = {
            '0px': '0',
            '0.125rem': '0.5',    // 2px
            '0.25rem': '1',       // 4px
            '0.375rem': '1.5',    // 6px
            '0.5rem': '2',        // 8px
            '0.625rem': '2.5',    // 10px
            '0.75rem': '3',       // 12px
            '0.875rem': '3.5',    // 14px
            '1rem': '4',          // 16px
            '1.25rem': '5',       // 20px
            '1.5rem': '6',        // 24px
            '1.75rem': '7',       // 28px
            '2rem': '8',          // 32px
            '2.25rem': '9',       // 36px
            '2.5rem': '10',       // 40px
            '2.75rem': '11',      // 44px
            '3rem': '12',         // 48px
            '3.5rem': '14',       // 56px
            '4rem': '16',         // 64px
            '5rem': '20',         // 80px
            '6rem': '24',         // 96px
            '7rem': '28',         // 112px
            '8rem': '32',         // 128px
            '9rem': '36',         // 144px
            '10rem': '40',        // 160px
            '11rem': '44',        // 176px
            '12rem': '48',        // 192px
            '13rem': '52',        // 208px
            '14rem': '56',        // 224px
            '15rem': '60',        // 240px
            '16rem': '64',        // 256px
            '18rem': '72',        // 288px
            '20rem': '80',        // 320px
            '24rem': '96'         // 384px
        };

        // Handle 'auto' value
        if (value === 'auto') {
            return 'auto';
        }

        // Convert the value to rem if it's in pixels
        let remValue = value;
        if (value.endsWith('px')) {
            const pixels = parseFloat(value.replace('px', ''));
            remValue = `${pixels / 16}rem`;
        } else if (value.endsWith('rem')) {
            remValue = value;
        } else {
            // If the unit is not px or rem, use arbitrary value
            return `[${value}]`;
        }

        // Check if remValue exists in the spacing scale
        const tailwindValue = tailwindSpacingScale[remValue];

        if (tailwindValue) {
            return tailwindValue;
        } else {
            // Use arbitrary value syntax
            return `[${value}]`;
        }
    }

    // Function to generate Tailwind class
    function generateTailwindClass(prefix, value) {
        const tailwindValue = mapValueToTailwind(value);
        if (tailwindValue === 'auto') {
            return `${prefix}-auto`;
        } else {
            return `${prefix}-${tailwindValue}`;
        }
    }

    if (allSame) {
        // All sides have the same value
        const tailwindClass = generateTailwindClass(property === 'margin' ? 'm' : 'p', values[0]);
        tailClasses.push(tailwindClass);
    } else {
        const topBottomSame = sideValues.top === sideValues.bottom;
        const leftRightSame = sideValues.left === sideValues.right;

        if (topBottomSame && leftRightSame) {
            // Use 'my-' and 'mx-' classes
            const myClass = generateTailwindClass(property === 'margin' ? 'my' : 'py', sideValues.top);
            const mxClass = generateTailwindClass(property === 'margin' ? 'mx' : 'px', sideValues.left);
            tailClasses.push(myClass, mxClass);
        } else {
            // Handle top and bottom
            if (topBottomSame) {
                const myClass = generateTailwindClass(property === 'margin' ? 'my' : 'py', sideValues.top);
                tailClasses.push(myClass);
            } else {
                const mtClass = generateTailwindClass(property === 'margin' ? 'mt' : 'pt', sideValues.top);
                const mbClass = generateTailwindClass(property === 'margin' ? 'mb' : 'pb', sideValues.bottom);
                tailClasses.push(mtClass, mbClass);
            }

            // Handle left and right
            if (leftRightSame) {
                const mxClass = generateTailwindClass(property === 'margin' ? 'mx' : 'px', sideValues.left);
                tailClasses.push(mxClass);
            } else {
                const mrClass = generateTailwindClass(property === 'margin' ? 'mr' : 'pr', sideValues.right);
                const mlClass = generateTailwindClass(property === 'margin' ? 'ml' : 'pl', sideValues.left);
                tailClasses.push(mrClass, mlClass);
            }
        }
    }

    return tailClasses;
}


//CLAAAAAAAAAAAAAAAAAAAAUDE 
function getTransformClasses(value) {
   const trimmedValue = value.trim();
   if (trimmedValue === 'none') {
       return ['transform-none'];
   }

   const transforms = trimmedValue.match(/(\w+\([^)]+\))/gi);
   if (!transforms) {
       return [`[transform:${escapeValue(trimmedValue)}]`];
   }

   const classes = [];
   transforms.forEach(transform => {
       const match = transform.match(/(\w+)\(([^)]+)\)/i);
       if (!match) {
           let escapedValue = escapeValue(transform.trim());
           escapedValue = spacesToUnderscore(escapedValue);            
           classes.push(`[transform:${escapedValue}]`);
           return;
       }

       const [_, func, val] = match;
       const numericValue = parseFloat(val);
       const unit = val.replace(numericValue.toString(), '');
       const funcLower = func.toLowerCase();

       switch (funcLower) {
            case 'translate': {
                const values = val.split(',').map(v => v.trim());
                if (values.length === 2) {
                    const [xVal, yVal] = values;
                    const xNumeric = parseFloat(xVal);
                    const yNumeric = parseFloat(yVal);

                    // Handle common -50%, -50% case
                    if (xVal === '-50%' && yVal === '-50%') {
                        classes.push('-translate-x-1/2', '-translate-y-1/2');
                        break;
                    }

                    // Handle other percentage values
                    if (xVal.includes('%') && yVal.includes('%')) {
                        if (xNumeric === 50) {
                            classes.push('translate-x-1/2');
                        } else if (xNumeric === -50) {
                            classes.push('-translate-x-1/2');
                        } else if (xNumeric === 100) {
                            classes.push('translate-x-full');
                        } else if (xNumeric === -100) {
                            classes.push('-translate-x-full');
                        } else if (xNumeric < 0) {
                            classes.push(`-translate-x-[${Math.abs(xNumeric)}%]`);
                        } else {
                            classes.push(`translate-x-[${xVal}]`);
                        }

                        if (yNumeric === 50) {
                            classes.push('translate-y-1/2');
                        } else if (yNumeric === -50) {
                            classes.push('-translate-y-1/2');
                        } else if (yNumeric === 100) {
                            classes.push('translate-y-full');
                        } else if (yNumeric === -100) {
                            classes.push('-translate-y-full');
                        } else if (yNumeric < 0) {
                            classes.push(`-translate-y-[${Math.abs(yNumeric)}%]`);
                        } else {
                            classes.push(`translate-y-[${yVal}]`);
                        }
                        break;
                    }

                    // Handle pixel values or mixed units
                    if (xNumeric < 0) {
                        classes.push(`-translate-x-[${Math.abs(xNumeric)}${xVal.replace(xNumeric.toString(), '')}]`);
                    } else {
                        classes.push(`translate-x-[${xVal}]`);
                    }

                    if (yNumeric < 0) {
                        classes.push(`-translate-y-[${Math.abs(yNumeric)}${yVal.replace(yNumeric.toString(), '')}]`);
                    } else {
                        classes.push(`translate-y-[${yVal}]`);
                    }
                    break;
                }
                let escapedValue = escapeValue(val.trim());
                escapedValue = spacesToUnderscore(escapedValue);  
                // Fallback for single value or invalid format
                classes.push(`translate-[${escapedValue}]`);
                break;
           }           
           case 'translatex': {
               // Handle percentage values
               if (val.includes('%')) {
                   const percentValue = numericValue;
                   if (percentValue === -50) {
                       classes.push('-translate-x-1/2');
                       break;
                   }
                   if (percentValue === 50) {
                       classes.push('translate-x-1/2');
                       break;
                   }
                   if (percentValue === -100) {
                       classes.push('-translate-x-full');
                       break;
                   }
                   if (percentValue === 100) {
                       classes.push('translate-x-full');
                       break;
                   }
               }
               // Handle pixel values
               if (unit === 'px') {
                   if (numericValue === 0) {
                       classes.push('translate-x-0');
                       break;
                   }
                   if (numericValue === 1) {
                       classes.push('translate-x-1');
                       break;
                   }
                   if (numericValue === 2) {
                       classes.push('translate-x-2');
                       break;
                   }
                   if (numericValue === 4) {
                       classes.push('translate-x-4');
                       break;
                   }
                   if (numericValue === 6) {
                       classes.push('translate-x-6');
                       break;
                   }
                   if (numericValue === 8) {
                       classes.push('translate-x-8');
                       break;
                   }
                   if (numericValue === 10) {
                       classes.push('translate-x-10');
                       break;
                   }
                   if (numericValue === 12) {
                       classes.push('translate-x-12');
                       break;
                   }
                   if (numericValue === 16) {
                       classes.push('translate-x-16');
                       break;
                   }
                   // Negative values
                   if (numericValue === -1) {
                       classes.push('-translate-x-1');
                       break;
                   }
                   if (numericValue === -2) {
                       classes.push('-translate-x-2');
                       break;
                   }
                   if (numericValue === -4) {
                       classes.push('-translate-x-4');
                       break;
                   }
                   if (numericValue === -6) {
                       classes.push('-translate-x-6');
                       break;
                   }
                   if (numericValue === -8) {
                       classes.push('-translate-x-8');
                       break;
                   }
                   if (numericValue === -10) {
                       classes.push('-translate-x-10');
                       break;
                   }
                   if (numericValue === -12) {
                       classes.push('-translate-x-12');
                       break;
                   }
                   if (numericValue === -16) {
                       classes.push('-translate-x-16');
                       break;
                   }
               }
               // Fallback to arbitrary value
                if (numericValue < 0) {
                    classes.push(`-translate-x-[${Math.abs(numericValue)}${unit}]`);
                } else {
                    classes.push(`translate-x-[${val}]`);
                }
               break;
           }
           case 'translatey': {
               if (val.includes('%')) {
                   const percentValue = numericValue;
                   if (percentValue === -50) {
                       classes.push('-translate-y-1/2');
                       break;
                   }
                   if (percentValue === 50) {
                       classes.push('translate-y-1/2');
                       break;
                   }
                   if (percentValue === -100) {
                       classes.push('-translate-y-full');
                       break;
                   }
                   if (percentValue === 100) {
                       classes.push('translate-y-full');
                       break;
                   }
               }
               if (unit === 'px') {
                   if (numericValue === 0) {
                       classes.push('translate-y-0');
                       break;
                   }
                   if (numericValue === 1) {
                       classes.push('translate-y-1');
                       break;
                   }
                   if (numericValue === 2) {
                       classes.push('translate-y-2');
                       break;
                   }
                   if (numericValue === 4) {
                       classes.push('translate-y-4');
                       break;
                   }
                   if (numericValue === 6) {
                       classes.push('translate-y-6');
                       break;
                   }
                   if (numericValue === 8) {
                       classes.push('translate-y-8');
                       break;
                   }
                   if (numericValue === 10) {
                       classes.push('translate-y-10');
                       break;
                   }
                   if (numericValue === 12) {
                       classes.push('translate-y-12');
                       break;
                   }
                   if (numericValue === 16) {
                       classes.push('translate-y-16');
                       break;
                   }
                   if (numericValue === -1) {
                       classes.push('-translate-y-1');
                       break;
                   }
                   if (numericValue === -2) {
                       classes.push('-translate-y-2');
                       break;
                   }
                   if (numericValue === -4) {
                       classes.push('-translate-y-4');
                       break;
                   }
                   if (numericValue === -6) {
                       classes.push('-translate-y-6');
                       break;
                   }
                   if (numericValue === -8) {
                       classes.push('-translate-y-8');
                       break;
                   }
                   if (numericValue === -10) {
                       classes.push('-translate-y-10');
                       break;
                   }
                   if (numericValue === -12) {
                       classes.push('-translate-y-12');
                       break;
                   }
                   if (numericValue === -16) {
                       classes.push('-translate-y-16');
                       break;
                   }
               }
                if (numericValue < 0) {
                    classes.push(`-translate-y-[${Math.abs(numericValue)}${unit}]`);
                } else {
                    classes.push(`translate-y-[${val}]`);
                }
               break;
           }
           case 'rotate': {
               const deg = parseFloat(val);
               if (deg === 0) {
                   classes.push('rotate-0');
                   break;
               }
               if (deg === 45) {
                   classes.push('rotate-45');
                   break;
               }
               if (deg === 90) {
                   classes.push('rotate-90');
                   break;
               }
               if (deg === 180) {
                   classes.push('rotate-180');
                   break;
               }
               if (deg === -45) {
                   classes.push('-rotate-45');
                   break;
               }
               if (deg === -90) {
                   classes.push('-rotate-90');
                   break;
               }
               if (deg === -180) {
                   classes.push('-rotate-180');
                   break;
               }
               classes.push(`rotate-[${val}]`);
               break;
           }
           case 'scale': {
               const scale = parseFloat(val);
               if (scale === 0) {
                   classes.push('scale-0');
                   break;
               }
               if (scale === 0.5) {
                   classes.push('scale-50');
                   break;
               }
               if (scale === 0.75) {
                   classes.push('scale-75');
                   break;
               }
               if (scale === 1) {
                   classes.push('scale-100');
                   break;
               }
               if (scale === 1.25) {
                   classes.push('scale-125');
                   break;
               }
               if (scale === 1.5) {
                   classes.push('scale-150');
                   break;
               }
               classes.push(`scale-[${val}]`);
               break;
           }
           case 'skewx': {
               const deg = parseFloat(val);
               if (deg === 0) {
                   classes.push('skew-x-0');
                   break;
               }
               if (deg === 1) {
                   classes.push('skew-x-1');
                   break;
               }
               if (deg === 2) {
                   classes.push('skew-x-2');
                   break;
               }
               if (deg === 3) {
                   classes.push('skew-x-3');
                   break;
               }
               if (deg === 6) {
                   classes.push('skew-x-6');
                   break;
               }
               if (deg === 12) {
                   classes.push('skew-x-12');
                   break;
               }
               classes.push(`skew-x-[${val}]`);
               break;
           }
           case 'skewy': {
               const deg = parseFloat(val);
               if (deg === 0) {
                   classes.push('skew-y-0');
                   break;
               }
               if (deg === 1) {
                   classes.push('skew-y-1');
                   break;
               }
               if (deg === 2) {
                   classes.push('skew-y-2');
                   break;
               }
               if (deg === 3) {
                   classes.push('skew-y-3');
                   break;
               }
               if (deg === 6) {
                   classes.push('skew-y-6');
                   break;
               }
               if (deg === 12) {
                   classes.push('skew-y-12');
                   break;
               }
               classes.push(`skew-y-[${val}]`);
               break;
           }
           default:
               classes.push(`transform-[${func}(${val})]`);
               break;
       }
   });
   
   if(classes.length > 1 && hasConflictingTransforms(classes)){
       return getMultipleTransformClasses(value);
   }
   return classes;
}

function hasConflictingTransforms(classes) {
    // Group transforms by type
    const transformTypes = {
        scale: [],
        scaleX: [],
        scaleY: [],
        // Other transforms that need to be combined if multiple instances exist
    };
    
    for (const cls of classes) {
        if (cls.includes('scale-') && !cls.includes('scale-x-') && !cls.includes('scale-y-')) {
            transformTypes.scale.push(cls);
        } else if (cls.includes('scale-x-')) {
            transformTypes.scaleX.push(cls);
        } else if (cls.includes('scale-y-')) {
            transformTypes.scaleY.push(cls);
        }
    }

    // Check if any transform type has multiple values
    return Object.values(transformTypes).some(group => group.length > 1);
}

function getMultipleTransformClasses(value) {
  const trimmedValue = value.trim();
  if (trimmedValue === 'none') {
    return ['transform-none'];
  }

  const transforms = trimmedValue.match(/(\w+\([^)]+\))/gi);
  if (!transforms) {
    let escapedValue = escapeValue(trimmedValue);
    escapedValue = spacesToUnderscore(escapedValue);      
    return [`[transform:${escapedValue}]`];
  }

  // Collect all transform functions into an array
  const transformFunctions = [];

  transforms.forEach(transform => {
    const match = transform.match(/(\w+)\(([^)]+)\)/i);
    if (!match) {
      transformFunctions.push(transform.trim());
      return;
    }

    const [_, func, val] = match;
    const funcLower = func.toLowerCase();
    const valTrimmed = val.trim();

    // Add the transform function to the array
    let escapedValue = escapeValue(valTrimmed);
    escapedValue = spacesToUnderscore(escapedValue);
    
    transformFunctions.push(`${func}(${escapedValue})`);
  });

  // Combine all transform functions into a single string
  const combinedTransform = transformFunctions.join('_');

  // Return a single [transform:...] class
  return [`[transform:${combinedTransform}]`];
}

function getFilterClasses(value, isBackdrop = false) {
    const prefix = isBackdrop ? 'backdrop-' : 'filter-';
    const trimmedValue = value.trim();
    
    if (trimmedValue === 'none') {
        return [`${prefix}none`];
    }

    // Handle multiple filter functions
    const filters = trimmedValue.match(/(\w+\([^)]+\))/gi);
    if (!filters) {
        return [`${prefix}[${escapeValue(trimmedValue)}]`];
    }

    const classes = [];
    filters.forEach(filter => {
        const match = filter.match(/(\w+)-?(\w+)?\(([^)]+)\)/i);
        if (!match) {
            classes.push(`${prefix}[${escapeValue(filter.trim())}]`);
            return;
        }

        // Adjusted to capture possible hyphenated functions like 'hue-rotate'
        const [_, func, subFunc, val] = match;
        const fullFunc = subFunc ? `${func}-${subFunc}` : func;
        const numericValue = parseFloat(val);
        const funcLower = fullFunc.toLowerCase();

        switch (funcLower) {
            case 'grayscale':
                if (numericValue === 100 || val === '1') {
                    classes.push(`${prefix}grayscale`);
                } else if (numericValue === 0) {
                    classes.push(`${prefix}grayscale-0`);
                } else {
                    classes.push(`${prefix}grayscale-[${val}]`);
                }
                break;
            case 'invert':
                if (numericValue === 100 || val === '1') {
                    classes.push(`${prefix}invert`);
                } else if (numericValue === 0) {
                    classes.push(`${prefix}invert-0`);
                } else {
                    classes.push(`${prefix}invert-[${val}]`);
                }
                break;
            case 'sepia':
                if (numericValue === 100 || val === '1') {
                    classes.push(`${prefix}sepia`);
                } else if (numericValue === 0) {
                    classes.push(`${prefix}sepia-0`);
                } else {
                    classes.push(`${prefix}sepia-[${val}]`);
                }
                break;
            case 'blur':
                if (val === '0px' || val === '0') {
                    classes.push(`${prefix}blur-none`);
                } else if (val === '8px') {
                    classes.push(`${prefix}blur`);
                } else {
                    classes.push(`${prefix}blur-[${val}]`);
                }
                break;
            case 'brightness':
                if (numericValue === 0) classes.push(`${prefix}brightness-0`);
                else if (numericValue === 50) classes.push(`${prefix}brightness-50`);
                else if (numericValue === 75) classes.push(`${prefix}brightness-75`);
                else if (numericValue === 90) classes.push(`${prefix}brightness-90`);
                else if (numericValue === 95) classes.push(`${prefix}brightness-95`);
                else if (numericValue === 100) classes.push(`${prefix}brightness-100`);
                else if (numericValue === 105) classes.push(`${prefix}brightness-105`);
                else if (numericValue === 110) classes.push(`${prefix}brightness-110`);
                else if (numericValue === 125) classes.push(`${prefix}brightness-125`);
                else if (numericValue === 150) classes.push(`${prefix}brightness-150`);
                else if (numericValue === 200) classes.push(`${prefix}brightness-200`);
                else classes.push(`${prefix}brightness-[${val}]`);
                break;
            case 'contrast':
                if (numericValue === 0) classes.push(`${prefix}contrast-0`);
                else if (numericValue === 50) classes.push(`${prefix}contrast-50`);
                else if (numericValue === 75) classes.push(`${prefix}contrast-75`);
                else if (numericValue === 100) classes.push(`${prefix}contrast-100`);
                else if (numericValue === 125) classes.push(`${prefix}contrast-125`);
                else if (numericValue === 150) classes.push(`${prefix}contrast-150`);
                else if (numericValue === 200) classes.push(`${prefix}contrast-200`);
                else classes.push(`${prefix}contrast-[${val}]`);
                break;
            case 'saturate':
                if (numericValue === 0) classes.push(`${prefix}saturate-0`);
                else if (numericValue === 50) classes.push(`${prefix}saturate-50`);
                else if (numericValue === 100) classes.push(`${prefix}saturate-100`);
                else if (numericValue === 150) classes.push(`${prefix}saturate-150`);
                else if (numericValue === 200) classes.push(`${prefix}saturate-200`);
                else classes.push(`${prefix}saturate-[${val}]`);
                break;
            case 'hue-rotate':
                if (val === '0deg') classes.push(`${prefix}hue-rotate-0`);
                else if (val === '15deg') classes.push(`${prefix}hue-rotate-15`);
                else if (val === '30deg') classes.push(`${prefix}hue-rotate-30`);
                else if (val === '60deg') classes.push(`${prefix}hue-rotate-60`);
                else if (val === '90deg') classes.push(`${prefix}hue-rotate-90`);
                else if (val === '180deg') classes.push(`${prefix}hue-rotate-180`);
                else classes.push(`${prefix}hue-rotate-[${val}]`);
                break;
            default:
                classes.push(`${prefix}[${func}(${val})]`);
                break;
        }
    });

    return classes;
}


function getFontClasses(value) {
    const trimmedValue = value.trim();
    if (trimmedValue === 'inherit' || trimmedValue === 'initial' || trimmedValue === 'unset') {
        return [`font-${trimmedValue}`];
    }

    // Helper functions
    function tokenizeFontValue(value) {
        const tokens = [];
        let currentToken = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < value.length; i++) {
            const c = value[i];
            if (c === '"' || c === "'") {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = c;
                    currentToken += c;
                } else if (c === quoteChar) {
                    inQuotes = false;
                    currentToken += c;
                    tokens.push(currentToken.trim());
                    currentToken = '';
                } else {
                    currentToken += c;
                }
            } else if (c === ' ' && !inQuotes) {
                if (currentToken.trim()) {
                    tokens.push(currentToken.trim());
                    currentToken = '';
                }
            } else {
                currentToken += c;
            }
        }
        if (currentToken.trim()) {
            tokens.push(currentToken.trim());
        }
        return tokens;
    }

    const tokens = tokenizeFontValue(trimmedValue);

    let fontStyle = null;
    let fontVariant = null;
    let fontWeight = null;
    let fontStretch = null;
    let fontSize = null;
    let lineHeight = null;
    let fontFamily = null;

    const fontStyles = ['normal', 'italic', 'oblique'];
    const fontVariants = ['normal', 'small-caps'];
    const fontWeights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    const fontStretches = ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];

    let reachedFontSize = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (!reachedFontSize) {
            if (fontStyles.includes(token.toLowerCase()) && !fontStyle) {
                fontStyle = token.toLowerCase();
            } else if (fontVariants.includes(token.toLowerCase()) && !fontVariant) {
                fontVariant = token.toLowerCase();
            } else if (fontWeights.includes(token.toLowerCase()) && !fontWeight) {
                fontWeight = token.toLowerCase();
            } else if (fontStretches.includes(token.toLowerCase()) && !fontStretch) {
                fontStretch = token.toLowerCase();
            } else {
                // Assume this is font-size (possibly with line-height)
                // Check if token contains '/'
                const fontSizeParts = token.split('/');
                fontSize = fontSizeParts[0];
                if (fontSizeParts.length > 1) {
                    lineHeight = fontSizeParts[1];
                } else if (tokens[i+1] === '/') {
                    lineHeight = tokens[i+2];
                    i += 2; // skip the '/' and the line-height token
                }
                reachedFontSize = true;
            }
        } else {
            // Remaining tokens are font-family
            const remainingTokens = tokens.slice(i).join(' ');
            fontFamily = remainingTokens.trim();
            break;
        }
    }

    // Now map the extracted values to Tailwind classes
    const classes = [];

    // font-style
    if (fontStyle === 'italic') {
        classes.push('italic');
    } else if (fontStyle === 'normal') {
        classes.push('not-italic');
    } else if (fontStyle === 'oblique') {
        classes.push('italic'); // Tailwind doesn't have 'oblique', so map to 'italic'
    }

    // font-variant
    if (fontVariant === 'small-caps') {
        classes.push('font-variant-[small-caps]'); // Tailwind doesn't have a built-in class for 'small-caps'
    }

    // font-weight
    if (fontWeight) {
        const fontWeightMap = {
            '100': 'font-thin',
            '200': 'font-extralight',
            '300': 'font-light',
            '400': 'font-normal',
            '500': 'font-medium',
            '600': 'font-semibold',
            '700': 'font-bold',
            '800': 'font-extrabold',
            '900': 'font-black',
            'normal': 'font-normal',
            'bold': 'font-bold',
            'bolder': 'font-bold', // Closest match
            'lighter': 'font-light', // Closest match
        };
        const tailwindFontWeight = fontWeightMap[fontWeight.toLowerCase()];
        if (tailwindFontWeight) {
            classes.push(tailwindFontWeight);
        } else {
            // Use arbitrary value
            classes.push(`font-[${escapeValue(fontWeight)}]`);
        }
    }

    // font-size
    if (fontSize) {
        const tailwindFontSizeMap = {
            'xx-small': 'text-[xx-small]',
            'x-small': 'text-xs',
            'small': 'text-sm',
            'medium': 'text-base',
            'large': 'text-lg',
            'x-large': 'text-xl',
            'xx-large': 'text-2xl',
            'xxx-large': 'text-3xl',
            'smaller': 'text-sm',
            'larger': 'text-lg',
        };

        const fontSizeLower = fontSize.toLowerCase();

        const tailwindFontSize = tailwindFontSizeMap[fontSizeLower];

        if (tailwindFontSize) {
            classes.push(tailwindFontSize);
        } else {
            // Handle sizes in px, rem, em, etc.
            const sizeMatch = fontSize.match(/^([0-9.]+)(px|rem|em|%)?$/);
            if (sizeMatch) {
                // Use arbitrary value with units
                let escapedValue = escapeValue(fontSize);
                escapedValue = spacesToUnderscore(escapedValue);                
                classes.push(`text-[${escapedValue}]`);
            } else {
                // Can't parse font-size, use arbitrary value
                let escapedValue = escapeValue(fontSize);
                escapedValue = spacesToUnderscore(escapedValue);                  
                classes.push(`text-[${escapedValue}]`);
            }
        }
    }

    // line-height
    if (lineHeight) {
        const tailwindLineHeightMap = {
            'normal': 'leading-normal',
            'none': 'leading-none',
            'tight': 'leading-tight',
            'snug': 'leading-snug',
            'relaxed': 'leading-relaxed',
            'loose': 'leading-loose',
            '3': 'leading-3',
            '4': 'leading-4',
            '5': 'leading-5',
            '6': 'leading-6',
            '7': 'leading-7',
            '8': 'leading-8',
            '9': 'leading-9',
            '10': 'leading-10',
        };

        const lineHeightLower = lineHeight.toLowerCase();

        const tailwindLineHeight = tailwindLineHeightMap[lineHeightLower];

        if (tailwindLineHeight) {
            classes.push(tailwindLineHeight);
        } else {
            // Use arbitrary value
            let escapedValue = escapeValue(lineHeight);
            escapedValue = spacesToUnderscore(escapedValue);             
            classes.push(`leading-[${escapedValue}]`);
        }
    }

    // font-family
    if (fontFamily) {
        // Tailwind provides 'font-sans', 'font-serif', 'font-mono'
        const fontFamilyMap = {
            'sans-serif': 'font-sans',
            'serif': 'font-serif',
            'monospace': 'font-mono',
            'system-ui': 'font-sans',
        };

        const fontFamilyNames = fontFamily.split(',');
        let fontFamilyClassAdded = false;

        for (let i = 0; i < fontFamilyNames.length; i++) {
            let familyName = fontFamilyNames[i].trim();
            if ((familyName.startsWith('"') && familyName.endsWith('"')) || (familyName.startsWith("'") && familyName.endsWith("'"))) {
                familyName = familyName.slice(1, -1);
            }

            const familyNameLower = familyName.toLowerCase();

            if (fontFamilyMap[familyNameLower]) {
                classes.push(fontFamilyMap[familyNameLower]);
                fontFamilyClassAdded = true;
                break;
            }
        }

        if (!fontFamilyClassAdded) {
            // Use the first font-family as arbitrary value
            const firstFamilyName = fontFamilyNames[0].trim();
            const escapedFontFamily = escapeValue(firstFamilyName);
            escapedFontFamily = spacesToUnderscore(escapedFontFamily);              
            const fontFamilyClass = `font-[${escapedFontFamily}]`;
            classes.push(fontFamilyClass);
        }
    }

    return classes;
}
