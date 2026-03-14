/* 
 * COPYRIGHT PRODUCTIVE MARK LLC - 2019
*/
self.SNIPCSS = self.SNIPCSS || {};
self.OPTIONS = self.OPTIONS || {};

var tabsAttached = new Array();
var snippedArr = new Array();
//dont want to duplicate an image name /images/
var allImageNames = new Array();
var cssImages = new Array();       
var fontFiles = new Array();     
var snipFontUrls = new Array();
var allNewFontFaces = new Array();
var htmlImages = new Array();    
var htmlImagesArr = new Array();
var selectorFixArr = {};  
var selectorPartialFixArr = {};
var selectorContainedArr = {};
var selectorInheritedClassesArr = new Array();
var stylesheetArr = new Array();
var customfontsArr = new Array();
var cssvarUsedArr = new Array();
var cssvarDefinedArr = {};
var cssvarAllArr = new Array();
var svgFilterReferences = new Array();
var cssvarResolvedValues = {};

//transmorgify arr
var tmClassArr = new Array();
var tmIdArr = new Array();

//import fonts are for stuff in stylesheet @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900|Poppins:300,400,500,700,900|Lato:300,400,500,700,900')
//css fonts or google fonts like https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900|Poppins:300,400,500,700,900|Lato:300,400,500,700,900
var importfontsArr = new Array();
var cssfontsArr = new Array();
//right now just do google, maybe add more libraries?
var usedFontArr = new Array();
var usedFontObjectArr = new Array();
var customfontsFiles = new Array();
var animationKeyframesArr = new Array();
var elemSelector = "";
var elementOuterHtml = "";
var elementZipHtml = "";
var allElementOuterHtml;
var allLabelOuterHtml;
var allZipOuterHtml;
var allClassNamesArr = new Array();
var snipName = "";
//var myCssSelector = "";
var allCssSelectors = new Array();
var SITE_URL = "";
var SNIP_DOC = null;
var SNIP_PATH_TO_IMAGES = "./images";
var SNIP_TAB_ID = "";  //can these two
var SNIPPING_TAB_ID = ""; //be different?  not sure
var SNIPPING_TAB = ""; 
var SNIP_TAB_URL = "";
var DEVICE_PROPS = new Array();
var USER_AGENTS = new Array();
var USER_PLATFORMS = new Array();
var INHERITED_RULES = ['azimuth',
'border-collapse', 'border-spacing', 'caption-side', 'color', 'cursor', 'direction', 'elevation', 'empty-cells', 'font-family',
'font-size', 'font-style', 'font-variant', 'font-weight', 'font', 'letter-spacing', 'line-height', 'list-style-image',
'list-style-position', 'list-style-type', 'list-style', 'orphans', 'pitch-range', 'pitch quotes', 'richness', 'speak-header',
'speak-numeral', 'speak-punctuation', 'speak', 'speech-rate', 'stress', 'text-align', 'text-indent', 'text-transform', 'visibility',
'voice-family', 'volume', 'white-space', 'widows', 'word-spacing', 'background-image', 'background', 'background-color'];

// ============================================================
// Icon Font CSS Rule Detection (for Tailwind output)
// ============================================================

