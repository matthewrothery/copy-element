if(chrome && chrome.runtime){
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        //console.log("content script got runtime.Onmessage: ");
        //console.log(request);        
        if(request.method == 'snipcss_fix_selector'){
            var testSelector = request.test_selector;
            var rootSelector = request.root_selector;
            let otherInherited = request.other_inherited;
            let cssSelector = request.label_class;
            let targetElem = $('.' + cssSelector).get(0);
            var resultObject = window.snipcssUtils.snipcssFixSelector(testSelector, rootSelector, otherInherited, targetElem);
            let resultSelector = resultObject['selector'];
            let resultContained = resultObject['is_contained'];
            let targetFound = resultObject['target_found'];            
            //console.log("result selector: " + resultSelector);
            //console.log("result contained: " + resultContained);            
            
            sendResponse({result: resultSelector, result_contained: resultContained, target_found: targetFound});        
        }
        else if(request.method == 'snipcss_get_tagname'){
           //console.log("in get tagname");
           var tagClass = request.class_selector;
           var devName = request.device_name;
           //console.log("tagclass " + tagClass);
           var theTagname = window.snipcssUtils.snipcssGetTagname(tagClass, devName);
           //console.log("tagname: " + theTagname);
           sendResponse({result: theTagname});
        }       
        else if(request.method == 'snipcss_get_parentelements'){
           var tagClass = request.class_selector;
           var parentClasses = window.snipcssUtils.snipcssGetParentLabels(tagClass);
           //console.log("tagname: " + theTagname);
           sendResponse({result: parentClasses});
            
        }
        else if(request.method == 'snipcss_matching_elements'){
           var testSelector = request.test_selector;
           var matchClasses = window.snipcssUtils.snipcssGetMatchingLabels(testSelector);
           //console.log("tagname: " + theTagname);
           sendResponse({result: matchClasses});
        }
        else if(request.method == 'snipcss_check_checkbox'){
           var tagClass = request.class_selector;
           var yesOrNo = window.snipcssUtils.snipcssCheckIfCheckbox(tagClass);
           //console.log("tagname: " + theTagname);
           sendResponse({result: yesOrNo});            
        }
        else if(request.method == 'get_element_distance'){
           //console.log("in get element distance");
           var inheritedSel = request.inherited_selector;
           var elemSel = request.element_selector;
           
           var theDistance = window.snipcssUtils.snipcssGetDistance(inheritedSel, elemSel);
           
           sendResponse({result: theDistance});           
        }
        else if(request.method == 'close_snipcss'){
            //console.log("close snipcss 2");            
            closeSnipcss();
        }
        else if(request.method == 'dead_kiwi'){
            //console.log("dead kiwi message 1111111");
            if(SNIPCSS_KIWI_WALKER != null){
                SNIPCSS_KIWI_WALKER.googleKilledKiwi();
            }
            SHADOW_ROOT.querySelector('#snipcss_runsnipper').innerHTML = "ERROR";
            SHADOW_ROOT.getElementById('snipcss_processing_text').innerHTML = "A major error has occurred and has been logged. Make sure debugger is allowed and Chrome Devtools closed and try again.";
        }
        else if(request.method == 'snipcss_failed'){
            closeSnipcss();
        }
        else if(request.method == 'activetab_activate'){
            setAsActive(false, null);
        }        
        else if(request.method == 'snipped_result'){
            //console.log("got snipped result");
            //console.log("load this when kiwi done: " + request.index);
            var waitTime = 1000;
            if(SNIPCSS_KIWI_WALKER != null && !SNIPCSS_KIWI_WALKER.isPecking){
                waitTime = 5000;
            }
            if(request.is_automating){
                window.postMessage(
                  {
                    source: 'snipcss-extension',
                    data: request,
                  },
                  '*' // You can specify a specific origin if needed
                );                
            }
            else{
                setTimeout(function(){
                    if(SNIPCSS_KIWI_WALKER != null){
                        SNIPCSS_KIWI_WALKER.stopAnimation();
                    }
                    chrome.runtime.sendMessage({
                        method: "loadSnipper", 
                        index: request.index,
                        uid: request.uid
                    });                                             
                }, waitTime);
            }
            
        }
        else if(request.method == 'automate_result'){
            console.log("got automate_result, sending to command line");
            console.log(request);
            window.postMessage(
              {
                source: 'snipcss-extension',
                data: request,
              },
              '*' // You can specify a specific origin if needed
            );               
        }
        else if(request.method == 'extraction_failed'){
            console.log("received extraction_failed message - Passing to automation script");
            window.postMessage(
              {
                source: 'snipcss-extension',
                data: request,
              },
              '*' // You can specify a specific origin if needed
            );                 
        }
        else if(request.method == 'run_snipper_from_background'){
            console.log("running snipper from background");
            var automatedSelectors = request.automate_selectors;
            if(automatedSelectors.indexOf('|') !== -1){
                var allSelectors = automatedSelectors.split('|');
            }else{
               SNIPCSS.MULTIPLE_ELEMENTS.push(automatedSelectors);  
               SNIPCSS.CURRENT_ELEMENT = automatedSelectors;  
               //mark as snip element
               $(automatedSelectors).addClass(SNIPCSS.MULTIPLE_CLASSES[0]); 
            }
            var hasElement = 0;
            if($(SNIPCSS.CURRENT_ELEMENT).length > 0){
                hasElement = 1;
                startSnipper();                
            }
            sendResponse({result: hasElement});
            //SNIPCSS.MULTIPLE_ELEMENTS.push(theSelector);
            //markElementAsSnipElement(theSelector);                
                   
        }
        else if(request.method == 'continue_snipper_from_background'){
            console.log("CONTINUE snipper from background");
            window.snipcssUtils.snipcssRemoveAllLabels();            
            var automatedSelector = request.automate_selector;
            console.log("with selector: " + automatedSelector);
            SNIPCSS.MULTIPLE_ELEMENTS = new Array();
            SNIPCSS.MULTIPLE_ELEMENTS.push(automatedSelector);  
            SNIPCSS.CURRENT_ELEMENT = automatedSelector;  
            //mark as snip element
            $("." + SNIPCSS.MULTIPLE_CLASSES[0]).removeClass(SNIPCSS.MULTIPLE_CLASSES[0]); 
            $(automatedSelector).addClass(SNIPCSS.MULTIPLE_CLASSES[0]); 
            
            var hasElement = 0;
            if($(SNIPCSS.CURRENT_ELEMENT).length > 0){
                hasElement = 1;
                startSnipper(true);                
            }
            sendResponse({result: hasElement});
            //SNIPCSS.MULTIPLE_ELEMENTS.push(theSelector);
            //markElementAsSnipElement(theSelector);                
                   
        }                    
        else if(request.method == 'load_your_options'){
            let optionsObj = request.options_object; 
            //console.log("loading your options");         
            //console.log(optionsObj);
            snipcssLoadOptions(optionsObj);
        }
        else if(request.method == 'test_message'){
            //console.log("got test result");
            //console.log(request.data);
        }      
        else if(request.method == 'close_snipcss'){
            //console.log("close snipcss 1");
            closeSnipcss();               
        }   
        else if(request.method == 'dead_kiwi'){
            //console.log("dead kiwi message 22222");
            if(SNIPCSS_KIWI_WALKER != null){
                SNIPCSS_KIWI_WALKER.googleKilledKiwi();
            }
            SHADOW_ROOT.querySelector('#snipcss_runsnipper').innerHTML = "ERROR";
            SHADOW_ROOT.getElementById('snipcss_processing_text').innerHTML = "A major error has occurred and has been logged. Make sure debugger is allowed and Chrome Devtools closed and try again.";
        }
        else if(request.method == 'snipcss_failed'){           
            closeSnipcss();
        }            
        else if(request.method == 'resize_thrash'){
            console.log("got resize thrash");
            window.dispatchEvent(new Event('resize'));
        }
        else if(request.method == 'snipcss_success'){  
            
            if(!request.is_automating){
                SNIPCSS_KIWI_WALKER.kiwiSuccess();       
                closeSnipcss();                
            }else{
              window.postMessage(
                  {
                    source: 'snipcss-extension',
                    data: request,
                  },
                  '*' 
              );                 
            }            
        } 
        else if(request.method == 'automation_complete'){
              window.postMessage(
                  {
                    source: 'snipcss-extension',
                    data: request,
                  },
                  '*' 
              );              
            SNIPCSS_KIWI_WALKER.kiwiSuccess();     
            closeSnipcss();            
        }
        else if(request.method == 'segment_page'){
            console.log("segmenting page");
            console.log(request);
            console.log("automate_uid");
            console.log(request.automate_uid);
            
            collectElements(50).then(elementsArray => {
              console.log("Initial Processing");
              console.log(elementsArray);

              let processedInitialElements = SEGM.processElements(elementsArray);
              console.log("processedElements");
              console.log(processedInitialElements);
              let processedElements = SEGM.filterElements(processedInitialElements);

              console.log("filteredElements");
              console.log(processedElements);


              // Sort the elements by their vertical position on the page
              processedElements.sort((a, b) => {
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();
                const aTop = aRect.top + window.scrollY;
                const bTop = bRect.top + window.scrollY;
                return aTop - bTop;
              });  
              
              
              let maxElements = 10;
              console.log("limiting array to " + maxElements + " elements");
              if(processedElements.length > maxElements){
                  processedElements = processedElements.slice(0, maxElements); // Limit to first 4 elements
              }
              console.log('Processed Elements:', processedElements);
              
              request.method = 'segment_page_result';
              
              let allElementData = new Array();
              let screenshotClasses = new Array();
              for(let m = 0; m < processedElements.length; m++){
                  let bounds = processedElements[m].getBoundingClientRect();
                  let uniqueSelector = SEGM.getUniqueSelector(processedElements[m], []);
                  if(uniqueSelector == null){
                      console.log("COULD NOT FIND UNIQUE SELECTOR");
                      console.log(processedElements[m]);
                      continue;
                  }
                  let classForScreenshot = "snipcss-screenshot" + m;
                  screenshotClasses.push(classForScreenshot);
                  $(processedElements[m]).addClass(classForScreenshot);
                  //need to have the bounds in this
                  let elemData = {
                      selector: uniqueSelector,
                      screenshot_selector: "." + classForScreenshot,
                      bounds: bounds
                  };
                  allElementData.push(elemData);
              }
              
              request.element_data = JSON.stringify(allElementData);
              console.log("sending element data ");
              console.log(allElementData);
              
              window.addEventListener('message', async (event) => {
                  if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'screenshotsstored-' + request.automate_uid) {
                      
                    //remove all the screenshot classes  
                    for(let s = 0; s < screenshotClasses.length; s++){
                        let removeClass = screenshotClasses[s];
                        $('.' + removeClass).removeClass(removeClass);
                    }
                      
                    console.log("received post message from automation script");
                    // The Node script signaled we can now proceed:
                    chrome.runtime.sendMessage({
                      method: "segmentPageFinished", 
                      automate_uid: request.automate_uid,
                      all_element_data: allElementData
                    });
                  }
                  else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'mobilescreenshot-' + request.automate_uid) {
                    chrome.runtime.sendMessage({
                      method: "set_device_mobile"
                    });
                  }                  
                  else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'ipadscreenshot-' + request.automate_uid) {
                    chrome.runtime.sendMessage({
                      method: "set_device_ipad"
                    });
                  }                  
                  else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'hide_fixed') {   
                      console.log("GOT HIDE FIXED EVENT");
                      let unhideSelector = event.data.unhide_selector;
                      console.log(unhideSelector);
                      window.snipcssUtils.hideFixedElements(unhideSelector);
                  }          
                  else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'fetch_background_logs') {   
                      let taskUid = event.data.task_uid;
                      console.log("fetching logs for " + taskUid);
                      
                      chrome.runtime.sendMessage({method: "getLatestLogs", task_uid: taskUid});
                  }                       
                  
                  
              });               
              
              console.log("sending postmessage");
              console.log(request);
              //SEGM.highlightElements(processedElements);
              window.postMessage(
                  {
                    source: 'snipcss-extension',
                    data: request,
                  },
                  '*' 
              ); 
      
              /*
              let myWait = 1000;
              setTimeout(function(){
                  console.log("sending segment page finished");
                    chrome.runtime.sendMessage({
                        method: "segmentPageFinished", 
                        automate_uid: request.automate_uid,
                        all_element_data: allElementData
                    });                                             
              }, myWait);
              */
            });            
        }
        else if(request.method == 'record_logs'){
            let logs = request.logs;
            console.log("passing logs to automation script");
            console.log(logs);
            window.postMessage(
                {
                  source: 'snipcss-extension',
                  data: request,
                },
                '*' 
            );              
        }
        else if(request.method == 'define_requested_elements'){
            //still have to take screenshots so just treat it like segment page result
            request.method = 'segment_page_result';

            console.log("define requested elements");
            console.log(request);
            console.log("automate_uid");
            console.log(request.automate_uid);

            let theSelectors = request.selectors;

            console.log("given selectors array");
            console.log(theSelectors);

            var escapeSelectorIfNeeded = function(selector) {
                if (selector.indexOf('\\') !== -1) {
                  return selector.replace(/\\/g, '\\\\');
                }
                return selector;
            };

            // New helper that tries both the non-escaped and escaped selectors and polls every second up to 5 seconds.
            function findElementWithRetries(originalSelector, callback, attempts) {
                attempts = attempts || 0;
                const escapedSelector = escapeSelectorIfNeeded(originalSelector);
                let elem = null;
                let workingSelector = null;
                try {
                    // Try using jQuery with original selector
                    elem = $(originalSelector).get(0);
                    if(elem){
                        workingSelector = originalSelector;
                    } else {
                        // Try using jQuery with escaped selector
                        elem = $(escapedSelector).get(0);
                        if(elem){
                            workingSelector = escapedSelector;
                        }
                    }
                } catch(ex) {}
                if(!elem){
                    try {
                        // Try with document.querySelector for the original selector
                        elem = document.querySelector(originalSelector);
                        if(elem){
                            workingSelector = originalSelector;
                        } else {
                            // Then try the escaped selector
                            elem = document.querySelector(escapedSelector);
                            if(elem){
                                workingSelector = escapedSelector;
                            }
                        }
                    } catch(ex) {}
                }
                if(elem){
                    callback(elem, workingSelector);
                } else if(attempts < 5) {
                    setTimeout(function(){
                        findElementWithRetries(originalSelector, callback, attempts+1);
                    }, 1000);
                } else {
                    console.log("COULD NOT FIND PROVIDED SELECTOR after retries:", originalSelector);
                    callback(null, null);
                }
            }

            let allElementData = new Array();
            let screenshotClasses = new Array();
            let remaining = theSelectors.length;
            for(let m = 0; m < theSelectors.length; m++){
                let originalSelector = theSelectors[m];
                console.log("finding selector");
                console.log(originalSelector);
                

                findElementWithRetries(originalSelector, function(elem, workingSelector) {
                    if(!elem){
                        console.log("COULD NOT FIND PROVIDED SELECTOR", originalSelector);
                    } else {
                        let bounds = elem.getBoundingClientRect();
                        console.log("adding working selector " + workingSelector);
                        console.log(" vs " + originalSelector);
                        let classForScreenshot = "snipcss-screenshot" + remaining;
                        screenshotClasses.push(classForScreenshot);
                        $(elem).addClass(classForScreenshot);                
                        
                        // Use the workingSelector (escaped if necessary) as the selector in the data structure
                        let elemData = {
                            selector: workingSelector,
                            screenshot_selector: "." + classForScreenshot,
                            bounds: bounds,
                            is_fixed_element: window.snipcssUtils.hasFixedOrStickyElements(elem)
                        };
                        allElementData.push(elemData);
                    }
                    remaining--;
                    if(remaining === 0){
                        request.element_data = JSON.stringify(allElementData);
                        console.log("define specific elements sending element data ");
                        console.log(allElementData);
                    }
                });
            }

            window.addEventListener('message', async (event) => {
                if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'screenshotsstored-' + request.automate_uid) {
                    console.log("received post message from automation script");
                    //remove all the screenshot classes  
                    for(let s = 0; s < screenshotClasses.length; s++){
                        let removeClass = screenshotClasses[s];
                        $('.' + removeClass).removeClass(removeClass);
                    }
                    
                    // The Node script signaled we can now proceed:                    
                    chrome.runtime.sendMessage({
                      method: "segmentPageFinished", 
                      automate_uid: request.automate_uid,
                      all_element_data: allElementData
                    });
                }
                else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'mobilescreenshot-' + request.automate_uid) {
                    chrome.runtime.sendMessage({
                      method: "set_device_mobile"
                    });
                }                  
                else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'ipadscreenshot-' + request.automate_uid) {
                    chrome.runtime.sendMessage({
                      method: "set_device_ipad"
                    });
                }        
                else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'hide_fixed') {   
                    console.log("GOT HIDE FIXED EVENT");
                    let unhideSelector = event.data.unhide_selector;
                    window.snipcssUtils.hideFixedElements(unhideSelector);
                }       
                else if (event.data && event.data.source === 'snipcss-nodejs' && event.data.method === 'fetch_background_logs') {   
                    let taskUid = event.data.task_uid;
                    console.log("fetching logs for " + taskUid);

                    chrome.runtime.sendMessage({method: "getLatestLogs", task_uid: taskUid});
                }                    
            });               
            //SEGM.highlightElements(processedElements);    
            if(allElementData.length > 0){
                window.postMessage(
                    {
                      source: 'snipcss-extension',
                      data: request,
                    },
                    '*' 
                );            
            }else{
                request.method = "extraction_failed";
                request.stop_extraction = 1;
                request.message = "Extraction element could not be found.  Please make sure selector works trying document.querySelector with selector on page";
                window.postMessage(
                  {
                    source: 'snipcss-extension',
                    data: request,
                  },
                  '*' // You can specify a specific origin if needed
                );                    
            }   
        }
        else if (request.method == 'hide_fixed_elements') {
            
            let extractSelector = request.extract_selector;
            window.snipcssUtils.hideFixedElements(extractSelector);
        }        
    });
}	
//This is now my preferred object creation method:
//https://gist.github.com/a2fd1da997f457b76efe

