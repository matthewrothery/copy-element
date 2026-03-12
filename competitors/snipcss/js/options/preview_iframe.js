var PREVIEW = PREVIEW || {};

PREVIEW.TETHER_OBJECTS = new Array();
PREVIEW.IFRAME_FIELDS = null;
PREVIEW.INITIALIZED = false;
PREVIEW.HIGHLIGHT_BOXES = new Array();
PREVIEW.BEFORE_HTML = "";
PREVIEW.HAS_EDITS = false;
PREVIEW.BAD_CLICK = true;
//PREVIEW.SAVED_ID = "";

function doInitialize(){
    if(PREVIEW.INITIALIZED){
        return;
    }
    console.log("doing intialize");
    
    $('body').on('click', 'a', function(e){        
        e.preventDefault();        
        return false;
    });
    
    //fuck this
    /*
    let rootId = $('body').children().first().attr('id');
    if(!rootId || rootId == "");
    {
        rootId = 'snip-' + randomLetters(3);
        $('body').children().first().attr('id', rootId);
    }
    PREVIEW.SAVED_ID = rootId;            
    console.log('root id ' + PREVIEW.SAVED_ID);
    */
    
    PREVIEW.INITIALIZED = true;
    
    
    
}

function startEditing(){
    var uniqueTagsWithText = getUniqueTagsWithText();
    var tagnameSelectors = uniqueTagsWithText.join(', ');


    // Set all elements as editable on click
    $(tagnameSelectors).on("mousedown", function(e) {
        if (e.button === 2) {
            PREVIEW.BAD_CLICK = true;
        }else{
            PREVIEW.BAD_CLICK = false;
        }        
    });
    
    $(tagnameSelectors).on("click", function(e) {
        //alert("do it");
        //alert("button: " + e.button);
        if(PREVIEW.BAD_CLICK){
            return;
        }
        
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up
        $(this).attr("contenteditable", "true");
        // Temporarily disable scrolling
        var x = window.scrollX, y = window.scrollY;
        $(this).focus();
        window.scrollTo(x, y);
        PREVIEW.BEFORE_HTML = $(this).html();
    });

    // Save the changes when the element loses focus
    $(tagnameSelectors).on("blur", function() {        
        let beforeHtml = PREVIEW.BEFORE_HTML;
        PREVIEW.BEFORE_HTML = "";
        $(this).attr("contenteditable", "false");
        if(PREVIEW.BAD_CLICK){
            return;
        }

        let me = this;
        if($(this).html() != beforeHtml){
            PREVIEW.HAS_EDITS = true;
        }
        
        setTimeout(function(){
            let doUpdate = false;
            if(PREVIEW.BEFORE_HTML == ''){               
                doUpdate = true;
            }
            if(PREVIEW.HAS_EDITS){
                let afterHtml = $(me).html();
                let newText = $(me).text();
                sendUpdateToParent(newText, me, doUpdate);                                    
            }
        }, 300);        
    });

    // Save the changes when pressing enter key
    $(tagnameSelectors).on("keydown", function(e) {
        if (e.key == "Enter") {
            e.preventDefault(); // To prevent newline on enter
            $(this).blur(); // Lose focus and trigger blur event
        }
    });        
}

function stopEditing(){
    var uniqueTagsWithText = getUniqueTagsWithText();
    var tagnameSelectors = uniqueTagsWithText.join(', ');
    $("[contenteditable]").removeAttr("contenteditable");

    // Set all elements as editable on click
    $(tagnameSelectors).off("mousedown");
    $(tagnameSelectors).off("click");
    $(tagnameSelectors).off("blur");
    $(tagnameSelectors).off("keydown");
}

function highlightPreviewElement(theSelector, theColor){
    
    if($(theSelector).length <= 0){
        console.log("previewframe selector not found: " + theSelector);
        return;
    }

    var aColor = '#990000';
    if(theColor){
        aColor = theColor;
    }
    $(theSelector).each(function(){
        let elem = this;
        var previewSelectionBox = new SelectionBox(null, aColor, null);
        previewSelectionBox.highlight(elem);        

        PREVIEW.HIGHLIGHT_BOXES.push(previewSelectionBox);
    });

}

function unhighlightPreviewAll(){
    for(var i = 0; i < PREVIEW.HIGHLIGHT_BOXES.length; i++)
    {
        PREVIEW.HIGHLIGHT_BOXES[i].destroy();	
    }	    
    PREVIEW.HIGHLIGHT_BOXES = new Array();
}

function startReloading(){
    console.log("adding the loader to the body");
    let theHtml = '<div id="theloader" class="loading-overlay is-active">' + 
            '<span class="loader"></span>' + 
        '</div>';
        
    if($('#theloader').length <= 0){
        $('body').append(theHtml);
    }
}