// Regex patterns to detect icon font CSS selectors
const ICON_SELECTOR_PATTERNS = [
  /\.fa[srldb]?(?:\s|,|:|{|\[|$)/,  // .fa, .fas, .far, .fal, .fad, .fab
  /\.fa-/,                           // .fa-chevron-right, etc.
  /\.ti(?:\s|,|:|{|\[|$)/,          // .ti (Tabler)
  /\.ti-/,                           // .ti-icon-name
  /\.bi(?:\s|,|:|{|\[|$)/,          // .bi (Bootstrap Icons)
  /\.bi-/,                           // .bi-icon-name
  /\.material-icons/,                // Material Icons
  /\.glyphicon/,                     // Glyphicons
  /\.icon-/,                         // Generic icon prefix
  /\.icofont-/,                      // IcoFont
  /\.ri-/,                           // Remix Icons
  /\.bx-?/,                          // BoxIcons
  /\.la-?/,                          // Line Awesome
];

// Known icon font-family names for CSS body detection
const ICON_FONT_FAMILY_NAMES = [
  'font awesome', 'fontawesome', 'tabler', 'bootstrap-icons',
  'material icons', 'glyphicons', 'icomoon', 'icofont',
  'remixicon', 'boxicons', 'line awesome'
];

// Check if a CSS selector is for icon fonts
function isIconFontSelector(selector) {
  if (!selector) return false;
  return ICON_SELECTOR_PATTERNS.some(pattern => pattern.test(selector));
}

// Check if CSS body contains icon font-family
function hasIconFontFamily(body) {
  if (!body) return false;
  const fontMatch = body.match(/font-family\s*:\s*([^;]+)/i);
  if (fontMatch) {
    const fontValue = fontMatch[1].toLowerCase();
    return ICON_FONT_FAMILY_NAMES.some(font => fontValue.includes(font));
  }
  return false;
}

// Check if this is an icon font CSS rule (by selector or font-family)
function isIconFontRule(selector, body) {
  return isIconFontSelector(selector) || hasIconFontFamily(body);
}

// Patterns for icon font CLASS NAMES (without the . prefix)
const ICON_CLASSNAME_PATTERNS = [
  /^fa[srldb]?$/,   // fa, fas, far, fal, fad, fab
  /^fa-/,           // fa-chevron-right, etc.
  /^ti$/,           // Tabler base
  /^ti-/,           // Tabler icons
  /^bi$/,           // Bootstrap Icons base
  /^bi-/,           // Bootstrap Icons
  /^material-icons/,
  /^glyphicon/,
  /^icon-/,
  /^icofont-/,
  /^ri-/,
  /^bx-?/,
  /^la-?/,
];

// Check if a class NAME is an icon font class (for removeExtraAttributes)
function isIconFontClassname(className) {
  if (!className) return false;
  return ICON_CLASSNAME_PATTERNS.some(p => p.test(className));
}

// ============================================================

var VENDOR_PREFIXES = ['-ms-', '-moz-', '-o-', '-webkit-', '-khtml-', '-apple-'];

// Fallback class generation for broken/generic selectors
var fallbackClassMap = {};  // hash -> generated class name

function hashPropertySet(ruleBody) {
    var hash = 0;
    for (var i = 0; i < ruleBody.length; i++) {
        hash = ((hash << 5) - hash) + ruleBody.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

var CHEERIO_OPTIONS = {
            xmlMode: false,
            decodeEntities: false,
            // This is important - tell cheerio not to normalize the document structure
            normalizeWhitespace: false,
            recognizeSelfClosing: true,
            // Try to preserve the original HTML structure as much as possible
            _useHtmlParser2: true
        };

var SUPER_ULTIMATE = new Array();
var THE_ULTIMATE = new Array();
var WAITING_FOR_RELOAD = false;
var MAX_ERRORS = 2;
var RELOAD = {};

var PROCESSES_RUNNING = new Array();
var AUTOMATE_UID = "";
var AUTOMATE_URL = "";
var AUTOMATE_TYPE = "";
var AUTOMATE_INDEX = 0;
var AUTOMATE_SELECTORS = "";
var IS_AUTOMATING = false;
var AUTOMATE_INDICES_CALLED = new Array();
var TAILWIND_LOG_BUFFER = "";

// Debug filtering for Tailwind conversion logs
// Set to specific snip IDs like ['snipcss0-5-53-54', 'snipcss0-4-52-53'] to only log those elements
// Leave empty [] to log everything
var TARGET_DEBUG_SNIP_IDS = [];
var CURRENT_PROCESSING_SNIP_ID = '';

// Strip marker classes (snipcss0-*) from HTML using Cheerio
function stripMarkerClasses(theHtml) {
    let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
    $editHtml('[class]').each(function() {
        let elem = this;
        let classAttr = $editHtml(elem).attr('class');
        if (!classAttr) return;
        let classList = classAttr.split(/\s+/);
        let newClasses = classList.filter(c => !c.match(/^snipcss\d+-/));
        if (newClasses.length > 0) {
            $editHtml(elem).attr('class', newClasses.join(' '));
        } else {
            $editHtml(elem).removeAttr('class');
        }
    });
    return $editHtml.root().html();
}

DEVICE_PROPS['largedesktop'] = {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false              
};

DEVICE_PROPS['cheater'] = {
    width: 1450,
    height: 675,
    deviceScaleFactor: 1,
    mobile: false
};

DEVICE_PROPS['iphonexs'] = {
           width: 320,
           height: 568,
           deviceScaleFactor: 2,
           mobile: true          
    };
DEVICE_PROPS['ipad'] = {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true          
};
DEVICE_PROPS['ipadlandscape'] = {
      width: 1024,
      height: 768,
      deviceScaleFactor: 2,
      mobile: true          
};
DEVICE_PROPS['ipadvertical'] = {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: true          
};

DEVICE_PROPS['pixel2'] = {
      width: 823,
      height: 411,
      deviceScaleFactor: 3.5,
      mobile: true          
};

USER_AGENTS['largedesktop'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36 Edg/93.0.961.44';
USER_AGENTS['iphonexs'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
USER_AGENTS['ipad'] = 'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/16A5288q Safari/605.1.15';
USER_AGENTS['ipadvertical'] = 'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/16A5288q Safari/605.1.15';
USER_AGENTS['ipadlandscape'] = 'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/16A5288q Safari/605.1.15';
USER_AGENTS['pixel2'] = 'Mozilla/5.0 (Linux; Android 11; Pixel 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36';

USER_PLATFORMS['largedesktop'] = 'Win64';
USER_PLATFORMS['iphonexs'] = 'iPhone';
USER_PLATFORMS['ipad'] = 'iPad';
USER_PLATFORMS['ipadlandscape'] = 'iPad';
USER_PLATFORMS['ipadvertical'] = 'iPad';
USER_PLATFORMS['pixel2'] = 'Android';

var processArr = ['default'];
var processStep = 0;
var allBadInherited = new Array();
var processedInherited = new Array();
var processedOtherInherited = new Array();
//multiple
var multipleAllElementClassnames = new Array();
var allJquerySelectors = new Array();
var allElementSelectors = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
    'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX',
    'XXsnipcss_extracted_selector_6_XX', 'XXsnipcss_extracted_selector_7_XX', 'XXsnipcss_extracted_selector_8_XX',
    'XXsnipcss_extracted_selector_9_XX', 'XXsnipcss_extracted_selector_10_XX', 'XXsnipcss_extracted_selector_11_XX',
    'XXsnipcss_extracted_selector_12_XX', 'XXsnipcss_extracted_selector_13_XX', 'XXsnipcss_extracted_selector_14_XX',
    'XXsnipcss_extracted_selector_15_XX', 'XXsnipcss_extracted_selector_16_XX', 'XXsnipcss_extracted_selector_17_XX',
    'XXsnipcss_extracted_selector_18_XX', 'XXsnipcss_extracted_selector_19_XX', 'XXsnipcss_extracted_selector_20_XX'];

var origAllElementSelectors = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
    'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX',
    'XXsnipcss_extracted_selector_6_XX', 'XXsnipcss_extracted_selector_7_XX', 'XXsnipcss_extracted_selector_8_XX',
    'XXsnipcss_extracted_selector_9_XX', 'XXsnipcss_extracted_selector_10_XX', 'XXsnipcss_extracted_selector_11_XX',
    'XXsnipcss_extracted_selector_12_XX', 'XXsnipcss_extracted_selector_13_XX', 'XXsnipcss_extracted_selector_14_XX',
    'XXsnipcss_extracted_selector_15_XX', 'XXsnipcss_extracted_selector_16_XX', 'XXsnipcss_extracted_selector_17_XX',
    'XXsnipcss_extracted_selector_18_XX', 'XXsnipcss_extracted_selector_19_XX', 'XXsnipcss_extracted_selector_20_XX'];

var elementDim = 0;

var OPTION_REMOVE_INHERIT = true;
var OPTION_REMOVE_VENDOR_PREFIX = true;
var mediaQueryClasses = new Array();
var autoMediaWidthsReduced = new Array();
//tailwind conversion?
var matchingFinalRules = {};
var selectorSpecifityScore = {};
var noPseudoSelectors = {};

var existingQueryRanges = {};


function onDebuggerAttach(tabId) {
   console.log("attaching debugger for tabId " + tabId);
   
   if (chrome.runtime.lastError) {
       let errorMessage = chrome.runtime.lastError.message;
       console.log("errorMessage");
       console.log(errorMessage);
       if(errorMessage.indexOf('Cannot access a chrome-extension:') >= 0){
            console.log("extension interferrance");
            console.log(chrome.runtime.lastError);
             chrome.runtime.sendMessage({method: "snipcss_failed", fail_type: 'extension'}, 
                 function(response) 
                 {	
                 });      

            return;       
       }
       else{
            console.log("failed to attach");
            console.log(chrome.runtime.lastError);
             chrome.runtime.sendMessage({method: "snipcss_failed", fail_type: 'normal'}, 
                 function(response) 
                 {	
                 });             

            return;       
       }
   }
    

    //chrome.debugger.attach({tabId:tabId}, "1.2")
    chrome.debugger.sendCommand({ tabId:tabId }, "DOM.enable");     
    chrome.debugger.sendCommand({ tabId:tabId }, "CSS.enable");   
    chrome.debugger.sendCommand({ tabId:tabId }, "CSS.enable");   
    chrome.debugger.sendCommand({ tabId:tabId }, "Network.enable"); 
    chrome.debugger.sendCommand({ tabId:tabId }, "Runtime.enable");   
    //console.log("Loading Stylesheets");
    //await page._client.on('CSS.styleSheetAdded', (e) => {        
    chrome.debugger.onEvent.addListener(onDebuggerEvent);
    chrome.debugger.onDetach.addListener(onDebuggerDetach);
    
    if(!IS_AUTOMATING){
          setTimeout(function(){
              console.log("setting active which should bring UI");
              var params = {method: "activetab_activate"};
              chrome.runtime.sendMessage(params);    
          }, 300);   
          
          //popup page gets this
        chrome.runtime.sendMessage({method: "snipcss_loaded"}, 
            function(response) 
            {	
            });       

        resetVariables();    
    }else{
        
        chrome.tabs.update(tabId, { url: AUTOMATE_URL }, function(tab) {
            // Wait for 1 seconds to allow the page to load
            setTimeout(function() {
                console.log("setting up snipper 2");
                setupSnipper(tabId);
            }, 1000);
        });          
    }
}


function setupSnipper(tabId) {
    console.log("loading automation data");
    chrome.storage.local.get(['automation_data'], function(result) {
        let automationData = result['automation_data'];
        console.log(automationData);
        
        if (automationData) {
            AUTOMATE_UID = automationData['automate_uid'];
            let automateSelectorsString = automationData['automate_selectors'];
            AUTOMATE_URL = automationData['automate_url'];
            AUTOMATE_TYPE = automationData['automate_type'];

            // Inject scripts
            injectSnipcssScripts(tabId, function(){
                console.log("scripts should be loaded");
                // Reset variables
                resetVariables();
                
                //hide all fixed elements for this
                var hideFixedParams = {
                    method: "hide_fixed_elements",
                    automate_uid: AUTOMATE_UID,
                    extract_selector: '',
                    automation_index: 0
                };                    
                chrome.tabs.sendMessage(tabId, hideFixedParams);              
                
                // Only intercept logs during automation
                if(IS_AUTOMATING) {
                  const MAX_LOG_ENTRIES = 100000; // Prevent storage from growing too large

                  // Store original console methods
                  const originalConsole = {
                    log: console.log,
                    error: console.error,
                    warn: console.warn,
                    info: console.info,
                    debug: console.debug
                  };

                  // Function to save logs to storage
                  const saveLog = (type, args) => {
                    // Convert arguments to array and create a simple message
                    const message = Array.from(args).map(arg => {
                      if (arg === undefined) return 'undefined';
                      if (arg === null) return 'null';

                      try {
                        // Handle arrays specifically (one level deep only)
                        if (Array.isArray(arg)) {
                          return '[' + arg.map(item => {
                            if (item === null) return 'null';
                            if (item === undefined) return 'undefined';

                            // Stringify objects within the array
                            if (typeof item === 'object') {
                              return JSON.stringify(item);
                            }
                            return String(item);
                          }).join(', ') + ']';
                        }

                        // Handle regular objects
                        if (typeof arg === 'object') {
                          return JSON.stringify(arg);
                        }

                        return String(arg);
                      } catch (e) {
                        return `[Object (${e.message})]`;
                      }
                    }).join(' ');

                    const logEntry = {
                      timestamp: new Date().toISOString(),
                      type: type,
                      message: message,
                      taskUid: AUTOMATE_UID || 'unknown'
                    };

                    // Get existing logs, add new entry, save back to storage
                    chrome.storage.local.get(['automation_logs'], (result) => {
                      let logs = result.automation_logs || {};
                      let taskLogs = logs[logEntry.taskUid] || [];

                      // Add new log and limit size
                      taskLogs.push(logEntry);
                      if (taskLogs.length > MAX_LOG_ENTRIES) {
                        taskLogs = taskLogs.slice(-MAX_LOG_ENTRIES);
                      }

                      logs[logEntry.taskUid] = taskLogs;
                      chrome.storage.local.set({ automation_logs: logs });
                    });
                  };

                  // Override console methods
                  console.error = function() {
                    saveLog('error', arguments);
                    originalConsole.error.apply(console, arguments);
                  };
                  /*
                  console.log = function() {
                    saveLog('log', arguments);
                    originalConsole.log.apply(console, arguments);
                  };

                  console.warn = function() {
                    saveLog('warn', arguments);
                    originalConsole.warn.apply(console, arguments);
                  };
                  console.info = function() {
                    saveLog('info', arguments);
                    originalConsole.info.apply(console, arguments);
                  };
                  console.debug = function() {
                    saveLog('debug', arguments);
                    originalConsole.debug.apply(console, arguments);
                  };
                    */
                }                

                if(AUTOMATE_TYPE == 'all'){
                    //need to segment page first
                    console.log("need to segment page first");
                    var params = {
                        method: "segment_page",
                        automate_uid: AUTOMATE_UID
                    };
                    console.log("segmenting page");
                    
                    chrome.tabs.sendMessage(tabId, params);                                        
                }                
                else{
                    console.log("turning automate selectors string into array");
                    console.log(automateSelectorsString);
                    AUTOMATE_SELECTORS = automateSelectorsString.split('|');
                    
                    console.log("need to define elements first");
                    var params = {
                        method: "define_requested_elements",
                        automate_uid: AUTOMATE_UID,
                        selectors: AUTOMATE_SELECTORS
                    };
                    console.log("defining requested elements");
                    
                    chrome.tabs.sendMessage(tabId, params);                         
                    

                    //still need to take screenshots of the user provided elements, so dont do this now... 
                    /*
                    let firstSelector = automateSelectorsString;
                    if(automateSelectorsString.indexOf('|') >= 0){
                        let selectorArr = automateSelectorsString.split('|');
                        AUTOMATE_SELECTORS = selectorArr;
                        firstSelector = selectorArr[0];
                    }
                    // Send message to content script
                    var params = {
                        method: "run_snipper_from_background",
                        automate_uid: AUTOMATE_UID,
                        automate_selectors: AUTOMATE_SELECTORS,
                        index: 0
                    };
                    chrome.tabs.sendMessage(tabId, params, function(startSnipResult) {
                        console.log("Received result from content script");
                        console.log(startSnipResult);


                        if (startSnipResult && startSnipResult['result'] == 1) {
                            console.log("Element found, starting snipper");
                        } else {
                            console.log("Element not found, update UID as failed");
                            setTimeout(function(){
                                console.log("Trying one more time...");
                                chrome.tabs.sendMessage(tabId, params, function(secondSnipResult) {
                                    if (secondSnipResult && secondSnipResult['result'] == 1) {
                                        console.log("Second time success starting snipper...");
                                    }else{
                                        console.log("Failure again...");
                                    }
                                });
                            }, 2000);
                        }
                    });
                    */
                }
            });

        } else {
            console.log("No automation data found");
        }
    });
}


function resetVariables(){
    allImageNames = new Array();
    cssImages = new Array();       
    fontFiles = new Array();     
    snipFontUrls = new Array();
    allNewFontFaces = new Array();
    htmlImages = new Array();    
    htmlImagesArr = new Array();
    selectorFixArr = new Array();    
    selectorContainedArr = new Array();
    selectorPartialFixArr = new Array();    
    selectorFixArr['*'] = '*';
    selectorFixArr[':before'] = ':before';
    selectorFixArr[':after'] = ':after';
    selectorContainedArr['*'] = "1";
    selectorContainedArr[':before'] = "1";
    selectorContainedArr[':after'] = "1";
    selectorInheritedClassesArr = new Array();
    selectorInheritedClassesArr['*'] = [];
    selectorInheritedClassesArr[':before'] = [];
    selectorInheritedClassesArr[':after'] = [];
    fallbackClassMap = {};

    //selectorFixArr['*'] = '*';
    //selectorFixArr['*'] = '*';
    //selectorFixArr['*'] = '*';  
    
    
    //this happens when debugger attached 
    //stylesheetArr = new Array();
    customfontsArr = new Array();
    customfontsFiles = new Array();
    animationKeyframesArr = new Array();    
    snippedArr = new Array();
    tmClassArr = new Array();
    tmIdArr = new Array();    
    processStep = 0;
    //myCssSelector = "";
    allCssSelectors = new Array();
    usedFontArr = new Array();
    cssvarUsedArr = new Array();
    cssvarDefinedArr = {};
    cssvarAllArr = new Array();
    svgFilterReferences = new Array();
    cssvarResolvedValues = {};    
    usedFontObjectArr = new Array();
    importfontsArr = new Array();
    multipleAllElementClassnames = new Array();
    allJquerySelectors = new Array();
    allElementSelectors = origAllElementSelectors;
    mediaQueryClasses = new Array();
    autoMediaWidthsReduced = new Array();
    processedOtherInherited = new Array();
    processedInherited = new Array();
    allBadInherited = new Array();    
    SUPER_ULTIMATE = new Array();
    THE_ULTIMATE = new Array();
    matchingFinalRules = {};
    selectorSpecifityScore = {};
    noPseudoSelectors = {};
    existingQueryRanges = {};
    CURRENT_PROCESSING_SNIP_ID = '';  // Reset debug tracking
}


 var sendCommand = (target, method, params) => new Promise((res, err)=>{
    chrome.debugger.sendCommand(target, method, params, result=>{
      if (chrome.runtime.lastError) {
          console.log("error in send command ");
          console.log(chrome.runtime.lastError);          
          res(null);
      } else {
        res(result);
      }
      //console.log('sendCommand', method, params);
    });
 });
 
function onDebuggerDetach(source, reason){
    console.log("DEBUGGER DETACH...");
    console.log("Debuggeee: ");
    var detachId = source['tabId'];
    console.log("detach tab id: " + detachId);
    SNIP_TAB_ID = "";
    SNIP_TAB_URL = "";
    chrome.tabs.sendMessage(detachId, {method: "close_snipcss"}, function(response) 
    {
        //if debugger turned off... have to close snipcss on this tab
        
    });    
    
    console.log(source);
    console.log("Reason: ");
    console.log(reason);
}
 

function onDebuggerEvent(debuggeeId, message, e){
    /*
    console.log("EVENT RECEIVED...");
    console.log("Debuggeee: ");
    console.log(debuggeeId);
    console.log("Message: ");
    console.log(message);
    console.log("Params: ");
    console.log(e);    
    */
    if(message == 'CSS.styleSheetAdded'){
        var sourceUrl = e['header']['sourceURL'];
        var stylesheetId = e['header']['styleSheetId'];
        var frameId = e['header']['frameId'];
        var origin = e['header']['origin'];
        var isInline = e['header']['isInline'];
        var length = e['header']['length'];
        
        var aStylesheet = new Array();
        aStylesheet['source_url'] = sourceUrl;
        aStylesheet['stylesheet_id'] = stylesheetId;
        aStylesheet['frame_id'] = frameId;
        aStylesheet['origin'] = origin;
        aStylesheet['is_inline'] = isInline;        
        aStylesheet['length'] = length;
        //console.log(e);
        console.log("added stylesheet " + stylesheetId);

        stylesheetArr.push(aStylesheet);        
    }
}

function getTimestamp() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "" + month + "" + day + "-" + hour + "" + min + "" + sec;

}

function makePermalink(str) {
    return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
}

function alreadySnippedWhole(testSelector, testBody, testMedia)
{
    for(var i = 0; i < snippedArr.length; i++)
    {
        var mySelector = snippedArr[i]['selector'];
        var myBody = snippedArr[i]['body'];
        var myMedia = snippedArr[i]['media'];
        //console.log("comparing1 " + mySelector + " to " + testSelector);
        //console.log("comparing2 " + myBody + " to " + testBody);
        //console.log("comparing3 " + myMedia + " to " + testMedia);

        if(mySelector == testSelector && myBody == testBody && myMedia == testMedia)
        {
            return i;
        }        
    }
    return -1;
}

function alreadySnippedFont(fontBody){
    //console.log("usedfontarr ");
    //console.log(usedFontArr);
    //console.log("vs body");
    //console.log(fontBody);
    for(var i = 0; i < usedFontArr.length; i++){
        var aString = usedFontArr[i].toString();
        var isSame = true;
        for (var c = 0; c < aString.length; c++) {
            if (aString.charCodeAt(c) != fontBody.charCodeAt(c)) {
                //console.log("no match");
                //console.log(fontBody.charAt(c));
                //console.log(aString.charAt(c));                
                //console.log('c:'+c+' '+aString.charCodeAt(c)+'!='+fontBody.charCodeAt(c));                
                isSame = false;
                break;
            }
        }        
        
        if(isSame){
            //console.log("found same font");
            return i;
        }
    }    
    //console.log("not found");
    
    return -1;
    
}


function isInheritedProcessed(testSelector, testBody, testMedia)
{
    for(var i = 0; i < processedInherited.length; i++)
    {
        var mySelector = processedInherited[i]['selector'];
        var myBody = processedInherited[i]['body'];
        var myMedia = processedInherited[i]['media'];
        //console.log("comparing1 " + mySelector + " to " + testSelector);
        //console.log("comparing2 " + myBody + " to " + testBody);
        //console.log("comparing3 " + myMedia + " to " + testMedia);

        if(mySelector == testSelector && myBody == testBody && myMedia == testMedia)
        {
            return true;
        }        
    }
    return false;
}

function isOtherInheritedProcessed(testSelector, testBody, testMedia)
{
    for(var i = 0; i < processedOtherInherited.length; i++)
    {
        var mySelector = processedOtherInherited[i]['selector'];
        var myBody = processedOtherInherited[i]['body'];
        var myMedia = processedOtherInherited[i]['media'];
        //console.log("comparing1 " + mySelector + " to " + testSelector);
        //console.log("comparing2 " + myBody + " to " + testBody);
        //console.log("comparing3 " + myMedia + " to " + testMedia);

        if(mySelector == testSelector && myBody == testBody && myMedia == testMedia)
        {
            return true;
        }        
    }
    return false;
}


function isInheritedBad(testSelector, testBody, testMedia)
{
    for(var i = 0; i < allBadInherited.length; i++)
    {
        var mySelector = allBadInherited[i]['selector'];
        var myBody = allBadInherited[i]['body'];
        var myMedia = allBadInherited[i]['media'];
        //console.log("comparing1 " + mySelector + " to " + testSelector);
        //console.log("comparing2 " + myBody + " to " + testBody);
        //console.log("comparing3 " + myMedia + " to " + testMedia);

        if(mySelector == testSelector && myBody == testBody && myMedia == testMedia)
        {
            return true;
        }        
    }
    return false;
}

function markParseURLValue(value)
{
    var xURL = /url\("?([^"\)]+)?"?\)/;     //"
    var m = xURL.exec(value);
    
    var retValue = "";
    if(m){
        retValue = m[1];
        retValue = retValue.replace('"', "");
        retValue = retValue.replace('"', "");
        retValue = retValue.replace('"', "");
        retValue = retValue.replace('"', "");
        retValue = retValue.replace("'", "");
        retValue = retValue.replace("'", "");
        retValue = retValue.replace("`", "");
        retValue = retValue.replace("`", "");        
    }
   
    
    return retValue;
}

var escapeRegExp = function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

var replaceAll = function(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};


function getStylesheetFromId(stylesheetId){
    var retStylesheet = null;    
    //console.log("searching for " + stylesheetId + " from array w len: " + stylesheetArr.length);
    for(var x = 0; x < stylesheetArr.length; x++){
        //console.log("comparing " + stylesheetArr[x]['stylesheet_id']);
        if(stylesheetArr[x]['stylesheet_id'] == stylesheetId){
            //console.log("found");
            retStylesheet = stylesheetArr[x];    
            break;
        }
    }    
    if(retStylesheet == null){
        console.log("COULD NOT FIND STYLESHEET " + stylesheetId);       
    }
    
    return retStylesheet;
}

var setDeviceForScreenshot = async function(targetTab, deviceSize){
    var commandResponse = await sendCommand(targetTab, 'Emulation.setDeviceMetricsOverride', DEVICE_PROPS[deviceSize]);
};

var doReloadTest = async function(targetTab, classSelector, theCallback){

    var currDevice = "iphonexs";
    
    var commandResponse = await sendCommand(targetTab, 'Emulation.setDeviceMetricsOverride', DEVICE_PROPS[currDevice]);
    console.log("setting userAgent to " + USER_AGENTS[currDevice]);
    var moreResponse = await sendCommand(targetTab, 'Emulation.setUserAgentOverride', {userAgent: USER_AGENTS[currDevice]});
    console.log("setting userAgent2 ");
    var extraResponse = await sendCommand(targetTab, 'Network.setUserAgentOverride', {
            userAgent: USER_AGENTS[currDevice],
            platform: USER_PLATFORMS[currDevice]
     });                     

    chrome.tabs.reload(targetTab.tabId, null);         
    theCallback("done");
    
};

var doHoverTest = async function(targetTab, classSelector, theCallback){
    
    /*
    console.log("doing emulation test<br>");
    var commandResponse = await sendCommand(targetTab, 'Emulation.setDeviceMetricsOverride', DEVICE_PROPS['iphonexs']);        
    console.log("emulation command respose");
    console.log(commandResponse);
    
    
    console.log("doing hover test with " + classSelector);
    var TEST_DOC = await sendCommand(targetTab, 'DOM.getDocument');    
    console.log("after dom getdocument");    
    console.log(TEST_DOC);
    
    console.log("root id ");
    console.log(TEST_DOC.root.nodeId);
    
    
    var node = await sendCommand(targetTab, 'DOM.querySelector', {
           nodeId: TEST_DOC.root.nodeId,
           selector: classSelector
    });    
    console.log("after queryselector");
    var params = {method: "snipcss_get_tagname", class_selector: classSelector};
    var tagnameResult = await syncSendRequest(targetTab.tabId, params);         
    var tagName = tagnameResult['result'];
    //console.log("get_tagname was " + tagName);   
    //console.log("classname " + classSelector);
    
   
    var matchedCSSRules = new Array();
    var allMatchedStyles2 = await sendCommand(targetTab, 'CSS.getMatchedStylesForNode', {nodeId: node.nodeId});   
    var psuedoMatch2 = null;
    var matchNormal = null;
    var matchInherit = null;
    for(matchNormal of allMatchedStyles2['matchedCSSRules']){
        var ruleHeader = matchNormal['rule']['selectorList']['text'];
        if(ruleHeader.indexOf(':hover') >= 0){
             console.log("NORMAL HOVER HOVER HOVER===========");                   
             matchedCSSRules.push(matchNormal);             
             console.log(matchNormal);
        }
    }
    for(matchInherit of allMatchedStyles2['inherited']){
        console.log("inherit rule");
        var test = null;
        for(iRule of matchInherit['matchedCSSRules']){
            console.log(iRule['rule']);
            var ruleHeader = iRule['rule']['selectorList']['text'];
            if(ruleHeader.indexOf(':hover') >= 0){
                 iRule['inherited'] = true;
                 console.log("INHERIT HOVER HOVER HOVER===========");                                           
                 matchedCSSRules.push(iRule);             
                 console.log(iRule);                                                                   
            }                   
        }             
    }
    for(psuedoMatch2 of allMatchedStyles2['pseudoElements']){
        var psuedoType = psuedoMatch2['pseudoType'];

        console.log("PSEUDO MATCH2: " + psuedoType);     
        for(var p = 0; p < psuedoMatch2['matches'].length; p++){
            var pMatch = psuedoMatch2['matches'][p];
            console.log("pmatch rule2");
            console.log(pMatch['rule']);
            if(pMatch['rule']['style']['cssText'] == '\n  -webkit-box-sizing: inherit;\n          box-sizing: inherit;\n' ){
               console.log("skipping this psuedo inherit rule bullshit");
               continue;
            }
            if(pMatch['rule']['selectorList']['text'].indexOf(":hover") >= 0){
                pMatch['rule']['rule_type'] = "psuedo";
                var aRule = {
                   rule: pMatch['rule']
                };
                console.log("PSUEDO HOVER HOVER HOVER===========");                                                                  
                matchedCSSRules.push(aRule);   
                console.log(aRule);
            }
        }
    }            
    
    console.log("matched css rules");
    console.log(matchedCSSRules);
    
    theCallback("made it");
    */
}

//not my code - seems legit
var calculateSingle = function(input) {
	var selector = input,
		findMatch,
		typeCount = {
			'a': 0,
			'b': 0,
			'c': 0
		},
		parts = [],
		// The following regular expressions assume that selectors matching the preceding regular expressions have been removed
		attributeRegex = /(\[[^\]]+\])/g,
		idRegex = /(#[^\#\s\+>~\.\[:\)]+)/g,
		classRegex = /(\.[^\s\+>~\.\[:\)]+)/g,
		pseudoElementRegex = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/gi,
		// A regex for pseudo classes with brackets - :nth-child(), :nth-last-child(), :nth-of-type(), :nth-last-type(), :lang()
		// The negation psuedo class (:not) is filtered out because specificity is calculated on its argument
		// :global and :local are filtered out - they look like psuedo classes but are an identifier for CSS Modules
		pseudoClassWithBracketsRegex = /(:(?!not|global|local)[\w-]+\([^\)]*\))/gi,
		// A regex for other pseudo classes, which don't have brackets
		pseudoClassRegex = /(:(?!not|global|local)[^\s\+>~\.\[:]+)/g,
		elementRegex = /([^\s\+>~\.\[:]+)/g;

	// Find matches for a regular expression in a string and push their details to parts
	// Type is "a" for IDs, "b" for classes, attributes and pseudo-classes and "c" for elements and pseudo-elements
	findMatch = function(regex, type) {
		var matches, i, len, match, index, length;
		if (regex.test(selector)) {
			matches = selector.match(regex);
			for (i = 0, len = matches.length; i < len; i += 1) {
				typeCount[type] += 1;
				match = matches[i];
				index = selector.indexOf(match);
				length = match.length;
				parts.push({
					selector: input.substr(index, length),
					type: type,
					index: index,
					length: length
				});
				// Replace this simple selector with whitespace so it won't be counted in further simple selectors
				selector = selector.replace(match, Array(length + 1).join(' '));
			}
		}
	};

	// Replace escaped characters with plain text, using the "A" character
	// https://www.w3.org/TR/CSS21/syndata.html#characters
	(function() {
		var replaceWithPlainText = function(regex) {
				var matches, i, len, match;
				if (regex.test(selector)) {
					matches = selector.match(regex);
					for (i = 0, len = matches.length; i < len; i += 1) {
						match = matches[i];
						selector = selector.replace(match, Array(match.length + 1).join('A'));
					}
				}
			},
			// Matches a backslash followed by six hexadecimal digits followed by an optional single whitespace character
			escapeHexadecimalRegex = /\\[0-9A-Fa-f]{6}\s?/g,
			// Matches a backslash followed by fewer than six hexadecimal digits followed by a mandatory single whitespace character
			escapeHexadecimalRegex2 = /\\[0-9A-Fa-f]{1,5}\s/g,
			// Matches a backslash followed by any character
			escapeSpecialCharacter = /\\./g;

		replaceWithPlainText(escapeHexadecimalRegex);
		replaceWithPlainText(escapeHexadecimalRegex2);
		replaceWithPlainText(escapeSpecialCharacter);
	}());

	// Remove anything after a left brace in case a user has pasted in a rule, not just a selector
	(function() {
		var regex = /{[^]*/gm,
			matches, i, len, match;
		if (regex.test(selector)) {
			matches = selector.match(regex);
			for (i = 0, len = matches.length; i < len; i += 1) {
				match = matches[i];
				selector = selector.replace(match, Array(match.length + 1).join(' '));
			}
		}
	}());

	// Add attribute selectors to parts collection (type b)
	findMatch(attributeRegex, 'b');

	// Add ID selectors to parts collection (type a)
	findMatch(idRegex, 'a');

	// Add class selectors to parts collection (type b)
	findMatch(classRegex, 'b');

	// Add pseudo-element selectors to parts collection (type c)
	findMatch(pseudoElementRegex, 'c');

	// Add pseudo-class selectors to parts collection (type b)
	findMatch(pseudoClassWithBracketsRegex, 'b');
	findMatch(pseudoClassRegex, 'b');

	// Remove universal selector and separator characters
	selector = selector.replace(/[\*\s\+>~]/g, ' ');

	// Remove any stray dots or hashes which aren't attached to words
	// These may be present if the user is live-editing this selector
	selector = selector.replace(/[#\.]/g, ' ');

	// Remove the negation psuedo-class (:not) but leave its argument because specificity is calculated on its argument
 	// Remove non-standard :local and :global CSS Module identifiers because they do not effect the specificity
	selector = selector.replace(/:not/g, '    ');
	selector = selector.replace(/:local/g, '      ');
	selector = selector.replace(/:global/g, '       ');
	selector = selector.replace(/[\(\)]/g, ' ');

	// The only things left should be element selectors (type c)
	findMatch(elementRegex, 'c');

	// Order the parts in the order they appear in the original selector
	// This is neater for external apps to deal with
	parts.sort(function(a, b) {
		return a.index - b.index;
	});

	return {
		selector: input,
		specificity: '0,' + typeCount.a.toString() + ',' + typeCount.b.toString() + ',' + typeCount.c.toString(),
		specificityArray: [0, typeCount.a, typeCount.b, typeCount.c],
		parts: parts
	};
};   


/*
 var downloadBadStylesheets(sourceUrls){
                let h = new Headers();
                h.append('Accept', 'text/*');
                let req = new Request(astylesheet['source_url'], {
                    method: 'GET',
                    headers: h,
                    mode: 'cors'
                });
                var downloadCSS = function(theReq, fullUrl){
                    var sArr = fullUrl.split("\/");
                    var theFilename = sArr[sArr.length - 1];          
                    var dfd = new $.Deferred();    
                    fetch(theReq)
                        .then((response)=>{
                            if(response.ok){
                                console.log("ok response?");
                                console.log(response);         
                                //response.body;
                                return response;
                            }else{
                                console.log(response);
                                dfd.resolve("");
                                throw new Error('BAD HTTP stuff');
                            }
                        })
                        .then( (cssText) =>{
                            
                            console.log("css text");
                            console.log(cssText);
                            
                            dfd.resolve(cssText);
                            //$('#yoursnippets_underline').attr('src', imgUrl);
                        })
                        .catch( (err) =>{
                            dfd.resolve("");
                            console.log(err);
                        });   
                    return dfd.promise();
                };

                downloadCSS(req, astylesheet['source_url']).then(function(theCss){
                    console.log("csstext2222");
                    console.log(theCss);
                    processGoogleFont(theCss);
                });      
}
*/

          
  var fillAutoMediaWidths = async function(targetTab){  
    var mediaQueryResponse = await sendCommand(targetTab, 'CSS.getMediaQueries'); 
    let allMediaPixels = new Array();
    for(let mq = 0; mq < mediaQueryResponse['medias'].length; mq++){
        let aMedia = mediaQueryResponse['medias'][mq];
        if(aMedia.hasOwnProperty('text')){
            let mediaText = aMedia['text'];
            var regex = /\d+px/g;        
            var matches = mediaText.match( regex );
            if(matches != null && matches.length > 0){
                for(let mqm = 0; mqm <= matches.length; mqm++){
                    if(matches[mqm] && typeof(matches[mqm]) != 'undefined'){
                        let pixelInt = parseInt(matches[mqm].replace('px', ''));
                        if(pixelInt > 0 && !allMediaPixels.includes(pixelInt)){
                            allMediaPixels.push(pixelInt);
                        }
                    }                    
                }
            }
        }        
    }
    allMediaPixels.sort( function(a, b){
        return b - a;
    });
    console.log("after sort media pixels");
    console.log(allMediaPixels);

    let autoMediaWidths = new Array();
    let minSizeDiff = 2;
    for(let am = 0; am < allMediaPixels.length; am++){
        if(am >= (allMediaPixels.length - 1)){
            continue;
        }        
        let aSize = allMediaPixels[am];        
        let nextSize = allMediaPixels[am+1];
        //console.log("currsize: " + aSize + " nextsize: " + nextSize);
        if((aSize - nextSize) > minSizeDiff){
            let halfAmount = (aSize - nextSize) / 2;
            let midSize = parseInt(nextSize + halfAmount);
            autoMediaWidths.push(midSize);
        }
    }

    console.log("auto media widths: ");
    console.log(autoMediaWidths);
    if(autoMediaWidths.length > 100){
        let modVal = Math.floor(autoMediaWidths.length / 5);
        console.log("modval is " + modVal);
        for(let m = 0; m < autoMediaWidths.length; m++){
            if(m > 0 && (m % modVal) == 0){
                console.log("adding index " + m + " = " + autoMediaWidths[m]);
                autoMediaWidthsReduced.push(autoMediaWidths[m]);
            }
        }
    }else{
        autoMediaWidthsReduced = autoMediaWidths;
    }
    console.log("autoMediaWidths Reduced");
    console.log(autoMediaWidthsReduced);        
    
    for(let a = 0; a < autoMediaWidthsReduced.length; a++){
        let deviceProp = 'custom' + a.toString();
        let theWidth = autoMediaWidthsReduced[a];
        let theHeight = parseInt(theWidth * .75);
        let isMobile = false;
        if(theWidth < 800){
            isMobile = true;
            theHeight = parseInt(theWidth * .4);
        }
        
        DEVICE_PROPS[deviceProp] = {
            width: theWidth,
            height: theHeight,
            deviceScaleFactor: 1,
            mobile: isMobile
        };
        console.log("adding device prop " + deviceProp);
        console.log(DEVICE_PROPS[deviceProp]);
        processArr.push(deviceProp);        
    }
  };


var doSnipper = async function(targetTab, elemSelector, selIndex, theCallback) {
    console.log("starting snipper step: " + processStep);
try{
    var tabId = targetTab.tabId;
    var currDevice = processArr[processStep];
    var mediaQueriesOnly = false;
    
    let resolveVariables = self.OPTIONS['resolve_variables'];
    let useTailwind = self.OPTIONS['use_tailwind'];
    
    if(currDevice.startsWith("custom")){
        mediaQueriesOnly = true;
    }
    if(WAITING_FOR_RELOAD){
        WAITING_FOR_RELOAD = false;
    }
    else{
        if(currDevice == 'default'){
            console.log("clearing device metrics");
            var commandResponse = await sendCommand(targetTab, 'Emulation.clearDeviceMetricsOverride');
            
            //hack bullshit 
            if(IS_AUTOMATING){
                chrome.tabs.sendMessage(SNIPPING_TAB_ID, {method: "resize_thrash"}, function(response) 
                {});             
            }
        }else{
            var reloadResolutions = self.OPTIONS['reload_resolutions'];
            if(!reloadResolutions){
                reloadResolutions = "no";
            }            
            if(reloadResolutions == 'yes'){
                var commandResponse = await sendCommand(targetTab, 'Emulation.setDeviceMetricsOverride', DEVICE_PROPS[currDevice]);
                console.log("setting userAgent to " + USER_AGENTS[currDevice]);
                var moreResponse = await sendCommand(targetTab, 'Emulation.setUserAgentOverride', {userAgent: USER_AGENTS[currDevice]});
                console.log("done setting first userAgent");            
                var extraResponse = await sendCommand(targetTab, 'Network.setUserAgentOverride', {
                        userAgent: USER_AGENTS[currDevice],
                        platform: USER_PLATFORMS[currDevice]
                });                     

                console.log("done setting both user agents");
                WAITING_FOR_RELOAD = true;
                RELOAD = {};
                RELOAD['target_tab'] = targetTab;
                RELOAD['allElementSelectors'] = origAllElementSelectors;
                RELOAD['selIndex'] = selIndex;
                RELOAD['theCallback'] = theCallback;    
                RELOAD['allJquerySelectors'] = allJquerySelectors;
                RELOAD['site_url'] = SITE_URL;
                chrome.tabs.reload(tabId, null);   
                console.log("waiting for reload");
                return;
            }else{
                console.log("ONLY ONE USERAGENT NO RELOAD");
                var commandResponse = await sendCommand(targetTab, 'Emulation.setDeviceMetricsOverride', DEVICE_PROPS[currDevice]);
            }            
        }
    }    
    //also... 'CSS.getBackgroundColors'
    
    console.log("tabid: " + tabId);
    SNIP_DOC = await sendCommand(targetTab, 'DOM.getDocument');
    if (SNIP_DOC == null){
        console.log("snipdoc null");
        chrome.tabs.sendMessage(tabId, {method: "dead_kiwi"}, function(response) 
        {
          //why did Google break my extension?
        });
        return;
    }
    //console.log("snip doc is: ");
    //console.log(SNIP_DOC);    
    
    var aTimestamp = getTimestamp();
    console.log("selindex ");
    console.log(selIndex);
    console.log("multiple element classnames");
    console.log(multipleAllElementClassnames);    
    var allClassnamesString = multipleAllElementClassnames[selIndex];
    allClassnamesArr = allClassnamesString.split('|');
    console.log("STARTING SNIP WITH stylesheet length: " + stylesheetArr.length);
    console.log("allclassnames length: " + allClassnamesArr.length);
    for(var m = 0; m < stylesheetArr.length; m++){
        if(processStep > 0 || selIndex > 0){
            //don't have to parse stylesheets for fonts again
            continue;
        }        
        var astylesheet = stylesheetArr[m];
        var stylesheetBase = SITE_URL;
        if(astylesheet !== null && astylesheet['source_url']){
            stylesheetBase = astylesheet['source_url'];
        }                
        try{
            console.log("stylesheet id " + astylesheet['stylesheet_id']);
            var cssText = await sendCommand(targetTab, 'CSS.getStyleSheetText', {
                styleSheetId: astylesheet['stylesheet_id']
            });              

            //console.log("GOOD STYLESHEET?");
            //console.log(astylesheet);               
            //console.log("got css for " + astylesheet['source_url']);
            //console.log(cssText['text']);           
            
            if(cssText['text'].length > 0 && (cssText['text'].indexOf("@font-face") >= 0 || cssText['text'].indexOf("--") >= 0)){
                console.log("found one with fontface");          
                //parser is shit - hack... 
                cssText['text'] = replaceAll(cssText['text'], "@font-face{", '@font-face \n {');
                var lastIndex = cssText['text'].lastIndexOf('font-face');
                var theEnd = cssText['text'].indexOf('}', lastIndex) + 1;
                cssText['text'] = cssText['text'].substr(0, theEnd);
                //console.log("reduced css text");
                //console.log(cssText['text']);                
                //end hack
                var parser = new cssjs();
                var parsedCssNew = parser.parseCSS(cssText['text']);                
                //var parsedCss = css.parse(cssText['text'], {silent: true});
                //console.log("parsedCSS lenght " + parsedCssNew.length + " xxx");
                allNewFontFaces = new Array();
                for(var v = 0; v < parsedCssNew.length; v++){
                    //console.log("testing typeeeeeee");
                    //console.log(parsedCssNew[v]);

                    // Check for global variable definitions in :root, :host, *, html, body
                    let selector = '';
                    if('selector' in parsedCssNew[v]){
                        selector = parsedCssNew[v]['selector'];
                    }

                    let isGlobalSelector = selector.indexOf(":root") >= 0 ||
                                          selector.indexOf(":host") >= 0 ||
                                          selector === "*" ||
                                          selector === "html" ||
                                          selector === "body";

                    if(isGlobalSelector){
                        let vRules = parsedCssNew[v]['rules'];
                        for(let vr = 0; vr < vRules.length; vr++){
                            let vRule = vRules[vr];
                            let prop = vRule['directive'];
                            let val = vRule['value'];

                            // Skip if not a CSS variable
                            if(!prop || !prop.startsWith('--')){
                                continue;
                            }

                            console.log("Global CSS variable found --- " + prop + ": " + val + " in selector: " + selector);

                            // Store in cssvarAllArr (existing behavior)
                            cssvarAllArr[prop] = val + ";";

                            // Also store in cssvarDefinedArr for Tailwind resolution
                            if (!cssvarDefinedArr.hasOwnProperty(prop)) {
                                cssvarDefinedArr[prop] = [];
                            }

                            // Create unique key for this global definition
                            const globalKey = '__global__' + selector + prop;

                            // Check if already exists
                            const exists = cssvarDefinedArr[prop].some(item => item.key === globalKey);

                            if (!exists) {
                                cssvarDefinedArr[prop].push({
                                    "key": globalKey,
                                    "label": '__global__',  // Special label for global scope
                                    "value": val,
                                    "media": "",
                                    "selector": selector,
                                    "source": "stylesheet",  // Mark as coming from stylesheet not inline style
                                    "specificity": selector === ":root" ? 1 : (selector === "*" ? 0 : 2)  // :root has higher specificity than *
                                });
                                console.log("Added to cssvarDefinedArr: " + prop);
                            }
                        }
                    }
                    if('type' in parsedCssNew[v] && parsedCssNew[v]['type'] == 'font-face'){
                        //console.log("type is font-face");
                        let maybeFontSelector = parsedCssNew[v]['selector'];
                        //console.log("selector  " + maybeFontSelector);                    
                        let rules = parsedCssNew[v]['rules'];
                        
                        //fix the rules because shitty parser
                        //console.log("orig rules");
                        //console.log(rules);
                        for(let fr = 0; fr < rules.length; fr++){
                            //console.log("directive " + rules[fr]['directive'] + " fr " + fr);
                            if(rules[fr]['directive'] == '' && fr > 0){
                                //put in previous rule with ;
                                console.log("changing previous rule value");
                                let modVal = replaceAll(rules[fr]['value'], "base64", ";base64");
                                modVal = replaceAll(modVal, "charset=", ";charset=");
                                if(!modVal.startsWith(';')){
                                    modVal = ';' + modVal;
                                }
                                rules[fr-1]['value'] = rules[fr-1]['value'] + modVal;
                            }
                        }
                        var allPropVals = new Array();
                        var newFontFace = "";
                        for(var d = 0; d < rules.length; d++){
                            var dec = rules[d];

                            var prop = dec['directive'];
                            var val = dec['value'];
                            if(prop == '' || dec['defective']){
                                continue;
                            }
                            
                            //came across this stupid css property which is Liquid template apparently
                            //src: url({{ "Mango.otf" | asset_url}}) format("OpenType");
                            if(val.indexOf("{{") >= 0){
                                continue;
                            }
                            
                            //console.log("fontface prop: " + prop);
                            //console.log("fontface val: " + val);                            
                            
                            dec['property'] = prop;
                            dec['original_value'] = val;
                            var lineVal = val;
                            if(prop == 'font-family'){
                                newFontFace = val;

                            }
                            if (lineVal.indexOf('url') >= 0) {
                                var downloadUrls = [];
                                var allUrls = lineVal.split(',');
                                var newAllUrls = [];
                                //console.log("-----------FONT HAS A URL(s): " + lineVal);
                                for (var u = 0; u < allUrls.length; u++) {
                                    var singleUrl = allUrls[u];
                                    var newSingleUrl = singleUrl;
                                    if (singleUrl.indexOf('url') >= 0 && singleUrl.indexOf('data:') === -1) {

                                        var fontUrl = markParseURLValue(singleUrl);
                                        //console.log("resolve this " + fontUrl);
                                        // Skip data URLs
                                        if (fontUrl.substring(0, 4).toLowerCase() !== 'data') {
                                            var fullUrl = URI.resolve(stylesheetBase, fontUrl);
                                            downloadUrls.push(fullUrl);
                                            if (!snipFontUrls.includes(fullUrl)) {
                                                //console.log("adding font url: " + fullUrl);
                                                snipFontUrls.push(fullUrl);
                                            }
                                            if (fullUrl.indexOf("/") >= 0) {
                                                var sArr = fullUrl.split("/");
                                                var myName = sArr[sArr.length - 1];
                                                var replaceUrl = "SNIPPATH_TO_FONTS_" + myName;
                                                newSingleUrl = singleUrl.replace(fontUrl, fullUrl);
                                            }
                                        } else {
                                            //console.log("oh it's a data url");
                                        }
                                    }
                                    newAllUrls.push(newSingleUrl);
                                }
                                lineVal = newAllUrls.join(',');
                                //console.log("final line val: " + lineVal);
                                dec['value'] = lineVal;
                                if (downloadUrls.length > 0) {
                                    dec['download_urls'] = downloadUrls;
                                }
                            }
                            
                            allPropVals.push(dec);
                        }
                        if(newFontFace !== ""){
                            var customFontsData = {};
                            customFontsData['props'] = allPropVals;
                            customFontsData['stylesheet_id'] = astylesheet['stylesheet_id'];
                            customFontsData['stylesheet_url'] = astylesheet['source_url'];                            
                            customFontsData['face'] = newFontFace; 
                            customFontsData['used'] = false;
                            var fontfaceNoquotes = replaceAll(newFontFace, "'", "");
                            fontfaceNoquotes = replaceAll(fontfaceNoquotes, '"', "");
                            customFontsData['face_noquotes'] = fontfaceNoquotes;

                            customfontsArr.push(customFontsData);
                            if(!allNewFontFaces.includes(newFontFace)){
                                allNewFontFaces.push(newFontFace);
                                console.log("ADDED NEW FONTFACE " + newFontFace);
                                console.log(customFontsData);
                            }
                        }else{
                            //var shitRule = rule['declarations'].join("|");
                            var shitRule = parsedCssNew[v]['selector'];
                            console.log("SHitty font-face rule: " + shitRule);
                            errorMessages.push("Shitty font-face rule: " + shitRule);
                        }
                        //console.log("Rule is font-face rule");
                        //console.log(rule);                        
                        //                        
                        
                    }                    
                }                               
            }
            
            //Get Google Font  @import lines            
            var newLineSplit = cssText['text'].split(/\r?\n/);
            for(var n = 0; n < newLineSplit.length; n++){
                var mycssLine = newLineSplit[n];
                //trying to parse lines like this get out family
                //@import "https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700";
                if(mycssLine.indexOf("fonts.googleapis.com") >= 0){
                    var mycssLineval = mycssLine;
                    if(mycssLineval.indexOf(':') !== -1){
                        mycssLineval = mycssLineval.split(':')[1];
                    }
                    var googlefontUrl = mycssLineval;
                    try{
                        googlefontUrl = mycssLineval.match(/\((.*?)\)/)[1].replace(/('|")/g,'');
                    }catch(ex){
                        console.log("image url " + imageUrl + " could not remove url portion");
                    }
                    googlefontUrl = replaceAll(googlefontUrl, "'", "");
                    googlefontUrl = replaceAll(googlefontUrl,'"', "");
                    googlefontUrl = replaceAll(googlefontUrl,")", "");
                    googlefontUrl = replaceAll(googlefontUrl,"url(", "");
                    googlefontUrl = replaceAll(googlefontUrl,"(", "");            

                    
                    var hrefSplit = mycssLine.split('family=');
                    if(hrefSplit.length <= 1){
                        return;
                    }
                    var urlSplit = hrefSplit[1];
                    urlSplit = replaceAll(urlSplit, ")", "");
                    urlSplit = replaceAll(urlSplit, "'", "");
                    urlSplit = replaceAll(urlSplit, '"', "");
                    urlSplit = replaceAll(urlSplit, ';', "");
                    
                    var allFonts = urlSplit.split("|");
                    
                    var retObj = {};
                    retObj['import'] = mycssLine;
                    var urlFonts = new Array();
                    allFonts.forEach(function (currentValue, index) {    
                        var aFont = currentValue.split(':')[0];
                        aFont = aFont.replace('+', ' ');
                        aFont = aFont.replace('%20', ' ');       
                        urlFonts.push(aFont);
                    });
                    if(urlFonts.length > 0){
                        console.log("googlefontuuu ");
                        console.log(googlefontUrl);                        
                        retObj['fonts'] = urlFonts;
                        retObj['already_added'] = false;
                        retObj['href'] = googlefontUrl;
                        importfontsArr.push(retObj);
                    }                    
                }

            }
            //console.log("import fonts arr");
            //console.log(importfontsArr);            
            
            
        }catch(e){
            console.log("stylesheet reading error");
            console.log(e);
            //console.log("Bad stylesheet maybe ok if no sourceurl: " + astylesheet['source_url']);
            //console.log(astylesheet);          
            console.log("Bad stylesheet maybe ok if no sourceurl: " + astylesheet['source_url']);
        }
        
    }
    console.log("custom fonts array is now ");
    for(var m=0; m < customfontsArr.length; m++){ 
        if(processStep > 0 || selIndex > 0){
            //don't have to parse stylesheets for fonts again
            continue;
        }                
        var fontArr = customfontsArr[m];
        var cfKey = fontArr['face_noquotes'];
        //console.log("font: " + cfKey + " printing out");
        //console.log(fontArr);
        for(var pa = 0; pa < fontArr['props'].length; pa++){
            var aProp = fontArr['props'][pa];
            if(aProp['property'] == 'src'){
                if(aProp['download_urls'] && aProp['download_urls'].length > 0){
                      for(var du = 0; du < aProp['download_urls'].length; du++){
                          var aUrl = aProp['download_urls'][du];                          
                          //console.log("downloading fontfile later? " + aUrl);
                          customfontsFiles.push(aUrl);
                      }
                } 
                //console.log(aProp);
            }
        }
    }
        
    /*
    if(processStep == 0 && selIndex == 0){
        await fillAutoMediaWidths(targetTab);        
    }     
    */
    
     for(var x = 0; x < allClassnamesArr.length; x++){
         let aClassname = allClassnamesArr[x];
         let elemParts = aClassname.split('-');
         //snipcss-level-parentid-currentid
         //console.log("doc root nodeId " + SNIP_DOC.root.nodeId);
         //console.log("searching for " + aClassname);
         let level = elemParts[1];
         let parentId = elemParts[2];
         let currId = elemParts[3];
         let node = await sendCommand(targetTab, 'DOM.querySelector', {
                nodeId: SNIP_DOC.root.nodeId,
                selector: '.' + aClassname
         });         
         
         
         if(!(aClassname in matchingFinalRules)){
            matchingFinalRules[aClassname] = {};
            matchingFinalRules[aClassname]['indices'] = new Array();
            matchingFinalRules[aClassname]['selectors'] = new Array();
            matchingFinalRules[aClassname]['bodies'] = new Array();
            matchingFinalRules[aClassname]['media_queries'] = new Array();         
            matchingFinalRules[aClassname]['matching_parts'] = new Array();
            matchingFinalRules[aClassname]['contain_type'] = new Array();
            matchingFinalRules[aClassname]['inherited_type'] = new Array();
            matchingFinalRules[aClassname]['inherited_classes'] = new Array();
            matchingFinalRules[aClassname]['invalid_pseudos'] = new Array();
         }
         /*
         let node = await page._client.send('DOM.querySelector', {
                nodeId: SNIP_DOC.root.nodeId,
                selector: '.' + aClassname
         });
        */
         console.log('------------------------------- ' + aClassname);
         //console.log('------------------------------------------------------');
         //console.log('------------------------------------------------------');         
         //console.log("CURRID: " + currId + " has node id " + node.nodeId);
         var intNode = parseInt(node.nodeId);
         if(intNode == 0){
             console.log("BAD NODE ========================**************");             
             continue;
         }       
         
         var allMatchedStyles = await sendCommand(targetTab, 'CSS.getMatchedStylesForNode', {nodeId: node.nodeId});    
         
         //console.log("absolutely all matched styles");
         //console.log(allMatchedStyles);         
         
         var matchedCSSRules = allMatchedStyles['matchedCSSRules'];
         var inheritedCSSRules = allMatchedStyles['inherited'];

         // Process inline style attributes for CSS variables
         if(resolveVariables == 'yes' && allMatchedStyles['inlineStyle']) {
             let inlineStyle = allMatchedStyles['inlineStyle'];
             let cssProperties = inlineStyle['cssProperties'];

             if(cssProperties && cssProperties.length > 0) {
                 for(let i = 0; i < cssProperties.length; i++) {
                     let prop = cssProperties[i];
                     let propName = prop['name'];
                     let propValue = prop['value'];

                     // Only capture CSS variable definitions (properties starting with --)
                     if(propName && propName.startsWith('--')) {
                         if (!cssvarDefinedArr.hasOwnProperty(propName)) {
                             cssvarDefinedArr[propName] = [];
                         }

                         // Create unique key for this inline style variable
                         const inlineKey = 'inline-' + aClassname + '-' + propName;
                         const exists = cssvarDefinedArr[propName].some(item => item.key === inlineKey);

                         if (!exists) {
                             cssvarDefinedArr[propName].push({
                                 "key": inlineKey,
                                 "label": aClassname,
                                 "value": propValue,
                                 "media": "",  // inline styles don't have media queries
                                 "selector": "." + aClassname,  // use the element's class as selector
                                 "source": "inline-style"  // mark as coming from inline style
                             });
                             console.log("Inline CSS variable captured: " + propName + " = " + propValue + " on " + aClassname);
                         }
                     }
                 }
             }
         }

         //inherited rules go first, they get unshifted in reverse
         if(inheritedCSSRules.length > 0){
            for(var m = (inheritedCSSRules.length - 1); m >= 0; m--){
                var cRule = inheritedCSSRules[m];
                var inheritedRules = cRule['matchedCSSRules'];
                for(var n = (inheritedRules.length - 1); n >= 0; n--){
                    var iRule = inheritedRules[n];
                    iRule['other_inherited'] = true;
                    var selList = iRule['rule']['selectorList'];
                    var theStyle = iRule['rule']['style'];
                    var stylesheetId = iRule['rule']['style']['styleSheetId'];
                    var ruleOrigin = iRule['rule']['origin'];
                    //console.log("inherited rule fulll");
                    //console.log(iRule);               
                    //if(ruleOrigin && ruleOrigin == "user-agent"){
                    //    console.log("skipped user-agent inherited rule");
                    //    continue;
                    //}
                    var editedCssProperties = new Array();
                    var cssProps = iRule['rule']['style']['cssProperties'];
                    for(var cp = 0;cp < cssProps.length; cp++){
                        var cProp = cssProps[cp];
                        //only add ones with implicit defined because they seem to be ones that are defined
                        //actually in the real css... could also check range if that proves not to work
                        if(cProp.hasOwnProperty('implicit')){
                            editedCssProperties.push(cProp);
                            //console.log("prop implicit");
                            //console.log(cProp);
                        }else{
                            //console.log("removing inherited prop");
                            //console.log(cProp);
                        }
                    }
                    //console.log("props before");
                    //console.log(cssProps);
                    //console.log("props after");
                    //console.log(editedCssProperties);
                    //iRule['rule']['style']['cssProperties'] = editedCssProperties;
                    
                    //console.log("rule selist");
                    //console.log(selList);
                    //console.log("rule style");
                    //console.log(theStyle);                 
                    //if(stylesheetId && stylesheetId.length > 2 && editedCssProperties.length > 0){
                    //    console.log("ADDING INHERITED RULE BECAUSE CAME FROM STYLE");
                        matchedCSSRules.unshift(iRule);
                    //}
                }
                //console.log("inherited rules");
                //console.log(inheritedRules);
            }
         } 
         
         if(!mediaQueriesOnly){
            var psuedoMatch = null;
            for(psuedoMatch of allMatchedStyles['pseudoElements']){
                var psuedoType = psuedoMatch['pseudoType'];
                //console.log("PSEUDO MATCH: " + psuedoType);     
                for(var p = 0; p < psuedoMatch['matches'].length; p++){
                    var pMatch = psuedoMatch['matches'][p];
                    //console.log("pmatch rule");
                    //console.log(pMatch['rule']);
                    if(pMatch['rule']['style']['cssText'] == '\n  -webkit-box-sizing: inherit;\n          box-sizing: inherit;\n' ){
                       console.log("skipping this psuedo inherit rule bullshit");
                       continue;
                    }         
                    pMatch['rule']['rule_type'] = "psuedo";
                    var aRule = {
                        rule: pMatch['rule']
                    };
                    matchedCSSRules.push(aRule);                
                }
                //console.log(psuedoMatch);
            }
           // console.log("getting tag name");
            //GET HOVER STYLES BY FORCING HOVER STATE ONE BY ONE OVER LIKELY HOVER ELEMENTS
           var params = {method: "snipcss_get_tagname", class_selector: "." + aClassname, device_name: currDevice};
           var tagnameResult = await syncSendRequest(tabId, params);         
           var tagName = tagnameResult['result'];
           //console.log("get_tagname was " + tagName);
           try{
               
           if(tagName == 'A' || tagName == 'SPAN' || tagName == 'BUTTON' || tagName == 'DIV' || tagName == 'LI' || tagName == 'IMG'){
                //console.log("found inline tag... forcing hover");
               //MORE PSEUDO MATCHES   
               //instead of hover... maybe just force hover state?

               //cant just force psuedo state... have to force psuedo of all parent elements...
               let forcePsuedo = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: node.nodeId,
                   forcedPseudoClasses: ['hover', 'active']
               });
               //apply hover to all parent elements in case hover is targeting a parent
               let params = {method: "snipcss_get_parentelements", class_selector: "." + aClassname};
               let parentsResult = await syncSendRequest(targetTab.tabId, params);    
               //console.log("got parents result");            
               let pseudoParents = parentsResult['result'];
               //console.log(pseudoParents);

               let psuedoNodes = new Array();
               if(pseudoParents.length > 0){
                   //console.log("processing parent pseudo");
                   var pParents = pseudoParents.split(',');
                   for(var pp = 0; pp < pParents.length; pp++){
                       //console.log("Forcing pseudo on parent " + pParents[pp]);
                       let pnode = await sendCommand(targetTab, 'DOM.querySelector', {
                              nodeId: SNIP_DOC.root.nodeId,
                              selector: '.' + pParents[pp]
                       });     
                       psuedoNodes.push(pnode);
                       let forcePsuedoParent = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: pnode.nodeId,
                           forcedPseudoClasses: ['hover', 'active']
                       });                    
                   }
               }

               var allMatchedStyles2 = await sendCommand(targetTab, 'CSS.getMatchedStylesForNode', {nodeId: node.nodeId}); 
               //console.log("AFTER PSEUDO ALL MATCHES");
               //console.log(allMatchedStyles2);

               var psuedoMatch2 = null;
               var matchNormal = null;
               var matchInherit = null;
               for(matchNormal of allMatchedStyles2['matchedCSSRules']){
                   var ruleHeader = matchNormal['rule']['selectorList']['text'];
                   if(ruleHeader.indexOf(':hover') >= 0){
                        //console.log("NORMAL HOVER HOVER HOVER===========");  
                        //console.log("ruleHeader: " + ruleHeader);
                        matchNormal['rule']['origin'] = 'pseudo';
                        matchedCSSRules.push(matchNormal);
                   }
               }
               for(matchInherit of allMatchedStyles2['inherited']){
                   //console.log("inherit rule");
                   var test = null;
                   for(iRule of matchInherit['matchedCSSRules']){
                       //console.log(iRule['rule']);
                       var ruleHeader = iRule['rule']['selectorList']['text'];
                       if(ruleHeader.indexOf(':hover') >= 0){
                            iRule['inherited'] = true;
                            iRule['rule']['origin'] = 'pseudo';

                            //console.log("INHERIT HOVER HOVER HOVER===========");                                           
                            matchedCSSRules.push(iRule);             
                            //console.log(iRule);                                                                   
                       }                   
                   }             
               }
               for(psuedoMatch2 of allMatchedStyles2['pseudoElements']){
                   var psuedoType = psuedoMatch2['pseudoType'];

                   //console.log("PSEUDO MATCH2: " + psuedoType);     
                   for(var p = 0; p < psuedoMatch2['matches'].length; p++){
                       var pMatch = psuedoMatch2['matches'][p];
                       //console.log("pmatch rule2");
                       //console.log(pMatch['rule']);
                       if(pMatch['rule']['style']['cssText'] == '\n  -webkit-box-sizing: inherit;\n          box-sizing: inherit;\n' ){
                          console.log("skipping this psuedo inherit rule bullshit");
                          continue;
                       }
                       if(pMatch['rule']['selectorList']['text'].indexOf(":hover") >= 0){
                           pMatch['rule']['origin'] = "psuedo";
                           var aRule = {
                              rule: pMatch['rule']
                           };
                           //console.log("PSUEDO HOVER HOVER HOVER===========");                                                                  
                           matchedCSSRules.push(aRule);   
                           //console.log(aRule);
                       }
                   }
               }      
               //try to turn off - not sure if works
               let endPsuedo = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: node.nodeId,
                   forcedPseudoClasses: []
               });        

               if(pseudoParents.length > 0){
                    for(var pn = 0; pn < psuedoNodes.length; pn++){
                        let pnode = psuedoNodes[pn];
                        let endPsuedo2 = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: pnode.nodeId,
                            forcedPseudoClasses: []
                        });        
                    }
                }            


            }
            else if(tagName == 'INPUT'){
               let params = {method: "snipcss_check_checkbox", class_selector: "." + aClassname};
               let isCheckboxRes = await syncSendRequest(targetTab.tabId, params); 
               let isCheckboxOrRadio = isCheckboxRes['result'];
               if(isCheckboxOrRadio == 'yes'){
                   
                    //apply hover to all parent elements in case hover is targeting a parent
                    let params = {method: "snipcss_get_parentelements", class_selector: "." + aClassname};
                    let parentsResult = await syncSendRequest(targetTab.tabId, params);    
                    //console.log("got parents result");            
                    let pseudoParents = parentsResult['result'];
                    //console.log(pseudoParents);

                    let psuedoNodes = new Array();
                    if(pseudoParents.length > 0){
                        //console.log("processing parent pseudo");
                        var pParents = pseudoParents.split(',');
                        for(var pp = 0; pp < pParents.length; pp++){
                            //console.log("Forcing pseudo on parent " + pParents[pp]);
                            let pnode = await sendCommand(targetTab, 'DOM.querySelector', {
                                   nodeId: SNIP_DOC.root.nodeId,
                                   selector: '.' + pParents[pp]
                            });     
                            psuedoNodes.push(pnode);
                            let forcePsuedoParent = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: pnode.nodeId,
                                forcedPseudoClasses: ['hover', 'active']
                            });                    
                        }
                    }                   
                   
                   let allMatchedStyles2 = await sendCommand(targetTab, 'CSS.getMatchedStylesForNode', {nodeId: node.nodeId}); 
                   console.log("FOUND A CHECKBOX");
                   console.log(allMatchedStyles2);

                   let matchNormal = null;
                   for(matchNormal of allMatchedStyles2['matchedCSSRules']){
                       let ruleHeader = matchNormal['rule']['selectorList']['text'];
                       if(ruleHeader.indexOf(':checked') >= 0){
                            console.log("CHECKBOX CHECKBOX CHECKBOX ===========");  
                            //console.log("ruleHeader: " + ruleHeader);
                            matchedCSSRules.push(matchNormal);             
                            console.log(matchNormal);
                       }
                   }    
                   
                   if(pseudoParents.length > 0){
                        for(var pn = 0; pn < psuedoNodes.length; pn++){
                            let pnode = psuedoNodes[pn];
                            let endPsuedo2 = await sendCommand(targetTab, 'CSS.forcePseudoState', { nodeId: pnode.nodeId,
                                forcedPseudoClasses: []
                            });        
                        }
                   }                      
                   
               }
            }
            else{
                //console.log("tagname is " + tagName + " not hover capable apparently")
            }        
            }catch(ehhh){
                console.log("pseudo hover problem???");
                console.log(ehhh);
            }

            var keyframesMatch = null;
            for(keyframesMatch of allMatchedStyles['cssKeyframesRules']){
                //console.log("KEYFRAMES MATCH: ");
                //console.log(keyframesMatch);
                var animationName = keyframesMatch['animationName']['text'];
                //console.log("animation name " + animationName);
                var keypropAssociativeArr = {};
                for(var k = 0; k < keyframesMatch['keyframes'].length; k++){
                    var aKeyframe = keyframesMatch['keyframes'][k];
                    var keyText = aKeyframe['keyText']['text'];
                    var keyStyle = aKeyframe['style'];
                    //console.log("key text " + k + ":");
                    //console.log(keyText);
                    //console.log("key style: ");
                    //console.log(keyStyle);
                    var kProps = keyStyle['cssProperties'];
                    var newKProps = new Array();
                    for(var kp = 0; kp < kProps.length; kp++){
                       //console.log("prop " + p);
                       var myProp = kProps[kp];
                       //console.log(myProp);
                       var aName = myProp['name'];
                       var aVal = myProp['value'];
                       var kLine = new Array();
                       kLine['name'] = aName;
                       kLine['value'] = aVal;        
                       newKProps.push(kLine);
                    }            
                    keypropAssociativeArr[keyText] = newKProps;
                }

                animationKeyframesArr[animationName] = keypropAssociativeArr;

                //console.log("animation keyframes arr now");
                //console.log(animationKeyframesArr);

            }
        }
         
         //maybe get inherited if root node...
         //then we can set base font spacing, fields like that...         
         var aMatched = null;
         for(aMatched of matchedCSSRules){
            let matchingParts = new Array();
            if(aMatched['rule']['origin'] == "user-agent"){
                //console.log("skipping user-agent rule");
                continue;
            }
            //console.log("matched rule");
            //console.log(aMatched);
            
            var styleSheetId = aMatched['rule']['styleSheetId'];
            var theStylesheet = getStylesheetFromId(styleSheetId);
            var stylesheetBase = SITE_URL;
            if(theStylesheet !== null && theStylesheet['source_url']){
                stylesheetBase = theStylesheet['source_url'];
            }            
            //console.log("thestylesheet");
            //ocnsole.log(theStylesheet);
           
            
            var ruleHeader = aMatched['rule']['selectorList']['text'];
            if(ruleHeader.indexOf('col') >= 0){
                //console.log("+++++++++++++col rule");
                //console.log(ruleHeader);
                //console.log(aMatched);
            }
            //console.log("normal rule header   ");
            //console.log(ruleHeader);
            //console.log("class: " + aClassname);
            var ruleBody = aMatched['rule']['style']['cssText'];      
            var mediaQuery = aMatched['rule']['media'];
            var propArr = aMatched['rule']['style']['cssProperties'];
            var stylesheetId = aMatched['rule']['style']['styleSheetId'];
            var mediaSelector = "";
            //console.log("matched rule printing if mediaquery");
            if(mediaQuery && mediaQuery[0]){                
                mediaSelector = mediaQuery[0]['text'];
                var mediaList = mediaQuery[0]['mediaList'];
                if(mediaSelector == "screen"){
                    //why empty screen?
                    //console.log("why empty screen");
                    mediaSelector = "";
                }
                
                //console.log(aMatched);
                //console.log("media query");
                //console.log(mediaQuery);
                //console.log("text");
                //console.log(mediaSelector);
                //console.log("medialist???");
                //console.log(mediaList);
                
            }else{
                mediaQuery = "";
            }
            if(mediaSelector == "" && mediaQueriesOnly){
                continue;
                //if(!mediaQueryClasses.includes(aClassname)){
                //    mediaQueryClasses.push(aClassname);
                //}
            }
            
            var selText = ruleHeader;
            if(selText === undefined || selText.length <= 0)
            {
                console.log("undefined rule header");
                continue;
            }
            
            //we need to split all commas not in parenthesis... 
            //this selector fucked me tonight
            //:where(ul, ol):where([role=list]) 
            
//,\s*(?![^()]*\))
            
            
            var selArr = splitNoParen(selText);   //selText.split(",");
            //new 
            var matchedSelectors = new Array();
            if(aMatched['matchingSelectors']){
               matchedSelectors = aMatched['matchingSelectors'];
               //var theNum = parseInt(aMatched['matchingSelectors'][0]);
            }else{
                //just put all the selectors 
                for(var qq = 0; qq < selArr.length; qq++){
                    matchedSelectors.push(qq);
                }
            }     
            //new new 
            
            var modifiedArr = new Array();
            var generatedFallbackClass = false;  // Track if we generated a fallback class for bare tags
            var ruleSpecificity = 0;
            var ruleDistance = 10000000;


            var usedSelectorsArr = new Array();       
            for(var v = 0; v < selArr.length; v++)
            {               
                if(matchedSelectors.length > 0){
                    for(var ms =0; ms < matchedSelectors.length; ms++){
                        if(matchedSelectors[ms] == v){
                            usedSelectorsArr.push(selArr[v]);
                        }
                    }
                } 
            }
            var usedSelText = selText;
            if(usedSelectorsArr.length > 0){
                usedSelText = usedSelectorsArr.join(',');
            }
            //do I trust ChatGPT that this is equivalent?
            //OLD
            /*
            var foundFix = false;
            let hasContainedElement = false;
            for(var aFix in selectorFixArr)
            {
                if(aFix == selText)//already exists
                {
                    foundFix = true;
                    selText = selectorFixArr[aFix];    
                    hasContainedElement = selectorContainedArr[aFix];
                }
                else if(aFix == usedSelText){
                    //console.log("alternate fix " + usedSelText + " instead of " + selText);
                    foundFix = true;
                    selText = selectorFixArr[aFix];    
                    hasContainedElement = selectorContainedArr[aFix];                    
                    break;
                }                
            }
            */
            //new 
            let foundFix = false;
            let hasContainedElement = false;
            let snipcssClassesApplied = new Array();

            const applyFix = (key) => {
              // First try with property hash (for bare tag rules with different properties)
              let hashKey = key + '|' + hashPropertySet(ruleBody);
              if (selectorFixArr.hasOwnProperty(hashKey)) {
                foundFix = true;
                selText = selectorFixArr[hashKey];
                hasContainedElement = selectorContainedArr[hashKey];
                snipcssClassesApplied = selectorInheritedClassesArr[hashKey] || [];
                return true;
              }
              // Then try without hash (for non-bare-tag rules)
              if (selectorFixArr.hasOwnProperty(key)) {
                foundFix = true;
                selText = selectorFixArr[key];
                hasContainedElement = selectorContainedArr[key];
                snipcssClassesApplied = selectorInheritedClassesArr[key] || [];
                return true;
              }
              return false;
            };
            if (!applyFix(selText)) {
              applyFix(usedSelText);
            }

           
            var badInherited = false;
            
            if(!foundFix)
            {
                //console.log("existing fix for " + selText + " not found");
                for(var c = 0; c < selArr.length; c++)
                {             
                    try{                      
                        if(aMatched['other_inherited'] && !isOtherInheritedProcessed(ruleHeader, ruleBody, mediaSelector)){
                            //console.log("other inherited");
                            //console.log(aMatched);
                            var inheritedSelector = selArr[c];
                            //console.log("elementSelector " + elemSelector);
                            //console.log("inheritedSelector: " + inheritedSelector);
                            var params = {method: "get_element_distance", inherited_selector: inheritedSelector, element_selector: elemSelector};
                            var distanceResult = await syncSendRequest(targetTab.tabId, params);         
                            var theDistance = distanceResult['result'];    
                            //console.log("sitance result ");
                            //console.log(distanceResult);
                            theDistance = parseInt(theDistance);
                            var specificity = calculateSingle(inheritedSelector);
                            var specArr = specificity['specificityArray'];
                            if(theDistance < ruleDistance){
                                //console.log("lower distance " + theDistance);
                                ruleDistance = theDistance;
                            }

                            var score = specArr[1] * 100000000 + specArr[2] * 10000 + specArr[3] * 100;
                            //console.log("score is  " + score);                                                        
                            if(score > ruleSpecificity){
                                //console.log("higher rule specificity is now " + score);
                                ruleSpecificity = score;
                            }
                            var inheritObj = {};
                            inheritObj['selector'] = ruleHeader;
                            inheritObj['body'] = ruleBody;
                            inheritObj['media'] = mediaSelector;                            
                            processedOtherInherited.push(inheritObj);                                
                            
                        }
                        if(aMatched['inherited'] && !isInheritedProcessed(ruleHeader, ruleBody, mediaSelector)){
                            //console.log("INHERITED RULE GETTING SOCRE ");
                            var inheritedSelector = selArr[c];
                            //build the ultimate rule
                            var params = {method: "get_element_distance", inherited_selector: inheritedSelector, element_selector: elemSelector};
                            var distanceResult = await syncSendRequest(targetTab.tabId, params);         
                            var theDistance = distanceResult['result']; 
                            /*
                            var theDistance = await page.evaluate((j,k) => { 
                                return window.snipcssUtils.snipcssGetDistance(j,k);
                            }, inheritedSelector, elemSelector); 
                            */
                            theDistance = parseInt(theDistance);
                            
                            if(theDistance < 0){                                
                                //console.log("THIS CLASS " + aClassname + " has inherited RULE " + inheritedSelector + " that is in SNIPCSS SUBTREE ---- skipping");
                                badInherited = true;
                                var inheritObj = {};
                                inheritObj['selector'] = ruleHeader;
                                inheritObj['body'] = ruleBody;
                                inheritObj['media'] = mediaSelector;                            
                                allBadInherited.push(inheritObj);                                   
                                break;
                            }else{

                                //console.log("the distance of " + inheritedSelector + " is " + theDistance);
                                var specificity = calculateSingle(inheritedSelector);
                                var specArr = specificity['specificityArray'];
                                if(theDistance < ruleDistance){
                                    console.log("lower distance " + theDistance);
                                    ruleDistance = theDistance;
                                }

                                var score = specArr[1] * 100000000 + specArr[2] * 10000 + specArr[3] * 100;
                                //console.log("score is  " + score);                                                        
                                if(score > ruleSpecificity){
                                    //console.log("higher rule specificity is now " + score);
                                    ruleSpecificity = score;
                                }
                                var inheritObj = {};
                                inheritObj['selector'] = ruleHeader;
                                inheritObj['body'] = ruleBody;
                                inheritObj['media'] = mediaSelector;                            
                                processedInherited.push(inheritObj);                                
                            }
                        }else if(aMatched['inherited']){
                            //console.log("already processed inherited " + ruleHeader);
                        }    
                    }catch(emmm){
                        console.log("COLLECTING INHERITED...  BAD SELECTOR " +  selArr[c]);                        
                        console.log(emmm);                        
                    }                            
                }
                if(aMatched['inherited']){
                    //console.log("final score: " + ruleSpecificity + " distance " + ruleDistance);
                }
                if(aMatched['other_inherited']){
                    //console.log("other inherited final score: " + ruleSpecificity + " distance " + ruleDistance);
                }                
                for(var k = 0; k < usedSelectorsArr.length; k++)
                {                         
                    try{                    
                        var myOrigSelector = usedSelectorsArr[k];
                        usedSelectorsArr[k] = usedSelectorsArr[k].trim();
                        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], ">", " > ");
                        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "+", " + ");
                        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "~", " ~ ");
                        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "  ", " ");          
                        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "::", ":");                                  
                        //console.log("ORIGINAL SELECTOR: " + usedSelectorsArr[k] + "    len " + usedSelectorsArr[k].length);
                        if(myOrigSelector.trim() == 'body' || myOrigSelector.trim() == 'html'){
                            hasContainedElement = true;
                        }
                        let otherInherited = false;
                        if(aMatched['other_inherited']){
                            otherInherited = true;
                        }                    
                        
                        let noPseudoSelector = "";
                        if(usedSelectorsArr[k] in noPseudoSelectors){
                            noPseudoSelector = noPseudoSelectors[usedSelectorsArr[k]];
                        }else{
                            try{
                                noPseudoSelector = stripPseudos(usedSelectorsArr[k]);
                                noPseudoSelectors[usedSelectorsArr[k]] = noPseudoSelector;
                            }catch(pex){
                                console.log("PARSEL COULDNT PARSE...  BAD SELECTOR " +  usedSelectorsArr[k]);                        
                                noPseudoSelectors[usedSelectorsArr[k]] = usedSelectorsArr[k];
                                console.log(pex);                        
                            }       
                        }                                                
                        
                        if(aMatched['inherited']){
                            //just skip for now... leave selector
                            //console.log("inherited, just leave as is");
                            //console.log(myOrigSelector);
                            //remove slashes
                            //myOrigSelector = myOrigSelector.replace(/\\/g, "");
                            modifiedArr.push(myOrigSelector);
                            hasContainedElement = true;
                        }
                        else if(usedSelectorsArr[k].indexOf(':where(') !== -1 || 
                                usedSelectorsArr[k].indexOf(':not(') !== -1 ||
                                usedSelectorsArr[k].indexOf(':has(') !== -1 || 
                                usedSelectorsArr[k].indexOf(':is(') !== -1){
                            /*
:not()
:has()
:is()
:where()
                             */
                                                        //remove slashes
                            //myOrigSelector = myOrigSelector.replace(/\\/g, "");
                            
                            console.log("advanced selector: " );
                            console.log(usedSelectorsArr[k]);
                            
                            let fixedResult = null;
                            if (selectorPartialFixArr.hasOwnProperty(usedSelectorsArr[k])) {
                                fixedResult = selectorPartialFixArr[usedSelectorsArr[k]];
                            }else{                                                        
                                let params = {method: "snipcss_fix_selector", test_selector: usedSelectorsArr[k], root_selector: elemSelector, other_inherited: otherInherited, label_class: aClassname, nopseudo_selector: noPseudoSelector};
                                fixedResult = await syncSendRequest(tabId, params);
                                selectorPartialFixArr[usedSelectorsArr[k]] = fixedResult;
                            }
                            let fixedSelector = fixedResult['result'];
                            let fixedContained = fixedResult['result_contained'];
                            let targetFound = fixedResult['target_found'];
                            if(fixedContained == '0'){
                                
                            }else{
                                hasContainedElement = true;
                            }
                            if(targetFound == '1'){
                                matchingParts.push(fixedSelector);
                            }            
                            
                            //aMatched['included_type'] = fixedContained + "|" + targetFound;
                            
                            console.log("advanced selector, but did it anyway. fixed result: ");
                            console.log(fixedSelector);
                            if(fixedSelector == ""){
                                //failure just use same
                                console.log("failure to fix advanced selector");
                                fixedSelector = myOrigSelector;
                            }
                            //remove slashes
                            //fixedSelector = fixedSelector.replace(/\\/g, "");
                            //console.log("replacing " +allElementSelectors[selIndex] + " with " + allCssSelectors[selIndex]);
                            fixedSelector = replaceAll(fixedSelector, allElementSelectors[selIndex], allCssSelectors[selIndex]);
                            if(!modifiedArr.includes(fixedSelector)){
                                modifiedArr.push(fixedSelector);                                     
                            }
                        }
                        else{
                            //console.log("fixing a selector ");
                            //console.log(usedSelectorsArr[k]);
                            //console.log("match data");
                            //console.log(aMatched);
                            //console.log('with root');
                            //console.log(elemSelector);
                            
                            let fixedResult = null;
                            if (selectorPartialFixArr.hasOwnProperty(usedSelectorsArr[k])) {
                                fixedResult = selectorPartialFixArr[usedSelectorsArr[k]];
                            }else{                                                        
                                let params = {method: "snipcss_fix_selector", test_selector: usedSelectorsArr[k], root_selector: elemSelector, other_inherited: otherInherited, label_class: aClassname, nopseudo_selector: noPseudoSelector};
                                fixedResult = await syncSendRequest(tabId, params);
                                selectorPartialFixArr[usedSelectorsArr[k]] = fixedResult;
                            } 
                            //old
                            //var params = {method: "snipcss_fix_selector", test_selector: usedSelectorsArr[k], root_selector: elemSelector};
                            //var fixedResult = await syncSendRequest(tabId, params);
                            var fixedSelector = fixedResult['result'];
                            var fixedContained = fixedResult['result_contained'];
                            let targetFound = fixedResult['target_found'];
                            if(fixedContained == '0'){
                                
                            }else{
                                hasContainedElement = true;
                            }           
                            if(targetFound == '1'){
                                //console.log("pushing matching part: " + fixedSelector);
                                matchingParts.push(fixedSelector);
                            }          
                            //aMatched['included_type'] = fixedContained + "|" + targetFound;
                            //fixedSelector = replaceAll(fixedSelector, ":after", "::after");
                            
                            /*
                            var fixedSelector = await page.evaluate((d,e) => { 
                                return window.snipcssUtils.snipcssFixSelector(d,e);
                            }, usedSelectorsArr[k], elemSelector);  
                            */
                            if(fixedSelector == ""){
                                //failure just use same
                                //console.log("FAILURE FAILURE to fix selector");
                                //console.log("making " + selText);
                                //console.log("always be " + myOrigSelector);
                                //matchingParts.push(myOrigSelector);
                                selectorFixArr[selText] = selText;
                                selectorContainedArr[selText] = "1";
                                fixedSelector = myOrigSelector;
                            }
                            //remove slashes
                            //fixedSelector = fixedSelector.replace(/\\/g, "");
                            
                            //i dont know what the fuck i'm doing
                            //console.log("fixed avg result");
                            //console.log(fixedSelector);
                            let fixTrim = fixedSelector.trim();
                            let origTrim = myOrigSelector.trim();
                            let isBareTag = (fixTrim == "div" || fixTrim == "p" || fixTrim == "h1" ||
                                     fixTrim == "h2" || fixTrim == "h3" || fixTrim == "h4" || fixTrim == "h5" ||
                                     fixTrim == "h6" || fixTrim == "article" || fixTrim == "span" || fixTrim == "section" ||
                                     fixTrim == "a" || fixTrim == "ul" || fixTrim == "li" || fixTrim == "img" ||
                                     fixTrim == "svg" || fixTrim == "button" || fixTrim == "modal" ||
                                     fixTrim == "nav" || fixTrim == "footer" || fixTrim == "grid" ||
                                     fixTrim == "aside" || fixTrim == "sidebar" || fixTrim == "hr");
                            // Only generate fallback if we actually cut off parent selectors
                            // (i.e., original was more than just a bare tag)
                            let wasCutOff = (origTrim !== fixTrim);

                            if (isBareTag && wasCutOff) {
                                // Generate fallback class based on CSS properties
                                let propHash = hashPropertySet(ruleBody);
                                let fallbackClass;

                                let isReused = false;
                                if (fallbackClassMap[propHash]) {
                                    fallbackClass = fallbackClassMap[propHash];
                                    isReused = true;
                                } else {
                                    // Format: gen-XYZ-first10chars (3 random + 10 from selector)
                                    let selectorPart = selText.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 10);
                                    fallbackClass = "gen-" + randomLetters(3) + "-" + selectorPart;
                                    fallbackClassMap[propHash] = fallbackClass;
                                }

                                // Log the fallback rule details
                                console.log("[FALLBACK] " + (isReused ? "REUSE" : "NEW") + " ." + fallbackClass +
                                    " | original: " + selText +
                                    " | bare: " + fixTrim +
                                    " | marker: " + aClassname +
                                    " | rules: " + ruleBody.replace(/\n/g, ' ').substring(0, 100));

                                // Apply fallback class to allLabelOuterHtml (has markers)
                                let markerSelector = '.' + aClassname;
                                allLabelOuterHtml[selIndex] = addClassToTag(allLabelOuterHtml[selIndex], markerSelector, fallbackClass);

                                // Sync to other arrays by stripping marker classes
                                allElementOuterHtml[selIndex] = stripMarkerClasses(allLabelOuterHtml[selIndex]);
                                allZipOuterHtml[selIndex] = stripMarkerClasses(allLabelOuterHtml[selIndex]);

                                // Use fallback class instead of bare tag
                                fixedSelector = "." + fallbackClass;
                                generatedFallbackClass = true;
                            }                            
                            
                            //console.log("replacing " +allElementSelectors[selIndex] + " with " + allCssSelectors[selIndex]);
                            fixedSelector = replaceAll(fixedSelector, allElementSelectors[selIndex], allCssSelectors[selIndex]);
                            if(!modifiedArr.includes(fixedSelector)){
                                modifiedArr.push(fixedSelector);            
                            }
                            //console.log("NEW SELECTOR: " + fixedSelector);
                        }
                    }catch(exxx){
                        console.log("FIX FIX FIX FIX...  BAD SELECTOR " +  usedSelectorsArr[k]);                        
                        console.log(exxx);                        
                    }                    
                }
                if(modifiedArr.length <= 0){
                    console.log("empty bad seflector: " + selText);
                    continue;
                }

                
                var newSelector = modifiedArr.join(",");
                
                /*
                if(aMatched['other_inherited']){
                    console.log("Getting snipcss classes for other inherited:");
                    console.log(newSelector);
                    let params = {method: "snipcss_matching_elements", test_selector: newSelector};
                    let labelsResult = await syncSendRequest(tabId, params);    
                    let matchInherited = labelsResult['result'];
                    console.log(matchInherited);
                    if(matchInherited.length > 0){
                        //console.log("processing parent pseudo");
                        snipcssClassesApplied = matchInherited.split(',');
                    }                    
                    
                }                
                */
                
                // Include property hash in cache key when we generated a fallback class
                let cacheKey = usedSelectorsArr.join(',');
                if (generatedFallbackClass) {
                    cacheKey += '|' + hashPropertySet(ruleBody);
                }
                selectorFixArr[cacheKey] = newSelector;
                selectorContainedArr[cacheKey] = hasContainedElement;
                selectorInheritedClassesArr[cacheKey] = snipcssClassesApplied;
                
                //DOES NOT WORK BECAUSE usedSelectorArr is not all selectors
                //if(usedSelectorsArr.join(',') != ruleHeader){
                //console.log(usedSelectorsArr.join(',') + " VS " + ruleHeader);
                //selectorFixArr[ruleHeader] = newSelector;
                //}
                
                selText = newSelector;
                //console.log("FULL SELECTOR: " + selText);
                //console.log("NOW= SELECTOR: " + newSelector);
                               
                //end of finding a fix for the selector, if it doesn't apply to subtree
            }
            else {
                //when not inherited it could be good?
                if(aMatched['inherited']){
                    //console.log("iiiiiiiiiiiiiiiinherited2");
                    if(isInheritedBad(ruleHeader, ruleBody, mediaSelector)){
                        continue;
                    }else{
                        //ugh ugh fuck me buddy...
                        var badGuy = false;
                        for(var xx =0; xx < usedSelectorsArr.length; xx++){
                            var inheritedSelector = usedSelectorsArr[xx];
                            //build the ultimate rule
                            var params = {method: "get_element_distance", inherited_selector: inheritedSelector, element_selector: elemSelector};
                            var distResult = await syncSendRequest(tabId, params);
                            var theDistance = distResult['result'];
                            theDistance = parseInt(theDistance);
                            if(theDistance < 0){
                                console.log("%%%%%%%%%%%%% BAD GUY %%%%%%%%%%%%%%%");
                                badGuy = true;
                                var inheritObj = {};
                                inheritObj['selector'] = ruleHeader;
                                inheritObj['body'] = ruleBody;
                                inheritObj['media'] = mediaSelector;                            
                                allBadInherited.push(inheritObj);                                   
                            }
                        }
                        if(badGuy){
                            continue;
                        }
                        
                    }
                }
            }
            if(badInherited){
                continue;
            }
            var allProperties = "";                        
            var propArr = aMatched['rule']['style']['cssProperties'];
            var stylesheetId = aMatched['rule']['style']['styleSheetId'];
            var lineNum = 9999999999;
            if(aMatched['rule']['style']['range'] && aMatched['rule']['style']['range']['startLine']){
                lineNum = aMatched['rule']['style']['range']['startLine'] * 10000000;
                lineNum += aMatched['rule']['style']['range']['startColumn'];                
            }else{
                //console.log("bad rule with no range?");
                //console.log(aMatched['rule']);
            }
            //console.log("orig css props");
            //console.log(propArr);
            var newPropArr = new Array();
            var newPropNameArr = new Array();
            let inType = "default";
            if(aMatched['other_inherited']){
                inType = "other_inherited";
            }else if(aMatched['inherited']){
                inType = "inherited";
            }
            //let containType = aMatched['included_type'];
            
            for(var p = 0; p < propArr.length; p++){
                //console.log("prop " + p);
                var myProp = propArr[p];
                //console.log(myProp);
                var lineName = myProp['name'];
                var lineVal = myProp['value'];
                lineVal = lineVal.replace(/\r?\n/g, "");
                    //let allRules = new Array();
                    /*
                    let lineMergeArr = ruleBody.split(';');
                    let newLineMergeArr = [];
                    for(let nr = 0; nr < lineMergeArr.length; nr++){
                        let lineMerge = lineMergeArr[nr].replace(/\r?\n/g, "");
                        newLineMergeArr.push(lineMerge);
                    }   
                    let newBody = newLineMergeArr.join(';' + '\n');
                    newBody = newBody.trim(); // remove trailing newline                    
                    snippedData['body'] = newBody;                
                    */
                
                //console.log(lineVal);
                //no fonts                
                
                if(lineName == 'font-family'){
                    for(var e = 0; e < customfontsArr.length; e++){
                        var exFont = customfontsArr[e];
                        var externalFontName = exFont['face_noquotes'];
                        //console.log("comparing seeing if " + externalFontName + " inside " + lineVal);                        
                        if(lineVal.indexOf(externalFontName) >= 0){
                            //console.log('&&&&&&&&&&&&& SETTING FONT USED ');
                            //console.log(externalFontName);
                            customfontsArr[e]['used'] = true;
                        }
                    }
                }
                
                if (resolveVariables == 'yes' && lineName.startsWith('--')) {
                    if (!cssvarDefinedArr.hasOwnProperty(lineName)) {
                        cssvarDefinedArr[lineName] = [];
                    }

                    // Create the key we want to check
                    const newKey = mediaSelector + selText + lineVal;

                    // Check if an object with this key already exists in the array
                    const exists = cssvarDefinedArr[lineName].some(item => item.key === newKey);

                    // Only push if the key doesn't exist
                    if (!exists) {
                        cssvarDefinedArr[lineName].push({
                            "key": newKey,
                            "label": aClassname,
                            "value": lineVal,
                            "media": mediaSelector,
                            "selector": selText
                        });
                    }
                }

                
                if(myProp.hasOwnProperty('disabled')){
                    if(myProp['disabled'] === true){
                        //console.log("SKIPPING DISABLED PROPERTY");
                        //console.log(lineName + ":" + lineVal);
                        continue;
                    }                  
                }
                if(myProp.hasOwnProperty('implicit')){

                }else{
                    //console.log("SKIPPING IMPLICIT PROPERTY");
                    //console.log(lineName + ":" + lineVal);
                    continue;
                }                
                

                var allLineVals = lineVal.split(',');
                for(var a = 0; a < allLineVals.length; a++){
                    var myLine = allLineVals[a];
                    //multiple???????
                    if(myLine.indexOf('url') >= 0){
                        var imageUrl = myLine;
                        try{
                            imageUrl = myLine.match(/\((.*?)\)/)[1].replace(/('|")/g,'');
                        }catch(ex){
                            //console.log("image url " + imageUrl + " could not remove url portion");
                        }
                        imageUrl = replaceAll(imageUrl, "'", "");
                        imageUrl = replaceAll(imageUrl,'"', "");
                        imageUrl = replaceAll(imageUrl,")", "");
                        imageUrl = replaceAll(imageUrl,"url(", "");
                        imageUrl = replaceAll(imageUrl,"(", "");
                        
                        
                        //console.log("*************FOUND A URL IN THE CSS");
                        //skip data urls
                        if(imageUrl.substring(0,4).toLowerCase() !== 'data'){                        
                             var fullUrl = URI.resolve(stylesheetBase, imageUrl);
                             //console.log("CSS IMAGE: " + imageUrl);
                             //console.log("BASESHEEIIIT: " + stylesheetBase);
                             //console.log("Resolved: " + fullUrl);
                             var nameOfImage = "";
                             var skipDownload = false;
                             if(fullUrl.indexOf("\/") >= 0)
                             {
                                var sArr = fullUrl.split("\/");
                                var imgName = sArr[sArr.length - 1];
                                nameOfImage = imgName;
                                if(nameOfImage.indexOf("#") === 0){
                                   let hashId = nameOfImage.substring(1);
                                   //console.log("Hash Image");
                                   //console.log(myProp);
                                   if(allElementOuterHtml.indexOf(hashId) === -1){
                                       //console.log("we should copy this svg filter?");
                                       svgFilterReferences.push(nameOfImage);
                                   }
                                   continue; 
                                }
                                
                                var replaceUrl = SNIP_PATH_TO_IMAGES + imgName;
                                var exists = allImageNames.includes(replaceUrl);
                                if(exists){
                                    for(var z = 0; z < cssImages.length; z++){
                                        var ccImage = cssImages[z];
                                        //already downloaded
                                        if(ccImage['url'] == fullUrl){
                                            skipDownload = true;
                                        }
                                    }
                                    if(!skipDownload){
                                        nameOfImage = randomLetters(5) + "_" + imgName;
                                        replaceUrl = SNIP_PATH_TO_IMAGES + nameOfImage;
                                    }
                                }
                                allImageNames.push(replaceUrl);
                                
                                //we'll save the replace url... in case downloading in future, but use fullUrl for now
                                lineVal = lineVal.replace(imageUrl, fullUrl);
                             }          
                             
                             if(nameOfImage.indexOf("?") !== -1){
                                nameOfImage = nameOfImage.split("?")[0];
                             }
                             
                             if(!skipDownload){
                                 cssImages.push({url: fullUrl, name: nameOfImage});
                             }
                        }else{
                            //console.log("oh it's a data url");
                        }
                    }
                }    
                //for css variables      
                addCssVariableFromVal(lineVal);
                
                
                /*
                var MY_ULTIMATE;
                if(selIndex in SUPER_ULTIMATE){
                    MY_ULTIMATE = SUPER_ULTIMATE[selIndex];
                }else{
                    SUPER_ULTIMATE[selIndex] = new Array();
                }
                */
                //too fucking hard for this release to make this multiple 
                
                //the ultimate got complicated
                var line = "    " + lineName + ": " + lineVal + ";";
                try{
                    if(aMatched['other_inherited'] && selIndex == 0 && aClassname == 'snipcss0-0-0-1'){
                        
                        //console.log("GETTING ULTIMATE OF OTHER INHERITED");
                        //console.log(aMatched);
                        //if(lineName == 'text-align'){
                        //    console.log("text align rule");
                        //    console.log(aMatched);
                        //}
                        let checkMedia = "none";
                        if(mediaSelector !== ""){
                            checkMedia = mediaSelector;
                        }
                        checkMedia += '|body';
                        if(!(checkMedia in THE_ULTIMATE)){
                            THE_ULTIMATE[checkMedia] = new Array();
                        }                        
                        //console.log("adding checkmedia for " + ruleHeader);
                        // Give ancestor rules priority for visual properties (background/color)
                        let effectiveDistance = ruleDistance;
                        if(lineName == 'background-color' || lineName == 'color' || lineName == 'background'){
                            effectiveDistance = Math.max(0, ruleDistance - 1);
                        }
                        if(!(lineName in THE_ULTIMATE[checkMedia])){
                            THE_ULTIMATE[checkMedia][lineName] = effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                                                              
                            //console.log("checkMedia ultimateover11 " + checkMedia + " prop " + lineName + " with " + ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);
                            
                        }else{
                            var currUltimate = THE_ULTIMATE[checkMedia][lineName];
                            if(currUltimate && currUltimate.length > 0){
                                var currDistance = parseInt(currUltimate.split("|")[0]);
                                var currSpecificity = parseInt(currUltimate.split("|")[1]);
                                if(effectiveDistance < currDistance){
                                    THE_ULTIMATE[checkMedia][lineName] = effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                                    //console.log("checkMedia ultimateover222 " + ultMedia + " prop " + lineName + " with " + effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);
                                }else if(effectiveDistance == currDistance){
                                    if(ruleSpecificity >= currSpecificity){
                                        //console.log("ultimateover3 " + ultMedia + " prop " + lineName + " with " + effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);
                                        THE_ULTIMATE[checkMedia][lineName] = effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                                        //console.log("checkMedia ultimateover333 " + checkMedia + " prop " + lineName + " with " + effectiveDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);
                                    }
                                }
                            }
                        }
                    }
                    if(aMatched['inherited'] && selIndex == 0){                        
                        var ultMedia = "none";
                        if(mediaSelector !== ""){
                            ultMedia = mediaSelector;
                        }
                        //special tags... let's keep html, body tags for their font sizes
                        //Fuck the em
                        for(var d = 0; d < usedSelectorsArr.length; d++)
                        {                         
                            var aSelector = usedSelectorsArr[d].trim();
                            if(aSelector == 'html'){
                                ultMedia += '|html';
                                //console.log("should be adding an html one");
                            }
                            if(aSelector == 'body'){
                                ultMedia += '|body';
                            }
                            if(aSelector == 'a'){
                                ultMedia += '|a';                                
                            }
                            if(aSelector == 'img'){
                                ultMedia += '|img';                                
                            }
                            //we should add for every tag type... and only use global
                            //because if there's an a {color:white} rule why should it be put on global inherited list
                        }

                        if(lineName == 'color'){
                            //console.log("------- color rule ----- " + lineVal);
                            //console.log("On " + usedSelectorsArr.join(','));
                            //console.log("IS INHERITED");
                        }
                        if(lineName == 'unicode-range'){
                            console.log("ultimate unicode range");
                        }

                        if(!(ultMedia in THE_ULTIMATE)){
                            THE_ULTIMATE[ultMedia] = new Array();
                        }
                        if(!(lineName in THE_ULTIMATE[ultMedia])){
                            THE_ULTIMATE[ultMedia][lineName] = ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                            //console.log("ultimateover " + ultMedia + " prop " + lineName + " with " + ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);                            
                        }else{
                            var currUltimate = THE_ULTIMATE[ultMedia][lineName];
                            if(currUltimate && currUltimate.length > 0){
                                var currDistance = parseInt(currUltimate.split("|")[0]);
                                var currSpecificity = parseInt(currUltimate.split("|")[1]);
                                if(ruleDistance < currDistance){
                                    THE_ULTIMATE[ultMedia][lineName] = ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                                    //console.log("ultimateover2 " + ultMedia + " prop " + lineName + " with " + ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);                                     
                                }else if(ruleDistance == currDistance){
                                    if(ruleSpecificity >= currSpecificity){
                                        //console.log("ultimateover3 " + ultMedia + " prop " + lineName + " with " + ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal);                                                                       
                                        THE_ULTIMATE[ultMedia][lineName] = ruleDistance.toString() + "|" + ruleSpecificity.toString() + "|" + lineVal;
                                    }
                                }                        
                            }
                        }
                        //for css varilables
                        addCssVariableFromVal(lineVal);

                    }else{
                        
                        //exclude some things if not needed HERE
                        //for example rules that have vendor prefixes
                        //rules that are unicode ranges
                        //
                        var skipThisLine = false;                  
                        if(lineName == 'unicode-range'){
                            //console.log("normal unicoderange");
                            skipThisLine = true;
                        }
                        else if(lineVal == '' || lineVal.length <= 0){
                            skipThisLine = true;
                        }
                        if(!skipThisLine){
                            let foundNameIndex = -1;
                            //this is to fix duplicates... i don't know why there are duplicates (seems to be in inherited rules)
                            for(let ln = 0; ln < newPropNameArr.length; ln++){
                                if(newPropNameArr[ln] == lineName){
                                    //replae this index
                                    //if either current line or old line has vendor prefix dont merge
                                    var oldPropSplit = newPropArr[ln].split(':');
                                    if(oldPropSplit.length > 1 && oldPropSplit[1].indexOf('-') == -1 && lineVal.indexOf('-') == -1){
                                        foundNameIndex = ln;
                                    }
                                }
                            }
                            if(foundNameIndex < 0){
                                newPropArr.push(line);
                                newPropNameArr.push(lineName);                                
                            }else{
                                //replace the value line with current line because previous one had same property
                                //font-size: 14px;
                                //font-size: 2rem;  //would only use the second one
                                //merge basically
                                //do not do this for vendor prefixes 
                                newPropArr[foundNameIndex] = line;
                            }
                        }
                    }
                }catch(exx){
                    console.log("ULTIMATE ERROR ");
                    console.log(exx);
                }
            }
            //console.log("rulebody before");
            //console.log(propArr);
            //console.log("rulebodyAfter");
            //console.log(newPropArr.join(" \n"));
            
            
            ruleBody = newPropArr.join(" \n");       
            var alreadySnippedIndex = alreadySnippedWhole(selText, ruleBody, mediaSelector);
            if(alreadySnippedIndex >= 0)  
            {
                var someProblem = snippedArr[alreadySnippedIndex];               
                if(!matchingFinalRules[aClassname]['indices'].includes(alreadySnippedIndex)){
                    matchingFinalRules[aClassname]['indices'].push(alreadySnippedIndex);
                    matchingFinalRules[aClassname]['selectors'].push(selText);
                    matchingFinalRules[aClassname]['bodies'].push(ruleBody);
                    matchingFinalRules[aClassname]['media_queries'].push(mediaSelector); 
                    matchingFinalRules[aClassname]['inherited_type'].push(inType);
                    if(selText in selectorInheritedClassesArr){
                        snipcssClassesApplied = selectorInheritedClassesArr[selText];
                    }                             
                    matchingFinalRules[aClassname]['inherited_classes'].push(snipcssClassesApplied);
                    //copy invalid psuedo flag in snippedArr
                    matchingFinalRules[aClassname]['invalid_pseudos'].push(someProblem['invalid_pseudos']);
                    if(matchingParts.length <= 0){
                        let fullPartsArr = splitNoParen(selText);
                        let matchedParts = [];

                        if(aMatched['rule']['origin'] == 'pseudo'){
                            // For pseudo-element rules (like clearfix patterns), include ALL parts
                            // with pseudo-elements since the browser already matched this rule
                            for (let f = 0; f < fullPartsArr.length; f++) {
                                let fPart = fullPartsArr[f].trim();
                                if(fPart.indexOf(":") >= 0) {
                                    matchedParts.push(fPart);
                                }
                            }
                        }

                        // Fallback to first part if nothing matched
                        if(matchedParts.length === 0){
                            matchedParts.push(fullPartsArr[0].trim());
                        }

                        matchingFinalRules[aClassname]['matching_parts'].push(matchedParts);
                    }else{
                        matchingFinalRules[aClassname]['matching_parts'].push(matchingParts);
                    }
                }else{
                    if(inType == 'default'){
                        //we have to switch other_inherited to default for rules that are both inherited and matched
                        for(let ee = 0; ee < matchingFinalRules[aClassname]['indices'].length; ee++){
                            if(matchingFinalRules[aClassname]['indices'][ee] == alreadySnippedIndex){
                                //console.log("previous rule now matched rule: " + alreadySnippedIndex);
                                let prevSelector = matchingFinalRules[aClassname]['selectors'][ee];
                                let prevType = matchingFinalRules[aClassname]['inherited_type'][ee];
                                let prevBody = matchingFinalRules[aClassname]['bodies'][ee];
                                
                                //console.log("prevselector: " + prevSelector);
                                //console.log("prevbody: " + prevBody);
                                //console.log("prevtype: " + prevType);
                                
                                if(prevType == 'other_inherited'){
                                    if(prevSelector.indexOf('.') < 0 && prevSelector.indexOf('#') < 0){
                                        //console.log("UGHHHHHIKSGHJH - skipping because its probably inherited that applies to everything");
                                        continue;
                                    }            
                                    //console.log("CLASSNAME: " + aClassname);
                                    //console.log("SETTING FORMERLY INHERITED TO DEFAULT FOR RULE INDEX: " + ee);
                                    //console.log(prevSelector);
                                    //console.log(someProblem);
                                    //console.log("selector added " + prevSelector);
                                    //if(prevBody.indexOf('border-color') >= 0){
                                    //    console.log("BAD BODY");
                                    //}
                                    matchingFinalRules[aClassname]['inherited_type'][ee] = 'default';
                                    continue;
                                }
                            }
                        }
                    }                   
                }
                //console.log("------------skipping existing selector..." + ruleHeader);
                //for now just skip?  but should make new one if not same value for allProper         
            }
            else if(!hasContainedElement){
                //console.log("SKIPNOT CONTAINED::: " + selText);                
            }
            else
            {
                //new rule body
                
                //console.log("amatched");
                //console.log(aMatched);
                console.log("--------new selector... " + mediaSelector);           
                console.log(selText + " {");
                console.log(ruleBody);
                console.log("}");  
                //console.log("orig ruleheader: " + ruleHeader);
                
               
                if(selText.indexOf('body') >= 0){
                    //console.log("------------body rule...");
                    //console.log(selText + " {");
                    //console.log(ruleBody);
                    //console.log("}");         
                    //console.log("------------body data...");
                    //console.log(aMatched['rule']);
                    //console.log("------------body source url... ");
                    //console.log(stylesheetBase);
                }
                
                var mergedIt = false;
                let doMerging = false;
                /*
                if(snippedArr.length > 0){
                    var lastSnippet = snippedArr[snippedArr.length - 1];
                    //we don't have to check for merged_skip here, because last one is always the merged result... so next rule will
                    //merge into that one
                    
                    if(doMerging && lastSnippet['selector'] == selText && lastSnippet['media'] == mediaSelector){
                        
                        //console.log("LAST RULES MATCHED");
                        //console.log(selText);
                        //console.log(mediaSelector);
                        //last snipped rule is same selector and same media... can't we just merge into one?
                        //but then we need to still have both rules in there, otherwise when processing alreadySnippedWhole won't work
                        let allRules = new Array();
                        let allUsedProps = new Array();
                        let lastRuleSplit = lastSnippet['body'].split(/\r?\n/);
                        let newRuleSplit = ruleBody.split(/\r?\n/);
                        for(let lr = 0; lr < lastRuleSplit.length; lr++){
                            var colonSplit = lastRuleSplit[lr].split(":");
                            var ruleProp = colonSplit[0];
                            var ruleVal = "";
                            if(colonSplit.length > 1){
                                colonSplit.shift();
                                ruleVal = colonSplit.join(":");
                            }                         
                            var keepThisOne = false;
                            for(let nr = 0; nr < newRuleSplit.length; nr++){
                                var colonSplit2 = newRuleSplit[nr].split(":");
                                var newProp = colonSplit2[0];
                                var testRuleVal = "";
                                if(colonSplit2.length > 1){
                                    testRuleVal = colonSplit2[1];
                                }
                                //do not overwrite if vendor prefix rule like -moz-flex-box; 
                                //that rule is not applied/valid
                                if(newProp == ruleProp && colonSplit2.length > 1){
                                    if(testRuleVal.startsWith("-") || newProp.trim() == 'flex-basis'){
                                        //console.log("merged found flex-basis rule");
                                        //console.log(ruleProp);
                                        //console.log(testRuleVal);
                                        keepThisOne = true;
                                    }else{
                                        colonSplit2.shift();
                                        ruleVal = colonSplit2.join(":");
                                        //console.log("XXXXXXXXXX merged property " + newProp);
                                        //console.log("rule val " + ruleVal);
                                    }
                                }                                   
                            }                            
                            
                            if(!keepThisOne){
                                allUsedProps.push(ruleProp);
                            }
                            
                            if(ruleProp.trim() == '' || ruleVal.trim() == ''){
                                console.log("Skipping empty ruleprop or ruleval 1111");                                
                                continue;
                            }
                            
                            if(ruleProp.trim() == 'display'){
                                console.log("FOUND A DISPLAY, PUTTING AT START");
                                allRules.unshift(ruleProp + ": " + ruleVal);                                                                                   
                            }else{
                                allRules.push(ruleProp + ": " + ruleVal);
                            }                            
                            
                        }
                        
                        for(let br = 0; br < newRuleSplit.length; br++){
                            var colonSplit3 = newRuleSplit[br].split(":");
                            var secondaryProp = colonSplit3[0];
                            if(allUsedProps.includes(secondaryProp)){
                                continue;
                            }
                            if(secondaryProp.trim() == ''){
                                console.log("Skipping empty ruleprop or ruleval 2222");                                
                                continue;
                            }                            
                            
                            if(secondaryProp.trim() == 'display'){
                                console.log("FOUND A DISPLAY2, PUTTING AT START");
                                allRules.unshift(newRuleSplit[br]);                                                                                        
                            }else{
                                allRules.push(newRuleSplit[br]);
                            }
                        }           
                        snippedArr[snippedArr.length - 1]['merged_skip'] = true;
                        var snippedData = {};
                        snippedData['selector'] = selText;
                        snippedData['body'] = ruleBody;
                        snippedData['media'] = mediaSelector;
                        snippedData['stylesheet_id'] = stylesheetId;
                        snippedData['line_num'] = lineNum;
                        snippedData['the_classname'] = aClassname;
                        
                        
                        //index of the element
                        snippedData['sel_index'] = selIndex;  
                        snippedData['simple_selector'] = false;                              
                        snippedData['merged_skip'] = true;
                        snippedData['device'] = currDevice;
                        snippedData['inherited_type'] = inType;
                        if(!matchingFinalRules[aClassname]['indices'].includes(snippedData.length)){
                            matchingFinalRules[aClassname]['indices'].push(snippedData.length);
                            matchingFinalRules[aClassname]['selectors'].push(snippedData['selector']);
                            matchingFinalRules[aClassname]['bodies'].push(snippedData['body']);
                            matchingFinalRules[aClassname]['media_queries'].push(snippedData['media']); 
                            matchingFinalRules[aClassname]['inherited_type'].push(inType);    
                            matchingFinalRules[aClassname]['inherited_classes'].push(snipcssClassesApplied);                            
                            if(matchingParts.length <= 0){
                                let fullPartsArr = splitNoParen(selText);
                                let matchedParts = [];
                                // Include ALL parts with pseudo-elements for clearfix patterns
                                for (let f = 0; f < fullPartsArr.length; f++) {
                                    let fPart = fullPartsArr[f].trim();
                                    if(fPart.indexOf(":") >= 0) {
                                        matchedParts.push(fPart);
                                    }
                                }
                                if(matchedParts.length === 0){
                                    matchedParts.push(fullPartsArr[0].trim());
                                }
                                matchingFinalRules[aClassname]['matching_parts'].push(matchedParts);
                            }else{
                                matchingFinalRules[aClassname]['matching_parts'].push(matchingParts);
                            }
                        }


                        snippedArr.push(snippedData);
                        mergedIt = true;
                        
                        let newRuleBody = allRules.join("\n");
                        var snippedDataMerged = {};
                        snippedDataMerged['selector'] = selText;
                        snippedDataMerged['body'] = newRuleBody;
                        snippedDataMerged['media'] = mediaSelector;
                        snippedDataMerged['stylesheet_id'] = stylesheetId;
                        snippedDataMerged['line_num'] = lineNum;
                        snippedDataMerged['the_classname'] = aClassname;                        
                        //index of the element
                        snippedDataMerged['sel_index'] = selIndex;  
                        snippedDataMerged['simple_selector'] = false;                              
                        snippedDataMerged['merged_skip'] = false;
                        snippedDataMerged['device'] = currDevice;
                        snippedDataMerged['inherited_type'] = inType;

                        if(!matchingFinalRules[aClassname]['indices'].includes(snippedArr.length - 1)){
                            matchingFinalRules[aClassname]['indices'].push(snippedArr.length - 1);
                            matchingFinalRules[aClassname]['selectors'].push(snippedDataMerged['selector']);
                            matchingFinalRules[aClassname]['bodies'].push(snippedDataMerged['body']);
                            matchingFinalRules[aClassname]['media_queries'].push(snippedDataMerged['media']); 
                            matchingFinalRules[aClassname]['inherited_type'].push(inType);     
                            matchingFinalRules[aClassname]['inherited_classes'].push(snipcssClassesApplied);                            
                            if(matchingParts.length <= 0){
                                let fullPartsArr = splitNoParen(selText);
                                let firstPart = fullPartsArr[0];
                                //DO SOMETHING BETTER HERE TO GUESS WHICH IS BEST SELECTOR
                                matchingFinalRules[aClassname]['matching_parts'].push([firstPart]);     
                            }else{
                                matchingFinalRules[aClassname]['matching_parts'].push(matchingParts);     
                            }                                
                        }   
                        snippedArr.push(snippedDataMerged);  
                        
                        if(!matchingFinalRules[aClassname]['indices'].includes(snippedArr.length - 1)){
                            matchingFinalRules[aClassname]['indices'].push(snippedArr.length - 1);
                            matchingFinalRules[aClassname]['selectors'].push(snippedDataMerged['selector']);
                            matchingFinalRules[aClassname]['bodies'].push(snippedDataMerged['body']);
                            matchingFinalRules[aClassname]['media_queries'].push(snippedDataMerged['media']); 
                            matchingFinalRules[aClassname]['inherited_type'].push(inType);      
                            matchingFinalRules[aClassname]['inherited_classes'].push(snipcssClassesApplied);
                            if(matchingParts.length <= 0){
                                let fullPartsArr = splitNoParen(selText);
                                let firstPart = fullPartsArr[0];
                                //DO SOMETHING BETTER HERE TO GUESS WHICH IS BEST SELECTOR
                                matchingFinalRules[aClassname]['matching_parts'].push([firstPart]);     
                            }else{
                                matchingFinalRules[aClassname]['matching_parts'].push(matchingParts);     
                            }                           
                        }                         
                        
                        //console.log("first rule");
                        //console.log(snippedArr[snippedArr.length - 3]);
                        //console.log("second rule");
                        //console.log(snippedArr[snippedArr.length - 2]);
                        //console.log("merged rule");
                        //console.log(snippedArr[snippedArr.length - 1]);
                        
                    }
                }
                */
                if(!mergedIt){
                    var snippedData = {};
                    snippedData['selector'] = selText;
                    snippedData['body'] = ruleBody;
                    snippedData['media'] = mediaSelector;
                    snippedData['stylesheet_id'] = stylesheetId;
                    snippedData['line_num'] = lineNum;
                    snippedData['the_classname'] = aClassname;
                    //index of the element
                    snippedData['sel_index'] = selIndex;
                    snippedData['simple_selector'] = false;
                    snippedData['merged_skip'] = false;
                    snippedData['device'] = currDevice;
                    snippedData['inherited_type'] = inType;

                    let invalidPseudosExist = false;
                    if(selText.indexOf(':')){
                        //console.log("selector invalid pseudo test");
                        let fullPartsArr = splitNoParen(selText);
                        for(let f = 0; f < fullPartsArr.length; f++){
                            let faPart = fullPartsArr[f].trim();
                            if(containsPseudo(faPart)){
                                //console.log("TEST CONTAINS PSEUDO " + faPart);
                                if(hasInvalidPseudos(faPart)){
                                    //console.log("INVALLLLLLLLID");
                                    invalidPseudosExist = true;
                                }
                            }
                        }
                    }
                    snippedData['invalid_pseudos'] = invalidPseudosExist;



                    //look back at line numbers
                    //and if line number is less than the last one put it further back in the array
                    /*
                    let splicedIt = false;
                    if(snippedArr.length > 0){
                        let lineValues = new Array();
                        for(let kk = (snippedArr.length - 1); kk >= 0; kk--){
                            let prevSnippet = snippedArr[kk];
                            if(prevSnippet['the_classname'] == aClassname){
                                lineValues.push(prevSnippet['line_num']);
                            }else{
                                break;
                            }
                        }
                        if(lineValues.length > 0){
                            let lineIndex = 0;
                            for(let mm = 0; mm < lineValues.length; mm++){
                                if(snippedData['line_num'] > lineValues[mm]){
                                    lineIndex = mm;
                                }
                            }
                            if(lineIndex > 0){
                                let theNewPos = snippedArr.length - lineIndex;
                                snippedArr.splice(theNewPos, 0, snippedData);
                                splicedIt = true;
                                console.log("spliced back " + lineIndex);
                                console.log(snippedData);
                            }
                        }
                    }
                    if(!splicedIt){
                        snippedArr.push(snippedData);
                    }
                    */
                    //console.log("for " + aClassname + " adding ");
                    //console.log(mediaSelector);
                    //console.log(selText);
                    /*
                    if(inType == 'other_inherited'){
                        if(selText in selectorInheritedClassesArr){
                            console.log("seltext " + selText + " existed");
                            snipcssClassesApplied = selectorInheritedClassesArr[selText];
                        }else{
                            console.log("Getting snipcss classes for other inherited1111:");
                            console.log(selText);
                            let params = {method: "snipcss_matching_elements", test_selector: selText};
                            let labelsResult = await syncSendRequest(tabId, params);
                            let matchInherited = labelsResult['result'];
                            console.log(matchInherited);
                            if(matchInherited.length > 0){
                                //console.log("processing parent pseudo");
                                snipcssClassesApplied = matchInherited.split(',');
                            }
                        }
                    }
                    */

                    snippedArr.push(snippedData);
                    matchingFinalRules[aClassname]['indices'].push(snippedArr.length - 1);
                    matchingFinalRules[aClassname]['selectors'].push(selText);
                    matchingFinalRules[aClassname]['bodies'].push(ruleBody);
                    matchingFinalRules[aClassname]['media_queries'].push(mediaSelector);
                    matchingFinalRules[aClassname]['inherited_type'].push(inType);
                    matchingFinalRules[aClassname]['inherited_classes'].push(snipcssClassesApplied);
                    matchingFinalRules[aClassname]['invalid_pseudos'].push(invalidPseudosExist);
                    if(matchingParts.length <= 0){
                        let fullPartsArr = splitNoParen(selText);
                        let matchedParts = [];

                        if(aMatched['rule']['origin'] == 'pseudo'){
                            // For pseudo-element rules (like clearfix patterns), include ALL parts
                            // with pseudo-elements since the browser already matched this rule
                            for (let f = 0; f < fullPartsArr.length; f++) {
                                let fPart = fullPartsArr[f].trim();
                                if(fPart.indexOf(":") >= 0) {
                                    matchedParts.push(fPart);
                                }
                            }
                        }

                        // Fallback to first part if nothing matched
                        if(matchedParts.length === 0){
                            matchedParts.push(fullPartsArr[0].trim());
                        }

                        matchingFinalRules[aClassname]['matching_parts'].push(matchedParts);

                    }else{
                        matchingFinalRules[aClassname]['matching_parts'].push(matchingParts);
                    }

                }
            }


         }
         //end of all matchedCSSRules for aClassName
         
     }
     //end of every class 
     
     if(processStep == (processArr.length - 1) && selIndex == (multipleAllElementClassnames.length - 1)){
        //reset device size
        var commandResponse = await sendCommand(targetTab, 'Emulation.clearDeviceMetricsOverride');
        console.log("final css styles");
        console.log(snippedArr);         
        
        //let's get body tag for inherited rules 
        /*
        var node = await sendCommand(targetTab, 'DOM.querySelector', {
                nodeId: SNIP_DOC.root.nodeId,
                selector: '.snipcss-bodytag' 
        });
        */
        
        theCallback(snippedArr);  
     }
     else{
         
         if(selIndex == (multipleAllElementClassnames.length - 1)){             
            //console.log("after process step " + processStep + " css styles: ");
            //console.log(snippedArr);
            processStep++;
            
            doSnipper(targetTab, allElementSelectors[0], 0, theCallback);                      
         }else{
             //console.log("after selIndex " + selIndex + " in " + processStep + " css styles: ");
             //console.log(snippedArr);             
             var newIndex = selIndex + 1;
             doSnipper(targetTab, allElementSelectors[newIndex], newIndex, theCallback);                                   
         }
     }   
}catch(doex){
    let msg = doex.message;
    var allSelectors = allJquerySelectors.join('|');
    var siteUrl = SITE_URL;
    var lineNum = "1";
    var extension_token = self.OPTIONS['api_token'];
    if(!extension_token)
    {
        //user not found
        extension_token = "";            
    }                      

    var allError = msg;
    try{
        allError += " - " + doex.stack;        
        lineNum =  (new Error).stack.split("\n")[4];
    }catch(att){
        console.log("bad error data");
    }
    var allOptions = "";

    if(MAX_ERRORS > 0){
        MAX_ERRORS--;                        
        API.sendSnipcssError(siteUrl, "snipbackground-doSnipper", lineNum, allError, allSelectors, "", extension_token);
    }              
    
    console.log("sending dead kiwi during rules:");
    console.log(msg);
    console.log(allError);
    chrome.tabs.sendMessage(SNIPPING_TAB_ID, {method: "dead_kiwi"}, function(response) 
    {
      //why does my software suck?
    });         
}
};