var SNIPCSS = SNIPCSS || {};	
var OPTIONS = OPTIONS || {};
var SNIPCSS_SELECTING_ELEMENTS = false;
var SNIPCSS_EXCLUDING_ELEMENTS = false;
var SNIPCSS_SELECTOR = "";
var SNIPCSS_TETHER_SNIPBUTTON = null;
var SNIPCSS_TETHER_SELECTORDISPLAY = null;
var SNIPCSS_TETHER_PARENTBUTTON = null;
var SNIPCSS_TETHER_UPBUTTON = null;
var SNIPCSS_TETHER_SUBSELECTION_BUTTON = null;
var SNIPCSS_TETHER_SUBSELECTION_DROPDOWN = null;
var SNIPCSS_TETHER_EXCLUDEBUTTON = null;
var SNIPCSS_TETHER_INCLUDEBUTTON = null;
var SNIPCSS_VALID_TAGS = new Array();
var SHADOW_CSS = "";
var SHADOW_ROOT = null;
SNIPCSS_VALID_TAGS.push('div');
SNIPCSS_VALID_TAGS.push('article');
SNIPCSS_VALID_TAGS.push('aside');
SNIPCSS_VALID_TAGS.push('body');
SNIPCSS_VALID_TAGS.push('details');
SNIPCSS_VALID_TAGS.push('fieldset');
SNIPCSS_VALID_TAGS.push('form');
SNIPCSS_VALID_TAGS.push('main');
SNIPCSS_VALID_TAGS.push('header');
SNIPCSS_VALID_TAGS.push('nav');
SNIPCSS_VALID_TAGS.push('section');
SNIPCSS_VALID_TAGS.push('summary');
SNIPCSS_VALID_TAGS.push('table');    
SNIPCSS_VALID_TAGS.push('ul');
SNIPCSS_VALID_TAGS.push('ol');
SNIPCSS_VALID_TAGS.push('tr');
SNIPCSS_VALID_TAGS.push('li');
SNIPCSS_VALID_TAGS.push('a');
SNIPCSS_VALID_TAGS.push('p');
SNIPCSS_VALID_TAGS.push('h1');
SNIPCSS_VALID_TAGS.push('h2');
SNIPCSS_VALID_TAGS.push('h3');
SNIPCSS_VALID_TAGS.push('h4');
SNIPCSS_VALID_TAGS.push('h5');
SNIPCSS_VALID_TAGS.push('h6');
SNIPCSS_VALID_TAGS.push('blockquote');
SNIPCSS_VALID_TAGS.push('main');
SNIPCSS_VALID_TAGS.push('span');
SNIPCSS.USER_EMAIL = false;
SNIPCSS.RESOLUTIONS = new Array();
SNIPCSS.RESOLUTIONS.push('default');
SNIPCSS.PICKING_MULTIPLE = false;
SNIPCSS.MAX_MULTIPLE = 10;
SNIPCSS.MULTIPLE_ELEMENTS = new Array();
SNIPCSS.CURRENT_ELEMENT = "";  //selector for current element
SNIPCSS.MULTIPLE_CLASSES = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
    'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX',
    'XXsnipcss_extracted_selector_6_XX', 'XXsnipcss_extracted_selector_7_XX', 'XXsnipcss_extracted_selector_8_XX',
    'XXsnipcss_extracted_selector_9_XX', 'XXsnipcss_extracted_selector_10_XX', 'XXsnipcss_extracted_selector_11_XX',
    'XXsnipcss_extracted_selector_12_XX', 'XXsnipcss_extracted_selector_13_XX', 'XXsnipcss_extracted_selector_14_XX',
    'XXsnipcss_extracted_selector_15_XX', 'XXsnipcss_extracted_selector_16_XX', 'XXsnipcss_extracted_selector_17_XX',
    'XXsnipcss_extracted_selector_18_XX', 'XXsnipcss_extracted_selector_19_XX', 'XXsnipcss_extracted_selector_20_XX'];
SNIPCSS.JQUERY_SELECTORS = new Array();
SNIPCSS.IS_SNIPPING = false;
SNIPCSS.IS_REPICKING = false;
SNIPCSS.REPICK_SELECTORS = new Array();
SNIPCSS.REPICK_INDEX = 0;
SNIPCSS.PREMODAL_SELECTION = false;
SNIPCSS.PROCESSING_NODE_TOTAL = 0;
SNIPCSS.PROCESSING_NODE_CURR = 0;
SNIPCSS.PROCESSING_NODE_DEVICE = "";
SNIPCSS.MODAL_OPEN = false;
SNIPCSS.BAD_SELECTORS = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
    'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX', 'tether-target','XXsnipcss_extracted_selector_6_XX', 
    'XXsnipcss_extracted_selector_7_XX', 'XXsnipcss_extracted_selector_8_XX',
    'XXsnipcss_extracted_selector_9_XX', 'XXsnipcss_extracted_selector_10_XX', 'XXsnipcss_extracted_selector_11_XX'];



OPTIONS.SCOPE_GENERICS = true;
OPTIONS.REMOVE_VENDORPREFIX = true;
OPTIONS.REMOVE_INHERITRULES = true;
OPTIONS.MULTIPLE_RESOLUTIONS = false;
OPTIONS.UNUSED_CSS = false;
OPTIONS.RELOAD_RESOLUTIONS = false;
OPTIONS.REMOVE_VENDORPREFIX = true;
//CHANGED BY VISITING WEBSITE, PAYING ME SOME MuthaFing Money
OPTIONS.PRO_USER = false;
OPTIONS.USER_EMAIL = "";
OPTIONS.API_KEY = "";    
OPTIONS.MAX_ERRORS = 2;
var SNIPCSS_KIWI_WALKER = null;
var multipleAllElementClassnames = new Array();
var allExcludeElements = new Array();
var allIncludeElements = new Array();
var hiddenFixedElements = {}

function snipCheckBodyLoad()
{
    //console.log("check snip body");
    if(document.body)
    {
        window.clearInterval(SNIPCSS_BODY_TIMER);
        afterBodyLoad();
    }
}
function closeSnipcss(){
    stopSelector();
    //$('#snipcss_snipit_button').removeClass('snipcss-btn-block').remove();
    $('#snipcss_display_selector').remove();     
    $('#snipcss-panel-container').remove();
    $('#snipcss_goup_button').remove();
    $('#snipcss_subselection_button').remove();
    $('#snipcss_subselection_dropdown').remove();    
    $('#snipcss-kiwi').remove();
}

var SNIPCSS_BODY_TIMER = setInterval(function(){
    snipCheckBodyLoad();
}, 500);  //.5 sec

var selboxArr = new Array();
var excludeboxArr = new Array();
var includeboxArr = new Array();
var scrapelistenerSelectionBox = null; //new SelectionBox(null, null, null);
var excludelistenerSelectionBox = null; //new SelectionBox(null, null, null);
var includelistenerSelectionBox = null; //new SelectionBox(null, null, null);
var snipfinalSelectionBox = null; //new SelectionBox(null, '#990000', null);
var multiplefinalSelectionBox = [null, null, null, null, null];

function highlightAllSiblings(elem)
{
    //console.log("HIGHLIGHTING: " + elem.tagName);
    //Highlight Element ARRAY VERSION
    selboxArr.push(new SelectionBox(null, null, null));
    selboxArr[selboxArr.length - 1].highlight(elem);

    //if (!scrapelistenerSelectionBox)
    //    scrapelistenerSelectionBox = new SelectionBox(null, '#1666de', null);

	//scrapelistenerSelectionBox.highlight(elem);

	//Highlight all siblings with same tag name
	var tName = elem.tagName;
	$(elem).siblings(tName).each(function()
	{
		selboxArr.push(new SelectionBox(null, '#1666de', null));
		selboxArr[selboxArr.length - 1].highlight(this);

		//var sBox = new SelectionBox(null, '#1666de', null);
		//sBox.highlight(this);
	});
}
function highlightElementArr(elemArr)
{
    //console.log("HIGHLIGHTING: " + elem.tagName);
    //Highlight Element ARRAY VERSION


    //if (!scrapelistenerSelectionBox)
    //    scrapelistenerSelectionBox = new SelectionBox(null, '#1666de', null);

	//scrapelistenerSelectionBox.highlight(elem);

	//Highlight all siblings with same tag name
	$(elemArr).each(function()
	{
		selboxArr.push(new SelectionBox(null, '#1666de', null));
		selboxArr[selboxArr.length - 1].highlight(this);
		//var sBox = new SelectionBox(null, '#1666de', null);
		//sBox.highlight(this);
	});
}

function unhighlightElementArr()
{
	for(var i = 0; i < selboxArr.length; i++)
	{
		selboxArr[i].destroy();	
	}	
	selboxArr = new Array();
}

function unhighlightExcludeArr()
{
	for(var i = 0; i < excludeboxArr.length; i++)
	{
		excludeboxArr[i].destroy();	
	}	
	excludeboxArr = new Array();
}


function highlightExclude(elem){
    if (!excludelistenerSelectionBox || excludelistenerSelectionBox == null)
        excludelistenerSelectionBox = new SelectionBox(null, '#9b3af2', null);

    //hide normal selection 
    scrapelistenerSelectionBox.hide();  
    excludelistenerSelectionBox.highlight(elem);        
}

function highlightExcludeArr(elemArr)
{
    //console.log("HIGHLIGHTING: " + elem.tagName);
    //Highlight Element ARRAY VERSION


    //if (!scrapelistenerSelectionBox)
    //    scrapelistenerSelectionBox = new SelectionBox(null, '#1666de', null);

	//scrapelistenerSelectionBox.highlight(elem);

	//Highlight all siblings with same tag name
	$(elemArr).each(function()
	{
		excludeboxArr.push(new SelectionBox(null, '#5602a1', null));
		excludeboxArr[excludeboxArr.length - 1].highlight(this);
		//var sBox = new SelectionBox(null, '#1666de', null);
		//sBox.highlight(this);
	});
}

function unhighlightIncludeArr()
{
	for(var i = 0; i < includeboxArr.length; i++)
	{
		includeboxArr[i].destroy();	
	}	
	includeboxArr = new Array();
}


