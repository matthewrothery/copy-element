        window.snipcssUtils = {
            SNIP_CSS_CURRENT_ID: 1,
            SNIP_CSS_ALL_IDS :new Array(),
            SNIP_CSS_ALL_CLASSES : new Array(),
            snipcssLabelSubelements: function(level, parentId, elem, labelIndex) {
                var nextLevel = level + 1;
                try{
                    for (var i = 0; i < elem.children.length; i++) {                       
                       var child = elem.children[i];
                       if($(child).hasClass('skipcss')){
                           //console.log("skipping element");
                           //console.log(child);
                           continue;
                       }
                       var currId = this.SNIP_CSS_CURRENT_ID;
                       //console.log("child");
                       //console.log(child);f

                       var myClass = "snipcss" + labelIndex + "-" + level + "-" + parentId + "-" + this.SNIP_CSS_CURRENT_ID;
                       //console.log("adding class " + myClass);
                       //console.log("tagname " + child.tagName);
                       if(child.tagName == 'path' || child.tagName == 'rect' || child.tagName == 'circle' ||
                          child.tagName == 'ellipse' || child.tagName == 'line' || child.tagName == 'polyline' ||
                          child.tagName == 'polygon'){
                          //console.log("skipping svg");
                          //child.setAttribute('class', child.getAttribute('class'));
                          //use setAttrubute instead?
                        }
                        else{
                            child.classList.add(myClass);
                            this.SNIP_CSS_ALL_CLASSES.push(myClass);
                            this.SNIP_CSS_ALL_IDS.push(currId);
                            this.SNIP_CSS_CURRENT_ID++;                        
                        }

                       this.snipcssLabelSubelements(nextLevel, currId, child, labelIndex);    
                   }
                   
                }catch(e){
                    //console.log("something bad")
                    //console.log(e);
                    //console.log("Bad stylesheet maybe ok if no sourceurl: " + astylesheet['source_url']);
                    //console.log(astylesheet);          
                    
                }                
            },
            snipcssReplaceAll: function(string, find, replace) {
              var escapeRegExp = function(string) {
                    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
              }                
              return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
            },
            snipcssGetOuterHtml : function(elemSelector){
                //console.log("elem selector: " + elemSelector);
                $(elemSelector).find('script').remove();
                var elem;
                //var elem = document.querySelector(elemSelector);                
                //console.log("outer html");
                //console.log(elem.outerHTML);
                try{
                    elem = $(elemSelector).get(0);
                }catch(ex){                    
                    elem = document.querySelector(elemSelector);                
                }
                //console.log("elem");
                //console.log(elem);
                if($(elem).find('.skipcss').length > 0){
                    //console.log("skipping some html");
                    var $clone = $(elem).clone();
                    $clone.find('.skipcss').remove();
                    elem = $clone.get(0);
                }
                    
                
                //console.log("outer html before stringify");
                //console.log(elem.outerHTML);
                var myOuterHtml = JSON.stringify(elem.outerHTML);
                //console.log("outer html after stringify");
                //console.log(myOuterHtml);
                
                //let testResult = JSON.parse(myOuterHtml);
                //console.log("unstringify");
                //console.log(testResult);
                
                return myOuterHtml;
                
                //var sOuterHTML = new XMLSerializer().serializeToString(elem);
                //sOuterHTML = sOuterHTML.replace('xmlns="http://www.w3.org/1999/xhtml"', '');                  
                //return JSON.stringify(sOuterHTML);
            },
            snipcssTestRemoveElementAttributes(elem){
                
                //why would anyone do this shit?
                //https://css-tricks.com/a-complete-guide-to-data-attributes/
                var theHtml = elem.outerHTML;
                var $editHtml = $(theHtml);
                var keepArr = ['align', 'valign', 'bgcolor', 'background', 'width','height', 'style', 'src', 'href', 'source', 'dir'];
                //console.log("html before");
                //console.log(theHtml);
                $editHtml.find("*").addBack().each(function() {
                  //console.log("what is this");
                  //console.log(this);
                  var me = this;
                  $.each(this.attributes, function() {
                    // this.attributes is not a plain object, but an array
                    // of attribute nodes, which contain both the name and value
                    if(this.specified) {
                      //console.log("found attribute");
                      //console.log(this.name, this.value);                      
                      
                      var aName = this.name.toLowerCase();
                      if($.inArray(aName, keepArr) !== -1){
                          return;
                      }
                      if(aName == 'class'){
                        var classList = me.className.split(/\s+/);
                        for (var i = 0; i < classList.length; i++) {
                            //looped through snipped array
                            
                        }                                
                        return;
                      }
                      else if(aName == 'id' || aName == 'name'){
                        //loop through snipped array
                        //this.value
                        //snippedArr[i].indexOf(this.value) >= 0, keep it
                        return;
                      }                      
                      me.removeAttribute(this.name);
                    }
                  });
                });     
                //console.log("html after");
                //console.log($editHtml.html());
                
            },
            snipcssGetZipOuterHtml : function(elemSelector){
                var $aClone = $(elemSelector).clone();
                var allSources = new Array(); 
                var elem = $(elemSelector).get(0);
                if(elem.tagName == 'img'){
                    var rootSrc = elem.src;
                    if(rootSrc){
                        allSources.push(rootSrc);
                    }
                }

                //var images = $aClone.querySelectorAll('img,input,button');
                $aClone.find('img,input,button').each(function(i, item){
                    //console.log(img);
                    var elemSrc = this.src;
                    if(!elemSrc)
                    {
                        return;
                    }           
                    var existsAlready = false;
                    for (var i = 0; i < allSources.length; i++) {
                        if (allSources[i] === elemSrc) {
                            existsAlready = true;
                        }
                    }                    
                    if(existsAlready){
                        //exists already... 
                        //continue;
                    }else{
                        allSources.push(elemSrc);                    
                    }                          
                    var hImage = "";
                    if(elemSrc.indexOf("\/") >= 0)
                    {
                            //Firebug.Console.log("inside elemsrc");  
                            var sArr = elemSrc.split("\/");
                            var imgName = sArr[sArr.length - 1];
                            hImage = "SNIPPATH_TO_IMAGES_" + imgName;            
                            this.src = hImage;
                    }
                    else
                    {
                            hImage = "SNIPPATH_TO_IMAGES_" + imgName;            
                            this.src = hImage;   
                    }
                });             
                
                if($aClone.find('.skipcss').length > 0){
                    //console.log("skipping some html");
                    $aClone.find('.skipcss').remove();
                }
                
                
                //console.log("clone html");
                //console.log($aClone.html());
                
                var outerHtml = $aClone.get(0).outerHTML;
                //console.log("real html");
                //console.log(outerHtml);
                
                return JSON.stringify(outerHtml);
            },
            snipcssGetHtmlImages : function(allSelectors){
                
                //console.log("in html images with ");
                //console.log(allSelectors);
                var allSources = new Array();                   
                for(var m = 0; m < allSelectors.length; m++){
                    var parentSelector = allSelectors[m];
                    if($(parentSelector).length <= 0){
                        continue;
                    }
                    //console.log("parent selector " + parentSelector);
                    
                    var elem = $(parentSelector).get(0);
                    if(elem.tagName == 'img'){
                        var rootSrc = elem.src;
                        if(rootSrc){
                            allSources.push(rootSrc);
                        }
                    }
                    var images = elem.querySelectorAll('img,input,button');
                    //console.log("images len " + images.length);
                    for(var x = 0; x < images.length; x++){
                        var img = images[x];
                        //console.log(img);
                        var elemSrc = img.src;
                        if(!elemSrc)
                        {
                            continue;
                        }           
                        var existsAlready = false;
                        for (var i = 0; i < allSources.length; i++) {
                            if (allSources[i] === elemSrc) {
                                existsAlready = true;
                            }
                        }   
                        let skipIt = false;
                        if($(img).parents('.skipcss').length > 0){
                            skipIt = true;
                        }


                        if(existsAlready || skipIt){
                            //exists already... 
                            //continue;
                        }else{
                            allSources.push(elemSrc);                    
                        }          
                        var SITE_URL = window.location.href;
                        var myUrl = URI.resolve(SITE_URL, elemSrc);
                        //console.log("old source " + elemSrc);
                        img.src = myUrl;                    

                        //console.log("new source " + myUrl);
                        /*
                        var hImage = "";
                        if(elemSrc.indexOf("\/") >= 0)
                        {
                                //Firebug.Console.log("inside elemsrc");  
                                var sArr = elemSrc.split("\/");
                                var imgName = sArr[sArr.length - 1];
                                hImage = "SNIPPATH_TO_IMAGES_" + imgName;            
                                img.src = hImage;
                        }
                        else
                        {
                                hImage = "SNIPPATH_TO_IMAGES_" + imgName;            
                                img.src = hImage;   
                        }*/
                    }
                }
                    //revert back the sources...
                    //why
                    /*
                    setTimeout(function(){
                        for(var x = 0; x < images.length; x++){
                            var aSource = allSources[x];
                            images[x].src = aSource;
                        }                    
                    }, 1000);
                    */
               
                return allSources.join('|');
            },   
            //snipcss-level-parentid-currentid
            snipcssCheckIfCheckbox : function(elemSelector){
                try{
                    let theType = $(elemSelector).attr('type');
                    if(theType.toLowerCase() == 'checkbox' || theType.toLowerCase() == 'radio'){
                        $(elemSelector).prop('checked', true);
                        return "yes";
                    }
                }
                catch(exxxx){
                    console.log("Error checking checkbox");
                    console.log(exxxx);
                }
                return "no";
            },
            snipcssGetParentLabels: function(elemSelector){                
                let parentList = new Array();
                $.each($(elemSelector).parents(), function(i, item){
                    var classList = this.className.split(/\s+/);
                    for (var i = 0; i < classList.length; i++) {
                        if (classList[i].indexOf('snipcss-') >= 0 || classList[i].indexOf('snipcss0-') >= 0 ||
                                classList[i].indexOf('snipcss1-') >= 0 || classList[i].indexOf('snipcss2-') >= 0 ||
                                classList[i].indexOf('snipcss3-') >= 0) {
                            //console.log("inherited element is part of snip tree");
                            parentList.push(classList[i]);                            
                        }
                    }                       
                });
                if(parentList.length <= 0){
                    return "";
                }
                return parentList.join(",");                
            },
            snipcssGetMatchingLabels(testSelector) {
                let labels = [];
                let elements = document.querySelectorAll(testSelector);
                elements.forEach(function(element) {
                    let classList = element.className.split(/\s+/);
                    for (var i = 0; i < classList.length; i++) {
                        if (classList[i].indexOf('snipcss-') >= 0 || classList[i].indexOf('snipcss0-') >= 0 ||
                                classList[i].indexOf('snipcss1-') >= 0 || classList[i].indexOf('snipcss2-') >= 0 ||
                                classList[i].indexOf('snipcss3-') >= 0) {
                            //console.log("inherited element is part of snip tree");
                            labels.push(classList[i]);                            
                        }
                    }  
                });
                if (labels.length <= 0) {
                    return "";
                }
                return labels.join(",");
            },                        
            snipcssGetOuterParentLabels: function(elemSelector){
                let parentList = new Array();
                $.each($(elemSelector).parents(), function(i, item){
                    var classList = this.className.split(/\s+/);
                    for (var i = 0; i < classList.length; i++) {
                        if (classList[i].indexOf('snipparent-') >= 0) {
                            //console.log("inherited element is part of snip tree");
                            parentList.push(classList[i]);                            
                        }
                    }                       
                });
                if(parentList.length <= 0){
                    return "";
                }
                return parentList.join(",");                                
            },
            snipcssLabelAll: function (elemSelector, labelIndex) {
                if($(elemSelector).length <= 0){
                    alert("There was a problem marking the elements that should be snipped.  Try again?");
                    return;
                }                
                var elem = $(elemSelector).get(0);
                
                //add snipparent class so later we can get these and use them to get variables applied to parents
                //not needed at this time
                /*
                let parLevel = 1;
                $.each($(elemSelector).parents(), function(i, item){
                    let myClass = "snipparent-" + parLevel;                    
                    item.classList.add(myClass);      
                    parLevel++;
                });
                */
               
                var myClass = "snipcss" + labelIndex + "-0-0-" + this.SNIP_CSS_CURRENT_ID;
                elem.classList.add(myClass);
                this.SNIP_CSS_ALL_CLASSES.push(myClass);
                this.SNIP_CSS_ALL_IDS.push(this.SNIP_CSS_CURRENT_ID);        
                var parentId = this.SNIP_CSS_CURRENT_ID;
                this.SNIP_CSS_CURRENT_ID++;
                this.snipcssLabelSubelements(1, parentId, elem, labelIndex);


                var elementsByLevel = new Array();
                elementsByLevel.push(myClass);
                /*now loop through and get a string */
                var maxDepth = 1000;
                for(var x = 1; x < maxDepth; x++){
                    for(var y = 0; y < this.SNIP_CSS_ALL_CLASSES.length; y++){
                        var snipClass = this.SNIP_CSS_ALL_CLASSES[y];
                        var snipClassArr = snipClass.split('-');
                        var snipLevel = parseInt(snipClassArr[1]);
                        if(snipLevel == x){
                            elementsByLevel.push(snipClass);
                        }
                    }
                }
                //console.log("elementsBYLevel: ");
                //console.log(elementsByLevel);
                var elementString = elementsByLevel.join('|');
                //console.log("Element string ");
                //console.log(elementString);

                return elementString;            
            },             
            snipcssRemoveAllLabels: function() {
                // Define the regex pattern to match snipcss classes
                var snipcssPattern = /^snipcss\d+-\d+-\d+-\d+$/;

                // Select all elements that have a class containing 'snipcss'
                $('[class*="snipcss"]').each(function() {
                    var classesToRemove = [];

                    // Iterate through each class of the current element
                    $.each(this.classList, function(index, className) {
                        // If the class matches the snipcss pattern, mark it for removal
                        if (snipcssPattern.test(className)) {
                            classesToRemove.push(className);
                        }
                    });

                    // Remove the matched classes from the element
                    if (classesToRemove.length > 0) {
                        $(this).removeClass(classesToRemove.join(' '));
                    }
                });

                // Clear the tracking arrays
                this.SNIP_CSS_ALL_CLASSES = [];
                this.SNIP_CSS_ALL_IDS = [];

                // Reset the current ID counter
                this.SNIP_CSS_CURRENT_ID = 1;

                console.log("All snipcss label classes have been removed and tracking has been reset.");
            },            
            snipcssGetDistance: function(inheritedSelector, snipSelector) {
                let distance = 0;
                try {
                  //console.log("inheritedSelector " + inheritedSelector);
                  //console.log("snipSelector: " + snipSelector);
                  let snipElem = document.querySelector(snipSelector);
                  if(snipElem == null){
                      snipElem = document.querySelector("." + snipSelector);
                  }
                  let inheritedElems = document.querySelectorAll(inheritedSelector);

                  let currentElem = snipElem.parentNode;
                  while (currentElem && currentElem !== document) {
                    for (let i = 0; i < inheritedElems.length; i++) {
                      if (currentElem.isSameNode(inheritedElems[i])) {
                        //console.log("we found distance of inherited rule");
                        return distance.toString();
                      }
                    }
                    distance++;
                    //console.log("at distance " + distance);
                    currentElem = currentElem.parentNode;
                  }

                  //console.log("out of loop");
                } catch (e) {
                  //console.log("some bad stuff here");
                  //console.log(e);
                }

                return "-1";
            },       
            snipcssGetTagname : function(cssSelector, devName){
                var root;
                //var elem = document.querySelector(elemSelector);                
                //console.log("outer html");
                //console.log(elem.outerHTML);
                try{
                    root = $(cssSelector).get(0);
                }catch(ex){
                    root = document.querySelector(cssSelector);                
                }      
                if(!root.tagName){
                    return 'div';
                }
                
                
                SNIPCSS.PROCESSING_NODE_CURR++;
                if(devName != SNIPCSS.PROCESSING_NODE_DEVICE){
                    SNIPCSS.PROCESSING_NODE_DEVICE = devName;
                    //assume starting next device, restart count
                    SNIPCSS.PROCESSING_NODE_CURR = 0;
                }
                if(SNIPCSS.PROCESSING_NODE_CURR > SNIPCSS.PROCESSING_NODE_TOTAL){
                    SNIPCSS.PROCESSING_NODE_CURR = SNIPCSS.PROCESSING_NODE_TOTAL;
                }
                if(SHADOW_ROOT != null){
                    SHADOW_ROOT.getElementById('snipcss_processing_text').innerHTML = "Resolution " + SNIPCSS.PROCESSING_NODE_DEVICE + ": " + SNIPCSS.PROCESSING_NODE_CURR + "/" + SNIPCSS.PROCESSING_NODE_TOTAL + " processed";
                }
                
                return root.tagName;
            },         
            snipcssInsideSelector: function(cssSelector, rootSelector) {
                // Ensure both cssSelector and rootSelector are valid strings
                if (typeof cssSelector !== 'string' || typeof rootSelector !== 'string') {
                    console.log("BAD CSSSELECTOR: ");
                    console.log(cssSelector);
                    console.log("OR BAD rootSelector");
                    console.log(rootSelector);
                    return true;
                }
                if(cssSelector == ''){
                    //console.log("empty selector");
                    return true;
                }
                if(cssSelector.indexOf(':') >= 0){
                    return true;
                }

                // Make sure rootSelector starts with a class or ID
                if (!rootSelector.startsWith('.') && !rootSelector.startsWith('#')) {
                    rootSelector = '.' + rootSelector;
                }

                var root = document.querySelector(rootSelector);
                if (!root) {
                    return false; // No matching root element found
                }

                var allMatches = document.querySelectorAll(cssSelector);
                var rootIsContained = Array.from(allMatches).some(function(aMatch) {
                    return root.contains(aMatch) || aMatch === root;
                });

                return rootIsContained;
            },
            snipcssFixAndInside : function(cssSelector, rootSelector, targetElem){
                
                if (typeof cssSelector === 'object'){
                    cssSelector = cssSelector['selector'];
                }

                let isContained = snipcssUtils.snipcssInsideSelector(cssSelector, rootSelector);
                let rootVal = "0";
                if(isContained){
                    rootVal = "1";
                }
                let target_found = "0";
                // For pseudo-element selectors, strip the pseudo part before matching
                let selectorToMatch = cssSelector;
                if(cssSelector && (cssSelector.indexOf(':before') >= 0 || cssSelector.indexOf(':after') >= 0 ||
                   cssSelector.indexOf('::before') >= 0 || cssSelector.indexOf('::after') >= 0)) {
                    selectorToMatch = cssSelector.replace(/::?(before|after)/g, '');
                }
                if(targetElem && selectorToMatch && targetElem.matches(selectorToMatch)){
                    target_found = "1";
                }

                return {
                   selector: cssSelector,
                   is_contained: rootVal,
                   target_found: target_found
                };
            },
            snipcssFixSelector: function(cssSelector, rootSelector, otherInherited, targetElem){
                                
                var finalTest = function(selector){
                    if(selector == ''){
                        return {selector: '', is_contained: "-1"};
                    }
                    
                    let element = document.querySelector(selector);
                    if(element === null){
                        //return "";
                        return {selector: '', is_contained: "-1"};
                    }
                    return snipcssUtils.snipcssFixAndInside(selector, rootSelector, targetElem);
                    //return selector;
                };
                
                if($(rootSelector).length <= 0){
                    rootSelector = '.' + rootSelector;
                }
                
                var root = $(rootSelector).get(0);
                var $rootClone = $(root).clone().wrap('<div id="fakeelem"></div>').parent();
                //console.log("fixing selector");
                //console.log(cssSelector);
                //console.log("with root");
                //console.log(rootSelector);
                //var selParts = cssSelector.split(" ");
                //regex to split all spaces 
                //except those inside parenthesis
                //.table-striped tbody tr:nth-of-type(2n + 1)
                var selParts = cssSelector.split(/(?!\(.*)\s(?![^(]*?\))/g);
                console.log("[FIX] ===== Fixing: '" + cssSelector + "' with root: '" + rootSelector + "'");
                console.log("[FIX] Parts: " + JSON.stringify(selParts));
                if(selParts.length <= 1){
                    //console.log("return case 1");
                    return snipcssUtils.snipcssFixAndInside(cssSelector, rootSelector);                    
                    //return cssSelector;
                }

                var skippedOne = false;
                var lastPartIsRoot = false;
                var lastPart = "";
                var lastPartDelim = "";
                var currParts = "";
                var finalSelector = "";
                try{
                    for(var x = (selParts.length - 1); x >= 0; x--){
                        var newPart = selParts[x];
                        var oldCurrParts = currParts;
                        currParts = newPart + " " + currParts;
                        
                        
                        if(newPart == '>' || newPart == '~' || newPart == '+'){
                            lastPartDelim = newPart;
                            continue;
                        }
                        if(newPart.indexOf(":") >= 0 || newPart.indexOf("[") >= 0)
                        {                        
                            //console.log("psuedo selector or weird selector... " + newPart);
                            finalSelector = currParts;       
                            continue;
                        }                    
                        var rootMatches = false;
                        $(currParts).each(function(ind){
                            if(this == root){
                                //console.log("root matches this one");
                                rootMatches = true;
                            }
                        });
                        /*
                        if(x == 0 && (newPart.indexOf('.') >= 0 || newPart.indexOf('#') >= 0)){
                            console.log("last part process - has . or #");
                            if($rootClone.find(newPart).length == 1){
                                console.log("last part len 1");                                  
                                lastPart = newPart;
                                lastPartIsRoot = true;
                            }
                        }
                        */
                        if(x == 0 && (newPart.indexOf('.') >= 0 || newPart.indexOf('#') >= 0)){
                            //console.log("last part process - has . or #");
                            if($(newPart).length == 1){
                                //console.log("last part len 1");                            
                                var newPartElem = $(newPart).get(0);
                                if(newPartElem == root){
                                    //console.log("last part is root");        
                                    lastPart = newPart;
                                    lastPartIsRoot = true;
                                }
                            }
                        }                        
                        
                                                
                        var testParts = snipcssUtils.snipcssReplaceAll(currParts, ":before", "");
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":after", "");
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":before", "");
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":first-letter", "");
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":first-line", "");
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":selection", "");      
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":hover", "");                           
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":active", "");                           
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":link", "");     
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":checked", "");         
                        testParts = snipcssUtils.snipcssReplaceAll(testParts, ":disabled", "");                                 
                        if(testParts.indexOf(':where(') !== -1 ||
                                testParts.indexOf(':not(') !== -1 ||
                                testParts.indexOf(':has(') !== -1 ||
                                testParts.indexOf(':is(') !== -1){
                            testParts = testParts.split(':')[0];
                        }

                        console.log("[FIX] x=" + x + " part='" + newPart + "' currParts='" + currParts.trim() + "' testParts='" + testParts.trim() + "'");

                        var subLength = $(rootSelector).find(testParts).length;
                        console.log("[FIX]   find() returned " + subLength + " matches, rootMatches=" + rootMatches);
                        if(subLength > 0){
                            //console.log("found testparts and selector now: " + finalSelector);
                            finalSelector = currParts;
                            console.log("[FIX]   KEEPING - found in root");
                        }
                        else if(rootMatches && $rootClone.find(testParts).length > 0){
                            //console.log("root matches and selector now: " + finalSelector);
                            finalSelector = currParts;
                            console.log("[FIX]   KEEPING - rootMatches and found in clone");
                        }
                        else{
                            let notfoundPartSkip = true;
                            if(lastPartDelim == '>'){
                                 //console.log("parent not found, selecting child, and is " + testParts);
                                 //console.log("newPart is " + newPart);
                                 notfoundPartSkip = false;
                                 let theLen = $('html').find(testParts).length;
                                 let rootParent = $(root).parent();
                                 if(theLen > 0){                                     
                                     $('html').find(testParts).each(function(){
                                         if(rootParent == this){
                                             //console.log("it has the child");
                                             notfoundPartSkip = true;
                                         }
                                     });
                                     if(!notfoundPartSkip && otherInherited){
                                        //console.log("exiting because otherInherited");
                                        return {selector: '', is_contained: "-1"};                                         
                                    }                                     
                                 }
                            }
                            if((newPart.indexOf('.') >= 0 || newPart.indexOf('#') >= 0)){
                                if($rootClone.find(newPart).length >= 1){
                                    
                                }else{
                                    notfoundPartSkip = true;
                                }
                            }                            
                            
                            if(notfoundPartSkip){
                                //console.log("new skip city " + newPart);
                                console.log("[FIX]   BREAKING - part not found, skipping left parts");
                                skippedOne = true;
                                break;
                            }else{
                                finalSelector = currParts;
                                console.log("[FIX]   KEEPING - special case");
                            }
                        }
                    }
                    if(finalSelector == ""){
                        //console.log("return case 2");
                        //return cssSelector;
                        return snipcssUtils.snipcssFixAndInside(cssSelector, rootSelector, targetElem);                              
                    }
                    if(skippedOne && finalSelector.indexOf('.') === false && finalSelector.indexOf('#') === false && finalSelector.indexOf('>') === false){
                        //console.log("skipped one");
                        if($(finalSelector).length == 1){
                            //console.log("return case 3");
                            return finalTest(".XXsnipcss_extracted_selector_selectionXX " + finalSelector);
                        }

                        //too generic
                        var selElem = $(cssSelector).get(0);
                        if(!selElem || selElem == null){
                            selElem = $(finalSelector).get(0);
                        }
                        finalSelector = snipcssUniqueSelector(selElem, []);
                    }
                    else if(lastPartIsRoot){
                        //console.log("return case 5");
                        let finalVal = finalTest(lastPart + " " + finalSelector);
                        if(finalVal == ''){
                            return {selector: '', is_contained: "-1", target_found: '-1'};
                        }else{
                            return snipcssUtils.snipcssFixAndInside(finalVal, rootSelector, targetElem);           
                        }
                    }
                    //console.log("return case 4");
                    
                }catch(e){
                    console.log("failed to fix the css selector ");
                    console.log(cssSelector);
                    //console.log("with root");
                    //console.log(rootSelector);
                    //console.log("failed error");
                    //console.log(e);
                     
                    finalSelector = "";
                }
                //console.log("returning " + finalSelector);
                console.log("[FIX] FINAL: '" + finalSelector.trim() + "' (skipped=" + skippedOne + ")");
                let finalVal = finalTest(finalSelector); 
                if(finalVal == ''){
                    return {selector: '', is_contained: "-1"};
                }else{
                    return snipcssUtils.snipcssFixAndInside(finalVal, rootSelector, targetElem);           
                }                
                //return finalTest(finalSelector);            
                
            },
            snipcssGetBackground: function(jquerySelector) {
                // Is current element's background color set?
                var $elem = $(jquerySelector);
                var color = $elem.css("background-color");

                if ((color !== 'rgba(0, 0, 0, 0)') && (color !== 'transparent')) {
                    // if so then return that color
                    return color;
                }

                // if not: are you at the body element?
                if ($elem.is("body")) {
                    // return empty because
                    return "";
                } else {
                    // call getBackground with parent item
                    return this.snipcssGetBackground($elem.parent());
                }
            },     
            snipcssGetFontcolor: function(jquerySelector) {
                // Is current element's background color set?
                var $elem = $(jquerySelector);
                var color = $elem.css("color");

                if ((color !== 'rgba(0, 0, 0, 0)') && (color !== 'transparent')) {
                    // if so then return that color
                    return color;
                }

                // if not: are you at the body element?
                if ($elem.is("body")) {
                    // return empty because
                    return "";
                } else {
                    // call with parent item
                    return this.snipcssGetFontcolor($elem.parent());
                }
            }, 
            snipcssGetGoogleFontLinks : function(){
                var retArray = new Array();
                $('link').each(function(){
                    var theHref = this.href;
                    if(theHref.indexOf('fonts.googleapis.com') === -1){
                        return;
                    }
                    var hrefSplit = theHref.split('family=');
                    if(hrefSplit.length <= 1){
                        return;
                    }
                    var urlSplit = hrefSplit[1];
                    var allFonts = urlSplit.split("|");
                    
                    var retObj = {};
                    retObj['href'] = theHref;
                    var urlFonts = new Array();
                    $(allFonts).each(function(){
                        var aFont = this.split(':')[0];
                        aFont = aFont.replace('+', ' ');
                        aFont = aFont.replace('%20', ' ');       
                        urlFonts.push(aFont);
                    });
                    if(urlFonts.length > 0){
                        retObj['fonts'] = urlFonts;
                        retObj['already_added'] = false;
                        retArray.push(retObj);
                    }
                    //var theSource = $(this).attr('href');
                    //console.log("the source ");
                    //console.log(theHref);                
                });
                return retArray;
            },
            snipcssUniqueSelector: function(elem, pastArray)
            {
                var currParent = $(elem).parent().get(0);
                var parentTag = currParent.nodeName.toLowerCase();
                var elemTag = elem.nodeName.toLowerCase();

                var thePast = "";
                if(pastArray.length > 0){
                    for(var x = pastArray.length - 1; x >= 0; x--){
                        thePast += " > " + pastArray[x];
                    }
                }    
                //console.log("ON " + elemTag + " past selector now " + thePast);

                if($(currParent).hasClass('XXsnipcss_extracted_selector_selectionXX')) //no div, li, tr found
                {	
                    return '.XXsnipcss_extracted_selector_selectionXX ' + thePast;
                }
                
                for(let x = 2; x < 20; x++){
                    let multipleSnipclassSelector = 'XXsnipcss_extracted_selector_' + x.toString() + '_XX';
                    if($(currParent).hasClass(multipleSnipclassSelector)) //no div, li, tr found
                    {	
                        return '.multipleSnipclassSelector ' + thePast;
                    }                    
                }              

                if(currParent.id != "")
                {
                    var uSelector = parentTag + "#" + currParent.id;
                    var myCount = $(uSelector).length;	
                    if(myCount == 1)
                    {
                        var mySelector = uSelector + thePast;
                        //console.log("unique returning selector " + mySelector);
                        return uSelector + thePast;
                    }
                }
                else if(currParent.className != "")
                {
                    var uSelector = parentTag + "." + currParent.className.split(/\s+/)[0];
                    var myCount = $(uSelector).length;	
                    if(myCount == 1)
                    {
                       var mySelector = uSelector + thePast;
                       //console.log("unique returning selector " + mySelector);            
                       return uSelector + thePast;
                    }			
                }

                var pastTag = parentTag;        

                pastArray.push(pastTag);
                //Not a Unique one
                return getUniqueParentSelector(currParent, pastArray);				
            },
            snipcssLabelSkipElements : function(rootElem, keepArr){
                $('.skipcss').removeClass('skipcss');
                var i = 1;
                var hasSomeChildren = false;
                var hasSomeSkip = false;
                var snipElements = new Array();
                $(rootElem).children().each(function(elem, index){
                    //console.log("on element");
                    //console.log(this);
                    if(keepArr.includes(i)){
                        hasSomeChildren = true;                        
                        snipElements.push(this);
                        //console.log("has some children");
                    }else{
                        //console.log("has some skip");
                        hasSomeSkip = true;    
                        $(this).addClass('skipcss');
                        //dont need to label subelements skipcss because how labeling works
                        //fuck if we have an include we do though... 
                        //$(this).find('*').addClass('skipcss');                        
                    }
                    
                    i++;
                });
                var keepNumbers = keepArr.join(",");
                
                if(!hasSomeSkip){
                    alert("Indices " + keepNumbers + " include all children, there are no elements that will be skipped.");
                    $('.skipcss').removeClass('skipcss');
                    return false;
                }
                
                if(!hasSomeChildren){
                    alert("Please enter at least one child index.  e.g. Enter '1' in the input field if you want to includ only the first child.");
                    $('.skipcss').removeClass('skipcss');                    
                    return false;
                }
                
                //highlight the snipElements
                highlightElementArr(snipElements);                
                return true;
            },
            hideFixedElements: function(extractSelector) {
                /**
                 * 1) Unhide all previously hidden fixed/sticky elements
                 */
                for (let key in hiddenFixedElements) {                    
                    let data = hiddenFixedElements[key];
                    console.log("setting original element");
                    console.log(data.element);
                    console.log(data.originalDisplay);                      

                    // Check if originalDisplay is empty or not set
                    if (!data.originalDisplay || data.originalDisplay === "") {
                        // Use a sensible default like "block" or remove the display property entirely
                        data.element.style.removeProperty('display');
                    } else {
                        data.element.style.display = data.originalDisplay;
                    }
                }                

                hiddenFixedElements = {}; // Reset for this new extraction pass

                /**
                 * 2) Figure out the element being extracted (extractSelector)
                 */
                let extractEl = null;
                if (extractSelector) {
                    extractEl = document.querySelector(extractSelector);
                }

                /**
                 * 3) Collect all fixed-position and sticky-position elements in the document
                 */
                const elementsToHide = Array.from(document.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.position === 'fixed' || style.position === 'sticky';
                });

                /**
                 * 4) Hide each fixed/sticky-position element unless it's:
                 *    - the extracted element
                 *    - a descendant of the extracted element
                 *    - a parent of the extracted element with fixed/sticky positioning
                 */
                elementsToHide.forEach((el, index) => {
                    // Check if the element is the extractEl, a descendant of extractEl, or a parent with fixed/sticky positioning
                    const isExtractElement = extractEl && (el === extractEl);
                    const isDescendant = extractEl && extractEl.contains(el);
                    const isParentWithFixedOrSticky = extractEl && el.contains(extractEl) && (
                        window.getComputedStyle(el).position === 'fixed' || 
                        window.getComputedStyle(el).position === 'sticky'
                    );

                    if (isExtractElement || isDescendant || isParentWithFixedOrSticky) {
                        // Keep this element visible
                        console.log("Keeping visible:", el);
                    } else {
                        console.log("Hiding element");
                        console.log(el);
                        // Hide this element
                        const computedStyle = window.getComputedStyle(el);
                        // Use a unique ID for the element
                        const uniqueId = "element_" + index;
                        hiddenFixedElements[uniqueId] = {
                            element: el,
                            originalDisplay: el.style.display || computedStyle.display
                        };
                        el.style.display = 'none';
                    }
                });

                console.log("Hid elements count: ");
                console.log(Object.keys(hiddenFixedElements).length);
            },
            hasFixedOrStickyElements: function(element) {
                // Check if the element exists
                if (!element) {
                    return false;
                }

                // Helper function to check if an element has fixed or sticky positioning
                const isFixedOrSticky = (el) => {
                    const style = window.getComputedStyle(el);
                    return style.position === 'fixed' || style.position === 'sticky';
                };

                // 1. Check the element itself
                if (isFixedOrSticky(element)) {
                    return true;
                }

                // 2. Check all parent elements
                let parent = element.parentElement;
                while (parent) {
                    if (isFixedOrSticky(parent)) {
                        return true;
                    }
                    parent = parent.parentElement;
                }

                // 3. Check all child elements
                const children = element.querySelectorAll('*');
                for (let i = 0; i < children.length; i++) {
                    if (isFixedOrSticky(children[i])) {
                        return true;
                    }
                }

                // No fixed or sticky elements found
                return false;
            }            
        };    