//dont do this because multiple times could be inserted... make them click icon again
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
   var newUrl = tab.url;
   //console.log("new url " + newUrl);
   //console.log("tab id " + tabId);
   //console.log("changeinfo");
   //console.log(changeInfo);
   //try to inject scripts?
   if(WAITING_FOR_RELOAD && tabId == SNIP_TAB_ID && changeInfo.status == "complete"){
       console.log("matched Tab ID - insert scripts again");
       injectSnipcssScripts(tabId);
   }else{
       console.log("no match");
   }
}); 

var injectSnipcssScripts = function(myTabId, callback){
    var scriptFiles = [
        "js/jquery-3.3.1.min.js",			
        "js/mustache.js",
        "js/micromodal.min.js",
        "js/tether.min.js",
        "js/draggabilly.pkgd.min.js",
        "js/sniptools.js",  
        "js/kiwi_walker.js",                
        "js/selectionBox.js",
        "js/page_segmenter.js",                 
        "js/selectElemListeners.js",
        "js/uri.all.min.js",
        "js/snipcss_api.js",             
        "contentscript_kiwi.js"              
    ];          
    chrome.scripting.executeScript({
      target: {tabId: myTabId},
      files: scriptFiles
    }, function() {
        console.log("Content script injected");
        if (callback) callback();
    });    
        
    //concatenateInjections(tabId, def);        
    var cssFiles = ["css/snipcss_styles.css", 
        "css/tether.css",
        "css/poppinsroboto.css",        
        "css/tether-theme-basic.css", 
        "css/micromodal.css"
    ];
    
    chrome.scripting.insertCSS({
        target: { tabId: myTabId },
        files: cssFiles
    });
};


