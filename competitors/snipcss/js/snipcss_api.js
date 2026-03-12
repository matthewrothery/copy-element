var API = API || {};
var TEMPLATES = TEMPLATES || {IN_EXTENSION: true, LOCAL_SERVER: false};
API.API_URL = 'https://www.snipcss.com/api/';

API.sendSnipcssStats = function(snipData){
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   

    
    var theUrl = API.API_URL + "user_snippet_stats";
    
    
    //console.log("the url " + theUrl);
    //console.log("sending stats");

    var theJSON = JSON.stringify(snipData);
/*
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         console.log("got back response");
         console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);
         //callback();
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    xhr.send(theJSON);        
*/
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
      console.log('got back response');
      console.log(responseText);
      var resp = JSON.parse(responseText);
      //callback();
    });


    return {success: 'true', "msg": "requesting"};    
};

API.sendSnipcssError = function(siteUrl, scriptLoc, linenum, errMessage, allSelectors, snipOptions, apiToken){
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   

    
    //ignore this error
    if(errMessage.indexOf('ResizeObserver loop') >= 0){
        return;
    }
    
    
    var errorData = {};
    
    errorData['site_url'] = siteUrl;
    errorData['script_location'] = scriptLoc;
    errorData['line_num'] = linenum;
    errorData['error_message'] = errMessage;
    errorData['all_selectors'] = allSelectors;
    errorData['snip_options'] = snipOptions;
    errorData['api_token'] = apiToken;
        
    
    var theUrl = API.API_URL + "user_record_error";
    
    
    //console.log("the url " + theUrl);
    //console.log("sending error data");

    var theJSON = JSON.stringify(errorData);
    /*
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         //console.log("got back response");
         //console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);
         //callback();
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }

    xhr.send(theJSON);        
    */
   
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
      console.log('got back response');
      console.log(responseText);
      var resp = JSON.parse(responseText);
      //callback();
    });   
   
    return {success: 'true', "msg": "recording"};      
    
    
};

API.sendSnipcssData = function(snipData, callback){
    //console.log("Sending Snip data");
    //console.log(scrapeData);    
    //console.log("default platform " + scrapeData['default_platform']);
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
  
    
    var theUrl = API.API_URL + "add_extension_snippet";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(snipData);
    /*
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         //console.log("got back response");
         //console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);
         var insertedId = resp['snip_id'];
         callback(insertedId);
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }

    xhr.send(theJSON);        
    */
   
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('add_extension_snippet - got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         var insertedId = resp['snip_id'];
         callback(insertedId);
    });    
   
   
   
    return {success: 'true', "msg": "requesting"};
};

API.sendFeedbackData = function(feedbackData, callback) {
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
  
    var theUrl = API.API_URL + "send_feedback";

    var theJSON = JSON.stringify(feedbackData);

    fetch(theUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: theJSON
    })
    .then(response => response.json())
    .then(responseData => {
        console.log("feedback response data: " );
        console.log(responseData);
        callback(responseData);
    })
    .catch(error => {
        console.error('Error sending feedback:', error);
        callback({ success: 'false' });
    });
};



API.sendTemplateData = function(templateData, callback){
    //console.log("Sending Snip data");
    //console.log(scrapeData);    
    //console.log("default platform " + scrapeData['default_platform']);
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
  
    
    var theUrl = API.API_URL + "add_extension_template";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);
    /*
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         console.log("template save - got back response");
         console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);
         var insertedId = resp['snip_id'];
         callback(insertedId);         
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }

    xhr.send(theJSON);        
    */
   
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('template save - got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         var insertedId = resp['snip_id'];
         callback(insertedId);
    });    
      
   
   
    return {success: 'true', "msg": "requesting"};
}




API.LoremIpsonify = function(loremData, themeName, callback){
    console.log("Sending Lorem data");
    console.log(loremData);    
    loremData['themename'] = themeName;
    //console.log("default platform " + scrapeData['default_platform']);
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
    
    var theUrl = API.API_URL + "get_ipsum_fields";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(loremData);
    /*
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         console.log("got back response");
         console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);
         callback(resp);
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    xhr.send(theJSON);        
    */
   
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('ipsum - got back response');
         //console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });    
    
    return {success: 'true', "msg": "requesting"};
}

API.getVueComponentFromTemplate = function(vueHtml, allFields, jsonData, componentName, apiKey, templateId, callback){
    
    let templateData = {};
    templateData['vue_html'] = vueHtml;
    templateData['all_fields'] = allFields;
    templateData['json_data'] = jsonData;
    templateData['component_name'] = componentName;
    templateData['api_key'] = apiKey;
    templateData['template_id'] = templateId;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
    
    var theUrl = API.API_URL + "get_vue_component";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);
    
    /*
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         console.log("got back response");
         console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);         
         callback(resp);
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    xhr.send(theJSON);        
    */
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('getVueComponent - got back response');
         //console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });    
   
    return {success: 'true', "msg": "requesting"}; 
    
};

API.getVueFromChatGPT = function(mustacheHtml, jsonData, componentName, apiKey, templateId, callback){
    let templateData = {};
    templateData['mustache_code'] = mustacheHtml;
    templateData['json_data'] = jsonData;
    templateData['component_name'] = componentName;
    templateData['api_key'] = apiKey;
    templateData['template_id'] = templateId;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }       
    
    //get_react_chatgpt
    var theUrl = API.API_URL + "get_vue_chatgpt";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('getVueComponent - got back response');
         //console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });   

    return {success: 'true', "msg": "requesting"};       
};

