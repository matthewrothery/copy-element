
const passedDownProps = ["font","font-family","font-size","font-weight","font-style","font-variant","font-stretch",
    "font-size-adjust","font-kerning","font-feature-settings","font-variation-settings","font-optical-sizing","font-synthesis",
    "font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric",
    "font-variant-position","color","line-height","text-align","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style",
    "text-decoration-thickness","text-underline-offset","text-indent","text-transform","text-shadow","text-overflow","text-size-adjust","text-rendering",
    "letter-spacing","word-spacing","white-space","direction","unicode-bidi","writing-mode","hyphens","tab-size","list-style","list-style-type",
    "list-style-position","list-style-image","cursor","visibility","opacity","quotes","orphans","widows","user-select","pointer-events"];

const shorthandToLonghand = {
  'background': [
    'background-color',
    'background-image',
    'background-repeat',
    'background-attachment',
    'background-position',
    'background-size',
    'background-origin',
    'background-clip',
  ],
  'flex-flow': [
      'flex-direction',
      'flex-wrap'
  ],
  'grid-column': [
      'grid-column-start',
      'grid-column-end'
  ],
  'grid-row': [
        'grid-row-start',
        'grid-row-end'
   ],  
  'border': ['border-width', 'border-style', 'border-color'],
  'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],  
  'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  'place-self': ['align-self', 'justify-self'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'transition': [
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
  ],  
  'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
};

//DO NOT put margin or padding here ^^^^ 
//They are expandable but will not be treated as that so can optimize which classes to apply

function getPropertyType(propertyName) {
  // Check if the property is a shorthand property
  if (propertyName in shorthandToLonghand) {
      return {'type': 'short', 'short': propertyName, 'long': ''};
  }

  // Check if the property is a longhand property
  for (let shorthand in shorthandToLonghand) {
    if (shorthandToLonghand[shorthand].includes(propertyName)) {
      return {'type': 'long', 'short': shorthand, 'long': propertyName};
    }
  }

  // If the property is neither shorthand nor longhand, it's unique
  return {'type': 'unique', 'short': propertyName, 'long': propertyName};
}

// Define a mapping of shorthand properties to their longhand counterparts
const fullshorthandToLonghand = {
  'border': ['border-width', 'border-style', 'border-color'],
  'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],
  'background': [
    'background-color',
    'background-image',
    'background-repeat',
    'background-attachment',
    'background-position',
    'background-size',
    'background-origin',
    'background-clip',
  ],
  'font': [
    'font-style',
    'font-variant',
    'font-weight',
    'font-stretch',
    'font-size',
    'line-height',
    'font-family',
  ],
  'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
  'transition': [
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
  ],
  'animation': [
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
  ],
  'flex': ['flex-grow', 'flex-shrink', 'flex-basis'],
  'outline': ['outline-width', 'outline-style', 'outline-color'],
  'border-radius': [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ],
  'text-decoration': [
    'text-decoration-line',
    'text-decoration-color',
    'text-decoration-style',
    'text-decoration-thickness',
  ],
  'columns': ['column-width', 'column-count'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self'],
  'overflow': ['overflow-x', 'overflow-y'],
  'inset': ['top', 'right', 'bottom', 'left'],
  'gap': ['row-gap', 'column-gap'],

  // Additional Shorthand Properties:

  // Border Image
  'border-image': [
    'border-image-source',
    'border-image-slice',
    'border-image-width',
    'border-image-outset',
    'border-image-repeat',
  ],

  // Scroll Margin
  'scroll-margin': [
    'scroll-margin-top',
    'scroll-margin-right',
    'scroll-margin-bottom',
    'scroll-margin-left',
  ],

  // Scroll Padding
  'scroll-padding': [
    'scroll-padding-top',
    'scroll-padding-right',
    'scroll-padding-bottom',
    'scroll-padding-left',
  ],

  // Grid
  'grid': [
    'grid-template-rows',
    'grid-template-columns',
    'grid-template-areas',
    'grid-auto-rows',
    'grid-auto-columns',
    'grid-auto-flow',
  ],

  // Grid Template
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],

  // Grid Area
  'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],

  // Grid Column
  'grid-column': ['grid-column-start', 'grid-column-end'],

  // Grid Row
  'grid-row': ['grid-row-start', 'grid-row-end'],

  // Flex Flow
  'flex-flow': ['flex-direction', 'flex-wrap'],

  // Border Block
  'border-block': ['border-block-start', 'border-block-end'],

  // Border Inline
  'border-inline': ['border-inline-start', 'border-inline-end'],
  'offset': [
    'offset-anchor',
    'offset-distance',
    'offset-path',
    'offset-position',
    'offset-rotate',
  ],
  'column-rule': ['column-rule-width', 'column-rule-style', 'column-rule-color'],
  'mask': [
    'mask-image',
    'mask-mode',
    'mask-position',
    'mask-size',
    'mask-repeat',
    'mask-origin',
    'mask-clip',
    'mask-composite',
  ],
  'font-variant': [
    'font-variant-ligatures',
    'font-variant-alternates',
    'font-variant-caps',
    'font-variant-numeric',
    'font-variant-east-asian',
  ],
  'border-width': [
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
  ],
  'border-style': [
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
  ],
  'border-color': [
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ],
  'scroll-snap-type': ['scroll-snap-type-x', 'scroll-snap-type-y'],
  'text-emphasis': ['text-emphasis-style', 'text-emphasis-color'],
  'transition': [
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
  ],
  'border-block-start': ['border-block-start-width', 'border-block-start-style', 'border-block-start-color'],
  'border-block-end': ['border-block-end-width', 'border-block-end-style', 'border-block-end-color'],
  'border-inline-start': ['border-inline-start-width', 'border-inline-start-style', 'border-inline-start-color'],
  'border-inline-end': ['border-inline-end-width', 'border-inline-end-style', 'border-inline-end-color'],
  'padding-block': ['padding-block-start', 'padding-block-end'],
  'padding-inline': ['padding-inline-start', 'padding-inline-end'],
  'margin-block': ['margin-block-start', 'margin-block-end'],
  'margin-inline': ['margin-inline-start', 'margin-inline-end'],
};