function handleSnippedResult(snippedArr, theOptions){
    WAITING_FOR_RELOAD = false;
    console.log("in handleSnippedResult with ");
    //console.log(snippedArr);
    //console.log("and htmlsss");
    //console.log(allElementOuterHtml);
    //console.log("and label html");
    //console.log(allLabelOuterHtml);
     
    
    if(allElementOuterHtml[0].length > 5 && allElementOuterHtml[0].substr(0,5) == '<body'){        
        console.log("is body element - and that does not work well");
        console.log("change to a div");
        for(let ff = 0; ff < allElementOuterHtml.length; ff++){
            allElementOuterHtml[ff] = replaceAll(allElementOuterHtml[ff], '<body', '<div');
            allElementOuterHtml[ff] = replaceAll(allElementOuterHtml[ff], '</body', '</div');            
        }
        //todo
        //also need to remove... 
        //#snipcss-panel-container
        //edge-builder, .edge-builder2
        //etc
        console.log("new allHtml");
        console.log(allElementOuterHtml);
    }    
    
    //console.log("customfontsArr");
    //console.log(customfontsArr);
    let customfontsUsed = new Array();
    let css_lines = ""; 
    let tailwind_css_lines = "";
    let css_lines_noresponsive = "";
    for(var f =0; f < customfontsArr.length; f++){

      let fontArr = customfontsArr[f];
      let aFontFace = fontArr['face_noquotes'];    
      let aFontFacePlusReplace = aFontFace;
      if(aFontFacePlusReplace.indexOf('+') >= 0){
          aFontFacePlusReplace = aFontFacePlusReplace.replace(/\+/g, ' ');
      }
      //console.log(fontArr);
      if(fontArr['used']){
          //console.log("USED FACE " + aFontFace);
          //console.log("importfontsarr: ");
          //console.log(importfontsArr);
          //console.log("cssfontsarr: ");
          //console.log(cssfontsArr);
          if(aFontFace in GOOGLE_FONTS_IMPORT_ARR){
            let importUrl = GOOGLE_FONTS_IMPORT_ARR[aFontFace];
            if(!customfontsUsed.includes(aFontFace)){                          
                 css_lines += importUrl + ' \n';
                 css_lines_noresponsive += importUrl + ' \n';
                 tailwind_css_lines +=  importUrl + ' \n';
                 customfontsUsed.push(aFontFace);
                 usedFontObjectArr.push(customfontsArr[f]);
            }
            continue;
          }
          else if(aFontFacePlusReplace in GOOGLE_FONTS_IMPORT_ARR){
            let importUrl = GOOGLE_FONTS_IMPORT_ARR[aFontFacePlusReplace];
            if(!customfontsUsed.includes(aFontFacePlusReplace)){                          
                 css_lines += importUrl + ' \n';
                 css_lines_noresponsive += importUrl + ' \n';
                 tailwind_css_lines +=  importUrl + ' \n';                 
                 customfontsUsed.push(aFontFacePlusReplace);
                 usedFontObjectArr.push(customfontsArr[f]);                 
            }
            continue;
          }          
          

          var isImportFont = false;
          var isLinkhrefFont = false;
          //check if is Google Font
          for(var m = 0; m < importfontsArr.length; m++){
              //console.log("checking an import font");
              //console.log(importfontsArr[m]);
              var theFonts = importfontsArr[m]['fonts'];
              var googleUrl = importfontsArr[m]['href'];
              var alreadyUsed = importfontsArr[m]['already_added'];
              
              for(var ff = 0; ff < theFonts.length; ff++){
                  
                  if(theFonts[ff] == aFontFace){
                      if(!alreadyUsed){                          
                          css_lines += '@import url("' + googleUrl + '"); \n';
                          css_lines_noresponsive += '@import url("' + googleUrl + '"); \n';
                          tailwind_css_lines +=  '@import url("' + googleUrl + '"); \n';
                      }
                      importfontsArr[m]['already_added'] = true;
                      isImportFont = true;
                      //console.log('IS IMPORT FONT');
                  }
              }
              
          }
          
          for(var n = 0; n < cssfontsArr.length; n++){
              //console.log("checking a css font");
              //console.log(aFontFace);              
              //console.log(cssfontsArr[n]);
              var theFonts = cssfontsArr[n]['fonts'];
              var googleUrl = cssfontsArr[n]['href'];
              var alreadyAdded = cssfontsArr[n]['already_added'];
              for(var ff = 0; ff < theFonts.length; ff++){
                  
                  if(theFonts[ff] == aFontFace){                                        
                      if(!alreadyAdded){
                          css_lines += '@import url("' + googleUrl + '"); \n';
                          css_lines_noresponsive += '@import url("' + googleUrl + '"); \n';      
                          tailwind_css_lines +=  '@import url("' + googleUrl + '"); \n';
                      }
                      cssfontsArr[n]['already_added'] = true;
                      isImportFont = true;
                      //console.log('IS CSS FONT');
                  }
              }              
              
              
          }

          if(isImportFont){
              continue;
          }
          if(isLinkhrefFont){
              continue;
          }

          //console.log("A FONT WAS USED... so printing");
          //console.log(fontArr);
          
          var myFont = '@font-face { \n';

          for(var pa = 0; pa < fontArr['props'].length; pa++){
             var aProp = fontArr['props'][pa];        
             //aProp['value'] = replaceAll(aProp['value'], 'SNIPPATH_TO_FONTS_', SNIP_PATH_TO_FONTS);
             myFont += "  " + aProp['property'] + ":" + aProp['value'] + ';\n';
          }          
          myFont += '} \n';

          if(alreadySnippedFont(myFont) >= 0){
              continue;
          }                          
          usedFontArr.push(myFont);   
          usedFontObjectArr.push(customfontsArr[f]);
          css_lines += myFont;           
          css_lines_noresponsive += myFont;      
          tailwind_css_lines += myFont;     
      }
    }
    
    console.log("BUILDING TAILWIND ULTIMATES");
    console.log(THE_ULTIMATE);

    //GET THE INHERITED "THE_ULTIMATE" LINES
    //PUT IN THE TAILWIND CSS FOR NOW?
    var justUltimates = "";
    for(var ulKey in THE_ULTIMATE){
        var mySelector = "." + allCssSelectors[0];
        var ulPropArr = THE_ULTIMATE[ulKey];
        if(ulKey.indexOf('|') >= 0){
            var keyParts = ulKey.split('|');
            ulKey = keyParts[0];
            mySelector = keyParts[1];
        }else{
            //console.log("skipping ultimate rule key ");
            //console.log(ulKey);
            //console.log("andproparr because not a known element html,body,img,a");
            //console.log(ulPropArr);
            continue;
        }              

        var finalInherited = new Array();  
        var hasValidProps = false;
        for(var myLine in ulPropArr){
           var found = false;
           for(var i = 0; i < INHERITED_RULES.length; i++){
               if(myLine == INHERITED_RULES[i]){
                   found = true;
               }
           }
           if(found){
              var myValData = ulPropArr[myLine];                        
              var myVal = myValData.split("|")[2];
              finalInherited[myLine] = myVal;
              hasValidProps = true;
          }
        } 
        //only certain properties can be inherited, so it could be empty and hasValidProps is false
        if(hasValidProps){
              if(ulKey != 'none'){
                  css_lines += "@media " + ulKey + "{     \n";
                  css_lines_noresponsive += "@media " + ulKey + "{     \n";      
                  tailwind_css_lines += "@media " + ulKey + "{     \n";      
                  justUltimates += "@media " + ulKey + "{     \n";
              }
              css_lines += "  " + mySelector + " {  \n";
              tailwind_css_lines += "  " + mySelector + " {  \n";
              justUltimates += "  " + mySelector + " {  \n";
              
              //stream.write("  body {  \n");
              for(var theKey in finalInherited){
                  var finalVal = finalInherited[theKey];
                  

                  
                  if(theKey.trim() == 'visibility' || theKey.trim() == 'display'){
                      //console.log("skipping visiblity in");
                      //console.log(finalInherited);
                      continue;
                  }
                  
                  css_lines += "    " + theKey + ":" + finalVal + ';\n';
                  if(mySelector.trim() == 'body' && theKey.trim() == 'font-size' && finalVal.indexOf('%') >= 0){
                      console.log("tailwind skipping font-size percent");
                      continue;
                  }else{                  
                      tailwind_css_lines += "    " + theKey + ":" + finalVal + ';\n';
                  }
                  css_lines_noresponsive += "    " + theKey + ":" + finalVal + ';\n';
                  justUltimates += "    " + theKey + ":" + finalVal + ';\n';
              }
              css_lines += "  }  \n";
              tailwind_css_lines += "  }  \n";              
              justUltimates += "  }  \n";
              if(ulKey != 'none'){
                  css_lines += "}  \n";
                  tailwind_css_lines += "}  \n";
                  css_lines_noresponsive += "}  \n";
                  justUltimates  += "}  \n";
              }              
        }
    } 
    //console.log("just the ultimate rules");
    //maybe do some processing on these to see if we an merge
    //console.log(justUltimates);
    
    //BUILD TAILWIND RULES FROM THE ULTIMATE
    let tailwindUltimateArr = new Array();
    for (var ulKey in THE_ULTIMATE) {
        var ulPropArr = THE_ULTIMATE[ulKey];
        var mediaSelector = '';
        var mySelector = '';

        // Check if ulKey contains a '|', which separates media query and selector
        if (ulKey.indexOf('|') >= 0) {
            var keyParts = ulKey.split('|');
            mediaSelector = keyParts[0]; // Media query or 'none'
            mySelector = keyParts[1];    // Selector like 'body', 'html', etc.
        } else {
            // If no '|', skip this ulKey as per your original code
            //console.log("Skipping ultimate rule key without selector: " + ulKey);
            continue;
        }

        // Normalize 'none' mediaSelector to an empty string
        if (mediaSelector === 'none') {
            mediaSelector = '';
        }

        var finalInherited = {};
        var hasValidProps = false;

        // Process each property in ulPropArr
        for (var myLine in ulPropArr) {
            // Check if the property is in the list of inherited properties
            var isInherited = INHERITED_RULES.includes(myLine);
            if (isInherited) {
                var myValData = ulPropArr[myLine];
                var parts = myValData.split("|");
                var myVal = parts[2]; // Extract the value part
                finalInherited[myLine] = myVal;
                hasValidProps = true;
            }
        }

        // If we have valid inherited properties, build the snippedData object
        if (hasValidProps) {
            var ruleBody = "";
            for (var theKey in finalInherited) {
                var finalVal = finalInherited[theKey];

                // Skip 'visibility' and 'display' properties as per your code
                if (theKey.trim() === 'visibility' || theKey.trim() === 'display') {
                    //console.log("Skipping visibility or display in inherited properties");
                    continue;
                }

                ruleBody += "    " + theKey + ": " + finalVal + ';\n';
            }

            if (ruleBody.length > 0) {
                var snippedData = {};
                snippedData['selector'] = mySelector;
                snippedData['body'] = ruleBody.trim(); // Trim to remove trailing newline
                snippedData['media'] = mediaSelector;

                tailwindUltimateArr.push(snippedData);
            }
        }
    }    
    
    console.log("tailwind ultimate");
    console.log(tailwindUltimateArr);
    

    var removeInheritRules = self.OPTIONS['remove_inheritrules'];
    var removeVendorPrefixes = self.OPTIONS['remove_vendorprefixes'];
    var moveInlineStyles = self.OPTIONS['move_inlinestyles'];    
    var scopeGenerics = self.OPTIONS['scope_generics'];
    var unusedCSS = self.OPTIONS['unused_css'];
    var replaceClasses = self.OPTIONS['replace_classes'];
    var unusedAttributes = self.OPTIONS['unused_attributes'];
    let useTailwind = self.OPTIONS['use_tailwind'];
    let forceBreakpoints = self.OPTIONS['force_breakpoints'];
    let resolveVariables = self.OPTIONS['resolve_variables'];
    
    var scopePrefix = "snip-";
    var globalPrefix = "";
    var tempPrefix = self.OPTIONS['scope_prefix'];  
    var tempGlobalPrefix = self.OPTIONS['global_prefix'];      
    var scopeType = self.OPTIONS['scope_type'];
    var removeInherit = false;
    var removeVendor = false;
    var moveInline = true;
    var scopeIt = false;
    var removeUnusedVariables = true;    
    
    if(!removeInheritRules){
    }
    else if(removeInheritRules == 'yes'){
        removeInherit = true;
    }
    if(!removeVendorPrefixes){
    }
    else if(removeVendorPrefixes == 'yes'){
        removeVendor = true;
    }
    if(!moveInlineStyles){
        moveInline = true;
    }
    else if(moveInlineStyles == 'no'){
        moveInline = false;
    }    
    
    if(!scopeGenerics){

    }else if(scopeGenerics == 'yes'){
        scopeIt = true;
    }
    if(!tempPrefix){
        
    }else{
        scopePrefix = tempPrefix;
    }
    if(!tempGlobalPrefix){
        
    }else{
        globalPrefix = tempGlobalPrefix;
    }
    
    if(!scopeType){
        scopeType = 'class';
    }
    
    
    if(!unusedCSS){
        unusedCSS = "no";
    }
    if(!unusedAttributes){
        unusedAttributes = "no";
    }
    if(!useTailwind){
        useTailwind = "no";
    }    
    if(!forceBreakpoints){
        forceBreakpoints = "no";
    }    
    if(!resolveVariables){
        resolveVariables = "no";
    }        
    if(!replaceClasses){
        replaceClasses = "no";
    }
    
    //console.log("defined css variables: ");
    //console.log(cssvarDefinedArr);
    //console.log("used css variables ");
    //console.log(cssvarUsedArr);    
    
    let danglingCssVarPropVal = new Array();
    let alreadyScopedTrimmed = new Array();    
    
    var lookupReferenceCssVar = function(refCssVar, theLevel){
        //console.log("CSS RECURSIVE VAR VAR VAR---------------");
        //console.log("trying to look up referenced var: " + refCssVar);        
        let fullVar = "--" + refCssVar;
        if(fullVar in cssvarAllArr){
            //console.log("WOW WE USED cssVarAll " + fullVar + ": " + cssvarAllArr[fullVar]);
            if(!danglingCssVarPropVal.includes("    " + fullVar + ": " + cssvarAllArr[fullVar])){
                danglingCssVarPropVal.push("    " + fullVar + ": " + cssvarAllArr[fullVar]);
                
                let theVal = cssvarAllArr[fullVar];
                if(theVal.indexOf("--") >= 0){
                    //console.log("variable inception");
                    let firstIndex = theVal.indexOf('--');   

                    let subPart = theVal.substring(firstIndex + 2);
                    let lastIndex = subPart.length;
                    for(var m = 0; m < subPart.length; m++){
                         let aChar = subPart.charAt(m);
                         let code = subPart.charCodeAt(m);
                         if (!(code > 47 && code < 58) && // numeric (0-9)
                             !(code > 64 && code < 91) && // upper alpha (A-Z)
                             !(code > 96 && code < 123) && 
                             aChar != '_' && aChar != '-') { // underscore and dash
                             //console.log("breaking at " + String.fromCharCode(code));
                             lastIndex = m;
                             break;
                         }     
                    }
                    let variableText = subPart.substring(0, lastIndex);
                    //variableText = variableText.replace(')', '');   
                    variableText = replaceAll(variableText, ")", "");
                    variableText = replaceAll(variableText, ";", "");
                    variableText = replaceAll(variableText, "\n", "");
                    
                    //console.log("variable inception " + variableText);
                    let newLevel = theLevel + 1;
                    if(newLevel < 5){
                        lookupReferenceCssVar(variableText, newLevel);
                    }
                }
            }
            return;
        }
        
        //console.log("NOT FOUND " + refCssVar);
        //console.log("OR IN ");
        //console.log(cssvarAllArr);
    };

    //modify the body to     
    
    for(var p = 0; p < snippedArr.length; p++){
        var pSelector = snippedArr[p]['selector'];
        var pBody = snippedArr[p]['body'];
        var pSelIndex = snippedArr[p]['sel_index'];
        var newBody = "";
        //console.log("old body ");
        //console.log(pBody);
        
        //
//change generic rules like "div" "p" to classes .snip-div etc.
        //#myCssSelector div
        //or if .myCssSelector tagname is div then it would be
        //div.myCssSelector, .myCssSelector div
        //Need to split 
        /****** THIS LOOP SKIPPED IF NOT SCOPING ****************/
        let isSimpleSelector = true;
        let isHtmlRootTag = false;
        var allSelectors = pSelector.split(',');
        var newAllSelectors = new Array();
        for(var as = 0; as < allSelectors.length; as++){

            
            var oneSelector = allSelectors[as];
            /*
        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], ">", " > ");
        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "+", " + ");
        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "~", " ~ ");
        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "  ", " ");          
        usedSelectorsArr[k] = replaceAll(usedSelectorsArr[k], "::", ":");                               */
            var trimSelector = oneSelector.trim();
            if(trimSelector == 'html'){
                isHtmlRootTag = true;
            }            
            if(!scopeIt || useTailwind == 'yes'){
                newAllSelectors.push(oneSelector);
                isSimpleSelector = false;
                continue;                
            }
            else if(oneSelector.indexOf('#') !== -1 || oneSelector.indexOf('.') !== -1 || 
                    oneSelector.indexOf('>') !== -1 || oneSelector.indexOf('+') !== -1){
                //skip because a specific id, class or at least multiple specific
                
                //actually let's use this opportunity to remove any snippedArr without classes in the tree
                if(oneSelector.startsWith('.') || oneSelector.startsWith("#")){
                    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
                    let restOfRule = oneSelector.substring(1);
                    if (alphanumericRegex.test(restOfRule)) {         
                       if(allElementOuterHtml[pSelIndex].indexOf(restOfRule) === -1){
                           //the class is not in the html
                           //console.log("RULE: " + restOfRule + " IS NOT IN THE HTML ");
                           //console.log("Skipping");
                           //console.log(oneSelector);
                           isSimpleSelector = false;                
                           newAllSelectors.push(oneSelector);
                           continue;                           
                       }
                    }           
                }
                
                isSimpleSelector = false;                
                newAllSelectors.push(oneSelector);
                continue;
            }
            //what about table th

            trimSelector = trimSelector.toLowerCase();            
            let trimHasEnding = false;
            let trimEnding = "";
            if(oneSelector.indexOf(':') !== -1){
                let restIndex = oneSelector.indexOf(':');
                trimHasEnding = true;
                trimEnding = oneSelector.substring(restIndex);
                trimSelector = trimSelector.split(':')[0];
                //console.log("colon-trimending now: " + trimEnding);                 
            }
            if(oneSelector.indexOf(' ') !== -1){
                let restIndex = oneSelector.indexOf(' ');
                trimHasEnding = true;
                trimEnding = oneSelector.substring(restIndex);
                trimSelector = trimSelector.split(' ')[0];                
                //console.log("space-trimending now: " + trimEnding); 
            }



            //'', '', '', 'related'
            if(trimSelector == "div" || trimSelector == "p" || trimSelector == "h1" || 
                     trimSelector == "h2"  || trimSelector == "h3"  || trimSelector == "h4"  || trimSelector == "h5" ||
                     trimSelector == "h6"  || trimSelector == "article"  || trimSelector == "span"  || trimSelector == "section" ||
                     trimSelector == "a"  || trimSelector == "ul"  || trimSelector == "li"  || trimSelector == "img" ||
                     trimSelector == "img" || trimSelector == "svg"  || trimSelector == "button"  || 
                     trimSelector == "modal" || trimSelector == "nav" || trimSelector == "footer" || trimSelector == "grid" || 
                     trimSelector == "aside" || trimSelector == "sidebar" || trimSelector == "hr"){ 
                
                var currCssSelector = allCssSelectors[pSelIndex];
                var currOuterHtml = allElementOuterHtml[pSelIndex];
                var currZipHtml = allZipOuterHtml[pSelIndex];
                var currLabelHtml = allLabelOuterHtml[pSelIndex];
                //console.log("SCOPING THIS SHIT");
                //console.log("FULL SELECTOR " + oneSelector);
                //console.log("ALL " + trimSelector + " tags");
                //console.log("before html");
                //console.log(currOuterHtml);
                let useVueMethod = false;
                if(scopeType == 'attribute'){
                    useVueMethod = true;
                }
                let modifyScopeHtml = true;
                let newSelector = trimSelector;
                let newProp = "";
                try{                
                    if(useVueMethod){
                        
                        if(alreadyScopedTrimmed.hasOwnProperty(trimSelector)){
                            newProp = alreadyScopedTrimmed[trimSelector];
                            modifyScopeHtml = false;
                        }else{
                            newProp = "data-" + scopePrefix + randomLetters(5);
                        }
                        newSelector = "[" + newProp + "]" + trimEnding;

                        if(modifyScopeHtml && htmlHasATag(currOuterHtml, trimSelector)){
                            currOuterHtml = addPropToTag(currOuterHtml, trimSelector, newProp); 
                            currZipHtml = addPropToTag(currZipHtml, trimSelector, newProp); 
                            //console.log("modified to");
                            //console.log(currOuterHtml);
                        }
                        try{                
                        //get first element of the outer html
                        //if matches the selector, then we need to add div.XXXsnipcssXXX in adddition to .XXXsnipcssXXX                            
                           if(modifyScopeHtml && currOuterHtml.indexOf(" ") !== -1){
                               var tagPart = currOuterHtml.substr(0, currOuterHtml.indexOf(" "));
                               tagPart = replaceAll(tagPart, '<', '');
                               tagPart = replaceAll(tagPart, ' ', '');
                               tagPart = tagPart.toLowerCase();
                               if(tagPart == trimSelector){                                   
                                   currOuterHtml = addPropToRoot(currOuterHtml, newProp); 
                                   currZipHtml = addPropToRoot(currZipHtml, newProp); 
                               }
                           }
                       }catch(ex2){
                           console.log("ERROR: could not add class " + newClass + " to root element");
                       }                         
                    }else{
                        let newClass = scopePrefix + trimSelector;
                        newSelector = "." + newClass + trimEnding;
                        if(htmlHasATag(currOuterHtml, trimSelector)){
                            currOuterHtml = addClassToTag(currOuterHtml, trimSelector, newClass);
                            currZipHtml = addClassToTag(currZipHtml, trimSelector, newClass);   
                            //we dont need to scope to this
                            //addSelectorClassToTailwindElements()
                            //HERE HERE HERE 
                            
                            //console.log("subelements done html");
                            //console.log(currOuterHtml);                    
                        }
                        try{                
                        //get first element of the outer html
                        //if matches the selector, then we need to add div.XXXsnipcssXXX in adddition to .XXXsnipcssXXX                            
                           if(currOuterHtml.indexOf(" ") !== -1){
                               var tagPart = currOuterHtml.substr(0, currOuterHtml.indexOf(" "));
                               tagPart = replaceAll(tagPart, '<', '');
                               tagPart = replaceAll(tagPart, ' ', '');
                               tagPart = tagPart.toLowerCase();
                               if(tagPart == trimSelector){
                                   currOuterHtml = addClassToRoot(currOuterHtml, newClass);     
                                   currZipHtml = addClassToRoot(currZipHtml, newClass);        
                                   //console.log("root done html");
                                   //console.log(currOuterHtml);                        
                               }
                           }
                       }catch(ex2){
                           console.log("ERROR: could not add class " + newClass + " to root element");
                       }                            
                    }
                }catch(ex){
                     console.log("ERROR: SCOPE PROBLEM " + newClass + " to " + trimSelector + " elements");
                }
                //var newSelector = "." + currCssSelector + " " + trimSelector;
                if(modifyScopeHtml){
                    let withQuotesNewProp = newProp + '=""';
                    currOuterHtml = replaceAll(currOuterHtml, withQuotesNewProp, newProp);
                    currZipHtml = replaceAll(currZipHtml, withQuotesNewProp, newProp);    
                    //currOuterHtml = replaceAll(currOuterHtml, "='snipXscopeXhere'", "");
                    //currZipHtml = replaceAll(currZipHtml, "='snipXscopeXhere'", "");                       
                    //console.log("after html");
                    //console.log(currOuterHtml);                
                    allElementOuterHtml[pSelIndex] = currOuterHtml;
                    allZipOuterHtml[pSelIndex] = currZipHtml;    
                    alreadyScopedTrimmed[trimSelector] = newProp;
                }else{
                    //console.log("html is the same because we already modified for " + trimSelector);
                }                                
                
                newAllSelectors.push(newSelector);                
            }else{
                isSimpleSelector = false;
                newAllSelectors.push(oneSelector);
            }                            
        }        
        snippedArr[p]['simple_selector'] = false;
        if(scopeIt && useTailwind != 'yes'){
            //console.log("YES PLEASE SCOPE");
            //console.log('original selector ' + snippedArr[p]['selector']);
            //console.log("new selector " + newAllSelectors.join(', '));
            snippedArr[p]['selector'] = newAllSelectors.join(', ');
            snippedArr[p]['simple_selector'] = isSimpleSelector;
        }
        
        /****** END SCOPING  *******/
        var bodySplit = pBody.split(/\r?\n/);
        for(var b = 0; b < bodySplit.length; b++){
            var ruleLine = bodySplit[b];
            var colonSplit = bodySplit[b].split(":");
            let ruleProp = colonSplit[0];
            
            //console.log("Ruleprop");
            //console.log(ruleProp);
            
            let ruleVal = "";
            if(colonSplit.length > 1){
                ruleVal = colonSplit[1];
            }
            if(removeInherit && ruleVal.indexOf('inherit') !== -1){
                //console.log("REMOVED INHERIT RULE   LINE");
                //console.log(ruleLine);
                continue;
            }
            else if(isSimpleSelector && ruleVal.indexOf('inherit') !== -1 && removeInherit){
                //remove "inherit" from simple selectors like h2,h3 div  p  etc.
                //but why???
                //console.log("REMOVED SIMPLE SELECTOR INHERIT RULE LINE");
                //console.log(ruleLine);
                continue;                
            }
            else if(isHtmlRootTag){
                //console.log("checking rule");
                //console.log(ruleLine);
                if(ruleProp.trim() == 'visibility'){
                    //console.log("REMOVED VISIBILITY RULE BLAH BLAH BLAH");
                    continue;
                }
            }
            
            var isPrefix = false;
            if(removeVendor){
                for(var vp = 0; vp < VENDOR_PREFIXES.length; vp++){
                    if(ruleProp.indexOf(VENDOR_PREFIXES[vp]) !== -1){
                        isPrefix = true;
                    }
                }                            
                if(removeVendor && isPrefix){
                    //console.log("REMOVED PREFIX RULE   LINE");
                    continue;
                }
            }
            if(ruleProp.trim().startsWith('--')){
                let varName = ruleProp.trim().substr(2);             
                if(!cssvarUsedArr.includes(varName) && ruleVal.indexOf('--') === -1){
                    //console.log("REMOVED UNUSED CSS VARIAABLE LINE ");
                    //console.log(ruleLine);
                    continue;
                }else{
                    //console.log("CSS VAR RULE");
                    //console.log(ruleProp + ": " + ruleVal);
                    if(pSelector != ':root' && pSelector != 'body' && pSelector != 'html'){
                        if(ruleVal.trim() != 'initial'){                            
                            if(ruleVal.indexOf('--') >= 0){
                                let firstIndex = ruleVal.indexOf('--');   
                                
                                let subPart = ruleVal.substring(firstIndex + 2);
                                let lastIndex = subPart.length;
                                for(var m = 0; m < subPart.length; m++){
                                    let aChar = subPart.charAt(m);
                                    let code = subPart.charCodeAt(m);
                                    if (!(code > 47 && code < 58) && // numeric (0-9)
                                        !(code > 64 && code < 91) && // upper alpha (A-Z)
                                        !(code > 96 && code < 123) && 
                                        aChar != '_' && aChar != '-') { // underscore and dash
                                        //console.log("breaking at " + String.fromCharCode(code));
                                        lastIndex = m;
                                        break;
                                    }     
                                }
                                let variableText = subPart.substring(0, lastIndex);
                                //variableText = variableText.replace(')', '');
                                variableText = replaceAll(variableText, ")", "");
                                variableText = replaceAll(variableText, ";", "");
                                variableText = replaceAll(variableText, "\n", "");
                                //console.log("REFERENCE VARIABLES ");
                                //console.log(variableText);

                                lookupReferenceCssVar(variableText, 0);
                                cssvarUsedArr.push(variableText);

                                while(subPart.indexOf('--') >= 0){
                                    firstIndex = subPart.indexOf('--');
                                    subPart = subPart.substring(firstIndex + 2);
                                    lastIndex = subPart.length - 1;
                                    for(var m = 0; m < subPart.length; m++){
                                        var aChar = subPart.charAt(m);
                                        var code = subPart.charCodeAt(m);
                                        if (!(code > 47 && code < 58) && // numeric (0-9)
                                            !(code > 64 && code < 91) && // upper alpha (A-Z)
                                            !(code > 96 && code < 123) && 
                                            aChar != '_' && aChar != '-') { // underscore and dash
                                            lastIndex = m;
                                            break;
                                        }                            
                                    }
                                    variableText = subPart.substring(0, lastIndex);   
                                    //console.log("anothervar subpart " + subPart);
                                    //console.log("has variable ");
                                    //console.log(variableText);   
                                    lookupReferenceCssVar(variableText, 0);     
                                    cssvarUsedArr.push(variableText);
                                }                                
                            }
                            //console.log("ADDED cssVarNormal ");
                            //console.log(ruleProp + ": " + ruleVal);                            
                            
                            if(ruleVal.trim().endsWith(';')){
                                danglingCssVarPropVal.push(ruleProp + ": " + ruleVal);
                                
                            }else{
                                //console.log("skipped a bad cssVar: " + ruleVal);
                            }
                        }
                    }
                }
            } 
            
            newBody += ruleLine + "\n";                                
        }                        
        //console.log("old body ");
        //console.log(newBody);

        snippedArr[p]['body'] = newBody;        

    }
    
    //this is backup for not finding the css variables
    for(let cv = 0; cv < cssvarUsedArr.length; cv++){
        let cssvarFound = false;
        //console.log("testing " + cssvarUsedArr[cv]);
        for(let ss = 0; ss < snippedArr.length; ss++){
            let theBody = snippedArr[ss]['body'];
            if(!theBody || theBody == ""){
                continue;
            }
            try{
                let theBodySplit = theBody.split(/\r?\n/);
                for(var bb = 0; bb < theBodySplit.length; bb++){
                    if(theBodySplit[bb].indexOf(':') >= 0){
                        let cccSplit = theBodySplit[bb].split(":");
                        let rrrrProp = cccSplit[0];       
                        if(rrrrProp.indexOf(cssvarUsedArr[cv]) >= 0){
                            cssvarFound = true;
                            break;
                        }
                    }
                }
                if(cssvarFound){
                    break;
                }
            }catch(exxx){
                //console.log("bad rule body");
                //console.log(snippedArr[ss]);
            }
        }
        if(!cssvarFound){
            //console.log("DID NOT FIND THE CSS VAR " + cssvarUsedArr[cv]);
            lookupReferenceCssVar(cssvarUsedArr[cv], 0);
        }
    }
    

    //handle dangling CSS variable definitions
    if(danglingCssVarPropVal.length > 0){
        let snippedDanglingVar = {};
        snippedDanglingVar['selector'] = 'body';
        let dangleBody = "/* CSS Variables that may have been missed get put on body */ \n";
        for(let dv = 0; dv < danglingCssVarPropVal.length; dv++){
            dangleBody += danglingCssVarPropVal[dv] + " \n";
        }
        snippedDanglingVar['body'] = dangleBody;
        snippedDanglingVar['media'] = '';
        snippedDanglingVar['stylesheet_id'] = -1;
        snippedDanglingVar['line_num'] = 0;
        //index of the element
        snippedDanglingVar['sel_index'] = 1;  
        snippedDanglingVar['simple_selector'] = false;          
        snippedDanglingVar['merged_skip'] = false;
        snippedDanglingVar['device'] = 'default';
        snippedDanglingVar['inherited_type'] = 'other_inherited';        
        snippedArr.unshift(snippedDanglingVar);  
    }
    let snippedArrCleaned = new Array();
    let snippedArrCleanedZip = new Array();
    //tailwind array is reverse, the simplest should be processed at the end
    let snippedArrTailwind = new Array();       
    
    //TRY PUTTING ALL SIMPLE SELECTORS FIRSTTTT
    //.snip-div  .snip-a   .snip-h3   etc
    for(var bb = 0; bb < snippedArr.length; bb++){  
      let xSkip = snippedArr[bb]['merged_skip'];
      let xBody = snippedArr[bb]['body'];
      let xSelector = snippedArr[bb]['selector'];
      if(xSelector.trim() == ""){
          continue;
      }
      if(xBody.trim() == ""){
          continue;
      }
      if(xSkip){
          continue;
      }  
      //cleaned up by removing merged_skip and emptys
      if(snippedArr[bb]['simple_selector']){
          snippedArrCleaned.push(snippedArr[bb]);
          snippedArrCleanedZip.push(snippedArr[bb]);
          snippedArrTailwind.push(snippedArr[bb]);
      }
    }
    //NOW DO ALL NON-SIMPLE SELECTORS
    for(var xx = 0; xx < snippedArr.length; xx++){  
      let xSkip = snippedArr[xx]['merged_skip'];
      let xBody = snippedArr[xx]['body'];
      let xSelector = snippedArr[xx]['selector'];
      if(xSelector.trim() == ""){
          continue;
      }
      if(xBody.trim() == ""){
          continue;
      }
      if(xSkip){
          continue;
      }  
      //cleaned up by removing merged_skip and emptys
      if(!snippedArr[xx]['simple_selector']){      
         snippedArrCleaned.push(snippedArr[xx]);
         snippedArrCleanedZip.push(snippedArr[xx]);
         snippedArrTailwind.push(snippedArr[xx]);
      }
    }
    
    //REVERSE THE TAILWIND BLOCK - WE PROCESS IT FROM THE REVERSE BECUASE ONES ALREADY DONE WITH SAME SPECIFITY 
    snippedArrTailwind.reverse();
    
    //WE NEED TO ADD VARIABLES TO THE TAILWIND CSS    
    if(useTailwind == 'yes'){
        let tailwindVarCSS = "";
        for (let tw = 0; tw < snippedArrTailwind.length; tw++) {
            let mySelector = snippedArrTailwind[tw]['selector'];
            let myBody = snippedArrTailwind[tw]['body'];
            let myMedia = snippedArrTailwind[tw]['media'];
            //console.log("tailwind looking for variables: " + mySelector);
            if(snippedArrTailwind[tw]['inherited_type'] != 'other_inherited'){
                //console.log("not inherited");
                continue;
            }

            
            // Check if there are any lines in the body that start with '--'
            let hasVariables = myBody.split(/\r?\n/).some(line => line.trim().startsWith('--'));

            if (hasVariables) {
                //console.log("has variables");
                let theBodySplit = myBody.split(/\r?\n/);

                // Collect lines that are CSS variables
                let variableProps = theBodySplit
                    .map(line => line.trim())
                    .filter(line => line.startsWith('--') && line.indexOf(':') >= 0);

                if (variableProps.length > 0) {
                   let extraSpacing = '';
                   if (myMedia && myMedia.trim() != "") {
                       tailwindVarCSS += `${myMedia} {\n`;
                       extraSpacing += '    ';
                   }
                   tailwindVarCSS += extraSpacing + `${mySelector} {\n`;
                   for(let v = 0; v < variableProps.length; v++){
                       tailwindVarCSS += extraSpacing + '    ' + variableProps[v] + '\n';
                   }
                   
                   tailwindVarCSS += extraSpacing + `\n}\n`;
                   if (myMedia && myMedia.trim() != "") {
                       tailwindVarCSS += `}\n`;
                   }
                   tailwindVarCSS += '\n';
               }
            }
        }
        //console.log("tailwind var CSS");
        //console.log(tailwindVarCSS);
        tailwind_css_lines += tailwindVarCSS;
        
    }
    
    //doing this later
    /*
    
    let currResolved = {};
    for (const varName of cssvarUsedArr) {
        if (!currResolved[varName]) {
            console.log("\nProcessing root variable: " + varName);
            resolveCssVariableValue(varName, cssvarAllArr, currResolved, new Set(), 0);
        }
    }
    */

    
    //have to transmorgify here
    //because it has to be before css_lines is created
    //console.log("calling transmorgifyyyyyyyyyyyyyyyyyyyyyyyyy");
    if(replaceClasses == 'yes' && useTailwind != 'yes'){ 
        let snippedArrCopy = snippedArrCleaned;
        let snippedArrCopy2 = snippedArrCleanedZip;
        for(var tm = 0; tm < allElementOuterHtml.length; tm++){
            var retObject = transmogrifyCSS(allElementOuterHtml[tm], snippedArrCopy, globalPrefix);
            let newHtml = retObject['html'];
            let newSnipArr = retObject['new_sniparr'];
            allElementOuterHtml[tm] = newHtml;
            if(newSnipArr.length > 0){
                snippedArrCleaned = newSnipArr;
            }
            var retObject2 = transmogrifyCSS(allZipOuterHtml[tm], snippedArrCopy2, globalPrefix);
            let newHtml2 = retObject2['html'];
            let newSnipArr2 = retObject['new_sniparr'];
            allZipOuterHtml[tm] = newHtml2;
            if(newSnipArr2.length > 0){
                snippedArrCleanedZip = newSnipArr;
            }            
        }    
    }
    
    let tryMergeSameMedia = true;
    for(var m = 0; m < snippedArrCleaned.length; m++){
      var mySelector = snippedArrCleaned[m]['selector'];
      var myBody = snippedArrCleaned[m]['body'];
      var myMedia = snippedArrCleaned[m]['media'];   
      var mergedSkip = snippedArrCleaned[m]['merged_skip'];
      var deviceType = snippedArrCleaned[m]['device'];
      
      let isHtmlTag  = false;
      let isIconRule = false;
      if(mySelector.trim() == 'html'){
          isHtmlTag = true;
      }
      // Check if this is an icon font CSS rule that should be preserved in Tailwind output
      if(isIconFontRule(mySelector, myBody)){
          isIconRule = true;
      }
      //console.log("processing the line");
      //console.log(snippedArrCleaned[m]);
      
      //now that we're removing inherit rules it could be empty, so skip those
      if(myBody.trim() == ""){
          continue;
      }
      //this rule was merged into another
      if(mergedSkip){
          continue;
      }
      
      var extraPadding = "";
      if(myMedia !== ""){
          css_lines += "@media " + myMedia + "{ \n";
          if(deviceType == 'default'){
              css_lines_noresponsive += "@media " + myMedia + "{ \n";
          }
          if(isHtmlTag || isIconRule){
              tailwind_css_lines += "@media " + myMedia + "{ \n";
          }
          extraPadding = "  ";
      }     
      
      
      //just look ahead if myMedia is same and set merged skip for them to true
      //while appending them to these css lines
      let n = m + 1;
      let future_lines = "";
      if(n < snippedArrCleaned.length && tryMergeSameMedia && myMedia != ""){
          for(n=m+1; n < snippedArrCleaned.length; n++){
              
            let diff = n - m;
            //console.log("lines " + diff + " ahead");
            //console.log(snippedArrCleaned[n]);
            var nSelector = snippedArrCleaned[n]['selector'];
            var nBody = snippedArrCleaned[n]['body'];
            var nMedia = snippedArrCleaned[n]['media'];   
            var nSkip = snippedArrCleaned[n]['merged_skip'];    
            if(nMedia != myMedia){
                //console.log("future media off");
                //console.log("current: " + myMedia + " future: " + nMedia);
            }
            if(nMedia.trim() != myMedia.trim() || nSkip || nBody.trim() == ""){
                break;
            }
            future_lines += "\n";
            future_lines += extraPadding + nSelector + " { \n";
            future_lines += nBody + extraPadding + "} \n";
            //console.log("added");
            snippedArrCleaned[n]['merged_skip'] = true;
          }
      }

      css_lines += extraPadding + mySelector + " { \n";
      css_lines += myBody + extraPadding + "} \n";
      if(deviceType == 'default'){
        css_lines_noresponsive += extraPadding + mySelector + " { \n";
        css_lines_noresponsive += myBody + extraPadding + "} \n";
      }
      if(isHtmlTag || isIconRule){
            tailwind_css_lines += extraPadding + mySelector + " { \n";
            tailwind_css_lines += myBody + extraPadding + "} \n";
      }      
      
      
      if(future_lines != ""){
          css_lines += future_lines;     
          if(deviceType == 'default'){
            css_lines_noresponsive += future_lines;
          }          
          if(isHtmlTag || isIconRule){
              tailwind_css_lines += future_lines;     
          }              
      }

      if(myMedia !== ""){
          css_lines += "}     \n";
          if(deviceType == 'default'){
            css_lines_noresponsive += "}     \n";
          }           
          if(isHtmlTag || isIconRule){
              tailwind_css_lines += "}     \n";
          }            
      }
      css_lines += "\n";
      if(deviceType == 'default'){
         css_lines_noresponsive += "\n";
      }  
      if(isHtmlTag || isIconRule){
        tailwind_css_lines += "\n";
      }       
    }       
    css_lines += "\n";    
    if(deviceType == 'default'){
       css_lines_noresponsive += "\n";
    }           
    tailwind_css_lines += "\n";
  
    /****** ANIMATION KEYFRAMES HERE ****/
    for(var aKeyframeDefinition in animationKeyframesArr){
        //console.log("adding keyframe " + aKeyframeDefinition);
        //console.log(animationKeyframesArr[aKeyframeDefinition]);
        let keyFramesCss = "";
        
        keyFramesCss += "@keyframes " + aKeyframeDefinition + " { \n";
        var keyframeDef = animationKeyframesArr[aKeyframeDefinition];
        
        for(var percentDefinition in keyframeDef){
            keyFramesCss += "  " + percentDefinition + " {  \n";   
            var allRules = keyframeDef[percentDefinition];
            for(var x = 0; x < allRules.length; x++){
                var kRule = allRules[x];
                var propName = kRule['name'];
                var propVal = kRule['value'];
                keyFramesCss += "      " + propName + ": " + propVal + "; \n";
            }                  
            keyFramesCss += "  }  \n";                        
        }

        keyFramesCss += "\n} \n";            

        css_lines += keyFramesCss;
        css_lines_noresponsive += keyFramesCss;        
        tailwind_css_lines += keyFramesCss;      
        /*
        css_lines += "@keyframes " + aKeyframeDefinition + " { \n";
        css_lines_noresponsive += "@keyframes " + aKeyframeDefinition + " { \n";
        var keyframeDef = animationKeyframesArr[aKeyframeDefinition];
        
        for(var percentDefinition in keyframeDef){
            css_lines += "  " + percentDefinition + " {  \n";   
            css_lines_noresponsive += "  " + percentDefinition + " {  \n";  
            var allRules = keyframeDef[percentDefinition];
            for(var x = 0; x < allRules.length; x++){
                var kRule = allRules[x];
                var propName = kRule['name'];
                var propVal = kRule['value'];
                css_lines += "      " + propName + ": " + propVal + "; \n";
                css_lines_noresponsive += "      " + propName + ": " + propVal + "; \n";
            }                  
            css_lines += "  }  \n";                
            css_lines_noresponsive += "  }  \n";            
        }

        css_lines += "\n} \n";            
        css_lines_noresponsive += "\n} \n";    
        */
    } 
    


    //elementOuterHtml = replaceAll(elementOuterHtml, 'XXsnipcss_extracted_selector_selectionXX', allCssSelectors[0]);
    //elementZipHtml = replaceAll(elementZipHtml, 'XXsnipcss_extracted_selector_selectionXX', allCssSelectors[0]);

    var elementOuterHtml = "";
    var elementZipHtml = "";
    var labelOuterHtml = "";
    let zipExtraCSS = "";
    //console.log("replacing styles");
    //console.log(allElementOuterHtml[0]);
    
    if(allElementOuterHtml.length > 1){
        elementOuterHtml += '<div class="snipcss-flex">';                        
        elementZipHtml += '<div class="snipcss-flex">';
        for(var f = 0; f < allElementOuterHtml.length; f++){
            
            if(moveInline){
                let styleReplaceObj = replaceStyleAttributes(allElementOuterHtml[f]);
                let styleReplaceObj2 = replaceStyleAttributes(allZipOuterHtml[f]);
                
                /****************************
                 * WE DO NOT DO TAILWIND HERE
                 * DETECT style attr WHEN PROCESSING TAILWIND HTML
                 ****************************/
                
                //let styleReplaceObj2 = replaceStyleAttributes(allZipOuterHtml[f]);
                if(styleReplaceObj['removed_style']){
                    //console.log("REMOVED STYLE STYLE STYLE ----- OLD: ");
                    //console.log(allElementOuterHtml[f]);
                    for(let na = 0; na < styleReplaceObj['snip_arr'].length; na++){
                        snippedArrCleaned.push(styleReplaceObj['snip_arr'][na]);
                    }
                    allElementOuterHtml[f] = styleReplaceObj['new_html'];
                    css_lines += styleReplaceObj['extra_css'];            
                    css_lines_noresponsive += styleReplaceObj['extra_css']; 
                }
                if(styleReplaceObj2['removed_style']){
                    for(let na = 0; na < styleReplaceObj2['snip_arr'].length; na++){
                        snippedArrCleanedZip.push(styleReplaceObj2['snip_arr'][na]);
                    }                    
                    allZipOuterHtml[f] = styleReplaceObj2['new_html'];
                    zipExtraCSS += styleReplaceObj2['extra_css'];
                }
            }
            
            if(unusedCSS == 'yes' || unusedAttributes == 'yes'){
                elementOuterHtml += removeExtraAttributes(allElementOuterHtml[f], snippedArrCleaned, unusedCSS, unusedAttributes, scopePrefix, false);
                elementZipHtml += removeExtraAttributes(allZipOuterHtml[f], snippedArrCleanedZip, unusedCSS, unusedAttributes, scopePrefix, false);
                labelOuterHtml += removeExtraAttributes(allLabelOuterHtml[f], snippedArrCleanedZip, unusedCSS, unusedAttributes, scopePrefix, true);
            }else{
                elementOuterHtml += allElementOuterHtml[f];
                elementZipHtml += allZipOuterHtml[f];   
                labelOuterHtml += allLabelOuterHtml[f];
            }            
        }
        elementOuterHtml += '</div>';
        elementZipHtml += '</div>';
        css_lines += ".snipcss-flex { \n";
        css_lines += "  display: flex; \n";
        css_lines += "  flex-direction: column; \n";
        css_lines += "}     \n";
        css_lines_noresponsive += ".snipcss-flex { \n";
        css_lines_noresponsive += "  display: flex; \n";   
        css_lines_noresponsive += "  flex-direction: column; \n";  
        css_lines_noresponsive += "}     \n";
        zipExtraCSS += ".snipcss-flex { \n";
        zipExtraCSS += "  display: flex; \n";   
        zipExtraCSS += "  flex-direction: column; \n";  
        zipExtraCSS += "}     \n";
    }else{
        if(moveInline){
                /****************************
                 * WE DO NOT DO TAILWIND HERE
                 * DETECT style attr WHEN PROCESSING TAILWIND HTML
                 ****************************/            
            let styleReplaceObj = replaceStyleAttributes(allElementOuterHtml[0]);
            let styleReplaceObj2 = replaceStyleAttributes(allZipOuterHtml[0]);
            if(styleReplaceObj['removed_style']){
                //console.log("REMOVED STYLE STYLE STYLE ----- OLD: ");
                //console.log(allElementOuterHtml[0]);         
                for(let na = 0; na < styleReplaceObj['snip_arr'].length; na++){
                    snippedArrCleaned.push(styleReplaceObj['snip_arr'][na]);
                }            
                allElementOuterHtml[0] = styleReplaceObj['new_html'];
                //console.log("NEW");
                //console.log(allElementOuterHtml[0]);            
                
                css_lines += styleReplaceObj['extra_css'];            
                css_lines_noresponsive += styleReplaceObj['extra_css'];               
            }     
            if(styleReplaceObj2['removed_style']){
                for(let na = 0; na < styleReplaceObj2['snip_arr'].length; na++){
                    snippedArrCleanedZip.push(styleReplaceObj2['snip_arr'][na]);
                }                          
                allZipOuterHtml[0] = styleReplaceObj2['new_html'];
                zipExtraCSS += styleReplaceObj2['extra_css'];
            }
        }
        
        if(unusedCSS == 'yes' || unusedAttributes == 'yes'){
            //console.log("doing removeExtraAttributes");
            elementOuterHtml = removeExtraAttributes(allElementOuterHtml[0], snippedArrCleaned, unusedCSS, unusedAttributes, scopePrefix, false);
            elementZipHtml = removeExtraAttributes(allZipOuterHtml[0], snippedArrCleanedZip, unusedCSS, unusedAttributes, scopePrefix, false);    
            
            //CANT REMOVE SNIPCSS CLASSSES YET FOR TAILWIND
            labelOuterHtml = removeExtraAttributes(allLabelOuterHtml[0], snippedArrCleanedZip, unusedCSS, unusedAttributes, scopePrefix, true);                    
        }else{
            //console.log("no remove extra attributes");
            elementOuterHtml = allElementOuterHtml[0];
            elementZipHtml = allZipOuterHtml[0];
            labelOuterHtml = allLabelOuterHtml[0];
        }                    
    }
    //console.log("cleanup including removing scripts and comments");
    elementOuterHtml = cleanupOuterHtml(elementOuterHtml);
    elementZipHtml = cleanupOuterHtml(elementZipHtml);
    labelOuterHtml = cleanupOuterHtml(labelOuterHtml);
    
    //console.log("FINAL FINAL FINAL elementOuterHtml");    
    //console.log(elementOuterHtml);
    
    var createDate = new Date().getTime();
    var myUID = generateUID();

    var iframeHtml = '<!DOCTYPE html>\n';                    
    iframeHtml += '<html>\n';
    iframeHtml += '   <head>\n';
    iframeHtml += '      <meta charset="utf-8">\n'; 
    iframeHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';                    
    iframeHtml += '      <style>\n';          
    iframeHtml += css_lines;
    iframeHtml += '      </style>\n';                       
    iframeHtml += '   </head>\n';
    iframeHtml += '   <body>\n';
    iframeHtml += elementOuterHtml;
    iframeHtml += '   </body>\n';
    iframeHtml += '</html>\n';
    
    //console.log("snip font urls");
    //console.log(snipFontUrls);
    var jquerySelector = allJquerySelectors.join('|');    
    
    //DO IT HERE
    //css_lines
    //console.log("label outer html");
    if (labelOuterHtml.startsWith('"')) {
        labelOuterHtml = labelOuterHtml.slice(1);
    } 
    if (labelOuterHtml.endsWith('"')) {
        labelOuterHtml = labelOuterHtml.slice(0, -1);
    }    
    //console.log(labelOuterHtml);
    let tailwindHtml = "";
    let tailwindBodyClasses = new Array();
    if(useTailwind == 'yes'){
        let forceTailwindBreakpoints = false;
        if(forceBreakpoints == 'yes'){
            forceTailwindBreakpoints = true;
        }
        let resolveTailwindVariables = false;
        if(resolveVariables == 'yes'){
            resolveTailwindVariables = true;
        }

        // DEBUG: Print cssvarDefinedArr to see what CSS variables were captured
        console.log("=== CSS VARIABLES CAPTURED (cssvarDefinedArr) ===");
        console.log("Number of CSS variables defined:", Object.keys(cssvarDefinedArr).length);
        console.log("CSS variable names:", Object.keys(cssvarDefinedArr));
        console.log("Full cssvarDefinedArr object:");
        console.log(JSON.stringify(cssvarDefinedArr, null, 2));
        console.log("=== END CSS VARIABLES ===");

        //console.log("getting tailwind html");
        tailwindHtml = getTailwindHtml(labelOuterHtml, css_lines, snippedArrTailwind, forceTailwindBreakpoints, resolveTailwindVariables);
        tailwindBodyClasses = getTailwindBodyClasses(snippedArrTailwind, forceTailwindBreakpoints, resolveTailwindVariables, tailwindUltimateArr);
        console.log('tailwind html is');
        console.log(tailwindHtml);       
        console.log("tailwind body classes");
        console.log(tailwindBodyClasses);
    }         
    

    var params = {method: "snipped_result", snip_selector: jquerySelector, snip_url: SITE_URL, uid: myUID, snip_name: snipName, snip_lines: snippedArr, snip_css: css_lines, snip_himages: htmlImagesArr,
        snip_fonturls: snipFontUrls, snip_usedfonts: usedFontObjectArr, 
        snip_iframe: iframeHtml, snip_cimages : cssImages, snip_customfonts: customfontsFiles, snip_ziphtml: elementZipHtml, snip_zipextracss: zipExtraCSS, snip_html: elementOuterHtml, index: 0,
    create_date: createDate, element_dim: elementDim, snip_css_noresponsive: css_lines_noresponsive, is_automating: IS_AUTOMATING, automation_uid: AUTOMATE_UID, automation_index: AUTOMATE_INDEX, use_tailwind: useTailwind, tailwind_html: tailwindHtml, tailwind_css : tailwind_css_lines, tailwind_body_classes: tailwindBodyClasses};

    
    chrome.storage.local.get(['snippet_indices'], function(result) {
            //alert("processing current scrape");
            //console.log("storage get sync");
            //console.log(result[SHAWK.SITE_NAME]);       
        
        let allIndices = new Array();
        let maxIndex = 1;
        if(result['snippet_indices']){
            allIndices = result['snippet_indices'];
            for(let a = 0; a < allIndices.length; a++){
                let iObj = allIndices[a];
                let iIndex = parseInt(iObj);
                if(iIndex > maxIndex){
                    maxIndex = iIndex;
                }
            }
        }
        let newIndex = maxIndex + 1;
        let indicesObject = {snip_name: snipName,
            uid: myUID,
            index: newIndex            
        };
        allIndices.unshift(indicesObject);
        //console.log("all indices now ");
        //console.log(allIndices);
        
        var setData = {};
        setData['snippet_indices'] = allIndices;

        chrome.storage.local.set(setData, function() {
            var newSnipData = {};
            newSnipData['snipresult-' + myUID] = params;
            chrome.storage.local.set(newSnipData, function() {
                //console.log("newSnipData " );
                //console.log(newSnipData);
                if(!IS_AUTOMATING){
                    chrome.tabs.sendMessage(SNIPPING_TAB_ID, params);        
                }            
            });
        });                 
    });
 
    var snipLines = snippedArr;
    var cssLines = css_lines;
    var htmlImages = htmlImagesArr;
    var cssImagesText = cssImages;

    var extension_token = self.OPTIONS['api_token'];
    if(!extension_token)
    {
        //user not found
        extension_token = "";            
    }    
    
    resetVariables();
    
    
    let resetAllAutomation = true;
    
    if(IS_AUTOMATING){
        
        console.log("AUTOMATION INDEX " + AUTOMATE_INDEX + " COMPLETE"); 
        params.method = "automate_result";
        params.automate_index = AUTOMATE_INDEX;
        params.automate_selector = jquerySelector;
        params.automate_uid = AUTOMATE_UID;
        
        if(!AUTOMATE_INDICES_CALLED.includes(AUTOMATE_INDEX)){
            console.log("saving automation index " + AUTOMATE_INDEX);
            chrome.tabs.sendMessage(SNIPPING_TAB_ID, params);          
            AUTOMATE_INDICES_CALLED.push(AUTOMATE_INDEX);
        }else{
            console.log("SKIPPING automation index " + AUTOMATE_INDEX);
        }
        
        AUTOMATE_INDEX++;
        
        if(AUTOMATE_SELECTORS.length <= AUTOMATE_INDEX){
            resetAllAutomation = true;            
        }else{
            //only have to send it if continueing?
               
            
            resetAllAutomation = false;
            //rather not send through API... let's send it through window.postMessage above
            //API.sendAutomationData(params, function(dbSnipId){
            //    console.log("insert snippet id " + dbSnipId);
            //});        
            // Send message to content script
            let nextSelector = AUTOMATE_SELECTORS[AUTOMATE_INDEX];
            console.log("next selector: " + nextSelector);
            
            //last one
            processStep = 0;
            var contParams = {
                method: "continue_snipper_from_background",
                automate_uid: AUTOMATE_UID,
                automate_selector: nextSelector,
                automation_index: AUTOMATE_INDEX
            };
            chrome.tabs.sendMessage(SNIPPING_TAB_ID, contParams, function(startSnipResult) {
                console.log("Received result from content script");
                console.log(startSnipResult);
                if (startSnipResult && startSnipResult['result'] == 1) {
                    console.log("Next Element found, starting snipper");
                } else {
                    console.log("Next Element not found");
                    let shouldStop = 1;
                    AUTOMATE_INDEX++;
                    if(AUTOMATE_SELECTORS.length > AUTOMATE_INDEX){
                        shouldStop = 0;
                    }                    
                    var failParams = {method: "extraction_failed",
                        automate_uid: AUTOMATE_UID, automate_selectors: AUTOMATE_SELECTORS, automation_index: AUTOMATE_INDEX,
                        message: "Next Element not found: " + nextSelector, stop_extraction: shouldStop
                    };
                    chrome.tabs.sendMessage(SNIPPING_TAB_ID, failParams);

                    if(AUTOMATE_SELECTORS.length > AUTOMATE_INDEX){                        
                        let paramsContinue2 = {
                            method: "continue_snipper_from_background",
                            automate_uid: AUTOMATE_UID,
                            automate_selector: AUTOMATE_SELECTORS[AUTOMATE_INDEX],
                            automation_index: AUTOMATE_INDEX
                        };                      
                        chrome.tabs.sendMessage(SNIPPING_TAB_ID, paramsContinue2, function(startSnipResult2) {
                            if (startSnipResult2 && startSnipResult2['result'] == 1) {
                                console.log("Element found, starting snipper");
                            } else {                                    
                                var failParams2 = {method: "extraction_failed",
                                    automate_uid: AUTOMATE_UID, automate_selectors: AUTOMATE_SELECTORS, automation_index: 1,
                                    message: "Element not found: " + AUTOMATE_SELECTORS[1], stop_extraction: 1
                                };
                                chrome.tabs.sendMessage(SNIPPING_TAB_ID, failParams2);                                        
                            }

                        });
                    }                    
                    
                    
                }
            });         
        }        
    }
    
    
    
    if(resetAllAutomation){
        
        console.log("resetting all automation");
        chrome.debugger.detach({tabId:SNIPPING_TAB_ID}, function(){
            //detached?
            //onDebuggerDetach(source, "because done snipping");
        });                        

        chrome.tabs.sendMessage(SNIPPING_TAB_ID, {method: "snipcss_success", is_automating: IS_AUTOMATING }, function(response) 
        {
            //if debugger turned off... have to close snipcss on this tab
        });           
        
        console.log("waiting 3 sec for all logs to process");
        setTimeout(function(){
            if(IS_AUTOMATING){
                var params = {
                    method: "automation_complete",
                    automate_uid: AUTOMATE_UID,
                    automate_selectors: AUTOMATE_SELECTORS,
                    index: AUTOMATE_SELECTORS.length
                };
                chrome.tabs.sendMessage(SNIPPING_TAB_ID, params, function(startSnipResult) {

                });                
            }


            AUTOMATE_UID = "";
            AUTOMATE_URL = "";
            AUTOMATE_TYPE = 0;
            AUTOMATE_SELECTORS = new Array();
            IS_AUTOMATING = false;   
            AUTOMATE_INDICES_CALLED = new Array();
            SNIP_TAB_ID = -1;
        
        }, 3000);
        
    }else{
        console.log("continue to next element");
    }
    
    

    //communicate with API that is done?
    /*
    chrome.debugger.detach({tabId:targetTabId}, function(){
        //detached?
    });                       

    //var execResult = await syncSendRequest(tabId, params);
    chrome.runtime.openOptionsPage(function(){
        setTimeout(function(){
            console.log("done opening options page");
            chrome.runtime.sendMessage(params);      
            chrome.tabs.sendMessage(sender.tab.id, params);                                                               
        }, 100);
    });
    */             

}

