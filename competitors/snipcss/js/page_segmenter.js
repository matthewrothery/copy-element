
var SEGM = SEGM || {};

SEGM.MAX_PARENT_SECTION = 800;

SEGM.getElementDepth = function(element) {
  let depth = 0;
  let currentElement = element;
  while (currentElement.parentNode && currentElement.parentNode !== document.body) {
    currentElement = currentElement.parentNode;
    depth++;
  }
  return depth;
};

SEGM.processElements = function(elementsArray) {
  const depthMap = new Map(); // Map from depth to Set of elements at that depth
  const elementDepths = new Map(); // Map from element to its depth
  let maxDepth = 0;

  // Build depthMap and elementDepths
  elementsArray.forEach(elem => {
    let depth = SEGM.getElementDepth(elem);
    elementDepths.set(elem, depth);
    if (!depthMap.has(depth)) {
      depthMap.set(depth, new Set());
    }
    depthMap.get(depth).add(elem);
    if (depth > maxDepth) maxDepth = depth;
  });

  // Convert elementsArray to a Set for efficient removal
  let elementsSet = new Set(elementsArray);

  // Keep track of elements already processed to avoid duplicates
  const processedElements = new Set(elementsArray);

  // Process from maxDepth down to 1
  for (let depth = maxDepth; depth >= 1; depth--) {
    //console.log("ON DEPTH: " + maxDepth);
    const elementsAtDepth = depthMap.get(depth);
    if (!elementsAtDepth) continue;
    //console.log("elementsAtDepth:");
    //console.log(elementsAtDepth);
    
    elementsAtDepth.forEach(elem => {
      const parent = elem.parentNode;
      if (parent && parent !== document.body) {
        const parentHeight = parent.offsetHeight;
        if (parentHeight < 2000) {
          if (!processedElements.has(parent)) {
            // Add parent to depthMap for its depth
            const parentDepth = depth - 1;
            if (!depthMap.has(parentDepth)) {
              depthMap.set(parentDepth, new Set());
            }
            depthMap.get(parentDepth).add(parent);
            processedElements.add(parent);
            elementsSet.add(parent);
          }
          elementsSet.delete(elem);
        }
      }
    });
  }

  return Array.from(elementsSet);
};

SEGM.getElementsAtGridPoints = function(step) {
  const elements = new Set();
  for (let x = 0; x <= window.innerWidth; x += step) {
    for (let y = 0; y <= window.innerHeight; y += step) {
      const elem = document.elementFromPoint(x, y);
      if (elem && !['SCRIPT', 'STYLE', 'IFRAME'].includes(elem.tagName)) {
        elements.add(elem);
      }
    }
  }
  return elements;
};


SEGM.filterElements = function(elementsArray) {
  // 1) Remove body right away from elementsArray
  elementsArray = elementsArray.filter(element => {
    // Also filter out skipcss / snipcss as before
    if (!element.classList) return (element !== document.body);
    const classList = Array.from(element.classList);
    
    // Exclude body, and exclude skipcss/snipcss
    return (
      element !== document.body &&
      !classList.includes('skipcss') &&
      !classList.some(className => className.includes('snipcss'))
    );
  });

  // Convert elementsArray to a Set for efficient lookups
  const elementsSet = new Set(elementsArray);

  // Map from element to its direct children that are in elementsSet
  const elementToChildren = new Map();

  // 2) Build a parent-to-children map, skipping body
  elementsArray.forEach(element => {
    const parent = element.parentElement;
    // If the parent is in our set and not body, record this child
    if (parent && parent !== document.body && elementsSet.has(parent)) {
      if (!elementToChildren.has(parent)) {
        elementToChildren.set(parent, new Set());
      }
      elementToChildren.get(parent).add(element);
    }
  });

  // Set to keep track of elements to be removed
  const elementsToRemove = new Set();

  // Process each parent element that has children in the list
  elementToChildren.forEach((childrenSet, parent) => {
    // Get all direct children of the parent, excluding script, style, and iframe
    const allDirectChildren = Array
      .from(parent.children)
      .filter(child => !['SCRIPT', 'STYLE', 'IFRAME'].includes(child.tagName));

    // Check if all direct children are in elementsSet
    const allChildrenInSet = allDirectChildren.every(child => elementsSet.has(child));

    if (allChildrenInSet) {
      // Exclude the parent from the final list
      elementsToRemove.add(parent);
    } else {
      // There are missing direct children
      // Count total elements inside the parent at any level
      const totalDescendants = parent
        .querySelectorAll('*:not(script):not(style):not(iframe)').length;

      if (totalDescendants > SEGM.MAX_PARENT_SECTION) {
        // Add missing direct children to the elementsSet
        allDirectChildren.forEach(child => {
          if (!elementsSet.has(child)) {
            elementsSet.add(child);
          }
        });
        // Exclude the parent from the final list
        elementsToRemove.add(parent);
      } else {
        // Keep the parent and remove all its descendants
        elementsSet.forEach(elem => {
          if (parent !== elem && parent.contains(elem)) {
            elementsToRemove.add(elem);
          }
        });
      }
    }
  });

  // Remove elements marked for removal
  elementsToRemove.forEach(elem => elementsSet.delete(elem));

  // 3) Finally, ensure body is not included in the returned Array
  return Array.from(elementsSet).filter(element => element !== document.body);
};


