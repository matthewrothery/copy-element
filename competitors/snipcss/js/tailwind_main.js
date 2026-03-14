
// ============================================================
// Icon Font Class Preservation for Tailwind Conversion
// ============================================================

// Known icon font class name patterns (fast regex check)
const ICON_CLASS_PATTERNS = [
  /^fa[srldb]?$/,   // Font Awesome base classes (fa, fas, far, fal, fad, fab)
  /^fa-/,           // Font Awesome icons (fa-chevron-right, etc.)
  /^ti$/,           // Tabler Icons base
  /^ti-/,           // Tabler Icons
  /^bi$/,           // Bootstrap Icons base
  /^bi-/,           // Bootstrap Icons
  /^material-icons/,// Material Icons
  /^glyphicon/,     // Glyphicons
  /^icon-/,         // Generic icon prefix
  /^icofont-/,      // IcoFont
  /^ri-/,           // Remix Icons
  /^bx-?/,          // BoxIcons
  /^la-?/,          // Line Awesome
];

// Known icon font-family names (for CSS-based detection fallback)
const ICON_FONT_FAMILIES = [
  'font awesome',
  'fontawesome',
  'tabler',
  'bootstrap-icons',
  'material icons',
  'glyphicons',
  'icomoon',
  'icofont',
  'remixicon',
  'boxicons',
  'line awesome',
];

// Check if class matches known icon patterns by name
function isIconClassByName(className) {
  return ICON_CLASS_PATTERNS.some(pattern => pattern.test(className));
}

// Check if any CSS rule for this class sets an icon font-family
function isIconClassByCSS(className, tSnippedArr) {
  if (!tSnippedArr) return false;
  for (let rule of tSnippedArr) {
    // Check if selector contains this class
    if (!rule.selector || !rule.selector.includes('.' + className)) continue;

    // Look for font-family in the CSS body
    if (!rule.body) continue;
    const fontMatch = rule.body.match(/font-family\s*:\s*([^;]+)/i);
    if (fontMatch) {
      const fontValue = fontMatch[1].toLowerCase();
      if (ICON_FONT_FAMILIES.some(font => fontValue.includes(font))) {
        return true;
      }
    }
  }
  return false;
}

// Get all icon classes from an element's class attribute
function getIconClasses(classAttr, tSnippedArr) {
  if (!classAttr) return [];
  const classes = classAttr.split(/\s+/).filter(c => c.trim());
  return classes.filter(cls =>
    !cls.startsWith('snipcss') &&
    (isIconClassByName(cls) || isIconClassByCSS(cls, tSnippedArr))
  );
}

// ============================================================

function getOverrideClasses(oProp, oVal){
    let overrideClasses = null;
    let iOverwritten = null;

    let hasImportant = oVal.includes('!important');
    // Remove '!important' and any surrounding whitespace if present
    let cleanValue = oVal.replace(/\s*!important\s*/g, '').trim();            

    if(oProp == 'margin' || oProp == 'padding'){
        //consoleLogBuffer("margin or padding tailwind classes");
        let expanded = expandShorthandProperty(oProp, cleanValue);
        iOverwritten = expanded['overwritten_properties'];                                                        
        overrideClasses = getBestTailwindClasses(oProp, iOverwritten);
        //consoleLogBuffer("override tailClasses");
        //consoleLogBuffer(overrideClasses);
    } else if(oProp == 'transform'){
        //consoleLogBuffer("special case to get transform tailwind classes");                                                    
        overrideClasses = getTransformClasses(cleanValue);
        //consoleLogBuffer("override tailClasses");
        //consoleLogBuffer(overrideClasses);                        
    }   
    else if(oProp == 'filter'){
        //consoleLogBuffer("special case to get filter tailwind classes");                                    
        overrideClasses = getFilterClasses(cleanValue);
        //consoleLogBuffer("override tailClasses");
        //consoleLogBuffer(overrideClasses);                               
     }
     else if(oProp == 'backdrop-filter'){
        //consoleLogBuffer("special case to get backdrop-filter tailwind classes");                                    
        overrideClasses = getFilterClasses(cleanValue, true);
        //consoleLogBuffer("override tailClasses");
        //consoleLogBuffer(overrideClasses);                                        
     }
     else if(oProp == 'font'){                
        //consoleLogBuffer("special case to get font tailwind classes");
        overrideClasses = getFontClasses(cleanValue);                 
        //consoleLogBuffer("override tailClasses");
        //consoleLogBuffer(overrideClasses); 
     }      

    // Add '!' prefix to each class if !important was present
    if (hasImportant && Array.isArray(overrideClasses)) {
        overrideClasses = overrideClasses.map(className => `!${className}`);
    }             
    return overrideClasses;
}

/**
 * Gets the ancestry chain of an element for CSS variable resolution
 * Parses snip class names to build ancestry (snip classes encode hierarchy)
 * @param {string} elemClass - The snip class name (e.g., 'snipcss0-4-52-53')
 * @param {array} allClassnamesArr - Array of all element class names being processed
 * @returns {array} - Array of class names from root to current element (parent-first order)
 */
function getElementAncestryChain(elemClass, allClassnamesArr) {
    let chain = [];
    let current = elemClass;

    // Walk up the hierarchy by parsing class names
    // Format: snipcss{device}-{level}-{parentId}-{currId}
    while (current) {
        chain.unshift(current); // Add to beginning (parent first)

        // Parse the class name: e.g., 'snipcss0-4-52-53' → ['snipcss0', '4', '52', '53']
        let parts = current.split('-');
        if (parts.length < 4) {
            break; // Invalid format, stop
        }

        let device = parts[0]; // 'snipcss0', 'snipcss1', etc.
        let level = parseInt(parts[1]); // Depth level in DOM tree
        let parentId = parseInt(parts[2]); // Parent element's ID

        // Stop if at root level
        if (level === 0 || parentId === 0) {
            break;
        }

        // Find parent class in allClassnamesArr
        // Parent should have: same device, level-1, and currId = our parentId
        let parentClass = allClassnamesArr.find(c => {
            let pParts = c.split('-');
            if (pParts.length >= 4) {
                return pParts[0] === device &&
                       parseInt(pParts[1]) === level - 1 &&
                       parseInt(pParts[3]) === parentId;
            }
            return false;
        });

        current = parentClass; // Move to parent (or undefined if not found)
    }

    return chain;
}