/*
 var executeScript = (target, params) => new Promise((res, err)=>{
    chrome.tabs.executeScript( target, params, result=>{
      if (chrome.runtime.lastError) {
        err(chrome.runtime.lastError);
      } else {
        res(result);
      }
      console.log('executeScript', params);
    });
     
 }); 
 


var executeTest = async function(tabId){
    
    var testSelector = "#wrapper .inner";
    var rootSelector = "#main";
    //we would expect it to return
    //.inner
    
    var params =  { code: '(function(){return window.snipcssUtils.snipcssFixSelector("' + testSelector + '","' + rootSelector + '"); })();'};
    var execResult = await executeScript(tabId, params);
    console.log("executeResult: ");
    var finalExecResult = execResult[0];
    console.log(finalExecResult);
};
*/


 var syncSendRequest = (target, params) => new Promise((res, err)=>{
    chrome.tabs.sendMessage( target, params, result=>{
      if (chrome.runtime.lastError) {
        err(chrome.runtime.lastError);
      } else {
        res(result);
      }
      //console.log('syncsendrequest', params);
    });
     
 });  

var sendrequestTest = async function(tabId){
    
    var testSelector = "#wrapper .inner";
    var rootSelector = "#main";
    //we would expect it to return
    //.inner
    var params = {method: "snipcss_fix_selector", test_selector: testSelector, root_selector: rootSelector, other_inherited: false, label_class: 'snipcss-0-0-1', nopseudo_selector: testSelector};
    //var params =  { code: '(function(){return window.snipcssUtils.snipcssFixSelector("' + testSelector + '","' + rootSelector + '"); })();'};
    var sendResult = await syncSendRequest(tabId, params);
    
        console.log("sendResult: ");
        console.log(sendResult);        
    /*
    chrome.tabs.sendMessage(tabId, params, response => {
        console.log("sendResult: ");
        console.log(response);                 
    });    
    */
   
    //var finalExecResult = execResult[0];
    //console.log(finalExecResult);
    
}


	/******** CHROME HANDLERS ************/
    /**********
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
	{
    try{
        console.log("METHOD REQUEST RECEIVED ");
        console.log(request);

            
	    else{
	       sendResponse({data: "unknown request"}); 
        }
    }catch(reqex){
        //RECORD ERROR MESSAGE
        let msg = reqex.message;
        var allSelectors = allJquerySelectors.join('|');
        var siteUrl = SITE_URL;
        var lineNum = "1";
        var extension_token = localStorage['api_token'];
        if(!extension_token){
            extension_token = "";            
        }                      
        var allError = msg;
        try{
            allError += " - " + reqex.stack;        
            lineNum =  (new Error).stack.split("\n")[4];
        }catch(att){
            console.log("bad error data");
        }
        if(MAX_ERRORS > 0){
            MAX_ERRORS--;                        
            API.sendSnipcssError(siteUrl, "snipbackground-request", lineNum, allError, allSelectors, "", extension_token);
        }        
    }
        
	});	
    ****/

    /*
    chrome.browserAction.onClicked.addListener((tab) => {
      console.log("doesnt work including scripts");
      if(!tab.url.includes("chrome://")) {          
          SNIP_TAB_ID = tab.id;
          var def = [
            "js/jquery-3.3.1.min.js",			
            "js/mustache.js",
            "js/micromodal.min.js",
            "js/tether.min.js",
            "js/draggabilly.pkgd.min.js",
            "js/sniptools.js",  
            "js/kiwi_walker.js",                
            "js/selectionBox.js",
            "js/selectElemListeners.js",
            "js/uri.all.min.js",
            "js/snipcss_api.js",                
            "contentscript_kiwi.js"               
          ];          
          concatenateInjections(tab.id, def);
          chrome.tabs.insertCSS(tab.id,  { file: "css/snipcss_styles.css" });
          chrome.tabs.insertCSS(tab.id,  { file: "css/tether.css" });
          chrome.tabs.insertCSS(tab.id,  { file: "css/tether-theme-basic.css" });
          chrome.tabs.insertCSS(tab.id,  { file: "css/micromodal.css" });
          console.log("attaching debugging");
            chrome.debugger.attach({tabId:tab.id}, "1.3",
                onDebuggerAttach.bind(null, tab.id));                          

          console.log("done including");
      }
    });    
    */
    
    
    function concatenateInjections(id, ar, scrpt){

      if( typeof scrpt !== 'undefined' ) ar = ar.concat([scrpt]);

      var i = ar.length;
      var idx = 0 ;

      (function (){
        var that = arguments.callee;
        idx++;
        if(idx <= i){
          var f = ar[idx-1];
          chrome.tabs.executeScript(id, { file: f }, function(){ that(idx);} );
        }
      })();

    }
    /* FIRST RUN */
  function onInstall() 
  {
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
      console.log("FIRST RUN OPTIONS PAGE TURNED OFF------------------------------ DO NOT SHIP THIS");
/*      
    var fullUrl = chrome.runtime.getURL("options.html");
    chrome.tabs.create({
        url: fullUrl
    });		
*/    
  }

  function onUpdate() 
  {
      /*
     console.log("Extension Updated");
     let theVersion = getVersion();
     console.log("Version " + theVersion);
     var fullUrl = chrome.runtime.getURL("options.html#versionupdate");
     chrome.tabs.create({
        url: fullUrl
     });	     
      */
  }

  function getVersion() 
  {
    var manifest = chrome.runtime.getManifest();
    var current_version = manifest.version;
    console.log("skipping waiting");
        self.skipWaiting();
    //console.log("details");
    //console.log(manifest);
    return current_version;
  }
  