function highlightInclude(elem){
    if (!includelistenerSelectionBox || includelistenerSelectionBox == null)
        includelistenerSelectionBox = new SelectionBox(null, '#76bfff', null);

    //hide normal selection 
    scrapelistenerSelectionBox.hide();  
    includelistenerSelectionBox.highlight(elem);        
}

function highlightIncludeArr(elemArr)
{
    //console.log("HIGHLIGHTING: " + elem.tagName);
    //Highlight Element ARRAY VERSION


    //if (!scrapelistenerSelectionBox)
    //    scrapelistenerSelectionBox = new SelectionBox(null, '#1666de', null);

	//scrapelistenerSelectionBox.highlight(elem);

	//Highlight all siblings with same tag name
	$(elemArr).each(function()
	{
		includeboxArr.push(new SelectionBox(null, '#355de5', null));
		includeboxArr[includeboxArr.length - 1].highlight(this);
		//var sBox = new SelectionBox(null, '#1666de', null);
		//sBox.highlight(this);
	});
}



function highlightElement(elem){
    if (!scrapelistenerSelectionBox || scrapelistenerSelectionBox == null)
        scrapelistenerSelectionBox = new SelectionBox(null, '#990000', null);

    scrapelistenerSelectionBox.highlight(elem);        
}

function finalhighlightElement(elem, index){
    if(!SNIPCSS.PICKING_MULTIPLE){
        if (!snipfinalSelectionBox  || snipfinalSelectionBox == null)
            snipfinalSelectionBox = new SelectionBox(null, '#1666de', null);

        snipfinalSelectionBox.highlight(elem);        
    }else{
        if(!multiplefinalSelectionBox[index] || multiplefinalSelectionBox[index] == null){
            multiplefinalSelectionBox[index] = new SelectionBox(null, '#1666de', null);
        }
        multiplefinalSelectionBox[index].highlight(elem);        
    }
}

function unhighlightAllSiblings()
{
	for(var i = 0; i < selboxArr.length; i++)
	{
		selboxArr[i].destroy();	
	}	
	selboxArr = new Array();
}

function unhighlightEverything(){
    //console.log("unhighlighting everything");
    if(scrapelistenerSelectionBox !== null){
        scrapelistenerSelectionBox.hide();  
    }
    if(snipfinalSelectionBox !== null){    
        snipfinalSelectionBox.hide();
    }
    if(includelistenerSelectionBox !== null){
        includelistenerSelectionBox.hide();
    }
    if(excludelistenerSelectionBox !== null){
         excludelistenerSelectionBox.hide();
    }    
    
    for(var x = 0; x < multiplefinalSelectionBox.length; x++){
        var aBox = multiplefinalSelectionBox[x];
        if(aBox !== null){
            aBox.hide();
        }
    }
    unhighlightElementArr();
    unhighlightExcludeArr();
    unhighlightIncludeArr();
}

function getRepeatingParent(elem)
{
	if(!elem)
	{
            //console.log("elem undefined");
            return null;
	}
	var repeatingElement = null;
	var currParent = $(elem).parent().get(0);
	var parentTag = currParent.nodeName.toLowerCase();
	
	if(parentTag == "body") //no div, li, tr found
	{	
            //console.log("No found repeater");
            return null;
	}
	
	if(parentTag == "li" || parentTag == "div" || parentTag == "tr")
	{
		var sibLength = $(currParent).siblings(parentTag).length;
		if(sibLength > 2)
			return currParent;
	}
	
	//Not found
	return getRepeatingParent(currParent);	
}



function getBlockContainer(elem)
{
	if(!elem)
	{
            //console.log("elem undefined");
            return null;
	}
	var currentTag = elem.nodeName.toLowerCase();
        if(currentTag == 'body'){
            return elem;
        }
                /*
	var currParent = $(elem).parent().get(0);
	if(!$.inArray(currentTag, SNIPCSS_VALID_TAGS) >= 0)
	{
            return getParentContainer(elem);
	}
        else{
            //console.log("searching tags, current: " + currentTag + " - getting parent");
        }
	*/
    //console.log('what');
    //console.log(elem);
   
        return elem;
}

function removeClassesNamedTether(removeElem){
    //alert("removing classes named tether");
    
    var hasClass = false;
    removeElem.classList.forEach(className => {
        //console.log("classname: " + className);
      if (className.startsWith('tether')) {
        //console.log("removed");
        removeElem.classList.remove(className);
        hasClass = true;
      }
    });      
    if(hasClass){
        //keep doing it repeatedly because fuck you for not working
        //console.log("recursing");
        removeClassesNamedTether(removeElem);                
    }
};

function getParentContainer(elem)
{
	if(!elem)
	{
		//console.log("elem undefined");
		return null;
	}
	
	var currParent = $(elem).parent().get(0);
        if(!currParent){
            //console.log("parent elem not defined");
            return null;
        }
        
	var parentTag = currParent.nodeName.toLowerCase();	
        //console.log("parent tag is " + parentTag)
	
	if(parentTag == "body")
	{
		//Global select is just body
		return $('body').get(0);	
	}
        //these are valid 

 
	if($.inArray(parentTag, SNIPCSS_VALID_TAGS) >= 0)
	{
            return currParent;
	}
        else{
            //console.log("searching tags, current: " + parentTag + " - getting parent");
        }
        
	return getParentContainer(currParent);	
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
        var uSelector = parentTag + "#" + $.escapeSelector(currParent.id);
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
        var goodClass = "nogoodclassgetsselected";
        var classList = currParent.className.split(/\s+/);
        for (var i = 0; i < classList.length; i++) {
            var classInside = false;
            var aClass = classList[i];
            if(aClass.indexOf(':') >= 0){
                aClass = aClass.split(':')[0];
            }                          
            if(aClass.trim() == ""){
                continue;
            }
            var invalidSelectors = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
                'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX', 'tether-target'];

            if(!aClass || aClass == ''){
                continue;
            }
            if(SNIPCSS.BAD_SELECTORS.includes(aClass)){
                continue;
            }
            if(aClass.startsWith("tether") || aClass.startsWith("snipcss")){
                continue;
            }            
            goodClass = aClass;
        }        
        var uSelector = parentTag + "." + $.escapeSelector(goodClass);
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

function markElementAsSnipElement(theSelector, theIndex){
    
    var selectClass;
    if(!theIndex){
        selectClass = SNIPCSS.MULTIPLE_CLASSES[0];
    }else{
        selectClass = SNIPCSS.MULTIPLE_CLASSES[theIndex];
    }
    
    //console.log("Selector ");
    //console.log(theSelector);
    //console.log($(theSelector).get(0));

    //Remove the existing 
    var removeElem = document.querySelector('.' + selectClass);
    $('.' + selectClass).removeClass(selectClass);  
    
    $(theSelector).addClass(selectClass);    

    //console.log("added " + selectClass + " to " + theSelector);
    
    
    var theElem = $(theSelector).get(0);
    try{
        if(!!theElem.shadowRoot){
            alert("This element has SHADOW DOM, unfortunately SnipCSS does not work with the SHADOW DOM");
        }
    }catch(errr){
        console.log("parsing class error");
    }
    
    finalhighlightElement(theElem, theIndex);
    $('#snipcss_goup_button').data('selindex', theIndex);
    
    var setupSnipEvents = function(){
        setTimeout(function(){
            
            $('body').on('click', '#snipcss_goup_button', function(e){
                //goupIndex is for multiple elements
                var goupIndex = parseInt($(this).data('selindex'));
                e.preventDefault();
                e.stopPropagation();
                var currElemSelector = SNIPCSS.CURRENT_ELEMENT;
                var elemSelector = '.' + SNIPCSS.MULTIPLE_CLASSES[0];
                if($(currElemSelector).length <= 0){
                    console.log("BAD CURRENT ELEMENT SELECTOR: ");
                    console.log(SNIPCSS.CURRENT_ELEMENT);
                    currElemSelector = elemSelector;
                    if($(currElemSelector).length <= 0){
                        alert("SnipCSS Element went away?  Could not select parent element.");
                        return;                        
                    }
                }
                var currElement = $(currElemSelector).get(0);
                var tagName = currElement.tagName;
                if(tagName == 'body' || tagName == 'html' || tagName == 'BODY' || tagName == 'HTML'){
                    alert("There are no more parent elements");
                    return;
                }
                var myParent = $(currElement).parent().get(0);   
                //hacky way to remove multiple classes before getCorrect
                var existingClasses = new Array();
                for(var x = 0; x < SNIPCSS.MULTIPLE_CLASSES.length; x++){
                    if($(currElement).hasClass(SNIPCSS.MULTIPLE_CLASSES[x])){
                       $(currElement).removeClass(SNIPCSS.MULTIPLE_CLASSES[x]);
                       removeClassesNamedTether(currElement);
                       existingClasses.push(SNIPCSS.MULTIPLE_CLASSES[x]);
                    }
                }
                var theSelector = getCorrectSelector(myParent);
                //then re-add multiple classes
                for(var m = 0; m < existingClasses.length; m++){
                    $(currElement).addClass(existingClasses[m]);
                }
                
                if(theSelector == null)
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
                markElementAsSnipElement(theSelector, goupIndex);
                SNIPCSS.CURRENT_ELEMENT = theSelector;
                
                //console.log("done snipcss parent");
                //console.log(SNIPCSS.CURRENT_ELEMENT);
                
            });
            
            $('body').on('click', '#snipcss_subselection_button', function(e){
                let cancelHtml = 'Cancel Subselection';
                if($(this).html() == cancelHtml){
                    SelectElemListeners.isExcluding = false;
                    $('.skipcss').removeClass('skipcss');
                    SelectElemListeners.isIncluding = false;
                    //$('#snipcss_include_button').html('&#x2BBE; Include');        
                    $(this).html("Subselection &#9660;");
                }else{
                    //just open the dropdown
                    $('#snipcss_subselection_dropdown').css('display', 'block');
                    if(SNIPCSS_TETHER_SUBSELECTION_DROPDOWN != null){
                        SNIPCSS_TETHER_SUBSELECTION_DROPDOWN.position();
                    }
                }
            });
            
            $('body').on('click', '#snipcss_exclude_button', function(e){
                /*
                if(!OPTIONS.PRO_USER){
                    alert("To exclude specific items in the selected section you need to be a SnipCSS Pro Member.");            
                    return;
                } 
                */
               //alert("excluding clicked");
               
                if(!SelectElemListeners.isExcluding){
                    SelectElemListeners.isIncluding = false;
                    if(SNIPCSS_SELECTING_ELEMENTS){
                        SelectElemListeners.isExcluding = true;                       
                    }else{             
                        startSelector();
                        SelectElemListeners.isExcluding = true;                    
                    }       
                    $('#snipcss_subselection_button').html("Cancel Subselection");
                    $('#snipcss_subselection_dropdown').css('display', 'none');
                    allExcludeElements = new Array();
                    allIncludeElements = new Array();                    
                    unhighlightExcludeArr();
                    unhighlightIncludeArr();                    
                }else{

                }
            });     
            $('body').on('click', '#snipcss_include_button', function(e){
                /*
                if(!OPTIONS.PRO_USER){
                    alert("To include specific items in the selected section you need to be a SnipCSS Pro Member.");            
                    return;
                }                    
                */
                if(!SelectElemListeners.isIncluding){
                    SelectElemListeners.isExcluding = false;         
                    if(SNIPCSS_SELECTING_ELEMENTS){
                        SelectElemListeners.isIncluding = true;                       
                    }else{             
                        startSelector();
                        SelectElemListeners.isIncluding = true;                    
                    }
                    //$('#snipcss_include_button').html('Cancel');
                    $('#snipcss_subselection_button').html("Cancel Subselection");
                    $('#snipcss_subselection_dropdown').css('display', 'none');
                }else{
 
                    
                }
            });              
            $('body').on('click', '#snipcss_snipit_button', function(){
                if(SNIPCSS.IS_REPICKING){
                    //console.log("selector before " + SNIPCSS.REPICK_SELECTORS[SNIPCSS.REPICK_INDEX]);                    
                    SNIPCSS.REPICK_SELECTORS[SNIPCSS.REPICK_INDEX] = SNIPCSS.CURRENT_ELEMENT;                    
                    //console.log("selector after " + SNIPCSS.REPICK_SELECTORS[SNIPCSS.REPICK_INDEX]);
                    SNIPCSS.relabelSelectors();
                }else{
                    startSnipper();
                }
            });
            
        }, 50);
        
    };
    
    //add buttons other things
    var doEvents = false;
    if($('#snipcss_snipit_button').length <= 0){
         var buttonHtml = '<a id="snipcss_snipit_button" href="javascript:void(0);" ' +  
             'class="snipcss-btn snipcss-btn-info snipcss-waves-effect snipcss-waves-light">RUN SNIP CSS</a>';          
         $('body').append(buttonHtml);
         
         var selectorBadgeHtml = '<span id="snipcss_display_selector" class="snipcss-badge-warning snipcss-smaller-badge snipcss-badge" ' +  
             '></span>';          
         $('body').append(selectorBadgeHtml);
         
         var goUpButton = '<span id="snipcss_goup_button" class="snipcss-badge-danger snipcss-bigger-badge snipcss-badge">&#9650; Select Parent</span>';
         $('body').append(goUpButton);
         
        //up arrow, circle x
        /*
         var excludeButton = '<span id="snipcss_exclude_button" class="snipcss-badge-warning snipcss-badge-purple snipcss-badge">&#x2BBE; Exclude</span>';
         $('body').append(excludeButton);         
         
        //up arrow, circle x
         var includeButton = '<span id="snipcss_include_button" class="snipcss-badge-warning snipcss-badge-blue snipcss-badge">&#x2BD0; Include</span>';
         $('body').append(includeButton);                          
        //up arrow, circle x
        */
       
         var subselectionButton = '<span id="snipcss_subselection_button" class="snipcss-badge-warning snipcss-badge-blue snipcss-bigger-badge snipcss-badge">Subselection &#9660;</span>';
         $('body').append(subselectionButton);                 

         
         var subselectionDropdown = `<div id="snipcss_subselection_dropdown" class="dropdown-k6g">
            <a href="javascript:void(0);" id="snipcss_include_button" class="dropdown-item-5q1 snip-a-kgr">
              Include Specific Elements
            </a>
            <hr class="dropdown-yrp">
            <a href="javascript:void(0);" id="snipcss_exclude_button" class="dropdown-item-5q1 snip-a-kgr">
              Exclude Specific Elements
            </a>
          </div>`;
         $('body').append(subselectionDropdown);       
         setTimeout(function(){
              $('#snipcss_subselection_dropdown').css('display', 'none');
         }, 10);
         
         
         doEvents = true;         
    }
    
    setTimeout(function(){

        if(removeElem != null){
            removeClassesNamedTether(removeElem);
        }
        
        positionTetherButtons();
        $('#snipcss_display_selector').html(SNIPCSS.CURRENT_ELEMENT);
        
        if(doEvents){
            //console.log("DOING EVENTS");
            setupSnipEvents();
        }

        
        
        var tagName = theElem.tagName;
        
        if($(theElem).width() < 250){
            $('#snipcss_goup_button').addClass('snipcss-smaller-badge');
            $('#snipcss_subselection_button').addClass('snipcss-smaller-badge'); 
            $('#snipcss_snipit_button').addClass('snipcss-smaller-btn');
            $('#snipcss_display_selector').addClass('snipcss-hide-badge');
        }else{
            $('#snipcss_goup_button').removeClass('snipcss-smaller-badge');
            $('#snipcss_subselection_button').removeClass('snipcss-smaller-badge');                        
            $('#snipcss_snipit_button').removeClass('snipcss-smaller-btn');                        
            $('#snipcss_display_selector').removeClass('snipcss-hide-badge');
        }
        
        if(SHADOW_ROOT != null){
            if(!SNIPCSS.PICKING_MULTIPLE || SNIPCSS.MULTIPLE_ELEMENTS.length == 1){
                //$('#snipcss_element_selected_box').html(theSelector);
                let selectedElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);        
                let theLen = selectedElement.getElementsByTagName('*').length;
                SHADOW_ROOT.getElementById('snipcss_selectorbox').innerHTML = "1 " + tagName + ", " + theLen.toString() + " elem";
            }else{
                //$('#snipcss_element_selected_box').html(SNIPCSS.MULTIPLE_ELEMENTS.length + " elements selected");   
                let theLen = 0;
                for(let f = 0; f < SNIPCSS.MULTIPLE_ELEMENTS.length; f++){
                    let multSelector = SNIPCSS.MULTIPLE_ELEMENTS[f];
                    //console.log("multselector " + multSelector);
                    let multElem = null;
                    if($(multSelector).length > 0){
                        multElem = $(multSelector).get(0);
                        theLen += multElem.getElementsByTagName('*').length;
                    }
                }                
                SHADOW_ROOT.getElementById('snipcss_selectorbox').innerHTML = SNIPCSS.MULTIPLE_ELEMENTS.length + " tags," + theLen + " elem";
            }        
        }
        
        //var SNIPCSS_TETHER_PARENTBUTTON = null;
        
        
    }, 50);
    
    //console.log("AFTER NEW MARK...");
    //console.log("MULTIPLE ELEMENTS");
    //console.log(SNIPCSS.MULTIPLE_ELEMENTS);
    //console.log("CURRENT");
    //console.log(SNIPCSS.CURRENT_ELEMENT);    
}