function getTailwindHtml(labelHtml, allCss, tSnippedArr, forceBreakpoints, resolveVariables) {
  //consoleLogBuffer("matching final rules");
  //consoleLogBuffer(matchingFinalRules);
  //consoleLogBuffer("ALL SPECIFICITY VALUES");
  //consoleLogBuffer(selectorSpecifityScore);
  //consoleLogBuffer("forcebreakpoints");
  //consoleLogBuffer(forceBreakpoints);
  //consoleLogBuffer("resolveVariables");
  //consoleLogBuffer(resolveVariables);
  

  let $editHtml = cheerio.load(labelHtml, CHEERIO_OPTIONS, false);

  for (let x = 0; x < allClassnamesArr.length; x++) {
    try{
        let currClass = allClassnamesArr[x];

        // Set current processing ID for debug log filtering
        CURRENT_PROCESSING_SNIP_ID = currClass;

        let theElem = $editHtml.root().find("." + currClass).get(0);
        consoleLogBuffer("===============================");
        consoleLogBuffer("PROCESSING CLASS: " + currClass);

        // Get ancestry chain for CSS variable resolution (includes parent elements)
        let ancestryChain = getElementAncestryChain(currClass, allClassnamesArr);
        consoleLogBuffer("Ancestry chain: " + ancestryChain.join(' -> '));

        let propSpecifityWithMediaVals = {};
        //let tailwindPropToClass = {};

        // Process style attributes first
        let theStyleAttr = $editHtml(theElem).attr('style');
        if (theStyleAttr) {
            //consoleLogBuffer("FOUND STYLE ATTRIBUTE");
            //consoleLogBuffer(theStyleAttr);
            const declarations = parseStyleAttribute(theStyleAttr);
            
            declarations.forEach(({ property: inProp, value: inVal }) => {
                if (resolveVariables && inProp.startsWith('--')) {
                    
                    //consoleLogBuffer("STYLES Adding a CSS variable");
                    //consoleLogBuffer(inProp);
                    let mediaSelector = "";
                    let selText = "." + currClass; //should be unique
                    if (!cssvarDefinedArr.hasOwnProperty(inProp)) {
                        cssvarDefinedArr[inProp] = [];
                    }
                    
                    // Create the key we want to check
                    const newKey = mediaSelector + selText + inProp;

                    // Check if an object with this key already exists in the array
                    const exists = cssvarDefinedArr[inProp].some(item => item.key === newKey);

                    // Only push if the key doesn't exist
                    if (!exists) {
                        //consoleLogBuffer("Added style attribute CSS var: " + inProp + ":" + inVal);
                        cssvarDefinedArr[inProp].push({
                            "key": newKey,
                            "label": currClass,
                            "value": inVal,
                            "media": mediaSelector,
                            "selector": selText
                        });
                        //consoleLogBuffer("now this variable " + inProp + " has" );
                        //consoleLogBuffer(cssvarDefinedArr[inProp]);
                    }

                }                    
            });
            
            declarations.forEach(({ property: inProp, value: inVal }) => {
                //consoleLogBuffer("style inprop");
                //consoleLogBuffer(inProp);
                //consoleLogBuffer("style inval");
                //consoleLogBuffer(inVal);                            
                if (resolveVariables && inProp.startsWith('--')) {
                    //consoleLogBuffer("skipping " + inProp);
                    return;
                }

                let shortlongType = getPropertyType(inProp);
                if (shortlongType['type'] == 'short') {
                    //consoleLogBuffer("STYLE ATTR SHORTFORM PROPERTY");
                    //consoleLogBuffer("processing style prop");
                    //consoleLogBuffer(inProp);
                    //consoleLogBuffer(inVal);                    
                    let expanded = expandShorthandProperty(inProp, inVal);
                    let pOverwritten = expanded['overwritten_properties'];     
                    for (let longProp in pOverwritten) {
                        let longVal = pOverwritten[longProp];
                        let tailClass = cssToTailwind(longProp, longVal);
                        if(!tailClass){
                            consoleLogBuffer("could not convert longProp " + longProp + " with " + longVal);
                            return;
                        }
                        propSpecifityWithMediaVals[longProp] = [{
                            media_min: -1,
                            media_max: 9999,
                            score: 110,
                            tailwind_classes: [tailClass],
                            ruleIndex: 1
                        }];                        
                    }                
                } else { 
                    //consoleLogBuffer("processing style prop");
                    //consoleLogBuffer(inProp);
                    //consoleLogBuffer(inVal);
                    if(resolveVariables && inVal.indexOf('var') >= 0){
                        inVal = resolveAllVariables(inVal, ancestryChain);
                    }    
                    
                    let overrideClasses = getOverrideClasses(inProp, inVal);

                    if(overrideClasses == null){
                        let tailClass = cssToTailwind(inProp, inVal);
                        //consoleLogBuffer("styleattr class");
                        //consoleLogBuffer(tailClass);
                        if(!tailClass){
                            consoleLogBuffer("could not convert inProp " + inProp + " with " + inVal);
                            return;
                        }
                        //consoleLogBuffer("adding");
                        propSpecifityWithMediaVals[inProp] = [{
                            media_min: -1,
                            media_max: 9999,
                            score: 110,
                            tailwind_classes: [tailClass],
                            ruleIndex: 1
                        }];  
                    } else {
                        if (!(inProp in propSpecifityWithMediaVals)) {
                            propSpecifityWithMediaVals[inProp] = [];
                        }

                        let currMediaRange = {
                            media_min: -1,
                            media_max: 9999,
                            score: 110,
                            tailwind_classes: [],
                            ruleIndex: 1,
                            prop: inProp
                        };
                        //consoleLogBuffer("override classes");
                        //consoleLogBuffer(overrideClasses);

                        for (let o = 0; o < overrideClasses.length; o++) {
                            let tailClass = overrideClasses[o];
                            if(!tailClass){
                                continue;
                            }
                            currMediaRange.tailwind_classes.push(tailClass);
                        }

                        propSpecifityWithMediaVals[inProp] = mergeRanges(
                            propSpecifityWithMediaVals[inProp],
                            currMediaRange
                        );
                    }
                }
            });

            // Remove the style attribute after processing
            $editHtml(theElem).removeAttr('style');
        }

        let allSelectors = matchingFinalRules[currClass]['selectors'];
        let allMedia = matchingFinalRules[currClass]['media_queries'];
        let allMatchingIndices = matchingFinalRules[currClass]['indices'];
        let allInheritedTypes = matchingFinalRules[currClass]['inherited_type'];
        let allInheritedClasses = matchingFinalRules[currClass]['inherited_classes'];
        let allInvalidPseudos = matchingFinalRules[currClass]['invalid_pseudos'];
        let allBodies = matchingFinalRules[currClass]['bodies'];
        let matchingParts = matchingFinalRules[currClass]['matching_parts'];
        consoleLogBuffer("matching all selectors of class");
        consoleLogBuffer(allSelectors);
        consoleLogBuffer("matching all body of class");
        consoleLogBuffer(allBodies);        
        consoleLogBuffer("matching all media of class");
        consoleLogBuffer(allMedia);
        consoleLogBuffer("Matching order indices");
        consoleLogBuffer(allMatchingIndices);
        
        ////
        consoleLogBuffer("Matching invalid pseudos");
        consoleLogBuffer(allInvalidPseudos);
        //consoleLogBuffer("all inherited types");
        //consoleLogBuffer(allInheritedTypes);
        consoleLogBuffer("matching parts");
        consoleLogBuffer(matchingParts);
        consoleLogBuffer("allInheritedClasses");
        consoleLogBuffer(allInheritedClasses);
        //
        let skipSelectors = ["*","body","html",":root","*,:before,:after",":backdrop",":-webkit-scrollbar",":before",":after",":selection","::selection",
           ":after,:before",":-webkit-scrollbar",":-webkit-scrollbar-thumb",":-webkit-scrollbar-track", ":-webkit-scrollbar:hover", ":-webkit-scrollbar-track:hover",":-webkit-scrollbar",
           "::-webkit-scrollbar-thumb:hover", ":-webkit-scrollbar-thumb:hover", 
        "::placeholder","::marker","::spelling-error","::grammar-error","::-webkit-file-upload-button","::-webkit-inner-spin-button","::-webkit-outer-spin-button",
  "::-webkit-resizer","::-webkit-calendar-picker-indicator","::-webkit-details-marker","::-webkit-scrollbar-corner","::cue",":-webkit-autofill",":-webkit-full-screen"];

        for (let s = 0; s < allSelectors.length; s++) {
          let aSelector = allSelectors[s];
          let aBody = allBodies[s];
          let aMediaTarget = allMedia[s];
          let myMatchingParts = matchingParts[s];
          let ruleIndex = allMatchingIndices[s];
          let inheritedType = allInheritedTypes[s];
          //let inheritedClasses = allInheritedClasses[s];
          let invalidPseudo = allInvalidPseudos[s];
          
          if(skipSelectors.includes(aSelector)){
              //consoleLogBuffer("SKIPPING *,BODY,HTML " + aSelector);      
              continue;
          }
          else if(invalidPseudo){
              //consoleLogBuffer("SKIPPING INVALID PSEUDO: " + aSelector);      
              continue;              
          }
          else if (inheritedType == 'other_inherited' || inheritedType == 'inherited') {

            //consoleLogBuffer("SKIPPING INHERITED SELECTOR: " + aSelector);                        
            ////consoleLogBuffer(aBody);
            //consoleLogBuffer("inheritType");
            //consoleLogBuffer(inheritedType);
            continue;
          }
          //consoleLogBuffer("doing selector " + aSelector);
          //consoleLogBuffer("my matching parts of that selector");
          //consoleLogBuffer(myMatchingParts);
          let highestScore = 0;
          let allPseudo = [];

          // DEBUG: Log pseudo-element processing for ALL selectors with :before/:after
          let hasPseudoElement = aSelector.indexOf(':before') >= 0 || aSelector.indexOf(':after') >= 0 ||
              aSelector.indexOf('::before') >= 0 || aSelector.indexOf('::after') >= 0;
          if (hasPseudoElement) {
            consoleLogBuffer("=== PSEUDO DEBUG for ruleIndex " + ruleIndex + " ===");
            consoleLogBuffer("Full selector: " + aSelector);
            consoleLogBuffer("myMatchingParts: " + JSON.stringify(myMatchingParts));
            consoleLogBuffer("Body: " + aBody.substring(0, 100));
          }

          for (let m = 0; m < myMatchingParts.length; m++) {
            let mPart = myMatchingParts[m];
            if (mPart.indexOf(":") >= 0) {
              let pseudoParts = getPseudos(mPart);

              // Check for sibling pseudo-elements in full selector
              // If mPart is ".clearfix:before" and aSelector contains ".clearfix:after", add "after" too
              if (pseudoParts.length > 0) {
                let baseSelector = mPart.replace(/::?(before|after)/g, '');

                for (let pseudo of ['before', 'after']) {
                  if (!pseudoParts.includes(pseudo)) {
                    // Check if sibling exists in full selector
                    let siblingPattern1 = baseSelector + ':' + pseudo;
                    let siblingPattern2 = baseSelector + '::' + pseudo;
                    if (aSelector.indexOf(siblingPattern1) >= 0 || aSelector.indexOf(siblingPattern2) >= 0) {
                      pseudoParts.push(pseudo);
                      if (hasPseudoElement) {
                        consoleLogBuffer("  Added sibling pseudo '" + pseudo + "' from full selector");
                      }
                    }
                  }
                }

                //consoleLogBuffer("FOUND PSEUDO");
                //consoleLogBuffer(pseudoParts);
                if (hasPseudoElement) {
                  consoleLogBuffer("  mPart '" + mPart + "' -> pseudoParts: " + JSON.stringify(pseudoParts));
                }
              }
              allPseudo = allPseudo.concat(pseudoParts);
            }
            let myScore = 0;
            if (mPart in selectorSpecifityScore) {
              myScore = selectorSpecifityScore[mPart];
            } else {
              let theScore = 0;
              try{
                    let parseSpecificityArr = parsel.specificity(mPart);
                    theScore = parseSpecificityArr[0] * 100 + parseSpecificityArr[1] * 10 + parseSpecificityArr[2] * 1;
              }
              catch(exxx){
                  consoleLogBuffer("parsel err: " + mPart);
                  let specificity = calculateSingle(mPart);
                  let specArr = specificity['specificityArray'];
                  theScore = specArr[1] * 100 + specArr[2] * 10 + specArr[3] * 1;
              }
              myScore = theScore;
            }
            if (myScore > highestScore) {
              highestScore = myScore;
            }
          }

          if (hasPseudoElement) {
            consoleLogBuffer("  FINAL allPseudo: " + JSON.stringify(allPseudo));
          }
          //consoleLogBuffer("all pseudo");
          //consoleLogBuffer(allPseudo);
          //consoleLogBuffer("with score");
          //consoleLogBuffer(highestScore);

          for (let x = 0; x < tSnippedArr.length; x++) {
            let mySelector = tSnippedArr[x]['selector'];
            let myBody = tSnippedArr[x]['body'];
            let myMedia = tSnippedArr[x]['media'];

            //has to be both same exact media and selector        
            if (mySelector.trim() == aSelector.trim() && aMediaTarget.trim() == myMedia.trim()) {
                                
              //consoleLogBuffer("myselector--- " + mySelector);  
              //consoleLogBuffer("myBody");
              //consoleLogBuffer(myBody);
                
              let bodyUsedProps = {};  
              let theBodySplit = myBody.split(/\r?\n/);
              for (var bb = 0; bb < theBodySplit.length; bb++) {
                let line = theBodySplit[bb].trim();
                if (line === '' || line.startsWith('/*')) continue; // Skip empty lines and comments
                if (line.indexOf(':') >= 0) {
                  let tSplit = line.split(/:(.+)/);
                  if (tSplit.length < 2) continue; // Skip invalid lines
                  let tProp = tSplit[0].trim();
                  if(tProp.startsWith('--')){
                      //consoleLogBuffer("skipping variable definition on element: " + tProp);
                      continue;
                  }
                  if(tProp.startsWith('-webkit-')){
                      //HERE I WANT TO REMOVE -webkit- ... what are the consequenses?                      
                  }
                  
                  let modifiedScore = highestScore;
                  if(tProp in bodyUsedProps){
                      bodyUsedProps[tProp] += 1;
                      modifiedScore += bodyUsedProps[tProp];
                  }else{
                      bodyUsedProps[tProp] = 0;
                  }
                  
                  let tVal = tSplit[1].trim().replace(/;$/, '');
                  tVal = tVal.replace(/\/\*[\s\S]*?\*\//g, '').trim();
                  //consoleLogBuffer("tprop");
                  //consoleLogBuffer(tProp);
                  //consoleLogBuffer("tval");
                  //consoleLogBuffer(tVal);

                  let shortlongType = getPropertyType(tProp);
                  if (shortlongType['type'] == 'short') {
                    //consoleLogBuffer("SHORTFORM PROPERTY");
                    //consoleLogBuffer(shortlongType);

                    let expanded = expandShorthandProperty(tProp, tVal);
                    let pOverwritten = expanded['overwritten_properties'];
                                        
                    for (let longProp in pOverwritten) {

                      let currMediaRanges = [];
                      let longVal = pOverwritten[longProp];
                      //consoleLogBuffer("longprop");
                      //consoleLogBuffer(longProp);  
                      //consoleLogBuffer("longval");
                      //consoleLogBuffer(longVal);
                                            
                      let individualMediaQueries = splitNoParen(myMedia);
                      individualMediaQueries.forEach((individualMedia) => {
                         let ranges = parseMediaQueryToTailwind(individualMedia, forceBreakpoints);
                         currMediaRanges = currMediaRanges.concat(ranges);
                      });                  
                      //let currMediaRanges = parseMediaQueryToTailwind(myMedia, forceBreakpoints);
                      if (allPseudo.length <= 0) {
                        //consoleLogBuffer("no psuedo");
                        // No pseudo-classes
                        let propKey = longProp;
                        
                        if (!(propKey in propSpecifityWithMediaVals)) {
                          propSpecifityWithMediaVals[propKey] = [];
                        }
                        for (let c = 0; c < currMediaRanges.length; c++) {
                          let currMediaRange = currMediaRanges[c];
                          currMediaRange['prop'] = propKey;
                          currMediaRange['score'] = modifiedScore;
                          currMediaRange['ruleIndex'] = ruleIndex; 
                          consoleLogBuffer("long prop");
                          //consoleLogBuffer(longProp);
                          //consoleLogBuffer("tVal");
                          //consoleLogBuffer(tVal);
                          //consoleLogBuffer("using longval instead");
                          //consoleLogBuffer(longVal);
                          if(resolveVariables && longVal.indexOf('var') >= 0){
                                //consoleLogBuffer("resolving variable: " + longVal);
                                longVal = resolveAllVariables(longVal, ancestryChain);
                                //consoleLogBuffer("after resolve");
                                //consoleLogBuffer(longVal);
                          }                          
                          
                          let tailClass = cssToTailwind(longProp, longVal);
                          //consoleLogBuffer("class: " + tailClass);
                          if(!tailClass){
                              consoleLogBuffer("could not convert longProp " + longProp + " with " + longVal);
                              continue;
                          }
                          currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];


                          //consoleLogBuffer("index of rule: " + x + " for prop " + propKey);
                          //consoleLogBuffer(myMedia);
                          //consoleLogBuffer("Existing range");
                          //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                          //consoleLogBuffer("Adding range for media query: ");
                          //consoleLogBuffer(currMediaRange);



                          propSpecifityWithMediaVals[propKey] = mergeRanges(
                            propSpecifityWithMediaVals[propKey],
                            currMediaRange
                          );
                          //consoleLogBuffer("after");
                          //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);              
                        }
                      } else {
                          //consoleLogBuffer("with psuedo");
                        // With pseudo-classes

                        // Special case: before/after are sibling pseudo-elements, not chained
                        // They need separate entries, not "before:after:prop"
                        let hasBefore = allPseudo.includes('before');
                        let hasAfter = allPseudo.includes('after');
                        let pseudoElementsToProcess = [];
                        let otherPseudos = [];

                        for (let pp = 0; pp < allPseudo.length; pp++) {
                          let p = allPseudo[pp];
                          if (p === 'before' || p === 'after') {
                            pseudoElementsToProcess.push(p);
                          } else {
                            otherPseudos.push(p);
                          }
                        }

                        // If we have both before and after, process them separately
                        // Otherwise fall back to original chaining behavior
                        if (hasBefore && hasAfter) {
                          // Process each pseudo-element separately
                          for (let pe = 0; pe < pseudoElementsToProcess.length; pe++) {
                            let pseudoEl = pseudoElementsToProcess[pe];
                            let propKey = longProp;
                            let pseudoPrefix = "";

                            // Add other pseudos (like hover, focus) as chain
                            for (let op = 0; op < otherPseudos.length; op++) {
                              propKey = otherPseudos[op] + ':' + propKey;
                              pseudoPrefix += otherPseudos[op] + ':';
                            }
                            // Add the pseudo-element
                            propKey = pseudoEl + ':' + propKey;
                            pseudoPrefix += pseudoEl + ':';

                            if (!(propKey in propSpecifityWithMediaVals)) {
                              propSpecifityWithMediaVals[propKey] = [];
                            }

                            for (let c = 0; c < currMediaRanges.length; c++) {
                                let currMediaRange = JSON.parse(JSON.stringify(currMediaRanges[c])); // Clone to avoid mutation
                                currMediaRange['prop'] = propKey;
                                currMediaRange['score'] = modifiedScore;
                                currMediaRange['ruleIndex'] = ruleIndex;
                                let resolvedLongVal = longVal;
                                if(resolveVariables && resolvedLongVal.indexOf('var') >= 0){
                                      resolvedLongVal = resolveAllVariables(resolvedLongVal, ancestryChain);
                                }
                                let tailClass = pseudoPrefix + cssToTailwind(longProp, resolvedLongVal);

                                if(!tailClass){
                                    consoleLogBuffer("could not convert pseudo longProp " + pseudoPrefix + " : " + longProp + " with " + resolvedLongVal);
                                    continue;
                                }

                                currMediaRange['tailwind_classes'] = [tailClass];

                                propSpecifityWithMediaVals[propKey] = mergeRanges(
                                  propSpecifityWithMediaVals[propKey],
                                  currMediaRange
                                );
                            }
                          }
                        } else {
                          // Original chaining behavior for other cases
                          let propKey = longProp;
                          let pseudoPrefix = "";
                          for (let pp = 0; pp < allPseudo.length; pp++) {
                            let pseudoElement = allPseudo[pp];
                            propKey = pseudoElement + ':' + propKey;
                            pseudoPrefix += pseudoElement + ':';
                          }
                          //consoleLogBuffer("psuedo prefix " + pseudoPrefix);
                          if (!(propKey in propSpecifityWithMediaVals)) {
                            propSpecifityWithMediaVals[propKey] = [];
                          }

                          for (let c = 0; c < currMediaRanges.length; c++) {
                              let currMediaRange = currMediaRanges[c];
                              currMediaRange['prop'] = propKey;
                              currMediaRange['score'] = modifiedScore;
                              currMediaRange['ruleIndex'] = ruleIndex; // Include ruleIndex here
                              if(resolveVariables && longVal.indexOf('var') >= 0){
                                    //consoleLogBuffer("resolving variable: " + longVal);
                                    longVal = resolveAllVariables(longVal, ancestryChain);
                                    //consoleLogBuffer("after resolve");
                                    //consoleLogBuffer(longVal);
                              }
                              let tailClass = pseudoPrefix + cssToTailwind(longProp, longVal);

                              //consoleLogBuffer("333tailclass prefix " + tailClass);

                              if(!tailClass){
                                  consoleLogBuffer("could not convert pseudo longProp " + pseudoPrefix + " : " + longProp + " with " + longVal);
                                  continue;
                              }

                              currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];

                              //consoleLogBuffer("index of rule: " + x + " for prop " + propKey);
                              //consoleLogBuffer(myMedia);
                              //consoleLogBuffer("Existing range");
                              //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                              //consoleLogBuffer("Adding range for media query: ");
                              //consoleLogBuffer(currMediaRange);



                              propSpecifityWithMediaVals[propKey] = mergeRanges(
                                propSpecifityWithMediaVals[propKey],
                                currMediaRange
                              );
                              //consoleLogBuffer("after");
                              //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                          }
                        }
                      }
                    }
                  } else {
                    // Not a shorthand property
                    let currMediaRanges = [];
                    let individualMediaQueries = splitNoParen(myMedia);
                    individualMediaQueries.forEach((individualMedia) => {
                      let ranges = parseMediaQueryToTailwind(individualMedia, forceBreakpoints);
                      currMediaRanges = currMediaRanges.concat(ranges);
                    });
                    if(resolveVariables && tVal.indexOf('var') >= 0){
                          //consoleLogBuffer("resolving variable: " + tVal);
                          tVal = resolveAllVariables(tVal, ancestryChain);
                          //consoleLogBuffer("after resolve");
                          //consoleLogBuffer(tVal);
                    }                       
                    let overrideClasses = getOverrideClasses(tProp, tVal);
                    
                    //let currMediaRanges = parseMediaQueryToTailwind(myMedia, forceBreakpoints);
                    if (allPseudo.length <= 0) {
                      let propKey = tProp;
                      if (!(propKey in propSpecifityWithMediaVals)) {
                        propSpecifityWithMediaVals[propKey] = [];
                      }


                      for (let c = 0; c < currMediaRanges.length; c++) {
                        let currMediaRange = currMediaRanges[c];
                        currMediaRange['prop'] = propKey;
                        currMediaRange['score'] = modifiedScore;
                        currMediaRange['ruleIndex'] = ruleIndex; // Include ruleIndex here
                        
                        //consoleLogBuffer("tProp");
                        //consoleLogBuffer(tProp);
                        //consoleLogBuffer("tVal");
                        //consoleLogBuffer(tVal);              
                        if(overrideClasses == null){
                            let tailClass = cssToTailwind(tProp, tVal);
                            //consoleLogBuffer("tailClass");
                            //consoleLogBuffer(tailClass);
                            if(!tailClass){
                                consoleLogBuffer("could not convert tProp " + tProp + " with " + tVal);
                                continue;
                            }
                            currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                        }else{
                            for(let o = 0; o < overrideClasses.length; o++){
                                let tailClass = overrideClasses[o];
                                currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                            }
                            /*
                            if(tProp != 'transform'){
                                propSpecifityWithMediaVals[propKey + "-left"] = [];
                                propSpecifityWithMediaVals[propKey + "-right"] = [];
                                propSpecifityWithMediaVals[propKey + "-bottom"] = [];
                                propSpecifityWithMediaVals[propKey + "-top"] = [];
                            }       
                            */
                        }

                            //consoleLogBuffer("index of rule: " + x + " for prop " + propKey);
                            //consoleLogBuffer(myMedia);
                            //consoleLogBuffer("Existing range");
                            //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                            //consoleLogBuffer("Adding range for media query: ");
                            //consoleLogBuffer(currMediaRange);



                        propSpecifityWithMediaVals[propKey] = mergeRanges(
                          propSpecifityWithMediaVals[propKey],
                          currMediaRange
                        );
                        //consoleLogBuffer("after");
                        //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                      }
                    } else {
                        // With pseudo-classes

                        // Special case: before/after are sibling pseudo-elements, not chained
                        let hasBefore = allPseudo.includes('before');
                        let hasAfter = allPseudo.includes('after');
                        let pseudoElementsToProcess = [];
                        let otherPseudos = [];

                        for (let pp = 0; pp < allPseudo.length; pp++) {
                          let p = allPseudo[pp];
                          if (p === 'before' || p === 'after') {
                            pseudoElementsToProcess.push(p);
                          } else {
                            otherPseudos.push(p);
                          }
                        }

                        if (hasBefore && hasAfter) {
                          // Process each pseudo-element separately
                          for (let pe = 0; pe < pseudoElementsToProcess.length; pe++) {
                            let pseudoEl = pseudoElementsToProcess[pe];
                            let propKey = tProp;
                            let pseudoPrefix = "";

                            for (let op = 0; op < otherPseudos.length; op++) {
                              propKey = otherPseudos[op] + ':' + propKey;
                              pseudoPrefix += otherPseudos[op] + ':';
                            }
                            propKey = pseudoEl + ':' + propKey;
                            pseudoPrefix += pseudoEl + ':';

                            if (!(propKey in propSpecifityWithMediaVals)) {
                              propSpecifityWithMediaVals[propKey] = [];
                            }

                            for (let c = 0; c < currMediaRanges.length; c++) {
                              let currMediaRange = JSON.parse(JSON.stringify(currMediaRanges[c]));
                              currMediaRange['prop'] = propKey;
                              currMediaRange['score'] = modifiedScore;
                              currMediaRange['ruleIndex'] = ruleIndex;

                              if(overrideClasses == null){
                                let tailClass = pseudoPrefix + cssToTailwind(tProp, tVal);
                                if(!tailClass){
                                    consoleLogBuffer("could not convert tProp " + tProp + " with " + tVal);
                                    continue;
                                }
                                currMediaRange['tailwind_classes'] = [tailClass];
                              }else{
                                currMediaRange['tailwind_classes'] = [];
                                for(let o = 0; o < overrideClasses.length; o++){
                                    let tailClass = pseudoPrefix + overrideClasses[o];
                                    currMediaRange['tailwind_classes'].push(tailClass);
                                }
                              }

                              propSpecifityWithMediaVals[propKey] = mergeRanges(
                                propSpecifityWithMediaVals[propKey],
                                currMediaRange
                              );
                            }
                          }
                        } else {
                          // Original chaining behavior
                          let propKey = tProp;
                          let pseudoPrefix = "";
                          for (let pp = 0; pp < allPseudo.length; pp++) {
                            let pseudoElement = allPseudo[pp];
                            propKey = pseudoElement + ':' + propKey;
                            pseudoPrefix += pseudoElement + ':';
                          }
                          if (!(propKey in propSpecifityWithMediaVals)) {
                            propSpecifityWithMediaVals[propKey] = [];
                          }

                          for (let c = 0; c < currMediaRanges.length; c++) {
                            let currMediaRange = currMediaRanges[c];
                            currMediaRange['prop'] = propKey;
                            currMediaRange['score'] = modifiedScore;
                            currMediaRange['ruleIndex'] = ruleIndex;

                            if(overrideClasses == null){
                                  let tailClass = pseudoPrefix + cssToTailwind(tProp, tVal);
                                  if(!tailClass){
                                      consoleLogBuffer("could not convert tProp " + tProp + " with " + tVal);
                                      continue;
                                  }
                                  currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                            }else{
                                  for(let o = 0; o < overrideClasses.length; o++){
                                      let tailClass = pseudoPrefix + overrideClasses[o];
                                      consoleLogBuffer("class: " + tailClass);
                                      currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                                  }
                            }

                            propSpecifityWithMediaVals[propKey] = mergeRanges(
                              propSpecifityWithMediaVals[propKey],
                              currMediaRange
                            );
                          }
                        }
                    }
                    
                  }
                }
              }
            }
          }
        }

        // Preserve icon font classes before removing all classes
        let iconClasses = getIconClasses($editHtml(theElem).attr('class'), tSnippedArr);
        console.log("=== ICON CLASS PRESERVATION ===");
        console.log("Element class attr:", $editHtml(theElem).attr('class'));
        console.log("Icon classes found:", iconClasses);

        // Remove existing classes
        $editHtml(theElem).removeAttr('class');

        consoleLogBuffer("propSpecifityWithMediaVals");
        consoleLogBuffer(propSpecifityWithMediaVals);
        //consoleLogBuffer(theElem);

        // Generate Tailwind classes based on propSpecifityWithMediaVals
        /*
        for (let aProp in propSpecifityWithMediaVals) {
          //consoleLogBuffer("property");
          //consoleLogBuffer(aProp);
          let ranges = propSpecifityWithMediaVals[aProp];
          for (let i = 0; i < ranges.length; i++) {
            let range = ranges[i];
            let tailClasses = range.tailwind_classes;
            let mediaPrefix = '';
            if (range.media_min > -1 || range.media_max < 9999) {                              
              mediaPrefix = getMediaPrefix(range.media_min, range.media_max);
            }
            for (let j = 0; j < tailClasses.length; j++) {
              let tailClass = tailClasses[j];
              if (mediaPrefix) {
                //consoleLogBuffer("media prefix for: " );
                //consoleLogBuffer("min " + range.media_min);
                //consoleLogBuffer("max " + range.media_max);

                tailClass = mediaPrefix + ":" + tailClass;
              }
              consoleLogBuffer("ADDING TAILWIND CLASS: " + tailClass);
              $editHtml(theElem).addClass(tailClass);
            }
          }
        }
        */
       
       //consoleLogBuffer("before merge padding/margin");
       //consoleLogBuffer(propSpecifityWithMediaVals);
       
       propSpecifityWithMediaVals = updatePropSpecifityWithMergedProperties(propSpecifityWithMediaVals);

       //consoleLogBuffer("after merge padding/margin");
       //consoleLogBuffer(propSpecifityWithMediaVals);


        for (let aProp in propSpecifityWithMediaVals) {
          let ranges = propSpecifityWithMediaVals[aProp];
          let hasImportantClass = false;
          let noMediaAtEdge = true;
          let hasMediaMax = false;

          // Check if any class in the ranges starts with '!' or if any range is not at the edges
          for (let range of ranges) {
              // Check for important classes
              for (let tailClass of range.tailwind_classes) {
                if (tailClass.startsWith('!')) {
                  hasImportantClass = true;
                  break;
                }
              }
              if (hasImportantClass) {
                break;
              }

              // Check if range is not at the edges
              if (range.media_min == -1 || range.media_max == 9999) {
                noMediaAtEdge = false;
              }
              if(range.media_max == 9999){
                  hasMediaMax = true;
              }
          }        
          if(hasImportantClass || noMediaAtEdge || !hasMediaMax){ 
            for (let i = 0; i < ranges.length; i++) {
                let range = ranges[i];
                let tailClasses = range.tailwind_classes;
                let mediaPrefix = '';
                if (range.media_min > -1 || range.media_max < 9999) {                              
                  mediaPrefix = getMediaPrefix(range.media_min, range.media_max);
                }
                for (let j = 0; j < tailClasses.length; j++) {
                  let tailClass = tailClasses[j];
                  if(!tailClass){
                      consoleLogBuffer("Bad tailwind class bad Range?");
                      consoleLogBuffer(range);
                      continue;
                  }
                  if (mediaPrefix) {
                    //consoleLogBuffer("media prefix for: " );
                    //consoleLogBuffer("min " + range.media_min);
                    //consoleLogBuffer("max " + range.media_max);

                    tailClass = mediaPrefix + ":" + tailClass;
                  }
                  
                  tailClass = replaceArbitraryValueWithTailwindClass(tailClass);
                  if(!tailClass){
                      consoleLogBuffer("Bad tailwind 222 class bad Range?");
                      consoleLogBuffer(range);
                      continue;
                  }                  
                  consoleLogBuffer("ADDING TAILWIND CLASS: " + tailClass);
                  $editHtml(theElem).addClass(tailClass);
                }
              }
          }else{
            // Reduce the Tailwind classes for this property
            let reducedClasses = reduceTailwindClasses(ranges);

            // Add the reduced classes to the element
            for (let tailClass of reducedClasses) {
              tailClass = replaceArbitraryValueWithTailwindClass(tailClass);
              if(!tailClass){
                  consoleLogBuffer("Bad tailwind 333 class bad Range?");
                  consoleLogBuffer(range);
                  continue;
              }                   
              //consoleLogBuffer("ADDING TAILWIND CLASS: " + tailClass);
              $editHtml(theElem).addClass(tailClass);
            }
          }
        }

        // Restore preserved icon font classes after Tailwind classes are added
        if (iconClasses && iconClasses.length > 0) {
          iconClasses.forEach(cls => $editHtml(theElem).addClass(cls));
          console.log("Restored icon classes:", iconClasses);
          console.log("Final class attr:", $editHtml(theElem).attr('class'));
        }

    }
    catch (error) {
        console.error("Error processing Tailwind element");
        console.error(error);
    }
    //one class

    // Clear current processing ID after this element is done
    CURRENT_PROCESSING_SNIP_ID = '';

    sendAndClearLogBuffer();
  }

  let retHtml = $editHtml.root().html();
  consoleLogBuffer("tailwind rethtml");
  consoleLogBuffer(retHtml);

  return retHtml;
}



function getTailwindBodyClasses(tSnippedArr, forceBreakpoints, resolveVariables, tailwindUltimateArr){
    let propSpecifityWithMediaVals = {};
    let bodyClasses = new Array();
    for(var p = tSnippedArr.length - 1; p >= 0; p--){
      try{
        let tSelector = tSnippedArr[p]['selector'];
        let tBody = tSnippedArr[p]['body'];
        let tMedia = tSnippedArr[p]['media'];
        let tSelIndex = tSnippedArr.length - 1 - p;
        let allSelectors = tSelector.split(',');
        let processProperties = false; 
        let isHtmlSelector = false;
        let isBodySelector = false;
        for(var as = 0; as < allSelectors.length; as++){
            var oneSelector = allSelectors[as];
            var trimSelector = oneSelector.trim();
            if(trimSelector == 'html'){
                isHtmlSelector = true;
            }
            if(trimSelector == 'body'){
                isBodySelector = true;
                processProperties = true;
            }
            // Also process * and :root selectors as global/body styles
            if(trimSelector == '*' || trimSelector == ':root'){
                processProperties = true;
            }
        }
        consoleLogBuffer("tailwind body selector");
        consoleLogBuffer(tSelector);

        if (processProperties) {
            // Calculate specificity score
            let highestScore = 100;
            let bodyUsedProps = {};
            let theBodySplit = tBody.split(/\r?\n/);
            for (var bb = 0; bb < theBodySplit.length; bb++) {
                let line = theBodySplit[bb].trim();
                if (line === '' || line.startsWith('/*')) continue; // Skip empty lines and comments
                if (line.indexOf(':') >= 0) {
                    let tSplit = line.split(/:(.+)/);
                    if (tSplit.length < 2) continue; // Skip invalid lines
                    let tProp = tSplit[0].trim();
                    if (tProp.startsWith('--')){
                        //consoleLogBuffer("skipping variable definition on element: " + tProp);
                        continue;
                    }
                    let modifiedScore = highestScore;
                    if(tProp in bodyUsedProps){
                        bodyUsedProps[tProp] += 1;
                        modifiedScore += bodyUsedProps[tProp];
                    }else{
                        bodyUsedProps[tProp] = 0;
                    }                    

                    let tVal = tSplit[1].trim().replace(/;$/, '');
                    tVal = tVal.replace(/\/\*[\s\S]*?\*\//g, '').trim();
                    
                    //consoleLogBuffer("processing " + tProp);
                    //consoleLogBuffer("val " + tVal);
                    

                    let shortlongType = getPropertyType(tProp);
                    if (shortlongType['type'] == 'short') {
                        // Handle shorthand properties
                        //consoleLogBuffer("SHORTFORM PROPERTY");
                        let expanded = expandShorthandProperty(tProp, tVal);
                        let pOverwritten = expanded['overwritten_properties'];

                        for (let longProp in pOverwritten) {
                            let currMediaRanges = [];
                            let longVal = pOverwritten[longProp];

                            let individualMediaQueries = splitNoParen(tMedia);
                            individualMediaQueries.forEach((individualMedia) => {
                                let ranges = parseMediaQueryToTailwind(individualMedia, forceBreakpoints);
                                currMediaRanges = currMediaRanges.concat(ranges);
                            });

                            // Special cases for 'margin' and 'padding'
                            //overrideClasses are not shortform property

                            let propKey = longProp;
                            if (!(propKey in propSpecifityWithMediaVals)) {
                                propSpecifityWithMediaVals[propKey] = [];
                            }

                            for (let c = 0; c < currMediaRanges.length; c++) {
                                let currMediaRange = currMediaRanges[c];
                                currMediaRange['prop'] = propKey;
                                currMediaRange['score'] = modifiedScore;
                                currMediaRange['ruleIndex'] = tSelIndex;
                                let currLongVal = longVal;
                                if (resolveVariables && currLongVal.indexOf('var') >= 0) {
                                    currLongVal = resolveAllVariables(currLongVal, ['html', 'body']);
                                }


                                let tailClass = cssToTailwind(longProp, currLongVal);
                                if (!tailClass) {
                                    continue;
                                }
                                //consoleLogBuffer("expanded tailwind class " + tailClass);
                                currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];

                                propSpecifityWithMediaVals[propKey] = mergeRanges(
                                    propSpecifityWithMediaVals[propKey],
                                    currMediaRange
                                );
                            }
                        }

                    } else {
                        // Not a shorthand property
                        let currMediaRanges = [];
                        let individualMediaQueries = splitNoParen(tMedia);
                        individualMediaQueries.forEach((individualMedia) => {
                            let ranges = parseMediaQueryToTailwind(individualMedia, forceBreakpoints);
                            currMediaRanges = currMediaRanges.concat(ranges);
                        });
                        if (resolveVariables && tVal.indexOf('var') >= 0) {
                            tVal = resolveAllVariables(tVal, ['html', 'body']);
                        }          
                        let overrideClasses = getOverrideClasses(tProp, tVal);

                        let propKey = tProp;
                        if (!(propKey in propSpecifityWithMediaVals)) {
                            propSpecifityWithMediaVals[propKey] = [];
                        }

                        for (let c = 0; c < currMediaRanges.length; c++) {
                            let currMediaRange = currMediaRanges[c];
                            currMediaRange['prop'] = propKey;
                            currMediaRange['score'] = modifiedScore;
                            currMediaRange['ruleIndex'] = tSelIndex;
                            let currTVal = tVal;
                            if (resolveVariables && currTVal.indexOf('var') >= 0) {
                                currTVal = resolveAllVariables(currTVal, ['html', 'body']);
                            }
                            
                            //consoleLogBuffer("body currProp");
                            //consoleLogBuffer(tProp);
                            //consoleLogBuffer("body currTVal");
                            //consoleLogBuffer(currTVal);

                            if (overrideClasses == null) {
                                let tailClass = cssToTailwind(tProp, currTVal);
                                //consoleLogBuffer("body class " + tailClass);
                                if (!tailClass) {
                                    continue;
                                }
                                currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                            } else {
                                for (let o = 0; o < overrideClasses.length; o++) {
                                    let tailClass = overrideClasses[o];
                                    currMediaRange['tailwind_classes'] = [...(currMediaRange['tailwind_classes'] || []), tailClass];
                                }
                            }
                            //consoleLogBuffer("index of rule: " + p + " for prop " + propKey);
                            //consoleLogBuffer(tMedia);
                            //consoleLogBuffer("Existing range");
                            //consoleLogBuffer(propSpecifityWithMediaVals[propKey]);
                            //consoleLogBuffer("Adding range for media query: ");
                            //consoleLogBuffer(currMediaRange);                            

                            propSpecifityWithMediaVals[propKey] = mergeRanges(
                                propSpecifityWithMediaVals[propKey],
                                currMediaRange
                            );
                        }
                    }
                }
            }
        }
      }
      catch(bex){
          consoleLogBuffer("error with body classes");
          consoleLogBuffer(bex);
      }  
    }
    
    
    //consoleLogBuffer("PROCESSING THE TAILWIND ULTIMATE");
    //consoleLogBuffer(tailwindUltimateArr);
    // Example subset:
    const ALLOWED_INHERITED_PROPS = [
      'background-color',
      'background',
      'font-size',
      'font',
      'font-family',
      'color', // often "font-color"
    ];

    // We'll assign a *slightly higher specificity* for these ultimate rules: say 200
    // or you can do e.g. 9999 if you want them always last
    const ultimateSpecificity = 200;
    const ultimateRuleIndex = 9999;

    for (let i = 0; i < tailwindUltimateArr.length; i++) {
      const rule = tailwindUltimateArr[i];
      const theSelector = rule.selector.trim();
      const theBodyLines = rule.body.split(/\r?\n/);
      const theMedia = rule.media || '';
      
      
      //consoleLogBuffer(theSelector);
      //consoleLogBuffer(theBodyLines);
      //consoleLogBuffer(theMedia);

      // Skip unless we specifically want "body"
      if (theSelector !== 'body') {
        consoleLogBuffer("skipping not body");
        continue;
      }

      for (let line of theBodyLines) {
        line = line.trim();
        if (!line || line.startsWith('/*')) continue;
        if (line.indexOf(':') < 0) continue;

        let [rawProp, rawVal] = line.split(/:(.+)/);
        if (!rawVal) continue;

        let prop = rawProp.trim();
        let val = rawVal.trim().replace(/;$/, '');

        if (!ALLOWED_INHERITED_PROPS.includes(prop)) {
          //consoleLogBuffer("SKIPPING ULTIMATE PROP " + prop);
          continue;
        }

        if (resolveVariables && val.indexOf('var') >= 0) {
          val = resolveAllVariables(val, ['body']);
        }

        // Try shorthand override
        let overrideClasses = getOverrideClasses(prop, val);
        let tailClasses = [];
        if (!overrideClasses) {
          // single property => tailwind
          const twClass = cssToTailwind(prop, val);
          if (twClass) tailClasses.push(twClass);
        } else {
          tailClasses = overrideClasses;
        }
        if (tailClasses.length === 0) {
          continue;
        }

        // parse media
        let mediaRanges = parseMediaQueryToTailwind(theMedia, forceBreakpoints);
        if (mediaRanges.length === 0) {
          // fallback to full range
          mediaRanges = [
            { media_min: -1, media_max: 9999, tailwind_classes: [] },
          ];
        }

        // push into the SAME propSpecifityWithMediaVals
        if (!propSpecifityWithMediaVals[prop]) {
          propSpecifityWithMediaVals[prop] = [];
        }
        mediaRanges.forEach((mr) => {
          let newObj = {
            media_min: mr.media_min,
            media_max: mr.media_max,
            tailwind_classes: [...tailClasses],
            score: ultimateSpecificity,
            ruleIndex: ultimateRuleIndex,
            prop,
          };
          //consoleLogBuffer("ADDING NEW ULITIMATE TAILWIND THING");
          //consoleLogBuffer(newObj);
          
          propSpecifityWithMediaVals[prop] = mergeRanges(
            propSpecifityWithMediaVals[prop],
            newObj
          );
        });
      }
    }    
    
    //consoleLogBuffer("propSpecificityWithMediaVals");
    //consoleLogBuffer(propSpecifityWithMediaVals);
    propSpecifityWithMediaVals = updatePropSpecifityWithMergedProperties(
      propSpecifityWithMediaVals
    );    

    // Generate Tailwind classes based on propSpecifityWithMediaVals
    for (let aProp in propSpecifityWithMediaVals) {
        let ranges = propSpecifityWithMediaVals[aProp];
        for (let i = 0; i < ranges.length; i++) {
            let range = ranges[i];
            let tailClasses = range.tailwind_classes;
            let mediaPrefix = '';
            if (range.media_min > -1 || range.media_max < 9999) {
                mediaPrefix = getMediaPrefix(range.media_min, range.media_max);
            }
            for (let j = 0; j < tailClasses.length; j++) {
                let tailClass = tailClasses[j];
                if (mediaPrefix) {
                    tailClass = mediaPrefix + ":" + tailClass;
                }
                if (!bodyClasses.includes(tailClass)) {
                    bodyClasses.push(tailClass);
                }
            }
        }
    }

    return bodyClasses;
}

// Function to replace arbitrary value classes with standard Tailwind classes
// Function to replace arbitrary value classes with standard Tailwind classes
function replaceArbitraryValueWithTailwindClass(tailClass) {
  // Split the tailClass by ':', to separate the prefixes
  const classParts = tailClass.split(':');
  const baseClass = classParts.pop(); // This is the actual class, e.g., 'px-[2rem]'

  // List of prefixes to check
  const prefixesToCheck = [
    'm-', 'mt-', 'mb-', 'ml-', 'mr-', 'mx-', 'my-', 'ms-', 'me-',
    'p-', 'pt-', 'pb-', 'pl-', 'pr-', 'px-', 'py-', 'ps-', 'pe-',
    'space-x-', 'space-y-',
    'gap-', 'gap-x-', 'gap-y-',
    'inset-', 'top-', 'right-', 'bottom-', 'left-', 'start-', 'end-',
    'w-', 'h-'
  ];

  // Regular expression to match arbitrary value classes
  const arbitraryValueRegex = new RegExp(`^(${prefixesToCheck.join('|').replace(/-/g, '\\-')})\\[(.+)\\]$`);

  const match = baseClass.match(arbitraryValueRegex);

  if (match) {
    const fullPrefix = match[1]; // e.g., 'px-'
    const value = match[2]; // e.g., '2rem'

    // Convert the value to pixels
    const pxValue = getArbitraryPxValue(value);
    if (pxValue !== null) {
      // Find the closest Tailwind spacing value
      const closestTailwindClass = getClosestTailwindSpacingClass(pxValue);

      if (closestTailwindClass) {
        // Reconstruct the class with the Tailwind class suffix
        const newBaseClass = fullPrefix + closestTailwindClass;
        
        //consoleLogBuffer("post-processing arbitrary class found " + tailClass);
        // Reconstruct the tailClass with prefixes
        const newTailClass = [...classParts, newBaseClass].join(':');
        //consoleLogBuffer("converted class to: ");
        //consoleLogBuffer(newTailClass);

        return newTailClass;
      }
    }
  }

  // If no match or no mapping found, return the original tailClass
  return tailClass;
}

// Function to convert value to pixels
function getArbitraryPxValue(value) {
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
    // Cannot convert percentages without context
    return null;
  } else if (value.endsWith('vh') || value.endsWith('vw')) {
    // Cannot convert viewport units without context
    return null;
  } else {
    // If no unit, assume px
    return numValue;
  }
}