chrome.storage.local.get(['version'], function(result) {
    
  var prevVersion = result['version'];
  var currVersion = getVersion();  
  console.log("previous version: " + prevVersion);
  console.log("current version: " + currVersion);
  
  if (currVersion != prevVersion) 
  {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') 
	{
        //we automate with chrome usually, and test with edge (usually)
        onInstall();
    } 
	else 
	{
      onUpdate();
    }
    var setVersion = {};
    setVersion['version'] = currVersion;
    chrome.storage.local.set(setVersion, function() {
    });         
  }	         
});  
  
  
  function overMaxSize(keyString){
        var size = unescape(encodeURIComponent(keyString)).length;
        var theSize = +(size / 1024 / 1024).toFixed(3);
        console.log("snippets size");
        console.log(theSize);
        
        if(theSize > 4.0){
            console.log("over max size");
            return true;
        }

        
        return false;
  }   
    function randomLetters(length){
        var letters = "abcdefghijklmnopqrstovwxyzABCDEFGHIJKLMNOPQRSTUVWYXZ1234567890";
        var len = letters.length - 1;
        var retString = "";
        for(var x =0; x < length; x++){
            var rand = Math.floor(Math.random() * len);
            retString = retString + letters.substr(rand, 1);
        }
        return retString;
    }
    function randomLowercase(length){
        var letters = "abcdefghijklmnopqrstovwxyz1234567890";
        var len = letters.length - 1;
        var retString = "";
        for(var x =0; x < length; x++){
            var rand = Math.floor(Math.random() * len);
            retString = retString + letters.substr(rand, 1);
        }
        return retString;
    }        
    function randomLowercaseLetters(length){
        var letters = "abcdefghijklmnopqrstovwxyz";
        var len = letters.length - 1;
        var retString = "";
        for(var x =0; x < length; x++){
            var rand = Math.floor(Math.random() * len);
            retString = retString + letters.substr(rand, 1);
        }
        return retString;
    }       
    
    function cleanupOuterHtml(theHtml){
        //not implemented yet
        theHtml = useOneImageForSrcSets(theHtml);
        
        theHtml = removeScriptsAndComments(theHtml);
        //only happens on spotify for some reason?
        //theHtml = removeSnipcssClasses(theHtml);
        
        return theHtml;
    }
    function isComment(index, node) {
      return node.type === 'comment';
    }
    
    function removeScriptsAndComments(theHtml){        
        var $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);        

        $editHtml.root().find('script').remove();
        $editHtml.root().find('style').remove();
        $editHtml.root().find('*').contents().filter(isComment).remove();        

        return $editHtml.root().html();
    }
        
    function htmlHasATag(theHtml, trimSelector){
        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        let theLen = $editHtml.root().find(trimSelector).length;     

        if(theLen > 0){
            return true;
        }
        return false;
    }
    
    function addPropToTag(theHtml, trimSelector, newProp){
        
        //currOuterHtml = $currOuterHtml.find(trimSelector).attr(newProp, '').parents('.' + currCssSelector).root().html();
        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        $editHtml.root().find(trimSelector).attr(newProp, ''); 

        return $editHtml.root().html();
    }
    function addPropToRoot(theHtml, newProp){

        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        $editHtml.root().addClass(newProp);     

        return $editHtml.root().html();
    }     
    
    function addClassToTag(theHtml, trimSelector, newClass){

        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        $editHtml.root().find(trimSelector).addClass(newClass);     

        return $editHtml.root().html();
    }  
    
    function addSelectorClassToTailwindElements(labelHtml, elemSelector, addSelector){
        let $editHtml = cheerio.load(labelHtml, CHEERIO_OPTIONS, false);
        
        //so we want to add the addSelector to the each of the ['selectors']
        /*
         matchingFinalRules[aClassname] = {};
         matchingFinalRules[aClassname]['indices'] = new Array();
         matchingFinalRules[aClassname]['selectors'] = new Array();
         
         
        */
        
        
        $editHtml.root().find(elemSelector).each(function(i, elem){
            
        });

        //return $editHtml.root().html();        
    }
    
    function addClassToRoot(theHtml, newClass){

        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        $editHtml.root().addClass(newClass);     

        return $editHtml.root().html();
    }            
    
    function useOneImageForSrcSets(theHtml){
        //console.log("BEFORE USE ONE IMAGE FOR SRCSET " );
        //console.log(theHtml);
        let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
        try{
            $editHtml.root().find("picture").each(function(i, elem){
                console.log("found picture");
                var pictureElem = elem;
                if($editHtml(pictureElem).find('img').length > 0){
                    var imgElem = $editHtml(pictureElem).find('img').get(0);
                    var theSrc = $editHtml(imgElem).attr('src');
                    $editHtml(pictureElem).find('source').remove();                
                }else{
                    let aSrc = null;
                    $editHtml(pictureElem).find('source').each(function(i, myelem){
                        console.log("setting srcset ");
                        if($editHtml(myelem).attr('srcset')){
                            aSrc = $editHtml(myelem).attr('srcset').split(',')[0];
                            aSrc = $editHtml(myelem).attr('srcset').split(' ')[0];                        
                        }
                    });
                    $editHtml(pictureElem).find('source').remove();                    
                    $editHtml(pictureElem).html('<img src="' + aSrc + '" />')

               }
            });

            // For img elements directly using srcset
            $editHtml('img[srcset]').each(function(i, elem) {           
                let urls = $editHtml(elem).attr('srcset').split(','); // Split by comma
                let firstUrlAndDescriptor = urls[0].trim().split(' '); // Trim and split by space
                let aSrc = firstUrlAndDescriptor[0];                    
                $editHtml(elem).removeAttr('srcset');
                $editHtml(elem).removeAttr('sizes');
            });
        }catch(hmm){
            console.log("useOneImageForSrcsetErr");
            console.log(hmm);
        }
        //console.log("AFTER USE ONE IMAGE FOR SRCSET" );
        //console.log($editHtml.html());
        

        return $editHtml.root().html();
    }
    
    
    function addCssVariableFromVal(lineVal){
        //adding --var( to list
        var allLineVals = lineVal.split(',');
        for(var a = 0; a < allLineVals.length; a++){
            var myLine = allLineVals[a];        
            if(myLine.indexOf('--') >= 0){
                //console.log("myline " + myLine);
                var firstIndex = myLine.indexOf('--');                        
                var subPart = myLine.substring(firstIndex + 2);
                var lastIndex = subPart.length;
                for(var m = 0; m < subPart.length; m++){
                    var aChar = subPart.charAt(m);
                    var code = subPart.charCodeAt(m);
                    if (!(code > 47 && code < 58) && // numeric (0-9)
                        !(code > 64 && code < 91) && // upper alpha (A-Z)
                        !(code > 96 && code < 123) && 
                        aChar != '_' && aChar != '-') { // underscore and dash
                        //console.log("breaking at " + String.fromCharCode(code));
                        lastIndex = m;
                        break;
                    }     
                }
                let variableText = subPart.substring(0, lastIndex);
                //variableText = variableText.replace(')', '');
                variableText = replaceAll(variableText, ")", "");
                variableText = replaceAll(variableText, ";", "");
                variableText = replaceAll(variableText, "\n", "");                
                //console.log("has variable ");
                //console.log(variableText);
                
                if(!cssvarUsedArr.includes(variableText)){
                    cssvarUsedArr.push(variableText);
                }

                while(subPart.indexOf('--') >= 0){
                    firstIndex = subPart.indexOf('--');
                    subPart = subPart.substring(firstIndex + 2);
                    lastIndex = subPart.length - 1;
                    for(var m = 0; m < subPart.length; m++){
                        var aChar = subPart.charAt(m);
                        var code = subPart.charCodeAt(m);
                        if (!(code > 47 && code < 58) && // numeric (0-9)
                            !(code > 64 && code < 91) && // upper alpha (A-Z)
                            !(code > 96 && code < 123) && 
                            aChar != '_' && aChar != '-') { // underscore and dash
                            lastIndex = m;
                            break;
                        }                            
                    }
                    variableText = subPart.substring(0, lastIndex);   
                    //console.log("anothervar subpart " + subPart);
                    //console.log("subpart variable ");
                    //console.log(variableText);   
                    cssvarUsedArr.push(variableText);                            
                }
            }        
        }
       
        
        
    }
    
    function replaceStyleAttributes(theHtml){
         let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
         //let $editZipHtml = cheerio.load(theZipHtml, null, false);
         let removedStyle = false;
         let extraCssLines = "";
         let retSnipArr = new Array();
         
         $editHtml.root().find("*").each(function(i, elem){
           //console.log("what is this");
           //console.log(elem);
           
           var myTagname = elem.tagName;
           //console.log("tagname " + myTagname);
            if(myTagname == 'path' || myTagname == 'rect' || myTagname == 'circle' ||
               myTagname == 'ellipse' || myTagname == 'line' || myTagname == 'polyline' ||
               myTagname == 'polygon' || myTagname == 'svg'){
                   
               console.log("skipping svg");
               return;
             }           
           var me = elem;
           elem.attributes.forEach(function (currAttr, index) {    
                 try{
                    var aName = currAttr.name.toLowerCase();                    
                    if(aName == 'style'){
                        //console.log("removing style in element ");
                        //console.log(me);
                        if(extraCssLines == ''){
                            extraCssLines += '/' + '* These were inline style tags. Uses id+class to override almost everything *' + '/' + "\n";
                        }
                        if(!currAttr.value || currAttr.value.indexOf(';') < 0){
                            //skip this, empty value...
                            return;
                        }
                        
                        let newClass = "style-" + randomLetters(5);                        
                        let existingId = $editHtml(elem).attr('id');
                        let hadId = false;
                        if(!existingId){
                            existingId = newClass;
                        }else{
                            hadId = true;
                        }
                        
                        var allValues = currAttr.value.split(';');
                        if(allValues.length > 0){
                            extraCssLines += "#" + existingId + "." + newClass + " {  \n";
                            for(let c = 0; c < allValues.length; c++){
                                let fullLine = allValues[c];
                                if(fullLine.length >= 3){
                                    extraCssLines += "   " + fullLine + ";  \n";
                                }
                            }
                            extraCssLines += "}  \n";
                        }
                        var snippedData = {};
                        snippedData['selector'] = "#" + existingId + "." + newClass;
                        snippedData['body'] = currAttr.value;
                        snippedData['media'] = "";
                        snippedData['stylesheet_id'] = "";
                        snippedData['line_num'] = 99999999;
                        snippedData['the_classname'] = newClass;
                        //index of the element
                        snippedData['sel_index'] = 0;  
                        snippedData['simple_selector'] = false;                                  
                        snippedData['merged_skip'] = true;
                        snippedData['device'] = 'desktop';                        
                        retSnipArr.push(snippedData);
                        if(!hadId){
                            $editHtml(elem).attr('id', existingId);    
                        }
                        $editHtml(elem).addClass(newClass);     
                        $editHtml(elem).removeAttr(currAttr.name);
                        removedStyle = true;
                    }                    
                 }catch(ex){
                     console.log(ex);
                     
                     console.log("bad element?");
                     console.log(me);
                 }

           });
            
         });   
         
        let newHtml = $editHtml.root().html();               
        return { removed_style: removedStyle,
            snip_arr: retSnipArr,
            new_html: newHtml,
            extra_css: extraCssLines};             
    }

    function removeExtraAttributes(theHtml, snippedArr, doCSS, doAttr, scopePrefix, keepTailwindLabels){
      
      console.log("removing extra attributes");
      var removeCSS = false;
      var removeAttr = false;
      //console.log("removeCSS is ");
      //console.log(removeCSS);
      if(doCSS == 'yes'){
          removeCSS = true;
      }
      if(doAttr == 'yes'){
          removeAttr = true;
      }
         let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
          //var $editHtml = $(theHtml);
         var keepArr = ['align', 'for', 'type', 'value', 'valign', 'bgcolor', 'background', 'width','height', 'style', 'src', 'href', 'source', 'dir', 'viewBox', 'xmlns', 'placeholder', 'd', 'colspan', 'rowspan', 'span', 'headers', 'scope'];
         //console.log("html before");
         //console.log(theHtml);
         $editHtml.root().find("*").each(function(i, elem){
           //console.log("what is this");
           //console.log(elem);
           
           var myTagname = elem.tagName;
           //console.log("tagname " + myTagname);
            if(myTagname == 'path' || myTagname == 'rect' || myTagname == 'circle' ||
               myTagname == 'ellipse' || myTagname == 'line' || myTagname == 'polyline' ||
               myTagname == 'polygon' || myTagname == 'svg'){
                   
               //console.log("skipping svg");
               return;
               //child.setAttribute('class', child.getAttribute('class'));
               //use setAttrubute instead?
             }           
           var me = elem;
           elem.attributes.forEach(function (currAttr, index) {    
             //console.log("attribute");
             //console.log(currAttr);
             // this.attributes is not a plain object, but an array
             // of attribute nodes, which contain both the name and value
             //if(currAttr.specified) {
             //}
                 try{
                    //console.log("found attribute and testing ");
                    //console.log(currAttr.name, currAttr.value);                      

                    var aName = currAttr.name.toLowerCase();
                    if(keepArr.includes(aName)){
                        //console.log("attribute in keepArr");
                        return;
                    }
                    if(aName.indexOf('data') === 0){
                        //console.log("Found Data attribute");
                        if(!scopePrefix || scopePrefix.length <= 0){
                            //console.log("No scope prefix we leave all data attribute");
                            return;
                        }
                        if(aName.indexOf(scopePrefix) >= 0){
                            //console.log("SnipCSS added this data atribute for scoping. ");
                            return;
                        }
                        for(var jj = 0; jj < snippedArr.length; jj++){
                          var mySelector = snippedArr[jj]['selector'];
                          if(!keepTailwindLabels && mySelector.indexOf(currAttr.name) >= 0){
                              //console.log("There exists a selector with this specific data attribute " + this.name);
                              return;
                          }
                        }                             
                        
                    }
                    else if(aName == 'class'){
                      if(!removeCSS){
                          return;
                      }
                      var classList = currAttr.value.split(/\s+/);
                      var removeClasses = new Array();
                      for (var i = 0; i < classList.length; i++) {
                          var classInside = false;
                          var aClass = classList[i];
                          
                          //var badArray = ['#','~','!','@','$','%','^','&','*','(',')','=','.','/',':','"','?','>','<','[',']','{','}','|','`'];
                          //var badArray = ['#','~','!','@','$','%','^','&','*','(',')','=','.','/',':','"','?','>','<','[',']','{','}','|','`'];
                          //for(var baa = 0; baa < badArray.length; baa+){
                          //    var badChar = badArray[baa];
                          //    if(aClass.indexOf(badChar) >= 0){
                          //        aClass = aClass.split(badChar)[0];
                          //    }                                                        
                          //}
                          if(keepTailwindLabels){
                            if(aClass.startsWith('snipcss')){
                                continue;
                            }
                            // Preserve icon font classes for Tailwind output
                            if(isIconFontClassname(aClass)){
                                continue;
                            }
                          }


                          if(aClass.indexOf(':') >= 0){
                              aClass = aClass.split(':')[0];
                          }                          
                          if(aClass.indexOf('\\') >= 0){
                              aClass = aClass.split('\\')[0];
                          }               
                          if(aClass.indexOf('\/') >= 0){
                              aClass = aClass.split('\/')[0];
                          }          
                          if(aClass.indexOf('[') >= 0){
                              aClass = aClass.split('[')[0];
                          }
                          if(aClass.indexOf('.') >= 0){
                              aClass = aClass.split('[')[0];
                          }                          
                          
                          if(aClass.trim() == ""){
                              continue;
                          }
                          //looped through snipped array
                          for(var j = 0; j < snippedArr.length; j++){
                            let mySelector = snippedArr[j]['selector'];
                            if(!keepTailwindLabels && mySelector.indexOf(aClass) >= 0){
                                classInside = true;
                            }
                          }
                          if(!classInside){
                              //console.log("class not found " + aClass);
                              removeClasses.push(aClass);
                          }
                      }
                      if(removeClasses.length > 0){
                          //console.log("removing classes");
                          //console.log(removeClasses);
                          for(var k = 0; k < removeClasses.length; k++){
                              //console.log("removing class 1");
                              //console.log(removeClasses[k]);      
                              $editHtml(elem).removeClass(removeClasses[k]);
                              //me.classList.remove(removeClasses[k]);        
                          }
                      }
                      
                      return;
                    }
                    else if(aName == 'id' || aName == 'name'){
                        if(!removeAttr){
                            return;
                        }
                        var attrInSelector = false;
                        //process startsWith selector
                        //starts with selector
                        
                        for(var j = 0; j < snippedArr.length; j++){
                          var mySelector = snippedArr[j]['selector'];
                          if(!keepTailwindLabels && mySelector.indexOf(currAttr.value) >= 0){
                              attrInSelector = true;
                          }
                        }
                        //these tags keep ids names
                        if(myTagname == 'input' || myTagname == 'select' || myTagname == 'meter' || myTagname == 'progress'){
                            attrInSelector = true;                            
                        }
                        
                        if(!attrInSelector){
                            //console.log("removing id/name attribute 1" + currAttr.name + "=" + currAttr.value);
                            $editHtml(elem).removeAttr(currAttr.name);
                            //me.removeAttribute(currAttr.name);                                                 
                        }

                        return;
                    }                      
                    //console.log("removing attribute 2" + currAttr.name);
                    if(removeAttr){
                        $editHtml(elem).removeAttr(currAttr.name);
                    }
                 }catch(ex){
                     console.log(ex);
                     
                     console.log("bad element?");
                     console.log(me);
                 }

           });
            
         });   
         
        let retHtml = $editHtml.root().html();      
        retHtml = replaceAll(retHtml, 'class=""', "");
        return retHtml;
  }       
  
  

    function transmogrifyCSS(theHtml, mySnippedArr, globalPrefix){
        
      console.log("transmorgrifyCSS with global prefix " + globalPrefix);
      //var tmClassArr = new Array();
      //var tmIdArr = new Array();
        let commonClasses = [
          "container","content","section","wrapper","header","footer","main","sidebar","navbar","nav","menu","dropdown","modal",
          "card","row","col","column","grid","item","list","box","block","form","field","input","button","link","text","title","subtitle","body","panel",
          "alert","message","tooltip","popover","badge","label","tag","tabs","table","post","comment","article","breadcrumb","pagination",
          "carousel", "slide", "accordion", "overlay", "lightbox", "popup", "progress", "bar", "chart", "map", "media", "image",
          "video", "audio", "gallery", "thumbnail", "caption", "avatar", "profile", "logo",
          "search", "filter", "sort", "toggle", "switch", "checkbox", "radio","select", "option",
          "breadcrumb-item","carousel-item","dropdown-item","dropdown-menu","navbar-brand","navbar-collapse","navbar-nav","nav-item",
          "nav-link","list-group","list-group-item",
          "form-group","form-control","btn","btn-primary","btn-secondary","btn-link","icon","fa","spinner",
          "loading","error","success","warning","info"
        ];

        commonClasses.sort(function(a, b) {
          return b.length - a.length;
        });      

        //console.log("TRANSMORETGIGITHH ");
        console.log(theHtml);
        
         let $editHtml = cheerio.load(theHtml, CHEERIO_OPTIONS, false);
       $editHtml.root().find("*").each(function(i, elem){
           var myTagname = elem.tagName;
           //console.log("tagname " + myTagname);
            if(myTagname == 'path' || myTagname == 'rect' || myTagname == 'circle' ||
               myTagname == 'ellipse' || myTagname == 'line' || myTagname == 'polyline' ||
               myTagname == 'polygon' || myTagname == 'svg'){

               console.log("skipping svg");
               return;
             }           
           var me = elem;
           elem.attributes.forEach(function (currAttr, index) {    
                 try{
                    //console.log("baaaaaaaaaaaaaaaaaaaaaaaaaaaaa ");
                    //console.log(currAttr.name, currAttr.value);                      

                    var aName = currAttr.name.toLowerCase();
                    if(aName == 'class'){
                      var classList = currAttr.value.split(/\s+/);
                      for (var i = 0; i < classList.length; i++) {
                          let aClass = classList[i].trim();
                          //console.log("transforming a class" + aClass);
                          
                          if(Object.keys(tmClassArr).includes(aClass)){
                              console.log("already in array");
                              continue;
                          }
                          let renamedAlready = false;
                          for(let c = 0; c < commonClasses.length; c++){
                              if(aClass.indexOf(commonClasses[c]) >= 0){
                                  let newCommonName = commonClasses[c] + "-" + randomLowercase(3);
                                  if(globalPrefix != ''){
                                      newCommonName = globalPrefix + randomLowercase(5);
                                  }                                  
                                  let newCssName = newCommonName;
                                  newCssName = replaceAll(newCssName, ':', '');
                                  //console.log("tmClassArr {" + aClass + " => " + newCssName + "}");
                                  tmClassArr[aClass] = newCommonName;
                                  //console.log(tmClassArr);
                                  renamedAlready = true;
                                  break;
                              }                              
                          }
                          if(renamedAlready){
                              continue;
                          }
                          if (aClass.indexOf('-') >= 0) {
                              
                              let firstSplit = aClass.split('-')[0];
                              if(self.OPTIONS['scope_prefix'].startsWith(firstSplit)){
                                  let newCssName = aClass + "-" + randomLowercase(3);
                                  if(globalPrefix != ''){
                                      newCssName = globalPrefix + randomLowercase(5);
                                  }
                                  newCssName = replaceAll(newCssName, ':', '');
                                  tmClassArr[aClass] = newCssName;    
                                  //console.log("222tmClassArr {" + aClass + " => " + newCssName + "}");
                              }else{
                                  let lastDashIndex = aClass.lastIndexOf('-');
                                  let prefix = aClass.substring(0, lastDashIndex);
                                  let newCssName = prefix + "-" + randomLowercase(3);
                                  if(globalPrefix != ''){
                                      newCssName = globalPrefix + randomLowercase(5);
                                  }                                  
                                  newCssName = replaceAll(newCssName, ':', '');
                                  tmClassArr[aClass] = newCssName;
                                  //console.log("333tmClassArr {" + aClass + " => " + newCssName + "}");
                             }
                          }                           
                          else if(aClass.length > 3){
                               let newCssName = aClass.substring(0, 3) + "-" + randomLowercase(3);
                               if(globalPrefix != ''){
                                   newCssName = globalPrefix + randomLowercase(5);
                               }                              
                              newCssName = replaceAll(newCssName, ':', '');
                              tmClassArr[aClass] = newCssName;
                              //console.log("444tmClassArr {" + aClass + " => " + newCssName + "}");
                          }else{
                              let newCssName = randomLowercaseLetters(5);
                              if(globalPrefix != ''){
                                   newCssName = globalPrefix + randomLowercase(5);
                              }                                
                              newCssName = replaceAll(newCssName, ':', '');
                              tmClassArr[aClass] = newCssName;        
                              //console.log("555tmClassArr {" + aClass + " => " + newCssName + "}");
                          }                          
                          

                      }
                    }
                    else if(aName == 'id' || aName == 'name'){
                        let currId = currAttr.value;
                        if(aName == 'name' && myTagname == 'div'){
                            console.log("skipping names on div");
                           //some dumb website does this
                           //skip it
                        }
                        else if(currId.length > 3){
                            let newId = currId.substring(0, 3) + "-" + randomLowercase(3);
                            if(globalPrefix != ''){
                                 newId = globalPrefix + randomLowercase(5);
                            }                                 
                            tmIdArr[currId] = newId;
                        }else{
                            let newId = randomLowercaseLetters(5);
                            if(globalPrefix != ''){
                                 newId = globalPrefix + randomLowercase(5);
                            }                                
                            tmIdArr[currId] = newId;                            
                        }                          
                    }                      
                 }catch(ex){
                     console.log(ex);                     
                     console.log("bad transmorgrify element?");
                     console.log(me);
                 }

           });
         });  
         
        //now tmClassArr has all the renamed ones, actually go through and replace them
        //console.log("tmClassArr");
        //console.log(tmClassArr);
         
       $editHtml.root().find("*").each(function(i, elem){
           var myTagname = elem.tagName;
           //console.log("tagname " + myTagname);
            if(myTagname == 'path' || myTagname == 'rect' || myTagname == 'circle' ||
               myTagname == 'ellipse' || myTagname == 'line' || myTagname == 'polyline' ||
               myTagname == 'polygon' || myTagname == 'svg'){

               console.log("skipping svg");
               return;
             }           
           var me = elem;
           elem.attributes.forEach(function (currAttr, index) {    
                 try{
                    //console.log("found attribute and testing ");
                    //console.log(currAttr.name, currAttr.value);                      

                    var aName = currAttr.name.toLowerCase();
                    if(aName == 'class'){
                        let newList = new Array();
                        //console.log("old css string " );
                        //console.log(currAttr.value);
                        var classList = currAttr.value.split(/\s+/);
                        for (var i = 0; i < classList.length; i++) {
                            let aClass = classList[i].trim();
                            if(Object.keys(tmClassArr).includes(aClass)){
                                newList.push(tmClassArr[aClass]);
                            }else{
                                
                                //shouldn't happen all should be replace
                                //console.log("SHOULDNT HAPPEN TRANSMORGRGYG - CLASS NOT FOUDN: " + aClass);
                                newList.push(aClass);
                            }
                        }
                        let newCssString = newList.join(" ");
                        //console.log("new css string " );
                        //console.log(newCssString);
                        //$editHtml(elem).attr('class', '');                        
                        for(let n = 0; n < newList.length; n++){
                            //console.log("adding individually " + newList[n]);
                            $editHtml(elem).removeClass(classList[n].trim());   
                            $editHtml(elem).addClass(newList[n]);                            
                        }
                    }
                    else if(aName == 'id' || aName == 'name'){
                       let currId = currAttr.value;
                       $editHtml(elem).attr('id', tmIdArr[currId]);   
                    }                      
                 }catch(ex){
                     console.log(ex);                     
                     console.log("bad transmorgrify element?");
                     console.log(me);
                 }

           });
         });  
         
        let retHtml = $editHtml.root().html();      
        retHtml = replaceAll(retHtml, 'class=""', "");         
         //console.log("NEW TRANSMORGIFY HTML");
         //console.log(retHtml);
         
         var replaceClasses = function(selector) {
           let newSelector = selector;

           for (let key in tmClassArr) {
            let origKey = key;
            let index = newSelector.indexOf('.' + key);
            if(index === -1 && key.indexOf(':') >= 0){
                //console.log("TRAMMMMM FOUND COLON IN CLASS: " + key);
                //console.log("trying to match selector " + newSelector);
                key = key.replaceAll(':', '\\:');
                index = newSelector.indexOf('.' + key);
                //console.log("key now " + key + " index: " + index);
            }

            while (index !== -1) {
              let nextCharIndex = index + key.length + 1;  // +1 to account for dot
              let nextChar = newSelector.charAt(nextCharIndex);

              // Check if next character is valid for a CSS class name (alphanumeric or '-')
              if (!nextChar.match(/[\w-]/)) {
                newSelector = newSelector.substring(0, index) + '.' + tmClassArr[origKey] + newSelector.substring(nextCharIndex);
              }

              index = newSelector.indexOf('.' + key, index + 1);
            }
           }

           return newSelector;
         } 
         var replaceIds = function(selector) {
           let newSelector = selector;

           for (let key in tmIdArr) {
            let index = newSelector.indexOf('#' + key);

            while (index !== -1) {
              let nextCharIndex = index + key.length + 1;  // +1 to account for dot
              let nextChar = newSelector.charAt(nextCharIndex);

              // Check if next character is valid for a CSS class name (alphanumeric or '-')
              if (!nextChar.match(/[\w-]/)) {
                newSelector = newSelector.substring(0, index) + '#' + tmIdArr[key] + newSelector.substring(nextCharIndex);
              }

              index = newSelector.indexOf('#' + key, index + 1);
            }
           }

           return newSelector;
         }         
         
         
         for(let s = 0; s < mySnippedArr.length; s++){
             let snipSelector = mySnippedArr[s]['selector'];
             try{                 
                 let replaceSelector = replaceClasses(snipSelector);
                 replaceSelector = replaceIds(replaceSelector);
                 mySnippedArr[s]['selector'] = replaceSelector;
                 //console.log("old selector");
                 //console.log(snipSelector);
                 //console.log("new selector");
                 //console.log(replaceSelector);
                 
             }catch(emmm){
                 console.log("Transmorgify replace selector error");
                 console.log(emmm);
             }             
         }


        //snippedArr
        /*
                        snippedArr[snippedArr.length - 1]['merged_skip'] = true;
                        var snippedData = {};
                        snippedData['selector'] = selText;
                        snippedData['body'] = ruleBody;
                        snippedData['media'] = mediaSelector;
                        snippedData['stylesheet_id'] = stylesheetId;
                        snippedData['line_num'] = lineNum;
                        snippedData['the_classname'] = aClassname;
                        //index of the element
                        snippedData['sel_index'] = selIndex;  
                        snippedData['merged_skip'] = true;
                        snippedData['device'] = currDevice;        
        */
         
         
        return {'html' : retHtml, 'new_sniparr': mySnippedArr};
  }    



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
    console.log("onMessage received " + request.method);
    /*
    try{
        console.log(request);    
    */
        if(request.method == "optionsLinkClick")
        {
            //console.log("options link click");
            var navLink = request.page;
            var extraPage = "";
            if(navLink){
                extraPage = navLink;
            }
            var theUrl = 'https://www.snipcss.com/' + extraPage;
            chrome.tabs.create({
                url: theUrl
            });
        }
        else if(request.method == "include_snipcss_scripts"){
          console.log("including scripts from popup");
              var tabId = request.tabid;
              var tabUrl = request.taburl;
          console.log("tabId");
          console.log(tabId);
          console.log("taburl");
          console.log(tabUrl);
          
              SNIP_TAB_ID = tabId;
              injectSnipcssScripts(tabId);
                chrome.debugger.attach({tabId: tabId}, "1.3",
                    onDebuggerAttach.bind(null, tabId));                          

              console.log("done including");         
        }    
        if (request.method == "amIActive") {
           var currTab = sender.tab.id;
           var isActive = 0;
           if(SNIP_TAB_ID == currTab){
               //yes
               isActive = 1;
           }
           if(WAITING_FOR_RELOAD){
               var targetTab = RELOAD['target_tab'];
               if(targetTab.tabId == currTab){
                   console.log("is reload");
                   sendResponse({is_active: isActive, is_reload: 1, reload_data: RELOAD});
                   return true;
               }
           }

           sendResponse({is_active: isActive, is_reload: 0});                  
        }            
        else if(request.method == 'attachDebugger'){
            console.log("attaching debugger");
            var myTabId = sender.tab.id;
            var windowId = sender.tab.windowId;                

            chrome.debugger.attach({tabId:myTabId}, "1.3",
                onDebuggerAttach.bind(null, myTabId));       


        }
        else if(request.method == 'get_all_options'){
            var targetTab = {tabId: sender.tab.id};    
            var targetTabId = sender.tab.id;

           
            
            console.log("in all options");
            getOptionStorage(function(result) {
                var scopeGenerics = result['scope_generics'];
                var removeVendorPrefix = result['remove_vendorprefix'];
                var removeInheritRules = result['remove_inheritrules'];
                var multipleResolutions = result['multiple_resolutions'];
                var unusedCSS = result['unused_css'];  
                var replaceClasses = result['replace_classes'];                  
                var unusedAttributes = result['unused_attributes'];
                var useTailwind = result['use_tailwind'];
                var forceBreakpoints = result['force_breakpoints'];
                var resolveVariables = result['resolve_variables'];
                var reloadResolutions = result['reload_resolutions'];
                var defaultResolutions = result['default_resolutions'];

                var controlsPosition = result['controls_start_position'];
                if(!controlsPosition){
                    controlsPosition = {
                        right: "default",
                        top: "default"
                    };
                }else{
                    controlsPosition = JSON.parse(controlsPosition);
                    console.log("loaded controls position");
                    console.log(controlsPosition);
                }
                //var userEmail = localStorage['user_email'];
                var userEmail = result['user_email'];
                var userApiKey = result['api_key'];
                var userPro = result['pro_user'];
                var proUser = false;
                if(userPro == 1){
                    if(!defaultResolutions){
                        defaultResolutions = ['default', 'iphonexs', 'ipadvertical'];
                    }
                    proUser = true;
                }else{
                    defaultResolutions = ['default'];                   
                }

                if(!scopeGenerics){
                    scopeGenerics = "yes";
                }
                if(!removeVendorPrefix){
                    removeVendorPrefix = 'no';
                }
                if(!removeInheritRules){
                    removeInheritRules = "no";
                }
                if(!multipleResolutions){
                    multipleResolutions = "no";
                }
                if(!unusedCSS){
                    unusedCSS = "no";
                }
                if(!replaceClasses){
                    replaceClasses = "no";
                }                
                if(!reloadResolutions){
                    reloadResolutions = "no";
                }
                if(!unusedAttributes){
                    unusedAttributes = "no";
                }
                if(!useTailwind){
                    useTailwind = "no";
                }
                if(!forceBreakpoints){
                    forceBreakpoints = "no";
                }
                if(!resolveVariables){
                    resolveVariables = "no";
                }                

                if(!userEmail){
                    userEmail = "";
                }
                if(!userApiKey){
                    userApiKey = "";
                }

    /*
                scope_generics
                remove_vendorprefix
                remove_inheritrules
                multiple_resolutions
                unused_css
                unused_attributes
    */   
                var optionsObj = {
                    scope_generics: scopeGenerics,
                    remove_vendorprefix: removeVendorPrefix,
                    remove_inheritrules: removeInheritRules,
                    multiple_resolutions: multipleResolutions,
                    default_resolutions: defaultResolutions,
                    unused_css: unusedCSS,
                    replace_classes: replaceClasses,                    
                    unused_attributes: unusedAttributes,
                    use_tailwind : useTailwind,
                    force_breakpoints: forceBreakpoints,
                    resolve_variables: resolveVariables,
                    controls_position: controlsPosition,
                    reload_resolutions: reloadResolutions,
                    api_key: userApiKey,
                    user_email: userEmail,
                    pro_user: proUser
                };
                var params = {method: "load_your_options", options_object: optionsObj};
                console.log("sending options");
                console.log(optionsObj);
                //chrome.runtime.sendMessage(params);    
                chrome.tabs.sendMessage(targetTabId, params, function(response) 
                {
                    //notify user the kiwi died
                });                 
            });
            
            //no response because async
            /*
                //var theResponse = JSON.stringify(optionsObj);
                console.log("sending get_all_options response");
                console.log(optionsObj);
            sendResponse({data: optionsObj});                        
            */
        }   
        else if(request.method == 'save_controls_position'){
            var rightPos = request.right_pos;
            var topPos = request.top_pos;
            var positionObj = {
               top : topPos,
               right: rightPos
            };
            console.log("saving controsl");
            console.log(positionObj);
            let setArr = new Array();
            setArr['controls_start_position'] = JSON.stringify(positionObj);    
            setOptionStorage(setArr, function(){
                
            });
                    
            sendResponse({data: "ok"});
        }            
        else if(request.method == 'reloadAttachDebugger'){
            var myTabId = request.my_tab_id;
            var myTabUrl = request.my_tab_url;
            SNIP_TAB_ID = myTabId;
            SNIP_TAB_URL = myTabUrl;
            if(SNIP_TAB_URL.substr(0, 6) == "chrome"){
                //you can't snip this url
                sendResponse({error: "badurl"});        
                return;
            }
            console.log("tab url<br>");
            console.log(SNIP_TAB_URL);
            chrome.debugger.attach({tabId:myTabId}, "1.3",
                onDebuggerAttach.bind(null, myTabId));   

        }   
        else if(request.method == 'disableDebugger'){
            console.log("GOT DISABLE DEBUGGER REQUEST ");
            var targetTabId = request.tab_id;
            var source = new Array();
            source['tabId'] = targetTabId;
            chrome.debugger.detach({tabId:targetTabId}, function(){
                //detached?
                onDebuggerDetach(source, "because I want to");
            });       
            
            chrome.runtime.reload();
        }
        else if(request.method == 'test_cheerio_html_edit'){
            var targetTab = {tabId: sender.tab.id};    
            var targetTabId = sender.tab.id;                
            let outerHtml = JSON.parse(request.outer_html);      
            outerHtml = removeScriptsAndComments(outerHtml);            
            sendResponse({data: outerHtml}); 
        }           
        else if(request.method == 'test_reload_mobile'){
            var targetTab = {tabId: sender.tab.id};    
            var targetTabId = sender.tab.id;                
            var hoverSelector = "";

            doReloadTest(targetTab, hoverSelector, function(theText){
                console.log("should be reloading " + theText);

            });                                       
        }            
        else if(request.method == 'set_device_mobile'){    
            var targetTab = {tabId: sender.tab.id};    
            setDeviceForScreenshot(targetTab, 'iphonexs');          
        }
        else if(request.method == 'set_device_ipad'){    
            var targetTab = {tabId: sender.tab.id};    
            setDeviceForScreenshot(targetTab, 'ipadvertical');          
        }        
        else if(request.method == 'test_hover'){
            var targetTab = {tabId: sender.tab.id};    
            var targetTabId = sender.tab.id;
            console.log("target tab");
            console.log(targetTab);
            var hoverSelector = request.hover_selector;
            doHoverTest(targetTab, hoverSelector, function(theText){


            });             
            sendResponse({data: "you have to wait"}); 
        } 
        else if(request.method == 'record_script_error'){
            var targetTab = {tabId: sender.tab.id};    
            var targetTabId = sender.tab.id;

            console.log("recording script error");
            let siteUrl = request.site_url;
            let theSource = request.source;
            let lineNum = request.line_num;
            let errorMessage = request.error_message;
            let allSelectors = request.all_selectors;
            let allOptions = request.all_options;
            var extension_token = self.OPTIONS['api_token'];
            if(!extension_token)
            {
                //user not found
                extension_token = "";            
            }         
            console.log(errorMessage);

            API.sendSnipcssError(siteUrl, theSource, lineNum, errorMessage, allSelectors, allOptions, extension_token);
            sendResponse({data: "recorded error"});   
            
            chrome.tabs.sendMessage(targetTabId, {method: "dead_kiwi"}, function(response) 
            {
                //notify user the kiwi died
            });
        }
        else if(request.method == 'continueSnipper'){
            console.log("continuing snipper");
            var targetTab = {tabId: sender.tab.id};
            var targetTabId = sender.tab.id;         
            /*
        url: window.location.href,
        has_new_html: newHtml,            
        new_html_images: newHtmlImages,
        new_element_outer_html: newElementOuterHtml,
        new_zip_outer_html: newZipOuterHtml,
        new_selector: repickCurrent,
        new_all_element_classnames: aClassnameString
        */
            var hasNewHtml = false;
            if(request.has_new_html == 1){
                hasNewHtml = true;
            }
            var newHtmlImages = request.new_html_images;
            var newElementOuterHtml = request.new_element_outer_html;
            var newZipOuterHtml = request.new_zip_outer_html;
            var newSelector = request.new_selector;
            var newClassname = request.new_classname;
            var newAllElementClasses = request.new_all_element_classnames;
            var selectorIndex = request.selector_index;
            if(hasNewHtml){
                console.log("has new html, appending new to multiple elements");
                var multipleIndex = allElementOuterHtml.length;
                newElementOuterHtml = JSON.parse(newElementOuterHtml);
                newElementOuterHtml = replaceAll(newElementOuterHtml, newSelector, allCssSelectors[multipleIndex]);

                newZipOuterHtml = JSON.parse(newZipOuterHtml);
                newZipOuterHtml = replaceAll(newZipOuterHtml, newSelector, allCssSelectors[multipleIndex]);
                if(snippedArr.length > 0){
                    //already have styles... must have done at different resolution
                    allElementOuterHtml.push(newElementOuterHtml);
                    allZipOuterHtml.push(newZipOuterHtml);                    
                }else{
                    //no styles, what if we just replace the html
                    allElementOuterHtml[0] = newElementOuterHtml;
                    allZipOuterHtml[0] = newZipOuterHtml;                                            
                }
                var myImagesArr = newHtmlImages.split('|');
                for(var k = 0; k < myImagesArr.length; k++){
                    var anImage = myImagesArr[k];
                    if(anImage.length < 3){
                        //bad image?
                        continue;
                    }
                    console.log("HTML IMAGE: " + anImage);
                    var myUrl = URI.resolve(SITE_URL, anImage);
                    console.log("Resolved: " + myUrl);         
                    htmlImages.push(myUrl);
                }                         
            }else{
                console.log("not new html");                
            }
            multipleAllElementClassnames[selectorIndex] = newAllElementClasses;
            allJquerySelectors[selectorIndex] = newSelector;
            console.log("DOING CONTINUE SNIP WITH ");
            console.log({target: RELOAD['target_tab'], newclass: newClassname, selindex: selectorIndex, callback: RELOAD['theCallback']});

            getOptionStorage(function(theStorage){
                
                self.OPTIONS = theStorage;
                doSnipper(RELOAD['target_tab'], newClassname, selectorIndex, RELOAD['theCallback']);                                          
            });
            //TELL THE PRODUCTIVITY OWL TO STOP COUNTING DOWN BECAUSE KIWI BE SNIPPING 
            var owlExtensionId = "hjnnhppcjaicdeffapiapafmokphkdbm";

            // Make a simple request:
            chrome.runtime.sendMessage(owlExtensionId, {owl_command: "stop_countdown"},
              function(response) {

              }
            );          
            
            
        }
        else if(request.method == 'doSnipper'){
            resetVariables();
            
            var targetTab = {tabId: sender.tab.id};
            var targetTabId = sender.tab.id;
            SNIPPING_TAB = targetTab;
            SNIPPING_TAB_ID = targetTabId;
            console.log("doing snipperrrrrrrr");
            SITE_URL = request.url;
            var timeStamp = new Date().getTime().toString();
            //myCssSelector = "snipcss-" + timeStamp;         
            /*
            if(myCssSelector == ""){
                var aSitename = replaceAll(SITE_URL, ".", '-');
                aSitename = replaceAll(aSitename, ":", '');
                aSitename = replaceAll(aSitename, "\/", '');
                aSitename = replaceAll(aSitename, "http", '');
f
            } 
           */            
           allElementOuterHtml = request.all_element_outer_html;
           allZipOuterHtml = request.all_zip_outer_html;
           allLabelOuterHtml = request.all_label_outer_html;
           multipleAllElementClassnames = request.multiple_all_element_classnames;
           allJquerySelectors = request.all_jquery_selector;
           //allElementSelectors = ['XXsnipcss_extracted_selector_selectionXX', 'XXsnipcss_extracted_selector_2_XX',
           //'XXsnipcss_extracted_selector_3_XX', 'XXsnipcss_extracted_selector_4_XX', 'XXsnipcss_extracted_selector_5_XX'];

           allCssSelectors = new Array();
           for(var aes = 0; aes < allElementSelectors.length; aes++){
               var indexAes = aes + 1;
               if(aes > 0){
                   allCssSelectors.push("snipcss-" + timeStamp);
               }else{                       
                   allCssSelectors.push("snipcss-" + randomLetters(5));                       
               }     
           }

           /*
        all_html_images: allHtmlImages,
        all_element_outer_html: allElementOuterHtml,
        all_zip_outer_html: allZipOuterHtml,
        multiple_all_element_classnames: multipleAllElementClassnames,
        all_jquery_selector: allJquerySelectors,
        all_element_selector: SNIPCSS.MULTIPLE_CLASSES,
        */
        /*
        element_outer_html : elementOuterHtml,
        zip_outer_html: elementZipOuterHtml,
        all_element_classnames: allElementClassnames,
        jquery_selector: currentSelector,
        element_selector: elemSelector,             
         */               

            console.log("site url is " + SITE_URL);
            for(var o = 0; o < allElementOuterHtml.length; o++){
                var myOuterHtml = JSON.parse(allElementOuterHtml[o]);    
                allElementOuterHtml[o] = replaceAll(myOuterHtml, allElementSelectors[o], allCssSelectors[o]);
                var myZipHtml = JSON.parse(allZipOuterHtml[o]);
                allZipOuterHtml[o] = replaceAll(myZipHtml, allElementSelectors[o], allCssSelectors[o]); 
                let myLabelHtml = JSON.parse(allLabelOuterHtml[o]); 
                allLabelOuterHtml[o] = replaceAll(myLabelHtml, allElementSelectors[o], allCssSelectors[o]);
            }
            /*
            var elementOuterHtml = JSON.parse(allElementOuterHtml[0]);                
            elementOuterHtml = replaceAll(elementOuterHtml, allElementSelectors[0], allCssSelectors[0]);
            var elementZipHtml = JSON.parse(allZipOuterHtml[0]);                
            elementZipHtml = replaceAll(elementZipHtml, allElementSelectors[0], allCssSelectors[0]);                
            */

            console.log("final outer htmlssss");
            console.log(allElementOuterHtml);
            console.log("final zip html");
            console.log(allZipOuterHtml);
            console.log("final label html");
            console.log(allLabelOuterHtml);            
            //allHtmlImages.split('|');

            var allHtmlImages = request.all_html_images;

            var theResolutions = request.resolutions;
            var clientWidth = request.client_width;

            elementDim = request.element_dim;
            var userPro = self.OPTIONS['pro_user'];
            var proUser = false;
            if(userPro == 1){
                proUser = true;
            }                

            if(theResolutions && theResolutions.length > 0){
                processArr = theResolutions;
            }
            console.log("client width is " + clientWidth);

            if(clientWidth < 900 && !proUser){
                console.log("client width less than 900, Kiwi gonna be an asshole and force them bigger for not being pro");
                for(var m = 0; m < processArr.length; m++){
                    if(processArr[m] == 'default'){
                        processArr[m] = 'cheater';
                    }
                }
            }            


            var googleFonts = request.google_fonts;
            cssfontsArr = googleFonts;
            var googleFontText = "";

            var firstJquerySelector = allJquerySelectors[0];
            var firstElementSelector = allElementSelectors[0];       


            htmlImagesArr = allHtmlImages.split('|');
            for(var k = 0; k < htmlImagesArr.length; k++){
                var anImage = htmlImagesArr[k];
                if(anImage.length < 3){
                    //bad image?
                    continue;
                }
                console.log("HTML IMAGE: " + anImage);

                //if(!anImage.startsWith(".") && !anImage.startsWith('\\/') && !anImage.startsWith('h')){
                //   console.log("Adding ./ to path because URI resolver doesn't seem to work as expected");
                //   console.log("path: " + anImage);
                //}

                var myUrl = URI.resolve(SITE_URL, anImage);
                console.log("Resolved: " + myUrl);         
                htmlImages.push(myUrl);
            }     
            console.log("html image arr: ");
            console.log(htmlImages);
            var siteName = SITE_URL.replace("https://", "");
            siteName = siteName.replace("http://", "");
            siteName = siteName.replace('//', "");
            siteName = siteName.split('/')[0];
            siteName = siteName.replace('www.', '');
            var extraName = "";
            var niceNames = new Array('sidebar', 'aside', 'footer', 'related', 'grid', 'modal', 'nav');
            for(var x = 0; x < niceNames.length; x++){
                if(firstElementSelector.indexOf(niceNames[x]) >= 0){
                    extraName += " " + niceNames[x];
                }
            }
            var jquerySelectorShort = firstJquerySelector;
            if(jquerySelectorShort.length > 20){
                jquerySelectorShort = jquerySelectorShort.substr(0, 30);
            }
            snipName = siteName + extraName + " - " + jquerySelectorShort;

            var allElementClassnames = multipleAllElementClassnames[0]; 
            var jquerySelector = allJquerySelectors[0];
            var elementSelector = allElementSelectors[0];                
            allClassnamesArr = allElementClassnames.split('|');                
            getOptionStorage(function(theStorage){                
                self.OPTIONS = theStorage;
                console.log("storage options");
                console.log(theStorage);
                console.log("again");
                console.log(self.OPTIONS);
                
                doSnipper(targetTab, elementSelector, 0, function(snippedArr){
                    try{
                        handleSnippedResult(snippedArr);
                    }
                    catch(snex){
                        //RECORD ERROR MESSAGE
                        let msg = snex.message;
                        var allSelectors = allJquerySelectors.join('|');
                        var siteUrl = SITE_URL;
                        var lineNum = "1";
                        var extension_token = self.OPTIONS['api_token'];
                        if(!extension_token)
                        {
                            //user not found
                            extension_token = "";            
                        }                      
                        //console.log("src");
                        //console.log(source);
                        console.log("error handling snip result");
                        console.log(msg);
                        //console.log("error data");
                        //console.log(error.stack);

                        var allError = msg;
                        try{
                            allError += " - " + snex.stack;        
                            lineNum =  (new Error).stack.split("\n")[4];
                        }catch(att){
                            console.log("bad error data");
                        }
                        var allOptions = "";

                        if(MAX_ERRORS > 0){
                            MAX_ERRORS--;                        
                            API.sendSnipcssError(siteUrl, "snipbackground-handleResult", lineNum, allError, allSelectors, "", extension_token);
                        }              
                        chrome.tabs.sendMessage(SNIPPING_TAB_ID, {method: "dead_kiwi"}, function(response) 
                        {
                          //why does my software suck?
                        });                    
                    }
                });
            });

            //process_snip();
/*  
            method: "doSnipper", 
            url: window.location.href,
            all_html_images: allHtmlImages,
            element_outer_html : elementOuterHtml,
            all_element_classnames: allElementClassnames
            jquery_selector: currentSelector,
            element_selector: elemSelector                        
*/
//table
/*
user_id
snip_name
snip_url
snip_selector
snip_prehtml
snip_html
snip_css
snip_lines
snip_himages
snip_cimages
snip_keyframes
snip_fonts
snip_fontfiles
viewports
snip_iframe
*/



        }
        else if(request.method == 'segmentPageFinished'){
            console.log("segment page finished");
            let senderTabId = sender.tab.id;
            var automationUID = request.automate_uid;            
            let allElementData = request.all_element_data;
            let automateSelectorsString = "";
            let allSelectors = new Array();
            for(let a = 0; a < allElementData.length; a++){
                let aData = allElementData[a];
                let selector = aData['selector'];
                allSelectors.push(selector);
            }            
            automateSelectorsString = allSelectors.join('|'); 
            console.log("automation selection string");
            console.log(automateSelectorsString);
           
            console.log("getting automation data");
            chrome.storage.local.get(['automation_data'], function(result) {
                let automationData = result['automation_data'];
                let aType = automationData['automate_type'];
                let aUid = automationData['automate_uid'];
                AUTOMATE_UID = aUid;
                if(aType == 'segment'){
                    //if just segmenting then it's complete
                    console.log("sending automation complete");
                    var params = {
                        method: "automation_complete",
                        automate_uid: AUTOMATE_UID,
                        automate_selectors: AUTOMATE_SELECTORS,
                        index: 0
                    };
                    chrome.tabs.sendMessage(senderTabId, params, function(startSnipResult) {
                        
                    });                    
                }else{
                    console.log("THE AUTOMATION TYPE");
                    AUTOMATE_SELECTORS = allSelectors;
                    let firstSelector = automateSelectorsString;                    
                    if(automateSelectorsString.indexOf('|') >= 0){
                        let selectorArr = automateSelectorsString.split('|');
                        AUTOMATE_SELECTORS = selectorArr;
                        firstSelector = selectorArr[0];
                    }
                    console.log("STARTING AUTOMATE SNIPPER FROM BACKGROUND ");
                    console.log(firstSelector);

                    // Send message to content script
                    let paramsContinue = {
                        method: "continue_snipper_from_background",
                        automate_uid: AUTOMATE_UID,
                        automate_selector: firstSelector,
                        automation_index: 0
                    };
                    chrome.tabs.sendMessage(senderTabId, paramsContinue, function(startSnipResult) {
                        console.log("Received result from content script");
                        console.log(startSnipResult);
                        if (startSnipResult && startSnipResult['result'] == 1) {
                            console.log("Element found, starting snipper");
                        } else {
                            
                            let shouldStop = 0;
                            if(AUTOMATE_SELECTORS.length <= 1){
                                shouldStop = 1;
                            }
                            console.log("Element not found, update UID as failed");
                            var failParams = {method: "extraction_failed",
                                automate_uid: AUTOMATE_UID, automate_selectors: AUTOMATE_SELECTORS, automation_index: 0,
                                stop_extraction: shouldStop,
                                message: "Element not found: " + firstSelector
                            };
                            chrome.tabs.sendMessage(senderTabId, failParams);
                            
                            if(AUTOMATE_SELECTORS.length > 1){
                                let paramsContinue2 = {
                                    method: "continue_snipper_from_background",
                                    automate_uid: AUTOMATE_UID,
                                    automate_selector: AUTOMATE_SELECTORS[1],
                                    automation_index: 1
                                };                      
                                chrome.tabs.sendMessage(senderTabId, paramsContinue2, function(startSnipResult2) {
                                    if (startSnipResult2 && startSnipResult2['result'] == 1) {
                                        console.log("Element found, starting snipper");
                                    } else {                                    
                                        var failParams2 = {method: "extraction_failed",
                                            automate_uid: AUTOMATE_UID, automate_selectors: AUTOMATE_SELECTORS, automation_index: 1,
                                            message: "Element not found: " + AUTOMATE_SELECTORS[1], stop_extraction: 1
                                        };
                                        chrome.tabs.sendMessage(senderTabId, failParams2);                                        
                                    }
                                    
                                });
                            }
                            
                        }
                    });                
                }
                
            });
            
                        
            
        }
        else if(request.method == 'loadSnipper'){
            var snipIndex = request.index;          
            var snipUID = request.uid;
            //so options goes to dashboard by default
            chrome.storage.local.remove(['last_nav'], function(){
                
            });

            //var execResult = await syncSendRequest(tabId, params);
            chrome.runtime.openOptionsPage(function(){
                setTimeout(function(){
                    var params = {method: "options_loadresult", index: snipIndex, uid: snipUID};
                    chrome.runtime.sendMessage(params);      
                }, 1500);
            });                
        }    
        else if(request.method == 'getLatestLogs'){
            let targetTab = {tabId: sender.tab.id};    
            let targetTabId = sender.tab.id;
            let taskUid = request.task_uid;
            
            console.log("getting Latest Logs");
            chrome.storage.local.get(['automation_logs'], (result) => {
                const logs = result.automation_logs || {};
                const taskLogs = logs[taskUid] || [];

                // Clear logs for this task after retrieving them
                if (logs[taskUid]) {
                  delete logs[taskUid];
                  chrome.storage.local.set({ automation_logs: logs });
                }
                
                var params = {method: "record_logs", logs: taskLogs, task_uid: taskUid};
                console.log("sending logs");
                console.log(taskLogs);
                chrome.tabs.sendMessage(targetTabId, params);                 
            });            
        }
        
        
     //todo        
     //turn this back on after manifest v3 conversion
     
    /*
    }catch(reqex){
        //RECORD ERROR MESSAGE
        let msg = reqex.message;
        console.log("error message");
        console.log(msg);
        var allSelectors = allJquerySelectors.join('|');
        var siteUrl = SITE_URL;
        var lineNum = "1";
        var extension_token = self.OPTIONS['api_token'];
        if(!extension_token){
            extension_token = "";            
        }                      
        var allError = msg;
        try{
            allError += " - " + reqex.stack;        
            lineNum =  (new Error).stack.split("\n")[4];
        }catch(att){
            console.log("bad error data");
        }
        if(MAX_ERRORS > 0){
            MAX_ERRORS--;                        
            API.sendSnipcssError(siteUrl, "snipbackground-request", lineNum, allError, allSelectors, "", extension_token);
        }        
    }
        */
});
      
    chrome.runtime.onMessageExternal.addListener(
      function(request, sender, sendResponse) {
          console.log("external message");
          console.log(request);
        if(request['operation'] == 'login'){
            console.log("sender url is " + sender.url);
            var apiKey = request['api_key'];
            var userEmail = request['user_email'];
            var proUser = request['pro_user'];
            var firstName = request['first_name'];

    /*
                operation: 'login',
                api_key: API_KEY, user_email: USER_EMAIL, user_firstname: USER_FIRSTNAME,
                pro_user: IS_PRO
              
        OPTIONS.USER_EMAIL = localStorage['user_email'];
        OPTIONS.PRO_MEMBER = false;
        var proUser = localStorage['pro_user'];
        OPTIONS.API_KEY = localStorage['api_key'];              
    */        
            let setArray = new Array();
            setArray['user_email'] = userEmail;
            setArray['first_name'] = firstName;
            setArray['api_key'] = apiKey;
            setArray['pro_user'] = proUser;
            
            //to try to force a credit refresh now
            var now = new Date().getTime();
            var veryoldDate = now - (24 * 60 * 60 * 20);   
            setArray['user_credits_updated'] = veryoldDate;
            
            //should be yes or no if already a PRO member
            //but if first time set to yes
            var multipleResolutions = setArray['multiple_resolutions'];
            if(!multipleResolutions){
                //console.log("first time login");
                setArray['multiple_resolutions'] = "yes";
                setArray['unused_css'] = "yes";        
                setArray['replace_classes'] = "yes";                   
                setArray['unused_attributes'] = "yes";
                setArray['resolutions_selected'] = "default|iphonexs|ipadvertical";
            }
            
            setOptionStorage(setArray, function(){
                
            });

            console.log(request);
            sendResponse({'msg': 'extension login success ' + userEmail, 'success': 'true'}); 
        }
        else if(request['operation'] == 'automate'){
                   
            console.log("automation is disabled");            
        }
        return true;
     });   
    
    //https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    function generateUID() { // Public Domain/MIT
        var d = new Date().getTime();//Timestamp
        var d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }      
    
    
    