function positionTetherButtons(){
        var selectedElement = $(SNIPCSS.CURRENT_ELEMENT).get(0);        
        var snipitButton = $('#snipcss_snipit_button').get(0);
        var selectorBadge = $('#snipcss_display_selector').get(0);
        var upButton = $('#snipcss_goup_button').get(0);
        //var excludeButton = $('#snipcss_exclude_button').get(0);
        //var includeButton = $('#snipcss_include_button').get(0);
        var subselectionButton = $('#snipcss_subselection_button').get(0);
        var subselectionDropdown = $('#snipcss_subselection_dropdown').get(0);        
        //console.log("selected elem");
        //console.log(selectedElement);
        //console.log("snipit button");
        //console.log(snipitButton);
        if(SNIPCSS_TETHER_SNIPBUTTON != null){
            //console.log("destroying");
            // SNIPCSS_TETHER_SNIPBUTTON.destroy();     
        }

        
        
        if(SNIPCSS_TETHER_SNIPBUTTON != null){            
            //console.log("destroying1");
            SNIPCSS_TETHER_SNIPBUTTON.destroy();
        } 
        
        SNIPCSS_TETHER_SNIPBUTTON = new Tether({
          element: snipitButton,
          target: selectedElement,
          attachment: 'top center',
          targetAttachment: 'top center'
        });       
        
        
        if(SNIPCSS_TETHER_SELECTORDISPLAY != null){            
            //console.log("destroying2");
            SNIPCSS_TETHER_SELECTORDISPLAY.destroy();
        }     
        
        SNIPCSS_TETHER_SELECTORDISPLAY = new Tether({
          element: selectorBadge,
          target: selectedElement,
          attachment: 'bottom right',
          targetAttachment: 'bottom right'
        });       
        
        if(SNIPCSS_TETHER_UPBUTTON != null){            
            //console.log("destroying3");
            SNIPCSS_TETHER_UPBUTTON.destroy();
        } 
        
        //special positioning for parent button...
        let rect = selectedElement.getBoundingClientRect();
        let distanceFromTop = rect.top + window.scrollY;
        let distanceFromLeft = rect.left;

        let attachmentTopOrBottom = "bottom";
        if (distanceFromTop <= 20) {
            attachmentTopOrBottom = "top";
        }
        let offsetHorizontal = 2;
        let pixelHorizontal = "2px";

        if(distanceFromLeft < 0){
            offsetHorizontal = offsetHorizontal + distanceFromLeft;
            pixelHorizontal = offsetHorizontal.toString() + "px";
        }
        
        
        SNIPCSS_TETHER_UPBUTTON = new Tether({
          element: upButton,
          target: selectedElement,
          attachment: attachmentTopOrBottom + " left",
          targetAttachment: 'top left',
          offset: '0 ' + pixelHorizontal
        });          
        
        
        /*
        if(SNIPCSS_TETHER_EXCLUDEBUTTON != null){            
            //console.log("destroying3");
            SNIPCSS_TETHER_EXCLUDEBUTTON.destroy();
        } 
        
        SNIPCSS_TETHER_EXCLUDEBUTTON = new Tether({
          element: excludeButton,
          target: selectedElement,
          attachment: 'top right',
          targetAttachment: 'top right'                   
        });
        
        if(SNIPCSS_TETHER_INCLUDEBUTTON != null){            
            //console.log("destroying3");
            SNIPCSS_TETHER_INCLUDEBUTTON.destroy();
        } 
        
        SNIPCSS_TETHER_INCLUDEBUTTON = new Tether({
          element: includeButton,
          target: selectedElement,
          attachment: 'top right',
          targetAttachment: 'top right',
          offset: '0 120px'
        });        
        */
       
        if(SNIPCSS_TETHER_SUBSELECTION_BUTTON != null){            
            //console.log("destroying3");
            SNIPCSS_TETHER_SUBSELECTION_BUTTON.destroy();
        } 
        
        SNIPCSS_TETHER_SUBSELECTION_BUTTON = new Tether({
          element: subselectionButton,
          target: selectedElement,
          attachment: attachmentTopOrBottom + ' right',
          targetAttachment: 'top right'                   
        });        
        
        
        if(SNIPCSS_TETHER_SUBSELECTION_DROPDOWN != null){            
            //console.log("destroying3");
            SNIPCSS_TETHER_SUBSELECTION_DROPDOWN.destroy();
        } 
        
        SNIPCSS_TETHER_SUBSELECTION_DROPDOWN = new Tether({
          element: subselectionDropdown,
          target: subselectionButton,
          attachment: 'top right',
          targetAttachment: 'bottom right'                   
        });              
        
        
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
        THE_SELECTOR = "#" + $.escapeSelector(elem.id);
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        if(!FOUND_SELECTOR){
            if(parentElem.id && parentElem.id !== ""){
                THE_SELECTOR =  parentTag + "#" + $.escapeSelector(parentElem.id) + " > " + THE_SELECTOR;                
            }else{
                THE_SELECTOR =  parentTag + " > " + THE_SELECTOR;
            }
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        }
    }
    if(!FOUND_SELECTOR && elem.className && elem.className != "")
    {
        //console.log("SELECTOR TEST 2 - BY CLASS");               
        try{
            var elemClassnames = elem.className.split(/(?!\(.*)\s(?![^(]*?\))/g);

            for(var x = 0; x < elemClassnames.length; x++){
                var aClass = $.escapeSelector(elemClassnames[x]);
                var invalidSelectors = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
    'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX', 'tether-target'];
                
                if(!aClass || aClass == ''){
                    continue;
                }
                if(SNIPCSS.BAD_SELECTORS.includes(aClass)){
                    continue;
                }
                if(aClass.startsWith("tether") || aClass.startsWith("snipcss")){
                    continue;
                }
                
                THE_SELECTOR = "." + aClass;					
                //was this.testSelectorCount... which was a bug
                //just one class must have been skipped which made things more complicated maybe
                FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");    
                if(!FOUND_SELECTOR){
                    if(parentElem.id && parentElem.id !== ""){
                        THE_SELECTOR =  parentTag + "#" + $.escapeSelector(parentElem.id) + " > " + THE_SELECTOR;                
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
        catch(errr){
            console.log("parsing class error");
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


function snipcssButtonPageHandlers(shadowRoot){
    //console.log("ok here attaching listeners");
    
    SelectElemListeners.attachListListeners(shadowRoot);    
}

function snipcssDetachPageHandlers(){
    SelectElemListeners.detachListListeners();        
}

function snipcssModalHandlers(){
    $('body').on('click', '#snipcss_modal_ok', function(){
         //OPTIONS.PRO_USER
         var allResolutions = new Array();
         $('#snipcss-modal-content .snipcss_checkbox').each(function(){
             if($(this).is(":checked")){
                 //console.log("found checked ");
                 //console.log(this);
                 //console.log($(this).val());
                 var checkVal = $(this).val();
                 allResolutions.push(checkVal);
             }
             
         });
         if(allResolutions.length <= 0){
             alert("You need to pick at least one resolution");
             //$('.warning-nopro').html("You need to pick at least one resolution");
             return;
         }
         SNIPCSS.RESOLUTIONS = allResolutions;
         
         //console.log("check resolutions");
         //console.log(allResolutions);
         MicroModal.close("modal-pick-resolution"); 
         SNIPCSS.MODAL_OPEN = false;
        if(SNIPCSS.PREMODAL_SELECTION){
            SNIPCSS.PREMODAL_SELECTION = false;
            startSelector();
        }                 
    });
    
    $('body').on('click', '#snipcss_message_modal_ok', function(){
        MicroModal.close("modal-pick-resolution"); 
        SNIPCSS.MODAL_OPEN = false;
    });
    
    $('body').on('click', '.snipcss-modal__close', function(){
        MicroModal.close("modal-pick-resolution");         
        SNIPCSS.MODAL_OPEN = false;        
    });
    
    $('body').on('click', '.snipcss-modal__overlay', function(e){
        if ($(e.target).hasClass('snipcss-modal__container') || $(e.target).parents(".snipcss-modal__container").length > 0) {

        } else {
            if(SNIPCSS.MODAL_OPEN){
                MicroModal.close("modal-pick-resolution");
                SNIPCSS.MODAL_OPEN = false;
            }
        }        
    });
    
    //MicroModal.close("modal-pick-resolution"); 
    
    
    $('body').on('change', '.snipcss_checkbox', function(e){
        var me = this;
        var isChecking = false;
        if($(this).is(':checked')){
            isChecking = true;
        }
        //console.log("this");
        //console.log(this);
        if(!OPTIONS.PRO_USER && isChecking){
            //uncheck other ones             
            $('#snipcss-modal-content .snipcss_checkbox').each(function(){
                if(this.id == 'checkresolution_default' || this.id == 'checkresolution_largedesktop' || this.id == 'checkresolution_ipadlandscape'){
                    console.log("skipping large one");
                    return;
                }
                if($(this).is(":checked")){
                    $('.warning-nopro').css('display', 'block');
                }                
                $(this).prop("checked", false);
            });
        }
    });
    
    /******** Modal to change selection ********************/
    $('body').on('click', '#snipcss_use_parent', function(e){
        $('#snipcss_goup_button').trigger('click');
        MicroModal.close("modal-pick-resolution");
    });    
    
    $('body').on('click', '#snipcss_use_first,#snipcss_use_last', function(e){                
        e.preventDefault();
        e.stopPropagation();
        var goupIndex;
        var elemSelector = SNIPCSS.CURRENT_ELEMENT;
        var currElement = $(elemSelector).get(0);
        if($(currElement).children().length <= 0){
            alert("There are no children elements");
            return;
        }
        var myChild = null;
        if(this.id == 'snipcss_use_first'){
            myChild = $(currElement).children().first().get(0);
        }else{
            myChild = $(currElement).children().last().get(0);            
        }
        
        //hacky way to remove multiple classes before getCorrect
        var existingClasses = new Array();
        for(var x = 0; x < SNIPCSS.MULTIPLE_CLASSES.length; x++){
            if($(elemSelector).hasClass(SNIPCSS.MULTIPLE_CLASSES[x])){
               $(elemSelector).removeClass(SNIPCSS.MULTIPLE_CLASSES[x]);
               removeClassesNamedTether(currElement);               
               existingClasses.push(SNIPCSS.MULTIPLE_CLASSES[x]);
            }
        }
        var theSelector = getCorrectSelector(myChild);
        //then re-add multiple classes
        for(var m = 0; m < existingClasses.length; m++){
            $(elemSelector).addClass(existingClasses[m]);
        }
        
        if(theSelector == null)
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
        markElementAsSnipElement(theSelector, goupIndex);
        SNIPCSS.CURRENT_ELEMENT = theSelector;
        console.log("done snipcss usefirstlast");
        console.log(SNIPCSS.CURRENT_ELEMENT);
        MicroModal.close("modal-pick-resolution");
    });    
    
    $('body').on('click', '#snipcss_set_children', function(){
        if(!OPTIONS.PRO_USER){
            alert("To limit selection based on children indices you need to be a SnipCSS Pro Member.");            
            return;
        }        
        
        var childrenIndices = $('#snipcss_children_indices').val();
        var keepArr = childrenIndices.split(',');
        var keepIntegers = new Array();
        for(var k = 0; k < keepArr.length; k++){
            var someNumbers = keepArr[k].match(/\d+/gi).join('');
            if(someNumbers.length > 0){
                var someInteger = parseInt(someNumbers);
                keepIntegers.push(someInteger);
            }
        }                
        //console.log("keep integers");
        //console.log(keepIntegers);
        var currElem = $(SNIPCSS.CURRENT_ELEMENT).get(0);
        var success = window.snipcssUtils.snipcssLabelSkipElements(currElem, keepIntegers);
        
        //console.log("classes should be labeled");
        //console.log(currElem);
        if(success){
            MicroModal.close("modal-pick-resolution");
        }
    });
    $('body').on('click', '#snipcss_set_customselect', function(e){
        if(!OPTIONS.PRO_USER){
            alert("To use custom selectors you need to be a SnipCSS Pro Member.");            
            return;
        }        

        e.preventDefault();
        e.stopPropagation();
        let customSelector = $('#snipcss_custom_selector').val();
        if($(customSelector).length <= 0){
            alert("Sorry your custom selector did not work. jQuery('" + customSelector + "').length is 0");
            return;
        }
        else if($(customSelector).length > 1){
            SNIPCSS.PICKING_MULTIPLE = true;
        }
        //clear previous
        if(SNIPCSS.CURRENT_ELEMENT != null){            
            for(var x = 0; x < SNIPCSS.MULTIPLE_CLASSES.length; x++){
                var aClass = SNIPCSS.MULTIPLE_CLASSES[x];      
                if($('.' + aClass).length > 0){
                    let oldElem = $('.' + aClass).get(0);
                    $('.' + aClass).removeClass(aClass);
                    removeClassesNamedTether(oldElem);
                }
            }
        }

        $(customSelector).each(function(){
            let elem = this;

            var theSelector;
            var rParent = getBlockContainer(elem);
            if(rParent !== null){
                theSelector = getCorrectSelector(rParent);
            }
            if(rParent == null || theSelector == null)
            {
                //just try to do the first one
                markElementAsSnipElement(customSelector, 0);                
                SNIPCSS.CURRENT_ELEMENT = customSelector;                  
                return false;
            }
            if(SNIPCSS.PICKING_MULTIPLE){
                let theIndex = SNIPCSS.MULTIPLE_ELEMENTS.length;
                if(theIndex >= SNIPCSS.MAX_MULTIPLE){
                    //alert("The maximum amount of multiple elements is " + SNIPCSS.MAX_MULTIPLE);
                    return false;
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
                    return false;
                }
               
                SNIPCSS.MULTIPLE_ELEMENTS.push(theSelector);
                markElementAsSnipElement(theSelector, theIndex);                
                SNIPCSS.CURRENT_ELEMENT = theSelector;                
            }else{
                markElementAsSnipElement(theSelector, 0);                
                SNIPCSS.CURRENT_ELEMENT = theSelector;                            
            }            
        });
      
    });
}

SNIPCSS.relabelSelectors = function(){
    
    var repickCurrent = SNIPCSS.REPICK_SELECTORS[SNIPCSS.REPICK_INDEX];
    //console.log("repick current: " + repickCurrent);
    
    //maybe check visibility of the element not just length... may hide and show another element ?  
    if($(repickCurrent).length > 0){
        var selectClass = SNIPCSS.MULTIPLE_CLASSES[SNIPCSS.REPICK_INDEX];
        if(!$(repickCurrent).hasClass(selectClass)){  
            $('.' + selectClass).removeClass(selectClass);  
            $(repickCurrent).addClass(selectClass);
        }
        //alert("found it: " + repickCurrent);
        //alert("We are done repicking one - continue snipping");
        
        setTimeout(function(){
            var newHtml = 0;
            if(SNIPCSS.IS_REPICKING){
                newHtml = 1;
                //this means we have new html for this element... which should be treated as if there was another element
            }
            var aClassnameString = window.snipcssUtils.snipcssLabelAll(repickCurrent, SNIPCSS.REPICK_INDEX);
            var newHtmlImages = window.snipcssUtils.snipcssGetHtmlImages([repickCurrent]);
            var newElementOuterHtml = window.snipcssUtils.snipcssGetOuterHtml(repickCurrent);
            var newZipOuterHtml = window.snipcssUtils.snipcssGetZipOuterHtml(repickCurrent);
            /*
            console.log("continuing new snipper, sending: ");
            console.log({
                method: "continueSnipper", 
                url: window.location.href,
                selector_index: SNIPCSS.REPICK_INDEX,
                has_new_html: newHtml,
                new_html_images: newHtmlImages,
                new_element_outer_html: newElementOuterHtml,
                new_zip_outer_html: newZipOuterHtml,
                new_selector: repickCurrent,
                new_classname: SNIPCSS.MULTIPLE_CLASSES[SNIPCSS.REPICK_INDEX],
                new_all_element_classnames: aClassnameString
            });
            */
            chrome.runtime.sendMessage({
                method: "continueSnipper", 
                url: window.location.href,
                selector_index: SNIPCSS.REPICK_INDEX,
                has_new_html: newHtml,
                new_html_images: newHtmlImages,
                new_element_outer_html: newElementOuterHtml,
                new_zip_outer_html: newZipOuterHtml,
                new_selector: repickCurrent,
                new_classname: SNIPCSS.MULTIPLE_CLASSES[SNIPCSS.REPICK_INDEX],
                new_all_element_classnames: aClassnameString
            });         
            
            
        }, 100);
        
        startKiwiWalking();
        
        //we don't need recursive... we don't need multiple here
        //multipleAllElementClassnames.push(aClassnameString);   
        //SNIPCSS.REPICK_INDEX++;
        //SNIPCSS.relabelSelectors();
    }else{                                
        SNIPCSS.IS_REPICKING = true;
        alert("The same element was not found at this resolution - you need to pick it again for the kiwi to snip it.");
        if($('#snipcss-panel-container').length <= 0){
            snipcssButtonPageHandlers();   
            snipcssGetOptions();                    
            buildSnipUI();           
        }
        setTimeout(function(){
            startSelector();            
            $('#snipcss_snipit_button').html("Pick Selector");
        }, 500);        
        //console.log("show repick modal");
        return;
    }
    
}

function afterBodyLoad()  //window.waitUntilExists(document, function()
{
        //console.log("snip body loaded");

        if(chrome && chrome.runtime){
            chrome.runtime.sendMessage({method: "amIActive", location: window.location.href}, 
            function(response) 
            {	
                if(response.is_active == 1){
                    setAsActive(response.is_reload, response.reload_data);                 
                }
            });
        }else{
            //console.log("loading snip page handlers");
            snipcssButtonPageHandlers();            
        }
}

function setAsActive(isReload, reloadData){
     
    //console.log("IS ACTIVE, RELOAD DATA");
    if(isReload){
        //console.log("is reload");
        //console.log(reloadData);

        SNIPCSS.REPICK_SELECTORS = reloadData['allJquerySelectors'];
        SNIPCSS.REPICK_INDEX = reloadData['selIndex'];
        var siteUrl = reloadData['site_url'];

        //check that it's the same url so we're still doing the thing
        var continueSnipping = false;
        if(siteUrl.length > 10 && window.location.href.length > 10){
            var hrefStart = window.location.href.substr(0,10);
            var siteStart = siteUrl.substr(0, 10);
            if(hrefStart == siteStart){
                continueSnipping = true;
            }
        }else{
            continueSnipping = true;
        }
        //SNIPCSS.REPICK_INDEX = 0;
        if(continueSnipping){
            SNIPCSS.relabelSelectors();
        }

    }else{
        //console.log("is not reload");
    }
    //console.log("I am actively snipping");
    //dyanmically load scripts????
    snipcssButtonPageHandlers();   
    snipcssGetOptions();                    

    //$('body').append('<input style="display:none !important;" type="hidden" id="snipcss_hidden_input_selector" value="" />');
    buildSnipUI();       
}


function buildSnipUI(){
    //console.log("IN BUILD SNIP UI");
    var snipKiwiImage = chrome.runtime.getURL('img/kiwi_transparent_run_text.png');
    loadMustacheTemplate('templates/snipcss_page_controls.html', 'body',
    {snipkiwi_image : snipKiwiImage},
	function(theHtml){
            var bodyElement = document.body;
        
            var myDivElement = document.createElement('div');
            myDivElement.setAttribute('id', 'snipcss-panel-container');       
            myDivElement.classList.add('skipcss');
            bodyElement.appendChild(myDivElement);       
            
            var modalDivElement = document.createElement('div');
            modalDivElement.classList.add("snipcss-modal"); 
            modalDivElement.classList.add("snipcss-micromodal-slide");  
            modalDivElement.setAttribute("id", "modal-pick-resolution");
            bodyElement.appendChild(modalDivElement);              
            
            setTimeout(function(){                
             //
                var handleHtml = '<div id="snipcss-button-relative-container">' + 
                            '<div class="snipcss_birdcontainer">' + 
                                '<img class="snipcss_bird" src="' + snipKiwiImage + '"' +
                                     ' style="touch-action: none;">' +
                            '</div>' + 
                            '<button id="snipcss-close" class="">' + 
                            '<span id="snipcss-close-svg">' + 
                                '<svg viewBox="0 0 24 24" class="close"><path d="M 2 2 L 22 22 M 2 22 L22 2" stroke="#666666" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"></path></svg>' + 
                            '</span>' +    
                            '</button>' + 
                            '</div><div class="snipcss-shadowcontainer"></div>';                
                $(myDivElement).html(handleHtml);
                setTimeout(function(){
                    var contentDiv = $(".snipcss-shadowcontainer").get(0);
                    SHADOW_ROOT = contentDiv.attachShadow({ mode: 'open' }); 
                    let style = document.createElement('style');
                    /*
                    var linkNode = document.createElement("link"); 
                    linkNode.type = "text/css"; 
                    linkNode.rel = "stylesheet"; 
                    linkNode.href = "//fonts.googleapis.com/css?family=Poppins|Roboto";
                    document.head.appendChild(linkNode);                    
                    */
                    
                    let wrapper = document.createElement('div');
                    wrapper.setAttribute('id', 'snipcss-shadow');     
                    style.textContent = SHADOW_CSS;
                    wrapper.innerHTML = theHtml;
                    SHADOW_ROOT.appendChild(style);
                    SHADOW_ROOT.appendChild(wrapper);
                    setTimeout(function(){
                         var $scrapecontrols = $('#snipcss-panel-container');
                         //var $draggableControls = $scrapecontrols.draggabilly();                      

                         var $draggableControls = $scrapecontrols.draggabilly({
                            handle: '.snipcss_birdcontainer'
                         });

                         $draggableControls.on('dragEnd', function(event, pointer){                             

                             var leftPos = $('#snipcss-panel-container').css('left');
                             var topPos =  $('#snipcss-panel-container').css('top');
                             var myWidth =  $('#snipcss-panel-container').width();
                             
                             leftPos = parseInt(leftPos.replace('px', ''));
                             topPos = parseInt(topPos.replace('px', ''));
                             //console.log("right pos before " + rightPos);
                             //console.log("top pos before: " + topPos);
                             
                             
                             var screenWidth = window.innerWidth || document.documentElement.clientWidth;
                             var screenHeight = window.innerHeight || document.documentElement.clientHeight;
                             var rightPos = screenWidth - (leftPos + myWidth);
                             
                             /*
                             if(rightPos > (screenWidth - myWidth)){
                                 rightPos = (screenWidth - myWidth);
                                 $('#snipcss-panel-container').css('right', rightPos.toString() + "px"); 
                             }
                             else if(rightPos < 0){
                                 rightPos = 0;
                                 $('#snipcss-panel-container').css('right', rightPos.toString() + "px");
                             }
                             */
                            if(leftPos < 0){
                                leftPos = 0;
                                $('#snipcss-panel-container').css('left', "0px");            
                                rightPos = screenWidth - myWidth;
                            }
                            else if(leftPos > (screenWidth - 60)){
                                leftPos = (screenWidth - 60);
                                $('#snipcss-panel-container').css('left', leftPos.toString() + "px");
                                rightPos = 60;
                            }                             
                             

                             if(topPos < 30){
                                 topPos = 30;
                                 $('#snipcss-panel-container').css('top', "30px");                    
                             }
                             
                             //console.log("after adjustment right: " + rightPos);
                             //console.log("after adjustment top: " + topPos);
                             

                             chrome.runtime.sendMessage({method: "save_controls_position", right_pos: rightPos, top_pos: topPos}, function(response){  

                             });
                             
                        });                   
                        //fucking bullshit I have to do this for Shadow DOM                                      
                        $(myDivElement).hover(
                             function() {
                               if(SNIPCSS_SELECTING_ELEMENTS){                              
                                   SelectElemListeners.detachListListeners();
                               }
                             }, function() {
                               if(SNIPCSS_SELECTING_ELEMENTS){
                                   //console.log("reatttaching");
                                   SelectElemListeners.attachListListeners(SHADOW_ROOT);                          
                               }
                             }
                         );       
                         $('#snipcss-close').on('click', function(){
                             closeSnipcss();
                         });
                         afterSnipCSSUILoads(SHADOW_ROOT);                
                     }, 100);                    
                    
                    
                }, 30);
                

 
                
            }, 100)
    });  
    
}

function snipcssLoadOptions(resp){
   var yesnoTrueFalse = function(theOption, theDefault){
        if(theOption == "yes"){
            return true;
        }
        else if(theOption == "no"){
            return false;
        }
        return theDefault;
    }
    
    OPTIONS.SCOPE_GENERICS = yesnoTrueFalse(resp['scope_generics'], true);
    OPTIONS.REMOVE_VENDORPREFIX = yesnoTrueFalse(resp['remove_vendorprefix'], false);
    OPTIONS.REMOVE_INHERITRULES = yesnoTrueFalse(resp['remove_inheritrules'], false);
    OPTIONS.MULTIPLE_RESOLUTIONS = yesnoTrueFalse(resp['multiple_resolutions'], false);
    OPTIONS.UNUSED_CSS = yesnoTrueFalse(resp['unused_css'], false);
    OPTIONS.RELOAD_RESOLUTIONS = yesnoTrueFalse(resp['reload_resolutions'], false);

    OPTIONS.API_KEY = resp['api_key'];
    OPTIONS.PRO_USER = false;
    OPTIONS.USER_EMAIL = resp['user_email'];
    if(resp['pro_user']){
        OPTIONS.PRO_USER = true;
        if(OPTIONS.MULTIPLE_RESOLUTIONS){
            SNIPCSS.RESOLUTIONS = ['default', 'iphonexs', 'ipadvertical'];
        }
    }
    var controlsPosition = resp['controls_position'];
    //console.log("controls position");
    //console.log(controlsPosition);


    //console.log("options now ");
    //console.log(OPTIONS);
    //console.log("current resolutions");
    //console.log(SNIPCSS.RESOLUTIONS);
    setTimeout(function(){
        var screenWidth = window.innerWidth || document.documentElement.clientWidth;
        var screenHeight = window.innerHeight || document.documentElement.clientHeight;

        //console.log('screenwh ' + screenWidth + "," + screenHeight);

        var myTop = screenHeight - ($('#snipcss-panel-container').height() + 20);
        var myRight = 70;

        //console.log("default top: " + myTop);
        //console.log("default right: " + myRight);            
        try{
            if(controlsPosition && typeof(controlsPosition) !== 'undefined' && controlsPosition['right'] != null && controlsPosition['right'] != "default"){
                myRight = controlsPosition['right'];
                myRight = parseInt(myRight);
                if(myRight > (screenWidth - 70)){
                    myRight = 70;
                }
            }
            if(controlsPosition && typeof(controlsPosition) !== 'undefined' && controlsPosition['top'] != null && controlsPosition['top'] != "default"){
                myTop = controlsPosition['top'];
                myTop = parseInt(myTop);
                if(myTop < 30){
                    myTop = 30;
                }
            }
        }catch(emm){
            console.log("bad controls position");
            console.log(emm);
        }
        //console.log("loaded top: " + myTop);
        //console.log("loaded right: " + myRight);            


        $('#snipcss-panel-container').css('right', myRight + "px");
        $('#snipcss-panel-container').css('top', myTop + "px");

    }, 50);        

}

function snipcssGetOptions(){

    //console.log("loading the options " + SNIPCSS.SITE_NAME);
    chrome.runtime.sendMessage({method: "get_all_options", site: SNIPCSS.SITE_NAME}, function(response){    

    });
}

function startSnipper(isAutomating){
    //console.log("in start snipper");
    var currentSelector = SNIPCSS.CURRENT_ELEMENT;  //$('#snipcss_hidden_input_selector').val();
     if(currentSelector == ""){
         alert("Please use a selector");
         return;
     }
     if($(currentSelector).length <= 0){
         //try to use the one added
         currentSelector = '.' + SNIPCSS.MULTIPLE_CLASSES[0];
         if($(currentSelector).length <= 0){
            alert("Invalid selector?  Maybe element changed upon hover, adding this selector to banned list.  Try selecting it again.");
            //console.log("banning " + SNIPCSS.CURRENT_ELEMENT);
            let selParts = SNIPCSS.CURRENT_ELEMENT.split(' ');
            for(let x = 0; x <= selParts.length; x++){
                let banSelect = selParts[x].replace('.', '');
                banSelect = banSelect.replace('.', '');
                banSelect = banSelect.replace('#', '');
                if(banSelect.length > 1){
                    //console.log("adding banned class/id: " + banSelect);
                    SNIPCSS.BAD_SELECTORS.push(banSelect);
                }
            }
            return;
         }
     }
     if(!isAutomating && SNIPCSS.IS_SNIPPING){
         alert("Snip Kiwi is already snipping.");
         return;
     }
     
     //no jquery
     if(SHADOW_ROOT != null){
        SHADOW_ROOT.querySelector('#snipcss_runsnipper').innerHTML = "STOP+CLOSE";
        SHADOW_ROOT.querySelector('#snipcss_runsnipper').classList.add("kiwi-is-snipping"); 
    }

     SNIPCSS.IS_SNIPPING = true;
     var isMultiple = 0;
     if(SNIPCSS.MULTIPLE_ELEMENTS.length > 1 && SNIPCSS.PICKING_MULTIPLE){
         isMultiple = 1;
     }
     if(!isAutomating){
         startKiwiWalking(); 
     }
     var elemSelector = ""; 
     elemSelector = "." + SNIPCSS.MULTIPLE_CLASSES[0];
     
     //$(elemSelector).addClass('snipcss-globalshadow');
     //$(elemSelector).addClass('snipcss-topzindex');
     //$(elemSelector).parents().addClass('snipcss-topzindex');
     var elem = $(elemSelector).get(0);
     if(SHADOW_ROOT != null){
         stopSelector();
     }
     //give time to redraw UI shadow and start animation
     setTimeout(function(){
        //console.log("redraw ui and start animation?");
        //These should be able to be merged
        var allHtmlImages = "";
        
        var allElementOuterHtml = new Array();
        var allLabelOuterHtml = new Array();
        var allZipOuterHtml = new Array();
        multipleAllElementClassnames = new Array();
        var allJquerySelectors = new Array();
        var isMultiple = false;        
        
        if(SNIPCSS.PICKING_MULTIPLE && SNIPCSS.MULTIPLE_ELEMENTS.length > 1){
            var eselectorsArr = new Array();
            //fucking ugh            
            for(var be = 0; be < SNIPCSS.MULTIPLE_ELEMENTS.length; be++){
                var beSelector = "." + SNIPCSS.MULTIPLE_CLASSES[be];
                eselectorsArr.push(beSelector);
            }
            //console.log("eselector array");
            //console.log(eselectorsArr);
            allHtmlImages = window.snipcssUtils.snipcssGetHtmlImages(eselectorsArr);              
            for(var me = 0; me < SNIPCSS.MULTIPLE_ELEMENTS.length; me++){
                var mSelector = SNIPCSS.MULTIPLE_ELEMENTS[me];
                var eSelector = "." + SNIPCSS.MULTIPLE_CLASSES[me];
                //console.log("getting outer html for " + eSelector);
                allJquerySelectors.push(mSelector);
                allElementOuterHtml.push(window.snipcssUtils.snipcssGetOuterHtml(eSelector));
                allZipOuterHtml.push(window.snipcssUtils.snipcssGetZipOuterHtml(eSelector));
                var aClassnameString = window.snipcssUtils.snipcssLabelAll(eSelector, me);
                multipleAllElementClassnames.push(aClassnameString);     
                allLabelOuterHtml.push(window.snipcssUtils.snipcssGetOuterHtml(eSelector));
            }
            isMultiple = true;
        }else{
            //console.log("not picking multiple");
            //These should be arrays            
            allHtmlImages = window.snipcssUtils.snipcssGetHtmlImages([elemSelector]);            
            allJquerySelectors.push(currentSelector);
            allElementOuterHtml.push(window.snipcssUtils.snipcssGetOuterHtml(elemSelector));
            allZipOuterHtml.push(window.snipcssUtils.snipcssGetZipOuterHtml(elemSelector));
            multipleAllElementClassnames.push(window.snipcssUtils.snipcssLabelAll(elemSelector, 0));
            allLabelOuterHtml.push(window.snipcssUtils.snipcssGetOuterHtml(elemSelector));            
        }
        //
        var googleFonts = window.snipcssUtils.snipcssGetGoogleFontLinks();
        
        if(isAutomating){
            SNIPCSS.RESOLUTIONS = ['default', 'iphonexs', 'ipadvertical'];
        }
        
        //for error reporting 
        SNIPCSS.JQUERY_SELECTORS = allJquerySelectors;
        //console.log("google fonts");
        //console.log(googleFonts);

        //console.log("all html images: ");
        //console.log(allHtmlImages);
        //console.log("outerHtml: ");
        //console.log(elementOuterHtml);
        //console.log("all element classnames:")
        //console.log(allElementClassnames); 
        
        //restrict people who make their screens small?  well I want them to buy
        var clientWidth = window.innerWidth || document.documentElement.clientWidth;
        let elementWidth = $(elem).width();
        let elementHeight = $(elem).height();
        let elementDim = elementWidth.toString().replace('px', '') + "," + elementHeight.toString().replace('px', '');
        
        /*
        console.log("sending");
        console.log({
            method: "doSnipper", 
            url: window.location.href,
            all_html_images: allHtmlImages,
            all_element_outer_html: allElementOuterHtml,
            all_zip_outer_html: allZipOuterHtml,
            multiple_all_element_classnames: multipleAllElementClassnames,
            all_jquery_selector: allJquerySelectors,
            all_element_selector: SNIPCSS.MULTIPLE_CLASSES,
            google_fonts: googleFonts,
            resolutions: SNIPCSS.RESOLUTIONS,
            is_multiple : isMultiple,
            client_width: clientWidth
        });
        */
        //console.log("all element selectors");
        //console.log(SNIPCSS.MULTIPLE_CLASSES);

        chrome.runtime.sendMessage({
            method: "doSnipper", 
            url: window.location.href,
            all_html_images: allHtmlImages,
            all_element_outer_html: allElementOuterHtml,
            all_label_outer_html: allLabelOuterHtml,
            all_zip_outer_html: allZipOuterHtml,
            multiple_all_element_classnames: multipleAllElementClassnames,
            all_jquery_selector: allJquerySelectors,
            all_element_selector: SNIPCSS.MULTIPLE_CLASSES,
            /*
            element_outer_html : elementOuterHtml,
            zip_outer_html: elementZipOuterHtml,
            all_element_classnames: allElementClassnames,
            jquery_selector: currentSelector,
            element_selector: elemSelector,             
             */
            google_fonts: googleFonts,
            resolutions: SNIPCSS.RESOLUTIONS,
            is_multiple : isMultiple,
            client_width: clientWidth,
            element_dim: elementDim
        }); 
        
        
        //TELL THE PRODUCTIVITY OWL TO STOP COUNTING DOWN BECAUSE KIWI BE SNIPPING 
        var owlExtensionId = "glpfkddkionlopppkjednkffhjdkdomh";

        // Make a simple request:
        chrome.runtime.sendMessage(owlExtensionId, {owl_command: "stop_countdown"},
          function(response) {

          }
        );        
        


     }, 50);

    
}

function afterSnipCSSUILoads(shadowRoot){
    snipcssGetOptions();
    snipcssButtonPageHandlers(shadowRoot);
    snipcssModalHandlers(shadowRoot);
    SNIPCSS_SELECTING_ELEMENTS = true;
    //console.log("snip runner length: " + shadowRoot.querySelector('#snipcss_runsnipper').length);
    
    
    shadowRoot.getElementById('snipcss_runsnipper').addEventListener('mousedown', function(e) {
        //alert("this pauses it and leaves it open");
        if(!SNIPCSS.IS_SNIPPING){
            startSnipper();
        }else{
            chrome.runtime.sendMessage({method: "stop_snipper", location: window.location.href}, 
            function(response) 
            {	
                
            });            
            closeSnipcss();
        }
        e.preventDefault();
        e.stopPropagation();
        return false;        
    }, true);
    shadowRoot.getElementById('snipcss_runsnipper').addEventListener('mouseup', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;        
    }, true);    
    shadowRoot.getElementById('snipcss_runsnipper').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;        
    }, true);    
    shadowRoot.getElementById('snipcss_runsnipper').addEventListener('focus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;        
    }, true);    
    shadowRoot.getElementById('snipcss_runsnipper').addEventListener('blur', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;        
    }, true);    


    
    
    //$('#snipcss_runsnipper').on('click', function(){
    //});
            /*
    shadowRoot.getElementById('multipleresolution_label').addEventListener('mouseover', function(e){
        var parentDiv = this.closest('div');
        console.log("mousein parentDiv ");
        console.log(parentDiv);        
        parentDiv.classList.add("snipcss-hovering");        
    }, true);
    shadowRoot.getElementById('multipleresolution_label').addEventListener('mouseout', function(e){
        var parentDiv = this.closest('div');
        console.log("mouseout parentDiv " + parentDiv);        
        parentDiv.classList.remove("snipcss-hovering");        
    }, true);
    */
    shadowRoot.getElementById('checkbox_multipleelements').addEventListener('change', function() {
        if(!OPTIONS.PRO_USER){
            if (this.checked) {            
                this.checked = false;
            }            
            alert("To use multiple element mode you need to be a SnipCSS Pro Member");            
            return;
        }
        else{
            if (this.checked) {            
                SNIPCSS.PICKING_MULTIPLE = true;
            }else{
                SNIPCSS.PICKING_MULTIPLE = false;
            }            
        }
    });
    

   
    shadowRoot.getElementById('snipcss_stopstartselection').addEventListener('mousedown', function(e) {  
        if(e.button == 2){
            return;
        }
        window.snipcssUtils.snipcssGetHtmlImages(SNIPCSS.MULTIPLE_CLASSES);
        
        
        if(SNIPCSS_SELECTING_ELEMENTS){
            stopSelector();                           
        }else{             
            startSelector();
        }  
        e.preventDefault();
        return false;        
    }, true);   
    
    shadowRoot.getElementById('snipcss-switch-resolution').addEventListener('mousedown', function(e) {  
        
        //if currentselection
        if(SelectElemListeners.isPicking){
            SNIPCSS.PREMODAL_SELECTION = true;
        }
            
        
        if(e.button == 2){
            return;
        }
        //alert("there was a change");
        var defaultCheckbox = "";
        var largedesktopCheckbox = "";
        var iphonexsCheckbox = "";
        var ipadverticalCheckbox = "";
        var ipadlandscapeCheckbox = "";        
        var pixelCheckbox = "";
        
        //console.log("resolutions");
        //console.log(SNIPCSS.RESOLUTIONS);
        for(var x = 0; x < SNIPCSS.RESOLUTIONS.length; x++){
            var snipResolution = SNIPCSS.RESOLUTIONS[x];
            if(snipResolution == 'default'){
                defaultCheckbox = 'checked="checked"';
            }
            if(snipResolution == 'largedesktop'){
                largedesktopCheckbox = 'checked="checked"';
            }
            if(snipResolution == 'iphonexs'){
                iphonexsCheckbox = 'checked="checked"';
            }
            if(snipResolution == 'ipadvertical'){
                ipadverticalCheckbox = 'checked="checked"';
            }
            if(snipResolution == 'ipadlandscape'){
                ipadlandscapeCheckbox = 'checked="checked"';
            }            
            if(snipResolution == 'pixel'){
                pixelCheckbox = 'checked="checked"';
            }            
        }
        
        loadMustacheTemplate('templates/modal_select_resolution.html', 'body',
        {    default_checkbox : defaultCheckbox, 
             largedesktop_checkbox : largedesktopCheckbox,
             iphonexs_checkbox : iphonexsCheckbox,
             ipadvertical_checkbox: ipadverticalCheckbox,
             ipadlandscape_checkbox: ipadlandscapeCheckbox,         
             pixel_checkbox: pixelCheckbox        
        },
        function(theHtml){
            $('#modal-pick-resolution').html(theHtml);       
            stopSelector();             
            setTimeout(function(){
                SNIPCSS.MODAL_OPEN = true;
                MicroModal.show('modal-pick-resolution');                
            }, 30);
        });
        //console.log("cancel check");         
        e.preventDefault();
        return false;        
        
        
    }, true);  
    
    shadowRoot.getElementById('snipcss_selectorbox').addEventListener('mousedown', function(e) {

        console.log("=== SEGMENTATION DEBUG STARTED ===");

        collectElements(50).then(elementsArray => {
            console.log("Initial elements collected:", elementsArray.length);

            let processedInitialElements = SEGM.processElements(elementsArray);
            console.log("After processElements:", processedInitialElements.length);

            let processedElements = SEGM.filterElements(processedInitialElements);
            console.log("After filterElements:", processedElements.length);

            // Score segments based on size, element count, and density
            function scoreSegment(element) {
                const bounds = element.getBoundingClientRect();
                const area = bounds.width * bounds.height;
                const elementCount = element.getElementsByTagName('*').length;

                // Element density (elements per 10,000 pixels)
                const density = area > 0 ? (elementCount / area) * 10000 : 0;

                // Combined score
                const score = (area * 0.3) +         // 30% weight to pixel size
                              (elementCount * 100) + // Weight to element count
                              (density * 500);       // Weight to content density

                return score;
            }

            // Score, sort, and select top segments
            let scoredElements = processedElements.map(elem => ({
                element: elem,
                score: scoreSegment(elem),
                bounds: elem.getBoundingClientRect(),
                elementCount: elem.getElementsByTagName('*').length
            }));

            // Sort by score (highest first)
            scoredElements.sort((a, b) => b.score - a.score);

            console.log("=== SEGMENT SCORES ===");
            scoredElements.forEach((item, idx) => {
                const area = item.bounds.width * item.bounds.height;
                const density = area > 0 ? (item.elementCount / area) * 10000 : 0;
                console.log(`Segment ${idx + 1}: Score=${Math.round(item.score)}, Area=${Math.round(area)}px², Elements=${item.elementCount}, Density=${density.toFixed(2)}`);
            });

            // Take top 10 highest scoring segments
            let maxElements = 10;
            console.log(`Selecting top ${maxElements} segments by score`);
            if(scoredElements.length > maxElements){
                scoredElements = scoredElements.slice(0, maxElements);
            }

            // Extract just the elements
            processedElements = scoredElements.map(item => item.element);

            console.log("=== FINAL SEGMENTED ELEMENTS ===");
            console.log("Total elements:", processedElements.length);

            let allElementData = [];
            for(let m = 0; m < processedElements.length; m++){
                let elem = processedElements[m];
                let bounds = elem.getBoundingClientRect();
                let uniqueSelector = SEGM.getUniqueSelector(elem, []);
                let elemCount = elem.getElementsByTagName('*').length;

                console.log(`Element ${m + 1}:`, {
                    selector: uniqueSelector,
                    tagName: elem.tagName,
                    elementCount: elemCount,
                    bounds: {
                        top: bounds.top,
                        left: bounds.left,
                        width: bounds.width,
                        height: bounds.height
                    }
                });

                allElementData.push({
                    selector: uniqueSelector,
                    bounds: bounds,
                    element: elem
                });
            }

            // Visualize the segmented elements with colored boxes
            console.log("Highlighting elements on page...");
            SEGM.highlightElements(processedElements);

            console.log("=== SEGMENTATION DEBUG COMPLETE ===");
        });

        /* COMMENTED OUT - Previous test code
        console.log("testing getting outer html");
        let selector = "#root main section.mt-10";
        var newElementOuterHtml = window.snipcssUtils.snipcssGetOuterHtml(selector);
        console.log("old");
        console.log(JSON.parse(newElementOuterHtml));
        console.log("now editing");


        chrome.runtime.sendMessage({method: "test_cheerio_html_edit", outer_html: newElementOuterHtml},
        function(response)
        {
            console.log("response");
            //console.log(response);
            console.log(response.data);
        });


        //test taking a screenshot (used for automation)

        var decadesClass = '.hp-ttd-video-block';
        //takeScreenshotOfElement(decadesClass, "testsaveimg");
        SNIPCSS.CURRENT_ELEMENT = decadesClass;
        //mark as snip element
        $(decadesClass).addClass(SNIPCSS.MULTIPLE_CLASSES[0]);
        hasElement = 1;

        var paddingTop = 20;
        var offsetTop = $(SNIPCSS.CURRENT_ELEMENT).offset().top;
        var topPos = offsetTop - paddingTop;

        console.log("offset top: " + offsetTop);
        console.log("scrolling to : " + topPos);

        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;

        var maxHeight = windowHeight - paddingTop;

        var elementWidth = $(SNIPCSS.CURRENT_ELEMENT).width();
        var elementHeight = $(SNIPCSS.CURRENT_ELEMENT).height();
        var elementLeftOffset = $(SNIPCSS.CURRENT_ELEMENT).offset().left;

        console.log("elementWidth: " + elementWidth);
        console.log("elementHeight: " + elementHeight);
        console.log("elementLeftOffset: " + elementLeftOffset);

        //highlight
        window.scrollTo(0, offsetTop);

        chrome.runtime.sendMessage({method: "screenshot_finish",
            location: window.location.href,
            element_width: elementWidth, element_height: elementHeight, element_left_offset: elementLeftOffset,
            window_width: windowWidth, window_height: windowHeight, max_height: maxHeight, padding_top: paddingTop},
        function(response)
        {

        });

        // Usage example

        //var parentSelectors = window.snipcssUtils.snipcssGetParentLabels('.snipcss0-3-3-4');
        //alert("Parent Selectors: " + parentSelectors);

        //jquery test
        var testHtml = '<div class="sniptest"><div class="firstcontainer"><h3 class="myh3">MyH3</h3><a href="/blah">Whatever</a></div><div class="morediv"><a class="extra" href="/">Extra</a></div></div>';
        console.log("test html");
        console.log(testHtml);
        testHtml = $(testHtml).find('a').addClass('awesome').parents('.sniptest').get(0).outerHTML;
        console.log("after html");
        console.log(testHtml);


        //damn it... i pushed this test thing live
            chrome.runtime.sendMessage({method: "test_reload_mobile", location: window.location.href},
            function(response)
            {

            });
        */
    }, true);
    
    shadowRoot.getElementById('snipcss-change-selection').addEventListener('mousedown', function(e) {  
        if(SNIPCSS.CURRENT_ELEMENT == ""){
             alert("You need to pick click an element first, then you can adjust the selection.");
             return;                       
        }
        
        var theMessage = "";
        
        var totalChildren = $(SNIPCSS.CURRENT_ELEMENT).children().length;            
        var childrenText = "This element has " + totalChildren + " children. You can limit the selection by entering the children indices separated by commas. 1,2,3 would keep the container with only the 1st, 2nd, 3rd elements inside included.";        
        var childrenValue = "1,2,3";
        var hideChildrenSelector = false;
        
        if(totalChildren == 0){
            hideChildrenSelector = true;
            childrenText = "There are no children, you cannot limit the selection to certain children."
        }
        if(totalChildren == 1){
            hideChildrenSelector = true;
            childrenText = "This element only has one child, you cannot limit the selection to specific children.";
        }
        if(totalChildren == 2){
            childrenValue = '1,2';            
        }        
        loadMustacheTemplate('templates/modal_change_selection.html', 'body',
        {    children_text : childrenText,
             children_value: childrenValue
        },
        function(theHtml){
            $('#modal-pick-resolution').html(theHtml);
            stopSelector();
            setTimeout(function(){
                if(hideChildrenSelector){
                    $('#snipcss_children_change_selection').remove();
                }
                SNIPCSS.MODAL_OPEN = true;
                MicroModal.show('modal-pick-resolution');                
            }, 30);
        });         

        
    }, true);
    
    if(OPTIONS.PRO_USER){
        //shadowRoot.querySelectorAll(".proversion").forEach(e => e.remove());
    }
  
    
}

function startKiwiWalking(){
     var elemSelectors = new Array();
     //should be already marked       
     
     var elemSelector = ""; 
     if(SNIPCSS.IS_REPICKING){
         elemSelector = "." + SNIPCSS.MULTIPLE_CLASSES[SNIPCSS.REPICK_INDEX];
     }else{
         elemSelector = "." + SNIPCSS.MULTIPLE_CLASSES[0];
     }
     
     //$(elemSelector).addClass('snipcss-globalshadow');
     //$(elemSelector).addClass('snipcss-topzindex');
     //$(elemSelector).parents().addClass('snipcss-topzindex');                             
     $('#snipcss_snipit_button').remove();
     $('#snipcss_exclude_button').remove();
     $('#snipcss_include_button').remove();
     $('#snipcss_subselection_button').remove();
     $('#snipcss_subselection_dropdown').remove();     
     $('#snipcss_display_selector').remove();     
     $('#snipcss_goup_button').remove();          
     
     var elem = $(elemSelector).get(0);
     if(typeof(elem) === 'undefined'){
         $(SNIPCSS.CURRENT_ELEMENT).addClass(SNIPCSS.MULTIPLE_CLASSES[0]);
         alert("WARNING: SnipCSS Kiwi could not label elements, website is blocking us.  This may not work.");
     }          
     var elem = $(SNIPCSS.CURRENT_ELEMENT).get(0);
     //console.log("element is ");
     //console.log(elem);
     
     
     var theLen = elem.getElementsByTagName('*').length;
     if(SNIPCSS.PICKING_MULTIPLE && SNIPCSS.MULTIPLE_ELEMENTS.length > 1){
         for(let f = 1; f < SNIPCSS.MULTIPLE_ELEMENTS.length; f++){
             let multSelector = SNIPCSS.MULTIPLE_ELEMENTS[f];
             console.log("multselector " + multSelector);
             let multElem = null;
             if($(multSelector).length > 0){
                 multElem = $(multSelector).get(0);
                 theLen += multElem.getElementsByTagName('*').length;
             }
         }
     }
     var walkingTime = 2000;
     if(theLen > 200){
         walkingTime = 3000;
     }
     if(theLen > 500){
         walkingTime = 4000;
     }
    //console.log("total nodes " + theLen);
     
    var $can = $('<canvas width="70" height="70" id="snipcss-kiwi"></canvas>');
    $('body').append($can);
    setTimeout(function(){
        
        var firstRes = SNIPCSS.RESOLUTIONS[0];
        SNIPCSS.PROCESSING_NODE_DEVICE = firstRes;
        SNIPCSS.PROCESSING_NODE_TOTAL = theLen;
        SNIPCSS.PROCESSING_NODE_CURR = 0;
        
        var canvas = document.getElementById('snipcss-kiwi');
        /*
        var animationImages = {
            downleft: {url: 'http://localhost/snipcss/extension/img/animation/kiwi_downleft_small.png'},
            left: {url: 'http://localhost/snipcss/extension/img/animation/kiwi_left_small.png' },
            down: {url: 'http://localhost/snipcss/extension/img/animation/kiwi_down_small.png' },
            peckleft: {url: 'http://localhost/snipcss/extension/img/animation/kiwi_peckleft_small.png' },
            squirm: {url: 'http://localhost/snipcss/extension/img/animation/kiwi_squirm_small.png'}                        
        };
        */
        var animationImages = {
            downleft: {url: 'img/animation/kiwi_downleft_small.png'},
            left: {url: 'img/animation/kiwi_left_small.png' },
            down: {url: 'img/animation/kiwi_down_small.png' },
            peckleft: {url: 'img/animation/kiwi_peckleft_small.png' },
            dead: {url: 'img/animation/kiwi_dead_small2.png'},
            squirm: {url: 'img/animation/kiwi_squirm_small.png'}                        
        };

        var width = window.innerWidth || document.documentElement.clientWidth;
        $('#snipcss-kiwi').css('left', (width - 100).toString() + "px");
        $('#snipcss-kiwi').css('top', window.scrollY + "px");
        var rect = elem.getBoundingClientRect();

        var leftTarget = rect.left + (rect.width / 2) + window.scrollX;
        var topTarget = rect.top + window.scrollY;

        //console.log("left-target: " + leftTarget + " top target " + topTarget);

        SNIPCSS_KIWI_WALKER = new SNIPCSS.KiwiWalker().init(canvas, animationImages, leftTarget, topTarget, 10);
        if(SHADOW_ROOT != null){
            SHADOW_ROOT.getElementById('snipcss_processing_text').innerHTML = "Resolution " + SNIPCSS.PROCESSING_NODE_DEVICE + ": " + SNIPCSS.PROCESSING_NODE_CURR + "/" + SNIPCSS.PROCESSING_NODE_TOTAL + " processed";
        }
    }, 10);        
    removeClassesNamedTether(elem);
}

/********************************************************
-------------------------------------------------------------------------------
----------- TEMPLATES 
-------------------------------------------------------------------------------
*********************************************************/

function loadMustacheTemplate(htmlFile, insertTag, tData, callbackFunc, attachToDom)
{
	var req = new XMLHttpRequest();
	req.open("GET", chrome.runtime.getURL(htmlFile), true);
	req.onreadystatechange = function() 
	{
		if (req.readyState == 4 && req.status == 200) 
		{
			//var image = chrome.runtime.getURL('img/advice_owl_small.png');
			//console.log('Rendering Mustache.js template...');
			var tb = Mustache.to_html(req.responseText, tData);
                        if(attachToDom){
                            $(insertTag).prepend(tb);
                        }
			callbackFunc(tb);
		}
	};
	req.send(null);		

}

function stopSelector(){
    SNIPCSS_SELECTING_ELEMENTS = false;  
    snipcssDetachPageHandlers();    
    if(SHADOW_ROOT != null){
        SHADOW_ROOT.getElementById('snipcss_stopstartselection').innerHTML = "Start Selector";
    }
    unhighlightEverything();                
}

function startSelector(){
    snipcssButtonPageHandlers(SHADOW_ROOT); 
    SNIPCSS_SELECTING_ELEMENTS = true;                        
    SHADOW_ROOT.getElementById('snipcss_stopstartselection').innerHTML = "Pause Selector";    
}

function snipcssLoadAScript(scriptLocation)
{
    var s = document.createElement('script');
    // TODO: add "script.js" to web_accessible_resources in manifest.json
    s.src = chrome.runtime.getURL(scriptLocation);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);	
}