function getClosestTailwindSpacingClass(pxValue) {
  // Tailwind's spacing scale (values in pixels)
  const tailwindSpacingScale = {
    0: '0',
    2: '0.5',   // 0.125 * 16 = 2px
    4: '1',     // 0.25 * 16 = 4px
    6: '1.5',   // 0.375 * 16 = 6px
    8: '2',     // 0.5 * 16 = 8px
    10: '2.5',  // 0.625 * 16 = 10px
    12: '3',    // 0.75 * 16 = 12px
    14: '3.5',  // 0.875 * 16 = 14px
    16: '4',    // 1 * 16 = 16px
    20: '5',    // 1.25 * 16 = 20px
    24: '6',    // 1.5 * 16 = 24px
    28: '7',    // 1.75 * 16 = 28px
    32: '8',    // 2 * 16 = 32px
    36: '9',    // 2.25 * 16 = 36px
    40: '10',   // 2.5 * 16 = 40px
    44: '11',   // 2.75 * 16 = 44px
    48: '12',   // 3 * 16 = 48px
    56: '14',   // 3.5 * 16 = 56px
    64: '16',   // 4 * 16 = 64px
    80: '20',   // 5 * 16 = 80px
    96: '24',   // 6 * 16 = 96px
    112: '28',  // 7 * 16 = 112px
    128: '32',  // 8 * 16 = 128px
    144: '36',  // 9 * 16 = 144px
    160: '40',  // 10 * 16 = 160px
    176: '44',  // 11 * 16 = 176px
    192: '48',  // 12 * 16 = 192px
    208: '52',  // 13 * 16 = 208px
    224: '56',  // 14 * 16 = 224px
    240: '60',  // 15 * 16 = 240px
    256: '64',  // 16 * 16 = 256px
    288: '72',  // 18 * 16 = 288px
    320: '80',  // 20 * 16 = 320px
    384: '96',  // 24 * 16 = 384px
  };

  // Convert the scale to an array of values for comparison
  const spacingValues = Object.keys(tailwindSpacingScale).map(Number);

  // Find the closest value
  let closestValue = null;
  let smallestDifference = Infinity;

  for (const value of spacingValues) {
    const difference = Math.abs(pxValue - value);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestValue = value;
    }
  }

  // Allow a tolerance (e.g., 0.5px) for matching
  if (smallestDifference <= 0.5) {
    return tailwindSpacingScale[closestValue];
  }

  // If no close match, return null
  return null;
}