//stackoverflow again    
//stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
/*
function splitNoParen(s){
    var left= 0, right= 0, A= [], 
    M= s.match(/([^()]+)|([()])/g), L= M.length, next, str= '';
    for(var i= 0; i<L; i++){
        next= M[i];
        if(next=== '(')++left;
        else if(next=== ')')++right;
        if(left!== 0){
            str+= next;
            if(left=== right){
                A[A.length-1]+=str;
                left= right= 0;
                str= '';
            }
        }
        else A=A.concat(next.match(/([^,]+)/g));
    }
    return A;
}
*/
function splitNoParen(s){
  let results = [];
  let next;
  let str = '';
  let left = 0, right = 0;

  var keepResult = function() {
    results.push(str);
    str = '';
  };

  for(var i = 0; i<s.length; i++) {
    switch(s[i]) {
    case ',': 
      if((left === right)) {
        keepResult();
        left = right = 0;
      } else {
        str += s[i];
      }
      break;
    case '(':
      left++;
      str += s[i];
      break;
    case ')':
      right++;
      str += s[i];
      break;
    default: 
      str += s[i];
    }
  }
  keepResult();
  return results;
}


 var syncGetStorage = (theKey) => new Promise((resolve, reject)=>{
    chrome.storage.local.get(theKey, result =>{
        if(chrome.runtime.lastError){
            //console.log("error getting result storage");
            //console.log(chrome.runtime.lastError.message);
        }
        else{
            var storageResult = result[theKey];
            storageResult['uid'] = theKey;
            resolve(storageResult);
        }
      }
    )     
 });     
     