function stopReloading(){
    $('#theloader').remove();
}


function addStyle(styles){

     /* Create style document */
     var css = document.createElement('style');
     css.type = 'text/css';

     if (css.styleSheet){
         css.styleSheet.cssText = styles;
     }
     else{
         css.appendChild(document.createTextNode(styles));
     }

     /* Append style to the tag name */
     document.getElementsByTagName("head")[0].appendChild(css);
}
function replaceBody(theHtml, theCss){
    console.log("replacing body");
    $('body').html(theHtml);
    $('style').remove();
    addStyle(theCss);
    
    console.log("done");
}

function getUniqueTagsWithText() {
    var tagsWithText = new Set();

    // Get all elements
    $('*').each(function() {
        // If this element has a direct child text node
        if (this.childNodes.length && Array.from(this.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
            // Add the tag name to the set (automatically ensures uniqueness)
            tagsWithText.add(this.tagName.toLowerCase());
        }
    });

    return Array.from(tagsWithText);
}


function sendUpdateToParent(newText, elem, doUpdate) {
    // Get the HTML of the body element
    //why the fuck is this happening???
    //$("body").find('meta').remove();
    //$("body").find('style').remove();
    //$("body").find('script').remove();
    
    var bodyHtml = $("body").html();
    
    var theSelector = getCorrectSelector(elem);
    console.log("selector for replacing the element text");
    console.log(theSelector);
    /*
    let replaceId = "";
    if(theSelector.indexOf(PREVIEW.SAVED_ID) >= 0){
        replaceId = PREVIEW.SAVED_ID;
    }
    */
    var selectorCount = testSelectorCount(theSelector, 1, "");
    if(!selectorCount){
        alert("Could not get item selector - updating entire HTML");       
        theSelector = "";
    }    
    
    let textNodeIndex = -1;
    Array.from(elem.childNodes).some((node, index) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            textNodeIndex = index;
            return true;  // stops Array.some
        }
    });    
    if(textNodeIndex == -1){
        textNodeIndex = 0;
    }
    
    
    //if(!PREVIEW.HAS_EDITS){
    //    console.log("same html");
     //   return;
    //}
    if(doUpdate){
        PREVIEW.HAS_EDITS = false;
    }
    
    if(theSelector != ''){
        bodyHtml = elem.outerHTML;        
        bodyHtml = replaceAll(bodyHtml, 'contenteditable="false"', '');
        bodyHtml = replaceAll(bodyHtml, 'contenteditable="true"', '');        
    }
    
    // Call receiveUpdate function in the parent frame
    parent.previewIframeUpdate(bodyHtml, theSelector, textNodeIndex, newText, doUpdate);
}

var replaceAll = function(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

var escapeRegExp = function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};


function getRepeatingParent(elem)
{
    if(!elem || $(elem).length <= 0 || $(elem).parent().length <= 0)
    {
        console.log("elem undefined");
        return null;
    }
    var repeatingElement = null;
    var currParent = $(elem).parent().get(0);
    var myTag = elem.nodeName.toLowerCase();
    var parentTag = currParent.nodeName.toLowerCase();
    if(parentTag == 'body'){
        return null;
    }
    var childrenCount = $(currParent).find("*").length;
    
    //console.log("analyzing " + parentTag + " sibcount " + $(currParent).siblings(parentTag).length + " childcount " + childrenCount);
    
    if(parentTag == "body") //no div, li, tr found
    {	
        console.log("body body");
        return null;
    }

    //do DOM DIFF???
    //if(parentTag == "li" || parentTag == "tr" || parentTag == 'div' || parentTag == 'section' || parentTag == 'a' || parentTag == 'article')
    //{
        //console.log("of " + parentTag + " currParent ");
        //console.log(currParent);
        if(parentTag.indexOf(':') >= 0){
            return getRepeatingParent(currParent);	
        }
        //console.log("child count " + childrenCount);
            
    if(parentTag != 'span'){
        var sibLength = $(currParent).siblings(parentTag).length;
        //console.log("sibling count " + sibLength);
        if((sibLength >= 1 && childrenCount > 2) || 
                (sibLength > 5 && childrenCount > 1))
        {
            //console.log("parent tag");
            //console.log(currParent);
            var parentHtml = currParent.outerHTML;
            
            var validSiblings = 0;
            var maxTest = 100;
            var currCount = 0;
            $(currParent).siblings(parentTag).each(function(){
                if(validSiblings > 5){
                    return;
                }
                var sibChildCount = $(this).find("*").length;
                var sibHtml = this.outerHTML;
                
                //SIBLING MUST HAVE AT LEAST HALF FIELDS TO BE CONSIDERED "VALID"
                if(sibChildCount >= (childrenCount / 2)){
                    validSiblings++;
                }                
            });
            if(validSiblings > 0){                
                return currParent;
            }
        }
    }
    //}

    return getRepeatingParent(currParent);	
}


