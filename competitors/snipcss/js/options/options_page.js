	var QTIP_TIMER;
	var FREETIME_CHANGED = false;
    var OPTIONS = OPTIONS || {};
    var SNIPCSS = SNIPCSS || {};    
    var TETHER_NAV = null;	
	var EXPORT_DATA = null;
    var PAGE_READY = false;
    var PAGE_INTERVAL = null;
    var LOADER_INTERVAL = null;
    var LOADER_CHANGED = false;
    var LOADER_LAST_LOAD = null;
    var SNIP_PATH_TO_FONTS = "./fonts/";
    var SNIP_PATH_TO_IMAGES = './images/';
    var IMG_REPLACE_ARR = new Array();
    var SVG_IN_HTML = new Array();
    var SVG_REPLACING_INDEX = -1;
    var SVG_REPLACING_ICON = "";
    var IMAGE_REPLACING_ICON = "";
    var FONT_REPLACING_INDEX = -1;
    var FONT_REPLACING_GOOGLENAME = "";
    var FONT_NEW_FONTUSED = false;
    var FONT_NEW_FONTUSEDARR = new Array();
    
    SNIPCSS.SELECTED_SNIPPET = null;
    SNIPCSS.SELECTED_ID = null;
    SNIPCSS.CSS_EDITOR = null;
    SNIPCSS.HTML_EDITOR = null;
    SNIPCSS.EDITOR_SAVEBOTH = false;
    SNIPCSS.COLOR_MAPPING = new Array();
    //css panel changed since last save...
    SNIPCSS.CSS_CHANGED = false;
    SNIPCSS.COLOR_CHANGED = false;
    SNIPCSS.CHANGING_COLOR = false;
    SNIPCSS.LASTCOLOR_UPDATE = null;
    SNIPCSS.CURR_DEVICE_SIZE = "desktop";    
    /*
                scope_generics
                remove_vendorprefix
                remove_inheritrules
                multiple_resolutions
                unused_css    
    */
    //OPTION CHECK BOXES 
    OPTIONS.REMOVE_VENDORPREFIX = false;
    OPTIONS.REMOVE_INHERITRULES = false;
    OPTIONS.MOVE_INLINESTYLES = true;
    OPTIONS.MULTIPLE_RESOLUTIONS = false;
    OPTIONS.SCOPE_GENERICS = false;    
    OPTIONS.SCOPE_PREFIX = "snip-";
    OPTIONS.GLOBAL_PREFIX = "";
    OPTIONS.UNUSED_CSS = false;
    OPTIONS.REPLACE_CLASSES = false;
    OPTIONS.UNUSED_ATTRIBUTES = false;
    OPTIONS.USE_TAILWIND = false;    
    OPTIONS.FORCE_BREAKPOINTS = false;
    OPTIONS.RESOLVE_VARIABLES = false;
    OPTIONS.PRUNE_TAILWIND = false;
    
    OPTIONS.RELOAD_RESOLUTIONS = false;
    OPTIONS.REMOVE_VENDORPREFIX = true;

    OPTIONS.PRO_USER = false;
    OPTIONS.USER_EMAIL = "";
    OPTIONS.API_KEY = "";    
    OPTIONS.TEMPLATE_ENGINE = "Mustache";
    OPTIONS.IS_ADMIN_USER = false;
    OPTIONS.SCOPE_TYPE = 'class';
    OPTIONS.USER_CREDITS = 0.0;
    OPTIONS.IS_GENERATING_IMAGE = false;
    OPTIONS.IS_GENERATING_SVG = false;
    OPTIONS.PRO_NEEDS_KEY = false;
    OPTIONS.LAST_SELECTED_REPLACE_TYPE = "prompt";
    
    const LS = {
      getAllItems: () => chrome.storage.local.get(),
      getItem: async key => (await chrome.storage.local.get(key))[key],
      setItem: (key, val) => chrome.storage.local.set({[key]: val}),
      removeItems: keys => chrome.storage.local.remove(keys)
    };    
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("options got runtime.Onmessage: ");
            console.log(request);        
            
            if(request.method == 'options_loadresult'){
                
                if(!($('#leftnav_dashboard').parent().hasClass('active'))){
                    $('#leftnav_dashboard').trigger('click');
                }
                console.log("clear content viewer and set request to : " + request['index']);
                $('#snippet_loading').css('display', 'block');
                $('#snippet_viewer').css('display', 'none');
                clearContentViewer(function(){
                    //why not load it from localStorage?
                    if(LOADER_INTERVAL !== null){
                        clearInterval(LOADER_INTERVAL);
                        LOADER_INTERVAL = null;
                    }
                    let maxTimes = 5;
                    LOADER_INTERVAL = setInterval(function(){
                        //refreshSnipList(selectedIndex);
                        if($("#allsnippets_dropdown option[value='" + request['uid'] + "']").length > 0){
                            console.log("found - now loading");
                            clearInterval(LOADER_INTERVAL);  
                            LOADER_INTERVAL = null;
                            $('#allsnippets_dropdown').val(request['uid']).trigger('change');
                            LOADER_CHANGED = true;
                        }else{
                            console.log("refreshing snip list");
                            refreshSnipList();
                            maxTimes--;
                            if(maxTimes < 0){
                                alert("should stop refreshing list?");
                            }
                        }                        
                    }, 2000);
                });                
            }
            else if(request.method == 'snipped_result'){
                console.log("got snip result");
                console.log(request);
            }else if(request.method == 'test_message'){
                console.log("got test result");
                console.log(request.data);
            }                    
        });       
        
        function clearContentViewer(callbackDone){
            var contentViewerHtml = $('#content_viewer_template').html();
            $('#snippet_viewer').empty();
            setTimeout(function(){
                $('#snippet_viewer').html(contentViewerHtml);        

                var waitInterval = setInterval(function(){
                    if($('#html_content').length <= 0){
                        return;
                    }
                    clearInterval(waitInterval);
                    if(callbackDone != null){
                        callbackDone();
                        callbackDone = null;
                    }
                }, 100);                
            }, 500);            
        }        
        
        function loadSnippet(snippet){
            //console.log("loading snippet2222");
            //console.log(snippet);


            var theHtml = snippet['snip_html'];
            var theCss = snippet['snip_css'];
            let useTailwind = snippet['use_tailwind'];
            let loadWithTailwind = false;
            let tailwindHtml = snippet['tailwind_html'];
            let tailwindCss = snippet['tailwind_css'];    
            let tailwindBodyClasses = new Array();
            if(useTailwind && useTailwind == 'yes'){
                loadWithTailwind = true;
                tailwindBodyClasses = snippet['tailwind_body_classes'];    
                tailwindHtml = html_beautify(tailwindHtml, {
                    indent_size: 4,
                    space_in_empty_paren: true,
                    preserve_newlines: false,
                    indent_inner_html: true,
                    indent_empty_lines: false,
                    extra_liners: [],
                    wrap_line_length: 0
                  });    
            }           
            theHtml = html_beautify(theHtml, {
                indent_size: 4,
                space_in_empty_paren: true,
                preserve_newlines: false,
                indent_inner_html: true,
                indent_empty_lines: false,
                extra_liners: [],
                wrap_line_length: 0
              });            
                              
            //alert("setting html to " + theHtml);
            //console.log("code before");
            //console.log(theHtml);
            let firstPanelName = "HTML";
            if(loadWithTailwind){
                $('#html_content').val(tailwindHtml);
                $('#css_content').val(tailwindCss);
                firstPanelName = "TAILWIND";
            }else{
                $('#html_content').val(theHtml);
                $('#css_content').val(theCss);
            }
            

            var htmlTextarea = $('#html_content').get(0);

            var htmlEditor = CodeMirror.fromTextArea(htmlTextarea, {
              lineNumbers: true,
              viewportMargin: Infinity,
              mode: "htmlmixed"
            });        
            var totalLines = htmlEditor.lineCount();  
            //do not autoformat
            //htmlEditor.autoFormatRange({line:0, ch:0}, {line:totalLines});      
            
            htmlEditor.setCursor({line: 0, ch: 0});
            SNIPCSS.HTML_EDITOR = htmlEditor;
            
            
            addPanel(htmlEditor, "html", firstPanelName);        

            var cssTextarea = $('#css_content').get(0);        
            var cssEditor = CodeMirror.fromTextArea(cssTextarea, {
              lineNumbers: true,
              viewportMargin: Infinity,
              mode: "css"
            });         
            var cssLines = cssEditor.lineCount();  
            
            cssEditor.on('change', editor => {
                SNIPCSS.CSS_CHANGED = true;
            });
            
            SNIPCSS.CSS_EDITOR = cssEditor;
            
            addPanel(cssEditor, "css", "CSS");       
           
            setTimeout(function(){            
                var anIframe = document.querySelector('#preview_iframe');
                anIframe.contentDocument.body.innerHTML = '';                        
                if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                    let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses);  
                    anIframe.contentDocument.open();
                    anIframe.contentDocument.write(loadFrameHtml); 
                    anIframe.contentDocument.close();                  
                }else{
                    let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses);  
                    let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                    anIframe.contentDocument.open();
                    anIframe.contentDocument.write(noDeviceWidthFrame);
                    anIframe.contentDocument.close();
                }
             
                //$('#viewer_snippet_name').html(snippet['snip_name']);
                loadImagePanel(snippet);        
                setTimeout(function(){                    
                    SNIPCSS.HTML_EDITOR.refresh();
                    SNIPCSS.CSS_EDITOR.refresh();                         
                    document.getElementById('preview_iframe').contentWindow.doInitialize();                       
                }, 500);
                loadColorSwatches(snippet['snip_css']);       
                loadMobileIcons();
            }, 100);

            Split(['#top_panel', '#preview_panel'], {
                   gutterSize: 24,
                   cursor: 'pointer',
                   direction: 'vertical',
                   sizes: [50, 50],
                   onDragStart: function(e){
                       console.log(e);
                   },
                   onDragEnd: function() {
                       refreshCodemirrorHeight();
                   }                   
            });
            Split(['#html_panel', '#css_panel', '#images_panel'], {
                sizes: [40, 40, 20],
                gutterSize: 20,
                cursor: 'row-resize',  
                onDragEnd: function() {
                   refreshCodemirrorHeight();
                }
            });  

            refreshCodemirrorHeight();
            
            setTimeout(function(){
                $('#snippet_viewer').css('display', 'block');
                $('#snippet_loading').css('display', 'none');       
                if(OPTIONS.PRO_USER){
                    $('#snipcssnote_pro').css('display', 'block');
                    $('#snipcssnote_free').css('display', 'none');   
                    $('#get_unlimited_tokens').css('display', 'none');
                }
                setTimeout(function(){
                   refreshCodemirrorHeight(); 
                }, 500);
            }, 500);
        }
        
        function updateSnippet(snipUID, snippetData, callback){
            chrome.storage.local.get('snipresult-' + snipUID, function(result) {
                let theData = result['snipresult-' + snipUID];
                if(theData){
                    console.log("UPDATING new storage ONE!");
                    var newSnipData = {};
                    newSnipData['snipresult-' + snipUID] = snippetData;
                    chrome.storage.local.set(newSnipData, function() {
                        console.log("newSnipData " );
                        console.log(newSnipData);          
                        toastr.success('Success', 'The Snippet was updated');         
                        if(callback){
                            callback();
                        }
                    });                    
                    
                }else{
                    var existingSnips = new Array();
                    var savedSnippets = localStorage['snippets'];
                    if(savedSnippets)
                    {
                        existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
                        var newSnips = new Array();
                        console.log(existingSnips);                
                        for(var x = 0; x < existingSnips.length; x++){     
                            if(snipUID == existingSnips[x]['uid']){
                                newSnips.push(snippetData);
                                foundIndex = true;
                            }else{
                                newSnips.push(existingSnips[x]);
                            }
                        } 
                        localStorage['snippets'] = JSON.stringify(newSnips);
                        //LS.setItem('snippets', JSON.stringify(newSnips));
                        if(foundIndex){
                            toastr.success('Success', 'The Snippet was updated');
                            if(callback){
                                callback();
                            }                            
                        }
                    }	                 
             
                }
            });                        
        }
       
	
    function addPanel(editor, panelName, panelLabel) {
        console.log("adding panel " + panelName);
      var node = document.createElement("div");
      var label = node.appendChild(document.createElement("span"));
      
      let tailwindButton = "";
      if(panelLabel == 'TAILWIND'){
          tailwindButton = '<a class="badge showoriginalbadge" id="showoriginal-' + panelName + '"> Show Original</a>';
      }
      
      var copysaveButtons = $('<div class="copysavebuttons">' + 
              tailwindButton + 
              '<a class="badge savebadge" id="save-' + panelName + '"> Save</a>' + 
              '<a class="badge copybadge" id="copy-' + panelName + '"> ' + 'Copy</a>' +  + 
              '</div>').get(0);
      node.appendChild(copysaveButtons);
      label.textContent = panelLabel;      
      node.id = "panelheader-" + panelName;
      editor.addPanel(node, {position: 'top', stable: true});
      setTimeout(function(){
          new ClipboardJS('#copy-' + panelName, {
            text: function(trigger) {
                return editor.getDoc().getValue();
            }
          });          
          if(panelLabel == 'TAILWIND'){
                $('#showoriginal-' + panelName).on('click', function(){
                    if($(this).text().indexOf('Original') >= 0){
                        // Switch to original version
                        let beautyHtml = html_beautify(SNIPCSS.SELECTED_SNIPPET['snip_html'], {
                            indent_size: 4,
                            space_in_empty_paren: true,
                            preserve_newlines: false,
                            indent_inner_html: true,
                            indent_empty_lines: false,
                            extra_liners: [],
                            wrap_line_length: 0
                          });                             
                        
                        SNIPCSS.HTML_EDITOR.setValue(beautyHtml);
                        SNIPCSS.CSS_EDITOR.setValue(SNIPCSS.SELECTED_SNIPPET['snip_css']);

                        // Update preview frame with original version
                        let anIframe = document.querySelector('#preview_iframe');
                        let loadFrameHtml = getPreviewFrameHtml(
                            SNIPCSS.SELECTED_SNIPPET['snip_css'], 
                            SNIPCSS.SELECTED_SNIPPET['snip_html']
                        );

                        if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                            anIframe.contentDocument.open();
                            anIframe.contentDocument.write(loadFrameHtml);
                            anIframe.contentDocument.close();
                        } else {
                            let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                            anIframe.contentDocument.open();
                            anIframe.contentDocument.write(noDeviceWidthFrame);
                            anIframe.contentDocument.close();
                        }
                        $('#panelheader-html').find('span').text("HTML");
                        $(this).text(" Show Tailwind");
                    } else {
                        
                        let beautyHtml = html_beautify(SNIPCSS.SELECTED_SNIPPET['tailwind_html'], {
                            indent_size: 4,
                            space_in_empty_paren: true,
                            preserve_newlines: false,
                            indent_inner_html: true,
                            indent_empty_lines: false,
                            extra_liners: [],
                            wrap_line_length: 0
                          });                          
                        // Switch back to Tailwind version
                        SNIPCSS.HTML_EDITOR.setValue(beautyHtml);
                        SNIPCSS.CSS_EDITOR.setValue(SNIPCSS.SELECTED_SNIPPET['tailwind_css']);

                        // Update preview frame with Tailwind version
                        let anIframe = document.querySelector('#preview_iframe');
                        let loadFrameHtml = getPreviewFrameHtml(
                            SNIPCSS.SELECTED_SNIPPET['tailwind_css'], 
                            SNIPCSS.SELECTED_SNIPPET['tailwind_html'], 
                            'yes',
                            SNIPCSS.SELECTED_SNIPPET['tailwind_html'],
                            SNIPCSS.SELECTED_SNIPPET['tailwind_css'],
                            SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes']
                        );

                        if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                            anIframe.contentDocument.open();
                            anIframe.contentDocument.write(loadFrameHtml);
                            anIframe.contentDocument.close();
                        } else {
                            let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                            anIframe.contentDocument.open();
                            anIframe.contentDocument.write(noDeviceWidthFrame);
                            anIframe.contentDocument.close();
                        }
                        $('#panelheader-html').find('span').text("TAILWIND");
                        $(this).text(" Show Original");
                    }

                    // Refresh the preview
                    setTimeout(function(){
                        document.getElementById('preview_iframe').contentWindow.doInitialize();
                        if($('.editbadge').html() == 'Stop'){
                            document.getElementById('preview_iframe').contentWindow.startEditing();
                        }
                    }, 100);
                });
          }
          $('#save-' + panelName).on('click', function(){
              var myPanel = this.id.split('-')[1];
              //save-html
              let loadWithTailwind = false;
              if(myPanel == 'html'){
                  let existingHtml = SNIPCSS.SELECTED_SNIPPET['snip_html'];
                  let existingCss = SNIPCSS.SELECTED_SNIPPET['snip_css'];
                  //we need to rebuild the iframe 
                  let existingIFrame = SNIPCSS.SELECTED_SNIPPET['snip_iframe'];
                  var newCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
                  var newHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
                  console.log("old html");
                  console.log(existingHtml);
                  console.log("new html is");
                  console.log(newHtml);
                  
                  let useTailwind = false;
                  if($('#showoriginal-html').length > 0 && $('#showoriginal-html').text().indexOf('Original') >= 0){
                        useTailwind = true;
                        loadWithTailwind = true;
                        SNIPCSS.SELECTED_SNIPPET['tailwind_html'] = newHtml;           
                  }else{
                        var iframeHtml = getPreviewFrameHtml(existingCss, newHtml);  
                        SNIPCSS.SELECTED_SNIPPET['snip_html']  = newHtml;
                        SNIPCSS.SELECTED_SNIPPET['snip_iframe'] = iframeHtml;                         
                  }       
                  updateSnippet(SNIPCSS.SELECTED_UID, SNIPCSS.SELECTED_SNIPPET);
              }else if(myPanel == 'css'){
                  //save-css
                  SNIPCSS.CSS_CHANGED = false;
                  var existingHtml = SNIPCSS.SELECTED_SNIPPET['snip_html'];
                  var existingCss = SNIPCSS.SELECTED_SNIPPET['snip_css'];                  
                  //we need to rebuild the iframe 
                  var existingIFrame = SNIPCSS.SELECTED_SNIPPET['snip_iframe'];
                  var newCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
                  var newHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
                  
                  //used when updating via image replacer
                  if(SNIPCSS.EDITOR_SAVEBOTH){
                      existingHtml = newHtml;
                  }
                  console.log("old css");
                  console.log(existingCss);
                  console.log("new css is");
                  console.log(newCss);
                                    
                  var iframeHtml = getPreviewFrameHtml(newCss, existingHtml);                                                    
                  
                  SNIPCSS.SELECTED_SNIPPET['snip_css']  = newCss;
                  if(SNIPCSS.EDITOR_SAVEBOTH){
                      SNIPCSS.SELECTED_SNIPPET['snip_html']  = newHtml;
                  }                  
                  SNIPCSS.SELECTED_SNIPPET['snip_iframe'] = iframeHtml;              
                  if(FONT_NEW_FONTUSED){
                    SNIPCSS.SELECTED_SNIPPET['snip_usedfonts'] = FONT_NEW_FONTUSEDARR;       
                  }
                  
                  //loadColorSwatches(newCss);
                  updateSnippet(SNIPCSS.SELECTED_UID, SNIPCSS.SELECTED_SNIPPET);                  
                  
              }
              //$('#snippet_loading').css('display', 'block');
              //$('#snippet_viewer').css('display', 'none');
               
              var anIframe = document.querySelector('#preview_iframe');
              anIframe.contentDocument.body.innerHTML = '';              

              if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                  
                   let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, SNIPCSS.SELECTED_SNIPPET['tailwind_html'], SNIPCSS.SELECTED_SNIPPET['tailwind_css'], SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes']);  
                   anIframe.contentDocument.write(loadFrameHtml);                    
                   //anIframe.contentDocument.write(SNIPCSS.SELECTED_SNIPPET['snip_iframe']);                    
              }else{
                  let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, SNIPCSS.SELECTED_SNIPPET['tailwind_html'], SNIPCSS.SELECTED_SNIPPET['tailwind_css'], SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes']);  
                  let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                  anIframe.contentDocument.write(noDeviceWidthFrame);
              }                   
              
                setTimeout(function(){                    
                    document.getElementById('preview_iframe').contentWindow.doInitialize();           
                    if($('.editbadge').html() == 'Stop'){
                        document.getElementById('preview_iframe').contentWindow.startEditing();
                    }
                }, 100);              

              /*
              //fuck clearing content viewer... we should just update the iframe or wahtever
              clearContentViewer(function(){
                  loadSnippet(SNIPCSS.SELECTED_SNIPPET);
              });
              */
          });
          
      }, 100);
    }
    
    //$(document).ready  document.ready