var setOptionStorage = function(setArray, callback){
    //console.log("set array is ");
    //console.log(setArray);
    
    getOptionStorage(function(result) {
        var mystorage = result;      
        
        //set all defaults if they don't exist
        if(mystorage){
            mystorage['remove_vendorprefix'] = mystorage['remove_vendorprefix'] ? mystorage['remove_vendorprefix'] : 'no';
            mystorage['remove_inheritrules'] = mystorage['remove_inheritrules'] ? mystorage['remove_inheritrules'] : 'no';
            mystorage['move_inlinestyles'] = mystorage['move_inlinestyles'] ? mystorage['move_inlinestyles'] : 'yes';
            mystorage['scope_prefix'] = mystorage['scope_prefix'] ? mystorage['scope_prefix'] : 'snip-';
            mystorage['global_prefix'] = mystorage['global_prefix'] ? mystorage['global_prefix'] : '';
            mystorage['pro_user'] = mystorage['pro_user'] ? mystorage['pro_user'] : false;
            mystorage['user_email'] = mystorage['user_email'] ? mystorage['user_email'] : '';
            mystorage['user_firstname'] = mystorage['user_firstname'] ? mystorage['user_firstname'] : '';            
            mystorage['api_key'] = mystorage['api_key'] ? mystorage['api_key'] : '';
            mystorage['multiple_resolutions'] = mystorage['multiple_resolutions'] ? mystorage['multiple_resolutions'] : 'no';
            mystorage['unused_css'] = mystorage['unused_css'] ? mystorage['unused_css'] : 'no';
            mystorage['replace_classes'] = mystorage['replace_classes'] ? mystorage['replace_classes'] : 'no';            
            mystorage['unused_attributes'] = mystorage['unused_attributes'] ? mystorage['unused_attributes'] : 'no';
            mystorage['use_tailwind'] = mystorage['use_tailwind'] ? mystorage['use_tailwind'] : 'no';
            mystorage['force_breakpoints'] = mystorage['force_breakpoints'] ? mystorage['force_breakpoints'] : 'no';
            mystorage['resolve_variables'] = mystorage['resolve_variables'] ? mystorage['resolve_variables'] : 'no';
            mystorage['prune_tailwind'] = mystorage['prune_tailwind'] ? mystorage['prune_tailwind'] : 'no';            
            mystorage['reload_resolutions'] = mystorage['reload_resolutions'] ? mystorage['reload_resolutions'] : 'no';
            mystorage['scope_generics'] = mystorage['scope_generics'] ? mystorage['scope_generics'] : 'no';            
            mystorage['scope_type'] = mystorage['scope_type'] ? mystorage['scope_type'] : 'class';
            mystorage['template_engine'] = mystorage['template_engine'] ? mystorage['template_engine'] : 'no';     
            mystorage['default_resolutions'] = ['default', 'iphonexs', 'ipadvertical'];
        }else{
            mystorage = {};
            mystorage['remove_vendorprefix'] = 'no';
            mystorage['remove_inheritrules'] = 'no';
            mystorage['move_inlinestyles'] = 'yes';
            mystorage['scope_prefix'] = "snip-";
            mystorage['global_prefix'] = "";            
            mystorage['pro_user'] = false;
            mystorage['api_key'] = '';
            mystorage['multiple_resolutions'] = 'no';
            mystorage['unused_css'] = 'no';
            mystorage['replace_classes'] = 'no';            
            mystorage['unused_attributes'] = 'no';
            mystorage['use_tailwind'] = 'no';
            mystorage['force_breakpoints'] = 'no';      
            mystorage['resolve_variables'] = 'no';      
            mystorage['prune_tailwind'] = 'no';                
            mystorage['reload_resolutions'] = 'no';
            mystorage['scope_generics'] = 'no';
            mystorage['scope_type'] = 'class';            
            mystorage['template_engine'] = 'mustache';      
            mystorage['default_resolutions'] = ['default', 'iphonexs', 'ipadvertical'];
        }
        
        for(var aKey in setArray){
            //console.log("setting " + aKey + " to " + setArray[aKey]);
           //to remove items we can't check this            
            //if(setArray[aKey]){
            //}            
            mystorage[aKey] = setArray[aKey];    
        }
        
        var setData = {};
        setData["snipcss-options"] = mystorage; 
        chrome.storage.local.set(setData, function() {
            callback(mystorage);
        });                 
    
    });    
};



var getOptionStorage = function(callback){
    chrome.storage.local.get(['snipcss-options'], function(result) {
        var mystorage = result['snipcss-options'];
        
        /*
        var removeVendorPrefix = localStorage['remove_vendorprefix'];
        var removeInheritRules = localStorage['remove_inheritrules'];        
        var scopePrefix = localStorage['scope_prefix'];
        var proUser = localStorage['pro_user'];
        let apiKey = localStorage['api_key'];        
        var multipleResolutions = localStorage['multiple_resolutions'];
        var unusedCSS = localStorage['unused_css'];
        var unusedAttributes = localStorage['unused_attributes'];
        var resolutionReload = localStorage['reload_resolutions'];
        var scopeGenerics = localStorage['scope_generics'];  
        var templateEngine = localStorage['template_engine'];        
        */
        let removeVendorPrefix, removeInheritRules, moveInlineStyles, scopePrefix, globalPrefix, proUser, apiKey,userEmail,userFirstname;
        let multipleResolutions, unusedCSS, replaceClasses, unusedAttributes, resolutionReload, scopeGenerics, templateEngine;
        
        //set all defaults if they don't exist
        if(mystorage){
            mystorage['remove_vendorprefix'] = mystorage['remove_vendorprefix'] ? mystorage['remove_vendorprefix'] : 'no';
            mystorage['remove_inheritrules'] = mystorage['remove_inheritrules'] ? mystorage['remove_inheritrules'] : 'no';
            mystorage['move_inlinestyles'] = mystorage['move_inlinestyles'] ? mystorage['move_inlinestyles'] : 'yes';
            mystorage['scope_prefix'] = mystorage['scope_prefix'] ? mystorage['scope_prefix'] : 'snip-';
            mystorage['global_prefix'] = mystorage['global_prefix'] ? mystorage['global_prefix'] : '';            
            mystorage['pro_user'] = mystorage['pro_user'] ? mystorage['pro_user'] : false;
            mystorage['api_key'] = mystorage['api_key'] ? mystorage['api_key'] : '';
            mystorage['user_email'] = mystorage['user_email'] ? mystorage['user_email'] : '';
            mystorage['user_firstname'] = mystorage['user_firstname'] ? mystorage['user_firstname'] : '';
            mystorage['multiple_resolutions'] = mystorage['multiple_resolutions'] ? mystorage['multiple_resolutions'] : 'no';
            mystorage['unused_css'] = mystorage['unused_css'] ? mystorage['unused_css'] : 'no';
            mystorage['replace_classes'] = mystorage['replace_classes'] ? mystorage['replace_classes'] : 'no';            
            mystorage['unused_attributes'] = mystorage['unused_attributes'] ? mystorage['unused_attributes'] : 'no';
            mystorage['use_tailwind'] = mystorage['use_tailwind'] ? mystorage['use_tailwind'] : 'no';     
            mystorage['force_breakpoints'] = mystorage['force_breakpoints'] ? mystorage['force_breakpoints'] : 'no';
            mystorage['resolve_variables'] = mystorage['resolve_variables'] ? mystorage['resolve_variables'] : 'no';
            mystorage['prune_tailwind'] = mystorage['prune_tailwind'] ? mystorage['prune_tailwind'] : 'no';            
            mystorage['reload_resolutions'] = mystorage['reload_resolutions'] ? mystorage['reload_resolutions'] : 'no';
            mystorage['scope_generics'] = mystorage['scope_generics'] ? mystorage['scope_generics'] : 'no';
            mystorage['template_engine'] = mystorage['template_engine'] ? mystorage['template_engine'] : 'mustache';  
            mystorage['scope_type'] = mystorage['scope_type'] ? mystorage['scope_type'] : 'class';   
            mystorage['user_credits'] = mystorage['user_credits'] ? mystorage['user_credits'] : 0;  
            mystorage['user_credits_updated'] = mystorage['user_credits_updated'] ? mystorage['user_credits_updated'] : null;   
            mystorage['user_credits_paid'] = mystorage['user_credits_paid'] ? mystorage['user_credits_paid'] : 0;   
        }else{
            mystorage = {};
            mystorage['remove_vendorprefix'] = 'no';
            mystorage['remove_inheritrules'] = 'no';
            mystorage['move_inlinestyles'] = 'yes';            
            mystorage['scope_prefix'] = "snip-";
            mystorage['global_prefix'] = "";
            mystorage['scope_type'] = "class";            
            mystorage['pro_user'] = false;
            mystorage['api_key'] = '';
            mystorage['user_email'] = '';    
            mystorage['user_firstname'] = '';
            mystorage['multiple_resolutions'] = 'no';
            mystorage['unused_css'] = 'no';
            mystorage['replace_classes'] = 'no';              
            mystorage['unused_attributes'] = 'no';
            mystorage['use_tailwind'] = 'no';      
            mystorage['force_breakpoints'] = 'no';      
            mystorage['resolve_variables'] = 'no';      
            mystorage['prune_tailwind'] = 'no';                 
            mystorage['reload_resolutions'] = 'no';
            mystorage['scope_generics'] = 'no';
            mystorage['template_engine'] = 'mustache';     
            mystorage['user_credits'] = 0;  
            mystorage['user_credits_updated'] = null;     
            mystorage['user_credits_paid'] = 0;             
        }
        
        
        callback(mystorage);             
    
    });        
};    


function consoleLogBuffer(data) {
  // Check if we should filter this log based on current processing ID
  if (TARGET_DEBUG_SNIP_IDS.length > 0) {
    // If filter array has IDs, only log if current ID is in the array
    if (!CURRENT_PROCESSING_SNIP_ID || !TARGET_DEBUG_SNIP_IDS.includes(CURRENT_PROCESSING_SNIP_ID)) {
      return; // Skip this log
    }
  }
  // If TARGET_DEBUG_SNIP_IDS is empty, log everything (default behavior)

  console.log(data);
  try {
    // Format the data
    let formattedData;
    if (data === null) {
      formattedData = 'null';
    } else if (data === undefined) {
      formattedData = 'undefined';
    } else if (typeof data === 'object') {
      formattedData = JSON.stringify(data);
    } else {
      formattedData = String(data);
    }

    // Add to buffer with newline
    TAILWIND_LOG_BUFFER += formattedData + "\n";
  } catch (e) {
    TAILWIND_LOG_BUFFER += `[Object (${e.message})]\n`;
  }
}

function sendAndClearLogBuffer() {
  // Skip if empty
  if (!TAILWIND_LOG_BUFFER.trim()) {
    return;
  }
  
  // Create a single log entry with the entire buffer as the message
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "log",
    message: TAILWIND_LOG_BUFFER,
    taskUid: AUTOMATE_UID
  };
  
  // Create parameters with just one log entry containing all the buffered text
  const params = {
    method: "record_logs", 
    logs: [logEntry], 
    task_uid: AUTOMATE_UID
  };
  
  // Send the message
  chrome.tabs.sendMessage(SNIPPING_TAB_ID, params);
  
  // Clear the buffer
  TAILWIND_LOG_BUFFER = "";
}
    