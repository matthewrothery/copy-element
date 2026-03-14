

/***************  MERGING THE MEDIA PREFIX **************/
function reduceTailwindClasses(ranges) {
  // Sort ranges by specificity, ruleIndex, and media_min ascending
  ranges.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Higher specificity first
    }
    if (a.ruleIndex !== b.ruleIndex) {
      return b.ruleIndex - a.ruleIndex; // Later rules first
    }
    return a.media_min - b.media_min; // Smaller media_min first
  });
  
  let tailwindClasses = [];

  // Process all ranges
  for (let range of ranges) {
    let mediaPrefix = '';
    
    if (range.media_min > -1) {
      mediaPrefix = getMediaPrefixForMin(range.media_min);
    }
    
    for (let tailClass of range.tailwind_classes) {
      if (mediaPrefix) {
        tailwindClasses.push(`${mediaPrefix}:${tailClass}`);
      } else {
        tailwindClasses.push(tailClass);
      }
    }
  }

  // Reverse to ensure correct order for CSS application
  tailwindClasses.reverse();
  
  return tailwindClasses;
}






function getMediaPrefixForMin(media_min) {
  const breakpoints = {
    640: 'sm',
    768: 'md',
    1024: 'lg',
    1280: 'xl',
    1536: '2xl'
  };

  if (breakpoints[media_min]) {
    return breakpoints[media_min];
  } else if (media_min > -1) {
    return `min-[${media_min}px]`;
  }
  return '';
}


/************  MERGING THE PADDING AND MARGIN PROPERTIES *******************/
function groupStylesByMediaRange(propSpecifityWithMediaVals) {
  const mediaGroups = {};

  for (const prop in propSpecifityWithMediaVals) {
    propSpecifityWithMediaVals[prop].forEach(styleObj => {
      const key = `${styleObj.media_min}-${styleObj.media_max}`;
      if (!mediaGroups[key]) {
        mediaGroups[key] = [];
      }
      mediaGroups[key].push({ prop, ...styleObj });
    });
  }

  return mediaGroups;
}


function updatePropSpecifityWithMergedProperties(propSpecifityWithMediaVals) {
  const mediaGroups = groupStylesByMediaRange(propSpecifityWithMediaVals);
  const updatedProps = {};

  for (const mediaKey in mediaGroups) {
    const group = mediaGroups[mediaKey];
    const mergedProps = mergePropertiesInGroup(group);

    // Now, we need to add these merged properties back into updatedProps
    for (const prop in mergedProps) {
      if (!updatedProps[prop]) {
        updatedProps[prop] = [];
      }
      updatedProps[prop].push(...mergedProps[prop]);
    }
  }

  return updatedProps;
}

function mergePropertiesInGroup(group) {
  const merged = {};
  const propValues = {};

  // Collect properties and their corresponding style objects
  group.forEach(item => {
    const { prop, tailwind_classes } = item;
    if (!propValues[prop]) {
      propValues[prop] = [];
    }
    propValues[prop].push({ ...item });
  });

  const props = Object.keys(propValues);

  // Helper function to extract value from Tailwind class
  function extractValue(tailwindClass) {
    // Remove the prefix and return the value
    const match = tailwindClass.match(/^[a-zA-Z\-]+-([\s\S]+)$/);
    if (match) {
      let extraVal = "";
      if(tailwindClass.indexOf(":") >= 0){
        let classSplitArr = tailwindClass.split(':');
        classSplitArr.pop();
        extraVal = classSplitArr.join();
      }      
      return extraVal + match[1]; // Return the value part after the prefix
    }
    return null;
  }

  // Helper function to check if two properties have the same values
  function haveSameValues(propA, propB) {
    const valuesA = propValues[propA].map(item => extractValue(item.tailwind_classes[0]));
    const valuesB = propValues[propB].map(item => extractValue(item.tailwind_classes[0]));
    return JSON.stringify(valuesA) === JSON.stringify(valuesB);
  }

  // Merge horizontal paddings
  if (props.includes('padding-left') && props.includes('padding-right')) {
    if (haveSameValues('padding-left', 'padding-right')) {
        const sampleTailwindClass = propValues['padding-left'][0].tailwind_classes[0];
        if (sampleTailwindClass.includes('-auto')) {
          // Then don't merge, because "px-auto" is invalid
          // Possibly do nothing, or do bracket usage, etc.
        } else {
          // merge as normal
          const newProp = 'padding-x';
          merged[newProp] = propValues['padding-left'].map(item => ({
            ...item,
            prop: newProp,
            tailwind_classes: item.tailwind_classes.map(cls =>
              cls.replace(/^pl-/, 'px-')
            ),
          }));
          delete propValues['padding-left'];
          delete propValues['padding-right'];
        }
    }
  }

  // Merge vertical paddings
  if (props.includes('padding-top') && props.includes('padding-bottom')) {
    if (haveSameValues('padding-top', 'padding-bottom')) {
      const newProp = 'padding-y';
      merged[newProp] = propValues['padding-top'].map((item) => ({
        ...item,
        prop: newProp,
        tailwind_classes: item.tailwind_classes.map(cls => cls.replace(/^pt-/, 'py-')),
      }));
      delete propValues['padding-top'];
      delete propValues['padding-bottom'];
    }
  }

  // Similarly for margins
  if (props.includes('margin-left') && props.includes('margin-right')) {
    if (haveSameValues('margin-left', 'margin-right')) {
      const newProp = 'margin-x';
      merged[newProp] = propValues['margin-left'].map((item) => ({
        ...item,
        prop: newProp,
        tailwind_classes: item.tailwind_classes.map(cls => cls.replace(/^ml-/, 'mx-')),
      }));
      delete propValues['margin-left'];
      delete propValues['margin-right'];
    }
  }

  if (props.includes('margin-top') && props.includes('margin-bottom')) {
    if (haveSameValues('margin-top', 'margin-bottom')) {
      const newProp = 'margin-y';
      merged[newProp] = propValues['margin-top'].map((item) => ({
        ...item,
        prop: newProp,
        tailwind_classes: item.tailwind_classes.map(cls => cls.replace(/^mt-/, 'my-')),
      }));
      delete propValues['margin-top'];
      delete propValues['margin-bottom'];
    }
  }

  // Combine remaining properties
  Object.keys(propValues).forEach(prop => {
    merged[prop] = propValues[prop];
  });

  return merged;
}
