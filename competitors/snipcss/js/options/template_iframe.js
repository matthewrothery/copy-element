var SHAWK = SHAWK || {};

SHAWK.TETHER_OBJECTS = new Array();
SHAWK.IFRAME_FIELDS = null;
SHAWK.INITIALIZED = false;

$(function()
{	
});

function doInitialize(){
    if(SHAWK.INITIALIZED){
        return;
    }
    console.log("doing intialize");
    
    $('body').on('click', 'a', function(e){
        e.preventDefault();        
        return false;
    });
    
    $('body').children().first().attr('id', 'template');
    //parent.TEMPLATES.templateFrameLoaded();
    
    $('body').on('click', '.template-badge', function(){
        console.log("clicking template ");
        var itemId = this.id.split('-')[1];       
        var me = this;
        this.setAttribute('contenteditable', true);
        this.focus();      
        $(this).off('blur');
        $(this).on('blur', function(){
           var newLabel = $(this).text(); 
           //alert("new label " + newLabel);
           let fieldIndex = $(this).data('fieldindex');
           let fieldInt = parseInt(fieldIndex);
           let subfieldIndex = $(this).data('subfieldindex');
           let isSubfield = false;
           if(subfieldIndex != "-1"){
               let subfieldInt = parseInt(subfieldIndex);
               SHAWK.IFRAME_FIELDS[fieldInt]['sub_fields'][subfieldInt]['label'] = newLabel;
               isSubfield = true;
           }else{               
               SHAWK.IFRAME_FIELDS[fieldInt]['field_name'] = newLabel;
           }
           parent.TEMPLATES.iframeUpdateField(fieldInt, SHAWK.IFRAME_FIELDS[fieldInt]);
           
        });
        
        $(this).off('keypress');        
        $(this).on('keypress', function(e){ 
            if (e.which == 13){
                $(this).blur();
                return false;
            }            
        });        
        window.setTimeout(function() {
            var sel, range;
            if (window.getSelection && document.createRange) {
                range = document.createRange();
                range.selectNodeContents(me);
                sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.body.createTextRange) {
                range = document.body.createTextRange();
                range.moveToElementText(me);
                range.select();
            }
        }, 10);        
        
    });    
    
    $('body').on('click', '.template-moreinfo', function(){
        var $templateBadge = $(this).prev();
        console.log("this");
        console.log(this);
        console.log("previous");
        console.log($templateBadge.get(0));
        
        let fieldIndex = $templateBadge.data('fieldindex');
        let fieldInt = parseInt(fieldIndex);
        let subfieldIndex = $templateBadge.data('subfieldindex');
        let subfieldInt = parseInt(subfieldIndex);
        
        //alert("edit in modal idnex " + fieldIndex + " sub " + subfieldIndex);
        parent.TEMPLATES.iframeEditModalField(fieldInt, subfieldInt);
    });
        
    SHAWK.INITIALIZED = true;
}


function startListListener(){
    console.log("IN IFRAME - start list listeners");
    
    //scrapehawkDetachPageHandlers();
    scrapehawkUnhighlightEverything();
    SHAWK.SELECTION_STATE = 1;
    TemplateElemListeners.attachListListeners();
}

function stopListListener(){
    console.log("IN IFRAME - stop list listeners");
    TemplateElemListeners.detachListListeners();
    unhighlightAllSiblings();
}

function startItemListener(){
    SHAWK.SELECTION_STATE = 3;    
    console.log("start item listeners ");
    TemplateElemListeners.attachListListeners();    
}

function stopItemListener(){
    console.log("sstop item listeners");
    TemplateElemListeners.detachListListeners();
}

function startEditListener(){
    SHAWK.SELECTION_STATE = 2;
    TemplateElemListeners.attachListListeners();    
}

function stopEditListener(){
    SHAWK.SELECTION_STATE = 2;
    TemplateElemListeners.detachListListeners();    
}