function testSelectorCount(theSelector, desiredCount, theContext)
{
        var selCount;
        try{
            var len = $(theSelector).length;
        }catch(ex){
            console.log("bad selector");
            console.log(theSelector);
        }
        if(theContext == "")
        {
                selCount = $(theSelector).length;		
        }
        else
        {
                selCount = $(theContext).find(theSelector).length;				
        }

        if(selCount == desiredCount)
        {
                //console.log("YES IT DOES");
                return true;
        }
        //console.log("NOPE");		
        return false;	
}

function getCorrectRepeatSelector(elem){
    //Selector should select list items, and only correct list items
    //We set ItemSelect, GlobalSelect
    //console.log("TRYING TO SELECT A LIST");
    var currTag = elem.nodeName.toLowerCase();
    if(currTag == 'body'){
        return 'body';
    }
    var parentElem = $(elem).parent().get(0);
    
    var parentTag = parentElem.nodeName.toLowerCase();

    var FOUND_SELECTOR = false;
    var THE_SELECTOR = "";
    if(elem.id && elem.id != "")
    {
        //console.log("SELECTOR METHOD 1 - BY ID");        
        THE_SELECTOR = "#" + elem.id;
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        if(!FOUND_SELECTOR){
            if(parentElem.id && parentElem.id !== ""){
                THE_SELECTOR =  parentTag + "#" + parentElem.id + " > " + THE_SELECTOR;                
            }else{
                THE_SELECTOR =  parentTag + " > " + THE_SELECTOR;
            }
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        }
    }
    if(!FOUND_SELECTOR && elem.className && elem.className != "")
    {
        //console.log("SELECTOR TEST 2 - BY CLASS");                
        var elemClassnames = elem.className.split(/\s+/);
        for(var x = 0; x < elemClassnames.length; x++){            
            var aClass = elemClassnames[x];
            if(aClass.trim() == ''){
                continue;
            }
            else{
                //console.log("------------------------- " + aClass);
            }
            
            THE_SELECTOR = "." + aClass;						
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");    
            if(!FOUND_SELECTOR){
                if(parentElem.id && parentElem.id !== ""){
                    THE_SELECTOR =  parentTag + "#" + parentElem.id + " > " + THE_SELECTOR;                
                }else{
                    THE_SELECTOR =  parentTag + " > " + currTag + THE_SELECTOR;
                }
                FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
            }            
            if(FOUND_SELECTOR){
                break;
            }
        }
    }
    if(!FOUND_SELECTOR)
    {
        //console.log("getting unique parent");
        //console.log(elem);
        var parentTag2 = elem.nodeName.toLowerCase();
        if(parentTag2 == 'body'){
            var nextIndex = $('body').children().index(elem) + 1;        
            THE_SELECTOR = "body > " + currTag + ":nth-child(" + nextIndex + ")";
            //alert("The selector " + THE_SELECTOR);
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");    
            if(FOUND_SELECTOR){
                //alert("FOUND");
                return THE_SELECTOR;
            }
        }
        
        
        THE_SELECTOR = getUniqueParentSelector(elem, []);
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");              
    }

    if(!FOUND_SELECTOR)
    {
        alert("Error: could not find a repeating list selector.  (this shouldnt happen and is being logged)");
        return null;
    }
   return THE_SELECTOR;
}

function getUniqueParentSelector(elem, pastArray)
{
    var currParent = $(elem).parent().get(0);
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
        return 'body' + thePast;
    }

    if(currParent.id != "" && currParent.id != "preview" && currParent.id != "mymustache")
    {
        var uSelector = parentTag + "#" + currParent.id;
        var myCount = $(uSelector).length;	
        if(myCount == 1)
        {
            var mySelector = uSelector + thePast;
            //console.log("returning selector " + mySelector);
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
           //console.log("returning selector " + mySelector);            
           return uSelector + thePast;
        }			
    }
    
    var granParent = $(elem).parent().parent().get(0);  
    var myIndex = $(granParent).find(parentTag).index(currParent);
    var pastTag = parentTag + ":eq(" + myIndex + ")";        

    pastArray.push(pastTag);
    //Not a Unique one
    return getUniqueParentSelector(currParent, pastArray);				
}    