window.onerror = function (msg, source, lineNo, columnNo, error) {
    
    if(source && source != null){
        if(source.indexOf('apjmkabfdhhkdgilinjfieakdkbblgpm') !== -1 || 
                source.indexOf('hbdnoadcmapfbngbodpppofgagiclicf') !== -1){
            //console.log("inside chrome extension script");
        }
    }    
    var allSelectors = SNIPCSS.JQUERY_SELECTORS.join('|');
    var siteUrl = window.location.href;
    //console.log("src");
    //console.log(source);
    //console.log("error message");
    //console.log(msg);
    //console.log("error data");
    
    var allError = msg;
    try{
        allError += " - " + error.stack;        
    }catch(att){
        console.log("bad error data");
    }
    var allOptions = "";
    /*
    alert("Error: " + msg + 
          "\nScript: " + source + 
          "\nLine: " + lineNo.toString() + 
          "\nColumn: " + columnNo.toString() + 
          "\nStackTrace: " + error);    
    */
   
    if(OPTIONS.MAX_ERRORS > 0){
        OPTIONS.MAX_ERRORS--;
        chrome.runtime.sendMessage({method: "record_script_error", site_url: siteUrl, source: "contentscript-" + source,
        line_num: lineNo.toString(), error_message: allError, all_selectors: allSelectors, all_options: allOptions}, function(response){
            //console.log("got response");
            //console.log(response);
        });      
        
    }

    return true;
};


