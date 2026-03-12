var SHAWK = SHAWK || {};

//list is 1, item is 3
SHAWK.SELECTION_STATE = 1;

var TemplateElemListeners = 
{
    shadowRoot : null,
    DEFAULT_DATA_DESTINATION : "",
    HOLDING_ALT : false,
    HOLDING_CTRL : false,
    ADDING_SELECTOR : false,
	/********************** LIST LISTENERS **************************/
	attachListListeners :function()
	{        
       console.log("attach listeners");
	   document.addEventListener('mousemove', TemplateElemListeners.listMouseMove, true);
	   document.addEventListener('click', TemplateElemListeners.listMouseClick, true);   
	   //Not sure if needed, we will see... i think its needed 
	   document.addEventListener('mousedown', TemplateElemListeners.listMouseDown, true);
    },
    detachListListeners :function()
    {
       console.log("removing listeners");
	   document.removeEventListener('mousemove', TemplateElemListeners.listMouseMove, true);
	   document.removeEventListener('click', TemplateElemListeners.listMouseClick, true);    	   
	   document.removeEventListener('mousedown', TemplateElemListeners.listMouseDown, true);   
    },
    listKeyDown : function(e){
        //e.shiftKey instead
    },
	listMouseMove : function(e)
	{
        //console.log("event");
        //console.log(e);
            //console.log("etarget");
            //console.log(e.target);
            if(TemplateElemListeners.HOLDING_ALT){
                var newParent = $(e.target).parent().get(0);
                //console.log("holding alt, new parent");
                e.target = newParent;
            }      

            var currNode = e.target.nodeName.toLowerCase();
            //console.log("CURR NODE NODE NODE NODE: " + currNode);
            //var blockNode = getBlockContainer(e.target);
            //=============================================
            //1 = Extracting List, 
            //3 = Item Extractor
            if(SHAWK.SELECTION_STATE == 1){    
                var repeatNode = getRepeatingParent(e.target);
                //console.log("repeat node ");
                //console.log(repeatNode);
                if(e.shiftKey){
                    var res1 = getRepeatingParent(repeatNode);
                    //console.log("result1");
                    //console.log(res1);                    
                    if(res1 !== null){
                        repeatNode = res1;
                    }else{
                        var res2 = getRepeatingParent($(repeatNode).parent().get(0));
                        //console.log("result2");
                        //console.log(res2);                        
                        if(res2 !== null){
                            repeatNode = res2;                            
                        }
                        
                    }
                }
                else if(e.altKey){
                    var res1 = getRepeatingParent($(repeatNode).parent().parent().get(0));
                    if(res1 !== null){
                        repeatNode = res1;
                    }else{
                        var res2 = getRepeatingParent($(repeatNode).parent().parent().parent().get(0));
                        //console.log("result2");
                        //console.log(res2);                        
                        if(res2 !== null){
                            repeatNode = res2;                            
                        }
                        
                    }                    
                }
                else if(e.ctrlKey){
                    var res1 = getRepeatingParent($(repeatNode).parent().parent().parent().get(0));
                    if(res1 !== null){
                        repeatNode = res1;
                    }else{
                        var res2 = getRepeatingParent($(repeatNode).parent().parent().parent().parent().get(0));
                        //console.log("result2");
                        //console.log(res2);                        
                        if(res2 !== null){
                            repeatNode = res2;                            
                        }
                        
                    }                    
                }
                
                //console.log("repeating parent is ");
                //console.log(repeatNode);                 
                if(repeatNode !== null){
                    //console.log("highlight all siblings: ");
                    //console.log(repeatNode);
                    unhighlightAllSiblings();
                    highlightAllSiblings(repeatNode);   
                    SHAWK.lastParent = repeatNode;
                }
                else{
                    unhighlightAllSiblings();                    
                }
                
                
            }
            else if(SHAWK.SELECTION_STATE == 2){
                var selectElem = e.target;
                if(e.shiftKey){
                    selectElem = $(e.target).parent().get(0);
                    temphighlightElement(selectElem);                                                        
                }
                else if(e.altKey){
                    selectElem = $(e.target).parent().parent().get(0);
                    temphighlightElement(selectElem);                                                                            
                }
                else if(e.ctrlKey){
                    selectElem = $(e.target).parent().parent().parent().get(0);
                    temphighlightElement(selectElem);                                                                                 
                }
                else{
                    temphighlightElement(e.target);                                    
                }                
            }
            else if(SHAWK.SELECTION_STATE == 3){
                //console.log("temp highlighting ");
                //console.log(e.target);
                var selectElem = e.target;
                if(e.shiftKey){
                    selectElem = $(e.target).parent().get(0);
                    temphighlightElement(selectElem);                                                        
                }
                else if(e.altKey){
                    selectElem = $(e.target).parent().parent().get(0);
                    temphighlightElement(selectElem);                                                                            
                }
                else if(e.ctrlKey){
                    selectElem = $(e.target).parent().parent().parent().get(0);
                    temphighlightElement(selectElem);                                                                                 
                }
                else{
                    temphighlightElement(e.target);                                    
                }
                
                var theNodename = selectElem.nodeName.toLowerCase();
                //$('.scrapehawk-database-label').text(theNodename);
            }            
	},
	listMouseClick: function(e)
	{
            if(e.ctrlKey || e.metaKey){
                //console.log("ctrl key pressed while clicking, normal click event should fire");                
            }else{
                //console.log("ctrl not pressed - press control for scrapehawk to pass along click event");                
                e.preventDefault();
                e.stopPropagation();                
            }

            console.log("clicked this elem ");
            console.log(e.target);
            
            // list or item
            if(SHAWK.SELECTION_STATE == 1){
                var repeatItem = getRepeatingParent(e.target);
                if(repeatItem == null){
                    //console.log("skipping current repeat to do old repeat");                    
                    repeatItem = SHAWK.lastParent;                    
                    if(repeatItem == null){
                        repeatItem = SHAWK.lastParent;
                        if(repeatItem == null){
                            alert("Please hover over items until you see the correct list of items selected, then click.");
                            return;                            
                        }
                        
                    }                    
                    
                }    
                if(e.shiftKey){
                    var res1 = getRepeatingParent(repeatItem);
                    //console.log("result1");
                    //console.log(res1);                    
                    if(res1 !== null){
                        repeatItem = res1;
                    }else{
                        if($(repeatItem).parent().length > 0){
                            var res2 = getRepeatingParent($(repeatItem).parent().get(0));
                            //console.log("result2");
                            //console.log(res2);                        
                            if(res2 !== null){
                                repeatItem = res2;                            
                            }
                        }
                    }
                }       
                else if(e.altKey){
                    var res1 = getRepeatingParent($(repeatNode).parent().parent().get(0));
                    if(res1 !== null){
                        repeatNode = res1;
                    }else{
                        var res2 = getRepeatingParent($(repeatNode).parent().parent().parent().get(0));
                        //console.log("result2");
                        //console.log(res2);                        
                        if(res2 !== null){
                            repeatNode = res2;                            
                        }
                        
                    }                    
                }
                else if(e.ctrlKey){
                    var res1 = getRepeatingParent($(repeatNode).parent().parent().parent().get(0));
                    if(res1 !== null){
                        repeatNode = res1;
                    }else{
                        var res2 = getRepeatingParent($(repeatNode).parent().parent().parent().parent().get(0));
                        //console.log("result2");
                        //console.log(res2);                        
                        if(res2 !== null){
                            repeatNode = res2;                            
                        }
                        
                    }                    
                }
                                
                
                
                //console.log("repeat item");
                //console.log(repeatItem);
                var repeatTag = repeatItem.nodeName.toLowerCase();
                var repeatParent = $(repeatItem).parent().get(0);

                if(repeatParent !== null){
                    //console.log("repeating parent is: ");
                    //console.log(repeatParent);
                    
                    //alert("Would get correct selector for list element, refresh tethhhhhhhher etc...")    
                    var repeatTag = repeatParent.nodeName.toLowerCase();
                    var parentSelector = getCorrectRepeatSelector(repeatParent);
                    var mySelector = parentSelector + " > " + repeatTag;                    
                    //alert("Correct list selector is: " + mySelector);
                    //lets just send selector up to parent
                    parent.TEMPLATES.iframeNewListField(parentSelector, mySelector);                    
                }
                
                        
                if(repeatParent == null)
                {
                    var userSelector = prompt("Error Autogenerating Element Selector - want to enter one yourself? (e.g. #testelem would select element with id 'testelem'");

                    if (userSelector != null) {
                        theSelector = userSelector;
                        if($(theSelector).length < 1){
                            alert("Sorry - your selector did not work: jQuery('" + theSelector + "').length is 0");
                            return;
                        }
                    }        
                    else{
                        return;
                    }
                }          
                
            }
            else if(SHAWK.SELECTION_STATE == 2){
                var theTarget = e.target;
                
                if(e.shiftKey){
                    theTarget = $(e.target).parent().get(0);                   
                }
                else if(e.altKey){
                    theTarget = $(e.target).parent().parent().get(0);                 
                }                 
                var pSelector = getUniqueParentSelector(theTarget, []);
                console.log("EDITING ITEM parent selector ");
                console.log(pSelector);
                
                var theSelector = getCorrectSelector(theTarget);
                console.log("EDITING ITEM correct selector");
                console.log(theSelector);
                                
                var selectorCount = testSelectorCount(theSelector, 1, "");
                
                if(!selectorCount){
                    alert("Could not get item selector - sorry for the issue try a different item");
                    return;
                }
                parent.TEMPLATES.iframeSetDataOfElement(theSelector);  

                
            }
            else if(SHAWK.SELECTION_STATE == 3 || SHAWK.SELECTION_STATE == 6){
                var theTarget = e.target;
                
                if(e.shiftKey){
                    theTarget = $(e.target).parent().get(0);                   
                }
                else if(e.altKey){
                    theTarget = $(e.target).parent().parent().get(0);                 
                }                 
                console.log("e target");
                console.log(theTarget);
                
                var pSelector = getUniqueParentSelector(theTarget, []);
                console.log("parent selector ");
                console.log(pSelector);
                
                var theSelector = getCorrectSelector(theTarget);
                console.log("correct selector");
                console.log(theSelector);
                
                
                var selectorCount = testSelectorCount(theSelector, 1, "");

                
                if(!selectorCount){
                    alert("Could not get item selector - sorry for the issue try a different item");
                    return;
                }
                var singleItem = $(theSelector).get(0);
                
                var itemTag = singleItem.nodeName.toLowerCase();

                parent.TEMPLATES.iframeNewItemField(theSelector);                   

                var extractor = {};                
                //add a selector
                
            }           
            
	},
	listMouseDown: function(e)
	{
            e.preventDefault();
            e.stopPropagation();
	}
	/************************   ITEM LISTENERS  ***************************/
    /********** GOT RID OF ITEM LISTENERS - JUST USE THE OTHER LISTENERS *************/
}