SEGM.printElementBoundingBoxes = function(elementsArray) {
  console.group('Element Bounding Boxes');
  
  elementsArray.forEach((element, index) => {
    
    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    // Get absolute coordinates (accounting for scroll position)
    const box = {
      top: Math.round(rect.top + scrollY),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom + scrollY),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    
    // Get a descriptive identifier for the element
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const identifier = `${element.tagName.toLowerCase()}${id}${className}`;
    
    //console.group(`Element ${index + 1}: ${identifier}`);
    //console.log(`Position: (${box.left}, ${box.top})`);
    //console.log(`Dimensions: ${box.width}px Ã— ${box.height}px`);
    //console.log(`Bounds: left=${box.left}, top=${box.top}, right=${box.right}, bottom=${box.bottom}`);
    //console.groupEnd();
  });
  
  //console.groupEnd();
};

SEGM.highlightElements = function(processedElements) {
  // Colors to cycle through
  const colors = ['#0061ff', '#990000', '#9b3af2', '#6111a9', '#76bfff', '#355de5'];
  const selectionBoxes = [];
  
  processedElements.forEach((element, index) => {
    //console.log("highlight element");
    //console.log(element);
    try{
        // Cycle through colors using modulo operator
        const colorIndex = index % colors.length;
        const color = colors[colorIndex];

        // Create new SelectionBox with the chosen color
        const selBox = new SelectionBox(null, color, null);
        selBox.highlight(element);
        selectionBoxes.push(selBox);
    }catch(exxx){
        console.log("could not highlight");
        console.log(exxx);
        console.log(element);
    }
  });
  
  // Return the array of selection boxes in case we need to remove them later
  return selectionBoxes;
};


async function collectElements(step) {
  const elements = new Set();
  let previousScrollHeight = 0;
  const maxAttempts = 0;
  let attempts = 0;
  
  let myScrollHeight = document.body.scrollHeight;
  //console.log("my scroll height: " + myScrollHeight);
  if(myScrollHeight < 3500){
      attempts = 1;
  }
  if(myScrollHeight < 2500){
      attempts = 2;
  }

  // Step 1: Scroll to the bottom multiple times to trigger lazy loading
  while (attempts < maxAttempts) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for lazy loading
    const newScrollHeight = document.body.scrollHeight;
    if (newScrollHeight > previousScrollHeight) {
      previousScrollHeight = newScrollHeight;
      attempts = 0; // Reset attempts if new content is loaded
    } else {
      attempts++;
    }
  }

  // Step 2: Scroll from top to bottom, collecting elements at each grid point
  const totalHeight = document.body.scrollHeight;
  let scrollY = 0;
  const scrollStep = window.innerHeight * 0.9; // Overlap scroll to ensure coverage

  while (scrollY < totalHeight - window.innerHeight) {
    window.scrollTo(0, scrollY);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for rendering
    const viewportElements = SEGM.getElementsAtGridPoints(step);
    viewportElements.forEach(elem => elements.add(elem));
    scrollY += scrollStep;
  }

  // Collect elements at the very bottom of the page
  window.scrollTo(0, totalHeight - window.innerHeight);
    await new Promise(resolve => setTimeout(resolve, 500));
    const bottomElements = SEGM.getElementsAtGridPoints(step);
    bottomElements.forEach(elem => elements.add(elem));

  // Convert the Set to an Array and return
  return Array.from(elements);
}