SHADOW_CSS = `


#snipcss-shadow{    
    width:100%;
    height: 100%;
}

.snipcss-resetthis{
    animation : none;
    animation-delay : 0;
    animation-direction : normal;
    animation-duration : 0;
    animation-fill-mode : none;
    animation-iteration-count : 1;
    animation-name : none;
    animation-play-state : running;
    animation-timing-function : ease;
    backface-visibility : visible;
    background : 0;
    background-attachment : scroll;
    background-clip : border-box;
    background-color : transparent;
    background-image : none;
    background-origin : padding-box;
    background-position : 0 0;
    background-position-x : 0;
    background-position-y : 0;
    background-repeat : repeat;
    background-size : auto auto;
    border : 0;
    border-style : none;
    border-width : medium;
    border-color : inherit;
    border-bottom : 0;
    border-bottom-color : inherit;
    border-bottom-left-radius : 0;
    border-bottom-right-radius : 0;
    border-bottom-style : none;
    border-bottom-width : medium;
    border-collapse : separate;
    border-image : none;
    border-left : 0;
    border-left-color : inherit;
    border-left-style : none;
    border-left-width : medium;
    border-radius : 0;
    border-right : 0;
    border-right-color : inherit;
    border-right-style : none;
    border-right-width : medium;
    border-spacing : 0;
    border-top : 0;
    border-top-color : inherit;
    border-top-left-radius : 0;
    border-top-right-radius : 0;
    border-top-style : none;
    border-top-width : medium;
    bottom : auto;
    box-shadow : none;
    box-sizing : content-box;
    caption-side : top;
    clear : none;
    clip : auto;
    color : inherit;
    columns : auto;
    column-count : auto;
    column-fill : balance;
    column-gap : normal;
    column-rule : medium none currentColor;
    column-rule-color : currentColor;
    column-rule-style : none;
    column-rule-width : none;
    column-span : 1;
    column-width : auto;
    content : normal;
    counter-increment : none;
    counter-reset : none;
    cursor : auto;
    direction : ltr;
    display : inline;
    empty-cells : show;
    float : none;
    font : normal;
    font-family : inherit;
    font-size : medium;
    font-style : normal;
    font-variant : normal;
    font-weight : normal;
    height : auto;
    hyphens : none;
    left : auto;
    letter-spacing : normal;
    line-height : normal;
    list-style : none;
    list-style-image : none;
    list-style-position : outside;
    list-style-type : disc;
    margin : 0;
    margin-bottom : 0;
    margin-left : 0;
    margin-right : 0;
    margin-top : 0;
    max-height : none;
    max-width : none;
    min-height : 0;
    min-width : 0;
    opacity : 1;
    orphans : 0;
    outline : 0;
    outline-color : invert;
    outline-style : none;
    outline-width : medium;
    overflow : visible;
    overflow-x : visible;
    overflow-y : visible;
    padding : 0;
    padding-bottom : 0;
    padding-left : 0;
    padding-right : 0;
    padding-top : 0;
    page-break-after : auto;
    page-break-before : auto;
    page-break-inside : auto;
    perspective : none;
    perspective-origin : 50% 50%;
    right : auto;
    tab-size : 8;
    table-layout : auto;
    text-align : inherit;
    text-align-last : auto;
    text-decoration : none;
    text-decoration-color : inherit;
    text-decoration-line : none;
    text-decoration-style : solid;
    text-indent : 0;
    text-shadow : none;
    text-transform : none;
    top : auto;
    transform : none;
    transform-style : flat;
    transition : none;
    transition-delay : 0s;
    transition-duration : 0s;
    transition-property : none;
    transition-timing-function : ease;
    unicode-bidi : normal;
    vertical-align : baseline;
    visibility : visible;
    white-space : normal;
    widows : 0;
    width : auto;
    word-spacing : normal;
    z-index : auto;
    all: initial;
    all: unset;
}

.edge_builder2
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#990000;
}

.edge_builder3
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#9b3af2 !important;
}
/* Dark Purple Exclude */
.edge_builder4
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#6111a9 !important;
}
/* Light Blue Include */
.edge_builder5
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#76bfff !important;
}
/* Dark Blue Include */
.edge_builder6
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#355de5 !important;
}

.edge_builder7
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#0061ff !important;
}

.edge_builder8
{
    position:absolute !important;
    z-index:2147483646 !important;
    background-color:#6111a9 !important;
}

.snipcss-brand {
    font-weight: 500 !important;
    font-size: 1.15rem !important;
    color: #f8f9fa !important;
    display: block !important;
    padding-top: 1.15rem !important;
    padding-right: 1.25rem !important;
    padding-bottom: 1.15rem !important;
    padding-left: 1.25rem !important;
}
.snipcss-header{
    vertical-align: top !important;
    padding-left: 3px !important;
    font-size: 22px !important;
    font-weight: bold !important;
}

.snipcss-content {  
    width: 100% !important;
    background: #38416E !important;
    background-image: linear-gradient(to bottom, #38416E, #63688a) !important;    
}

.snipcss-small-direction-text{
    font-size:0.9em !important;
    font-size:9px !important;
    line-height:10px !important;
}

.snipcss_element_selected_box{
    border: 1px solid black !important;
    background: gray;
    font-size: 1.2em !important;
    font-size: 12px !important;
    line-height: 12px !important;
    padding-left: 4px !important;
    padding-right: 4px !important;
    padding-top: 2px !important;
    padding-bottom: 2px !important; 
}

.snipoptions-checkbox-label{
    color: white !important;
    cursor: default;
    display: inline;
    font-family: Poppins, Arial, sans-serif;
    font-size: 13px;
    font-weight: 400;
    height auto;
    line-height: 19px;
    text-align: left;
}

.snipcss-selection-description{
    color: white !important;
    cursor: default;
    display: inline;
    font-family: Poppins, Arial, sans-serif;
    font-size: 13px;
    font-weight: 400;
    height auto;
    line-height: 19px;
    text-align: left;
}

.snipcss_directions {
    font-size:10px !important;
    line-height:10px !important;    
}

.snipcss-btn { 
    display: inline-block !important;
    font-weight: 400 !important;    
    text-align: center !important;
    white-space: nowrap; 
    vertical-align: middle; 
    user-select: none; 
    border: 1px solid transparent; 
    padding: 0px !important; 
    font-size: 14px !important;    
    font-size: 1rem !important;
    line-height: 1.5 !important;
    border-radius: .25rem !important;
    transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; 
    border-top-left-radius: 0.25rem; 
    border-top-right-radius: 0.25rem; 
    border-bottom-right-radius: 0.25rem; 
    border-bottom-left-radius: 0.25rem; 
    transition-duration: 0.15s, 0.15s, 0.15s, 0.15s; 
    transition-timing-function: ease-in-out, ease-in-out, ease-in-out, ease-in-out; 
    transition-delay: 0s, 0s, 0s, 0s; 
    transition-property: color, background-color, border-color, box-shadow;
    text-decoration:none !important;
} 

.snipcss-btn-info { 
    background: #ff3f7c !important;
    color: #fff !important;
    border-color: black !important;    
    border-top-color: black !important;    
    border-right-color: black !important;    
    border-bottom-color: black !important;    
    border-left-color: black !important;    
} 

.snipcss-btn-sm { 
    font-size: .64rem !important;    
}

.snipcss-waves-effect { 
    position: relative; 
    cursor: pointer; 
    overflow: hidden; 
    -webkit-user-select: none; 
    -moz-user-select: none; 
    -ms-user-select: none; 
    user-select: none; 
    -webkit-tap-highlight-color: transparent; 
    overflow-x: hidden; 
    overflow-y: hidden;
} 

#snipcss_selectortextbox{
    font-size: 10px !important;
    border: 0px !important;
    width: 100% !important;
    background: gray;
    padding: 0px !important;
    margin: 0px !important;
}

#snipcss-control-container {
    padding-left:7px;
    padding-right: 3px
    padding-top: 10px;
}


#snipcss-switch-resolution{
    background: white !important;
    color: #333333 !important;
    font-weight: 600 !important;
    width: calc(100% - 40px);
    padding: 3px 2px !important;
    margin-top: 20px;
    margin-bottom: 20px;
    margin-left: 20px !important;
    font-size: 12px !important;
    font-family: 'Poppins', Arial, Verdana;
}

#snipcontrol-resolution-wrap{
    margin-top: 10px;
    margin-bottom: 5px;
}

#snipcontrol-multipleelements-wrap{
    margin-top:10px;
}

#snipcss-change-selection{
    cursor: pointer !important;
}

.proversion{

}

.snipcss-btn-dark {
    background-color: #212121 !important;
    color: #fff !important;
    font-size: 13px !important;
    width: 100%;
    padding-top: 2px !important;
    padding-bottom: 2px !important;    
}

a.snipcss-waves-effect, a.snipcss-waves-light { 
    display: inline-block;
} 

.snipcss-btn:focus, .snipcss-btn:hover { 
    text-decoration: none; 
    text-decoration-line: none; 
    text-decoration-style: initial; 
    text-decoration-color: initial;
} 

.snipcss-btn-info:hover { 
    color: #fff; 
    background-color: #138496; 
    border-color: #117a8b; 
    border-top-color: rgb(17, 122, 139); 
    border-right-color: rgb(17, 122, 139); 
    border-bottom-color: rgb(17, 122, 139); 
    border-left-color: rgb(17, 122, 139);
} 

.snipcss-btn:active, .snipcss-btn:focus, .snipcss-btn:hover { 
    -webkit-box-shadow: 0 5px 11px 0 rgba(0,0,0,.18),0 4px 15px 0 rgba(0,0,0,.15); 
    box-shadow: 0 5px 11px 0 rgba(0,0,0,.18),0 4px 15px 0 rgba(0,0,0,.15); 
    outline: 0; 
    outline-color: initial; 
    outline-style: initial; 
    outline-width: 0px;
} 
.snipcss-btn-info:hover { 
    background-color: #4abde8;
} 

.snipcss-btn:not(:disabled):not(.disabled) { 
    cursor: pointer;
}

#snipcss_stopstartselection{
    border-radius: 0px !important;
}

#snipcss_runsnipper {
    width: calc(100% - 30px);
    margin-bottom: 10px;
    height: 40px;
    font-size: 20px !important;
    font-family: Poppins, Arial, sans-serif;
    padding-top: 10px !important;
    margin-left: 15px;
}

.kiwi-is-snipping{
    background: #f44336 !important;
}



.badge-primary {
    color: #fff !important;
    background-color: #fc4239 !important;
    padding: 4px 5px !important;
}

.badge-buttony{
    color: #333 !important;
    background-color: #ffffff !important;
    padding: 4px 5px !important;
}

.badge {
    font-family: 'Poppins',Arial,Verdana;
    background: #fafafa;    
    display: inline-block;
    padding-top: 5px;
    padding-bottom: 10px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 5px;
    transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

#snipcss_processing_text{
    color:#f1f1f1 !important;
    margin: 15px !important;
    display: inline-block !important;
    font-size: 10px !important;
    line-height: 11px !important;
}

/**************************\
  Basic Modal Styles
\**************************/


#snipcss-element-selected-container{    
    margin-left:15px;
    margin-right: 15px;
}

`;