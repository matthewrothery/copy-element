var SelectElemListeners = 
{
	lastParent : null,
    shadowRoot : null,
    isPicking : false,
    isExcluding : false,
    isIncluding : false,
    
	/********************** LIST LISTENERS **************************/
	attachListListeners :function(shadowRoot)
	{
       //console.log("attaching list listeners");
       SelectElemListeners.shadowRoot = shadowRoot;
	   document.addEventListener('mousemove', SelectElemListeners.listMouseMove, true);
	   document.addEventListener('click', SelectElemListeners.listMouseClick, true);
	   
	   //Not sure if needed, we will see... i think its needed 
	   document.addEventListener('mousedown', SelectElemListeners.listMouseDown, true);   
       SelectElemListeners.isPicking = true;
    },
    detachListListeners :function()
    {
       //console.log("removing mousemove");
       //console.log("removing mouseclick");
       //console.log("removing mousedown");
       SelectElemListeners.isPicking = false;
        
	   document.removeEventListener('mousemove', SelectElemListeners.listMouseMove, true);
	   document.removeEventListener('click', SelectElemListeners.listMouseClick, true);    
	   
	   document.removeEventListener('mousedown', SelectElemListeners.listMouseDown, true);   	   
    },
	listMouseMove : function(e)
	{
            if(e.target.id == 'snipcss-panel-container'){
                return;
            }
            if(e.target.id == 'snipcss_goup_button'){
                return;
            } 
            if(e.target.id == 'snipcss_exclude_button'){
                return;
            }  
            if(e.target.id == 'snipcss_include_button'){
                return;
            }      
            if(e.target.id == 'snipcss_subselection_button'){
                return;
            } 
            if(e.target.id == 'snipcss_subselection_dropdown'){
                return;
            }                  
            if(e.target.id == 'snipcss_display_selector'){
                return;
            }                
            if($(e.target).parents('#snipcss-panel-container').length > 0){
                return;
            }
            if($(e.target).parents('#snipcss-shadow').length > 0){
                return;
            }          
            if(e.target.id == 'snipcss_snipit_button'){
                return;
            }

            //- 8/22/2012
            //Need current node because text nodes aren't firing events.  So will only find parent of li, which is UL...
            //Then it won't highlight 
            var currNode = e.target.nodeName.toLowerCase();
            //console.log("CURR NODE NODE NODE NODE: " + currNode);
            var blockNode = getBlockContainer(e.target);
            if(currNode !== blockNode){
                 //console.log("USING PARENT: " + blockNode.nodeName.toLowerCase());
            }        
            
            if(SelectElemListeners.isExcluding || SelectElemListeners.isIncluding){
                //check if contained in an element
                if(!SNIPCSS.CURRENT_ELEMENT){
                    return;
                }
                let selectedElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);     
                let insideParent = false;                
                //console.log(e.target);
                //console.log("has " );
                //console.log(SNIPCSS.CURRENT_ELEMENT);
                if($(e.target).parents(SNIPCSS.CURRENT_ELEMENT).length >= 1){
                    //console.log("Inside main parent, can highlight");
                    //console.log("yes");
                    insideParent = true;
                }else if($(selectedElement).find('*').filter(e.target).length > 0){
                    //console.log("yes2");
                    insideParent = true;
                }
                
                if(SNIPCSS.PICKING_MULTIPLE && SNIPCSS.MULTIPLE_ELEMENTS.length > 1){
                    for(var m = 0; m < SNIPCSS.MULTIPLE_ELEMENTS.length; m++){
                        let aClass = SNIPCSS.MULTIPLE_CLASSES[m];                    
                        let parentBlockSelector = '.' + aClass;
                        if($(e.target).parents(parentBlockSelector).length > 0){ 
                            //console.log("Inside multiple element parent, can highlight");    
                            insideParent = true;
                        }
                    }
                }       
                if(!insideParent){
                    return;
                }           
                if(SelectElemListeners.isIncluding){
                    highlightInclude(blockNode);                   
                }else{
                    //console.log("highlighting exclude");
                    
                    highlightExclude(blockNode);
                }
            }else{
                highlightElement(blockNode);
            }
	},
	listMouseClick: function(e)
	{
        //console.log("MOUSE CLICK");
        SNIPCSS.SAVED_LASTCLICK = e;
            if($(e.target).parents('#snipcss-panel-container').length > 0){
                return;
            }
            if(e.target.id == 'snipcss-panel-container'){
                return;
            }
            if(e.target.id == 'snipcss_snipit_button'){
                return;
            }
            if(e.target.id == 'snipcss_goup_button'){
                return;
            } 
            if(e.target.id == 'snipcss_exclude_button'){
                return;
            }   
            if(e.target.id == 'snipcss_include_button'){
                return;
            }        
            if(e.target.id == 'snipcss_subselection_button'){
                return;
            } 
            if(e.target.id == 'snipcss_subselection_dropdown'){
                return;
            }    
            if(e.target.id == 'snipcss_display_selector'){
                return;
            }                  
            if($(e.target).parents('#snipcss-shadow').length > 0){
                return;
            }     
            
            if(e.ctrlKey || e.metaKey){
                console.log("ctrl key pressed while clicking, normal click event should fire");                
            }else{
                console.log("ctrl not pressed - press ctrl+click for snipcss to pass click event to underlying page");                
                e.preventDefault();
                e.stopPropagation();                
            }


            //console.log("getting block container of ");
            //console.log(e.target);
            if(SelectElemListeners.isExcluding || SelectElemListeners.isIncluding){
                if(!SNIPCSS.CURRENT_ELEMENT){
                    //console.log("NO CURRENT ELEMENT");
                    return;
                }
                //console.log("is subselection");
                let insideParent = false; 
                let selectedElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);
                let rootElement = null;
                if($(e.target).parents(SNIPCSS.CURRENT_ELEMENT).length >= 1){
                    //console.log("Inside main parent, can skipcss");
                    insideParent = true;
                    rootElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);
                }else if($(selectedElement).find('*').filter(e.target).length > 0){
                    //console.log("yes2");
                    rootElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);
                    insideParent = true;
                }
                
                if(!insideParent && SNIPCSS.PICKING_MULTIPLE && SNIPCSS.MULTIPLE_ELEMENTS.length > 1){
                    for(var m = 0; m < SNIPCSS.MULTIPLE_ELEMENTS.length; m++){
                        let aClass = SNIPCSS.MULTIPLE_CLASSES[m];                    
                        let parentBlockSelector = '.' + aClass;
                        if($(e.target).parents(parentBlockSelector).length > 0){ 
                            //console.log("Inside multiple element parent, can skipcss");    
                            insideParent = true;
                            rootElement = $(parentBlockSelector).get(0);
                        }
                    }
                }       
                if(insideParent){
                    if(SelectElemListeners.isExcluding){
                        //add skipcss to target element is all you need
                        unhighlightExcludeArr();
                        
                        if(allExcludeElements.length > 0 && !OPTIONS.PRO_USER){
                            alert("To exclude more than 1 element you need to be a SnipCSS Pro Member.");            
                            return;                            
                        }
                        
                        if($(e.target).hasClass('skipcss')){
                            $(e.target).removeClass('skipcss');
                            let skipElemIndex = allExcludeElements.indexOf(e.target);
                            if (skipElemIndex > -1) {
                                allExcludeElements.splice(skipElemIndex, 1);
                            }
                        }else{
                            $(e.target).addClass('skipcss');   
                            allExcludeElements.push(e.target);                        
                        }               
                        highlightExcludeArr(allExcludeElements);                    
                    }else{
                        //add to include elements array, 
                        //We put skipcss on everything except if
                        //1. it's a parent of one of the selected element
                        //2. it's a child of one of the selected element
                        //3. it's one of the selected elements
                        //4. or it's root
                        if(allIncludeElements.length > 0 && !OPTIONS.PRO_USER){
                            alert("To include more than 1 element you need to be a SnipCSS Pro Member.");            
                            return;                            
                        }                        
                        
                        if(!allIncludeElements.includes(e.target)){
                            allIncludeElements.push(e.target);
                        }
                                           
                        $(rootElement).find('*').each(function(){
                            let testElem = this;
                            $(testElem).removeClass('skipcss');
                            let isNeeded = false;
                            for(let i = 0; i < allIncludeElements.length; i++){
                                let includedElem = allIncludeElements[i];
                                if($(includedElem).find('*').filter(testElem).length > 0){
                                    //console.log("is child");
                                    //console.log(testElem);                                
                                    isNeeded = true;
                                }
                                else if($(testElem).find('*').filter(includedElem).length > 0){
                                    //console.log("is child");
                                    //console.log(testElem);                                
                                    isNeeded = true;
                                }                                
                                else if($(includedElem).parents().filter(testElem).length > 0){
                                    //console.log("is parent");
                                    //console.log(testElem);                                
                                    isNeeded = true;                       
                                }else if(includedElem == testElem){
                                    //console.log("is test element");
                                    isNeeded = true;
                                }
                            }
                            
                            if(!isNeeded){
                                $(testElem).addClass('skipcss');
                            }
                        });
                        unhighlightIncludeArr();
                        highlightIncludeArr(allIncludeElements);      
                    }
                }
                
            }else{
                var theSelector;
                let eTarget = e.target;
                if($(e.target).find('*').length <= 0){
                    console.log("Empty element - trying workaround because react/frameworks may be making overlay blocking SnipCSS selecting correct element");
                    //alert("Empty container... wtf");
                    let existingDisplay = $(e.target).css('display');
                    $(e.target).css('display', 'none');
                    let realTarget = document.elementFromPoint(e.clientX, e.clientY);
                    //console.log("real target");
                    //console.log(realTarget);
                    if($(realTarget).find('*').length > 0){   
                        eTarget = realTarget;
                        //console.log("workaround success?");
                        $(e.target).removeAttr('style');            
                    }else{
                        //console.log("workaround failure");                 
                        $(e.target).removeAttr('style');
                    }
                }                
                
                var rParent = getBlockContainer(eTarget);
                if(rParent !== null){
                    theSelector = getCorrectSelector(rParent);
                }

                if(rParent == null || theSelector == null)
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
                var theIndex = 0;
                if(SNIPCSS.IS_REPICKING){
                    var theIndex = SNIPCSS.REPICK_INDEX;
                }
                else if(SNIPCSS.PICKING_MULTIPLE){
                    theIndex = SNIPCSS.MULTIPLE_ELEMENTS.length;
                    if(theIndex >= SNIPCSS.MAX_MULTIPLE){
                        alert("Maximum number of multiple elements is " + SNIPCSS.MAX_MULTIPLE);
                        return;
                    }
                    //we have to test this isn't parent of previous ones
                    //or previous ones are a parent of this
                    var $theElem = $(theSelector);
                    var isParentChild = false;
                    for(var x = 0; x < SNIPCSS.MULTIPLE_ELEMENTS.length; x++){
                        var aClass = SNIPCSS.MULTIPLE_CLASSES[x];                    
                        var $prevElem = $('.' + aClass);
                        if($prevElem.parents(theSelector).length > 0 || 
                                $theElem.parents('.' + aClass).length > 0){
                            alert("When selecting multiple elements the new element cannot be a child or a parent of an " +                                 
                                    "existing selected element.");
                            isParentChild = true;
                            break;
                        }
                    }
                    if(isParentChild){
                        return;
                    }

                    SNIPCSS.MULTIPLE_ELEMENTS.push(theSelector);
                }            

                
                markElementAsSnipElement(theSelector, theIndex);                
                SNIPCSS.CURRENT_ELEMENT = theSelector;
            }
	},
	listMouseDown: function(e)
	{
            e.preventDefault();
            e.stopPropagation();
	}
}