SEGM.getUniqueSelector = function(elem, pastArray)
{
    //console.log("element");
    //console.log(elem);
    // Check if the element is valid
    if (!elem || !elem.nodeName) {
      console.warn("Invalid element passed to getUniqueSelector", elem);
      return null;
    }

    // Get the element's parent
    var $elem = $(elem);
    var currParent = $elem.parent().get(0);
    if (!currParent || !currParent.nodeName) {
      console.warn("Invalid parent element for", elem);
      return null;
    }    
    //console.log("parent ");
    //console.log(currParent);
    var parentTag = currParent.nodeName.toLowerCase();
    var elemTag = elem.nodeName.toLowerCase();
    
    var thePast = "";
    if(pastArray.length > 0){
        for(var x = pastArray.length - 1; x >= 0; x--){
            thePast += " " + pastArray[x];
        }
    }    
    //console.log("ON " + elemTag + " past selector now " + thePast);
   
    if(parentTag == "body") //no div, li, tr found
    {	
        var myIndex = $('body').children().index(elem) + 1;       
        return 'body' + " > " + elemTag + ":nth-child(" + myIndex + ")";
    }
    var THE_SELECTOR = elemTag;
    //console.log("selector " + THE_SELECTOR);
    var myIndex = $(currParent).children().index(elem) + 1;
    THE_SELECTOR = elemTag + ":nth-child(" + myIndex + ")";
    
    const forbiddenParents = [document.body, document.documentElement, document];

    
    var maxLevels = 100;
    var currParentTag = "";
    //should never get to html... body should be enough
    while(currParent !== $('body').get(0)){     
        if (!currParent) {
          // We lost our parent; let's see if THE_SELECTOR alone is unique
          console.log("Encountered missing parent while traversing upward:", elem);
          return finalizeOrFallbackSelector(THE_SELECTOR, elem);
        }

        if (!currParent.nodeName) {
          // This parent is not a valid HTML element (e.g., text node?),
          // so again let's see if THE_SELECTOR is unique so far
          console.log("Parent is missing nodeName:", currParent);
          return finalizeOrFallbackSelector(THE_SELECTOR, elem);
        }     
        console.log("current parent is");
        console.log(currParent);
        if (forbiddenParents.includes(currParent)) {
            console.warn("Element's parent is body, html, or document:", elem);
            return null;
        }        
        
        var prevElem = currParent;
        var prevElemTagname = prevElem.nodeName.toLowerCase();
        currParent = $(currParent).parent().get(0);
        var myIndex = $(currParent).children().index(prevElem) + 1;
        currParentTag = currParent.nodeName.toLowerCase();
        var testSelector = prevElemTagname + " > " + THE_SELECTOR;
        //console.log("structure listselector now1111 --------------- " + testSelector);
        //console.log(currParent);
        //console.log(currParent);
        if(testSelectorCount(testSelector, 1, '')){            
            return testSelector;
        }
        THE_SELECTOR = prevElemTagname + ":nth-child(" + myIndex + ")" + " > " + THE_SELECTOR;
        if(currParentTag == 'body'){
            //console.log("breaking because body");            
            break;
        }
        
        maxLevels--;
        if(maxLevels < 0){
            //alert("max levels exceeded");
            break;
        }
    }    
    //console.log("selector before");
    //console.log(THE_SELECTOR);
    THE_SELECTOR = "body > " + THE_SELECTOR;
    //console.log("after ");
    //console.log(THE_SELECTOR);
    if(testSelectorCount(testSelector, 1, '')){            
        return testSelector;
    }    
    if(testSelectorCount(THE_SELECTOR, 1, '')){
        return THE_SELECTOR;        
    }
    
    
    //alert("SHould not happen list selector ");
    return null; 
};

function finalizeOrFallbackSelector(partialSelector, originalElem) {
  // If partialSelector is unique, return it
  if (testSelectorCount(partialSelector, 1, '')) {
    return partialSelector;
  }
  // If that fails, you can do a fallback:
  // e.g., use the tag name or an ID if it exists
  if (originalElem.id) {
    const idSelector = `#${originalElem.id}`;
    // If ID is truly unique in the DOM, return it
    if (testSelectorCount(idSelector, 1, '')) {
      return idSelector;
    }
  }
  // Otherwise, you can return null or last-resort fallback
  console.warn("No unique selector found. Returning null.");
  return null;
}