function startReloading(){
    console.log("adding the loader to the body");
    let theHtml = '<div id="theloader" class="loading-overlay is-active">' + 
            '<span class="loader"></span>' + 
        '</div>';
        
    if($('#theloader').length <= 0){
        $('body').append(theHtml);
    }
    /*
    setTimeout(function(){
        $('#theloader').addClass('is-active');
    }, 100);
    */
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

function refreshTetherLabels(allFields){
    
    for(let m = 0; m < SHAWK.TETHER_OBJECTS.length; m++){
        let tether = SHAWK.TETHER_OBJECTS[m];
        //tether.destroy();
        
        let theId = "templatebadgecontainer_" + m;
        $('#' + theId).remove();
    }
    SHAWK.TETHER_OBJECTS = new Array();
    
    console.log("IN IFRAME - all fields");
    console.log(allFields);    
    SHAWK.IFRAME_FIELDS = allFields;
    
    var tetherObjectIndex = 0;
    var tetherTargets = new Array();
    var tetherTypes = new Array();
    
    for(var x = 0; x < SHAWK.IFRAME_FIELDS.length; x++){
        console.log("badge");
        var aField = SHAWK.IFRAME_FIELDS[x];
        var theSelector = aField['the_selector'];
        var fieldName = aField['field_name'];
        
        var badgeColor = "blue";
        var repeatItem = null;        
        if(aField['field_type'] == 'list'){
            console.log("badge list");
            badgeColor = "red";
            var useChildren = false;
            if(theSelector.indexOf("children=") !== -1){
                theSelector = theSelector.split("=")[1];
                useChildren = true;
            }

            var $allItems = null;
            if(useChildren){
                if($('#template').children(theSelector).length > 0){
                    repeatItem = $('#template').children(theSelector).get(0);
                    $allItems = $('#template').children(theSelector);
                }
            }else{
                //doesn't need to be firstElem.find()  because it's only thing in the body?
                if($(theSelector).length > 0){
                    repeatItem = $(theSelector).get(0);
                    $allItems = $(theSelector);                            
                }                        
            }              
        }else{
            console.log("badge item");
            
            badgeColor = "blue";
            let containerId = "templatebadgecontainer_" + tetherObjectIndex; 
            let theId = "templatebadge_" + tetherObjectIndex; 
            var labelName = aField['label'];            
            //console.log("item field");
            //console.log(aField);
            //console.log("body html");
            //console.log($('body').html());
            
            var singleItem = $(theSelector).get(0);
            if(!singleItem || singleItem == null){
                console.log("could not find single item");
                continue;                
            }
                       
            tetherObjectIndex++;
            let moreinfoId = "templatemoreinfo_" + tetherObjectIndex;
            let templateBadgeMoreInfo = '<span id="' + moreinfoId + '" class="template-moreinfo template-badge-' + badgeColor + '">></span>';

            let tetherHtml = '<div id="' + containerId + '"><span id="' + theId + '" data-fieldindex="' + x + '" data-subfieldindex="-1" class="template-badge template-badge-' + badgeColor + '">' + 
                        labelName + 
                    '</span>' + templateBadgeMoreInfo + '</div>';  
            //console.log("list tether object");
            //console.log(repeatItem);
            tetherTargets.push(singleItem);
            tetherTypes.push('item');
            $('body').append(tetherHtml);            
            
            //alert("item field");
            continue;
        }
        if(repeatItem == null){
            console.log("not found repeatItem");
            console.log(theSelector);
            continue;
        }
        
        let containerId = "templatebadgecontainer_" + tetherObjectIndex; 
        let theId = "templatebadge_" + tetherObjectIndex; 
        
        tetherObjectIndex++;
        let moreinfoId = "templatemoreinfo_" + tetherObjectIndex;
        let templateBadgeMoreInfo = '<span id="' + moreinfoId + '" class="template-moreinfo template-badge-' + badgeColor + '">></span>';
        
        let tetherHtml = '<div id="' + containerId + '"><span id="' + theId + '" data-fieldindex="' + x + '" data-subfieldindex="-1" class="template-badge template-badge-' + badgeColor + '">' + 
                    fieldName + 
                '</span>' + templateBadgeMoreInfo + '</div>';  
        //console.log("list tether object");
        //console.log(repeatItem);
        tetherTargets.push(repeatItem);
        tetherTypes.push('list');
        $('body').append(tetherHtml);
        
        for(var y = 0; y < aField['sub_fields'].length; y++){
            let subId = "templatebadge_" + tetherObjectIndex; 
            let subcontainerId = "templatebadgecontainer_" + tetherObjectIndex;             
            let subField = aField['sub_fields'][y];
            if(subField['item_type'] == 'sublist'){     
                
                //skip sublists
                continue;
            }       
            
            //console.log("subfield");
            //console.log(subField);
            let subSelector = subField['selector'];  
            let subFieldname = subField['label'];
            let subFound = subField['found'];
            if(!subFound){
                
                console.log("wasnt found");
                console.log(subField);
                continue;
            }
            
            let useChildren = false;
            let myElem = null;
            if(subSelector.indexOf("children=") !== -1){
                subSelector = subSelector.split("=")[1];
                useChildren = true;
            }
            let theLen = 0;
            if(subSelector == 'self'){
                //console.log("skip self true");
                myElem = $(repeatItem).get(0);                    
            }else{                        
                if(useChildren){
                    theLen = $(repeatItem).children(subSelector).length;
                    if(theLen > 0){
                        myElem = $(repeatItem).children(subSelector).get(0);                    
                    }                    
                }else{
                    //console.log("finding inside firstElem");
                    //console.log(subSelector);
                    theLen = $(repeatItem).find(subSelector).length;
                    if(theLen > 0){
                        myElem = $(repeatItem).find(subSelector).get(0);                    
                    }
                }
            }     
            if(!myElem || myElem == null){
                //alert("Could not find " + subSelector);
                //console.log("in list ");
                //console.log(aField);
                //console.log("notfoundrepeatitem");
                //console.log(repeatItem);
                console.log("notfoundselector");
                console.log(subSelector);
            }
            else{
                //console.log("sub element tether object");
                //console.log(myElem);
                tetherTargets.push(myElem);    
                tetherTypes.push('listitem');
                let subinfoId = "templatemoreinfo_" + tetherObjectIndex;
                badgeColor = 'pink';
                
                let templateBadgeSubInfo = '<span id="' + subinfoId + '" class="template-moreinfo template-badge-' + badgeColor + '">></span>';

                let subtetherHtml = '<div id="' + subcontainerId + '"><span id="' + subId + '" data-fieldindex="' + x + '" data-subfieldindex="' + y + '" class="template-badge template-badge-' + badgeColor + '">' + 
                            subFieldname + 
                        '</span>' + templateBadgeSubInfo + '</div>';        
                $('body').append(subtetherHtml);            
                tetherObjectIndex++;
            }
        }
 
    }
    let tetherUsedArr = new Array();
    for(let z = 0; z < tetherObjectIndex; z++){
        var selectorBadge = $('#templatebadgecontainer_' + z);
        var selectedElement = tetherTargets[z];
        var elementType = tetherTypes[z];
        var thePosition = "top left";
        if(elementType == 'listitem'){
            //console.log("center this one");
            thePosition = "center center";
        }
        if(tetherUsedArr.includes(selectedElement)){
            thePosition = "center right";
        }
        
        var attachPosition = "top left";
        
        
        //console.log("badge element");
        //console.log(selectorBadge);
        //console.log("selected element");
        //console.log(selectedElement);
        
        let tetherObject = new Tether({
          element: selectorBadge,
          target: selectedElement,
          attachment: attachPosition,
          targetAttachment: thePosition
        });          
        SHAWK.TETHER_OBJECTS.push(tetherObject);
        tetherUsedArr.push(selectedElement);
        
    }
    //list field = red
    //list subfield = pink
    //item field = blue 

    
}