var scrapelistenerSelectionBox = null; //new SelectionBox(null, null, null);
var snipfinalSelectionBox = null; //new SelectionBox(null, '#990000', null);
SHAWK.SELECTION_BOXES = new Array();
SHAWK.SELECTION_BOXES_LIST = new Array();
SHAWK.SELECTION_BOXES_NEXTSELECT = new Array();
SHAWK.SELECTION_BOX_TEMP = null;

function highlightAllSiblings(elem)
{
    //console.log("highlight all siblings");

    //console.log("HIGHLIGHTING: " + elem.tagName);
    //Highlight Element ARRAY VERSION
    SHAWK.SELECTION_BOXES_LIST.push(new SelectionBox(null, null, null));
    SHAWK.SELECTION_BOXES_LIST[SHAWK.SELECTION_BOXES_LIST.length - 1].highlight(elem);

    //Highlight all siblings with same tag name
    var tName = elem.tagName;
    var maxCount = 30;
    var currCount = 0;
    $(elem).siblings(tName).each(function()
    {
        if(currCount > maxCount){
            console.log("over 100 siblings not going to highlight them all");
            return false;
        }   
        
            SHAWK.SELECTION_BOXES_LIST.push(new SelectionBox(null, '#1666de', null));
            SHAWK.SELECTION_BOXES_LIST[SHAWK.SELECTION_BOXES_LIST.length - 1].highlight(this);

            //var sBox = new SelectionBox(null, '#1666de', null);
            //sBox.highlight(this);
        currCount++;
    });
}