$(function()
{	
    console.log("location");
    console.log(window.location.href);
    let locationHref = window.location.href;
    let locationHash = "";
    if(locationHref.indexOf('#') >= 0){
        locationHash = locationHref.split('#')[1];
    }
    if(locationHash == 'versionupdate'){
        $('#manifestv3_update').css('display', 'block');
    }
    
    
    getOptionStorage(function(theStorage){
        var isEdge = false;
        var agent = window.navigator.userAgent;
        if(agent.indexOf("edge") > -1 || agent.indexOf("edg/")){
            console.log("Edge Browser");
        }        
        else{
            console.log("Google Chrome Browser");
        }
        //console.log("testing regex");
        
       //var testLine = "linear-gradient(to left, #333, #990000 50%, #eee 75%, #CCCCCC 75%);";
        //var testLine = "linear-gradient(to left, rgb(233,128,55), rgba(22,1,66, 0.5) 50%, Orange 75%, rgba(22, 1, 66, 0.1) 75%);";
        //var regexColors = extractColorsWithRegex(testLine);        
        
        //console.log("regex colors:");
        //console.log(regexColors);
        
        //test minicolors:
        /*
        console.log("testing minicolors");
        $('#test_minicolors').minicolors({
          opacity: true,
          position: "bottom left",
          change: function(value, opacity) {
              console.log("value " + value);
              console.log("opacity");
              console.log(opacity);
          }
        });
        */
        
        //LOAD THE OPTIONS
        var removeVendorPrefix = theStorage['remove_vendorprefix'];
        var removeInheritRules = theStorage['remove_inheritrules'];
        var moveInlineStyles = theStorage['move_inlinestyles'];
        var useTailwind = theStorage['use_tailwind'];
        
        var scopePrefix = theStorage['scope_prefix'];
        if(scopePrefix){
            OPTIONS.SCOPE_PREFIX = scopePrefix;
        }
        var globalPrefix = theStorage['global_prefix'];        
        if(globalPrefix){
            OPTIONS.GLOBAL_PREFIX = globalPrefix;
        }        
        var scopeType = theStorage['scope_type'];
        if(scopeType && (scopeType == 'class' || scopeType == 'attribute')){
            OPTIONS.SCOPE_TYPE = scopeType;            
        }
        
        OPTIONS.USER_EMAIL = theStorage['user_email'];
        OPTIONS.PRO_USER = false;
        
        //1 or 0
        var proUser = theStorage['pro_user'];
        OPTIONS.API_KEY = theStorage['api_key'];
        //console.log("API KEY " + OPTIONS.API_KEY);
        //console.log("USER EMAIL " + OPTIONS.USER_EMAIL);
        if(removeVendorPrefix && removeVendorPrefix == 'yes'){
            OPTIONS.REMOVE_VENDORPREFIX = true;
            $('#remove_vendorprefix').prop("checked", true);            
        }   
        
        if(removeInheritRules && removeInheritRules == 'yes'){
            OPTIONS.REMOVE_INHERITRULES = true;
            $('#remove_inheritrules').prop("checked", true);            
        }
        
        if(moveInlineStyles && moveInlineStyles == 'no'){
            OPTIONS.MOVE_INLINESTYLES = false;
            $('#move_inlinestyles').prop("checked", false);
        }
        
        if(useTailwind && useTailwind == 'yes'){
            OPTIONS.USE_TAILWIND = true;
            $('#use_tailwind').prop("checked", true);
        }             
        
        
        if(proUser == 1){
            OPTIONS.PRO_USER = true;
            $('#multiple_resolutions').removeAttr('readonly');
            $('#unused_css').removeAttr('readonly');
            $('#replace_classes').removeAttr('readonly');
            $('#unused_attributes').removeAttr('readonly');
            $('#reload_resolutions').removeAttr('readonly');
            $('#scope_generics').removeAttr('readonly');    
            $('#force_breakpoints').removeAttr('readonly');
            $('#resolve_variables').removeAttr('readonly');              
            
            
            var multipleResolutions = theStorage['multiple_resolutions'];
            var unusedCSS = theStorage['unused_css'];
            var replaceClasses = theStorage['replace_classes'];            
            var unusedAttributes = theStorage['unused_attributes'];            
            var resolutionReload = theStorage['reload_resolutions'];
            var scopeGenerics = theStorage['scope_generics'];  
            var templateEngine = theStorage['template_engine'];
            var useTailwind = theStorage['use_tailwind'];
            var forceBreakpoints = theStorage['force_breakpoints'];
            var resolveVariables = theStorage['resolve_variables'];            

            
            if(multipleResolutions && multipleResolutions == 'yes'){
                $('#multiple_resolutions').prop("checked", true);                               
            }
            if(unusedCSS && unusedCSS == 'yes'){
                $('#unused_css').prop("checked", true);                               
            }         
            if(replaceClasses && replaceClasses == 'yes'){
                $('#replace_classes').prop("checked", true);                               
            }         
            
            
            if(unusedAttributes && unusedAttributes == 'yes'){
                $('#unused_attributes').prop("checked", true);
            }     
           
            if(resolutionReload && resolutionReload == 'yes'){
                $('#reload_resolutions').prop("checked", true);                               
            }      
            
            if(forceBreakpoints && forceBreakpoints == 'yes'){
                $('#force_breakpoints').prop("checked", true);                               
            }     
            if(resolveVariables && resolveVariables == 'yes'){
                $('#resolve_variables').prop("checked", true);                               
            }               
            
            if(scopeGenerics && scopeGenerics == 'yes'){
                $('#scope_generics').prop("checked", true);                          
                $('#scope_prefix_container').css('display', 'block');     
                $('#scope_prefix').val(OPTIONS.SCOPE_PREFIX);
                $('#prefixtext').html(OPTIONS.SCOPE_PREFIX);                
                $('#scope_type').val(OPTIONS.SCOPE_TYPE);                
            }
            if(replaceClasses && replaceClasses == 'yes'){                        
                $('#global_prefix_container').css('display', 'block');     
                $('#global_prefix').val(OPTIONS.GLOBAL_PREFIX);                           
            }            
            
            if(templateEngine && templateEngine != 'Mustache'){
                //console.log("since I can't getting it working this release... not going to switch template engines on startup");
                //OPTIONS.TEMPLATE_ENGINE = templateEngine;             
            }else{
                OPTIONS.TEMPLATE_ENGINE = 'Mustache';
            }
            let adminUsers = ['m.a.rk.rieck81@gmail.com', 'lowreelay@gmail.com', 'up.ri.ghtnetize.n@gmail.com', 'up.rig.h.tneti.zen@gmail.com', 'markri.e.ck.81@gmail.com'];
            if(adminUsers.includes(OPTIONS.USER_EMAIL)){
                //still check admin user api key on server
                //just reveal the admin buttons to these people
                OPTIONS.IS_ADMIN_USER = true;
                console.log("IS ADMIN USER");
                $('#test_button').css('display', 'block');
            }            
            $('#chatgpt_tokens').html("Unlimited*"); 
            $('#version_using').html("Thank for buying SnipCSS PRO!  If you run into any issues using the extension " +
                    "please contact support@snipcss.com");
        }else{
            //Retrieve user options from localstorage because 
            if(locationHash == 'versionupdate'){
                if(localStorage['pro_user'] && localStorage['pro_user'] == 1){
                    let userArr = new Array();
                    userArr['user_email'] = localStorage['user_email'];
                    userArr['pro_user'] = localStorage['pro_user'];        
                    userArr['api_key'] = localStorage['api_key'];    
                    userArr['first_name'] = localStorage['first_name'];    
                    userArr['multiple_resolutions'] =  localStorage['multiple_resolutions'];
                    userArr['unused_css'] = localStorage['unused_css'];                   
                    userArr['unused_attributes'] = localStorage['unused_attributes'];
                    userArr['resolutions_selected'] = localStorage['resolutions_selected'];                
                    setOptionStorage(userArr, function(){
                        console.log("done setting new type of options"); 
                    });            
                }
            }
        }               
        
        if (OPTIONS.USE_TAILWIND) {
            $('#scope_generics').attr('readonly', 'readonly').prop('checked', false);
            $('#replace_classes').attr('readonly', 'readonly').prop('checked', false);
            $('#tailwind_scoping_info').show();
        } else {
            $('#scope_generics').removeAttr('readonly');
            $('#replace_classes').removeAttr('readonly');
            $('#tailwind_scoping_info').hide();
        }     
        
        TEMPLATES.button_handlers();
        TEMPLATES.TEMPLATE_LANGUAGE = OPTIONS.TEMPLATE_ENGINE;
       
        //reload last tab page you were on 
        chrome.tabs.getCurrent(function(tab){
            //console.log("current url " + tab.url);
            var tabSplit = tab.url.split('#');    
            if(tabSplit.length > 1 && tabSplit[1] != ""){
                var selectedTab = tabSplit[1];
                /*
                leftnav_dashboard
                leftnav_options
                leftnav_templates
                leftnav_tutorial
                leftnav_terms
                */
                if(selectedTab.length > 4){
                    $('#leftnav_' + selectedTab).trigger('click');
                }                               
            }else{
                
                chrome.storage.local.get('last_nav', function(result) {                
                    //console.log("lastnav result: ");
                    //console.log(result);
                    let lastNav = result['last_nav'];
                    //console.log(lastNav);
                    
                    if(!lastNav){
                        $('#leftnav_dashboard').trigger('click');
                    }else{
                        $('#leftnav_' + lastNav).trigger('click');                    
                    }
                });
                
            }
        });   	
        
        
        //remove remove remove
        console.log("we are testing templates...");
        //testing templates.. template now
        //TEMPLATES.TEMPLATE_NAME = '';
        //testTemplates();
        //console.log("localstorage unused_css");
        //console.log(localStorage['unused_css']);
        
        
        //remove remove remove 
        /*
        chrome.storage.local.get(null, function(items) {
            var allKeys = Object.keys(items);
            //console.log("all keys ");
            //console.log(allKeys);
            var newKeys = new Array();
            for(var x = 0; x < allKeys.length; x++){
                var aKey = allKeys[x];
                console.log("akey:");
                console.log(aKey);
            }
        });
        */       
       
       
        toastr.options = {
          "closeButton": true,
          "debug": false,
          "newestOnTop": false,
          "progressBar": false,
          "positionClass": "toast-bottom-right",
          "preventDuplicates": false,
          "onclick": null,
          "showDuration": "300",
          "hideDuration": "1000",
          "timeOut": "5000",
          "extendedTimeOut": "1000",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        };
        
        let updateCredits = false;
        if(theStorage['user_credits_updated'] == null){
            updateCredits = true;
        }else{
            try{
                var now = new Date().getTime();
                var minDate = now - (24 * 60 * 60);      
                
                let updateTime = theStorage['user_credits_updated'];
                if(updateTime < minDate){
                    updateCredits = true;
                }
            }catch(exx){
                
            }
        }
        if(updateCredits && OPTIONS.API_KEY != "" && OPTIONS.API_KEY != null){
            console.log("Getting credits");
            API.getUserCredits(OPTIONS.API_KEY, function(response){
                console.log("response");
                console.log(response);
                if(response['success'] == 'true'){
                    
                    let now = new Date().getTime();
                    let creditsLeft = parseFloat(response['credits_left']);
                    let paidUser = parseInt(response['paid_user']);
                    if(paidUser == 1){
                        $('#gopro2').css('display', 'none');
                        $('#nonpro_generative').css('display', 'none');
                        $('#pro_generative').css('display', 'inline');
                        
                        if(creditsLeft > 20.0){
                            $('#chatgpt_tokens').html("Unlimited*"); 
                        }else{
                            $('#chatgpt_tokens').html("Unlimited*");                             
                        }
                    }else{
                        $('#chatgpt_tokens').html(creditsLeft); 
                    }
                    let optionArr = new Array();
                    optionArr['user_credits'] = creditsLeft;
                    optionArr['user_credits_updated'] = now;
                    optionArr['user_credits_paid'] = paidUser;
                    
                    setOptionStorage(optionArr, function(){                    

                    });                    
                    
                }else{
                    if(OPTIONS.PRO_USER){
                        $('#chatgpt_tokens').html("Unlimited*"); 
                    }
                }
            });
        }else{     
            console.log("Not Updating Credits");
            console.log("API KEY " + OPTIONS.API_KEY);
            let creditsLeft = theStorage['user_credits'];;
            let paidUser = theStorage['user_credits_paid'];
            if(paidUser == 1){
                $('#gopro2').css('display', 'none');
                $('#nonpro_generative').css('display', 'none');
                $('#pro_generative').css('display', 'inline');
                if(creditsLeft > 20.0){
                    $('#chatgpt_tokens').html("Unlimited*"); 
                }else{
                    $('#chatgpt_tokens').html("May be Rate Limited*");                             
                }
                
                if(!OPTIONS.API_KEY || OPTIONS.API_KEY == ''){
                    OPTIONS.PRO_NEEDS_KEY = true;
                    $('#promember_link').html("Login Now");
                    $("#member_explanation").html("Thank you for becoming a Pro Member!  To access this new feature you need to log into SnipCSS.com to update your API key.  Once you login you'll have complete access to all features.");                   
                }else{
                    let oneInHundred = Math.random() * 100;
                    if(oneInHundred <= 2){
                        API.updateUserCredits(OPTIONS.API_KEY, function(response){
                            if(response['expired'] == 1){
                                let optionArr = new Array();
                                optionArr['pro_user'] = false;
                                setOptionStorage(optionArr, function(){                    

                                });                                   
                            }
                        });
                    }
                }                
            }else{
                $('#chatgpt_tokens').html(creditsLeft); 
            }        
        }
    });
    
    //button handlers
 //checkbox handlers
        $('body').on('change', '.options-checkbox', function(e){
            var theID = this.id;
            if($('#' + theID).is(':checked')){
                var cancelIt = false;
                if(theID == 'scope_generics'){                    
                    if(!OPTIONS.PRO_USER || OPTIONS.USE_TAILWIND){
                        cancelIt = true;
                    }else{
                        OPTIONS.SCOPE_GENERICS = true;
                        $('#scope_prefix_container').css('display', 'block');     
                        $('#scope_prefix').val(OPTIONS.SCOPE_PREFIX);
                        $('#prefixtext').html(OPTIONS.SCOPE_PREFIX); 
                        $('#scope_type').val(OPTIONS.SCOPE_TYPE);                         
                    }                    
                }
                else if(theID == 'remove_vendorprefix'){
                    OPTIONS.SCOPE_GENERICS = true;
                }    
                else if(theID == 'remove_inheritrules'){
                    OPTIONS.SCOPE_GENERICS = true;
                }    
                else if(theID == 'multiple_resolutions'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.MULTIPLE_RESOLUTIONS = true;
                        //theStorage['default_resolutions'] = ['default', 'iphonexs', 'ipadvertical'];
                    }
                }    
                else if(theID == 'unused_css'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.UNUSED_CSS = true;
                    }
                }  
                else if(theID == 'replace_classes'){
                    if(!OPTIONS.PRO_USER || OPTIONS.USE_TAILWIND){
                        cancelIt = true;
                    }else{
                        OPTIONS.REPLACE_CLASSES = true;
                        $('#global_prefix_container').css('display', 'block');     
                        $('#global_prefix').val(OPTIONS.GLOBAL_PREFIX);                         
                    }                    
                }
                else if(theID == 'unused_attributes'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.UNUSED_ATTRIBUTES = true;
                    }
                }  
                else if(theID == 'use_tailwind'){
                    OPTIONS.USE_TAILWIND = true;
                    // Disable these two options if Tailwind is on
                    $('#scope_generics').attr('readonly', 'readonly').prop('checked', false);
                    $('#replace_classes').attr('readonly', 'readonly').prop('checked', false);
                    $('#tailwind_scoping_info').show();
                    // Auto-check Tailwind sub-options if user is Pro
                    if(OPTIONS.PRO_USER){
                        $('#force_breakpoints').prop('checked', true);
                        $('#resolve_variables').prop('checked', true);
                        OPTIONS.FORCE_BREAKPOINTS = true;
                        OPTIONS.RESOLVE_VARIABLES = true;
                    }
                }                  
                else if(theID == 'reload_resolutions'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.RELOAD_RESOLUTIONS = true;
                    }                    
                }
                else if(theID == 'force_breakpoints'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.FORCE_BREAKPOINTS = true;
                    }                    
                }
                else if(theID == 'resolve_variables'){
                    if(!OPTIONS.PRO_USER){
                        cancelIt = true;
                    }else{
                        OPTIONS.RESOLVE_VARIABLES = true;
                    }                    
                }
                
                
                if(cancelIt){
                    $('#' + theID).prop("checked", false);
                }
                else{
                    let optionArr = new Array();
                    optionArr[theID] = "yes";
                    setOptionStorage(optionArr, function(){
                        
                    });
                    //localStorage[theID] = "yes";                                
                    console.log(theID + " is set to true");                
                }

            }else{                
                if(theID == 'scope_generics'){
                    OPTIONS.SCOPE_GENERICS = false;
                    $('#scope_prefix_container').css('display', 'none');    
                    //$('#scope_type').attr('disabled', 'disabled');                    
                }
                else if(theID == 'remove_vendorprefix'){
                    OPTIONS.SCOPE_GENERICS = false;
                }    
                else if(theID == 'remove_inheritrules'){
                    OPTIONS.SCOPE_GENERICS = false;
                }    
                else if(theID == 'multiple_resolutions'){
                    OPTIONS.MULTIPLE_RESOLUTIONS = false;
                }    
                else if(theID == 'unused_css'){
                    OPTIONS.UNUSED_CSS = false;
                }   
                else if(theID == 'replace_classes'){
                    OPTIONS.REPLACE_CLASSES = false;
                    $('#global_prefix_container').css('display', 'none');   
                }                   
                else if(theID == 'unused_attributes'){
                    OPTIONS.UNUSED_ATTRIBUTES = false;
                }
                else if(theID == 'use_tailwind'){
                    OPTIONS.USE_TAILWIND = false;
                    // Disable these two options if Tailwind is on
                    $('#scope_generics').removeAttr('readonly');
                    $('#replace_classes').removeAttr('readonly');
                    $('#tailwind_scoping_info').hide();
                    // Uncheck Tailwind sub-options
                    $('#force_breakpoints').prop('checked', false);
                    $('#resolve_variables').prop('checked', false);
                    OPTIONS.FORCE_BREAKPOINTS = false;
                    OPTIONS.RESOLVE_VARIABLES = false;
                }
                else if(theID == 'force_breakpoints'){
                    OPTIONS.FORCE_BREAKPOINTS = false;
                }
                else if(theID == 'resolve_variables'){
                    OPTIONS.RESOLVE_VARIABLES = false;
                }                
                else if(theID == 'reload_resolutions'){
                    OPTIONS.RELOAD_RESOLUTIONS = false;
                }
                let optionArr = new Array();
                optionArr[theID] = "no";
                setOptionStorage(optionArr, function(){                    
                    
                });
                
                //localStorage[theID] = "no";                                
                console.log(theID + " is set to false");                           
            }
            
        });           
        

        var updateTetherNav = function(menuItem){
            if(TETHER_NAV !== null){
                TETHER_NAV.destroy();
                $('#css_arrow').remove();
            }

            $('body').append('<div id="css_arrow" class="css_arrow"></div>');

            setTimeout(function(){
                var cssArrow = document.getElementById('css_arrow');
                TETHER_NAV = new Tether({
                  element: cssArrow,
                  target: menuItem,
                  attachment: 'middle left',
                  targetAttachment: 'middle right'
                });                    
            }, 50);
            
            if(menuItem.id == "leftnav_directory"){
                //alert("directory");
                
                let directoryUrl = 'https://templates.snipcss.com/view';
                if(TEMPLATES.IN_EXTENSION){
                    var chromeExtensionId = chrome.runtime.id;
                    if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
                        //dev version
                        directoryUrl = 'http://localtemplates.snipcss.com/view';   
                    }        
                }
                if($('.grid').children().length < 5){
                    API.getDirectoryTemplates(function(response){
                        let allTemplates = response['templates'];
                        for(let x = 0; x < allTemplates.length; x++){
                            let aTemplate = allTemplates[x];
                            //let aDiv = '    
                            const dtempString = `
                            <div class="grid-item item-outer">
                                <div class="">
                                    <div class="wf-box">
                                        <div class="target_link">
                                            <a href="${directoryUrl}/${aTemplate.url}" class="m-0 figure">
                                                <img src="${aTemplate.thumbnail_image}" data-snip-jwgnr="">
                                            </a>
                                        </div>
                                        <div class="information flex-column pl-3 pt-2">                                        
                                        </div>
                                        <div class="content-inner">
                                            <a href="${directoryUrl}/${aTemplate.url}" data-snip-o5rnk="">
                                                <h3 data-snip-rdhet="">${aTemplate.display_name}</h3>
                                            </a>                
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `;
                            /*
                                            <div id="box1" class="tagbox">
                                                ${aTemplate.tag_array.map(atag => {
                                                    const href = atag.section_id > 0 ? `https://templates.snipcss.com/${atag.link}` : `https://templates.snipcss.com/tag/${atag.link}`;
                                                    return `<a href="${href}" class="tagitem">${atag.tag}</a>`;
                                                }).join('')}
                                            </div>  
                             */                        


                            //console.log("a string:" );
                            //console.log(dtempString);
                            $('.grid').append(dtempString);
                        }
                        var $templates = $('.grid').masonry( {
                            columnWidth: '.grid-item-sizer',
                            gutter: '.grid-item-gutter',
                            itemSelector: '.grid-item'
                        });

                        // load masonry with imagesLoaded to prevent overlap
                        $templates.imagesLoaded().progress(function() {
                            $templates.masonry('layout');
                            $('.loading_directory_snippets').css('display', 'none');
                            $('#see_all_templates_container').css('display', 'block');
                        });                    

                    });
                }
            }

        };
            
            
            var menuItem = document.getElementById('leftnav_dashboard');
            updateTetherNav(menuItem);
            

                
            $('#leftnav-menu').on('click', 'a', function(e){
                // Only prevent default for internal nav links (those with id containing 'leftnav_')
                if(this.id && this.id.includes('leftnav_')){
                    e.preventDefault();
                    var thePanel = this.id.split('_')[1];
                    $('div[id*="content_"]').css('display', 'none');
                    $('#content_' + thePanel).css('display', 'block');
                    $('#leftnav-menu li').removeClass('active');
                    $(this).parent().addClass('active');
                    updateTetherNav(this);

                   //var divArr = new Array('leftnav_dashboard', 'leftnav_options', 'leftnav_templates', 'leftnav_tutorial', 'leftnav_terms');
                   var setData = {};
                   setData["last_nav"] = thePanel;
                   chrome.storage.local.set(setData, function() {

                   });
                }
                // Otherwise, let the browser handle the navigation normally (e.g., external links)
            });

            PAGE_READY = true;
            
            refreshSnipList();
            
            $('#allsnippets_dropdown').change(function(){
                console.log("changed snippet222 to " + this.value);  
                var theVal = this.value;
                if(theVal == ""){
                    //alert("Snippet is empty");
                    $('#snippet_viewer').empty();  
                    return;
                }
                getSnippetByUID(theVal, function(snippet){
                    //console.log("from callback: " );
                    //console.log(snippet);                    
                    if(snippet !== null){
                        SNIPCSS.SELECTED_SNIPPET = snippet;
                        
                        //console.log("the non-responsive css is: " );
                        //console.log(snippet['snip_css_noresponsive']);
                        //SNIPCSS.SELECTED_ID = snippet['index'];
                        SNIPCSS.SELECTED_UID = snippet['uid'];
                        $('#snippet_loading').css('display', 'block');
                        $('#snippet_viewer').css('display', 'none');                    

                        clearContentViewer(function(){
                            loadSnippet(snippet);                                                            
                        });           
                    }else{
                        alert("There was an error.  Try refreshing the page and selecting the snippet.");
                        clearContentViewer();
                    }                    
                });                             
            });
        $(window).on('scroll', function(){
            var scrollBottom = parseInt($(window).scrollTop() + window.innerHeight);
            $('#sidebar').css('height', scrollBottom.toString() + "px");
        });   
        
        $('#download_snippet').on('click', function(){
            var theVal = $('#allsnippets_dropdown').val();
            if(theVal == ""){
                alert("Please select a snippet");
                return;
            }
            getSnippetByUID(theVal, function(snippet){
                console.log(snippet);                
                packageZipFile(snippet);
                /*
                var zip = new JSZip();
                zip.file("index.html", snippet['snip_iframe']);
                var images = zip.folder("images");
                images.file("smile.gif", imgData, {base64: true});

                zip.generateAsync({type:"blob"}).then(function (blob) { // 1) generate the zip file
                    saveAs(blob, "hello.zip");                          // 2) trigger the download
                }, function (err) {
                    $("#test_zip_file").text(err);
                });
                */
                
            });                     
        });
        
        $('#confirm_sendtocodepen').on('click', function(){
            let snipHtml = SNIPCSS.SELECTED_SNIPPET['snip_html'];
            let snipCSS = SNIPCSS.SELECTED_SNIPPET['snip_css'];
            let origUrl = SNIPCSS.SELECTED_SNIPPET['snip_url'];
            let useTailwind = false;
            if($('#showoriginal-html').length > 0 && $('#showoriginal-html').text().indexOf('Original') >= 0){
                useTailwind = true;
                snipHtml = SNIPCSS.SELECTED_SNIPPET['tailwind_html'];
                snipCSS = SNIPCSS.SELECTED_SNIPPET['tailwind_css'];                    
            }                   
            
            console.log("orig url");
            console.log(origUrl);
            console.log(SNIPCSS.SELECTED_SNIPPET);
            sendToCodepen(origUrl, snipHtml, snipCSS, useTailwind, SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes']);
            MicroModal.close("modal-show-copyrightproblems");             
        });
        $('#cancel_sendtocodepen').on('click', function(){
            MicroModal.close("modal-show-copyrightproblems"); 
        });
        
        
        $('#send_to_codepen').on('click', function(){
            var theVal = $('#allsnippets_dropdown').val();
            if(theVal == ""){
                alert("Please select a snippet");
                return;
            }

            console.log(SNIPCSS.SELECTED_SNIPPET);   
            let snipHtml = SNIPCSS.SELECTED_SNIPPET['snip_html'];
            let snipCSS = SNIPCSS.SELECTED_SNIPPET['snip_css'];
            let origUrl = SNIPCSS.SELECTED_SNIPPET['snip_url'];
            let allProblems = TEMPLATES.detectCopyrightProblems(snipHtml, snipCSS, 'mysite');

            if(allProblems.length >= 0){

            }            
            MicroModal.show('modal-show-copyrightproblems');    
        });
        
        //feedback form
        $('#feedback_type').on('change', function(e){
            let feedbackTypeSelect = $(this).val();
            if(feedbackTypeSelect == 'bug'){
                $('#related_snippet_section').css('display', 'block');
            }else{
                $('#related_snippet_section').css('display', 'none');   
            }
        });        
        
        $('#delete_snippet').on('click', function(e){
            e.preventDefault();
            var snipIndex = $('#allsnippets_dropdown').val();
            if(snipIndex == ''){
                alert("Select a Snippet to delete");
                return;
            }
            var res = confirm("Are you sure you want to delete this snippet?");
            if(!res){
                return;
            }            
            chrome.storage.local.get(['snippet_indices'], function(result) {            
                let allIndices = new Array();
                if(result['snippet_indices']){
                    allIndices = result['snippet_indices'];
                    
                    
                    let newIndices = new Array();
                    let deleteName = "";
                    for(let a = 0; a < allIndices.length; a++){
                        let iObj = allIndices[a];
                        let theUID = iObj['uid'];
                        let theName = iObj['snip_name'];
                        let isSelected = "";  

                        if(snipIndex == theUID){
                            deleteName = theName;
                              chrome.storage.local.remove(['snipresult-' + theUID], function(){

                              });                                  
                            continue;
                        }
                        newIndices.push(iObj);
                    }                
                    var setData = {};
                    setData['snippet_indices'] = newIndices;

                    chrome.storage.local.set(setData, function() {
                        console.log("deleted " + deleteName);  
                        refreshSnipList(-1);
                    });                                         
                }            
            });
            /*
            getSnippetByUID(snipIndex, function(deleteSnippet){
                var savedSnippets = localStorage['snippets'];
                if(savedSnippets)
                {
                    var existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
                    var newSnips = new Array();
                    console.log(existingSnips);                
                    for(var x = 0; x < existingSnips.length; x++){
                        var snip = existingSnips[x];
                        var isSelected = "";
                        if(snipIndex == snip['uid']){
                            continue;
                        }
                        newSnips.push(snip);
                        newSnips[newSnips.length - 1]['index'] = newSnips.length;                    
                    }                
                }	 
                console.log("old snippets");
                console.log(existingSnips);
                console.log("new snippets");
                console.log(newSnips);
                localStorage['snippets'] = JSON.stringify(newSnips);

                refreshSnipList(-1);
                console.log("compute key");
           
            });
            */
        });
        $('body').on('click', '#load_more_swatches', function(){
                $(this).remove();
                $('.hiddenswatch').each(function(){
                    var me = this;
                    $(this).minicolors({
                        opacity: true,
                        change: function(value, opacity) {
                            
                            console.log("id " + me.id);
                            console.log("color change value " + value + " opacity " + opacity);
                            
                            var newValue = "";
                            if(opacity >= 1.0){
                                newValue = value;
                            }
                            else{
                                //convert to rgba 
                                var rgbData = hexToRgb(value);                                
                                newValue = "rgba(" + rgbData['red'] + "," + rgbData['green'] + "," + rgbData['blue'] + "," + opacity.toString() + ")";
                            }           
                            var originalValue = $(me).data('original');
                            console.log("originalvalue " + originalValue);
                            SNIPCSS.COLOR_MAPPING[originalValue] = newValue;
                            $(me).data('original', newValue);
                            SNIPCSS.COLOR_CHANGED = true;
                           
                            var currIframe = SNIPCSS.SELECTED_SNIPPET['snip_iframe'];
                            //console.log("iframe before");
                            //console.log(currIframe);
                            var oldCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
                            console.log("old css");
                            console.log(oldCss);
                            var newCss = oldCss;
                            var allColorVals = new Array();
                            for(var mapKey in SNIPCSS.COLOR_MAPPING){
                                currIframe = replaceAll(currIframe, mapKey, SNIPCSS.COLOR_MAPPING[mapKey]);
                                newCss = replaceAll(newCss, mapKey, SNIPCSS.COLOR_MAPPING[mapKey]);
                                allColorVals.push(SNIPCSS.COLOR_MAPPING[mapKey]);
                            }
                            SNIPCSS.CSS_EDITOR.getDoc().setValue(newCss);  
                            SNIPCSS.SELECTED_SNIPPET['snip_iframe'] = currIframe;
                            console.log("new css");
                            console.log(newCss);
                            
                            //reset color mapping to have value for every key
                            for(var m = 0; m < allColorVals.length; m++){
                                var colorVal = allColorVals[m];
                                SNIPCSS.COLOR_MAPPING[colorVal] = colorVal;
                            }
                            
                            console.log("color mapping now");
                            console.log(SNIPCSS.COLOR_MAPPING);
                            
                            //only change once every .5 sec
                            var now = new Date().getTime();
                            var minDate = now - 500;
                            if(SNIPCSS.LASTCOLOR_UPDATE == null || SNIPCSS.LASTCOLOR_UPDATE < minDate){
                                SNIPCSS.LASTCOLOR_UPDATE = now;
                                var anIframe = document.querySelector('#preview_iframe');
                                anIframe.contentDocument.body.innerHTML = '';
                                if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                                    anIframe.contentDocument.write(SNIPCSS.SELECTED_SNIPPET['snip_iframe']);                    
                                }else{
                                    let noDeviceWidthFrame = replaceAll(SNIPCSS.SELECTED_SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
                                    anIframe.contentDocument.write(noDeviceWidthFrame);
                                }                               
                                SNIPCSS.CHANGING_COLOR = false;                                
                            }
                            
                         },
                         show: function(){
                             if(SNIPCSS.CSS_CHANGED){
                                 //save before any color edits
                                 $('#save-css').trigger('click');
                             }
                         },
                         hide : function(){
                             
                         }

                    });
                });                        
        });
        
        $('body').on('click', '.editbadge', function(){
            if($(this).html() == 'Stop'){
                document.getElementById('preview_iframe').contentWindow.stopEditing();                
                $(this).html('Edit');                
            }else{
                document.getElementById('preview_iframe').contentWindow.startEditing();
                $(this).html('Stop');
                toastr.warning('Click an Element to edit it.  After typing text you can press enter to save.', 'Editing Started');
            }
        });
        
        $('body').on('click', '#mobileicon_mobile', function(){
            $('.snipcss-frame-wrapper').css('width', '380px');
            $('#preview_panel').css('width', '');     
            
            let useTailwind = false;
            let loadWithTailwind = false;   
            let tailwindHtml = "";
            let tailwindCss = "";
            let tailwindBodyClasses = new Array();
            if($('#showoriginal-html').length > 0 && $('#showoriginal-html').text().indexOf('Original') >= 0){
                useTailwind = true;
                loadWithTailwind = true;
                tailwindHtml = SNIPCSS.SELECTED_SNIPPET['tailwind_html'];
                tailwindCss = SNIPCSS.SELECTED_SNIPPET['tailwind_css'];   
                tailwindBodyClasses = SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes'];
            }   
            
            SNIPCSS.CURR_DEVICE_SIZE = "mobile";
            $('.snipcss-frame-info').css('display', 'block');
            if(SNIPCSS.SELECTED_SNIPPET != null){
                let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses);  
                let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                let anIframe = document.querySelector('#preview_iframe');
                anIframe.contentDocument.open();
                anIframe.contentDocument.write(noDeviceWidthFrame);
                anIframe.contentDocument.close();                
                //anIframe.contentDocument.body.innerHTML = '';                
                //anIframe.contentDocument.write(noDeviceWidthFrame);                                
            }
        });
        
        $('body').on('click', '#mobileicon_desktop', function(){
            $('.snipcss-frame-wrapper').css('width', '100%');           
            $('#preview_panel').css('width', '');             
            SNIPCSS.CURR_DEVICE_SIZE = "desktop"; 
            let loadWithTailwind = false;   
            let tailwindHtml = "";
            let tailwindCss = "";
            let tailwindBodyClasses = new Array();
            if($('#showoriginal-html').length > 0 && $('#showoriginal-html').text().indexOf('Original') >= 0){
                loadWithTailwind = true;
                tailwindHtml = SNIPCSS.SELECTED_SNIPPET['tailwind_html'];
                tailwindCss = SNIPCSS.SELECTED_SNIPPET['tailwind_css'];
                tailwindBodyClasses = SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes'];
            }               
            
            $('.snipcss-frame-info').css('display', 'none');
            if(SNIPCSS.SELECTED_SNIPPET != null){
                let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses);                  
                let anIframe = document.querySelector('#preview_iframe');
                //anIframe.contentDocument.body.innerHTML = '';      
                //anIframe.contentDocument.write(loadFrameHtml);                               
                anIframe.contentDocument.open();
                anIframe.contentDocument.write(loadFrameHtml);
                anIframe.contentDocument.close();                    
            }
            
        });
        $('body').on('click', '#mobileicon_tablet', function(){
            $('.snipcss-frame-wrapper').css('width', '770px');                        
            $('#preview_panel').css('width', '');  
            SNIPCSS.CURR_DEVICE_SIZE = "tablet"; 
            let loadWithTailwind = false;   
            let tailwindHtml = "";
            let tailwindCss = "";
            let tailwindBodyClasses = new Array();
            if($('#showoriginal-html').length > 0 && $('#showoriginal-html').text().indexOf('Original') >= 0){
                loadWithTailwind = true;
                tailwindHtml = SNIPCSS.SELECTED_SNIPPET['tailwind_html'];
                tailwindCss = SNIPCSS.SELECTED_SNIPPET['tailwind_css'];     
                tailwindBodyClasses = SNIPCSS.SELECTED_SNIPPET['tailwind_body_classes'];     
            }                
            $('.snipcss-frame-info').css('display', 'block');
            if(SNIPCSS.SELECTED_SNIPPET != null){
                let loadFrameHtml = getPreviewFrameHtml(SNIPCSS.SELECTED_SNIPPET['snip_css'], SNIPCSS.SELECTED_SNIPPET['snip_html'], loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses);                  
                
                let noDeviceWidthFrame = replaceAll(loadFrameHtml, 'max-device-width', 'max-width');
                let anIframe = document.querySelector('#preview_iframe');  
                //anIframe.contentDocument.body.innerHTML = '';      
                //anIframe.contentDocument.write(noDeviceWidthFrame);                               
                anIframe.contentDocument.open();
                anIframe.contentDocument.write(noDeviceWidthFrame);
                anIframe.contentDocument.close();                     
            }
            
        });
        $('body').on('click', '#mobileicon_custom', function(){
            MicroModal.show('modal-custom-width');   
            
            //$('.snipcss-frame-wrapper').css('width', '770px');                        
        });        
        
        $('body').on('click', '#set_viewport_width', function(e){
            e.preventDefault();
            var viewportVal = $('#customviewport_width').val().replace('px', '').trim();
            var viewportInt = parseInt(viewportVal);
            if(viewportInt <= 100 || viewportInt > 2500){
                alert("Please enter a valid number for viewport width, inbetween 100 and 2500.");
                return;
            }
            $('.snipcss-frame-wrapper').css('width', viewportInt.toString() + 'px'); 
            if(viewportInt > 700){
                $('#preview_panel').css('width', viewportInt.toString() + 'px');
            }else{
                $('#preview_panel').css('width', '');                
            }
            MicroModal.close("modal-custom-width"); 
            SNIPCSS.CURR_DEVICE_SIZE = "custom";
            $('.snipcss-frame-info').css('display', 'block');
            if(SNIPCSS.SELECTED_SNIPPET != null){
                let noDeviceWidthFrame = replaceAll(SNIPCSS.SELECTED_SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
                let anIframe = document.querySelector('#preview_iframe');  
                anIframe.contentDocument.body.innerHTML = '';                      
                anIframe.contentDocument.write(noDeviceWidthFrame);                               
            }
            
        });   
        

        var switchReplaceType = function(replaceType){
            if(replaceType == 'prompt'){
                $('#enter_a_prompt').html("Enter a prompt:");        
                $('#replace_as_icon_instead').css('display','block');
                $('#replace_as_prompt_intead').css('display','none');
                $('#replace_as_url_instead').css('display','block');              
                
                $('#replace_image_promptcontainer').css('display', 'block');
                $('#replace_image_iconselect').css('display', 'none');    
                $('#replace_image_urlcontainer').css('display', 'none');                
                $('#snipcss_replacesingle_generate').html("Generate");
            }else if(replaceType == 'icon'){
                $('#enter_a_prompt').html("Select an Icon");
                $('#replace_as_icon_instead').css('display','none');
                $('#replace_as_prompt_intead').css('display','block');
                $('#replace_as_url_instead').css('display','block');    
                
                $('#replace_image_promptcontainer').css('display', 'none');
                $('#replace_image_iconselect').css('display', 'block');
                $('#replace_image_urlcontainer').css('display', 'none');
                $('#snipcss_replacesingle_generate').html("Replace");
                $('#minicolor_icon').minicolors({
                    opacity: false,
                    position: 'bottom right',
                    change: function(value, opacity) {
                        console.log("value now " + value);
                    }
                });                
                
                //show the icons
                $('#replace_image_iconlist').empty();             
                tablerIconArr.forEach(function(iconName) {
                        let iconCell = '<div data-iconname="' + iconName + '" class="icon-item">' + 
                                '<a data-iconname="' + iconName + '" class="imagereplace_tabler_icon" href="javascript:void(0);">' + 
                                    '<i class="ti ti-' + iconName + '"></i>' + 
                                '</a>' + 
                            '</div>';
                        $('#replace_image_iconlist').append(iconCell);                    
                });                        
            }else if(replaceType == 'url'){
                $('#enter_a_prompt').html("Enter a URL");
                
                $('#replace_as_icon_instead').css('display','block');
                $('#replace_as_prompt_intead').css('display','block');
                $('#replace_as_url_instead').css('display','none');    
                
                $('#replace_image_promptcontainer').css('display', 'none');
                $('#replace_image_urlcontainer').css('display', 'block');
                $('#replace_image_iconselect').css('display', 'none');
                $('#snipcss_replacesingle_generate').html("Replace");                
            }
            OPTIONS.LAST_SELECTED_REPLACE_TYPE = replaceType;
        };
    
        $('body').on('click', '#replace_as_icon_instead', function(){      
            switchReplaceType("icon");
        });
        $('body').on('click', '#replace_as_url_instead', function(){      
            switchReplaceType("url");
        });      
        $('body').on('click', '#replace_as_prompt_intead', function(){      
            switchReplaceType("prompt");            
        });      
        
        $('body').on('click', '.htmlsvgreplace', function(e){
            e.preventDefault();
            e.stopPropagation();
            if(OPTIONS.API_KEY == '' || OPTIONS.API_KEY == null){
                MicroModal.show('modal-member-feature');
                return;
            }
            $('#snipcss_replacesvg_replace').html('Replace');  

            let svgType = $(this).data('imgtype');
            let svgIndexText = $(this).data('imgindex');
            let svgName = null;
            let svgHtml = null;
            let svgIndex = parseInt(svgIndexText);
            let svgObject = SVG_IN_HTML[svgIndex];
            SVG_REPLACING_INDEX = svgIndex;            
            svgHtml = svgObject['html'];
            if(svgObject['replaced']){
                alert("You already replaced this SVG");
                return;
            }       
            $('#current_svg').empty('');
            
            if(svgObject['type'] == 'icon'){
                
                var createIconPreview = function(iconHtml) {
                    let snipCSS = SNIPCSS.SELECTED_SNIPPET['snip_css'];
                    let iframeHtml = '<!DOCTYPE html>\n';                    
                    iframeHtml += '<html>\n';
                    iframeHtml += '   <head>\n';
                    iframeHtml += '      <meta charset="utf-8">\n'; 
                    iframeHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';                    
                    iframeHtml += '      <style>\n';   
                    iframeHtml += '         body { margin: 0px auto; text-align: center !important; margin-top: 0px !important; font-size: 28px !important; }\n';
                    iframeHtml += snipCSS;
                    iframeHtml += '      </style>\n';                       
                    iframeHtml += '   </head>\n';
                    iframeHtml += '   <body>\n';
                    iframeHtml += iconHtml;
                    iframeHtml += '   </body>\n';
                    iframeHtml += '</html>\n';   
                  
                    var anIframe = document.querySelector('#iconPreview');
                    anIframe.contentDocument.body.innerHTML = '';                        
                    anIframe.contentDocument.write(iframeHtml);                                 
                };                
                createIconPreview(svgHtml);
            }else{
                $('#current_svg').html(svgHtml);
                let anIframe = document.querySelector('#iconPreview');
                anIframe.contentDocument.body.innerHTML = '';             
            }
            $('#tabler_select_icons').empty();
            
            let defaultIcons = ['check','bell-filled','caret-right','user','shopping-cart','lock', 'arrow-right', 'cloud',
                'search','settings','heart-filled','globe','star-filled','trash','square-rounded-x-filled','plus','minus','pennant-filled','pencil','location-filled','photo'];
            for(let x = 0; x < defaultIcons.length; x++){
                let iconName = defaultIcons[x];

                let iconCell = '<div data-iconname="' + iconName + '" class="icon-item">' + 
                        '<a data-iconname="' + iconName + '" class="select_tabler_icon" href="javascript:void(0);">' + 
                            '<i class="ti ti-' + iconName + '"></i>' + 
                        '</a>' + 
                    '</div>';
                $('#tabler_select_icons').append(iconCell);
            }
            tablerIconArr.forEach(function(iconName) {
                if(!defaultIcons.includes(iconName)) {
                    let iconCell = '<div data-iconname="' + iconName + '" class="icon-item">' + 
                            '<a data-iconname="' + iconName + '" class="select_tabler_icon" href="javascript:void(0);">' + 
                                '<i class="ti ti-' + iconName + '"></i>' + 
                            '</a>' + 
                        '</div>';
                    $('#tabler_select_icons').append(iconCell);                    
                }
            });            
            
            MicroModal.show('modal-singlesvg-replace');
        });
        
        $('body').on('click', '.fontreplace', function(e){
            e.preventDefault();
            e.stopPropagation();
            FONT_REPLACING_INDEX = $(this).data('fontindex');
            let originalFontObj = SNIPCSS.SELECTED_SNIPPET['snip_usedfonts'][FONT_REPLACING_INDEX]; 
            console.log("doing popup with original font object");
            console.log(originalFontObj);
            
            $('#current_font').html(originalFontObj['face_noquotes']);

            var fontKeys = Object.keys(GOOGLE_FONTS_IMPORT_ARR);
            $('#allgooglefonts_dropdown').empty();
            $('#allgooglefonts_dropdown').append('<option value="">Select a font</option>');
            for(let m = 0; m < fontKeys.length; m++){
                let gFontFace = fontKeys[m];
                let optionHtml = '<option value="' + gFontFace + '">' + gFontFace + '</option>';
                $('#allgooglefonts_dropdown').append(optionHtml);
            }                        
            
            MicroModal.show('modal-singlefont-replace');            
        });     
        
        $('#allgooglefonts_dropdown').on('change', function(){
            let selectedFont = $(this).val();
            FONT_REPLACING_GOOGLENAME = selectedFont;
        });
        
        $('.search_icons,.search_icons2').on('input', function() {
            let searchText = $(this).val().toLowerCase(); // Get the input field value and convert to lowercase
            let searchWords = searchText.split(" "); // Split the search text into individual words
            let filteredIcons = new Array();
            if(searchWords.length > 1){
                // Filter the icon names based on the search text
                let iconScores = new Map(); // Use a Map to store icon names and their scores
                for(let word of searchWords) {
                    tablerIconArr.forEach(function(iconName) {
                        if(iconName.includes(word)) {
                            // If the icon name includes the word, increment its score
                            let score = iconScores.has(iconName) ? iconScores.get(iconName) : 0;
                            iconScores.set(iconName, score + 1);
                        }
                    });
                }

                // Convert the Map to an array and sort it based on the scores
                filteredIcons = Array.from(iconScores).sort((a, b) => b[1] - a[1]).map(item => item[0]);
            }
            else{
                // Filter the icon names based on the search text
                filteredIcons = tablerIconArr.filter(function(iconName) {
                  return iconName.includes(searchText);
                });                
            }

          // Clear the existing list and generate a new one
            if(this.id == 'search_icons2'){
                $('#replace_image_iconlist').empty();             
                for(let x = 0; x < filteredIcons.length; x++){
                    let iconName = filteredIcons[x];
                    let iconCell = '<div data-iconname="' + iconName + '" class="icon-item">' + 
                            '<a data-iconname="' + iconName + '" class="imagereplace_tabler_icon" href="javascript:void(0);">' + 
                                '<i class="ti ti-' + iconName + '"></i>' + 
                            '</a>' + 
                        '</div>';
                    $('#replace_image_iconlist').append(iconCell);                    
                }                
            }else{
                $('#tabler_select_icons').empty();

                for(let x = 0; x < filteredIcons.length; x++){
                    let iconName = filteredIcons[x];

                    let iconCell = '<div data-iconname="' + iconName + '" class="imagereplace-icon-item">' + 
                            '<a data-iconname="' + iconName + '" class="select_tabler_icon" href="javascript:void(0);">' + 
                                '<i class="ti ti-' + iconName + '"></i>' + 
                            '</a>' + 
                        '</div>';
                    $('#tabler_select_icons').append(iconCell);
                }
            }
        });        
        
        
        $('body').on('click', '.imagereplace_tabler_icon,.imagereplace-icon-item', function(e){
            e.preventDefault();
            e.stopPropagation();
            let iconName = $(this).data('iconname');
            IMAGE_REPLACING_ICON = iconName;
            
            $('.selected_icon').removeClass('selected_icon');
            
            if($(this).hasClass('imagereplace-icon-item')){
                $(this).first().addClass('selected_icon');
                $(this).addClass('selected_icon');
            }else{
                $(this).parent().addClass('selected_icon');
                $(this).addClass('selected_icon');                
            }
        });        
        
        $('body').on('click', '.select_tabler_icon,.icon-item', function(e){
            e.preventDefault();
            e.stopPropagation();
            let iconName = $(this).data('iconname');
            SVG_REPLACING_ICON = iconName;
            
            $('.selected_icon').removeClass('selected_icon');
            
            if($(this).hasClass('icon-item')){
                $(this).first().addClass('selected_icon');
                $(this).addClass('selected_icon');
            }else{
                $(this).parent().addClass('selected_icon');
                $(this).addClass('selected_icon');                
            }
        });
        
        $('body').on('click', '.htmlimgreplace,.cssimgreplace', function(){
            
            if(OPTIONS.API_KEY == '' || OPTIONS.API_KEY == null){
                MicroModal.show('modal-member-feature');
                return;
            }
            //$('#snipcss_replacesingle_generate').html("Generate");
            $('#replacesingle_prompt').val("");
            $('#replacesingle_url').val("");
            switchReplaceType(OPTIONS.LAST_SELECTED_REPLACE_TYPE);
            
            IMG_REPLACE_ARR = new Array();
            let imgType = $(this).data('imgtype');
            let imgIndexText = $(this).data('imgindex');
            let imgData = null;
            let imgUrl = null;
            let imgIndex = null;
            if(imgType == 'html'){
                imgIndex = parseInt(imgIndexText);
                imgData = SNIPCSS.SELECTED_SNIPPET['snip_himages'][imgIndex];                
                imgUrl = imgData;                    
            }else if(imgType == 'css'){
                imgIndex = parseInt(imgIndexText);
                imgData = SNIPCSS.SELECTED_SNIPPET['snip_cimages'][imgIndex];                                                
                imgUrl = imgData['url'];
            }
            console.log("image url is " );
            console.log(imgUrl);
            
            let aPromise = TEMPLATES.getImageSizePromise(imgUrl, 0, 0, null);
            aPromise.then((retObj) => {            
                
                retObj['prompt'] = "a person sitting at a desk with a laptop, a storybook illustration, global illumination";
                retObj['imgtype'] = imgType;
                retObj['imgindex'] = imgIndex;
                IMG_REPLACE_ARR.push(retObj);     
                console.log("FULL DATA OBJECT");
                console.log(retObj);
                
                $('#singlereplace_current').attr('src', retObj['origurl']);
                
                let previewWidth = parseInt(retObj['width']);
                if(previewWidth > 256){
                    previewWidth = 256;
                }
                else if(previewWidth <= 0){
                    previewWidth = 16;
                }
                $('#singlereplace_current').attr('width', retObj['width']);
                
                MicroModal.show('modal-singleimage-replace');
                
            });
        });
        
        $('#snipcss_replacesingle_cancel').on('click',  function(){
             MicroModal.close('modal-singleimage-replace');
        });
        
        
        
        var getSVGDataUri = function(url, color, callback) {
            // Fetch the SVG file.
            fetch(url).then((response) => {
                return response.text();
            }).then((svgData) => {
                // Parse the SVG data.
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');

                // Change the color.
                //svgDoc.querySelector('svg').setAttribute('stroke', color);

                // Get the updated SVG string.
                const serializer = new XMLSerializer();
                let svgString = serializer.serializeToString(svgDoc.documentElement);        
                svgString = replaceAll(svgString, "currentColor", color);  

                // Create a data URI.
                const dataUri = 'data:image/svg+xml,' + encodeURIComponent(svgString);
                callback(dataUri);
            });
        };



        var getReplacementImage = function(replacementType, callback){
            if(replacementType == 'icon'){
                if(IMAGE_REPLACING_ICON == '' || IMAGE_REPLACING_ICON == null){
                    alert("Please select an icon");
                }
                let resp = [];
                resp['success'] = 'true';                
                let color = "blue";
                color = $('#minicolor_icon').val();
                let replaceUrl = 'https://cdn.jsdelivr.net/gh/mrieck/tablericons2/svg/' + IMAGE_REPLACING_ICON + '.svg';
                
                
                if(!color || color.length <= 3){
                    color = '#000000';
                }
                
                if(color == '#000000'){
                    console.log("IMAGE REPLACE URL " + IMAGE_REPLACING_ICON);
                    //alert("replacing with url: " + replaceUrl);
                    //no different color
                    console.log("NO DIFF COLOR");
                    console.log(replaceUrl);
                    let allImages = new Array();
                    let anImage = {
                        resize_url: replaceUrl
                    };
                    allImages.push(anImage);
                    resp['images'] = allImages;
                    callback(resp);                                        
                }else{
                    //alert("replacing color: " + color);
                    console.log("GETTING SVG REPLACE URL " + IMAGE_REPLACING_ICON);
                    getSVGDataUri(replaceUrl, color, function(dataUri){
                        // Use the dataUri in your CSS here.
                        console.log("DATAURI");
                        console.log(dataUri);
                        let allImages = new Array();
                        let anImage = {
                            resize_url: dataUri
                        };
                        allImages.push(anImage);
                        resp['images'] = allImages;
                        callback(resp);                    
                    });                                
                }
            }else if(replacementType == 'genimage'){
                API.replaceImagesWithAI(IMG_REPLACE_ARR, OPTIONS.API_KEY, function(resp){            
                    callback(resp);
                });
            }
            else if(replacementType == 'url'){
                let resp = [];
                resp['success'] = 'true';
                let allImages = new Array();
                let anImage = {
                    resize_url: IMG_REPLACE_ARR[0]['prompt']
                };
                allImages.push(anImage);
                resp['images'] = allImages;
                callback(resp);
            }            
        };
        
        $('#snipcss_replacesingle_generate').on('click',  function(){            
            let replaceType = 'genimage';
            let thePrompt = $('#replacesingle_prompt').val();
            if($('#replace_image_promptcontainer').css('display') == 'none'){
                if($('#replace_image_urlcontainer').css('display') == 'none'){                
                    thePrompt = "Tabler Icon";
                    replaceType = 'icon';
                } else {
                    thePrompt = $('#replacesingle_url').val();
                    replaceType = 'url';
                }
            }            
            if(thePrompt.trim().length <= 2){
                alert("Please enter a valid prompt or URL.");
                return;
            }
            if(OPTIONS.IS_GENERATING_IMAGE){
                return;
            }
            OPTIONS.IS_GENERATING_IMAGE = true;

            $('#snipcss_replacesingle_generate').append('&nbsp;<i class="fas fa-spinner fa-spin"></i>');

            IMG_REPLACE_ARR[0]['prompt'] = thePrompt;
            IMG_REPLACE_ARR[0]['theme'] = "custom";  //custom, random, or actual theme
            IMG_REPLACE_ARR[0]['uid'] = generateUID();
            //was this before added icon option
            //API.replaceImagesWithAI(IMG_REPLACE_ARR, OPTIONS.API_KEY, function(resp){
            
            getReplacementImage(replaceType, function(resp){
                //console.log("response");
                //
                //console.log(resp);
                if(resp['success'] == 'false'){
                    alert(resp['msg']);           
                    OPTIONS.IS_GENERATING_IMAGE = false;
                    MicroModal.close('modal-singleimage-replace');
                    return;
                }
                let oldCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
                let oldHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
                let oldZipHtml = SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'];
                
                let newHtml = oldHtml;
                let zipHtml = SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'];
                let newCss = oldCss;
                                 
                let allImages = resp['images'];
                if(replaceType == 'icon'){
                    switchReplaceType("icon");
                }else{
                    $('#minicolor_icon').val('#0000000');
                }
                
                let replaceArr = new Array();
                for(let a = 0; a < allImages.length; a++){
                    let resizeUrl = allImages[a]['resize_url'];
                    let origUrl = IMG_REPLACE_ARR[a]['origurl'];
                    
                    console.log("old html" );
                    console.log(oldHtml);

                    let getVars = "";
                    if(origUrl.split('?').length > 1){                        
                        getVars = origUrl.split('?')[1];
                        origUrl = origUrl.split('?')[0];   
                        
                        getVars = "?" + getVars;
                        newHtml = replaceAll(newHtml, getVars, "");  
                        zipHtml = replaceAll(zipHtml, getVars, "");
                        newCss = replaceAll(newCss, getVars, "");                        
                    }
                    console.log("replacing");
                    console.log(origUrl);
                    console.log(resizeUrl);                    
                    newHtml = replaceAll(newHtml, origUrl, resizeUrl);  
                    //original url is already replaced in the zip file with ./images/xxxwhatever.test
                    let sArr = origUrl.split("\/");
                    let origFilename = sArr[sArr.length - 1];                 
                    let fArr = resizeUrl.split("\/");
                    let resizeFilename = fArr[fArr.length - 1];           
                                   
                    zipHtml = replaceAll(zipHtml, origUrl, resizeUrl);                   
                    zipHtml = replaceAll(zipHtml, origFilename, resizeFilename);                  
                    newCss = replaceAll(newCss, origUrl, resizeUrl);            
                  
                    
                    $('#singlereplace_current').attr('src', resizeUrl);
                    
                    let imgType = IMG_REPLACE_ARR[a]['imgtype'];
                    let imgIndex = parseInt(IMG_REPLACE_ARR[a]['imgindex']);                    
                    
                    if(imgType == 'html'){
                         //console.log("replacing html image: " );
                         let existingImages = SNIPCSS.SELECTED_SNIPPET['snip_himages'];     
                         existingImages[imgIndex] = resizeUrl;
                         SNIPCSS.SELECTED_SNIPPET['snip_himages'] = existingImages;
                    }else if(imgType == 'css'){
                        
                        //let cssImageUrl = existingImages[imgIndex]['url'];
                        //let cssImageName = existingImages[imgIndex]['name'];   
                        
                        let existingImages = SNIPCSS.SELECTED_SNIPPET['snip_cimages'];     
                        let sArr = resizeUrl.split("\/");
                        let theFilename = sArr[sArr.length - 1];      
                        let newFilename = theFilename.replace(/[/\\?%*=:|"<>]/g, '-');                          
                        let newCssImage = {
                            'url': resizeUrl,
                            'name': newFilename
                        };
                        existingImages[imgIndex] = newCssImage;
                        
                        SNIPCSS.SELECTED_SNIPPET['snip_cimages'] = existingImages;                        
                    }
                    SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'] = zipHtml;
                }
                $('#snipcss_replacesingle_generate').html('Replacing...');                
                
                //var htmlImages = snippet['snip_himages'];
                //var cssImages = snippet['snip_cimages'];                
                loadImagePanel(SNIPCSS.SELECTED_SNIPPET);
                //console.log("old ziphtml");
                //console.log(oldZipHtml);
                //console.log("new zip html");
                //console.log(SNIPCSS.SELECTED_SNIPPET['snip_ziphtml']);
                
                SNIPCSS.HTML_EDITOR.getDoc().setValue(newHtml);
                SNIPCSS.CSS_EDITOR.getDoc().setValue(newCss);  
                setTimeout(function(){
                    SNIPCSS.EDITOR_SAVEBOTH = true;
                    $('#save-css').trigger('click');    
                    MicroModal.close('modal-singleimage-replace');

                    
                }, 1000);              
                refreshCreditsLeft(resp);
                OPTIONS.IS_GENERATING_IMAGE = false;
            });
        });   
        
        $('#snipcss_replacesvg_replace').on('click', function(){
            //var SVG_IN_HTML = new Array();
            //var SVG_REPLACING_INDEX = -1;
            //var SVG_REPLACING_ICON = "";            
            /*            
            let svgObject = {
                "element": this,
                "type": "expanded",
                "name": svgName,
                "html": theHtml,
                "replaced": false
            };             
             */
            if(SVG_REPLACING_ICON == ""){
                alert("Please Select an Icon");
                return;
            }
            if(OPTIONS.IS_GENERATING_SVG){
                return;
            }
            OPTIONS.IS_GENERATING_SVG = true;
            
            let svgObject = SVG_IN_HTML[SVG_REPLACING_INDEX];
            
            //SVG_REPLACE_INDEX
            SVG_IN_HTML[SVG_REPLACING_INDEX]['replaced'] = true;
            let oldCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
            let oldHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
            
            let newHtml = oldHtml;
            let zipHtml = SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'];
            let newCss = oldCss;
            
            let needsImport = false;
            if(oldCss.indexOf('tabler-icons.min.css') === -1){
                needsImport = true;
                newCss = '@import url("https://cdn.jsdelivr.net/gh/mrieck/tablericons2/tabler-icons.min.css");' + '\n' + newCss;
                console.log("needed import");
            }            

            let origSvg = svgObject['html'];
            let newSvg = '<i class="ti ti-' + SVG_REPLACING_ICON + '"></i>';
            
            console.log("orig svg");
            console.log(origSvg);
            console.log("new svg");
            console.log(newSvg);
            console.log("old html");
            console.log(oldHtml);
            
            newHtml = replaceAll(newHtml, origSvg, newSvg);  
            zipHtml = replaceAll(zipHtml, origSvg, newSvg);  
            
            console.log("new html");
            console.log(newHtml);
            
            
            
            //newCss = replaceAll(newCss, origUrl, resizeUrl);                   

            $('#snipcss_replacesvg_replace').html('Replacing...');                

            //var htmlImages = snippet['snip_himages'];
            //var cssImages = snippet['snip_cimages'];                
            

            SNIPCSS.HTML_EDITOR.getDoc().setValue(newHtml);
            if(needsImport){
                SNIPCSS.CSS_EDITOR.getDoc().setValue(newCss);  
            }
            
            setTimeout(function(){
                SNIPCSS.EDITOR_SAVEBOTH = true;
                $('#save-css').trigger('click');    
                MicroModal.close('modal-singlesvg-replace');   
                
                $('.search_icons').val("");
                setTimeout(function(){
                    loadImagePanel(SNIPCSS.SELECTED_SNIPPET);
                }, 500);
                OPTIONS.IS_GENERATING_SVG = false;
            }, 100);                       
           
            //refreshCreditsLeft();
        });
        
        $('#snipcss_replacefont_replace').on('click', function(e){    
            if(FONT_REPLACING_GOOGLENAME == ""){
                alert("Please Select a font");
                return;
            }
            
            let originalFontObj = SNIPCSS.SELECTED_SNIPPET['snip_usedfonts'][FONT_REPLACING_INDEX];    
            let newFont = FONT_REPLACING_GOOGLENAME;
            let googleImportUrl = GOOGLE_FONTS_IMPORT_ARR[newFont];
            //console.log("original font object: " );
            //console.log(originalFontObj);
            //console.log("new font: " );
            //console.log(newFont);
            
            let faceQuotes = '"' + newFont + '"';
            let newfontObject = {
                face: faceQuotes,
                face_noquotes: newFont,
                props: [],
                stylesheet_id: "replace",
                stylesheet_url: "replace",
                used: true
            };
            
            let oldCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
            //let oldHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
            
            //let newHtml = oldHtml;
            //let zipHtml = SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'];        
            //console.log("old css: " );
            //console.log(oldCss);
            let newCss = removeFontFace(originalFontObj['face_noquotes'], oldCss).trimStart();
            newCss = removeFontImport(originalFontObj['face_noquotes'], newCss).trimStart();
            //console.log("newcss");
            //console.log(newCss);        
            //this will need to be better
            let originalSingleQuote = "'" + originalFontObj['face_noquotes'] + "'";
            let originalDoubleQuote = '"' + originalFontObj['face_noquotes'] + '"';
            let originalNoQuote = originalFontObj['face_noquotes'];
            
            let newFontQuotes = "'" + newFont + "'";
            
            newCss = replaceAll(newCss, originalSingleQuote, newFontQuotes);
            newCss = replaceAll(newCss, originalDoubleQuote, newFontQuotes);
            newCss = replaceAll(newCss, originalNoQuote, newFontQuotes);            
                        
            if(oldCss.indexOf(googleImportUrl) === -1){
                //add the import
                newCss = googleImportUrl + '\n' + newCss;
                console.log("did google font import");
            }           
            //update snip_usedfonts so it's no longer on the list
            FONT_NEW_FONTUSED = true;
            FONT_NEW_FONTUSEDARR = new Array();
            for(let f = 0; f < SNIPCSS.SELECTED_SNIPPET['snip_usedfonts'].length; f++){
                let aFontFace = SNIPCSS.SELECTED_SNIPPET['snip_usedfonts'][f];
                
                console.log("a used font face");
                console.log(aFontFace);
                if(aFontFace['face_noquotes'] == originalFontObj['face_noquotes']){
                    continue;
                }
                FONT_NEW_FONTUSEDARR.push(aFontFace);
            }            
            
            FONT_NEW_FONTUSEDARR.push(newfontObject);
                        
            SNIPCSS.CSS_EDITOR.getDoc().setValue(newCss);  
            setTimeout(function(){
                $('#save-css').trigger('click');    
                MicroModal.close('modal-singlefont-replace');    
                setTimeout(function(){
                    loadImagePanel(SNIPCSS.SELECTED_SNIPPET);
                }, 500);
            }, 100);
        });
        
        $('#snipcss_replacefont_cancel').on('click', function(){
            MicroModal.close('modal-singlefont-replace');       
        });          

        $('body').on('mouseover', 'li.imglist-item', function() {
            //console.log("svg in html");
            //console.log(SVG_IN_HTML);            
            //console.log("Hover Over");
            let imageSel = $(this).data('selector');
            //console.log(imageSel);
            document.getElementById('preview_iframe').contentWindow.doInitialize();
            document.getElementById('preview_iframe').contentWindow.highlightPreviewElement(imageSel);             
        }).on('mouseout', 'li.imglist-item', function() {
            //console.log("Hover Out");
            document.getElementById('preview_iframe').contentWindow.doInitialize();
            document.getElementById('preview_iframe').contentWindow.unhighlightPreviewAll();                
        });

        
        
        $('#snipcss_replacesvg_cancel').on('click', function(){
            MicroModal.close('modal-singlesvg-replace');       
        });        
        
        $('#question_svg').on('click', function(){
            MicroModal.show('modal-generativeai-credits');        
        });
        $('#snipcss_ok_credits').on('click', function(){
            MicroModal.close('modal-generativeai-credits');        
        });        
        

        $('#multiple_resolutions,#unused_css,#replace_classes,#unused_attributes,#reload_resolutions,#scope_generics').on('click', function(){
            if(!OPTIONS.PRO_USER){
                MicroModal.show('modal-pro-feature');
            }
            else{
                if(OPTIONS.USE_TAILWIND){
                    if(this.id == 'replace_classes' || this.id == 'scope_generics'){
                        alert("Scoping features need to be disabled for Tailwind extraction to work");
                    }
                }
            }
        });
        
        
        $('#set_scope_prefix').on('click', function(){
            var scopePrefix = $('#scope_prefix').val();
            scopePrefix = makePermalink(scopePrefix);
            if(typeof scopePrefix === 'string' || scopePrefix instanceof String){
                let opArr = new Array();
                opArr['scope_prefix'] = scopePrefix;                
                setOptionStorage(opArr, function(){
                    console.log("done setting new type of options"); 
                });                  
                OPTIONS.SCOPE_PREFIX = scopePrefix;
                $('#prefixtext').html(scopePrefix);
            }else{
                alert("Bad value as the prefix.  Please enter valid text");
            }
        });    

        $('#set_global_prefix').on('click', function(){
            var globalPrefix = $('#global_prefix').val();
            globalPrefix = makePermalink(globalPrefix);
            if(typeof globalPrefix === 'string' || globalPrefix instanceof String){
                let opArr = new Array();
                opArr['global_prefix'] = globalPrefix;                
                setOptionStorage(opArr, function(){
                    console.log("done setting global prefix"); 
                });                  
                OPTIONS.GLOBAL_PREFIX = globalPrefix;
               
            }else{
                alert("Bad value as the prefix.  Please enter valid text");
            }
        });
        
        $('#scope_type').on('change', function(){
            let scopeType = $(this).val();
            if(scopeType == 'class' || scopeType == 'attribute'){
                OPTIONS.SCOPE_TYPE = scopeType;
                let opArr = new Array();
                opArr['scope_type'] = scopeType;                
                setOptionStorage(opArr, function(){
                    console.log("done setting new type of options"); 
                });                  
            }
        });
        
        
        $('#feedback_form').on('submit', async function(e) {
            e.preventDefault(); // Prevent the default form submission

            // Collect form data
            let feedbackName = $('#feedback_name').val();
            let feedbackEmail = $('#feedback_email').val();
            let feedbackType = $('#feedback_type').val();
            let feedbackMessage = $('#feedback_message').val();
            let feedbackSnippet = $('#feedback_snippet_dropdown').val();
            let feedbackWebsite = '';
            let feedbackSelector = '';
            
            if(feedbackSnippet == 'none'){
                //do not send snippet
            }else{
                let theSnippet = await aysncGetSnippetByUID(feedbackSnippet);
                console.log("have feedback snippet: " );
                console.log(theSnippet);                
                feedbackSelector = theSnippet['snip_selector'];
                feedbackWebsite = theSnippet['snip_url'];
            }        

            // Check if required fields are filled
            let errorFields = new Array();
            if (!feedbackName || feedbackName.length < 1) {
                errorFields.push('Name');

            }
            if(!feedbackType || feedbackType.length < 1){
                errorFields.push('Feedback Type');                
            }
            if(!feedbackMessage || feedbackMessage.length < 5){
                errorFields.push('Message');       
            }
            
            if(errorFields.length > 0){
                alert('Please fill in the fields: ' + errorFields.join(","));
                $('.form-error').css('display', 'block');                
                return;                
            }
            $('.form-error').css('display', 'none');       
            
            // Prepare data object to send
            var feedbackData = {
                name: feedbackName,
                email: feedbackEmail,
                type: feedbackType,
                message: feedbackMessage,
                snippet_selector: feedbackSelector,
                snippet_website: feedbackWebsite
            };

            // Call the API function to send the data
            API.sendFeedbackData(feedbackData, function(response) {
                if (response['success'] == 'true') {
                    toastr.success('Success', 'Feedback received');
                    let successMessage = "Thank you for your feedback.  I'm constantly trying to improve SnipCSS and your feedback helps!";
                    $('#feedback_container').html('<h2 class="feedback-success">' + successMessage + '</h2>');
                }else {
                    alert('There was an error sending feedback. Please try again later.');
                }
            });
        });        
        /*
        $('#test_button').on('click', function(){
            alert("click");
            console.log("testing the detect copyright problems");
            if(SNIPCSS.SELECTED_SNIPPET == null){
                alert("select one");
                return;
            }
            let snipUrl = SNIPCSS.SELECTED_SNIPPET['snip_url'];
            let snipHtml = SNIPCSS.SELECTED_SNIPPET['snip_html'];
            let snipCSS = SNIPCSS.SELECTED_SNIPPET['snip_css'];
            
            console.log(SNIPCSS.SELECTED_SNIPPET);
            
            TEMPLATES.detectCopyrightProblems(snipHtml, snipCSS, snipUrl);
                        
        });
        */
});
    
    function testTemplates(){
        //$('#newtemplate_snippet').val(0);
        console.log("testing temmplates");
        
        setTimeout(function(){
            $('#snipcss_template_dropdown').val(4).trigger('change');
            
        }, 200);
        
    }
    
    function packageZipFile(snippet){
        var htmlImages = snippet['snip_himages'];
        var cssImages = snippet['snip_cimages'];
        var fontUrls = snippet['snip_fonturls'];
        var cssLines = snippet['snip_css'];
        var hasSomeImages = false;
        var hasSomeFonts = false;
        var elementOuterHtml = snippet['snip_ziphtml'];   
        let extraZipCSS = "";
        if(!elementOuterHtml){
            elementOuterHtml = snippet['snip_html'];                
        }        
        if('snip_zipextracss' in snippet){
            extraZipCSS = snippet['snip_zipextracss'];
            console.log("adding extra zip css");
            console.log(extraZipCSS);
            cssLines += extraZipCSS;
        }
        
        //beautifier beautify html
        elementOuterHtml = html_beautify(elementOuterHtml, {
                indent_size: 4,
                space_in_empty_paren: true,
                preserve_newlines: false,
                indent_inner_html: true,
                indent_empty_lines: false,
                extra_liners: [],
                wrap_line_length: 0
              });
        elementOuterHtml += '\n';
        console.log("html images");
        console.log(htmlImages);
        console.log("css images");
        console.log(cssImages);
        console.log("font urls");
        console.log(fontUrls);
        
        let extUrl = chrome.runtime.getURL("/");
        /*
        let rewriteUserAgentHeader = e => {
          // console.log(e)
          let initiator = e.initiator || e.originUrl
          if (e.tabId === -1 && initiator && extUrl && (initiator + "/").startsWith(extUrl)) {
            let hdrs = [], ua = null
            for (var header of e.requestHeaders) {
              let name = header.name.toLowerCase();
              if (name === "x-fc-user-agent") {
                ua = header
              } else if (name !== "user-agent") {
                hdrs.push(header);
              }
            }

            if (ua !== null) {
              hdrs.push({name: 'User-Agent', value: ua.value})
              return {requestHeaders: hdrs}
            }
          }
          return {requestHeaders: e.requestHeaders}
        };

        chrome.webRequest.onBeforeSendHeaders.addListener(rewriteUserAgentHeader,
          {urls: ["<all_urls>"], types: ["xmlhttprequest"]}, ["blocking", "requestHeaders"]);

        let headersRecvFn = e => {
          let initiator = e.initiator || e.originUrl
          let headers = e.responseHeaders
          if (e.tabId === -1 && initiator && extUrl && (initiator + "/").startsWith(extUrl)) {
            for (let i = headers.length - 1; i >= 0; --i) {
              let header = headers[i].name.toLowerCase()
              if (header == 'x-frame-options' || header == 'frame-options' || header == 'content-security-policy') {
                headers.splice(i, 1)
              }
            }
          }
          return {responseHeaders: headers};
        }
        chrome.webRequest.onHeadersReceived.addListener(headersRecvFn,
          {urls: ["<all_urls>"]}, ["blocking", "responseHeaders", "extraHeaders"]);        

        chrome.webRequest.onCompleted.addListener(async e => {
          let headers = e.responseHeaders
          if (e.tabId === -1 && e.parentFrameId === 0) {
            this.onRender(e.url)
          }
        }, {urls: ["<all_urls>"], types: ["xmlhttprequest"]});     
        */
        var usedImageNames = new Array();
        var usedFontNames = new Array();
        
        var downloadImage = function(theReq, fullUrl, overrideName, isFont){
            //Firebug.Console.log("inside elemsrc");  
            var sArr = fullUrl.split("\/");
            var theFilename = sArr[sArr.length - 1];          
            if(overrideName){
                theFilename = overrideName;
            }
            var dfd = new $.Deferred();    
            fetch(theReq)
                .then((response)=>{
                    if(response.ok){
                        //console.log("ok response?");
                        //console.log(response);         
                        //response.body;
                        return response.blob();
                    }else{
                        //console.log(response);
                        dfd.resolve("");
                        throw new Error('BAD HTTP stuff');
                    }
                })
                .then( (imgBlob) =>{
                    //var imgUrl = URL.createObjectURL(blob);
                    //console.log("resolved " + fullUrl);
                    var aType = 'image';
                    if(isFont){
                        aType = 'font';
                    }
                    var retObj = {blob: imgBlob, filename: theFilename, thetype: aType};
                    dfd.resolve(retObj);
                    //$('#yoursnippets_underline').attr('src', imgUrl);
                })
                .catch( (err) =>{
                    dfd.resolve("");
                    console.log(err);
                });   
            return dfd.promise();
        };       
        
        var imagePromises = new Array();
        for(var x = 0; x < htmlImages.length; x++){
            var hImage = htmlImages[x];
            console.log("downloading image");
            console.log(hImage);
            let imgUrl = hImage;
            let sArr = imgUrl.split("\/");
            let theFilename = sArr[sArr.length - 1];     
            let decodedUrl = decodeURIComponent(theFilename);
            let newFilename = decodedUrl.replace(/[\\/:*?"<>|&=#]/g, '-');
            
            if(newFilename.length > 128){
                newFilename = newFilename.substring(0, 128);
            }
            if(newFilename.indexOf('.') < 0){
                if(imgUrl.indexOf('jpg') >= 0){
                    newFilename += ".jpg";
                }
                else if(imgUrl.indexOf('png') >= 0){
                    newFilename += ".png";
                }
                else if(imgUrl.indexOf('webp') >= 0){
                    newFilename += ".webp";
                }                
                else if(imgUrl.indexOf('gif') >= 0){
                    newFilename += ".gif";
                }    
                else if(imgUrl.indexOf('jpeg') >= 0){
                    newFilename += ".jpg";
                }                   
            }
            
            
            console.log("new filename ");
            console.log(newFilename);
            if(theFilename != newFilename){
                var replaceFilename = decodeURIComponent(theFilename);
                console.log("replace filename ");
                console.log(replaceFilename);
                elementOuterHtml = replaceAll(elementOuterHtml, theFilename, newFilename);  
                elementOuterHtml = replaceAll(elementOuterHtml, replaceFilename, newFilename);  
                //why are only amp decoded
                replaceFilename = replaceAll(replaceFilename, '&', '&amp;'); 
                replaceFilename = replaceFilename.replace(/[/\\?%*=:|"<>]/g, '-');  
                //console.log("replacing " + replaceFilename);
                //console.log("with " + newFilename);                
                
                elementOuterHtml = replaceAll(elementOuterHtml, replaceFilename, newFilename);    
                
                //console.log("html after");
                //console.log(elementOuterHtml);
                theFilename = newFilename;
            }
            
            usedImageNames.push(theFilename);            

            let h = new Headers();
            h.append('Accept', 'image/*');

            let req = new Request(imgUrl, {
                method: 'GET',
                headers: h,
                mode: 'cors'
            });
            imagePromises.push(downloadImage(req, imgUrl, theFilename, false));    
            hasSomeImages = true;
        }
        
        for(var y = 0; y < cssImages.length; y++){
            var cImage = cssImages[y];
            console.log("downloading cssimage");
            console.log(cImage);
            let imgUrl = cImage['url'];
            let imgName = cImage['name'];
            imgName = imgName.replace(/[/\\?%*=:|"<>]/g, '-');  
            
            if($.inArray(imgName, usedImageNames) !== -1){
                imgName = generateRandomLetters(3) + imgName;
            }
            
            var localPath = './images/' + imgName;
            cssLines = replaceAll(cssLines, imgUrl, localPath);

            let h = new Headers();
            h.append('Accept', 'image/*');

            let req = new Request(imgUrl, {
                method: 'GET',
                headers: h,
                mode: 'cors'
            });
            imagePromises.push(downloadImage(req, imgUrl, imgName, false));  
            hasSomeImages = true;            
        }        
        
        var usedFontUrls = new Array();
        for(var z = 0; z < fontUrls.length; z++){
            let fontUrl = fontUrls[z];

            if($.inArray(fontUrl, usedFontUrls) !== -1){
                continue;
            }
            let sArr = fontUrl.split("\/");
            let theFilename = sArr[sArr.length - 1];      
            let newFilename = theFilename.replace(/[/\\?%*=:|"<>]/g, '-');  
            if(theFilename != newFilename){
                var replaceFilename = decodeURIComponent(theFilename);
                elementOuterHtml = replaceAll(elementOuterHtml, replaceFilename, newFilename);  
                //why are only amp decoded????
                replaceFilename = replaceAll(replaceFilename, '&', '&amp;'); 
                //console.log("replacing " + replaceFilename);
                //console.log("with " + newFilename);                
                
                elementOuterHtml = replaceAll(elementOuterHtml, replaceFilename, newFilename);    
                
                //console.log("html after");
                //console.log(elementOuterHtml);
                theFilename = newFilename;
            }
            usedFontNames.push(theFilename);
            
            var localPath = './fonts/' + theFilename;
            cssLines = replaceAll(cssLines, fontUrl, localPath);            

            let h = new Headers();
            h.append('Accept', 'font/*');

            let req = new Request(fontUrl, {
                method: 'GET',
                headers: h,
                mode: 'cors'
            });
            imagePromises.push(downloadImage(req, fontUrl, theFilename, true));   
            usedFontUrls.push(fontUrl);
            hasSomeFonts = true;
            
        }
        
        Promise.all(imagePromises).then(theBlobs => { 
            elementOuterHtml = replaceAll(elementOuterHtml, 'SNIPPATH_TO_IMAGES_', SNIP_PATH_TO_IMAGES);
            console.log("element outer html: ");
            console.log(elementOuterHtml);
            
            var zipHtml = '<!DOCTYPE html>\n';                    
            zipHtml += '<html>\n';
            zipHtml += '   <head>\n';
            zipHtml += '      <meta charset="utf-8">\n'; 
            zipHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';
            zipHtml += '      <link rel="stylesheet" href="./snipped.css">\n';            
            zipHtml += '   </head>\n';
            zipHtml += '   <body>\n';
            zipHtml += elementOuterHtml;
            zipHtml += '   </body>\n';
            zipHtml += '</html>\n';            
            
            
            console.log(theBlobs);
            var zip = new JSZip();
            //var copyrightNotice = "Copyright Notice: All text, images and fonts downloaded by the SnipCSS extension belong to their respective owners.  Copyright Disclaimer under section 107 of the Copyright Act of 1976, allowance is made for fair use for purposes such as criticism, comment, " + 
            //        "education and research.  Please do not infringe on other websites copyright by reusing images or fonts that you do not own.\n\n";
            zip.file("index.html", zipHtml);
            zip.file("snipped.css", cssLines);
            var images = zip.folder("images");
            var fontfolder = zip.folder("fonts");
            
            for(var b = 0; b < theBlobs.length; b++){
                var aBlob = theBlobs[b];
                if(aBlob === ""){
                    continue;
                }
                if(aBlob['thetype'] == 'image'){
                    if(aBlob['filename'].startsWith('svg+xml;base64')){
                        console.log("skipping svg that is a filename");
                        continue;
                    }
                    console.log("a filename: ");
                    console.log(aBlob['filename']);
                    console.log(aBlob['blob']);
                    images.file(aBlob['filename'], aBlob['blob']);
                }
                else if(aBlob['thetype'] == 'font'){
                    fontfolder.file(aBlob['filename'], aBlob['blob']);                    
                }
            }
            
            var theDateString = "";
            if(snippet['create_date']){
                theDateString = "-" + getDateString(snippet['create_date']);
            }
            
            var zipName = snippet['snip_name'].split(".")[0] + "-snippet" + theDateString + ".zip";
            zip.generateAsync({type:"blob"}).then(function (blob) { // 1) generate the zip file
                saveAs(blob, zipName);                          // 2) trigger the download
            }, function (err) {

            });
            
            
        });        
        
        
        
    }
        
function fixupHeaders (options, list) {
  if (options && options.headers) {
    let fix = {};
    for (let k in options.headers) {
      fix[(list.includes(k) ? 'X-FC-' : '') + k] = options.headers[k];
    }
    options.headers = fix;
  }
  return options;
}        
    function getSnippetByIndex(theIndex){
        alert("NOT USED ANYMORE");
        var existingSnips = new Array();
        var savedSnippets = localStorage['snippets'];
        if(savedSnippets)
        {
            existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
            console.log(existingSnips);                
            for(var x = existingSnips.length - 1; x >= 0; x--){
                var snip = existingSnips[x];
                if(theIndex == snip['index']){
                    return snip;
                }
            }                
        }	 
        return null;
    }
    
    async function aysncGetSnippetByUID(theUID) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('snipresult-' + theUID, function (result) {
                let theData = result['snipresult-' + theUID];
                console.log(theData);
                if (theData) {
                    resolve(theData);
                    return;
                } else {
                    var existingSnips = [];
                    var savedSnippets = localStorage['snippets'];
                    if (savedSnippets) {
                        existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
                        console.log(existingSnips);
                        for (var x = existingSnips.length - 1; x >= 0; x--) {
                            var snip = existingSnips[x];
                            if (theUID == snip['uid']) {
                                resolve(snip);
                                return;
                            }
                        }
                    }
                    resolve(null);
                }
            });
        });
    }    
    function getSnippetByUID(theUID, callback){
        
        chrome.storage.local.get('snipresult-' + theUID, function(result) {
            let theData = result['snipresult-' + theUID];
            console.log(theData);
            if(theData){
                //console.log("Found a new storage ONE!");
                //console.log(theData);
                callback(theData);
                return;
            }else{
                var existingSnips = new Array();
                var savedSnippets = localStorage['snippets'];
                if(savedSnippets)
                {
                    existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
                    console.log(existingSnips);                
                    for(var x = existingSnips.length - 1; x >= 0; x--){
                        var snip = existingSnips[x];
                        if(theUID == snip['uid']){
                            callback(snip);
                            return;
                        }
                    }                
                }	                 
                callback(null);                
            }
        });
    }    

    function refreshSnipList(selectedIndex){
        $('#allsnippets_dropdown').empty();
        $('#allsnippets_dropdown').append('<option value=""></option>');
        $('#snipcss_template_dropdown').empty();
        $('#snipcss_template_dropdown').append('<option value=""></option>');
        $('#feedback_snippet_dropdown').empty();
        $('#feedback_snippet_dropdown').append('<option value="none">--- Select Related Snippet (only url and selector sent) ---</option>');        
        
        chrome.storage.local.get(['snippet_indices'], function(result) {            
            let allIndices = new Array();
            if(result['snippet_indices']){
                allIndices = result['snippet_indices'];
                for(let a = 0; a < allIndices.length; a++){
                    let iObj = allIndices[a];
                    let theUID = iObj['uid'];
                    let theName = iObj['snip_name'];
                    let isSelected = "";  
                    if(selectedIndex){
                          if(selectedIndex == theUID){
                              isSelected = " selected='selected'";
                          }
                    }                      

                    $('#allsnippets_dropdown').append('<option value="' + theUID + '"' + isSelected + '>' + theName + '</option>');                    
                    $('#snipcss_template_dropdown').append('<option value="' + theUID + '"' + isSelected + '>' + theName + '</option>');   
                    $('#feedback_snippet_dropdown').append('<option value="' + theUID + '"' + isSelected + '>' + theName + '</option>'); 
                }                
            }
            
            
            
            var existingSnips = new Array();
            var savedSnippets = localStorage['snippets'];
            //old version didn't have uid
            var missingUID = false;
            if(savedSnippets)
            {
                existingSnips = jQuery.makeArray(JSON.parse(savedSnippets));
                console.log(existingSnips);
                var usedIds = new Array();

                for(var x = existingSnips.length - 1; x >= 0; x--){
                    var snip = existingSnips[x];
                    var isSelected = "";
                    if(selectedIndex){
                        if(selectedIndex == snip['index']){
                            isSelected = " selected='selected'";
                        }
                    }
                    if("uid" in existingSnips[x]){

                    }else{
                        existingSnips[x]['uid'] = generateUID();
                        missingUID = true;
                    }

                    if($.inArray(snip['index'], usedIds) >= 0){
                        existingSnips[x]['index'] = 1000;
                        missingUID = true;
                    }

                    usedIds.push(snip['index']);
                    $('#allsnippets_dropdown').append('<option value="' + snip['uid'] + '"' + isSelected + '>' + snip['snip_name'] + '</option>');                    
                    $('#snipcss_template_dropdown').append('<option value="' + snip['uid'] + '"' + isSelected + '>' + snip['snip_name'] + '</option>');
                }                
                if(missingUID){
                    console.log("updated uids, snippets now");
                    localStorage['snippets'] = JSON.stringify(existingSnips);
                    console.log(localStorage['snippets']);
                }            
            }            
            
        });

    }
    
    function loadMobileIcons(){

        if($('#mobileicon_container').length <= 0){
            $('#snippet_viewer .gutter-vertical').after('<div id="mobileicon_container"><div id="mobileicon_absolute">' + 
                    '<a id="mobileicon_desktop" href="#"><i class="fas fa-desktop"></i></a>' +                       
                    '<a id="mobileicon_tablet" href="#"><i class="fas fa-tablet"></i></a>' + 
                    '<a id="mobileicon_mobile" href="#"><i class="fas fa-mobile"></i></a>' +       
                    '<a id="mobileicon_custom" href="#"><i class="fas fa-ellipsis-h"></i></a>' +                           
                    '</div></div>');
        }        
    }
        
    function loadColorSwatches(cssLines){
        //var cssLines = snippet['snip_css'];
        SNIPCSS.COLOR_MAPPING = new Array();
        var parser = new cssjs();
        var parsedCssNew = parser.parseCSS(cssLines);         
        
        //console.log("css lines");
        for(var v = 0; v < parsedCssNew.length; v++){
            //console.log("testing type");
            //console.log(parsedCssNew[v]);        
            var parsedLine = parsedCssNew[v];
            if("rules" in parsedLine){
                for(var r = 0; r < parsedLine['rules'].length; r++){
                    //console.log("a rule");
                    var aRule = parsedLine['rules'][r];
                    //console.log(aRule);
                    var directive = aRule['directive'];
                    var ruleVal = aRule['value'];
                    //who cares about allowed?
                    
                    //no font, no font-coloor... what is with this list????
                    /*
                    var allowedDirectives = ['background-color', 'background', 'border', 'border-bottom-color', 'border-color', 'border-left-color',
                        'border-right-color', 'border-top-color', 'box-shadow', 'caret-color', 'color', 'column-rule', 'column-rule-color',
                        'filter','opacity','outline-color','outline','text-decoration','text-decoration-color','text-shadow'];                    
                    if($.inArray(directive, allowedDirectives) >= 0){
                    }
                    */
                    //console.log("testing directive for colors " + directive);
                    ruleVal = ruleVal.replace('!important', '');
                    var extractedColors = extractColorsWithRegex(ruleVal);
                    if(extractedColors.length > 0){
                        for(let e = 0; e < extractedColors.length; e++){
                            var eColor = extractedColors[e];
                            if(eColor in SNIPCSS.COLOR_MAPPING){
                                
                            }else{
                                if(directive.substr(0, 2) == "--"){
                                    //this is a variable definition
                                    //we need to see if it's in some ruleVal as "var(--varname)"
                                    //if it's not then it shouln't be added should it
                                }else{
                                    var rgbColor = getRGBColor(eColor);
                                    if(rgbColor.toLowerCase() == 'tan'){
                                        console.log("skipping tan");
                                        continue;
                                    }
                                    //console.log("rgb color: ");
                                    //console.log(rgbColor);
                                    SNIPCSS.COLOR_MAPPING[eColor] = rgbColor;                                    
                                }
                            }
                        }
                        
                        
                    }
                            //SNIPCSS.COLOR_MAPPING
                    
                }
                
            }            
        }
        //console.log("After parsing all css lines, the colors are: ");
        //console.log(SNIPCSS.COLOR_MAPPING);
        
        if($('#swatch_container').length <= 0){
            $('#snippet_viewer .gutter-vertical').after('<div id="swatch_container" style="position:relative;width:100%;height:1px;"><div id="swatch_absolute" style="position:absolute;right:0px;top:-32px;"></div></div>');
        }
        setTimeout(function(){
            var k = 0;
            $('#swatch_absolute').empty();
            
            let editButtonHtml = '<div class="editbutoncontainer">' + 
                '<div style="" class="editbadge">' + 
                    'Edit' + 
                '</div>' + 
            '</div>';          
            $('#swatch_absolute').append(editButtonHtml); 
            
            //more than 10 hide the rest show see all?
            for(var aKey in SNIPCSS.COLOR_MAPPING){
                var colorVal = SNIPCSS.COLOR_MAPPING[aKey];
                var inputHtml = '<input type="hidden" class="swatch" id="minicolor_' + k + '" value="' + colorVal + '" data-original="' + aKey + '" />';            
                if(k > 14){
                    if(k == 15){
                        $('#swatch_absolute').append('<a href="javascript:void(0);" id="load_more_swatches">Load More...</a>');
                    }
                    inputHtml = '<input type="hidden" class="hiddenswatch" id="minicolor_' + k + '" value="' + colorVal + '" data-original="' + aKey + '" />';            
                    $('#swatch_absolute').append(inputHtml);                    
                }
                else{
                    $('#swatch_absolute').append(inputHtml);
                }
                k++;
            }
            //var saveColors = '<a class="badge savebadge" id="save-colors"> Save</a>' + 
            
            setTimeout(function(){
                $('.swatch').each(function(){
                    var me = this;
                    $(this).minicolors({
                        opacity: true,
                        change: function(value, opacity) {
                            
                            //console.log("id " + me.id);
                            //console.log("color change value " + value + " opacity " + opacity);
                            
                            var newValue = "";
                            if(opacity >= 1.0){
                                newValue = value;
                            }
                            else{
                                //convert to rgba 
                                var rgbData = hexToRgb(value);                                
                                newValue = "rgba(" + rgbData['red'] + "," + rgbData['green'] + "," + rgbData['blue'] + "," + opacity.toString() + ")";
                            }           
                            var originalValue = $(me).data('original');
                            //console.log("originalvalue " + originalValue);
                            SNIPCSS.COLOR_MAPPING[originalValue] = newValue;
                            $(me).data('original', newValue);
                            SNIPCSS.COLOR_CHANGED = true;
                            /*
                            var theIndex = me.id.split('_')[1];
                            var m = 0;
                            for(var aKey in SNIPCSS.COLOR_MAPPING){
                                if(m == theIndex){
                                    console.log("changing value of input");
                                    console.log(me);
                                    console.log("to ");
                                    console.log(newValue);
                                    SNIPCSS.COLOR_MAPPING[aKey] = newValue;
                                    
                                }
                                m++;
                            }
                            */
                           
                            var currIframe = SNIPCSS.SELECTED_SNIPPET['snip_iframe'];
                            //console.log("iframe before");
                            //console.log(currIframe);
                            var oldCss = SNIPCSS.CSS_EDITOR.getDoc().getValue();
                            console.log("old css");
                            console.log(oldCss);
                            var newCss = oldCss;
                            var allColorVals = new Array();
                            for(var mapKey in SNIPCSS.COLOR_MAPPING){
                                currIframe = replaceAll(currIframe, mapKey, SNIPCSS.COLOR_MAPPING[mapKey]);
                                newCss = replaceAll(newCss, mapKey, SNIPCSS.COLOR_MAPPING[mapKey]);
                                allColorVals.push(SNIPCSS.COLOR_MAPPING[mapKey]);
                            }
                            SNIPCSS.CSS_EDITOR.getDoc().setValue(newCss);  
                            SNIPCSS.SELECTED_SNIPPET['snip_iframe'] = currIframe;
                            console.log("new css");
                            console.log(newCss);
                            
                            //reset color mapping to have value for every key
                            for(var m = 0; m < allColorVals.length; m++){
                                var colorVal = allColorVals[m];
                                SNIPCSS.COLOR_MAPPING[colorVal] = colorVal;
                            }
                            
                            console.log("color mapping now");
                            console.log(SNIPCSS.COLOR_MAPPING);
                            
                            //only change once every .5 sec
                            var now = new Date().getTime();
                            var minDate = now - 500;
                            if(SNIPCSS.LASTCOLOR_UPDATE == null || SNIPCSS.LASTCOLOR_UPDATE < minDate){
                                SNIPCSS.LASTCOLOR_UPDATE = now;
                                var anIframe = document.querySelector('#preview_iframe');
                                anIframe.contentDocument.body.innerHTML = '';
                                if(SNIPCSS.CURR_DEVICE_SIZE == 'desktop'){
                                    anIframe.contentDocument.write(SNIPCSS.SELECTED_SNIPPET['snip_iframe']);                    
                                }else{
                                    let noDeviceWidthFrame = replaceAll(SNIPCSS.SELECTED_SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
                                    anIframe.contentDocument.write(noDeviceWidthFrame);
                                }                                                                 
                                SNIPCSS.CHANGING_COLOR = false;                                
                            }
                            
                         },
                         show: function(){
                             if(SNIPCSS.CSS_CHANGED){
                                 //save before any color edits
                                 $('#save-css').trigger('click');
                             }
                             //console.log("setting no drag");
                             //$('.gutter-vertical').css('pointer-events', 'none');
                         },
                         hide : function(){
                             
                         }

                    });
                });            
            }, 50);
            
        }, 50);
        
        
        
    }
        
    function loadImagePanel(snippet){
        $('#images_container').empty();
        $('#images_container').append('<ul id="images_container_list" class="list-group"></ul>');
        var allItemHtml = "";
        SVG_IN_HTML = new Array();
        SVG_REPLACING_INDEX = -1;       
        SVG_REPLACING_ICON = "";
        
        if(snippet['snip_cimages'].length > 0){      
            var cssImages = snippet['snip_cimages'];
            //console.log("cssImages");
            //console.log(cssImages);
            for(var c = 0; c < cssImages.length; c++){
                var fullUrl = cssImages[c]['url'];
                var imgName = cssImages[c]['name'];
                if(fullUrl == ""){
                    continue;
                }                
                /*
                var imgNameArr = fullUrl.split('/');
                var imgName = imgNameArr[imgNameArr.length - 1];
                */
               
                var itemHtml = '<li class="imglist-item list-group-item d-flex justify-content-between align-items-center">' + 
                                '<div><a class="imglist-link" target="_blank" href="' + fullUrl + '">' +
                                    imgName +
                               '</a></div>' +
                               '<a data-imgindex="' + c + '" data-imgtype="css" style="margin-left:20px;" class="badge badge-pill badge-danger cssimgreplace" target="_blank" href="javascript:void(0);">Replace</a>' + 
                               '<span class="badge badge-primary badge-pill">CSS</span>' + 
                               '</li>';
                allItemHtml += itemHtml;
            }        
        }
        if(snippet['snip_himages'].length > 0){            
            var htmlImages = snippet['snip_himages'];     
            //console.log("htmlImages");
            //console.log(htmlImages);
            
            for(var h = 0; h < htmlImages.length; h++){
                var fullUrl = htmlImages[h];
                if(fullUrl == ""){
                    continue;
                }
                var imgNameArr = fullUrl.split('/');
                var imgName = imgNameArr[imgNameArr.length - 1];
                
                let theSelector = 'img[src^=&quot;' + fullUrl + '&quot;]';
                var itemHtml = '<li data-selector="' + theSelector + '" class="imglist-item list-group-item d-flex justify-content-between align-items-center">' + 
                                    '<div><a class="imglist-link" target="_blank" href="' + fullUrl + '">' +
                                        imgName +
                                    '</a></div>' + 
                                    '<a data-imgindex="' + h + '" data-imgtype="html" style="margin-left:20px;" class="badge badge-pill badge-danger htmlimgreplace" target="_blank" href="javascript:void(0);">Replace</a>' + 
                                    '<div style="text-align:right;"><span class="badge badge-primary badge-pill">HTML</span></div>' + 
                               '</li>';                       
                allItemHtml += itemHtml;
            }        
        }
        let editorHtml = '';
        if(SNIPCSS.HTML_EDITOR != null){
            editorHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
        }
        
        var theHtml = snippet['snip_html'];  
        if(editorHtml != ''){
            theHtml = editorHtml;
        }
        //console.log("the html");
        //console.log(theHtml);
        
        let svgStrings = new Array();
        $(theHtml).find('svg').each(function() {
              svgStrings.push(this.outerHTML);
        });
        //console.log("svg strings");
        //console.log(svgStrings);
              
        let svgIndex = 1;
        $(theHtml).find('svg').each(function(){
            //console.log("class list");
            //console.log(this.className.baseVal);
            var classList = this.className.baseVal.split(/\s+/);
            
            let svgName = "SVG" + svgIndex;
            for (var j = 0; j < classList.length; j++) {
                var cls = classList[j];
                if(cls.indexOf('tabler') >= 0){
                    return;
                }
                svgName += "-" + cls;
            }       
            let elementHtml = $(this).get(0).outerHTML;
            let alreadyExists = false;
            for(let s = 0; s < SVG_IN_HTML.length; s++){
                let svgExisting = SVG_IN_HTML[s];
                if(elementHtml == svgExisting['html']){
                    alreadyExists = true;
                }
            }
            if(alreadyExists){
                return;
            }
            

            var svgSelector = 'svg';

            // Find the index of the 'svg' element
            let myHtmlIndex = svgStrings.indexOf(theHtml);
            if(myHtmlIndex !== -1){
                let myIndex = myHtmlIndex + 1;
                svgSelector = 'svg:nth-of-type(' + myIndex + ')';                
            }
            
            let svgObject = {
                "element": this,
                "type": "expanded",
                "name": svgName,
                "selector": svgSelector,
                "fonttype":'',                
                "html": elementHtml,
                "replaced": false
            };
            
            let svgindex = SVG_IN_HTML.length;
            SVG_IN_HTML.push(svgObject);
            svgIndex++;            
            var itemHtml = '<li data-selector="' + svgSelector + '" class="imglist-item list-group-item d-flex justify-content-between align-items-center">' + 
                                '<div><a class="imglist-link svglist-link" target="_blank" href="javascript:void(0);">' +
                                    svgName +
                                '</a></div>' + 
                                '<a data-imgindex="' + svgindex + '" data-imgtype="svg" style="margin-left:20px;" class="badge badge-pill badge-danger htmlsvgreplace" target="_blank" href="#">Replace</a>' + 
                                '<div style="text-align:right;"><span class="badge badge-primary badge-pill">SVG IN HTML</span></div>' + 
                           '</li>';
            allItemHtml += itemHtml;            
        });
        
        $(theHtml).find('i').each(function(){            
            var classList = this.className.split(/\s+/);
            let fontType = "";
            let svgName = "SVG" + svgIndex;
            let iSelector = "i";
            for (var j = 0; j < classList.length; j++) {
                var cls = classList[j];

                // Check if the class name indicates it might be an icon font
                // These are some common class prefixes for popular icon libraries
                if (cls.startsWith('fa-')){
                    //font awesome
                    fontType = "fontawesome";
                }
                else if (cls.startsWith('glyphicon-')){
                    //bootstrap
                    fontType = "bootstrap";                    
                }
                else if (cls.startsWith('icon-')){
                    //generic?                    
                    fontType = "generic";                                        
                }
                else if (cls.startsWith('material-icons')){
                    //material
                    fontType = "material";                                                            
                }
                else if (cls.startsWith('ti-')){
                    //my tabler but still allow to replace again
                    fontType = "tabler"; 
                }
                svgName += "-" + cls;
                iSelector += "." + cls;
            }    
            if(fontType == ""){
                return;
            }
            let elementHtml = this.outerHTML;
            let alreadyExists = false;
            for(let s = 0; s < SVG_IN_HTML.length; s++){
                let svgExisting = SVG_IN_HTML[s];
                if(elementHtml == svgExisting['html']){
                    alreadyExists = true;
                }
            }
            if(alreadyExists){
                return;
            }
            
            let svgObject = {
                "element": this,
                "type": "icon",
                "fonttype":fontType,
                "selector": iSelector,
                "name": svgName,
                "html": elementHtml,
                "replaced": false
            };
            
            let svgindex = SVG_IN_HTML.length;
            SVG_IN_HTML.push(svgObject);
            svgIndex++;            
            var itemHtml = '<li data-selector="' + iSelector + '" class="imglist-item list-group-item d-flex justify-content-between align-items-center">' + 
                                '<div><a class="imglist-link svglist-link" target="_blank" href="javascript:void(0);">' +
                                    svgName +
                                '</a></div>' + 
                                '<a data-imgindex="' + svgindex + '" data-imgtype="svg" style="margin-left:20px;" class="badge badge-pill badge-danger htmlsvgreplace" target="_blank" href="#">Replace</a>' + 
                                '<div style="text-align:right;"><span class="badge badge-primary badge-pill">SVG ICON</span></div>' + 
                           '</li>';
            allItemHtml += itemHtml;                           
        });
        
        if('snip_usedfonts' in snippet){
            let fontListArr = new Array();
            for(let f = 0; f < snippet['snip_usedfonts'].length; f++){
                let aFontFace = snippet['snip_usedfonts'][f];
                
                console.log("a used font face");
                console.log(aFontFace);
                if(fontListArr.includes(aFontFace['face_noquotes'])){
                    continue;
                }
                
                
                var itemHtml = '<li class="fontlist-item list-group-item d-flex justify-content-between align-items-center">' + 
                                    '<div><a data-fontindex="' + f + '" class="imglist-link fontlist-link" target="_blank" href="javascript:void(0);">' +
                                        aFontFace['face_noquotes'] +
                                    '</a></div>' + 
                                    '<a data-fontindex="' + f + '" data-fontface="' + aFontFace['face_noquotes'] + '" data-imgtype="font" style="margin-left:20px;" class="badge badge-pill badge-danger fontreplace" target="_blank" href="#">Replace</a>' + 
                                    '<div style="text-align:right;"><span class="badge badge-primary badge-pill">FONT</span></div>' + 
                               '</li>';
                fontListArr.push(aFontFace['face_noquotes']);
                allItemHtml += itemHtml;                
            }
        }
        
        
        setTimeout(function(){
            $('#images_container_list').html(allItemHtml);            
        }, 50);
        
                /*
<ul class="list-group">
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Cras justo odio
    <span class="badge badge-primary badge-pill">14</span>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Dapibus ac facilisis in
    <span class="badge badge-primary badge-pill">2</span>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Morbi leo risus
    <span class="badge badge-primary badge-pill">1</span>
  </li>
</ul>                 
         */        
        
    }

    function refreshCodemirrorHeight(){        
        setTimeout(function(){
            var panelHeight = $('#css_panel').height() - $('#panelheader-html').height();   
            console.log("panel height: " + panelHeight);
            $('#top_panel .CodeMirror').height(panelHeight + "px");
            //$('#preview_panel .CodeMirror').height(panelHeight + "px");     
        }, 10);        
    }
    
    function refreshCreditsLeft(resp){
        try{
            let creditsLeft = parseFloat(resp['credits_left']);   
            let paidUser = parseInt(resp['paid_user']);
            if(paidUser == 1){
                 $('#gopro2').css('display', 'none');
                 $('#nonpro_generative').css('display', 'none');
                 $('#pro_generative').css('display', 'inline');

                 if(creditsLeft > 20.0){
                     $('#chatgpt_tokens').html("Unlimited*"); 
                 }else{
                     $('#chatgpt_tokens').html("May be Rate Limited*");                             
                 }
            }else{
                 $('#chatgpt_tokens').html(creditsLeft); 
            }           
        }catch(exxx){
            console.log("setting credits error");
        }
    }
        
var escapeRegExp = function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

var replaceAll = function(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

var getDateString = function(unixSeconds){
    var startTime = parseInt(unixSeconds);
    var theDate = new Date(startTime);    
    var year = theDate.getFullYear();
    var monthNum = theDate.getMonth();
    var monthDay = theDate.getDate();
    var hour = theDate.getHours();
    var min = theDate.getMinutes();

    var amPm = 'am';
    if(hour > 12){
        hour -= 12;
        amPm = 'pm';
    }
    monthNum++;

    var month_names =["Jan","Feb","Mar",
                      "Apr","May","Jun",
                      "Jul","Aug","Sep",
                      "Oct","Nov","Dec"];            
    var dateString = year + "-" + monthNum + "-" + monthDay; //month_names[monthNum] + monthDay + "-" + hour + min + amPm;    
    
    return dateString;
}

function computeKeySize(keyString){
    var size = unescape(encodeURIComponent(keyString)).length;
    var theSize = [+(size / 1024 / 1024).toFixed(3),'MB'].join(' ');
    
    console.log("snippets size");
    console.log(theSize);
    
    return theSize;
    
}   


function generateRandomLetters(length){
    var letters = "abcdefghijklmnopqrstovwxyzABCDEFGHIJKLMNOPQRSTUVWYXZ1234567890";
    var len = letters.length - 1;
    var retString = "";
    for(var x =0; x < length; x++){
        var rand = Math.floor(Math.random() * len);
        retString = retString + letters.substr(rand, 1);
    }
    return retString;
}

//https://stackoverflow.com/questions/63856249/regex-for-finding-css-colors-in-strings-including-alpha-values
function extractColorsWithRegex(testString){
    var retColors = new Array();
    
    //console.log("test string " + testString);
    let rxHex  = /(?:#)[0-9a-f]{8}|(?:#)[0-9a-f]{6}|(?:#)[0-9a-f]{4}|(?:#)[0-9a-f]{3}/ig;
    var hexMatch = testString.match(rxHex);    
    if(hexMatch != null){
        for(var h = 0; h < hexMatch.length; h++){
            retColors.push(hexMatch[h]);
        }
    }
    //console.log("hexmatch");
    //console.log(hexMatch);
    
    
    let rxRGB = /rgba?\((?:(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%),\s*(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%),\s*(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%)(?:,\s*((?:\d{1,2}|100)%|0(?:\.\d+)?|1))?|(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%)\s+(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%)\s+(25[0-5]|2[0-4]\d|1?\d{1,2}|(?:\d{1,2}|100)%)(?:\s+((?:\d{1,2}|100)%|0(?:\.\d+)?|1))?)\)/ig;
    var rgbMatch = testString.match(rxRGB);    
    if(rgbMatch != null){
        for(var j = 0; j < rgbMatch.length; j++){
            retColors.push(rgbMatch[j]);
        }
    }    
    //console.log("rgbmatch");
    //console.log(rgbMatch);    
    
    let rxHSL = /hsla?\((?:(-?\d+(?:deg|g?rad|turn)?),\s*((?:\d{1,2}|100)%),\s*((?:\d{1,2}|100)%)(?:,\s*((?:\d{1,2}|100)%|0(?:\.\d+)?|1))?|(-?\d+(?:deg|g?rad|turn)?)\s+((?:\d{1,2}|100)%)\s+((?:\d{1,2}|100)%)(?:\s+((?:\d{1,2}|100)%|0(?:\.\d+)?|1))?)\)/ig;
    var hslMatch = testString.match(rxHSL);    
    if(hslMatch != null){
        for(var p = 0; p < hslMatch.length; p++){
            retColors.push(hslMatch[p]);
        }
    }    
    
    //console.log("hslmatch");
    //console.log(hslMatch);
    
    //tan is !imporTANt
    var removedColors = ["Tan"];
    
    var cssColors = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen",
        "DarkOrange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed",
        "Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine",
        "MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink",
        "Plum","PowderBlue","Purple","RebeccaPurple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];
    
    for(var c = 0; c < cssColors.length; c++){
        var lowerColor = cssColors[c].toLowerCase();
        var startIndex = testString.toLowerCase().indexOf(lowerColor);
        if(startIndex >= 0){
            //now extract the string 
            var colorLength = lowerColor.length;
            var extractColor = testString.substr(startIndex, colorLength);
            retColors.push(extractColor);
        }
    }
    
    return retColors;    
    
}

function getRGBColor(cssColor){
    if($('#color_thing').length <= 0){
        $('body').append('<div id="color_thing"></div>');
    }
    //console.log("getting rgb color for: " + cssColor);
    
    $('#color_thing').css('color', cssColor);
    var theDiv = $('#color_thing').get(0);
    var d = document.createElement("div");
    d.style.color = "white";
    d.id="color_thing";
    document.body.appendChild(d);
    //Color in RGB 
    var rgbColorData = window.getComputedStyle(theDiv).color;    
    //console.log(rgbColorData);    
    return rgbColorData;   
}

function hexToRgb(hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    
    return {red: r, green: g, blue: b};
}

function makePermalink(str) {
    return str.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

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

function removeFontFace(fontFamily, cssText) {
    const fontFaceStr = '@font-face';
    let startIdx = cssText.indexOf(fontFaceStr);

    while (startIdx !== -1) {
        let endIdx = cssText.indexOf('}', startIdx) + 1;
        let fontFaceBlock = cssText.substring(startIdx, endIdx);

        if (fontFaceBlock.indexOf(fontFamily) !== -1) {
            cssText = cssText.substring(0, startIdx) + cssText.substring(endIdx);
        }

        startIdx = cssText.indexOf(fontFaceStr, startIdx + 1);
    }

    return cssText;
}

function removeFontImport(fontFamily, cssText) {
    const importStr = "@import";
    let startIdx = cssText.indexOf(importStr);

    while (startIdx !== -1) {
        let endIdx = cssText.indexOf(';', startIdx) + 1;
        let importBlock = cssText.substring(startIdx, endIdx);

        if (importBlock.indexOf(`family=${fontFamily}`) !== -1) {
            cssText = cssText.substring(0, startIdx) + cssText.substring(endIdx);
        }

        startIdx = cssText.indexOf(importStr, startIdx + 1);
    }

    return cssText;
}


// Helper function to get all text nodes in an element
function getTextNodesIn(elem) {
    let textNodes = [];
    if(elem && elem.childNodes){
        for (let node of elem.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                textNodes.push(node);
            }
        }
    }
    return textNodes;
}

function sendToCodepen(theUrl, htmlContent, cssContent, useTailwind, tailwindBodyClasses) {
  const form = document.createElement('form');
  form.action = 'https://codepen.io/pen/define';
  form.method = 'POST';
  form.target = '_blank';
    let title = "Snippet";
    if(typeof(theUrl) !== 'undefined' && theUrl){
        let siteName = theUrl.replace("https://", "");
        siteName = siteName.replace("http://", "");
        siteName = siteName.replace('//', "");
        siteName = siteName.split('/')[0];
        siteName = siteName.replace('www.', '');  
        title += " from " + siteName;
    }

    
  htmlContent = html_beautify(htmlContent, {
                indent_size: 4,
                space_in_empty_paren: true,
                preserve_newlines: false,
                indent_inner_html: true,
                indent_empty_lines: false,
                extra_liners: [],
                wrap_line_length: 0
              });  
  htmlContent = '<!-- Exported with SnipCSS extension (Ver 2.0.3) -->' + '\n' + htmlContent;
  cssContent = '/* Exported with SnipCSS extension (Ver 2.0.3) */' + '\n' + cssContent;  


  const data = {
    title: title,
    html: htmlContent,
    css: cssContent,
    editors: "110",
    tags: ["snipcss"]
  };

  // Add Tailwind CSS CDN if useTailwind is true
  if (useTailwind) {
      console.log("codepen using tailwind");
    data.js_external = "https://cdn.tailwindcss.com/";
  }  
  
  // Add body classes using html_classes
  /*
  if (useTailwind && tailwindBodyClasses && tailwindBodyClasses.length > 0) {
    // Encode the classes properly
    function encodeAttribute(value) {
      return value.replace(/&/g, '&amp;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
    }
    let encodedBodyClasses = [];
    for(let x = 0; x < tailwindBodyClasses.length; x++){
      let encodedBodyClass = encodeAttribute(tailwindBodyClasses[x]);
      encodedBodyClasses.push(encodedBodyClass);
    }
    // Join the classes into a single string
    data.html_classes = encodedBodyClasses.join(' ');
  }
*/
    // Add body classes via JS in the head
    if (useTailwind && tailwindBodyClasses && tailwindBodyClasses.length > 0) {
      function encodeJsString(value) {
        return value.replace(/\\/g, '\\\\')
                    .replace(/'/g, '\\\'')
                    .replace(/"/g, '\\\"')
                    .replace(/\r?\n/g, '\\n')
                    .replace(/</g, '\\u003C')
                    .replace(/>/g, '\\u003E')
                    .replace(/&/g, '\\u0026');
      }

      let encodedBodyClasses = [];
      for (let x = 0; x < tailwindBodyClasses.length; x++) {
        let encodedBodyClass = encodeJsString(tailwindBodyClasses[x]);
        encodedBodyClasses.push(encodedBodyClass);
      }

      const classList = encodedBodyClasses.map(cls => `'${cls}'`).join(', ');
      const bodyClassesJs = `document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add(${classList});
      });`;

      // Ensure the script is properly encoded for inclusion in HTML
      const scriptContent = bodyClassesJs.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      data.head = `<script>${scriptContent}</script>`;
    }


  const hiddenField = document.createElement('input');
  hiddenField.type = 'hidden';
  hiddenField.name = 'data';
  hiddenField.value = JSON.stringify(data);

  form.appendChild(hiddenField);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function previewIframeUpdate(theHtml, elemSelector, textNodeIndex, newText, doUpdate){
    let oldHtml = SNIPCSS.HTML_EDITOR.getDoc().getValue();
    let oldZipHtml = SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'];    
    
    let replaceAllHtml = false;
    console.log("replacing with the new text");
    console.log(newText);
    
    if(elemSelector != ""){
        //console.log("old html");
        //console.log(oldHtml);
        //console.log("selector");
        //console.log(elemSelector);
        //console.log("textnodeindex");
        //console.log(textNodeIndex);
        
        let $aClone = $(oldHtml);
        var $cloneWrap = $aClone.wrap('<div id="previewwrap"></div>').parent(); 
        
        // Get the text nodes of the selected element
        //console.log("element");
        //console.log($cloneWrap.find(elemSelector).get(0));
        let textNodes = getTextNodesIn($cloneWrap.find(elemSelector).get(0));

        // Update the specified text node
        if (textNodes.length > textNodeIndex) {
            textNodes[textNodeIndex].nodeValue = newText;
        }else{
            $cloneWrap.find(elemSelector).get(0).outerHTML = theHtml;
        }
        
        let newHtml = $cloneWrap.children().first().get(0).outerHTML;     
        //console.log("new html");
        //console.log(newHtml);
        SNIPCSS.HTML_EDITOR.getDoc().setValue(newHtml); 
    }
    else{
        //wtf - we could probably just do this to convert html to ziphtml... 
        //why did we keep two things throughout everything if it's that easy?

        let allSources = new Array();
        let $aClone = $(theHtml);
        console.log("clone html before");
        console.log($aClone.get(0).outerHTML);
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
        var zipouterHtml = $aClone.get(0).outerHTML;
        console.log("clone after");
        console.log(zipouterHtml);
        //let convertedZipHtml = JSON.stringify(outerHtml);
        SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'] = zipouterHtml;    
    }
    
    if(doUpdate){
        setTimeout(function(){
            $('#save-html').trigger('click'); 
        }, 500);        
    }
    
    /*
     * //never worked well
    else if(!replaceAllHtml){
        if(beforeHtml.trim().length <= 4 || oldHtml.indexOf(beforeHtml) === -1){
            alert("Error: Update did not work");
            return;
        }
        
        
        let newHtml = replaceAll(oldHtml, beforeHtml, afterHtml);  
        let newZipHtml = replaceAll(oldZipHtml, beforeHtml, afterHtml);  


        SNIPCSS.HTML_EDITOR.getDoc().setValue(newHtml);        
        SNIPCSS.SELECTED_SNIPPET['snip_ziphtml'] = newZipHtml;
    }
    
     */
    
}

function getPreviewFrameHtml(theCss, theHtml, loadWithTailwind, tailwindHtml, tailwindCss, tailwindBodyClasses){
    
    let scriptUrlOne;
    let scriptUrlTwo;
    let scriptUrlThree;
    let stylesheetOne;
    let tailwindScript;
    if(loadWithTailwind){
        tailwindScript = chrome.runtime.getURL('js/tailwind.cdn.3.4.14.js');
    }    
    if(TEMPLATES.IN_EXTENSION){
        scriptUrlOne = chrome.runtime.getURL('js/jquery-3.3.1.min.js');
        scriptUrlTwo = chrome.runtime.getURL('js/selectionBox.js');
        scriptUrlThree = chrome.runtime.getURL('js/options/preview_iframe.js');

        stylesheetOne = chrome.runtime.getURL('css/template_iframe.css');
        
    }else{
        var baseUrl = "http://localtemplates.snipcss.com/";
        if(TEMPLATES.LOCAL_SERVER){
            baseUrl = "http://localtemplates.snipcss.com/";
        }else{
            baseUrl = "https://templates.snipcss.com/";                        
        }
        scriptUrlOne = baseUrl + 'js/jquery-3.3.1.min.js';
        scriptUrlTwo = baseUrl + 'loadfile/selectionBox.js';
        scriptUrlThree = baseUrl + 'loadfile/preview_iframe.js';
        stylesheetOne = baseUrl + 'css/template_iframe.css';                    
    }    
    
    console.log("tailwind body classes" );
    console.log(tailwindBodyClasses);
    console.log("tailwindCSS:");
    console.log(tailwindCss);
    let twBody = "";
    if (tailwindBodyClasses && tailwindBodyClasses.length > 0) {
        function encodeAttribute(value) {
            return value.replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
        }
        let encodedBodyClasses = [];
        for(let x = 0; x < tailwindBodyClasses.length; x++){
            let encodedBodyClass = encodeAttribute(tailwindBodyClasses[x]);
            encodedBodyClasses.push(encodedBodyClass);
        }
        const classAttributeValue = encodedBodyClasses.join(' ');
        twBody = ' class="' + classAttributeValue + '"';
    }

    
    console.log("twbody: " + twBody);
    
    var iframeHtml = '<!DOCTYPE html>\n';                    
    iframeHtml += '<html>\n';
    iframeHtml += '   <head>\n';
    iframeHtml += '      <meta charset="utf-8">\n'; 
    iframeHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';         
    iframeHtml += '      <script src="' + scriptUrlOne + '"></script>\n';
    iframeHtml += '      <script src="' + scriptUrlTwo + '"></script>\n';
    iframeHtml += '      <script src="' + scriptUrlThree + '"></script>\n';
    if(loadWithTailwind){
        iframeHtml += '      <script src="' + tailwindScript + '"></script>\n';        
    }
    iframeHtml += '      <link rel="stylesheet" href="' + stylesheetOne + '">\n';  
    iframeHtml += '      <style>\n';  
    if(loadWithTailwind){
        iframeHtml += tailwindCss;
    }else{
        iframeHtml += theCss;
    }
    iframeHtml += '      </style>\n';                       
    iframeHtml += '   </head>\n';
    iframeHtml += '   <body' + twBody + '>\n';
    if(loadWithTailwind){
        
        tailwindHtml = replaceAll(tailwindHtml, String.raw`bg-[url(\&quot;data:image/svg+xml]`, '');
        tailwindHtml = replaceAll(tailwindHtml, String.raw`bg-[url("data:image/svg+xml]`, '');

        iframeHtml += tailwindHtml;
    }else{
        iframeHtml += theHtml;
    }    
    iframeHtml += '   </body>\n';
    iframeHtml += '</html>\n';  
    
    return iframeHtml;
}

window.addEventListener('message', function(event) {
    if (event.data.type === 'tailwindError') {
        // Show error message to user
        alert(event.data.message);
        // Or display in a more user-friendly way:
        // showErrorNotification(event.data.message);
    }
});

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
        let multipleResolutions, unusedCSS, replaceClasses, unusedAttributes, resolutionReload, scopeGenerics, templateEngine, useTailwind;
        
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
        
	

	