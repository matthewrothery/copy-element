	var CURRENT_TAB_PAGE = null;
        var CURRENT_TAB_ID = null;
        var CURRENT_TAB_URL = null;
        
        $(function()
	{	            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                
                console.log("loading tab ");
                console.log(tabs[0]);
                console.log("all tabs");
                console.log(tabs);
                CURRENT_TAB_PAGE = tabs[0];            
                CURRENT_TAB_ID = tabs[0].id;
                CURRENT_TAB_URL = tabs[0].url;
                
               if (CURRENT_TAB_URL.includes('chrome://')){
                   console.log("bad chrome url from other extension?");
                   console.log("use this one");
                   console.log(tabs[1]);                               
                   CURRENT_TAB_PAGE = tabs[1];            
                   CURRENT_TAB_ID = tabs[1].id;
                   CURRENT_TAB_URL = tabs[1].url;                                       
               }
                
                
                console.log("sending message to include scripts");
                var params = {method: "include_snipcss_scripts", tabid: CURRENT_TAB_ID, taburl: CURRENT_TAB_URL};
                chrome.runtime.sendMessage(params);    

                /*
                chrome.runtime.sendMessage({my_tab_id: tabs[0].id, my_tab_url: CURRENT_TAB_URL, method: "reloadAttachDebugger"}, 
                function(response) 
                {	
                    console.log("response ");
                    console.log(response);
                    if(response['error'] && response['error'] == 'badurl'){
                        $('.limited-version').html("SnipCSS cannot snip on this url.");
                        $('.limited-version').addClass('disabled-now');
                        $('.limited-version').removeClass('loading-now');                                        
                    }
                });                
                */
            });            
            $('.limited-version').html("SnipCSS is still loading on this page... if this message persists try disabling/enabling the extension");
            $('.limited-version').removeClass('disabled-now');
            $('.limited-version').addClass('loading-now');
            /******** CHROME HANDLERS ************/
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
            {
                console.log("popup request received");
                console.log(request);
                if (request.method == "snipcss_loaded") {
                    $('.limited-version').html("SnipCSS is now active!  Hover over and Click an element to Snip.");
                    $('.limited-version').removeClass('disabled-now');
                    $('.limited-version').removeClass('loading-now');                    
                }    
                else if (request.method == "snipcss_failed") {
                    if(request.fail_type == 'extension'){
                        $('.limited-version').html("Another extension is interferring with SnipCSS!<br><br>Please disable other extensions (LastPass is known to cause issues but there could be others)." + 
                                "Then try running SnipCSS again.");                        
                    }else{
                        $('.limited-version').html("SnipCSS failed to load!  Please click the X in this window, reload the page, then try clicking the extension icon again.  It may also help if Chrome Devtools is closed. " + 
                                "Contact support@snipcss.com if the issue persists.");
                    }
                    $('.limited-version').addClass('disabled-now');
                    $('.limited-version').removeClass('loading-now');
                }
                //doesnt work why?

                setTimeout(function(){
                    var params = {method: "close_snipcss", tabid: CURRENT_TAB_ID, taburl: CURRENT_TAB_URL};
                    chrome.runtime.sendMessage(params);                                        
                }, 500);
                
            });
            
            $('#close_selection_modal').on('click', function(){
                chrome.runtime.sendMessage({tab: CURRENT_TAB_PAGE, method: "disableDebugger", tab_id: CURRENT_TAB_ID}, 
                function(response) 
                {	
	
                });                
                $('.limited-version').html("SnipCSS is now disabled.  Click outside this popup to close, or re-click icon to activate again.");
                $('.limited-version').addClass('disabled-now');
                $('.limited-version').removeClass('loading-now');      
            }); 
            
            $('#logout_link').on('click', function(){
                let setArray = new Array();
                setArray['api_key'] = '';
                setArray['user_email'] = '';
                setArray['user_firstname'] = '';
                setArray['pro_user'] = false;
                setOptionStorage(setArray, function(theStorage){
                    console.log("storage now");
                    console.log(theStorage);
                    $('#logged_out_container').html("<p>You are now logged out.<p>");                       
                });                
            });
            
            $('#login_link').on('click', function(){
                chrome.runtime.sendMessage({method: "optionsLinkClick", "page" : "/signup"}, 
                function(response) 
                {

                });                      
            });
            
            $('#promember_link').on('click', function(){
                chrome.runtime.sendMessage({method: "optionsLinkClick", "page" : "/pricing"}, 
                function(response) 
                {

                });             

            });          
            
            getOptionStorage(function(theStorage){
                
                //load the text
                var userEmail = theStorage['user_email'];
                var userFirstname = theStorage['user_firstname'];
                var userApiKey = theStorage['api_key'];
                var userPro = theStorage['pro_user'];
                console.log("useremail " + userEmail);
                console.log("userfirstname " + userFirstname);

                var proUser = false;
                if(userPro == 1){
                    proUser = true;
                    $('.promember_text').html("Thank you for becoming a Pro Member!");
                    $('.feature-unlock').empty();
                    $('.feature-unlock').append('Please contact <a href="mailto:support@snipcss.com">suppport@snipcss.com</a> if you have any problems or questions about the extension.');
                    $('.promember_button_container').css('display', 'none');
                }

                if(userEmail){
                    if(userFirstname){
                        $('#hi_user').css('display', 'block');
                        $('#user_firstname').html(userFirstname);                                 
                    }else{
                        $('#hi_user').css('display', 'none');
                    }

                    $('#user_logged_in').css('display', 'block');
                    $('#user_logged_out').css('display', 'none');
                    if(proUser){
                        $('#membership_type').html(" - Pro Version");
                    }else{
                        $('#membership_type').html(" - Free Member");                    
                    }
                }
                else{
                    $('#user_logged_in').css('display', 'none');
                    $('#user_logged_out').css('display', 'block');                
                }
                
            });            
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