function highlightElement(elem, theColor){
    //console.log("highlightElement");

    var aColor = '#990000';
    if(theColor){
        aColor = theColor;
    }
    
    var scrapehawkSelectionBox = new SelectionBox(null, aColor, null);
    scrapehawkSelectionBox.highlight(elem);    
    
    SHAWK.SELECTION_BOXES.push(scrapehawkSelectionBox);
    
}

function temphighlightElement(elem){
    //console.log("temp highlight");
    if($('.edge_builder_top').length <= 0){
        //console.log("destroying because edge builder doesnt exist");
        if(SHAWK.SELECTION_BOX_TEMP){
            SHAWK.SELECTION_BOX_TEMP.destroy();            
        }
        SHAWK.SELECTION_BOX_TEMP = null;
    }
    
    
    if (!SHAWK.SELECTION_BOX_TEMP  || SHAWK.SELECTION_BOX_TEMP == null){
        SHAWK.SELECTION_BOX_TEMP = new SelectionBox(null, '#1666de', null);
    }
    SHAWK.SELECTION_BOX_TEMP.highlight(elem);        
}


function scrapehawkUnhighlightEverything(){
    //console.log("unhighlighting everything");
    if(scrapelistenerSelectionBox !== null){
        scrapelistenerSelectionBox.hide();  
    }
    if(snipfinalSelectionBox !== null){    
        snipfinalSelectionBox.hide();
    }
}

function unhighlightAllSiblings()
{
    for(var i = 0; i < SHAWK.SELECTION_BOXES_LIST.length; i++)
    {
            SHAWK.SELECTION_BOXES_LIST[i].destroy();	
    }	
    if(SHAWK.SELECTION_BOX_TEMP !== null){
        SHAWK.SELECTION_BOX_TEMP.destroy();        
    }
    SHAWK.SELECTION_BOX_TEMP = null;
    SHAWK.SELECTION_BOXES_LIST = new Array();
}

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

    if(currParent.id != "")
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
            if(!aClass || aClass == ''){
                continue;
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
        var prefix = getUniqueParentSelector(elem, []);
        var myIndex = $(prefix).find(currTag).index(elem);
        //This should only happen after the parent is added
        THE_SELECTOR = prefix + " " + currTag + ":eq(" + myIndex + ")";
        
        //console.log("parent selector " + THE_SELECTOR);
        //console.log("parent selector " + THE_SELECTOR);
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
    }

    if(!FOUND_SELECTOR)
    {
        alert("Error: could not find a selector for element.  (this shouldnt happen and is being logged)");
        return;
    }
   return THE_SELECTOR;
}
    