function getCorrectSelector(elem){
    //Selector should select list items, and only correct list items
    //We set ItemSelect, GlobalSelect
    //console.log("TRYING TO SELECT A LIST");
    var currTag = elem.nodeName.toLowerCase();
    if(currTag == 'body'){
        return 'body';
    }
    var parentElem = $(elem).parent().get(0);
    
    var parentTag = parentElem.nodeName.toLowerCase();

    var FOUND_SELECTOR = false;
    var THE_SELECTOR = "";
    if(elem.id && elem.id != "" && elem.id != "preview" && elem.id != "mymustache")
    {
        //console.log("SELECTOR METHOD 1 - BY ID");        
        THE_SELECTOR = "#" + elem.id;
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        if(!FOUND_SELECTOR){
            if(parentElem.id && parentElem.id !== "" && parentElem.id != "preview" && parentElem.id != "mymustache"){
                THE_SELECTOR =  parentTag + "#" + parentElem.id + " > " + THE_SELECTOR;                
            }else{
                THE_SELECTOR =  parentTag + " > " + THE_SELECTOR;
            }
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        }
    }
    if(!FOUND_SELECTOR && elem.className && elem.className != "")
    {
        //console.log("SELECTOR TEST 2 - BY CLASS");                
        var elemClassnames = elem.className.split(/\s+/);
        for(var x = 0; x < elemClassnames.length; x++){
            var aClass = elemClassnames[x];
            if(!aClass || aClass == ''){
                continue;
            }
            THE_SELECTOR = "." + aClass;						
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");    
            if(!FOUND_SELECTOR){
                if(parentElem.id && parentElem.id !== "" && parentElem.id != "preview" && parentElem.id != "mymustache"){
                    THE_SELECTOR =  parentTag + "#" + parentElem.id + " > " + THE_SELECTOR;                
                }else{
                    THE_SELECTOR =  parentTag + " > " + currTag + THE_SELECTOR;
                }
                FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
            }            
            if(FOUND_SELECTOR){
                break;
            }
        }
    }
    if(!FOUND_SELECTOR)
    {
        var prefix = getUniqueParentSelector(elem, []);
        var myIndex = $(prefix).find(currTag).index(elem);
        //This should only happen after the parent is added
        THE_SELECTOR = prefix + " " + currTag + ":eq(" + myIndex + ")";
        
        //console.log("parent selector " + THE_SELECTOR);
        //console.log("parent selector " + THE_SELECTOR);
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        console.log("the selector with prefix ");
        console.log(THE_SELECTOR);
        THE_SELECTOR = THE_SELECTOR.replace('body ', '');
        console.log("removed body");
        console.log(THE_SELECTOR);
        
        
        if(!FOUND_SELECTOR){
            var nextIndex = $(elem).parent().children().index(elem) + 1;           
            THE_SELECTOR = parentTag + " > " + currTag + ":nth-child(" + nextIndex + ")";         

            console.log("NEXTINDEX SELECTOR ");
            console.log(THE_SELECTOR);


           //console.log("parent selector " + THE_SELECTOR);
           //console.log("parent selector " + THE_SELECTOR);
           FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");        
       }
    }

    if(!FOUND_SELECTOR)
    {
        alert("Error: could not find a selector for element.  (this shouldnt happen and is being logged)");
        return;
    }
   return THE_SELECTOR;
}
    
    
    function randomLetters(length){
        var letters = "abcdefghijklmnopqrstovwxyz";
        var len = letters.length - 1;
        var retString = "";
        for(var x =0; x < length; x++){
            var rand = Math.floor(Math.random() * len);
            retString = retString + letters.substr(rand, 1);
        }
        return retString; 
   }        
   
   // Add global error handler
window.onerror = function(message, source, lineno, colno, error) {
    if (message.includes('Maximum call stack size exceeded') && source.includes('tailwind')) {
        // Send message to parent about Tailwind error
        parent.postMessage({
            type: 'tailwindError',
            message: 'MAJOR ERROR: TAILWIND CRASHED!  One of the generated classes is causing a stack error in Tailwind, try deleting any class that looks invalid.  None of the styles will be applied until the bad class is removed.'
        }, '*');
        return true; // Prevents the error from propagating
    }
};

// Add promise rejection handler
window.onunhandledrejection = function(event) {
    if (event.reason && event.reason.toString().includes('Maximum call stack size exceeded')) {
        // Send message to parent about Tailwind error
        parent.postMessage({
            type: 'tailwindError', 
            message: 'MAJOR ERROR: TAILWIND CRASHED!  One of the generated classes is causing a stack error in Tailwind, try deleting any class that looks invalid.  None of the styles will be applied until the bad class is removed.'
        },'*');
        event.preventDefault(); // Prevents the error from showing in console
    }
};