/**
 * Parses a var() function call with proper parenthesis matching
 * @param {string} str - The string starting with 'var('
 * @param {number} startIndex - Index where 'var(' starts
 * @returns {object} - {varName, defaultValue, endIndex, fullMatch} or null if invalid
 */
function parseVarFunction(str, startIndex) {
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

/**
 * Resolves all CSS var() references in a value string
 * @param {string} value - The CSS value potentially containing var() references
 * @param {array} elementLabels - Array of element class labels for scoped lookup
 * @param {number} maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @param {number} currentDepth - Current recursion depth
 * @returns {string} - The value with all var() references resolved
 */
function resolveAllVariables(value, elementLabels, maxDepth = 10, currentDepth = 0) {
    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
        console.error(`Maximum recursion depth (${maxDepth}) reached resolving CSS variables in: ${value}`);
        return value;
    }

    let resolvedValue = value;
    let unresolvedVars = new Set();
    const cssVarMap = {};
    let hasUnresolvedVars = false;

    // Find all var() occurrences using proper parenthesis matching
    let i = 0;
    const replacements = []; // Array of {start, end, replacement}

    while (i < resolvedValue.length) {
        const varIndex = resolvedValue.indexOf('var(', i);
        if (varIndex === -1) {
            break;
        }

        const parsed = parseVarFunction(resolvedValue, varIndex);
        if (!parsed) {
            // Invalid var() syntax, skip this one
            i = varIndex + 4;
            continue;
        }

        const { varName, defaultValue, endIndex, fullMatch } = parsed;

        //consoleLogBuffer("Resolving " + varName + " with default: " + defaultValue);

        // Try to resolve the variable
        const resolvedRanges = resolveCssVariableValue(varName, elementLabels, cssvarDefinedArr, cssVarMap);
        let concreteValue;

        if (resolvedRanges && resolvedRanges.length > 0) {
            // Found in cssvarDefinedArr
            concreteValue = resolvedRanges[0].concrete_value;
            //consoleLogBuffer('Resolved variable:', varName, 'to value:', concreteValue);
        } else if (defaultValue !== null) {
            // Use default value (might contain nested var())
            concreteValue = defaultValue;
            //consoleLogBuffer('Using default value for variable:', varName, 'default value:', concreteValue);

            // Recursively resolve nested var() in default value
            if (concreteValue.includes('var(')) {
                concreteValue = resolveAllVariables(concreteValue, elementLabels, maxDepth, currentDepth + 1);
            }
        } else {
            // Could not resolve - remove the var() entirely to avoid malformed output
            console.error(`Could not resolve variable ${varName} - removing from output`);
            unresolvedVars.add(varName);
            hasUnresolvedVars = true;
            concreteValue = ''; // Replace with empty string instead of leaving broken var()
        }

        // Special handling for linear-gradient (legacy hack)
        if (value.indexOf('linear-gradient') >= 0 && concreteValue) {
            concreteValue = concreteValue + " ";
        }

        // Store replacement
        replacements.push({
            start: varIndex,
            end: endIndex,
            replacement: concreteValue
        });

        i = endIndex;
    }

    // Apply replacements in reverse order to maintain correct indices
    for (let j = replacements.length - 1; j >= 0; j--) {
        const { start, end, replacement } = replacements[j];
        resolvedValue = resolvedValue.substring(0, start) + replacement + resolvedValue.substring(end);
    }

    // Recursively resolve any newly introduced var() references (from resolved values)
    if (resolvedValue.includes('var(') && currentDepth < maxDepth - 1) {
        resolvedValue = resolveAllVariables(resolvedValue, elementLabels, maxDepth, currentDepth + 1);
    }

    if (unresolvedVars.size > 0 && currentDepth === 0) {
        console.error('Unresolved variables:', Array.from(unresolvedVars));
    }

    return resolvedValue;
}