API.getReactFromChatGPT = function(mustacheHtml, jsonData, componentName, apiKey, templateId, callback){
    let templateData = {};
    templateData['mustache_code'] = mustacheHtml;
    templateData['json_data'] = jsonData;
    templateData['component_name'] = componentName;
    templateData['api_key'] = apiKey;
    templateData['template_id'] = templateId;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }     
    
    //get_react_chatgpt
    var theUrl = API.API_URL + "get_react_chatgpt";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('getVueComponent - got back response');
         //console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });   

    return {success: 'true', "msg": "requesting"};       
};
  
API.getReactComponentFromTemplate = function(reactiveHtml, allFields, jsonData, componentName, apiKey, templateId, callback){
    
    let templateData = {};
    templateData['reactive_html'] = reactiveHtml;
    templateData['all_fields'] = allFields;
    templateData['json_data'] = jsonData;
    templateData['component_name'] = componentName;
    templateData['api_key'] = apiKey;
    templateData['template_id'] = templateId;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
    
    var theUrl = API.API_URL + "get_react_component";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);
/*
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
         console.log("got back response");
         console.log(xhr.responseText);
         var resp = JSON.parse(xhr.responseText);         
         callback(resp);
      }
    };    
    xhr.open("POST", theUrl, true);
    if(TEMPLATES.IN_EXTENSION){
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    xhr.send(theJSON);        
*/
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('getVueComponent - got back response');
         //console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });   

    return {success: 'true', "msg": "requesting"};   
    
    
    
};


API.getMustacheTemplateFromChatGPT = function(snipHtml, apiKey, callback){    
    let templateData = {};
    templateData['snip_html'] = snipHtml;
    templateData['api_key'] = apiKey;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
    
    
    var theUrl = API.API_URL + "templatize_chatgpt";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(templateData);

    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('chatGPT - got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });   

    return {success: 'true', "msg": "requesting"};   
};



API.getUserCredits = function(apiKey, callback){    
    let replaceData = {};
    replaceData['api_key'] = apiKey;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }      
    var theUrl = API.API_URL + "get_user_credits";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(replaceData);

    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('GetUserCredits - got back response');
         //console.log(responseText);
         let resp;
         try {
            resp = JSON.parse(responseText);
            callback(resp);
         } catch (error) {
             console.log(error);
            let errorObj = {};
            errorObj['success'] = 'false';
            callback(errorObj);             
         }         
    }).catch(error => {
        // This is where you run code if the server returns any errors
        let errorObj = {};
        errorObj['success'] = 'false';
        callback(errorObj);
        console.log('Fetch Error: ', error);
    });;   

    return {success: 'true', "msg": "requesting"};   
    
    
    
};

API.updateUserCredits = function(apiKey, callback){    
    let replaceData = {};
    replaceData['api_key'] = apiKey;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }      
    var theUrl = API.API_URL + "update_user_credits";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(replaceData);

    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         //console.log('GetUserCredits - got back response');
         //console.log(responseText);
         let resp;
         try {
            resp = JSON.parse(responseText);
            callback(resp);
         } catch (error) {
             console.log(error);
            let errorObj = {};
            errorObj['success'] = 'false';
            callback(errorObj);             
         }         
    }).catch(error => {
        // This is where you run code if the server returns any errors
        let errorObj = {};
        errorObj['success'] = 'false';
        callback(errorObj);
        console.log('Fetch Error: ', error);
    });;   

    return {success: 'true', "msg": "requesting"};   
    
    
    
};

API.replaceImagesWithAI = function(imageArr, apiKey, callback){    
    let replaceData = {};
    replaceData['image_requests'] = imageArr;
    replaceData['api_key'] = apiKey;
    
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }    
    
    var theUrl = API.API_URL + "replace_images_with_ai";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(replaceData);

    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('ImageReplace - got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    }).catch(error => {
        // This is where you run code if the server returns any errors
        let errorObj = {};
        errorObj['success'] = 'false';
        errorObj['msg'] = "Server Error - try again later";
        callback(errorObj);
        console.log('Fetch Error: ', error);
    });   
    return {success: 'true', "msg": "requesting"};   
};

//external it does ajax, internal it just does updateAllScrapeRuns
API.updateStatus = function(){
    
};

API.getDirectoryTemplates = function(callback){
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
    
    var theUrl = API.API_URL + "get_latest_templates";    
    
    fetch(theUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('Get templates got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         callback(resp);
    });       
};



API.sendAutomationData = function(snipData, callback){
    
    console.log("NOT USED");
    /*
    //console.log("Sending Snip data");
    //console.log(scrapeData);    
    //console.log("default platform " + scrapeData['default_platform']);
    if(TEMPLATES.IN_EXTENSION){
        var chromeExtensionId = chrome.runtime.id;
        if(!chromeExtensionId || chromeExtensionId == 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";        
        }        
    }else{
        if(TEMPLATES.LOCAL_SERVER){
            //dev version
            API.API_URL = "http://local.snipcss.com/api/";                    
        }
    }   
  
    
    var theUrl = API.API_URL + "add_automation_snippet";    
    console.log("the url " + theUrl);
    
    var theJSON = JSON.stringify(snipData);
   
    fetch(theUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: theJSON
    })
    .then(response => response.text())
    .then(responseText => {
         console.log('add_extension_snippet - got back response');
         console.log(responseText);
         var resp = JSON.parse(responseText);
         var insertedId = resp['snip_id'];
         callback(insertedId);
    });    
   
   
   
    return {success: 'true', "msg": "requesting"};     
     */
};