// Function to expand shorthand properties
function expandShorthandProperty(property, value) {
  // Define all possible background longform properties that get overwritten
    if (property === 'background') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Split the value into layers, considering commas outside of parentheses
        let layers = [];
        let currentLayer = '';
        let parenCount = 0;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];

            if (char === '(') {
                parenCount++;
                currentLayer += char;
            } else if (char === ')') {
                parenCount--;
                currentLayer += char;
            } else if (char === ',' && parenCount === 0) {
                layers.push(currentLayer.trim());
                currentLayer = '';
            } else {
                currentLayer += char;
            }
        }
        if (currentLayer.trim()) layers.push(currentLayer.trim());

        // Detect conflicts: if there are multiple layers, we might have conflicts
        let hasConflict = layers.length > 1;

        // Initialize property arrays to collect multiple values
        const bgImages = [];
        const bgColors = [];
        const bgRepeats = [];
        const bgAttachments = [];
        const bgPositions = [];
        const bgSizes = [];
        const bgOrigins = [];
        const bgClips = [];

        // Process each layer
        layers.forEach(layer => {
            // Tokenize the layer while respecting parentheses
            let tokens = [];
            let currentToken = '';
            let parenCount = 0;

            for (let i = 0; i < layer.length; i++) {
                const char = layer[i];

                if (char === '(') {
                    parenCount++;
                    currentToken += char;
                } else if (char === ')') {
                    parenCount--;
                    currentToken += char;
                    if (parenCount === 0) {
                        tokens.push(currentToken.trim());
                        currentToken = '';
                    }
                } else if (parenCount === 0 && /\s/.test(char)) {
                    if (currentToken.trim()) tokens.push(currentToken.trim());
                    currentToken = '';
                } else if (parenCount === 0 && char === '/') {
                    if (currentToken.trim()) tokens.push(currentToken.trim());
                    tokens.push('/');
                    currentToken = '';
                } else {
                    currentToken += char;
                }
            }
            if (currentToken.trim()) tokens.push(currentToken.trim());

            // Variables to hold properties for this layer
            let layerImage = '';
            let layerColor = '';
            let layerRepeat = '';
            let layerAttachment = '';
            let layerPosition = '';
            let layerSize = '';
            let layerOrigin = '';
            let layerClip = '';
            let isAfterSlash = false;

            // Possible values
            const repeatValues = ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'];
            const attachmentValues = ['scroll', 'fixed', 'local'];
            const positionKeywords = ['left', 'center', 'right', 'top', 'bottom'];
            const sizeValues = ['auto', 'cover', 'contain'];
            const boxValues = ['border-box', 'padding-box', 'content-box'];

            let i = 0;
            while (i < tokens.length) {
                const token = tokens[i];
                if (token === '/') {
                    isAfterSlash = true;
                    i++;
                    continue;
                }

                if (/^(#[0-9a-fA-F]{3,8}|rgba?\(.*?\)|hsla?\(.*?\)|[a-zA-Z]+)$/.test(token)) {
                    // Match colors in hex, rgb(a), hsl(a), or named colors
                    layerColor = token;
                    i++;
                    continue;
                }

                if (token.includes('gradient') || token.startsWith('url(') || token === 'none') {
                    layerImage = token;
                    i++;
                    continue;
                }

                if (repeatValues.includes(token)) {
                    if (layerRepeat) {
                        layerRepeat += ' ' + token;
                    } else {
                        layerRepeat = token;
                    }
                    i++;
                    continue;
                }

                if (attachmentValues.includes(token)) {
                    layerAttachment = token;
                    i++;
                    continue;
                }

                if (positionKeywords.includes(token) || /^[+-]?\d+(\.\d+)?(px|em|rem|%)?$/.test(token)) {
                    // Process background-position
                    if (isAfterSlash) {
                        // After '/', tokens are for background-size
                        if (layerSize) {
                            layerSize += ' ' + token;
                        } else {
                            layerSize = token;
                        }
                    } else {
                        if (layerPosition) {
                            layerPosition += ' ' + token;
                        } else {
                            layerPosition = token;
                        }
                    }
                    i++;
                    continue;
                }

                if (sizeValues.includes(token) && isAfterSlash) {
                    // Process background-size
                    if (layerSize) {
                        layerSize += ' ' + token;
                    } else {
                        layerSize = token;
                    }
                    i++;
                    continue;
                }

                if (boxValues.includes(token)) {
                    if (!layerOrigin) {
                        layerOrigin = token;
                    } else if (!layerClip) {
                        layerClip = token;
                    }
                    i++;
                    continue;
                }

                // Unknown token, skip or handle as needed
                i++;
            }

            // If layerClip is empty and layerOrigin is set, layerClip = layerOrigin
            if (!layerClip && layerOrigin) {
                layerClip = layerOrigin;
            }

            // Collect layer properties
            if (layerImage) {
                bgImages.push(layerImage);
            } else {
                bgImages.push('none');
            }

            if (layerColor) {
                bgColors.push(layerColor);
            }

            if (layerRepeat) {
                bgRepeats.push(layerRepeat);
            } else {
                bgRepeats.push('repeat');
            }

            if (layerAttachment) {
                bgAttachments.push(layerAttachment);
            } else {
                bgAttachments.push('scroll');
            }

            if (layerPosition) {
                bgPositions.push(layerPosition);
            } else {
                bgPositions.push('0% 0%');
            }

            if (layerSize) {
                bgSizes.push(layerSize);
            } else {
                bgSizes.push('auto');
            }

            if (layerOrigin) {
                bgOrigins.push(layerOrigin);
            } else {
                bgOrigins.push('padding-box');
            }

            if (layerClip) {
                bgClips.push(layerClip);
            } else {
                bgClips.push('border-box');
            }
        });

        // Get the number of layers
        const numLayers = bgImages.length;

        // Base default values
        const baseDefaultValues = {
            'background-image': 'none',
            'background-color': 'transparent',
            'background-repeat': 'repeat',
            'background-attachment': 'scroll',
            'background-position': '0% 0%',
            'background-size': 'auto',
            'background-origin': 'padding-box',
            'background-clip': 'border-box',
        };

        // Generate default values per number of layers
        const defaultValues = {};
        for (let prop in baseDefaultValues) {
            const defaultValue = baseDefaultValues[prop];
            if (prop === 'background-color') {
                defaultValues[prop] = defaultValue; // background-color is not layerable
            } else {
                defaultValues[prop] = Array(numLayers).fill(defaultValue).join(', ');
            }
        }

        let conflicts = false;

        // Only include properties that differ from defaults
        if (bgImages.join(', ') !== defaultValues['background-image']) {
            expandedProperties['background-image'] = bgImages.join(', ');
            overwrittenProperties['background-image'] = expandedProperties['background-image'];

            // Check for multiple background images (layers)
            if (bgImages.length > 1) {
                conflicts = true;
            }
        }

        if (bgColors.length > 0 && bgColors[bgColors.length - 1] !== defaultValues['background-color']) {
            expandedProperties['background-color'] = bgColors[bgColors.length - 1];
            overwrittenProperties['background-color'] = expandedProperties['background-color'];
        }

        if (bgRepeats.join(', ') !== defaultValues['background-repeat']) {
            expandedProperties['background-repeat'] = bgRepeats.join(', ');
            overwrittenProperties['background-repeat'] = expandedProperties['background-repeat'];

            if (bgRepeats.length > 1) {
                conflicts = true;
            }
        }

        if (bgAttachments.join(', ') !== defaultValues['background-attachment']) {
            expandedProperties['background-attachment'] = bgAttachments.join(', ');
            overwrittenProperties['background-attachment'] = expandedProperties['background-attachment'];

            if (bgAttachments.length > 1) {
                conflicts = true;
            }
        }

        if (bgPositions.join(', ') !== defaultValues['background-position']) {
            expandedProperties['background-position'] = bgPositions.join(', ');
            overwrittenProperties['background-position'] = expandedProperties['background-position'];

            if (bgPositions.length > 1) {
                conflicts = true;
            }
        }

        if (bgSizes.join(', ') !== defaultValues['background-size']) {
            expandedProperties['background-size'] = bgSizes.join(', ');
            overwrittenProperties['background-size'] = expandedProperties['background-size'];

            if (bgSizes.length > 1) {
                conflicts = true;
            }
        }

        if (bgOrigins.join(', ') !== defaultValues['background-origin']) {
            expandedProperties['background-origin'] = bgOrigins.join(', ');
            overwrittenProperties['background-origin'] = expandedProperties['background-origin'];

            if (bgOrigins.length > 1) {
                conflicts = true;
            }
        }

        if (bgClips.join(', ') !== defaultValues['background-clip']) {
            expandedProperties['background-clip'] = bgClips.join(', ');
            overwrittenProperties['background-clip'] = expandedProperties['background-clip'];

            if (bgClips.length > 1) {
                conflicts = true;
            }
        }

        // If conflicts detected, revert to using 'background' property
        if (conflicts) {
            // Remove the individual long-form properties
            expandedProperties = {};
            overwrittenProperties = {};

            // Use 'background' property with the original value
            expandedProperties['background'] = value;
            overwrittenProperties['background'] = value;
        }

        // Return the expanded properties and the ones that overwrite defaults
        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties,
        };
    }
    else if (property === 'transition') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Split the value into multiple transitions, considering commas outside of parentheses
        let transitions = [];
        let currentTransition = '';
        let parenCount = 0;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];

            if (char === '(') {
                parenCount++;
                currentTransition += char;
            } else if (char === ')') {
                parenCount--;
                currentTransition += char;
            } else if (char === ',' && parenCount === 0) {
                transitions.push(currentTransition.trim());
                currentTransition = '';
            } else {
                currentTransition += char;
            }
        }
        if (currentTransition.trim()) transitions.push(currentTransition.trim());

        let conflicts = transitions.length > 1;

        // Arrays to hold values for each sub-property
        const propertiesList = [];
        const durationsList = [];
        const timingFunctionsList = [];
        const delaysList = [];

        // Known timing function values
        const timingFunctionValues = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'];

        transitions.forEach(transition => {
            // Split into tokens while respecting parentheses
            let tokens = [];
            let currentToken = '';
            let parenCount = 0;

            for (let i = 0; i < transition.length; i++) {
                const char = transition[i];
                if (char === '(') {
                    parenCount++;
                    currentToken += char;
                } else if (char === ')') {
                    parenCount--;
                    currentToken += char;
                } else if (/\s/.test(char) && parenCount === 0) {
                    if (currentToken.trim()) tokens.push(currentToken.trim());
                    currentToken = '';
                } else {
                    currentToken += char;
                }
            }
            if (currentToken.trim()) tokens.push(currentToken.trim());

            // Default values for this transition
            let propertyName = 'all';
            let duration = '0s';
            let timingFunction = 'ease';
            let delay = '0s';

            tokens.forEach(token => {
                // Check if token is duration or delay
                if (/^[\d.]+(ms|s)$/.test(token)) {
                    if (duration === '0s') {
                        duration = token;
                    } else {
                        delay = token;
                    }
                    return;
                }

                // Check if token is a timing function
                if (timingFunctionValues.includes(token) || token.startsWith('cubic-bezier') || token.startsWith('steps')) {
                    timingFunction = token;
                    return;
                }

                // Assume any remaining token is the property name
                propertyName = token;
            });

            propertiesList.push(propertyName);
            durationsList.push(duration);
            timingFunctionsList.push(timingFunction);
            delaysList.push(delay);
        });

        // Set expanded properties only if they differ from defaults
        if (propertiesList.join(', ') !== 'all') {
            expandedProperties['transition-property'] = propertiesList.join(', ');
            overwrittenProperties['transition-property'] = expandedProperties['transition-property'];

            if (propertiesList.length > 1) {
                conflicts = true;
            }
        }

        if (durationsList.join(', ') !== '0s') {
            expandedProperties['transition-duration'] = durationsList.join(', ');
            overwrittenProperties['transition-duration'] = expandedProperties['transition-duration'];

            if (durationsList.length > 1) {
                conflicts = true;
            }
        }

        if (timingFunctionsList.join(', ') !== 'ease') {
            expandedProperties['transition-timing-function'] = timingFunctionsList.join(', ');
            overwrittenProperties['transition-timing-function'] = expandedProperties['transition-timing-function'];

            if (timingFunctionsList.length > 1) {
                conflicts = true;
            }
        }

        if (delaysList.join(', ') !== '0s') {
            expandedProperties['transition-delay'] = delaysList.join(', ');
            overwrittenProperties['transition-delay'] = expandedProperties['transition-delay'];

            if (delaysList.length > 1) {
                conflicts = true;
            }
        }

        // If conflicts detected, revert to using 'transition' property
        if (conflicts) {
            // Remove the individual long-form properties
            expandedProperties = {};
            overwrittenProperties = {};

            // Use 'transition' property with the original value
            expandedProperties['transition'] = value;
            overwrittenProperties['transition'] = value;
        }

        // Return the expanded properties and the ones that overwrite defaults
        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties
        };
    }    
    else if (property === 'list-style') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Tokenize the value while respecting URLs
        const tokens = [];
        let currentToken = '';
        let inUrl = false;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];

            if (char === 'u' && value.slice(i, i + 4) === 'url(') {
                inUrl = true;
                currentToken += 'url(';
                i += 3;
            } else if (char === ')' && inUrl) {
                inUrl = false;
                currentToken += ')';
            } else if (/\s/.test(char) && !inUrl) {
                if (currentToken.trim()) {
                    tokens.push(currentToken.trim());
                    currentToken = '';
                }
            } else {
                currentToken += char;
            }
        }
        if (currentToken.trim()) {
            tokens.push(currentToken.trim());
        }

        // Possible values for list-style-type
        const typeValues = [
            'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero',
            'lower-roman', 'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin',
            'armenian', 'georgian', 'lower-alpha', 'upper-alpha', 'none', 'inherit', 'initial', 'unset'
        ];

        // Possible values for list-style-position
        const positionValues = ['inside', 'outside'];

        // Initialize variables
        let listStyleType = '';
        let listStylePosition = '';
        let listStyleImage = '';

        // Handle special values: 'inherit', 'initial', 'unset'
        if (['inherit', 'initial', 'unset'].includes(value.trim())) {
            expandedProperties['list-style-type'] = value.trim();
            expandedProperties['list-style-position'] = value.trim();
            expandedProperties['list-style-image'] = value.trim();

            overwrittenProperties['list-style-type'] = value.trim();
            overwrittenProperties['list-style-position'] = value.trim();
            overwrittenProperties['list-style-image'] = value.trim();

            return {
                matched_properties: expandedProperties,
                overwritten_properties: overwrittenProperties
            };
        }

        // Parse tokens and assign to appropriate properties
        tokens.forEach(token => {
            if (token.startsWith('url(')) {
                listStyleImage = token;
            } else if (positionValues.includes(token)) {
                listStylePosition = token;
            } else if (typeValues.includes(token) || token.startsWith('"') || token.startsWith('\'')) {
                listStyleType = token;
            } else {
                // If the token doesn't match known values, treat it as type
                listStyleType = token;
            }
        });

        // Default values if not specified
        if (!listStyleType) listStyleType = 'disc';
        if (!listStylePosition) listStylePosition = 'outside';
        if (!listStyleImage) listStyleImage = 'none';

        // Set the expanded properties
        expandedProperties['list-style-type'] = listStyleType;
        expandedProperties['list-style-position'] = listStylePosition;
        expandedProperties['list-style-image'] = listStyleImage;

        // Overwritten properties are those that differ from default values
        const defaultValues = {
            'list-style-type': 'disc',
            'list-style-position': 'outside',
            'list-style-image': 'none',
        };

        let conflicts = false;

        for (const prop in expandedProperties) {
            if (expandedProperties[prop] !== defaultValues[prop]) {
                overwrittenProperties[prop] = expandedProperties[prop];
            }
        }

        // Detect conflicts if multiple tokens could not be uniquely mapped
        if (tokens.length > 3 || Object.keys(overwrittenProperties).length !== tokens.length) {
            conflicts = true;
        }

        // If conflicts detected, revert to using 'list-style' property
        if (conflicts) {
            // Remove the individual long-form properties
            expandedProperties = {};
            overwrittenProperties = {};
            
            if(value == 'none'){
                expandedProperties['list-style-type'] = value;
                overwrittenProperties['list-style-type'] = value;                
            }else{
                // Use 'list-style' property with the original value
                expandedProperties['list-style'] = value;
                overwrittenProperties['list-style'] = value;
            }
        }

        // Return the expanded properties and the ones that overwrite defaults
        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties
        };
    }    
  else if (property === 'grid-column') {
        const expanded = {};
        const value_parts = value.trim().split('/').map(part => part.trim());

        if (value_parts.length === 1) {
            // Handle single value
            if (value === 'auto') {
                expanded['grid-column-start'] = 'auto';
                expanded['grid-column-end'] = 'auto';
            } else if (value.startsWith('span')) {
                expanded['grid-column-start'] = 'auto';
                expanded['grid-column-end'] = value;
            } else {
                expanded['grid-column-start'] = value;
                expanded['grid-column-end'] = 'auto';
            }
        } else if (value_parts.length === 2) {
            // Handle start/end values separated by '/'
            const [start, end] = value_parts;
            expanded['grid-column-start'] = start;
            expanded['grid-column-end'] = end;
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
  }  
  else if (property === 'grid-row') {
        const expanded = {};
        const value_parts = value.trim().split('/').map(part => part.trim());
        if (value_parts.length === 1) {
            // Handle single value
            if (value === 'auto') {
                expanded['grid-row-start'] = 'auto';
                expanded['grid-row-end'] = 'auto';
            } else if (value.startsWith('span')) {
                expanded['grid-row-start'] = 'auto';
                expanded['grid-row-end'] = value;
            } else {
                expanded['grid-row-start'] = value;
                expanded['grid-row-end'] = 'auto';
            }
        } else if (value_parts.length === 2) {
            // Handle start/end values separated by '/'
            const [start, end] = value_parts;
            expanded['grid-row-start'] = start;
            expanded['grid-row-end'] = end;
        }
        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
  }  
  else if (property === 'grid-template') {
        const expanded = {};

        // If value is 'none', set all components to none
        if (value === 'none') {
            expanded['grid-template-rows'] = 'none';
            expanded['grid-template-columns'] = 'none';
            expanded['grid-template-areas'] = 'none';
            return {
                matched_properties: expanded,
                overwritten_properties: expanded
            };
        }

        // Split on quotes to separate areas from tracks
        const parts = value.split(/(['"].*?['"])/g).filter(Boolean);
        let areaStrings = [];
        let rowTrackList = [];
        let columnTrackList = '';

        parts.forEach(part => {
            if (part.trim().startsWith('"') || part.trim().startsWith("'")) {
                // This is a grid area template row
                areaStrings.push(part.trim().replace(/['"]/g, ''));
            } else {
                // This contains track sizes
                const tracks = part.trim().split('/');
                if (tracks.length > 1) {
                    // If there's a slash, the last part is column tracks
                    columnTrackList = tracks.pop().trim();
                }
                // Remaining tracks are row tracks
                const rowTracks = tracks.join(' ').trim();
                if (rowTracks) {
                    rowTrackList.push(rowTracks);
                }
            }
        });

        if (areaStrings.length > 0) {
            expanded['grid-template-areas'] = `"${areaStrings.join('" "')}"`;
        }
        if (rowTrackList.length > 0) {
            expanded['grid-template-rows'] = rowTrackList.join(' ');
        }
        if (columnTrackList) {
            expanded['grid-template-columns'] = columnTrackList;
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
    }
    else if (property === 'grid-area') {
        const expanded = {};
        const parts = value.trim().split('/').map(part => part.trim());

        // Handle named grid area
        if (parts.length === 1 && !parts[0].includes('span') && isNaN(parts[0])) {
            expanded['grid-row-start'] = parts[0];
            expanded['grid-column-start'] = parts[0];
            expanded['grid-row-end'] = parts[0];
            expanded['grid-column-end'] = parts[0];
        } 
        // Handle grid lines specification
        else {
            switch (parts.length) {
                case 1: // grid-row-start / grid-column-start
                    expanded['grid-row-start'] = parts[0];
                    expanded['grid-column-start'] = parts[0];
                    expanded['grid-row-end'] = 'auto';
                    expanded['grid-column-end'] = 'auto';
                    break;
                case 2: // grid-row-start / grid-column-start
                    expanded['grid-row-start'] = parts[0];
                    expanded['grid-column-start'] = parts[1];
                    expanded['grid-row-end'] = 'auto';
                    expanded['grid-column-end'] = 'auto';
                    break;
                case 3: // grid-row-start / grid-column-start / grid-row-end
                    expanded['grid-row-start'] = parts[0];
                    expanded['grid-column-start'] = parts[1];
                    expanded['grid-row-end'] = parts[2];
                    expanded['grid-column-end'] = 'auto';
                    break;
                case 4: // grid-row-start / grid-column-start / grid-row-end / grid-column-end
                    expanded['grid-row-start'] = parts[0];
                    expanded['grid-column-start'] = parts[1];
                    expanded['grid-row-end'] = parts[2];
                    expanded['grid-column-end'] = parts[3];
                    break;
            }
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
    }
    else if (property === 'place-self') {
        const expanded = {};
        const values = value.trim().split(/\s+/);

        if (values.length === 1) {
            // If only one value is specified, it applies to both align-self and justify-self
            expanded['align-self'] = values[0];
            expanded['justify-self'] = values[0];
        } else if (values.length === 2) {
            // If two values are specified, first is align-self, second is justify-self
            expanded['align-self'] = values[0];
            expanded['justify-self'] = values[1];
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
    }    
    else if (property === 'place-content') {
        const expanded = {};
        const values = value.trim().split(/\s+/);

        if (values.length === 1) {
            // If only one value is specified, it applies to both align-content and justify-content
            expanded['align-content'] = values[0];
            expanded['justify-content'] = values[0];
        } else if (values.length === 2) {
            // If two values are specified, first is align-content, second is justify-content
            expanded['align-content'] = values[0];
            expanded['justify-content'] = values[1];
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
    }
    else if (property === 'place-items') {
        const expanded = {};
        const values = value.trim().split(/\s+/);

        if (values.length === 1) {
            // If only one value is specified, it applies to both align-items and justify-items
            expanded['align-items'] = values[0];
            expanded['justify-items'] = values[0];
        } else if (values.length === 2) {
            // If two values are specified, first is align-items, second is justify-items
            expanded['align-items'] = values[0];
            expanded['justify-items'] = values[1];
        }

        return {
            matched_properties: expanded,
            overwritten_properties: expanded
        };
    }
    else if (property === 'flex-flow') {
        //console.log("IN FLEX FLOW WITH " + value);
          const [firstValue, secondValue] = value.trim().split(/\s+/);
          const expanded = {};

          // Valid flex-direction values
          const directionValues = ['row', 'row-reverse', 'column', 'column-reverse'];
          // Valid flex-wrap values  
          const wrapValues = ['nowrap', 'wrap', 'wrap-reverse'];

          if (firstValue) {
              if (directionValues.includes(firstValue)) {
                  expanded['flex-direction'] = firstValue;
                  // Only set default wrap if no second value
                  if (!secondValue) {
                      expanded['flex-wrap'] = 'nowrap';
                  }
              } else if (wrapValues.includes(firstValue)) {
                  expanded['flex-wrap'] = firstValue;
                  // Only set default direction if no second value
                  if (!secondValue) {
                      expanded['flex-direction'] = 'row';
                  }
              }
          }

          if (secondValue) {
              //console.log("has second value");
              //console.log(secondValue);
              if (directionValues.includes(secondValue)) {
                  expanded['flex-direction'] = secondValue;
              } else if (wrapValues.includes(secondValue)) {
                  expanded['flex-wrap'] = secondValue;
              }
          }
          //console.log("final expanded");
          //console.log(expanded);

          return {
              matched_properties: expanded,
              overwritten_properties: expanded
          };
    }    
    else if (property === 'border' || property === 'border-top' || property === 'border-right' || 
            property === 'border-bottom' || property === 'border-left') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Determine the side for border properties
        let borderWidthProp = 'border-width';
        let borderStyleProp = 'border-style';
        let borderColorProp = 'border-color';

        if (property !== 'border') {
            const side = property.split('-')[1]; // 'top', 'right', 'bottom', or 'left'
            borderWidthProp = `border-${side}-width`;
            borderStyleProp = `border-${side}-style`;
            borderColorProp = `border-${side}-color`;
        }

        // Tokenize the value while respecting functions (e.g., rgb(85, 85, 85))
        const tokens = [];
        let currentToken = '';
        let parenCount = 0;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];

            if (char === '(') {
                parenCount++;
                currentToken += char;
            } else if (char === ')') {
                parenCount--;
                currentToken += char;
            } else if (/\s/.test(char) && parenCount === 0) {
                if (currentToken.trim()) {
                    tokens.push(currentToken.trim());
                    currentToken = '';
                }
            } else {
                currentToken += char;
            }
        }
        if (currentToken.trim()) {
            tokens.push(currentToken.trim());
        }

        // Possible values for border-style
        const borderStyleValues = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];

        // Possible keyword values for border-width
        const borderWidthKeywords = ['thin', 'medium', 'thick'];

        // Initialize variables
        let borderWidth = '';
        let borderStyle = '';
        let borderColor = '';

        // Handle special values: 'inherit', 'initial', 'unset', 'revert'
        if (['inherit', 'initial', 'unset', 'revert'].includes(value.trim())) {
            expandedProperties[borderWidthProp] = value.trim();
            expandedProperties[borderStyleProp] = value.trim();
            expandedProperties[borderColorProp] = value.trim();

            overwrittenProperties[borderWidthProp] = value.trim();
            overwrittenProperties[borderStyleProp] = value.trim();
            overwrittenProperties[borderColorProp] = value.trim();

            return {
                matched_properties: expandedProperties,
                overwritten_properties: overwrittenProperties
            };
        }

        // Handle 'none' value
        if (value.trim() === 'none') {
            expandedProperties[borderWidthProp] = '0';
            expandedProperties[borderStyleProp] = 'none';
            expandedProperties[borderColorProp] = 'currentColor';

            overwrittenProperties[borderWidthProp] = '0';
            overwrittenProperties[borderStyleProp] = 'none';
            overwrittenProperties[borderColorProp] = 'currentColor';

            return {
                matched_properties: expandedProperties,
                overwritten_properties: overwrittenProperties
            };
        }

        // Now tokenize the value and attempt to assign tokens
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Check if token is in border-style values
            if (borderStyleValues.includes(token.toLowerCase())) {
                borderStyle = token;
                continue;
            }

            // Check if token is a length value or width keyword
            if (
                borderWidthKeywords.includes(token.toLowerCase()) ||
                /^[+-]?(\d+(\.\d+)?|\.\d+)(px|em|rem|%|vh|vw|vmin|vmax|in|cm|mm|pt|pc|ex|ch|lh|rlh|q)?$/i.test(token)
            ) {
                borderWidth = token;
                continue;
            }

            // Assume any remaining token is a color value
            borderColor = token;
        }

        // Default values if not specified
        if (!borderStyle) borderStyle = 'none';
        if (!borderWidth) borderWidth = 'medium';
        if (!borderColor) borderColor = 'currentColor';

        // Set the expanded properties
        expandedProperties[borderWidthProp] = borderWidth;
        expandedProperties[borderStyleProp] = borderStyle;
        expandedProperties[borderColorProp] = borderColor;

        // Overwritten properties are those that differ from default values
        const defaultValues = {};
        defaultValues[borderWidthProp] = 'medium';
        defaultValues[borderStyleProp] = 'none';
        defaultValues[borderColorProp] = 'currentColor';

        for (const prop in expandedProperties) {
            if (expandedProperties[prop] !== defaultValues[prop]) {
                overwrittenProperties[prop] = expandedProperties[prop];
            }
        }

        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties
        };
    }
    else if (property === 'padding' || property === 'margin') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Define the sides
        const sides = ['top', 'right', 'bottom', 'left'];
        const properties = sides.map(side => `${property}-${side}`);

        // Tokenize the value
        const tokens = value.trim().split(/\s+/);

        // Handle special values: 'inherit', 'initial', 'unset', 'revert'
        if (['inherit', 'initial', 'unset', 'revert'].includes(value.trim())) {
            properties.forEach(prop => {
                expandedProperties[prop] = value.trim();
                overwrittenProperties[prop] = value.trim();
            });

            return {
                matched_properties: expandedProperties,
                overwritten_properties: overwrittenProperties
            };
        }

        // Expand values based on the number of tokens
        let values = [];

        if (tokens.length === 1) {
            values = [tokens[0], tokens[0], tokens[0], tokens[0]];
        } else if (tokens.length === 2) {
            values = [tokens[0], tokens[1], tokens[0], tokens[1]];
        } else if (tokens.length === 3) {
            values = [tokens[0], tokens[1], tokens[2], tokens[1]];
        } else if (tokens.length === 4) {
            values = [tokens[0], tokens[1], tokens[2], tokens[3]];
        } else {
            // Invalid number of values
            //console.log(`Invalid number of values for ${property}: ${value}`);
            return null;
        }

        properties.forEach((prop, index) => {
            expandedProperties[prop] = values[index];
            overwrittenProperties[prop] = values[index];
        });

        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties
        };
    }    
    else if (property === 'animation') {
        let expandedProperties = {};
        let overwrittenProperties = {};

        // Split multiple animations by commas (respecting function parentheses)
        let animations = [];
        let currentAnimation = '';
        let parenCount = 0;

        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            if (char === '(') {
                parenCount++;
                currentAnimation += char;
            } else if (char === ')') {
                parenCount--;
                currentAnimation += char;
            } else if (char === ',' && parenCount === 0) {
                animations.push(currentAnimation.trim());
                currentAnimation = '';
            } else {
                currentAnimation += char;
            }
        }
        if (currentAnimation.trim()) animations.push(currentAnimation.trim());

        // Arrays to hold values for each sub-property
        const names = [];
        const durations = [];
        const timingFunctions = [];
        const delays = [];
        const iterationCounts = [];
        const directions = [];
        const fillModes = [];
        const playStates = [];

        // Known values for each property
        const timingFunctionValues = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'];
        const directionValues = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
        const fillModeValues = ['none', 'forwards', 'backwards', 'both'];
        const playStateValues = ['running', 'paused'];

        animations.forEach(animation => {
            // Split into tokens while respecting parentheses
            let tokens = [];
            let currentToken = '';
            let parenCount = 0;

            for (let i = 0; i < animation.length; i++) {
                const char = animation[i];
                if (char === '(') {
                    parenCount++;
                    currentToken += char;
                } else if (char === ')') {
                    parenCount--;
                    currentToken += char;
                } else if (parenCount === 0 && /\s/.test(char)) {
                    if (currentToken.trim()) tokens.push(currentToken.trim());
                    currentToken = '';
                } else {
                    currentToken += char;
                }
            }
            if (currentToken.trim()) tokens.push(currentToken.trim());

            // Default values for this animation
            let name = 'none';
            let duration = '0s';
            let timingFunction = 'ease';
            let delay = '0s';
            let iterationCount = '1';
            let direction = 'normal';
            let fillMode = 'none';
            let playState = 'running';

            tokens.forEach(token => {
                // Check timing (duration or delay)
                if (/^[\d.]+(s|ms)$/.test(token)) {
                    if (!duration || duration === '0s') {
                        duration = token;
                    } else {
                        delay = token;
                    }
                    return;
                }

                // Check timing function
                if (timingFunctionValues.includes(token) || token.includes('cubic-bezier') || token.includes('steps')) {
                    timingFunction = token;
                    return;
                }

                // Check iteration count
                if (token === 'infinite' || /^\d+$/.test(token)) {
                    iterationCount = token;
                    return;
                }

                // Check direction
                if (directionValues.includes(token)) {
                    direction = token;
                    return;
                }

                // Check fill mode
                if (fillModeValues.includes(token)) {
                    fillMode = token;
                    return;
                }

                // Check play state
                if (playStateValues.includes(token)) {
                    playState = token;
                    return;
                }

                // If none of the above, it's probably the animation name
                if (token !== 'none') {
                    name = token;
                }
            });

            // Collect values
            names.push(name);
            durations.push(duration);
            timingFunctions.push(timingFunction);
            delays.push(delay);
            iterationCounts.push(iterationCount);
            directions.push(direction);
            fillModes.push(fillMode);
            playStates.push(playState);
        });

        // Set expanded properties only if they differ from defaults
        if (names.join(', ') !== 'none') {
            expandedProperties['animation-name'] = names.join(', ');
            overwrittenProperties['animation-name'] = expandedProperties['animation-name'];
        }

        if (durations.join(', ') !== '0s') {
            expandedProperties['animation-duration'] = durations.join(', ');
            overwrittenProperties['animation-duration'] = expandedProperties['animation-duration'];
        }

        if (timingFunctions.join(', ') !== 'ease') {
            expandedProperties['animation-timing-function'] = timingFunctions.join(', ');
            overwrittenProperties['animation-timing-function'] = expandedProperties['animation-timing-function'];
        }

        if (delays.join(', ') !== '0s') {
            expandedProperties['animation-delay'] = delays.join(', ');
            overwrittenProperties['animation-delay'] = expandedProperties['animation-delay'];
        }

        if (iterationCounts.join(', ') !== '1') {
            expandedProperties['animation-iteration-count'] = iterationCounts.join(', ');
            overwrittenProperties['animation-iteration-count'] = expandedProperties['animation-iteration-count'];
        }

        if (directions.join(', ') !== 'normal') {
            expandedProperties['animation-direction'] = directions.join(', ');
            overwrittenProperties['animation-direction'] = expandedProperties['animation-direction'];
        }

        if (fillModes.join(', ') !== 'none') {
            expandedProperties['animation-fill-mode'] = fillModes.join(', ');
            overwrittenProperties['animation-fill-mode'] = expandedProperties['animation-fill-mode'];
        }

        if (playStates.join(', ') !== 'running') {
            expandedProperties['animation-play-state'] = playStates.join(', ');
            overwrittenProperties['animation-play-state'] = expandedProperties['animation-play-state'];
        }

        return {
            matched_properties: expandedProperties,
            overwritten_properties: overwrittenProperties
        };
    }    
    
    
  
  consoleLogBuffer("INVALID LONGFORM PROPERTY " + property);
  
  return null;
}