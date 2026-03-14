            //No - show a modal that has the prompt you want?  Costs credits?
var TEMPLATES = TEMPLATES || {};

TEMPLATES.CURR_UID = "";
TEMPLATES.CURR_SCREENSHOT = "";
TEMPLATES.USE_IPSUM_SERVER = true;
TEMPLATES.SNIPPET = null;
TEMPLATES.$SNIPHTML = null;
TEMPLATES.TOP_ELEM = null;
TEMPLATES.SNIPCSS = null;
TEMPLATES.SNIPHTML = null;  //original html
TEMPLATES.RESULT_HTML = null;
TEMPLATES.SNIPUID = null;
TEMPLATES.SNIPID = null;
TEMPLATES.TEMPLATE_NAME = "";
TEMPLATES.COMPONENT_NAME = "";

TEMPLATES.AUTOCREATE_REPEAT = false;
TEMPLATES.AUTOCREATE_ALL = false;
TEMPLATES.LIST_SELECTORS = new Array();
TEMPLATES.MODAL_OPEN = false;
TEMPLATES.EDIT_FIELD_INDEX = null;
TEMPLATES.EDIT_FIELD_SUBINDEX = null;
TEMPLATES.MODAL_NAME = '';
TEMPLATES.SET_DATA_SELECTOR = null;
TEMPLATES.INITIALIZED_VIEWER = false;
TEMPLATES.SVG_VARIABLES = new Array();


//for labels
TEMPLATES.IMGNUM = 1;
TEMPLATES.VIDNUM = 1;
TEMPLATES.LINKNUM = 1;
TEMPLATES.TITLENUM = 1;
TEMPLATES.TEXTNUM = 1;

//editors 
TEMPLATES.JSON_EDITOR = null;
TEMPLATES.TEMPLATE_EDITOR = null;
TEMPLATES.CSS_EDITOR = null;  //only used on website version
TEMPLATES.IFRAME_BODY = null;

//code that gets injected
TEMPLATES.TEMPLATE_CODE = "";
TEMPLATES.TEMPLATE_LANGUAGE = "Mustache";
TEMPLATES.JSON_OBJECT = {};
TEMPLATES.IPSUM_VARIABLES = {};
TEMPLATES.IPSUM_THEME = "lorem";
TEMPLATES.DEFAULT_NUM_LISTITEMS = -1;

//LIST
TEMPLATES.SELECTING_LIST = false;
TEMPLATES.SELECTING_ITEM = false;
TEMPLATES.SELECTING_EDIT = false;
TEMPLATES.SELECTING_IPSONIFY = false;

//creating a new field modal
TEMPLATES.NEWFIELD_IS_SUBFIELD = false;
TEMPLATES.NEWFIELD_SUBINDEX = -1;
TEMPLATES.NEWFIELD_ELEM = null;
TEMPLATES.NEWFIELD_SELECTOR = "";
TEMPLATES.NEWFIELD_LEVEL = 0;
TEMPLATES.TEMPLATE_DB_ID = 0;

/*
var fieldObject = { type: 'list|item'
    selector: '.good_selector',
    label: '',
    label_num: 'x',
    attribute: 'src'    
};   
*/

TEMPLATES.ALL_FIELDS = new Array();
TEMPLATES.ALL_BAD_FIELDS = new Array();
TEMPLATES.IN_EXTENSION = false;
TEMPLATES.LOCAL_SERVER = false;

//website tab variables
//available first tabs: html/mustache/react/vue
TEMPLATES.WEBSITE_FIRST_MIRROR_TAB = "html";
//available second tabs: css/fonts
TEMPLATES.WEBSITE_SECOND_MIRROR_TAB = "css";
//available third tabs: json/
TEMPLATES.WEBSITE_THIRD_MIRROR_TAB = "json";

TEMPLATES.WEBSITE_FREE_ONE = "mustache";
TEMPLATES.WEBSITE_TEMPLATE_ENGINE = "react";

TEMPLATES.CURRENT_ALLOWED_ENGINES = "html|mustache";
TEMPLATES.IFRAME_IS_LOADING = false;
//width if you wanted to take screenshot of element and it to look good
TEMPLATES.ELEMENT_DIM = "900,1200";
TEMPLATES.ALL_COLORS = new Array();
TEMPLATES.FEATURE_ARR = new Array();

TEMPLATES.SAVED_TEMPLATE = false;
TEMPLATES.SAVED_ID = "";

TEMPLATES.SAVED_JSON = false;
TEMPLATES.ALSO_SAVE_JSON = false;


if(location.protocol == "chrome-extension:"){ 
    TEMPLATES.IN_EXTENSION = true;
}else{
    TEMPLATES.IN_EXTENSION = false;
    if(window.location.href.indexOf('local.') !== -1 || window.location.href.indexOf('localtemplates.') !== -1){
        TEMPLATES.LOCAL_SERVER = true;
    }
    
}

TEMPLATES.reloadTemplate = function(reloadLabels){
    if(TEMPLATES.IFRAME_BODY != null){
        document.getElementById('templatecode_iframe').contentWindow.startReloading();
    }else{
            let stylesheetThree;
            if(TEMPLATES.IN_EXTENSION){
                    stylesheetThree = chrome.runtime.getURL('css/template_iframe.css');
                var iframeHtml = '<!DOCTYPE html>\n';                    
                iframeHtml += '<html>\n';
                iframeHtml += '   <head>\n';
                iframeHtml += '      <meta charset="utf-8">\n'; 
                iframeHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';                    
                iframeHtml += '      <link rel="stylesheet" href="' + stylesheetThree + '">\n';                 
                iframeHtml += '   </head>\n';
                iframeHtml += '   <body>\n';
                    iframeHtml += '<div id="theloader" class="loading-overlay is-active">' + 
                        '<span class="loader"></span>' + 
                    '</div>';
                iframeHtml += '   </body>\n';
                iframeHtml += '</html>\n';    
                var anIframe = document.querySelector('#templatecode_iframe');
                anIframe.contentDocument.body.innerHTML = '';                
                anIframe.contentDocument.write(iframeHtml);                
            }
    }
    //console.log("loading snippet2222");
    //console.log(snippet);
    let theHtml = TEMPLATES.SNIPHTML; // SNIPPET['snip_html'];
    let theCss = TEMPLATES.SNIPCSS;  //.SNIPPET['snip_css'];
    
    
    //THIS SHOULD BE FUNCTION 

    let notFoundFields = new Array();
    //first list fields
    if(reloadLabels){
        TEMPLATES.labelListSelectors();
    }    
    var $clone = $('#template').clone();
    
    if(TEMPLATES.SAVED_TEMPLATE || TEMPLATES.SAVED_ID != ""){
        $clone.children().eq(0).attr('id', TEMPLATES.SAVED_ID);        
    }
    
   
    var $cloneWrap = $clone.wrap('<div id="templatewrap"></div>').parent(); 
    
    if(!TEMPLATES.SAVED_JSON && TEMPLATES.IN_EXTENSION){
        TEMPLATES.JSON_OBJECT = {};        
    }
    TEMPLATES.IPSUM_VARIABLES = {};    
    
    //get ipsum values needed first?
    /*
    for(var q = 0; q < TEMPLATES.ALL_FIELDS.length; q++){
        let qField = TEMPLATES.ALL_FIELDS[q];
        if(aField['field_type'] == 'list'){
            for(let r = 0; r < subFields.length; r++){
                let sField = subFields[s];            
                    
            }
        }
        else if(aField['field_type'] == "item"){
            
        }
    }
    */
    var ipsumImagePromises = new Array();

    for(var m = 0; m < TEMPLATES.ALL_FIELDS.length; m++){
        let aField = TEMPLATES.ALL_FIELDS[m];        
        var extraRepeatName = "";
        if(m >= 1){
            extraRepeatName = "_" + m;
        }        
        
        console.log("processing field");
        console.log(aField);
        if(aField['field_type'] == 'list'){
            let listSelector = aField['the_selector'];
            let fieldName = aField['field_name'];
            let templateElem = $('#template').get(0);
            let jsonListObject = new Array();        
            let ipsumListObject = new Array();
            let jsonFirstItem = {};
            let ipsumFirstItem = {};
            //console.log("clonewrap html");
            //console.log($cloneWrap.get(0).outerHTML);
            console.log("list selector");
            console.log(listSelector);
            let firstElem = $cloneWrap.find(listSelector).get(0);       
            let totalElements = $cloneWrap.find(listSelector).length;
            console.log("first Elem is ");
            console.log(firstElem);
            
            $(firstElem).find('svg').each(function(){
                this.outerHtml = '---svg-list-item----';
            });
            
            let subFields = aField['sub_fields'];
            
            for(var s = 0; s < subFields.length; s++){
                let sField = subFields[s];
                console.log("subfield");                
                console.log(sField);
                if(sField['item_type'] == 'sublist'){
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['sample_data'] = 'sublist';                    
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['found'] = true;
                    let ipsumWanted = new Array();
                    let ipsumStuff = {};
                    console.log("BUILDING SUBLIST IPSUM");
                    console.log(sField);
                    for(var q = 0; q < sField['sub_fields'].length; q++){
                        console.log("field name " + sField['sub_fields'][q]['label']);
                        console.log("attribute " + sField['sub_fields'][q]['attribute']);
                        let sublistLabel = sField['sub_fields'][q]['label'];
                        let fieldIpsum = TEMPLATES.getIpsumWanted(sField['sub_fields'][q]['attribute'], null);                        
                        ipsumStuff[sublistLabel] = fieldIpsum;                        
                    }
                    ipsumWanted.push(ipsumStuff);
                    ipsumWanted.push(ipsumStuff);
                    ipsumWanted.push(ipsumStuff);
                    
                    console.log("adding dumb sublist ipsum that is array");
                    console.log(ipsumWanted);
                    
                    ipsumFirstItem[sField['field_name']] = ipsumWanted;
                    jsonFirstItem[sField['field_name']] = "";    
                                    
                    continue;
                }
                
                let theSelector = sField['selector'];
                let useChildren = false;
                let myElem = null;
                if(theSelector.indexOf("children=") !== -1){
                    theSelector = theSelector.split("=")[1];
                    useChildren = true;
                }
                let theLen = 0;
                if(theSelector == 'self'){
                    //console.log("skip self true");
                    myElem = $clone.get(0);                    
                }else{                        
                    if(useChildren){
                        theLen = $clone.children(theSelector).length;
                        if(theLen > 0){
                            myElem = $clone.children(theSelector).get(0);                    
                        }else{
                            //console.log("existing not found " + theSelector);                        
                        }                    
                    }else{
                        console.log("finding inside firstElem");
                        console.log(theSelector);
                        theLen = $(firstElem).find(theSelector).length;
                        if(theLen > 0){
                            myElem = $(firstElem).find(theSelector).get(0);                    
                        }else{
                            console.log("existing not found ---- " + theSelector);
                        }
                    }
                }  
                console.log("list subitem element is ");
                console.log(myElem);
                if(myElem !== null){
                    //console.log("trying to set " + sField['label']);
                    //console.log("attribute");
                    //console.log(sField['attribute']);
                    //console.log("html before");
                    //console.log(templateElem);                    
                    let ipsumWanted = TEMPLATES.getIpsumWanted(sField['attribute'], myElem);
                    
                    let sampleData = TEMPLATES.replaceAttributeValue(sField['attribute'], myElem, sField['label']);
                    if(ipsumWanted.startsWith('image=') || ipsumWanted.startsWith('background-image=')){
                        console.log('new list ipsum field, adding image promise for ' + ipsumWanted);
                        let imgUrl = ipsumWanted.split('=')[1];
                        let parentWidth = $(myElem).parent().width();
                        let parentHeight = $(myElem).parent().height();
                        console.log("img parent width: " + parentWidth);
                        console.log("img parent height: " + parentHeight);
                        
                        let imgPromise = TEMPLATES.getImageSizePromise(imgUrl, parentWidth, parentHeight);                        
                        ipsumImagePromises.push(imgPromise);     
                    }                    
                    else{
                        console.log("new list ipsum field: " + ipsumWanted);
                    }
                    //console.log("sample data");
                    //console.log(sampleData);
                    //console.log("html after");
                    //console.log(templateElem);
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['sample_data'] = sampleData;                    
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['found'] = true;

                    ipsumFirstItem[sField['label']] = ipsumWanted;
                    jsonFirstItem[sField['label']] = sampleData;                    
                }
                else{
                    let ipsumWanted = TEMPLATES.getIpsumWanted(sField['attribute'], null);
                    
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['sample_data'] = null;                    
                    TEMPLATES.ALL_FIELDS[m]['sub_fields'][s]['found'] = false;

                    ipsumFirstItem[sField['label']] = ipsumWanted;
                    jsonFirstItem[sField['label']] = null;                      
                    console.log("MYELEM IS NULL");
                }
                
            }
            
            TEMPLATES.ALL_FIELDS[m]['example_object'] = jsonFirstItem;
            
            if(TEMPLATES.DEFAULT_NUM_LISTITEMS <= 1){
                TEMPLATES.DEFAULT_NUM_LISTITEMS = totalElements;
                if($('#default_num_listitems').length > 0){
                    $('#default_num_listitems').val(totalElements);
                }
            }
            //TEMPLATES.DEFAULT_NUMBER_OF_ITEMS
            for(var di = 0; di < TEMPLATES.DEFAULT_NUM_LISTITEMS; di++){
                ipsumListObject.push(ipsumFirstItem);                
            }
            
            //automatically lorem ipsum that shit?
            //jsonListObject.push(jsonFirstItem);
            //jsonListObject.push(jsonFirstItem);
            //jsonListObject.push(jsonFirstItem);            
            
            //insert other items into the json list object???
            console.log("setting fieldname " + fieldName + " IPSUM_VARIABLES to ");
            console.log(ipsumListObject);
            TEMPLATES.IPSUM_VARIABLES[fieldName] = ipsumListObject;
            //TEMPLATES.JSON_OBJECT[fieldName] = jsonListObject;
            
            $clone.find('.sniptemplate_sibling' + extraRepeatName).remove();
            let repeaterElem = $clone.find('.sniptemplate_repeater' + extraRepeatName).get(0);
            //let startLoop = document.createTextNode('//<//?phpstart' + aField['field_name'] + '//?//>');
               //let endLoop = document.createTextNode('//<//?phpend' + aField['field_name'] + 'Z/?//>');
            let startLoop = document.createTextNode('{{#' + aField['field_name'] + '}}');
            let endLoop = document.createTextNode('{{/' + aField['field_name'] + '}}');            
            $(startLoop).insertBefore(repeaterElem);
            $(endLoop).insertAfter(repeaterElem);
            $clone.find('.sniptemplate_repeater' + extraRepeatName).removeClass('sniptemplate_repeater' + extraRepeatName);
            
        }
        else if(aField['field_type'] == "item"){
            let itemSelector = aField['the_selector'];
            let fieldName = aField['field_name'];          
            let templateElem = $('#template').get(0);      
            console.log("trying to find: " + itemSelector);
            console.log("in the html");
            console.log($cloneWrap.html());
            let itemElem = $cloneWrap.find(itemSelector).get(0);
            if(itemElem != null){
                let ipsumWanted = TEMPLATES.getIpsumWanted(aField['attribute'], itemElem);  
                
                let sampleData = TEMPLATES.replaceAttributeValue(aField['attribute'], itemElem, aField['label']); 
                if(ipsumWanted.startsWith('image=') || ipsumWanted.startsWith('background-image=')){
                    console.log('new list ipsum field, adding image promise for ' + ipsumWanted);
                    let imgUrl = ipsumWanted.split('=')[1];
                    let parentWidth = $(itemElem).parent().width();
                    let parentHeight = $(itemElem).parent().height();
                    console.log("img parent width: " + parentWidth);
                    console.log("img parent height: " + parentHeight);
                    
                    let imgPromise = TEMPLATES.getImageSizePromise(imgUrl, parentWidth, parentHeight);
                    ipsumImagePromises.push(imgPromise);                        
                }                    
                else{
                    console.log("new list ipsum field: " + ipsumWanted);
                }                
                //console.log("sample data");
                //console.log(sampleData);
                //console.log("html after");
                //console.log(templateElem);
                TEMPLATES.ALL_FIELDS[m]['sample_data'] = sampleData;
                TEMPLATES.ALL_FIELDS[m]['found'] = true;
                var exampleItem = {};
                //TEMPLATES.JSON_OBJECT[aField['label']] = sampleData;
                TEMPLATES.IPSUM_VARIABLES[aField['label']] = ipsumWanted;
                TEMPLATES.ALL_FIELDS[m]['example_data'] = sampleData;
            }else{
                
                let ipsumWanted = TEMPLATES.getIpsumWanted(aField['attribute'], null);  
                    
                TEMPLATES.ALL_FIELDS[m]['sample_data'] = null;
                TEMPLATES.ALL_FIELDS[m]['found'] = false;
                var exampleItem = {};
                TEMPLATES.IPSUM_VARIABLES[aField['label']] = ipsumWanted;
                TEMPLATES.ALL_FIELDS[m]['example_data'] = null;
                
                console.log("could not find item element");
                console.log(itemElem);
            }            
        }
    }
    
    $clone.find('svg').each(function(){
        this.outerHtml = '---svg-single-item---';
    });
    
    
    //filling the ipsum data results in the same JSON object
    //we wanted before
    console.log("ipsum object structure");
    console.log(TEMPLATES.IPSUM_VARIABLES);

    
    //change the ipsum variables that are images to instead have image=width,height... rather than image=url
  Promise.all(ipsumImagePromises).then(theResults => { 
    console.log("promises finished");
    console.log("with ");
    console.log(theResults);
    if(theResults.length > 0){
        TEMPLATES.setImagesizeIpsum(theResults);
        console.log("after set ipsum images");
        console.log(TEMPLATES.IPSUM_VARIABLES);    
    }
    TEMPLATES.retrieveIpsumResults(function(ipsumJSON){
        if(!TEMPLATES.SAVED_JSON && TEMPLATES.IN_EXTENSION){
            TEMPLATES.JSON_OBJECT = ipsumJSON;
        }else{
            console.log("object nowwwww");
            console.log(TEMPLATES.JSON_OBJECT);
        }
        
        //console.log('ipsum json after filled');
        //console.log(TEMPLATES.JSON_OBJECT);
        //$clone.css('display', TEMPLATES.DISPLAY_CSS);
        //console.log("ALL FIELDS AFTER GETTING SAMPLE DATA OF FIELDS");
        //console.log(TEMPLATES.ALL_FIELDS);
        $clone.first().removeAttr('id');

        console.log("clone html");
        console.log($clone.get(0).outerHTML);
        
        if(!TEMPLATES.SAVED_TEMPLATE){
            if(!TEMPLATES.IN_EXTENSION){
                if(TEMPLATES.WEBSITE_FIRST_MIRROR_TAB == 'html'){
                    
                }
            }else{
                TEMPLATES.TEMPLATE_CODE = $clone.get(0).innerHTML;            
            }
        }

        let options = {
            "indent":"auto",
            "indent-spaces":4,
            "wrap":180,
            "markup":true,
            "output-xml":false,
            "numeric-entities":true,
            "quote-marks":true,
            "quote-nbsp":false,
            "show-body-only":true,
            "quote-ampersand":false,
            "omit-optional-tags": true,
            "coerce-endtags": false,
            "break-before-br":true,
            "uppercase-tags":false,
            "uppercase-attributes":false,
            "drop-font-tags":true,
            "tidy-mark":false
          };


          //TEMPLATES.TEMPLATE_CODE = tidy_html5(TEMPLATES.TEMPLATE_CODE, options);



        TEMPLATES.TEMPLATE_CODE = html_beautify(TEMPLATES.TEMPLATE_CODE, { indent_size: 4, space_in_empty_paren: true, preserve_newlines: false });
          console.log("beautyyyful code");
          console.log(TEMPLATES.TEMPLATE_CODE);    

        //everything above this should be own function to fill
        //template code and initial template json  

        var jsonString = JSON.stringify(TEMPLATES.JSON_OBJECT, null, 2);    
        var resultHtml = Mustache.to_html(TEMPLATES.TEMPLATE_CODE, TEMPLATES.JSON_OBJECT);    
        console.log("result html is");
        console.log(resultHtml);
        TEMPLATES.RESULT_HTML = resultHtml;
        let oldJson = "";
        if(TEMPLATES.IN_EXTENSION){
            oldJson = TEMPLATES.SNIPPET['json_string'];
        }
        
        if(TEMPLATES.JSON_EDITOR == null){
            $('#json_content').val(jsonString);        
            var jsonTextarea = $('#json_content').get(0);

            var jsonEditor = CodeMirror.fromTextArea(jsonTextarea, {
              lineNumbers: true,
              viewportMargin: Infinity,
              mode: "javascript"
            });        
            //var totalLines = htmlEditor.lineCount();  
            //htmlEditor.autoFormatRange({line:0, ch:0}, {line:totalLines});      

            jsonEditor.setCursor({line: 0, ch: 0});
            TEMPLATES.JSON_EDITOR = jsonEditor;
            if(!TEMPLATES.IN_EXTENSION){
                jsonEditor.setOption('theme', 'duotone-light');
                setTimeout(function(){
                    TEMPLATES.doneLoading();                    
                }, 500);
            }        
            if(TEMPLATES.IN_EXTENSION){         
                 //TEMPLATES.SNIPPET['json_string']
                 TEMPLATES.SNIPPET['json_string'] = jsonString;                          
            }               
            TEMPLATES.addPanel(jsonEditor, "json", "JSON");        
        }else{
            TEMPLATES.JSON_EDITOR.getDoc().setValue(jsonString);  
            if(TEMPLATES.IN_EXTENSION){                
                 TEMPLATES.SNIPPET['json_string'] = jsonString;                          
            }                     
        }
        
        if(!oldJson || oldJson.length < 10 && jsonString.length > 8){
            if(TEMPLATES.IN_EXTENSION){
                //doesn't hurt to save when json updated?
                TEMPLATES.saveTemplate(false);
            }
        }        

        if(TEMPLATES.TEMPLATE_EDITOR == null){
            
            var currMode = "htmlmixed";
            if(OPTIONS.TEMPLATE_ENGINE == 'react' || OPTIONS.TEMPLATE_ENGINE == 'vue'){
                if(OPTIONS.TEMPLATE_ENGINE == 'react'){
                    currMode = "jsx";
                }
                else if(OPTIONS.TEMPLATE_ENGINE == 'vue'){
                    currMode = "vue";
                }
                //hold off on setting
                setTimeout(function(){
                    if(OPTIONS.TEMPLATE_ENGINE == 'react'){
                        //reactifyIt
                        let templateCode = TEMPLATES.TEMPLATE_CODE;
                         $('#mymustache').remove();
                         $(templateCode).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');

                         let defaultName = TEMPLATES.getDefaultComponentName();
                         if(TEMPLATES.COMPONENT_NAME == ''){
                             TEMPLATES.COMPONENT_NAME = defaultName;
                         }

                         let retHtml = TEMPLATES.reactifyMustacheHtml();
                         API.getReactComponentFromTemplate(retHtml, TEMPLATES.ALL_FIELDS, TEMPLATES.JSON_OBJECT, 
                             TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(result){                                 
                             TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "jsx");
                                $('.snipmirror-switch-template').html("ReactJS");
                                //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
                                TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "jsx");
                                let theError = result['errors'];
                                let theFiles = result['files'];
                                for(let f = 0; f < theFiles.length; f++){
                                    let aFile = result['files'][f];
                                    let filedata = aFile['data'];
                                    let filename = aFile['name'];
                                    if(f == 0){
                                        $('.snipmirror-switch-template').html("ReactJS - " + filename);
                                        TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(filedata); 
                                    }
                                }                                
                         });
                    }
                    if(OPTIONS.TEMPLATE_ENGINE == 'vue'){
                        //reactifyIt
                        let templateCode = TEMPLATES.TEMPLATE_CODE;
                         $('#mymustache').remove();
                         $(templateCode).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');

                         let defaultName = TEMPLATES.getDefaultComponentName();
                         if(TEMPLATES.COMPONENT_NAME == ''){
                             TEMPLATES.COMPONENT_NAME = defaultName;
                         }
                         let vueHtml = $('#mymustache').get(0).innerHTML;
            
                        API.getVueComponentFromTemplate(vueHtml, TEMPLATES.ALL_FIELDS, TEMPLATES.JSON_OBJECT, 
                            TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(result){
                                $('.snipmirror-switch-template').html("VueJS");
                                //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
                                TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "vue");
                                let theError = result['errors'];
                                let theFiles = result['files'];
                                for(let f = 0; f < theFiles.length; f++){
                                    let aFile = result['files'][f];
                                    let filedata = aFile['data'];
                                    let filename = aFile['name'];
                                    if(f == 0){
                                        $('.snipmirror-switch-template').html("VueJS - " + filename);
                                        TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(filedata); 
                                    }
                                }                  
                        });                          
                    }                    
                    
                }, 1000);
                
            }else{
                //set the mustache or html content now
                if(!TEMPLATES.IN_EXTENSION){
                    if(TEMPLATES.WEBSITE_FIRST_MIRROR_TAB == 'html'){
                        $('#template_content').val(TEMPLATES.RESULT_HTML);     
                    }else if(TEMPLATES.WEBSITE_FIRST_MIRROR_TAB == 'mustache'){
                        $('#template_content').val(TEMPLATES.TEMPLATE_CODE);    
                        TEMPLATES.refreshReactVueButtons();                        
                    }
                }
                else{
                    $('#template_content').val(TEMPLATES.TEMPLATE_CODE);
                    TEMPLATES.refreshReactVueButtons();
                }
            }
            var templateTextarea = $('#template_content').get(0);        
            var templateEditor = CodeMirror.fromTextArea(templateTextarea, {
              lineNumbers: true,
              viewportMargin: Infinity,
              mode: currMode,
              fixedGutter: false,
              lineWrapping: false
            });         
            //var cssLines = templateEditor.lineCount();  

            templateEditor.on('change', editor => {
                
            });
            if(!TEMPLATES.IN_EXTENSION){
                templateEditor.setOption('theme', 'duotone-light');
            }            
            TEMPLATES.TEMPLATE_EDITOR = templateEditor;    

            
            TEMPLATES.addPanel(templateEditor, "template", "MUSTACHE");        
        }
        else{
            if(!TEMPLATES.IN_EXTENSION){
                if(TEMPLATES.WEBSITE_FIRST_MIRROR_TAB == 'html'){    
                    TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.RESULT_HTML);  
                }else if(TEMPLATES.WEBSITE_FIRST_MIRROR_TAB == 'mustache'){
                    TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE);                 
                }
            }
            else{
                TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
            }            
        }
        
        if(!TEMPLATES.IN_EXTENSION){
            //CSS EDITOR ONLY ON WEBSITE VERSION?
            if(TEMPLATES.CSS_EDITOR == null){
                $('#csstemplate_content').val(TEMPLATES.SNIPCSS);
                var cssTextArea = $('#csstemplate_content').get(0);        
                var cssTextEditor = CodeMirror.fromTextArea(cssTextArea, {
                  lineNumbers: true,
                  viewportMargin: Infinity,
                  mode: "css"
                });         
                var cssLines = cssTextEditor.lineCount();  

                cssTextEditor.on('change', editor => {

                });
                if(!TEMPLATES.IN_EXTENSION){
                    cssTextEditor.setOption('theme', 'duotone-light');
                }                
                TEMPLATES.CSS_EDITOR = cssTextEditor;        
                TEMPLATES.addPanel(cssTextEditor, "css", "CSS");  
            }else{
                TEMPLATES.CSS_EDITOR.getDoc().setValue(TEMPLATES.SNIPCSS);  
            }
        }
        
        if(TEMPLATES.IFRAME_BODY == null){
            setTimeout(function(){           
                
                let scriptUrlOne;
                let scriptUrlTwo;
                let scriptUrlThree;
                let scriptUrlFour;
                let scriptUrlFive;
                //var scriptUrlSix = chrome.runtime.getURL('js/options/template_iframe.js');
                let stylesheetOne;
                let stylesheetTwo;
                let stylesheetThree;
                if(TEMPLATES.IN_EXTENSION){
                    scriptUrlOne = chrome.runtime.getURL('js/jquery-3.3.1.min.js');
                    scriptUrlTwo = chrome.runtime.getURL('js/tether.min.js');
                    scriptUrlThree = chrome.runtime.getURL('js/options/templateElemListeners.js');
                    scriptUrlFour = chrome.runtime.getURL('js/selectionBox.js');
                    scriptUrlFive = chrome.runtime.getURL('js/options/template_iframe.js');
                    //var scriptUrlSix = chrome.runtime.getURL('js/options/template_iframe.js');
                    stylesheetOne = chrome.runtime.getURL('css/tether.css');
                    stylesheetTwo = chrome.runtime.getURL('css/tether-theme-basic.css');
                    stylesheetThree = chrome.runtime.getURL('css/template_iframe.css');
                }else{
                    var baseUrl = "http://localtemplates.snipcss.com/";
                    if(TEMPLATES.LOCAL_SERVER){
                        baseUrl = "http://localtemplates.snipcss.com/";
                    }else{
                        baseUrl = "https://templates.snipcss.com/";                        
                    }
                    scriptUrlOne = baseUrl + 'js/jquery-3.3.1.min.js';
                    scriptUrlTwo = baseUrl + 'js/tether.min.js';
                    scriptUrlThree = baseUrl + 'loadfile/templateElemListeners.js';
                    scriptUrlFour = baseUrl + 'loadfile/selectionBox.js';
                    scriptUrlFive = baseUrl + 'loadfile/template_iframe.js';
                    //var scriptUrlSix = chrome.runtime.getURL('js/options/template_iframe.js');
                    stylesheetOne = baseUrl + 'css/tether.css';
                    stylesheetTwo = baseUrl + 'css/tether-theme-basic.css';
                    stylesheetThree = baseUrl + 'css/template_iframe.css';                    
                }

                //var aScript = "<script> function mytest(){ console.log('a test'); }  window.onload = mytest();</script>";

                var iframeHtml = '<!DOCTYPE html>\n';                    
                iframeHtml += '<html>\n';
                iframeHtml += '   <head>\n';
                iframeHtml += '      <meta charset="utf-8">\n'; 
                iframeHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';                    
                iframeHtml += '      <script src="' + scriptUrlOne + '"></script>\n';
                iframeHtml += '      <script src="' + scriptUrlTwo + '"></script>\n';
                iframeHtml += '      <script src="' + scriptUrlThree + '"></script>\n';
                iframeHtml += '      <script src="' + scriptUrlFour + '"></script>\n';
                iframeHtml += '      <script src="' + scriptUrlFive + '"></script>\n';
        //        iframeHtml += '      <script src="' + scriptUrlSix + '"></script>\n';
                iframeHtml += '      <link rel="stylesheet" href="' + stylesheetOne + '">\n';  
                iframeHtml += '      <link rel="stylesheet" href="' + stylesheetTwo + '">\n';  
                iframeHtml += '      <link rel="stylesheet" href="' + stylesheetThree + '">\n';  
                iframeHtml += '      <style>\n';          
                iframeHtml += theCss;
                iframeHtml += '      </style>\n';                       
                iframeHtml += '   </head>\n';
                iframeHtml += '   <body>\n';
                iframeHtml += resultHtml;
                if(TEMPLATES.IFRAME_IS_LOADING){
                    iframeHtml += '<div id="theloader" class="loading-overlay is-active">' + 
                        '<span class="loader"></span>' + 
                    '</div>';
                }
                iframeHtml += '   </body>\n';
                iframeHtml += '</html>\n';        

                var anIframe = document.querySelector('#templatecode_iframe');

                anIframe.contentDocument.body.innerHTML = '';                
                anIframe.contentDocument.write(iframeHtml);
                TEMPLATES.IFRAME_BODY = iframeHtml;

                console.log("after iframe write");
                //ugh - better way?
                setTimeout(function(){            
                    
                    if(TEMPLATES.IN_EXTENSION){
                        document.getElementById('templatecode_iframe').contentWindow.doInitialize();
                        document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS); 
                        document.getElementById('templatecode_iframe').contentWindow.stopReloading(); 
                    }else{
                        //Need Mobile Icons on website wversion

                       templateLoadMobileIcons();                        
                    }
                }, 500);      

            }, 100);
                
                let paneSizes = [30, 70];
                if(!TEMPLATES.IN_EXTENSION){
                    paneSizes = [30,70];
                }
                Split(['#template_control_pane', '#template_preview_pane'], {
                       gutterSize: 20,
                       cursor: 'pointer',
                       direction: 'vertical',
                       sizes: paneSizes,
                       onDragStart: function(e){
                           console.log(e);
                       },
                       onDragEnd: function() {
                           TEMPLATES.refreshCodemirrorHeight();
                       }                   
                });
                var extraPanelId = '#templatecss_panel';
                /*
                if(!TEMPLATES.IN_EXTENSION){
                    extraPanelId = '#templatecss_panel';
                }*/
                if(!TEMPLATES.IN_EXTENSION){
                    var clientWidth = window.innerWidth || document.documentElement.clientWidth;
                    let myDirection = 'horizontal';
                    let myCursor = 'row-resize';
                    if(clientWidth < 750){
                        myDirection = 'vertical';
                        myCursor = 'col-resize';
                        $('#template_control_pane').css('height', '75%');
                        let newWidth = clientWidth - 20;
                        $('#template_code_panel').css('width', newWidth + "px");
                        $('#templatecss_panel').css('width', newWidth + "px");
                        $('#templatejson_panel').css('width', newWidth + "px");                        
                    }
                    
                    Split(['#template_code_panel', extraPanelId, '#templatejson_panel'], {
                        sizes: [35, 35, 30],
                        gutterSize: 20,
                        direction: myDirection,
                        cursor: myCursor,  
                        onDragEnd: function() {
                           TEMPLATES.refreshCodemirrorHeight();
                        }
                    });  
                }else{
                    Split(['#template_code_panel', '#templatejson_panel'], {
                        sizes: [50, 50],
                        gutterSize: 20,
                        cursor: 'row-resize',  
                        onDragEnd: function() {
                           TEMPLATES.refreshCodemirrorHeight();
                        }
                    });                      
                }
    /*
            Split(['#template_preview_pane', '#template_control_pane'], {
                sizes: [70, 30],
                gutterSize: 20,
                cursor: 'row-resize',  
                onDragEnd: function() {
                    //not made yet
                   //TEMPLATES.refreshCodemirrorHeight();
                }
            }); 

            Split(['#template_view_panel', '#template_code_panel'], {
                   gutterSize: 20,
                   cursor: 'pointer',
                   direction: 'vertical',
                   sizes: [70, 30],
                   onDragStart: function(e){
                       //console.log(e);
                   },
                   onDragEnd: function() {
                       TEMPLATES.refreshCodemirrorHeight();
                   }                   
            });

            Split(['#changetemplate_panel', '#templatejson_panel'], {
                   gutterSize: 20,
                   cursor: 'pointer',
                   direction: 'vertical',
                   sizes: [50, 50],
                   onDragStart: function(e){
                       console.log(e);
                   },
                   onDragEnd: function() {
                       //TEMPLATES.refreshCodemirrorHeight();
                   }                   
            });    
            */
        }else{
            if(reloadLabels){              
                setTimeout(function(){
                    /*
                    if(TEMPLATES.IFRAME_IS_LOADING){
                        resultHtml += '<div id="theloader" class="loading-overlay is-active">' + 
                            '<span class="loader"></span>' + 
                        '</div>';
                    }
                    */
                    document.getElementById('templatecode_iframe').contentWindow.replaceBody(resultHtml, theCss);             
                    document.getElementById('templatecode_iframe').contentWindow.stopReloading();   
                    document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS);                     
                },1000);
            }else{
                document.getElementById('templatecode_iframe').contentWindow.stopReloading();                   
            }
        }
        
        $('#template').hide();

        //TEMPLATES.refreshCodemirrorHeight();

        /*
        setTimeout(function(){
            var offset = $('#right_template_viewer').offset().top;
            var windowHeight = window.innerHeight;
            var remainingHeight = windowHeight - offset;

            $('#right_template_viewer').css('height', remainingHeight + "px");
            setTimeout(function(){
                TEMPLATES.refreshCodemirrorHeight();
            }, 500);
        }, 500);   
        */
        if(!TEMPLATES.IN_EXTENSION){
            TEMPLATES.REFRESH_ENGINE_DISPLAY();          
        }
        //TEMPLATES.loadTemplateList();   

    });
    //end ipsum filling callback
  });
  //end image promise callback
};

TEMPLATES.retrieveIpsumResults = function(ipsumCallback){
    
    if(Object.keys(TEMPLATES.IPSUM_VARIABLES).length <= 0){
        ipsumCallback({});
        return;
    }
    if(TEMPLATES.USE_IPSUM_SERVER){
        console.log('getting ispsum from server');        
        console.log(TEMPLATES.IPSUM_VARIABLES);
        API.LoremIpsonify(TEMPLATES.IPSUM_VARIABLES, TEMPLATES.IPSUM_THEME, function(retData){            
            console.log("response from server");
            console.log(retData);
            
            ipsumCallback(retData);
        });
    }else{
        ipsumCallback(TEMPLATES.fillIpsumFields());
    }               
};

TEMPLATES.templateFrameLoaded = function(){
    //didn't work
    //console.log("in template frame loaded");
    //document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS);     
};
/*
TEMPLATES.loadTemplateList = function(){
    
    if(location.protocol == "chrome-extension:"){    
        console.log("loading all templates");
        chrome.storage.local.get(['all_templates'], function(result) {
            let allTemplates = {};
            if(!result["all_templates"]){
                allTemplates['templates'] = new Array();
                allTemplates['total'] = 0;
            }else{
                allTemplates = result['all_templates'];
            }    
            let currTemplates = allTemplates['templates'];  
            if(currTemplates.length > 0){
                $('#existing_template_container').css('display', 'block');
            }else{
                $('#existing_template_container').css('display', 'none');
            }
            let templateListHtml = "";
            for(let x = 0; x < currTemplates.length; x++){
                let templateSlug = currTemplates[x];
                let linkToEdit = '<a href="#" data-templateslug="' + templateSlug + '" class="badge badge-dark load_template">' + templateSlug + '</a>';

                if(x == 0){
                    templateListHtml += linkToEdit;
                }else{
                    templateListHtml += '&nbsp;&nbsp;' + linkToEdit;
                }
            }
            $('#recent_templates').html(templateListHtml);
        });
    }
    
    
};
*/
TEMPLATES.button_handlers = function(){
    
    //load the options
    var templatesAutocreateRepeat = localStorage['autocreate_repeat'];
    var templatesAutocreateAll = localStorage['autocreate_all'];        
    if(templatesAutocreateRepeat && templatesAutocreateRepeat == 'no'){
        TEMPLATES.AUTOCREATE_REPEAT = false;
        $('#autocreate_repeat').prop("checked", false);
    }
    if(templatesAutocreateAll && templatesAutocreateAll == 'no'){
        TEMPLATES.AUTOCREATE_ALL = false;
        $('#autocreate_all').prop("checked", false);        
    }    
    $('body').on('click', '#template_options', function(e){
        e.preventDefault();
        MicroModal.show('modal-template-options');  
        return false;
    });

    $('body').on('change', '#autocreate_repeat', function(){
        if($('#autocreate_repeat').is(':checked')){        
            localStorage['autocreate_repeat'] = "yes";
        }else{
            localStorage['autocreate_repeat'] = "no";            
        }
    });    
    $('body').on('change', '#autocreate_all', function(){
        if($('#autocreate_all').is(':checked')){        
            localStorage['autocreate_all'] = "yes";
        }else{
            localStorage['autocreate_all'] = "no";            
        }
    });    
    $('body').on('click', '#snipcss_modal_closetemplateoptions', function(){
        MicroModal.close("modal-template-options"); 
        TEMPLATES.MODAL_NAME = "";
        TEMPLATES.MODAL_OPEN = false;
    });
    
    $('body').on('click', '#selectedipsum_text', function(){
        if($('#selectedipsum_check').is(":checked")){
            $('#selectedipsum_check').prop("checked", false);                        
        }else{
            $('#selectedipsum_check').prop("checked", "checked");            
        }
    });
    
    $('body').on('click', '.changeipsum', function(){
        var ipType = $(this).data('iptype');
        if(ipType == 'cats'){
            $('#selectedipsum_text').html("Cat Ipsum");
            TEMPLATES.IPSUM_THEME = 'cats';
            if(TEMPLATES.CURR_UID.length > 0){
                TEMPLATES.reloadTemplate(true);
            }else{
                toastr.error('Error!', 'Error changing ipsum');            
            }
        }
        else if(ipType == 'lorem'){
            $('#selectedipsum_text').html("Lorem Ipsum");
            TEMPLATES.IPSUM_THEME = 'lorem';
            if(TEMPLATES.CURR_UID.length > 0){
                TEMPLATES.reloadTemplate(true);
            }            
            $('#selectedipsum_check').prop("checked", false);      
        }
        else if(ipType == 'office'){
            $('#selectedipsum_text').html("Office Ipsum");
            TEMPLATES.IPSUM_THEME = 'office';
            if(TEMPLATES.CURR_UID.length > 0){
                TEMPLATES.reloadTemplate(true);
            }     
            $('#selectedipsum_check').prop("checked", false);      
        }        
    });
        
    
    $('body').on('click', '#create_new_template', function(){   
        alert("not used anymore");
        /*
        MicroModal.show('modal-create-template');  
        TEMPLATES.MODAL_OPEN = true;
        TEMPLATES.MODAL_NAME = 'modal-create-template';
        */
    });
    
    $('body').on("click", '#template_picklist', function(){        
        if(!$(this).hasClass('btn-is-selecting')){
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            $(this).addClass('btn-is-selecting');
            document.getElementById('templatecode_iframe').contentWindow.startListListener();            
            TEMPLATES.SELECTING_LIST = true;            
            TEMPLATES.SELECTING_ITEM = false;     
            TEMPLATES.SELECTING_EDIT = false;
            TEMPLATES.SELECTING_IPSONIFY = false;              
        }else{            
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;            
            TEMPLATES.SELECTING_EDIT = false;            
            TEMPLATES.SELECTING_IPSONIFY = false;              
            document.getElementById('templatecode_iframe').contentWindow.stopListListener();                    
        }
    });
    
    $('body').on("click", '#template_pickitem', function(){
        if(!$(this).hasClass('btn-is-selecting')){
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            $(this).addClass('btn-is-selecting');
            document.getElementById('templatecode_iframe').contentWindow.startItemListener();         
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = true; 
            TEMPLATES.SELECTING_EDIT = false;
            TEMPLATES.SELECTING_IPSONIFY = false;                          
        }else{
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;   
            TEMPLATES.SELECTING_EDIT = false;            
            TEMPLATES.SELECTING_IPSONIFY = false;              
            document.getElementById('templatecode_iframe').contentWindow.stopItemListener();                
        }
    });
    
    $('body').on("click", '#template_templatize', function(){
        let currTemplate = TEMPLATES.TEMPLATE_EDITOR.getDoc().getValue();
        
        let rootId = $(currTemplate).get(0).id;
        if(!rootId || rootId == "");
        {
            rootId = 'template-' + TEMPLATES.randomLetters(3);
            currTemplate = $(currTemplate).attr('id', rootId).wrap('<div>').parent().html();          
            console.log("added root id: " + rootId);
            console.log(currTemplate);
        }        
        TEMPLATES.SAVED_ID = rootId;
        
        
        if(currTemplate.indexOf('{{') >= 0){
            var res = confirm("Mustache variables already detected.  Are you sure you want to resend this template?");
            if(!res){
                return;
            }              
        }
        if(OPTIONS.API_KEY == ""){
            MicroModal.show('modal-user-feature');
            return;
        }
        TEMPLATES.START_FAKE_PROGRESS();
        
        API.getMustacheTemplateFromChatGPT(currTemplate, OPTIONS.API_KEY, function(retJson){
            clearInterval(TEMPLATES.BAR_INTERVAL);
            TEMPLATES.bar.animate(1.0);
            $('#bar_text').html('DONE');              
            
            if(retJson['success'] == 'true'){
                TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(retJson['response']);  
                //now we have to save it
                TEMPLATES.ALSO_SAVE_JSON = false;
                
                setTimeout(function(){
                    $('#save-template').trigger('click');
                    TEMPLATES.bar.destroy();
                    TEMPLATES.bar = null;
                    $('#bar_text').css('display', 'none');
                    $('#bar_container').empty();                    
                    
                }, 500);   
                
                if($('#chatgpt_tokens').html() != 'Unlimited*'){
                    $('#chatgpt_tokens').html(retJson['credits_left']);
                }                
                
            }else{
                alert(retJson['error']);
                setTimeout(function(){
                    TEMPLATES.bar.destroy();         
                    TEMPLATES.bar = null;
                    $('#bar_container').empty();                    
                    $('#bar_text').css('display', 'none');
                }, 500);                
            }  
        });
    });
    
    $('body').on("click", '#template_replace', function(){
        if(TEMPLATES.MODAL_OPEN){
            TEMPLATES.MODAL_OPEN = false;
            MicroModal.close(TEMPLATES.MODAL_NAME); 
        }        
        
        MicroModal.show('modal-template-replace');
        TEMPLATES.MODAL_OPEN = true;
        TEMPLATES.MODAL_NAME = 'modal-template-replace'; 
    });
    
    $('body').on("click", '#snipcss_template_replace', function(){
        let theVal = $('#templatereplace_option').val();
        if(theVal == 'images'){
            TEMPLATES.replaceImages();
        }
        else if(theVal == 'svg'){
            TEMPLATES.replaceSvg();
        }
        else if(theVal == 'icons'){
            TEMPLATES.replaceIcons();
        }
        else if(theVal == 'all'){
            TEMPLATES.replaceImages();
            TEMPLATES.replaceSvg();
            TEMPLATES.replaceIcons();            
        }
        
    });
    //API.getMustacheTemplateFromChatGPT
    
    $('body').on("click", '#template_edititem', function(){
        if(!$(this).hasClass('btn-is-selecting')){
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            $(this).addClass('btn-is-selecting');
            document.getElementById('templatecode_iframe').contentWindow.startEditListener();         
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;
            TEMPLATES.SELECTING_EDIT = true;     
            TEMPLATES.SELECTING_IPSONIFY = false;
        }else{
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;   
            TEMPLATES.SELECTING_EDIT = false;   
            TEMPLATES.SELECTING_IPSONIFY = false;            
            document.getElementById('templatecode_iframe').contentWindow.stopEditListener();                
        }
    });    
    
    $('body').on("click", '#template_editipsonify', function(){
        if(!$(this).hasClass('btn-is-selecting')){
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            $(this).addClass('btn-is-selecting');            
            document.getElementById('templatecode_iframe').contentWindow.startEditListener();         
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;
            TEMPLATES.SELECTING_EDIT = false;     
            TEMPLATES.SELECTING_IPSONIFY = true;              
        }else{
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            TEMPLATES.SELECTING_LIST = false;            
            TEMPLATES.SELECTING_ITEM = false;   
            TEMPLATES.SELECTING_EDIT = false;  
            TEMPLATES.SELECTING_IPSONIFY = false;             
            document.getElementById('templatecode_iframe').contentWindow.stopEditListener();                
        }
    });       
    
    $('body').on('change', '#snipcss_template_dropdown', function(){
        $('#template_information').css('display', 'none');
        var snippetUID = $(this).val();
        TEMPLATES.CURR_UID = snippetUID;
        
        TEMPLATES.resetFields();
        
        getSnippetByUID(snippetUID, function(snippet){
            TEMPLATES.TEMPLATE_NAME = snippet['snip_name'];        
            console.log("snippet html before appending to body");
            console.log(snippet['snip_html']);

            TEMPLATES.SNIPPET = snippet;

            if('element_dim' in snippet){
                TEMPLATES.ELEMENT_DIM = snippet['element_dim'];
            }
            
            if('template_code' in snippet){
                console.log("HAS TEMPLATE CODE");
                TEMPLATES.TEMPLATE_CODE = snippet['template_code'];
                TEMPLATES.SAVED_ID = snippet['template_id'];
                TEMPLATES.SAVED_TEMPLATE = true;
                $('.revert_container').css('display', 'block');
            }
            if('json_string' in snippet){
                try{
                    let jsonObject = JSON.parse(snippet['json_string']);
                    TEMPLATES.JSON_OBJECT = jsonObject;
                    TEMPLATES.SAVED_JSON = true;
                }catch(exx){
                    
                }
            }
            

            console.log("full snippet: ");
            console.log(snippet);

            $('#template').remove();
            TEMPLATES.$SNIPHTML = $(snippet['snip_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');
            //TEMPLATES.DISPLAY_CSS = TEMPLATES.$SNIPHTML.css('display');
            //TEMPLATES.$SNIPHTML.css('display','none');

            //console.log("snip html jquery ");
            //console.log(TEMPLATES.$SNIPHTML);
            console.log("the html");
            console.log(TEMPLATES.$SNIPHTML.get(0));

            TEMPLATES.SNIPCSS = snippet['snip_css'];
            TEMPLATES.SNIPHTML = snippet['snip_html'];
            TEMPLATES.SNIPUID = snippet['uid'];
            TEMPLATES.SNIPID = snippet['id'];

            TEMPLATES.AUTOCREATE_REPEAT = false; //$('#autocreate_repeat').is(":checked") ? true : false;
            TEMPLATES.AUTOCREATE_ALL = false; //$('#autocreate_all').is(":checked") ? true : false;

            //console.log("setting autogen for now");
            //TEMPLATES.AUTOCREATE_REPEAT = true;
            //TEMPLATES.AUTOCREATE_ALL = false;


            TEMPLATES.ALL_FIELDS = new Array();
            if(TEMPLATES.AUTOCREATE_REPEAT){
                console.log("getting repeat selectors");
                TEMPLATES.getTopRepeats();
                console.log("list selectors now");
                console.log(TEMPLATES.LIST_SELECTORS);

                //if have list selectors, get field items in that list
                TEMPLATES.processListSelectors(0);

                console.log("all fields");
                console.log(TEMPLATES.ALL_FIELDS);

            }

            if(TEMPLATES.AUTOCREATE_ALL){
                //create individual fields that are not in the list elements
                TEMPLATES.getTopItemFields();
            }
            TEMPLATES.initTemplateViewer(function(){
                TEMPLATES.reloadTemplate(true);
                TEMPLATES.saveTemplate(false);
                //$('#panel_template_name').html(TEMPLATES.TEMPLATE_NAME);
            });

            //get UID of snippet which is more permanent

            var languageVal = $('#newtemplate_language').val();
            if(TEMPLATES.MODAL_OPEN){
                TEMPLATES.MODAL_OPEN = false;
                MicroModal.close("modal-create-template"); 
            }

            
            
        });    
    });    
    
    $('body').on('click', '#save_template', function(){
        
        //what does saving template actually do???
        //so we send everything... the url
        if(TEMPLATES.IFRAME_BODY == null){
            alert("Make Template first");
            return;
        }
        //var chromeExtensionId = chrome.runtime.id;
        //if(chromeExtensionId != 'apjmkabfdhhkdgilinjfieakdkbblgpm'){
        //    console.log("Disabled for production");
        //    return;
        //}        
        var templateName = TEMPLATES.TEMPLATE_NAME;
        var originalUrl = TEMPLATES.SNIPPET['snip_url'];
        var originalSelector = TEMPLATES.SNIPPET['snip_selector'];
        var originalCss = TEMPLATES.SNIPPET['snip_css'];
        let noresponsiveCSS = '';
        if('snip_css_noresponsive' in TEMPLATES.SNIPPET){
            noresponsiveCSS = TEMPLATES.SNIPPET['snip_css_noresponsive'];
        }
        var originalHtml = TEMPLATES.SNIPPET['snip_html'];
        var originalFonts = TEMPLATES.SNIPPET['snip_fonturls'];
        var originalCustomFonts = TEMPLATES.SNIPPET['snip_customfonts'];
        
        console.log("original css");
        console.log(originalCss);
        TEMPLATES.getColorMapping(originalCss);
        console.log("template mapping after");
        console.log(TEMPLATES.ALL_COLORS);
        
        
        //should we list the template inserted images in these
        var hImages = "";
        var cImages = "";
        
        var paramsSave = {snip_name: templateName, 
            snip_url: originalUrl, 
            snip_selector: originalSelector, 
            snip_css: originalCss, 
            snip_himages: hImages,
            snip_cimages : cImages,             
            snip_iframe: "buildityourself", 
            snip_prehtml: originalHtml, 
            snip_html: TEMPLATES.RESULT_HTML, 
            snip_fonturls: originalFonts,
            snip_customfonts: originalCustomFonts,
            extension_token: OPTIONS.API_KEY};
                
        API.sendSnipcssData(paramsSave, function(dbSnipId){
            var iframeTemplateHtml = '<!DOCTYPE html>\n';                    
            iframeTemplateHtml += '<html>\n';
            iframeTemplateHtml += '   <head>\n';
            iframeTemplateHtml += '      <meta charset="utf-8">\n'; 
            iframeTemplateHtml += '      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />\n';             
            iframeTemplateHtml += '      <style>\n';          
            iframeTemplateHtml += originalCss;
            iframeTemplateHtml += '      </style>\n';                       
            iframeTemplateHtml += '   </head>\n';
            iframeTemplateHtml += '   <body>\n';
            iframeTemplateHtml += TEMPLATES.RESULT_HTML;
            iframeTemplateHtml += '   </body>\n';
            iframeTemplateHtml += '</html>\n';     
            
            //in case it's updated...
            let newMustache = TEMPLATES.TEMPLATE_EDITOR.getDoc().getValue();
            let newJson = TEMPLATES.JSON_EDITOR.getDoc().getValue();
            let newJsonObject = JSON.parse(newJson);
            
            let templateSave = {snip_id: dbSnipId,
                template_type: 'mustache',
                template_code: newMustache, 
                template_data: newJsonObject,
                template_css: originalCss,
                template_css_noresponsive: noresponsiveCSS,
                template_colors: TEMPLATES.ALL_COLORS,                
                template_iframe: iframeTemplateHtml,
                result_html: TEMPLATES.RESULT_HTML,
                element_dim: TEMPLATES.ELEMENT_DIM,
                template_fields: TEMPLATES.ALL_FIELDS,
                extension_token: OPTIONS.API_KEY
            };
            
            API.sendTemplateData(templateSave, function(dbTemplateId){
                TEMPLATES.TEMPLATE_DB_ID = dbTemplateId;
                alert("template db id set to " + TEMPLATES.TEMPLATE_DB_ID);
            });
        });
        
        
        
    });
    
    $('body').on('click', '#snipcss_modal_createtemplate', function(){
        alert("not used anymore");
        /*
        var templateName = $('#newtemplate_name').val();
        var snippetIndex = $('#newtemplate_snippet').val();
        if(templateName == ''){
            alert("Please enter a template name.");
            return;
        }
        TEMPLATES.TEMPLATE_NAME = templateName;
        var snippet = getSnippetByIndex(snippetIndex);      
        console.log("snippet html before appending to body");
        console.log(snippet['snip_html']);
        
        TEMPLATES.SNIPPET = snippet;
        $('#template').remove();
        TEMPLATES.$SNIPHTML = $(snippet['snip_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');
        //TEMPLATES.DISPLAY_CSS = TEMPLATES.$SNIPHTML.css('display');
        //TEMPLATES.$SNIPHTML.css('display','none');
        
        console.log("snip html jquery ");
        console.log(TEMPLATES.$SNIPHTML);
        console.log("the html");
        console.log(TEMPLATES.$SNIPHTML.get(0));
        
        TEMPLATES.SNIPCSS = snippet['snip_css'];
        TEMPLATES.SNIPHTML = snippet['snip_html'];
        TEMPLATES.SNIPUID = snippet['uid'];
        TEMPLATES.SNIPID = snippet['id'];
        
        TEMPLATES.AUTOCREATE_REPEAT = $('#autocreate_repeat').is(":checked") ? true : false;
        TEMPLATES.AUTOCREATE_ALL = $('#autocreate_all').is(":checked") ? true : false;
                
        //console.log("setting autogen for now");
        //TEMPLATES.AUTOCREATE_REPEAT = true;
        //TEMPLATES.AUTOCREATE_ALL = false;
        
        
        TEMPLATES.ALL_FIELDS = new Array();
        if(TEMPLATES.AUTOCREATE_REPEAT){
            console.log("getting repeat selectors");
            TEMPLATES.getTopRepeats();
            console.log("list selectors now");
            console.log(TEMPLATES.LIST_SELECTORS);
            
            //if have list selectors, get field items in that list
            TEMPLATES.processListSelectors(0);
            
            console.log("all fields");
            console.log(TEMPLATES.ALL_FIELDS);
            
        }
        
        if(TEMPLATES.AUTOCREATE_ALL){
            //create individual fields that are not in the list elements
            TEMPLATES.getTopItemFields();
        }
        TEMPLATES.initTemplateViewer(function(){
            TEMPLATES.reloadTemplate(true);
            TEMPLATES.saveTemplate(false);
            $('#panel_template_name').html(TEMPLATES.TEMPLATE_NAME);
        });
        
        //get UID of snippet which is more permanent
        
        var languageVal = $('#newtemplate_language').val();
        if(TEMPLATES.MODAL_OPEN){
            TEMPLATES.MODAL_OPEN = false;
            MicroModal.close("modal-create-template"); 
        }
        */
    });
    
    $('body').on('click', '#snipcss_modal_updatefield', function(e){
        e.preventDefault();
        var fieldIndex = TEMPLATES.EDIT_FIELD_INDEX;
        var subfieldIndex = TEMPLATES.EDIT_FIELD_SUBINDEX;
        var newFieldname = $('#existing_fieldname').val();
        if(newFieldname == ""){
            alert("You must enter a field name");
            return;
        }
        
        //editing root field 
        if(subfieldIndex == -1){
            //list root element... 
            TEMPLATES.ALL_FIELDS[fieldIndex]['label'] = newFieldname;
        }else{
            
            var newAttribute = $('#fieldproperty_attribute').val();
            if(newAttribute == ""){
                alert("Please select an attribute for the field");
                return;
            }
            console.log("new attribute");
            console.log(newAttribute);
            
            TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['label'] = newFieldname;
            TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['attribute'] = newAttribute;            
        }                
        
        MicroModal.close("modal-edit-field"); 
        TEMPLATES.MODAL_OPEN = false;
        TEMPLATES.initTemplateViewer(function(){
            TEMPLATES.reloadTemplate(false);
        });
        TEMPLATES.saveTemplate(true);   
    });

    $('body').on('click', '#delete_this_field', function(){
        var fieldIndex = TEMPLATES.EDIT_FIELD_INDEX;
        var subfieldIndex = TEMPLATES.EDIT_FIELD_SUBINDEX;

        if(subfieldIndex == -1){
            //list root element... 
            var res = confirm("Are you sure you want to delete this list field?  It will also delete any subfields associated with the list of items.")
            if(!res){
                return;
            }   
            TEMPLATES.ALL_FIELDS.splice(fieldIndex, 1);
        }else{
            var res = confirm("Are you sure you want to delete this sub field?");
            if(!res){
                return;
            }        
            TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'].splice(subfieldIndex, 1);            
        }      
        
        MicroModal.close("modal-edit-field"); 
        TEMPLATES.MODAL_OPEN = false;
        TEMPLATES.reloadTemplate(true);
        TEMPLATES.saveTemplate(true);        
    });
    
    $('body').on('click', '#create_this_field', function(){
        var isSubfield = TEMPLATES.NEWFIELD_IS_SUBFIELD;
        var subfieldIndex = TEMPLATES.NEWFIELD_SUBINDEX;
        var elem = TEMPLATES.NEWFIELD_ELEM;
        var myLevel = TEMPLATES.NEWFIELD_LEVEL;
        var theSelector = TEMPLATES.NEWFIELD_SELECTOR;
        var textContentArr = TEMPLATES.getNodeTextArr(elem);
        var textContent = TEMPLATES.getNodeText(elem);    
        var fieldAttr = $('#newfield_attribute').val();
        var fieldName = $('#newfield_field').val();
        if(!fieldAttr || fieldName.length <= 0){
            alert("Please select an attribute - it is the part of the element replaced by data from this field.");
            return;
        }
        if(!fieldName || fieldName.length <= 0){
            alert("Please enter a the variable name in the template.");
            return;
        }                       
        
        if(!isSubfield){
            //item field     
        
            var newItemObject = {
                 level: myLevel,
                 the_selector: theSelector,
                 field_type : 'item',
                 textnodearray: textContentArr,
                 orightml: elem.outerHTML,
                 attribute: fieldAttr
            };               
             newItemObject['label'] = fieldName;            
             newItemObject['field_name'] = fieldName;
             newItemObject['label_num'] = 1;            
             TEMPLATES.ALL_FIELDS.push(newItemObject);
        }else{            
            //list field
            var subitemField = TEMPLATES.getDefaultFieldObject();
            subitemField['selector'] = theSelector;
            subitemField['attribute'] = "text";
            subitemField['textnodearray'] = textContentArr;
            subitemField['orightml'] = elem.outerHTML;
            subitemField['label'] = fieldName;
            subitemField['label_num'] = 1;
            
            //alert("Added new item field in list index " + subfieldIndex);
            
            //console.log("adding text ");
            //console.log(fieldItem);
            TEMPLATES.ALL_FIELDS[subfieldIndex]['sub_fields'].push(subitemField);
        }
        
        console.log("after adding new field");
        console.log(TEMPLATES.ALL_FIELDS);
        
        MicroModal.close("modal-new-field"); 
        TEMPLATES.MODAL_OPEN = false;
        
        if(TEMPLATES.SELECTING_ITEM){
            document.getElementById('templatecode_iframe').contentWindow.stopItemListener();      
            $('.btn-is-selecting').removeClass('btn-is-selecting');
            TEMPLATES.SELECTING_ITEM = false;
        }
        if(TEMPLATES.SELECTING_LIST){
            document.getElementById('templatecode_iframe').contentWindow.stopListListener();            
            $('.btn-is-selecting').removeClass('btn-is-selecting');            
            TEMPLATES.SELECTING_LIST = false;            
        }
        
        TEMPLATES.reloadTemplate(true);
        TEMPLATES.saveTemplate(true);
    });
    
    $('body').on('click', '.load_template', function(){
        var templateSlug = $(this).data('templateslug');
        chrome.storage.local.get(['template-' + templateSlug], function(result) {
            console.log(result);
            var templateData = {};
            if(!result['template-' + templateSlug]){
                alert("Could not load Template");
                return;
            }
            templateData = result['template-' + templateSlug];
            //$('#panel_template_name').html(templateData['template_name']);
            
            console.log("template data");
            console.log(templateData);
            TEMPLATES.ALL_FIELDS = templateData['all_fields'];
            TEMPLATES.SNIPUID = templateData['original_uid'];
            TEMPLATES.SNIPID = templateData['original_id'];
            TEMPLATES.TEMPLATE_CODE = templateData['template_code'];
            TEMPLATES.TEMPLATE_JSON = templateData['template_data'];
            $('#template').remove();
            TEMPLATES.$SNIPHTML = $(templateData['template_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');
            TEMPLATES.SNIPCSS = templateData['template_css'];
            TEMPLATES.SNIPHTML = templateData['template_html'];
            TEMPLATES.TEMPLATE_NAME = templateData['template_name'];
            TEMPLATES.TEMPLATE_LANGUAGE = templateData['template_language'];        
            
            TEMPLATES.initTemplateViewer(function(){
                TEMPLATES.reloadTemplate(true);
            });
            
        });
    });
    
    $('body').on('click', '#set_template_items', function(e){
        e.preventDefault();        
        console.log("setting number of template list items");
        let numberListItems = parseInt($('#default_num_listitems').val());
        if(numberListItems < 1 || numberListItems > 100){
            alert("Enter a valid number of list items between 1 and 100");
            return;
        }
        TEMPLATES.DEFAULT_NUM_LISTITEMS = numberListItems;        
        MicroModal.close("modal-set-item-amount");    
        TEMPLATES.MODAL_OPEN = false;
        
        setTimeout(function(){
            TEMPLATES.reloadTemplate(true);
            TEMPLATES.saveTemplate(true);
        }, 100);        
    });
    
    $('body').on('click', '#revert_template', function(){
        TEMPLATES.TEMPLATE_CODE = "";        
        delete TEMPLATES.SNIPPET['template_code'];
        if('json_string' in TEMPLATES.SNIPPET){
            delete TEMPLATES.SNIPPET['json_string'];            
        }
        TEMPLATES.SAVED_ID = "";
        TEMPLATES.SAVED_TEMPLATE = false;
        TEMPLATES.SAVED_JSON = false;
        
        updateSnippet(TEMPLATES.SNIPUID, TEMPLATES.SNIPPET, function(){
            TEMPLATES.reloadTemplate(true);
        });         
    });
    
    $('#value_random,#value_custom').change(function(e) {
        if (this.value == "random") {
            $('#set_element_custom_value').prop( "disabled", true );            
            $('#set_element_custom_value').addClass('input-disabled');            
        }else if (this.value == "custom") {

            $('#set_element_custom_value').prop( "disabled", false );            
            $('#set_element_custom_value').removeClass('input-disabled');            
            $('#set_element_custom_value').focus();
        }

    });    
    
    $('body').on('click', '#snipcss_modal_setelementdata', function(e){
        e.preventDefault();    
        var dataSelector = TEMPLATES.SET_DATA_SELECTOR;
        let editAttr = $('#setelement_edit_attribute').val();
        //these two things are same always?
        //console.log(TEMPLATES.SNIPHTML);
        //console.log(TEMPLATES.SNIPPET['snip_html']);
        
        //TEMPLATES.SNIPPET['snip_html']        
        //don't we need to remove the template again
        //$('#template').remove();
        //TEMPLATES.$SNIPHTML = $(snippet['snip_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');        

        let overrideValue = '';
        if($('#value_custom').is(":checked")){
            overrideValue = $('#set_element_custom_value').val();  
        }
        
        if($('#editing_html').length <= 0){
            $(TEMPLATES.SNIPHTML).wrap('<div>').parent().appendTo('body').attr('id', 'editing_html');
        }        
        let aPromise = TEMPLATES.SINGLE_IPSUM_REPLACEMENT(dataSelector, editAttr, overrideValue); 
        //give it a sec
        aPromise.then((retObj) => {
            console.log("done editing single... cleaning up");
            $('#editing_html').remove();
            $('#template').remove();
            TEMPLATES.$SNIPHTML = $(TEMPLATES.SNIPPET['snip_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');            
            
            document.getElementById('templatecode_iframe').contentWindow.startReloading();
            setTimeout(function(){
                TEMPLATES.reloadTemplate(true);
                TEMPLATES.saveTemplate(true);                            
            }, 50);
        });        
    });
    
    $('body').on('click', '#settemplate_reactjs', function(){
        
        if(!$(this).hasClass('active_convert')){
            alert("You must convert to a mustache template before transforming into a React component");
            return;
        }
        
        let currTemplate = TEMPLATES.TEMPLATE_EDITOR.getDoc().getValue();
        let defaultName = TEMPLATES.getDefaultComponentName();
        if(TEMPLATES.COMPONENT_NAME == ''){
            TEMPLATES.COMPONENT_NAME = defaultName;
        }
        TEMPLATES.START_FAKE_PROGRESS();
        
        //alert("getting react");
        
        API.getReactFromChatGPT(currTemplate, TEMPLATES.JSON_OBJECT, TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(retJson){
            console.log("retjson");
            console.log(retJson);
            $('.snipmirror-switch-template').html("ReactJS");
            //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
            TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "jsx");
            if(retJson['success'] == 'true'){
                //alert("got response " + retJson['response']);
                TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(retJson['response']);  
                //now we have to save it

                setTimeout(function(){
                    TEMPLATES.bar.destroy();                 
                    TEMPLATES.bar = null;
                    $('#bar_text').css('display', 'none');
                    $('#bar_container').empty();                     
                }, 500);               
                if($('#chatgpt_tokens').html() != 'Unlimited*'){
                    $('#chatgpt_tokens').html(retJson['credits_left']);
                }                
            }else{
                alert("Error" + retJson['error']);
                setTimeout(function(){
                    TEMPLATES.bar.destroy();   
                    TEMPLATES.bar = null;
                    $('#bar_container').empty();                   
                    $('#bar_text').css('display', 'none');
                }, 500);                
            }               

        });        
        
        //my code version
        /*
        if(!OPTIONS.PRO_USER){
            MicroModal.show('modal-pro-feature'); 
            return;
        }

        OPTIONS.TEMPLATE_ENGINE = "react";
        let storageArr = new Array();
        storageArr['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        setOptionStorage(storageArr, function(){
            console.log("template engine set to " + OPTIONS.TEMPLATE_ENGINE);
        });
        localStorage['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        TEMPLATES.REFRESH_ENGINE_DISPLAY();
        
        
        let templateCode = TEMPLATES.TEMPLATE_CODE;
        $('#mymustache').remove();
        $(templateCode).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');

        let defaultName = TEMPLATES.getDefaultComponentName();
        if(TEMPLATES.COMPONENT_NAME == ''){
            TEMPLATES.COMPONENT_NAME = defaultName;
        }
        
        setTimeout(function(){
            let retHtml = TEMPLATES.reactifyMustacheHtml();
            
            API.getReactComponentFromTemplate(retHtml, TEMPLATES.ALL_FIELDS, TEMPLATES.JSON_OBJECT, 
                TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(result){
                $('.snipmirror-switch-template').html("ReactJS");
                //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
                TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "jsx");
                let theError = result['errors'];
                let theFiles = result['files'];
                for(let f = 0; f < theFiles.length; f++){
                    let aFile = result['files'][f];
                    let filedata = aFile['data'];
                    let filename = aFile['name'];
                    if(f == 0){
                        $('.snipmirror-switch-template').html("ReactJS - " + filename);
                        TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(filedata); 
                    }
                }   
                
            });
        }, 100);
        */
    });
    
    $('body').on('click', '#settemplate_vuejs', function(){
        
        if(!$(this).hasClass('active_convert')){
            alert("You must convert to a mustache template before transforming into a VueJS component");
            return;
        }        
        let currTemplate = TEMPLATES.TEMPLATE_EDITOR.getDoc().getValue();
        let defaultName = TEMPLATES.getDefaultComponentName();
        if(TEMPLATES.COMPONENT_NAME == ''){
            TEMPLATES.COMPONENT_NAME = defaultName;
        }
        TEMPLATES.START_FAKE_PROGRESS();
        
        //alert("getting vue");
        
        API.getVueFromChatGPT(currTemplate, TEMPLATES.JSON_OBJECT, TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(retJson){
            console.log("retjson");
            console.log(retJson);
            $('.snipmirror-switch-template').html("Vue");
            //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
            TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "vue");
            if(retJson['success'] == 'true'){
                //alert("got response " + retJson['response']);
                TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(retJson['response']);  
                //now we have to save it

                setTimeout(function(){
                    $('#bar_text').css('display', 'none');
                    $('#bar_container').empty();  
                    TEMPLATES.bar.destroy();     
                    TEMPLATES.bar = null;
                }, 500);      
                
                if($('#chatgpt_tokens').html() != 'Unlimited*'){
                    $('#chatgpt_tokens').html(retJson['credits_left']);
                }
                
            }else{
                alert("Error" + retJson['error']);
                setTimeout(function(){
                    $('#bar_container').empty();
                    TEMPLATES.bar.destroy();           
                    TEMPLATES.bar = null;
                    $('#bar_text').css('display', 'none');
                }, 500);                
            }               

        });        
                
        /*
        let templateCode = TEMPLATES.TEMPLATE_CODE;
        if(!OPTIONS.PRO_USER){
            MicroModal.show('modal-pro-feature'); 
            return;
        }        
        OPTIONS.TEMPLATE_ENGINE = "vue";
        TEMPLATES.REFRESH_ENGINE_DISPLAY();
        
        localStorage['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        let storageArr = new Array();
        storageArr['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        setOptionStorage(storageArr, function(){
            console.log("template engine set to " + OPTIONS.TEMPLATE_ENGINE);
        });
        
        $('#mymustache').remove();
        $(templateCode).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');

        let defaultName = TEMPLATES.getDefaultComponentName();
        if(TEMPLATES.COMPONENT_NAME == ''){
            TEMPLATES.COMPONENT_NAME = defaultName;
        }
        
        setTimeout(function(){
            //dont need to modify vue at all here... we'll just do it PHP side
            let vueHtml = $('#mymustache').get(0).innerHTML;
            
            ///let retHtml = TEMPLATES.reactifyMustacheHtml();
            
            API.getVueComponentFromTemplate(vueHtml, TEMPLATES.ALL_FIELDS, TEMPLATES.JSON_OBJECT, 
                TEMPLATES.COMPONENT_NAME, OPTIONS.API_KEY, TEMPLATES.TEMPLATE_DB_ID, function(result){
                    $('.snipmirror-switch-template').html("VueJS");
                    //TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE); 
                    TEMPLATES.TEMPLATE_EDITOR.setOption("mode", "vue");
                    let theError = result['errors'];
                    let theFiles = result['files'];
                    for(let f = 0; f < theFiles.length; f++){
                        let aFile = result['files'][f];
                        let filedata = aFile['data'];
                        let filename = aFile['name'];
                        if(f == 0){
                            $('.snipmirror-switch-template').html("VueJS - " + filename);
                            TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(filedata); 
                        }
                    }                  
            });
        }, 100);
        */
    });    
    
    $('body').on('click', '#settemplate_mustache', function(){
        let templateCode = TEMPLATES.TEMPLATE_CODE;  
        OPTIONS.TEMPLATE_ENGINE = "mustache";
        TEMPLATES.REFRESH_ENGINE_DISPLAY();
        
        localStorage['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        let storageArr = new Array();
        storageArr['template_engine'] = OPTIONS.TEMPLATE_ENGINE;
        setOptionStorage(storageArr, function(){
            console.log("template engine set to " + OPTIONS.TEMPLATE_ENGINE);
        });
    });
    
    if(!TEMPLATES.IN_EXTENSION){
        //handlers for website version
        $('body').on('click', '.snipmirror-tab', function(){
            
            let tabName = this.id.split("_")[1];
            if(tabName == 'mustache' || tabName == 'html' || tabName == 'react' || tabName == 'vue'){
                //first tab section
                if(tabName == 'mustache'){
                    //alert("setting to mustache");
                    console.log("setting editor to-mustache ");
                    console.log(TEMPLATES.TEMPLATE_CODE);                    
                    TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.TEMPLATE_CODE);  
                    TEMPLATES.WEBSITE_FIRST_MIRROR_TAB = 'mustache';
                }
                else if(tabName == 'html'){
                    console.log("setting editor to-html ");
                    console.log(TEMPLATES.RESULT_HTML);
                    TEMPLATES.TEMPLATE_EDITOR.getDoc().setValue(TEMPLATES.RESULT_HTML);                      
                    TEMPLATES.WEBSITE_FIRST_MIRROR_TAB = 'html';                    
                }
                else if(tabName == 'react'){
                    TEMPLATES.WEBSITE_FIRST_MIRROR_TAB = 'react';                    
                }
                else if(tabName == 'vue'){
                    TEMPLATES.WEBSITE_FIRST_MIRROR_TAB = 'vue';                                        
                }
                $(this).parent().find('.snipmirror-tabselected').removeClass('snipmirror-tabselected');
                $(this).addClass('snipmirror-tabselected');                
            }
            
        });
    }
    
    
    //TEMPLATES.loadTemplateList();
    
};

//for if you already have field created with sampleData, and want to label the extra html list items
TEMPLATES.labelListSelectors = function(){
    //var b = 0;
    console.log("labeling list selectors");
    
    for(var f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
        let aField = TEMPLATES.ALL_FIELDS[f];
        console.log("A FIELD");
        console.log(aField);        
        if(aField['field_type'] == 'item'){
            continue;
        }
        let extraRepeatName = "";    
        if(f >= 1){
            extraRepeatName = "_" + f;
        }
        let fieldListName = aField['field_name'];
        //b++;
        let useChildren = false;
        let theSelector = aField['the_selector'];
        console.log("the selector is " + theSelector);        
        if(theSelector.indexOf("children=") !== -1){
            theSelector = theSelector.split("=")[1];
            useChildren = true;
        }
        let repeatItem = null;
        let $allItems = null;
        if(useChildren){
            if($('#template').children(theSelector).length > 0){
                repeatItem = $('#template').children(theSelector).get(0);
                $allItems = $('#template').children(theSelector);
            }
        }else{
            if($(theSelector).length > 0){
                repeatItem = $(theSelector).get(0);
                $allItems = $(theSelector);                            
                console.log("repeatitem ");
                console.log(repeatItem);
                
            }                        
        }                    
        if(repeatItem == null){
            console.log("error bad list field no longer works was created");
            console.log(aField);
            toastr.error('Error!', 'Bad list field');
            //alert("Error: Bad list field");
            return;
        }       
        if(TEMPLATES.DEFAULT_NUM_LISTITEMS <= 1 && $allItems.length > 1){
            TEMPLATES.DEFAULT_NUM_LISTITEMS = $allItems.length;
            if($('#default_num_listitems').length > 0){
                $('#default_num_listitems').val(TEMPLATES.DEFAULT_NUM_LISTITEMS);
            }
        }
        $allItems.each(function(){

            if(this == repeatItem){
            console.log("adding class " + 'sniptemplate_repeater' + extraRepeatName);
            console.log(this);                
                $(this).addClass('sniptemplate_repeater' + extraRepeatName);
                return;
            }
            //TEMPLATES.getNewListItems(listSelector['sub_fields'], this);
            console.log("adding class " + 'sniptemplate_sibling' + extraRepeatName);
            console.log(this);              
            $(this).addClass('sniptemplate_sibling' + extraRepeatName);
        });    
        console.log("labeling of list sibling elements done done");        
    }
};

//for if you don't have field created already 
TEMPLATES.processListSelectors = function(startIndex){
    console.log("processlistselectors index " + startIndex);
    if(TEMPLATES.LIST_SELECTORS.length){
        for(var b = startIndex; b < TEMPLATES.LIST_SELECTORS.length; b++){

            var extraRepeatName = "";
            var fieldListName = "items";
            if(b >= 1){
                extraRepeatName = "_" + b;
                if(b == 1){
                    fieldListName = "elements";
                }
                if(b == 2){
                    fieldListName = "units";
                }
                if(b == 3){
                    fieldListName = "entities";
                }
            }
            var listSelector = TEMPLATES.LIST_SELECTORS[b]; 
            console.log("listsselector");
            console.log(listSelector);
            listSelector['field_type'] = "list";
            listSelector['field_name'] = fieldListName;
            listSelector['sub_fields'] = new Array();
            //xxx
            var useChildren = false;
            //console.log("the selector is " + theSelector);
            var theSelector = listSelector['the_selector'];
            if(theSelector.indexOf("children=") !== -1){
                theSelector = theSelector.split("=")[1];
                useChildren = true;
            }
            var repeatItem = null;
            var $allItems = null;
            if(useChildren){
                if($('#template').children(theSelector).length > 0){
                    repeatItem = $('#template').children(theSelector).get(0);
                    $allItems = $('#template').children(theSelector);
                }
            }else{
                if($(theSelector).length > 0){
                    repeatItem = $(theSelector).get(0);
                    $allItems = $(theSelector);                            
                }                        
            }                    
            if(repeatItem == null){
                console.log("error bad repeating selector was created");
                console.log(listSelector);
                //alert("Error: Bad repeating selector");
                toastr.error('Error!', 'Bad repeating selector');
                return;
            }

            console.log("getting all fields for ");
            console.log(listSelector['the_selector']);
            console.log("and repeat item:");
            console.log(repeatItem);

            listSelector['sub_fields'] = TEMPLATES.repeatItemFields(listSelector['the_selector'], repeatItem);

            //label repeat items
            //ADD NEW FIELDS FOR EACH OF THE OTHER ITEMS... 
            $allItems.each(function(){
                if(this == repeatItem){
                    $(this).addClass('sniptemplate_repeater' + extraRepeatName);
                    return;
                }
                //TEMPLATES.getNewListItems(listSelector['sub_fields'], this);
                $(this).addClass('sniptemplate_sibling' + extraRepeatName);
            });


            console.log("the fields we got:");
            console.log(listSelector['sub_fields']);

            TEMPLATES.ALL_FIELDS.push(listSelector);
        }
    }else{
        console.log("no list selectors processed");
    }    
}

TEMPLATES.getRepeatingParent = function(elem){
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
        console.log("of " + parentTag + " currParent ");
        console.log(currParent);
        if(parentTag.indexOf(':') >= 0){
            return getRepeatingParent(currParent);	
        }
        console.log("child count " + childrenCount);
            
    if(parentTag != 'span'){
        var sibLength = $(currParent).siblings(parentTag).length;
        console.log("sibling count " + sibLength);
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
};

TEMPLATES.repeatItemFields = function(listSelector, repeatItem){
    
    var alreadyProcessed = new Array();
    var allFields = new Array();
    
    //originally for scrapehawk    
    $(repeatItem).find("*").each(function(){
        for(var m = 0; m < alreadyProcessed.length; m++){
            var testElem = alreadyProcessed[m];
            if(testElem == this){
                //console.log("found existing element ");
                //console.log(this);
                return;
            }
        }
        console.log("process tag ");
        console.log(this);
        
        try{
        fieldItem = {};
        var itemElem = this;
        var lowerTag = this.tagName.toLowerCase();
        
        //this is going to be diffcult, you might have...
        //lorem ipsum <span>pimping some</span> more ipsum 
        //does that result in 
        //{{ipsum1}}<span>{{pimpsome}}</span>{{ipsum2}}
        //or {{ipsum}} <span>{{pimpsome}}</span>
        //or just {{ipsum}}
        var textContentArr = TEMPLATES.getNodeTextArr(itemElem);
        
        
        var textContent = TEMPLATES.getNodeText(itemElem);
        hasHref = false;
        hasImg = false;
        hasBackgroundImg = false;
        hasVideo = false;
        if(lowerTag == 'a'){
            var href = $(itemElem).attr('href');
            if(typeof href !== typeof undefined && href !== false && href !== "" &&
                    href.indexOf("javascript:") === -1 && href.indexOf("#") !== 0){
                hasHref = true;
            }
        }
        if(lowerTag == 'img'){
            var src = $(itemElem).attr('src');
            if(typeof src !== typeof undefined && src !== false && src !== "" && 
                    src.length > 0){
                hasImg = true;
            }
        }
        if(lowerTag == 'video'){
            $(itemElem).find('source').each(function(){
                //console.log($(this).attr('src'));        // i am not getting this..
                var strSrc = $(this).attr('src'); 
                var strExtenion = strSrc.substring(strSrc.lastIndexOf('.'));
                hasVideo = true;
                //alert("has video");
           }); 
        }          
        if(lowerTag == 'div'){
            var bg = $(this).css('background-image');
            if(bg !== 'none' && bg.indexOf('url') !== -1){
                bg = TEMPLATES.getBackgroundUrl(bg);
                //alert("background image: " + bg);        
                hasBackgroundImg = true;
            }
        }
        
        var extractSelector = "";
        if(textContent.length > 0 || hasImg || hasHref || hasBackgroundImg || hasVideo){
            extractSelector = getCorrectExtractSelector(listSelector, repeatItem, itemElem);
            if(extractSelector == null){
                console.log("could not find extract selector");
                return;
            }
        }                       
        
        if(textContent.length > 0){
            fieldItem = TEMPLATES.getDefaultFieldObject();
            fieldItem['selector'] = extractSelector;
            fieldItem['attribute'] = "text";
            fieldItem['textnodearray'] = textContentArr;
            fieldItem['orightml'] = itemElem.outerHTML;
            
            var style = window.getComputedStyle(itemElem, null).getPropertyValue('font-size');
            var fontSize = parseFloat(style); 
            if(fontSize < 15.0 || textContent.length > 150){
                if(TEMPLATES.TEXTNUM == 1){
                    fieldItem['label'] = "text";
                }else{
                    fieldItem['label'] = "text" + TEMPLATES.TEXTNUM;             
                }                
                
                fieldItem['label_num'] = TEMPLATES.TEXTNUM;
                TEMPLATES.TEXTNUM++;
            }else{
                if(TEMPLATES.TITLENUM == 1){
                    fieldItem['label'] = "title";
                }else{
                    fieldItem['label'] = "title" + TEMPLATES.TITLENUM;           
                }                    

                fieldItem['label_num'] = TEMPLATES.TITLENUM;            
                TEMPLATES.TITLENUM++;                                
            }
            //console.log("adding text ");
            //console.log(fieldItem);

            allFields.push(fieldItem);                                   
        }

        if(hasHref){
            fieldItem = TEMPLATES.getDefaultFieldObject();
            fieldItem['selector'] = extractSelector;
            fieldItem['attribute'] = "href";
            if(TEMPLATES.LINKNUM == 1){
                fieldItem['label'] = "link";   
            }else{
                fieldItem['label'] = "link" + TEMPLATES.LINKNUM;                   
            }
            fieldItem['label_num'] = TEMPLATES.LINKNUM;   
            fieldItem['orightml'] = itemElem.outerHTML;


            TEMPLATES.LINKNUM++;
            allFields.push(fieldItem);                                   
        }
        if(hasImg){
            fieldItem = TEMPLATES.getDefaultFieldObject();
            fieldItem['selector'] = extractSelector;
            fieldItem['attribute'] = "src";
            if(TEMPLATES.IMGNUM == 1){
                fieldItem['label'] = "image";  
            }else{
                fieldItem['label'] = "image" + TEMPLATES.IMGNUM;               
            }
            
                   
            fieldItem['label_num'] = TEMPLATES.IMGNUM;   
            fieldItem['orightml'] = itemElem.outerHTML;

            TEMPLATES.IMGNUM++;
            allFields.push(fieldItem);                                   
        }
        if(hasVideo){
            fieldItem = TEMPLATES.getDefaultFieldObject();
            fieldItem['selector'] = extractSelector;
            fieldItem['attribute'] = "sources";
            if(TEMPLATES.VIDNUM == 1){
                fieldItem['label'] = "vid";  
            }else{
                fieldItem['label'] = "vid" + TEMPLATES.VIDNUM;             
            }            
     
            fieldItem['label_num'] = TEMPLATES.VIDNUM;   
            fieldItem['orightml'] = itemElem.outerHTML;

            TEMPLATES.VIDNUM++;
            allFields.push(fieldItem);                                 
        }
        
        if(hasBackgroundImg){
            fieldItem = getDefaultListFieldObject();
            fieldItem['selector'] = extractSelector;
            fieldItem['attribute'] = "background-image";           
            fieldItem['label'] = "image" + TEMPLATES.IMGNUM;         
            fieldItem['label_num'] = TEMPLATES.IMGNUM;   
            fieldItem['orightml'] = itemElem.outerHTML;

            TEMPLATES.IMGNUM++;
            allFields.push(fieldItem);                                           
        }
        
        }catch(ex){
            console.log("SNIPCSS - there was an error");
            console.log(ex);
        }
        alreadyProcessed.push(this);

    });
    
    return allFields;
};    
    
    TEMPLATES.getAllClassnames = function(elem){
        
        //svg elements need getAttribute, not elem.className
        var theClasses = elem.getAttribute('class');      
        if(theClasses == null){
            theClasses = "";
        }
        var elemClassnames = theClasses.split(/\s+/);
        //var elemClassnames = elem.className.split(/\s+/);
        
        $(elem).find('*').each(function(){    
            var mClasses = this.getAttribute('class');          
            if(mClasses == null){
                mClasses = "";
            }
            var moreClassnames = mClasses.split(/\s+/);
            //var moreClassnames = this.className.split(/\s+/);
            for(let x = 0; x < moreClassnames.length; x++){
                if($.inArray(moreClassnames[x], elemClassnames) !== -1){
                    elemClassnames.push(moreClassnames[x]);
                }
            }
            
        });    
        
        return elemClassnames;        
    };
    
    TEMPLATES.addListSelector = function(listElem, theLevel){
        let doNotAdd = false;
        var repeatTag = listElem.nodeName.toLowerCase();
        console.log("trying to get correct repeat selector for ");
        console.log(listElem);
        //let myParentContainer = $(listElem).parent().get(0);
        //let parentSelector = getCorrectSelector(myParentContainer);
        //myParentContainer
        
        //changed from 
        //var parentSelector = getCorrectRepeatSelector(listElem, TEMPLATES.$SNIPHTML.get(0));
        //to this...
        let parentSelector = getUniqueParentSelector(listElem, []);
        
        if(parentSelector == null){
            alert("Could not add because parent selector");
            return;
        }
        var mySelector = parentSelector + " > " + repeatTag;
        
        //if(parentSelector.indexOf('#template') >= 0){
        //    alert("Using children");
        //    mySelector = "children=" + repeatTag;
        //}

        console.log("correct repeat selector333");
        console.log(mySelector);

        var newListObject = {
            level: theLevel,
            the_selector: mySelector
        };         
        
        if(TEMPLATES.LIST_SELECTORS.length > 0){              
            var removedSome = false;
            var removedListSelectorArr = new Array();
            //if another list selector contains it then dont add
            //if this contains another list selector and is higher level
            for(var s = 0; s < TEMPLATES.LIST_SELECTORS.length; s++){
                var existingSelectObject = TEMPLATES.LIST_SELECTORS[s];
                var existingSelector = existingSelectObject['the_selector'];
                if(existingSelector == mySelector){
                    //duplicate how?
                    doNotAdd = true;
                    break;
                }

                var existingLevel = existingSelectObject['level'];
                var removeThis = false;
                TEMPLATES.$SNIPHTML.find(existingSelector).each(function(){
                    console.log("this contains");
                    console.log(this);
                    console.log("listelem");
                    console.log(listElem);
                    //should use includes
                    if($.contains(this, listElem)){
                        doNotAdd = true;
                    }
                    if($.contains(listElem, this)){
                        //remove the other one
                        removedSome = true;                           
                        removeThis = true;
                    }
                });
                if(!removeThis){
                    removedListSelectorArr.push(existingSelectObject);
                }
            }               
        }
        if(doNotAdd){
            console.log("this element not added");
            console.log(listElem);
            console.log("because existing");
            console.log(TEMPLATES.LIST_SELECTORS);
            console.log("didn't add");
            return false;
        }
        console.log("existing length " + TEMPLATES.LIST_SELECTORS.length);
        console.log("adding new list object");
        console.log(newListObject);
        TEMPLATES.LIST_SELECTORS.push(newListObject);           
        return true;
    };    
    
    
    TEMPLATES.getTopItemFields = function(){

       console.log("Getting top item fields");
       let existingFieldParents = new Array();
       var rootElem = TEMPLATES.$SNIPHTML.get(0);
       console.log("add fields ");
       console.log(TEMPLATES.ALL_FIELDS);
       
       for(let x = 0; x < TEMPLATES.ALL_FIELDS.length; x++){
           var aField = TEMPLATES.ALL_FIELDS[x];
           
           var mySelector = aField['the_selector'];
           if(aField['field_type'] == 'list'){
               console.log("finding " + mySelector);
               let firstElem = TEMPLATES.$SNIPHTML.find(mySelector).get(0);
               
               var parentElem = $(firstElem).parent().get(0);
               if(typeof parentElem === 'undefined'){
                   //alert("bad list elemXXXX");
                   console.log("bad " + mySelector);
                   return;
               }
               
               console.log("parent element of list");
               console.log(parentElem);
               existingFieldParents.push(parentElem);
           }
           else if(aField['field_type'] == 'item'){
              let firstElem = TEMPLATES.$SNIPHTML.find(mySelector).get(0);
               if(typeof firstElem === 'undefined'){
                   //alert("bad item elem");
                   console.log("bad " + mySelector);
                   return;
               }
              
              existingFieldParents.push(firstElem);
           }
       }
        
       let processedNodes = new Array(); 
       console.log("root ");
       console.log(rootElem);
       TEMPLATES.$SNIPHTML.find('*').each(function(){    
           console.log("this");
           console.log(this);
           var alreadyIsField = false;
           for(var m = 0; m < existingFieldParents.length; m++){
               var container = existingFieldParents[m];
               console.log("existing field parent");
               console.log(container);
                //should use includes
               if($.contains( container, this )){
                   alreadyIsField = true;
               }               
           }
           if(alreadyIsField){
               return;
           }
           var myLevel = 1;
           var $myParent = $(this).parent();
           while($myParent.get(0) != rootElem){
               console.log("going up");
               console.log($myParent.get(0));
               
               $myParent = $myParent.parent();
               myLevel++;
               if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
                   break;
               }
           }   
           let tagName = this.nodeName.toLowerCase();
           if(tagName == 'path' || tagName == 'rect' || tagName == 'circle' ||
               tagName == 'ellipse' || tagName == 'line' || tagName == 'polyline' ||
               tagName == 'polygon' || tagName == 'svg' || tagName == 'foreignobject' || tagName == 'defs'){
                   return;
               //console.log("skipping svg");
           }                
           if($(this).parents('svg').length > 0){
               return;
           }
           
           
           console.log("trying to get selector of");
           console.log(this);
           console.log("with tagname " + tagName);
           var itemSelector = getCorrectSelector(this);
           //alert("item selector is " + itemSelector);
           
           
           var desiredAttribute = 'text';
           if(tagName == 'h1' || tagName == 'h2' || tagName == 'h3' || tagName == 'h4' || tagName == 'h5' || tagName == 'h6'){
               desiredAttribute = "text";
               var textContentArr = TEMPLATES.getNodeTextArr(this);
               var theText = TEMPLATES.getNodeText(this);
               if(theText.length > 3){
                    var newItemObject = {
                         level: myLevel,
                         the_selector: itemSelector,
                         field_type : 'item',
                         textnodearray: textContentArr,
                         orightml: this.outerHTML,
                         attribute: desiredAttribute
                    };               
                     if(TEMPLATES.TITLENUM == 1){
                         newItemObject['label'] = "title";
                     }else{
                         newItemObject['label'] = "title" + TEMPLATES.TITLENUM;           
                     }                    

                     newItemObject['label_num'] = TEMPLATES.TITLENUM;            
                     TEMPLATES.TITLENUM++;   
                     TEMPLATES.ALL_FIELDS.push(newItemObject);
                     if(typeof this === 'undefined'){
                         alert("bad this");
                         console.log(this);
                         return;
                     }
                     existingFieldParents.push(this);
               }
           }
           else if(tagName == 'a'){
               desiredAttribute = "href";
                var href = $(this).attr('href');
                var textContentArr = TEMPLATES.getNodeTextArr(this);
                var theText = TEMPLATES.getNodeText(this);                
                if((typeof href !== typeof undefined) && href !== false && href !== "" &&
                        href.indexOf("javascript:") === -1 && href.indexOf("#") !== 0){
                    var newItemObject = {
                         level: myLevel,
                         the_selector: itemSelector,
                         field_type : 'item',
                         textnodearray: textContentArr,
                         orightml: this.outerHTML,
                         attribute: desiredAttribute
                    };               
                     if(TEMPLATES.LINKNUM == 1){
                         newItemObject['label'] = "link";
                     }else{
                         newItemObject['label'] = "link" + TEMPLATES.LINKNUM;           
                     }                    

                     newItemObject['label_num'] = TEMPLATES.LINKNUM;            
                     TEMPLATES.LINKNUM++;    
                     if(typeof(this) === 'undefined'){
                         alert("bad this2");
                         console.log(this);
                         return;
                     }                     
                     existingFieldParents.push(this);   
                     TEMPLATES.ALL_FIELDS.push(newItemObject);                     
                }  
               
           }else if(tagName == 'img'){
                desiredAttribute = "src";
                var theSrc = $(this).attr('src');
                if((typeof theSrc !== typeof undefined) && href !== false && theSrc !== ""){
                    var newItemObject = {
                         level: myLevel,
                         the_selector: itemSelector,
                         field_type : 'item',
                         textnodearray: textContentArr,
                         orightml: this.outerHTML,
                         attribute: desiredAttribute
                    };               
                     if(TEMPLATES.IMGNUM == 1){
                         newItemObject['label'] = "image";
                     }else{
                         newItemObject['label'] = "image" + TEMPLATES.IMGNUM;           
                     }                    

                     newItemObject['label_num'] = TEMPLATES.IMGNUM;            
                     TEMPLATES.IMGNUM++;   
                     if(typeof this === 'undefined'){
                         alert("bad this");
                         console.log(this);
                         return;
                     }                        
                     existingFieldParents.push(this);   
                     TEMPLATES.ALL_FIELDS.push(newItemObject);                     
                }                 
           }
       });    
       
       
       console.log("All Fields after auto-generating the item fields");
       console.log(TEMPLATES.ALL_FIELDS);
       
    };
    
    TEMPLATES.getTopRepeats = function(){
       TEMPLATES.LIST_SELECTORS = new Array();
       var rootElem = TEMPLATES.$SNIPHTML.get(0);
       var processedNodes = new Array();       
       
       //var nodesByLevel
       TEMPLATES.$SNIPHTML.find('*').each(function(){           
           
           var elem = this;
           //console.log("element ");
           //console.log(this);
           
           var elemTag = this.nodeName.toLowerCase();
           
           if(elemTag == 'path' || elemTag == 'rect' || elemTag == 'circle' ||
               elemTag == 'ellipse' || elemTag == 'line' || elemTag == 'polyline' ||
               elemTag == 'polygon' || elemTag == 'svg' || elemTag == 'defs'){
               return;
            }         
            
            if($(this).parents('svg').length > 0){
                return;
            }
           
           //herhe
           //console.log(elemTag);
           
           var elemClassnames = TEMPLATES.getAllClassnames(elem);
           var childrenCount = $(elem).find("*").length;
           if($.inArray(elem, processedNodes) !== -1){
               return;
           }
           processedNodes.push(elem);

           var myLevel = 1;
           var $myParent = $(elem).parent();
           while($myParent.get(0) != rootElem){
               $myParent = $myParent.parent();
               myLevel++;
               if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
                   break;
               }
           }
           
           
            var validSiblings = 0;
            var maxTest = 100;
            var currCount = 0;
            let siblingLength = $(elem).siblings(elemTag).length;
            $(elem).siblings(elemTag).each(function(){
                if(validSiblings > 5){
                    return;
                }
                var sibChildCount = $(this).find("*").length;
                var myClassnames = TEMPLATES.getAllClassnames(this);
                var similarClasses = true;
                var sibHtml = this.outerHTML;
                if(myClassnames.length > 1){
                    var matchTotal = arr_similarities(myClassnames, elemClassnames);
                    if(matchTotal >= (myClassnames.length / 2)){
                        similarClasses = true;
                    }else{
                        similarClasses = false;
                    }
                }
                
                
                //SIBLING MUST HAVE AT LEAST HALF FIELDS TO BE CONSIDERED "VALID"
                if(sibChildCount >= (childrenCount / 2) && similarClasses){
                    validSiblings++;
                }
                else{
                    //if dont maybe minus
                    validSiblings--;
                }              
                processedNodes.push(this);
            });
            
            console.log("element");
            console.log(elem);
            console.log("at level " + myLevel);
            console.log("valid siblings: " + validSiblings);
            
            if(validSiblings >= 2){
                console.log("list element ");
                console.log(elem);
                TEMPLATES.addListSelector(elem, myLevel);
            }           
       }); 
    }
    

/*************************************************
/////////////////// GETTING JQUERY SELECTORS FOR ELEMENT
//THESE FUNCTION PROBABLY SHOULD BE IN OWN LIBRARY  
*************************************************/

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
            thePast += " > " + pastArray[x];
        }
    }    
    
    console.log("ON " + elemTag + " past selector now " + thePast);
   
    if(parentTag == "body") //no div, li, tr found
    {	
        return 'body' + thePast;
    }

    let parentTagHasClasslist = true;
    if(parentTag == 'path' || parentTag == 'rect' || parentTag == 'circle' ||
       parentTag == 'ellipse' || parentTag == 'line' || parentTag == 'polyline' ||
       parentTag == 'polygon' || parentTag == 'svg' || parentTag == 'defs'){   
        parentTagHasClasslist = false;
    }    
    
    if(currParent.id != "")
    {
        var uSelector = parentTag + "#" + currParent.id;
        if(currParent.id == "template" || currParent.id == "mymustache"){
            //at root
            uSelector = parentTag;
        }
        
        var myCount = $(uSelector).length;	
        if(myCount == 1)
        {
            let mySelector = uSelector + thePast;
            //console.log("returning selector " + mySelector);
            return uSelector + thePast;
        }else{
            console.log("not a unique onnnnne");
            let mySelector = uSelector + thePast;
            let myOtherCount = $(mySelector).length;	
            if(myOtherCount == 1){
                console.log("returning pastselector " + mySelector);
                return mySelector;            
            }
        }
    }
    else if(currParent.className != "" && parentTagHasClasslist)
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
    console.log("granparent");
    console.log(granParent);
    console.log("finding");
    console.log(parentTag);
    console.log("and getting index of ");
    console.log(currParent);
    
    
    var myIndex = $(granParent).find(parentTag).index(currParent);
    console.log("index " + myIndex);
    
    /*
    var childIndex = $(granParent).children().index(currParent);  
    console.log("child index " + childIndex);
    
    var pastTag = parentTag + ":eq(" + childIndex + ")";     
    */
    var childIndex = $(granParent).children(parentTag).index(currParent);  
    console.log("child index " + childIndex);
    
    var pastTag = parentTag + ":eq(" + childIndex + ")";        
    
    
    
    //var pastTag = parentTag + ":eq(" + myIndex + ")";        
    console.log("pastTag old " + pastTag);
    /*
    
    pastTag = parentTag + ":nth-child(" + childIndex + ")";
    
    console.log("pasttag new " + pastTag);
    */
   
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
    else if(currTag == 'title'){
        return 'title';
    }
    var parentElem = $(elem).parent().get(0);
    
    var parentTag = parentElem.nodeName.toLowerCase();

    var FOUND_SELECTOR = false;
    var THE_SELECTOR = "";
    if(elem.id && elem.id != "" && elem.id != "template" && elem.id != "mymustache")
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
       
    let currTagHasClasslist = true;
    console.log("currtag " + currTag);
    if(currTag == 'path' || currTag == 'rect' || currTag == 'circle' ||
       currTag == 'ellipse' || currTag == 'line' || currTag == 'polyline' ||
       currTag == 'polygon' || currTag == 'svg' || currTag == 'defs'){   
        currTagHasClasslist = false;
    }    
    if(!FOUND_SELECTOR && elem.className && elem.className != "" && currTagHasClasslist)
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
        
        //HERE HERE HERE
        var childIndex = $(prefix).children().index(elem);  
        //var myIndex = $(prefix).find(currTag).index(elem);
        //This should only happen after the parent is added
        THE_SELECTOR = prefix + " " + currTag + ":eq(" + childIndex + ")";

        //probably should be this but don't feel like changing now
        //THE_SELECTOR = prefix + " > " + currTag + ":eq(" + childIndex + ")";
        
        
        //console.log("parent selector " + THE_SELECTOR);
        //console.log("parent selector " + THE_SELECTOR);
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
    }

    if(!FOUND_SELECTOR)
    {
        toastr.error('Error!', 'Could not find a selector ' + THE_SELECTOR + " for element.");
        //alert("Error: Could not find a selector");
        return;
    }
   return THE_SELECTOR;
}


function getCorrectRepeatSelector(elem, theContext){
    //Selector should select list items, and only correct list items
    //We set ItemSelect, GlobalSelect
    //console.log("TRYING TO SELECT A LIST");
    var currTag = elem.nodeName.toLowerCase();
    if(currTag == 'body'){
        return 'body';
    }
    if(!theContext){
        theContext = "";
    }
    
    var parentElem = $(elem).parent().get(0);
    
    var parentTag = parentElem.nodeName.toLowerCase();

    var FOUND_SELECTOR = false;
    var THE_SELECTOR = "";
    if(elem.id && elem.id != "" && elem.id != "template")
    {
        console.log("SELECTOR METHOD 1 - BY ID");        
        THE_SELECTOR = "#" + elem.id;
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
        if(!FOUND_SELECTOR){
            if(parentElem.id && parentElem.id !== ""){
                THE_SELECTOR =  parentTag + "#" + parentElem.id + " > " + THE_SELECTOR;                
            }else{
                THE_SELECTOR =  parentTag + " > " + THE_SELECTOR;
            }
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, theContext);
        }
    }
    if(!FOUND_SELECTOR && elem.className && elem.className != "" && !(elem.className instanceof SVGAnimatedString))
    {
        console.log("SELECTOR TEST 2 - BY CLASS");  
        console.log(elem.className);
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
                FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, theContext);
            }            
            if(FOUND_SELECTOR){
                break;
            }
        }
    }
    if(!FOUND_SELECTOR)
    {
        console.log("getting unique parent");
        //console.log(elem);
        var parentTag2 = elem.nodeName.toLowerCase();
        console.log("parentTag2: " + parentTag2);
        if(parentTag2 == 'body'){
            var nextIndex = $('body').children().index(elem) + 1;        
            THE_SELECTOR = "body > " + currTag + ":nth-child(" + nextIndex + ")";
            //alert("The selector " + THE_SELECTOR);
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, theContext);    
            if(FOUND_SELECTOR){
                //alert("FOUND");
                return THE_SELECTOR;
            }
        }
        console.log("context " );
        console.log(theContext);
        
        FOUND_SELECTOR = testSelectorCount(parentTag, 1, theContext);   
        if(FOUND_SELECTOR){
            return parentTag;
        }
        THE_SELECTOR = getUniqueParentSelector(elem, []);
        //
        //div.grid div:nth-child(2)
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, theContext);   
        //console.log("repeatselector theselector " + THE_SELECTOR);
        //console.log(FOUND_SELECTOR);
    }

    if(!FOUND_SELECTOR)
    {
        toastr.error('Error!', 'Could not find repeat selector ' + THE_SELECTOR + " for element.");
        console.log('Could not find repeat selector ' + THE_SELECTOR + " for element.");
        //alert("Error: could not find a repeating list selector.  (this shouldnt happen and is being logged)");
        return null;
    }
   return THE_SELECTOR;
}

//given the selectorForAll will get origListItem and siblings, then you need a selector to select
//extractElem so that $(origListItem).find('yourselector' finds a unique item 
function getCorrectExtractSelector(selectorForAll, origListItem, extractElem){
    
    //console.log("getting extract elem selector for ");
    //console.log(extractElem);
    var textContent = TEMPLATES.getNodeText(extractElem);
    //console.log("with text " + textContent);
    
    var FOUND_SELECTOR = false;
    var THE_SELECTOR = "";
    var extractTag = extractElem.nodeName.toLowerCase();
    var parentElem = $(extractElem).parent().get(0);
    var parentTag = parentElem.nodeName.toLowerCase();
    
    //non-structure
    if(!FOUND_SELECTOR && extractElem.className && extractElem.className.trim() != "")
    { 
        var elemClassnames = extractElem.className.split(/\s+/);
        for(var x = 0; x < elemClassnames.length; x++){
            var aClass = elemClassnames[x];
            if(aClass.trim() == ''){
                continue;
            }        
            
            var THE_SELECTOR = "." + aClass;
            FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, origListItem);    
            if(!FOUND_SELECTOR){
                if(parentElem !== origListItem){
                    if(parentElem.className && parentElem.className != ""){
                        var parentClassnames = parentElem.className.split(/\s+/);
                        for(var y = 0; y < parentClassnames.length; y++){
                             if(parentClassnames[y] == ""){
                                 continue;
                             }
                             THE_SELECTOR =  parentTag + "." + parentClassnames[y] + " > " + extractTag + THE_SELECTOR;                
                             if(testSelectorCount(THE_SELECTOR, 1, origListItem)){
                                 break;
                             }
                         }
                    }else{
                        //":eq(" + myIndex + ")";
                        THE_SELECTOR =  parentTag + " > " + extractTag + THE_SELECTOR;
                        if(!testSelectorCount(THE_SELECTOR, 1, origListItem)){
                            var myIndex = $(parentElem).find(extractTag).index(extractElem);
                            THE_SELECTOR = parentTag + ":eq(" + myIndex + ")" + " > " + extractTag + THE_SELECTOR;
                        }                        

                    }
                    FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, origListItem);
                }                
            }            
            if(FOUND_SELECTOR){
                //alert("found selector classname");
                //since using classnames - 
                //we want to validate that it's not stupid React with stupid classnames and at least a proportion of 
                //other ones find the element
                //console.log("Found class selector... " + THE_SELECTOR + " but testing that it is valid ")
                var totalSelected = $(selectorForAll).length;
                var totalValid = 0;
                $(selectorForAll).each(function(){
                     var isValid = testSelectorCount(THE_SELECTOR, 1, this);
                     if(isValid){
                         totalValid++;
                     }
                });
                var halfNum = Math.ceil(totalSelected / 2);
                if(totalValid >= halfNum){
                    //console.log("Over half have it so valid");
                    return THE_SELECTOR;
                }else{
                    //console.log("not valid");
                }
            }
        }
    }

    THE_SELECTOR = extractTag;
    FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, origListItem);   
    if(FOUND_SELECTOR){
        //alert("found selector simple");
        return THE_SELECTOR;
    }

    //var theParent = $(orig
    //go up tree to build selector like  div > div > p > span:eq(3)
    //where div is first child        
    var maxLevels = 500;
    var currParent = parentElem;
    if(currParent !== origListItem){        
        var parentTag = currParent.nodeName.toLowerCase();
        var myIndex = $(currParent).children().index(extractElem) + 1;
        THE_SELECTOR = parentTag + " > " + extractTag + ":nth-child(" + myIndex + ")";
        console.log("THE SELECTOR TEST111 ");
        console.log(THE_SELECTOR);
        
        FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, origListItem, extractElem);   
        if(FOUND_SELECTOR){        
            return THE_SELECTOR;
        }else{
            var nextParent = $(currParent).parent().get(0);
            var nextIndex = $(nextParent).children().index(currParent) + 1;
            var nextParentTag = nextParent.nodeName.toLowerCase();
            //with a row with 5 tds for selector...   td > span:eq(0)  ... it wasn't getting 5 items, it was getting the first every time
            //the 
            THE_SELECTOR = parentTag + ":nth-child(" + nextIndex + ")" + " > " + extractTag + ":nth-child(" + myIndex + ")";
            console.log("THE SELECTOR TEST222 ");
            console.log(THE_SELECTOR);

            
            if(testSelectorCount(THE_SELECTOR, 1, origListItem, extractElem)){
                return THE_SELECTOR;
            }
            //just needed to comment this one line to fix big bug
            //FKLDJSFLJDSFLKJ FSDLKJSDF FUCK currParent = nextParent;
        }        
    }else{
        //this is shit... but hypothetically if it was one more level down it would be able to target nth-parent, then nth-child...
        var parentTag = currParent.nodeName.toLowerCase();
        var myIndex = $(currParent).children().index(extractElem) + 1;
        THE_SELECTOR = "children=" + extractTag + ":nth-child(" + myIndex + ")";
        console.log("THE SELECTOR TEST333 ");
        console.log(THE_SELECTOR);
        
        return THE_SELECTOR;
        /*
        if(testSelectorCount(THE_SELECTOR, 1, origListItem)){
             return THE_SELECTOR;
        }*/
    }

    while(currParent !== origListItem){            
        var prevElem = currParent;
        var prevElemTagname = prevElem.nodeName.toLowerCase();
        currParent = $(currParent).parent().get(0);
        console.log("currparent");
        console.log(currParent);
        console.log("prevElem");
        console.log(prevElem);
        var myIndex = $(currParent).children(prevElemTagname).index(prevElem) + 1;
        var currParentTag = currParent.nodeName.toLowerCase();
        console.log("index " + myIndex);
        THE_SELECTOR = currParentTag + ":nth-child(" + myIndex + ")" + " > " + THE_SELECTOR;
        console.log("testing6666 " + THE_SELECTOR);
        if(testSelectorCount(THE_SELECTOR, 1, origListItem, extractElem)){            
            return THE_SELECTOR;
        }
        maxLevels--;
        if(maxLevels < 0){
            console.log("max levels exceeded");
            //alert("max levels exceeded");
            break;
        }
    }

    /*
    var prefix = getUniqueParentSelector(elem, []);
    var myIndex = $(prefix).find(extractTag).index(elem);
    //This should only happen after the parent is added
    THE_SELECTOR = prefix + " " + extractTag + ":eq(" + myIndex + ")";

    //console.log("parent selector " + THE_SELECTOR);
    console.log("parent selector " + THE_SELECTOR);
    FOUND_SELECTOR = testSelectorCount(THE_SELECTOR, 1, "");
    */
    if(!FOUND_SELECTOR){
        console.log("SHOULD NOT HAPPEN - SELECTOR NOT FOUND FOR ");
        console.log(extractElem);
    }
    //console.log("INSIDE LIST");
    //console.log(origListItem);
    //alert("should not happen - selector not found");
    return null;    
}
    
    
    function arr_similarities(arrayA, arrayB) {
        var matches = 0;
        for (var i=0; i < arrayA.length; i++) {
            if (arrayB.indexOf(arrayA[i]) != -1)
                matches++;
        }
        return matches;
    }    
    
    
TEMPLATES.getNodeTextArr = function(elem){
    var nodeArr = new Array();
    for(var m = 0; m < elem.childNodes.length; m++){
        
        var child = elem.childNodes[m];
        if(child.nodeType == 3 && child.nodeValue && child.nodeValue.length > 0){
            var nodeVal = child.nodeValue.trim();
            //console.log("has node value " + nodeVal)
            var nodeObj = {
                position: m,
                value: nodeVal,
                elem: child
            };
                        
            nodeArr.push(nodeObj);
        }        
    }
    return nodeArr;
}; 
    
TEMPLATES.getNodeText = function(elem){
    
    var nodeArr = new Array();
    for(var m = 0; m < elem.childNodes.length; m++){
        
        var child = elem.childNodes[m];
        if(child.nodeType == 3 && child.nodeValue && child.nodeValue.length > 0){
            var nodeVal = child.nodeValue.trim();
            //console.log("has node value " + nodeVal)
            nodeArr.push(nodeVal);
        }        
    }
    var allText = nodeArr.join('');
    
    var noNewLines = allText.replace(/(\r\n|\n|\r)/gm, "");
    noNewLines = noNewLines.replace(/\s/g, "");
    noNewLines = noNewLines.trim();
    //console.log("text of ");
    //console.log(elem);
    //console.log(allText);
    //console.log("nonewlines");
    //console.log(noNewLines);
    
    if(noNewLines.length == 0 || noNewLines == ""){
        console.log("empty text");
        return "";
    }
    
    return allText.trim();
}
    
//lame
TEMPLATES.getBackgroundUrl = function(bg){
    bg = bg.replace('url(','').replace(')','');   
    bg = bg.replace('url(','').replace(')','');  
    bg = bg.replace('url(','').replace(')','');  
    bg = bg.replace('"','').replace("'",'');  
    bg = bg.replace('"','').replace("'",'');  
    bg = bg.replace('"','').replace("'",'');  
    return bg;
}

TEMPLATES.getDefaultFieldObject = function(){
    
    var fieldItem = {};
    fieldItem['item_type'] = "list";   //list,single,merge    
    fieldItem['selector'] = '';
    fieldItem['attribute'] = "text";
    fieldItem['filter'] = '';
    fieldItem['label'] = "unknown";
    fieldItem['label_num'] = 0;        
    fieldItem['textnodearray'] = new Array();
    //only availble some times in the list of the items
    fieldItem['onoff_switch'] = true;    
    fieldItem['found'] = false;
    fieldItem['sample_data'] = "";
    
    return fieldItem;    
};

TEMPLATES.initTemplateViewer = function(callbackDone){
    if(TEMPLATES.INITIALIZED_VIEWER){
        callbackDone();
        return;
    }
    var templateViewerHtml = $('#template_viewer_template').html();
    //console.log("template viewer html:");
    //console.log(templateViewerHtml);
    
    let iframeContainerTemplate = '#template_viewer';
    if(!TEMPLATES.IN_EXTENSION){
        iframeContainerTemplate = '.snipcss-frame-wrapper';
    }
    
    $(iframeContainerTemplate).empty();
    setTimeout(function(){
        $(iframeContainerTemplate).html(templateViewerHtml);        

        var waitInterval = setInterval(function(){
            if($('#templatejson_panel').length <= 0){
                return;
            }
            clearInterval(waitInterval);
            TEMPLATES.INITIALIZED_VIEWER = true;
            if(TEMPLATES.IN_EXTENSION){                
                //dev version of extension, or admin user
                var chromeExtensionId = chrome.runtime.id;
                if(OPTIONS.IS_ADMIN_USER){
                    //reveal admin user buttons
                    $('#save_template_container').css('display', 'block');    
                    $('#editipsonify_container').css('display', 'block');
                }
            } 
            callbackDone();
        }, 100);                
    }, 500);            
}       

TEMPLATES.addPanel = function(editor, panelName, panelLabel){
      console.log("adding panel " + panelName);
      var node = document.createElement("div");
      if(!TEMPLATES.IN_EXTENSION && panelLabel == 'MUSTACHE'){
          
        let divContainer = document.createElement("div");
        
        let myTabs = ['html', 'mustache', 'react', 'vue'];
        let myTabLabels = ['HTML', 'JSX', 'ReactJS', 'VueJS'];
        //let myTabIsPro = [0,0,1,1];
        //let myTabIsFree = [0,0,0,0];
        let myTabSelected = TEMPLATES.WEBSITE_FIRST_MIRROR_TAB;
        let label = (document.createElement("span"));
        label.textContent = 'HTML';
        let extraSelected = "";
        if(myTabSelected == 'html'){
            extraSelected = ' snipmirror-tabselected';
        }
        
        label.className = 'snipmirror-tab snipmirror-switch-html ' + extraSelected; //+ myTabs[m] + proClass + freeClass + selectClass; 
        label.id = 'sniptab_html';       
        divContainer.appendChild(label);
        
        //now do the USER PREFERRED template engine.  no one uses mustache so 
            let labelTemplate = (document.createElement("span"));
            let myTemplateTab = TEMPLATES.WEBSITE_TEMPLATE_ENGINE;
            let myTemplateLabel = "JSX";
            if(myTemplateTab == 'vue'){
                myTemplateLabel = 'VUE';
            }
            else if(myTemplateTab == 'mustache'){
                myTemplateLabel = 'Handlebars {}';                
            }
            labelTemplate.textContent = myTemplateLabel;         
            let proClass = "";
            let freeClass = "";
            let selectClass = "";
            if(TEMPLATES.FEATURE_ARR['free-' + myTemplateTab]){
                freeClass = " snipmirror-tabfree";
            }            
            else{
                proClass = " snipmirror-tabpro";
            }
            if(myTemplateTab == myTabSelected){
                selectClass = ' snipmirror-tabselected';
            }
            
            labelTemplate.className = 'snipmirror-tab snipmirror-switch-engine' + proClass + freeClass + selectClass; 
            labelTemplate.id = 'sniptab_' + myTemplateTab;
            if(TEMPLATES.FEATURE_ARR['has-mustache']){            
                divContainer.appendChild(labelTemplate);
                let gearIconSpan = (document.createElement("span"));
                let iconGear = (document.createElement("i"));
                gearIconSpan.className = 'website_pick_engine';
                iconGear.className = 'fas fa-cog';
                gearIconSpan.appendChild(iconGear);
                divContainer.appendChild(gearIconSpan);                
            }
        /*
        for(let m = 0; m < myTabs.length; m++){
            let label = (document.createElement("span"));
            label.textContent = myTabLabels[m];         
            let proClass = "";
            let freeClass = "";
            let selectClass = "";
            if(myTabs[m] == 'html' || myTabs[m] == 'mustache' || TEMPLATES.FEATURE_ARR['free-' + myTabs[m]]){
                freeClass = " snipmirror-tabfree";
            }            
            else{
                proClass = " snipmirror-tabpro";
            }
            if(myTabs[m] == myTabSelected){
                selectClass = ' snipmirror-tabselected';
            }
            
            label.className = 'snipmirror-tab snipmirror-switch-' + myTabs[m] + proClass + freeClass + selectClass; 
            label.id = 'sniptab_' + myTabs[m];
            if(myTabs[m] == 'mustache'){
                //
            }
            if(myTabs[m] == 'html' || TEMPLATES.FEATURE_ARR['has-' + myTabs[m]]){
                divContainer.appendChild(label);
            }
        }      
        */
        divContainer.className = 'snipmirror-tabcontainer';
        
        node.appendChild(divContainer);
      }
      else if(panelLabel == 'CSS'){
        let divContainer = document.createElement("div");
        
        let myTabs = ['css'];
        let myTabLabels = ['CSS'];
        let myTabSelected = "css";
        for(let m = 0; m < myTabs.length; m++){
            let label = (document.createElement("span"));
            label.textContent = myTabLabels[m];         
            let selectClass = "";
            if(myTabs[m] == myTabSelected){
                selectClass = ' snipmirror-tabselected';
            }
            
            label.className = 'snipmirror-tab snipmirror-switch-' + myTabs[m] + selectClass; 
            label.id = 'sniptab_' + myTabs[m];
            divContainer.appendChild(label);
        }      
        divContainer.className = 'snipmirror-tabcontainer';
        
        node.appendChild(divContainer);          
      }
      else{
        if(!TEMPLATES.IN_EXTENSION){
            //alert("featureARR ");
            //console.log("feature arr");
            //console.log(TEMPLATES.FEATURE_ARR);
            if(TEMPLATES.FEATURE_ARR['has-mustache']){
                let divContainer = document.createElement("div");
                var label = divContainer.appendChild(document.createElement("span"));
                label.textContent = panelLabel;             
                label.className = 'snipmirror-tab snipmirror-switch-' + panelName + ' snipmirror-tabselected'; 
                divContainer.className = 'snipmirror-tabcontainer';

                node.appendChild(divContainer);              
            }else{
                $('#templatejson_panel').empty();
                $('#templatejson_panel').append('<div class="static_templates"><h1>Free Static template</h1>' + 
                        '<p>This is a free HTML/CSS template.</p>' + 
                        '<p>Some templates have React/Vue versions.</p>' + 
                        '<p>Everything on this site was created with the <br><a href="https://www.snipcss.com">SnipCSS extension</a>.' + 
                        '<p></p>');
                return;
            }
        }else{
            var label = node.appendChild(document.createElement("span"));
            label.textContent = panelLabel;             
            label.className = 'snipmirror-tab snipmirror-switch-' + panelName;                              
        }
      }
      let saveButton = ''; 
      if(panelName == 'template'){
          if(TEMPLATES.IN_EXTENSION){
              saveButton = '<a class="badge copybadge" id="save-' + panelName + '"> ' + 'Save</a>';
          }
      } 
      
      var copysaveButtons = $('<div class="copysavebuttons">' + 
              saveButton +               
              '<a class="badge copybadge" id="copy-' + panelName + '"> ' + 'Copy</a>' + 
              '</div>').get(0);
      if(panelName == 'json'){
          if(TEMPLATES.IN_EXTENSION){
                copysaveButtons = $('<div class="copysavebuttons">' + 
                      '<a class="badge copybadge" id="save-' + panelName + '"> Save</a>' +      
                      '<a class="badge setitemsbadge" id="setitems-' + panelName + '"> Set # Items</a>' +                     
                      '<a class="badge copybadge" id="copy-' + panelName + '"> ' + 'Copy</a>' + 
                      '</div>').get(0);          
          }else{
                copysaveButtons = $('<div class="copysavebuttons">' + 
                      '<a class="badge copybadge" id="copy-' + panelName + '"> ' + 'Copy</a>' +   
                      '</div>').get(0);                        
          }
      }   
              
      node.appendChild(copysaveButtons);
      node.id = "panelheader-" + panelName;
      editor.addPanel(node, {position: 'top', stable: true});
      setTimeout(function(){
          new ClipboardJS('#copy-' + panelName, {
            text: function(trigger) {
                return editor.getDoc().getValue();
            }
          });        
          
          $('#save-' + panelName).on('click', function(){
              var myPanel = this.id.split('-')[1];
              //save-template
              if(myPanel == 'template'){
                  let theHtml = editor.getDoc().getValue();
                  let rootId;
                  if(TEMPLATES.SAVED_ID == ""){
                    rootId = $(theHtml).get(0).id;
                    if(!rootId || rootId == "");
                    {
                        rootId = 'template-' + TEMPLATES.randomLetters(3);
                    }
                    TEMPLATES.SAVED_ID = rootId;
                  }else{
                      rootId = TEMPLATES.SAVED_ID;
                      theHtml = $(theHtml).attr('id', TEMPLATES.SAVED_ID).wrap('<div>').parent().html();   
                  }
                  TEMPLATES.ALL_FIELDS = new Array();
                  TEMPLATES.ALL_BAD_FIELDS = new Array();
                  TEMPLATES.LIST_SELECTORS = new Array();                  
                  //let templateCode = TEMPLATES.TEMPLATE_CODE;
                  
                  
                  $('#mymustache').remove();
                  $(theHtml).attr('id', rootId).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');  
                  var $root = $('#mymustache');
                  console.log("root is");
                  console.log($root.html());
                  
                  let newMustacheVars = TEMPLATES.getMustacheVars(theHtml);
                  console.log("new mustache vars ");
                  console.log(newMustacheVars);
                  
                  for(let n = 0; n < newMustacheVars.length; n++){
                      let theField = newMustacheVars[n];
                      if(typeof theField === "string") {
                         //we should expect an item field 
                         let fieldExists = false;
                         for(let f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
                             if(TEMPLATES.ALL_FIELDS[f]['field_type'] == 'item'){
                                 if(TEMPLATES.ALL_FIELDS[f]['label'] == theField){
                                     fieldExists = true;
                                 }
                             }
                         }
                         if(fieldExists){
                             //should we check if it's corrrect?  Fuck no
                             console.log("Item field already exists");                              
                             continue;
                         }
                         let $parentNode = TEMPLATES.searchTextNodes($root, '{{' + theField + '}}');
                         let $containerNode = TEMPLATES.searchAttributes($root, '{{' + theField + '}}');
                         //build new object by getting selector of one of these, figuring out attribute, labelnum what else?
                         //then if field doesn't exist add it.  
                         let itemElement = null;
                         let useAttribute = false;
                         if($parentNode != null){
                             console.log("{{" + theField + "}}" + " IS A TEXT NODE ");
                             itemElement = $parentNode.get(0);
                         }else if($containerNode != null){  
                             itemElement = $containerNode.get(0);
                             useAttribute = true;
                             console.log("{{" + theField + "}}" + " IS AN ATTRIBUTE TEXT NODE");                             
                         }else{
                             //fuck
                             //fuckity fuck
                             toastr.error("This text {{" + theField + "}} not found in text or attributes, probably a bug");
                             console.log("This text {{" + theField + "}} not found in text or attributes, probably a bug");
                             continue;
                         }
                         let newSelector = getCorrectSelector(itemElement);
                         if(newSelector == null){
                            toastr.error("This text {{" + theField + "}} generated bad selector");
                            console.log("This text {{" + theField + "}} generated bad selector");                                 
                            continue;
                         }
                         console.log("Selector for {{" + theField + "}}: " + newSelector);
                         var myLevel = 1;
                         var $myParent = $(itemElement).parent();
                         while($myParent.get(0) != $root.get(0)){
                               $myParent = $myParent.parent();
                               myLevel++;
                               if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
                                   break;
                               }
                         }        
                         let attributeType = '';
                         if(useAttribute){
                            Array.from(itemElement.attributes).forEach(function(currAttr) {
                              let attrVal = currAttr.value;
                              if (attrVal.indexOf("{{" + theField + "}}") >= 0) {
                                  attributeType = currAttr.name;
                              }
                            });
                         }else{
                             attributeType = 'text';
                         }
                        if(attributeType == ''){
                            alert("This text {{" + theField + "}} was not found in elements attributes");
                            console.log("This text {{" + theField + "}} was not found in elements attributes");                                 
                            continue;
                        }

                          
                         var textContentArr = TEMPLATES.getNodeTextArr(itemElement);
                         var textContent = TEMPLATES.getNodeText(itemElement);             
                         var newItemObject = {
                                level: myLevel,
                                the_selector: newSelector,
                                field_type : 'item',
                                textnodearray: textContentArr,
                                orightml: itemElement.outerHTML,
                                attribute: attributeType
                         };
                         console.log("!!!!CREATING NEW ITEM OBJECT: ");
                         console.log(newItemObject);
                         
                         TEMPLATES.TEXTNUM += 1000;
                         newItemObject['label'] = theField;            
                         newItemObject['field_name'] = theField;
                         newItemObject['label_num'] = TEMPLATES.TEXTNUM;            
                         TEMPLATES.ALL_FIELDS.push(newItemObject);                             
                      }else if (typeof theField === "object") {
                         console.log("myValue is an object, is this the key?:");
                         console.log(theField);
                         var keyName = Object.keys(theField)[0];
                         let subfieldArr = theField[keyName];
                         
                         let fieldExists = false;
                         let fieldIndex = -1;
                         for(let f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
                             if(TEMPLATES.ALL_FIELDS[f]['field_type'] == 'list'){
                                 if(TEMPLATES.ALL_FIELDS[f]['label'] == keyName){
                                     fieldExists = true;
                                     fieldIndex = f;
                                 }
                             }
                         }
                         let textNode = TEMPLATES.searchTextNodes($root, '{{#' + keyName + '}}', true);
                         console.log("textnode is ");
                         console.log(textNode);
                         let repeatItem = TEMPLATES.findFirstElementAfterTextNode(textNode);
                         let repeatTag = repeatItem.nodeName.toLowerCase();
                         let repeatParent = $(repeatItem).parent().get(0);
                         let parentSelector = null;
                         let mySelector = null;

                         if(repeatParent !== null){
                            parentSelector = getCorrectRepeatSelector(repeatParent);
                            mySelector = parentSelector + " > " + repeatTag;                                    
                         }else{
                             toastr.error("Problem making repeating list");
                             continue;
                         }     
                         var myLevel = 1;
                         var $myParent = $(repeatParent);
                         while($myParent.get(0) != $root.get(0)){
                            $myParent = $myParent.parent();
                            myLevel++;
                            if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
                                break;
                            }
                         }                         
                         var newListObject = {
                            level: myLevel,
                            the_selector: mySelector
                         };                           
                         
                         
                         if(fieldExists){
                             //should we update the selector if the list exists?  Fuck no
                             console.log("List field EXISTS but we have to check all subvars");    
                             TEMPLATES.ALL_FIELDS[fieldIndex]['the_selector'] = mySelector;
                         }                        
                         else{
                             fieldIndex = TEMPLATES.ALL_FIELDS.length;
                             TEMPLATES.ALL_FIELDS.push(newListObject);
                             TEMPLATES.ALL_FIELDS[fieldIndex]['field_type'] = "list";
                             TEMPLATES.ALL_FIELDS[fieldIndex]['field_name'] = keyName;
                             TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'] = new Array();                             
                         }
                         
                         for(let p = 0; p < subfieldArr.length; p++){
                             let subFieldLabel = subfieldArr[p];
                             if(typeof subFieldLabel === "string") {
                                try{
                                   let twoBraces = false;
                                   let $parentNode = TEMPLATES.searchTextNodes($(repeatItem), '{{{' + subFieldLabel + '}}}');
                                   console.log("searching " + subFieldLabel);
                                   console.log("in");
                                   console.log(repeatItem);
                                   let $containerNode = TEMPLATES.searchAttributes($(repeatItem), '{{{' + subFieldLabel + '}}}');

                                   let subitemElement = null;
                                   let useAttribute = false;
                                   if($parentNode != null){
                                      console.log("SUBFIELD {{{" + subFieldLabel + "}}}" + " IS A TEXT NODE ");
                                      subitemElement = $parentNode.get(0);
                                   }else if($containerNode != null){  
                                      subitemElement = $containerNode.get(0);
                                      useAttribute = true;
                                      console.log("SUBFIELD {{{" + subFieldLabel + "}}}" + " IS AN ATTRIBUTE TEXT NODE");                             
                                   }else{
                                       //search for two braces
                                       let $parentNode = TEMPLATES.searchTextNodes($(repeatItem), '{{' + subFieldLabel + '}}');
                                       let $containerNode = TEMPLATES.searchAttributes($(repeatItem), '{{' + subFieldLabel + '}}');   
                                       twoBraces = true;
                                       if($parentNode != null){
                                          console.log("SUBFIELD {{" + subFieldLabel + "}}" + " IS A TEXT NODE ");
                                          subitemElement = $parentNode.get(0);
                                       }else if($containerNode != null){  
                                          subitemElement = $containerNode.get(0);
                                          useAttribute = true;
                                          console.log("SUBFIELD {{" + subFieldLabel + "}}" + " IS AN ATTRIBUTE TEXT NODE");                             
                                       }
                                       else{
                                           //fuck
                                           //alert("SUBFIELD text {{{" + subFieldLabel + "}}} not found in text or attributes, probably a bug");                                        
                                           toastr.error("Error!", "SUBFIELD text {{" + subFieldLabel + "}} not found in text or attributes")
                                           console.log("SUBFIELD text {{" + subFieldLabel + "}} not found in text or attributes, probably a bug");
                                           continue;                                        
                                       }

                                   }       
                                   let subfieldAlreadyExists = false;
                                   for(let e = 0; e < TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'].length; e++){
                                       let testSubfield = TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][e];
                                       if(testSubfield['label'] == subFieldLabel){
                                           console.log("testsubfield " + testSubfield['label'] + " is same as " + subFieldLabel + " so skippin?");
                                           //should we change the attribute?  fuck no
                                           subfieldAlreadyExists = true;
                                       }
                                   }

                                   if(subfieldAlreadyExists){
                                       continue;
                                   }                             

                                   let attributeType = '';
                                   if(useAttribute){
                                      Array.from(subitemElement.attributes).forEach(function(currAttr) {
                                       let attrVal = currAttr.value;
                                       if(twoBraces){
                                           if (attrVal.indexOf("{{" + subFieldLabel + "}}") >= 0) {
                                               attributeType = currAttr.name;
                                           }                                        
                                       }else{
                                           if (attrVal.indexOf("{{{" + subFieldLabel + "}}}") >= 0) {
                                               attributeType = currAttr.name;
                                           }                                        
                                       }
                                     });


                                   }else{
                                       attributeType = 'text';
                                   } 
                                   let theSelector = getCorrectExtractSelector(mySelector, repeatItem, subitemElement);
                                   var textContentArr = TEMPLATES.getNodeTextArr(subitemElement);
                                   var textContent = TEMPLATES.getNodeText(subitemElement);                                
                                   var subitemField = TEMPLATES.getDefaultFieldObject();
                                   subitemField['selector'] = theSelector;
                                   subitemField['attribute'] = attributeType;
                                   subitemField['textnodearray'] = textContentArr;
                                   subitemField['orightml'] = subitemElement.outerHTML;
                                   subitemField['label'] = subFieldLabel;
                                   subitemField['label_num'] = p;
                                   //not sure about these fields
                                   subitemField['sample_data'] = "nodata";      
                                   subitemField['found'] = true;                                   
                                   console.log("adding subfield item: " );
                                   console.log(subitemField);                             

                                   TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'].push(subitemField); 
                               }
                               catch(badd){
                                   console.log("BAD SUBFIELD ");
                                   console.log(badd);
                                   TEMPLATES.ALL_BAD_FIELDS.push(subFieldLabel);                                
                               }
                            }else if(typeof subFieldLabel === "object") {
                                try{
                                    console.log("subfield is an object, is this the key?:");
                                    console.log(subFieldLabel);
                                    let subkeyName = Object.keys(subFieldLabel)[0];
                                    let subsubfieldArr = subFieldLabel[subkeyName];

                                    /*
                                    let fieldExists = false;
                                    let fieldIndex = -1;
                                    for(let f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
                                        if(TEMPLATES.ALL_FIELDS[f]['field_type'] == 'list'){
                                            if(TEMPLATES.ALL_FIELDS[f]['label'] == subkeyName){
                                                fieldExists = true;
                                                fieldIndex = f;
                                            }
                                        }
                                    }
                                    */

                                    let textNode = TEMPLATES.searchTextNodes($(repeatItem), '{{#' + subkeyName + '}}', true);
                                    console.log("SUBLIST KEY textnode is ");
                                    console.log(textNode);
                                    let repeatSubItem = TEMPLATES.findFirstElementAfterTextNode(textNode);
                                    let repeatSubTag = repeatSubItem.nodeName.toLowerCase();
                                    let repeatSubParent = $(repeatSubItem).parent().get(0);
                                    let parentSubSelector = null;
                                    let mySubSelector = null;

                                    if(repeatSubParent !== null){
                                       parentSubSelector = getCorrectRepeatSelector(repeatSubParent, TEMPLATES.ALL_FIELDS[fieldIndex]['the_selector']);
                                       mySubSelector = parentSubSelector + " > " + repeatSubTag;                                    
                                    }else{
                                        toastr.error("Problem making repeating list");
                                        continue;
                                    }                          
                                    var newSubListObject = {
                                       level: myLevel,
                                       the_selector: mySubSelector
                                    };                           

                                    let subfieldIndex = TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'].length;
                                    TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'].push(newSubListObject);
                                    TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['item_type'] = "sublist";
                                    TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['field_name'] = subkeyName;
                                    TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['sub_fields'] = new Array();   

                                    console.log("A SUBFIELD IS A LIST!!!");
                                    console.log("HERE IT ISSSS");
                                    console.log(TEMPLATES.ALL_FIELDS[fieldIndex]['field_type'][subfieldIndex]);

                                    console.log("sub sub field array");
                                    console.log(subsubfieldArr);

                                    for(let q = 0; q < subsubfieldArr.length; q++){
                                        let subsubFieldLabel = subsubfieldArr[q];
                                        if(typeof subsubFieldLabel === "string") {

                                            let twoBraces = false;

                                            console.log("searching " + subsubFieldLabel);
                                            console.log("in");
                                            console.log(repeatSubItem);
                                            let $subparentNode = TEMPLATES.searchTextNodes($(repeatSubItem), '{{{' + subsubFieldLabel + '}}}');                                            
                                            let $subcontainerNode = TEMPLATES.searchAttributes($(repeatSubItem), '{{{' + subsubFieldLabel + '}}}');

                                            let subsubitemElement = null;
                                            let subuseAttribute = false;
                                            if($subparentNode != null){
                                               console.log("SUBFIELD {{{" + subsubFieldLabel + "}}}" + " IS A TEXT NODE ");
                                               subsubitemElement = $subparentNode.get(0);
                                            }else if($subcontainerNode != null){  
                                               subsubitemElement = $subcontainerNode.get(0);
                                               subuseAttribute = true;
                                               console.log("SUBFIELD {{{" + subsubFieldLabel + "}}}" + " IS AN ATTRIBUTE TEXT NODE");                             
                                            }else{
                                                //search for two braces
                                                $subparentNode = TEMPLATES.searchTextNodes($(repeatSubItem), '{{' + subsubFieldLabel + '}}');
                                                $subcontainerNode = TEMPLATES.searchAttributes($(repeatSubItem), '{{' + subsubFieldLabel + '}}');   
                                                twoBraces = true;
                                                if($subparentNode != null){
                                                   console.log("SUBFIELD {{" + subsubFieldLabel + "}}" + " IS A TEXT NODE ");
                                                   subsubitemElement = $subparentNode.get(0);
                                                }else if($subcontainerNode != null){  
                                                   subsubitemElement = $subcontainerNode.get(0);
                                                   subuseAttribute = true;
                                                   console.log("SUBFIELD {{" + subsubFieldLabel + "}}" + " IS AN ATTRIBUTE TEXT NODE");                             
                                                }
                                                else{
                                                    //fuck
                                                    //alert("SUBFIELD text {{{" + subFieldLabel + "}}} not found in text or attributes, probably a bug");                                        
                                                    toastr.error("Error!", "SUBFIELD text {{" + subsubFieldLabel + "}} not found in text or attributes")
                                                    console.log("SUBFIELD text {{" + subsubFieldLabel + "}} not found in text or attributes, probably a bug");
                                                    continue;                                        
                                                }

                                            }                                

                                            let attributeType = '';
                                            if(subuseAttribute){
                                               Array.from(subsubitemElement.attributes).forEach(function(currAttr) {
                                                let attrVal = currAttr.value;
                                                if(twoBraces){
                                                    if (attrVal.indexOf("{{" + subsubFieldLabel + "}}") >= 0) {
                                                        attributeType = currAttr.name;
                                                    }                                        
                                                }else{
                                                    if (attrVal.indexOf("{{{" + subsubFieldLabel + "}}}") >= 0) {
                                                        attributeType = currAttr.name;
                                                    }                                        
                                                }
                                              });
                                            }else{
                                                attributeType = 'text';
                                            } 

                                            //simple selector???
                                            let theSelector = subsubitemElement.nodeName.toLowerCase();                                        


                                            var textContentArr = TEMPLATES.getNodeTextArr(subsubitemElement);
                                            var textContent = TEMPLATES.getNodeText(subsubitemElement);                                
                                            var subsubitemField = TEMPLATES.getDefaultFieldObject();
                                            subsubitemField['selector'] = theSelector;
                                            subsubitemField['attribute'] = attributeType;
                                            subsubitemField['textnodearray'] = textContentArr;
                                            subsubitemField['orightml'] = subsubitemElement.outerHTML;
                                            subsubitemField['label'] = subsubFieldLabel;
                                            subsubitemField['label_num'] = q;
                                            //not sure about these fields
                                            subsubitemField['sample_data'] = "nodata";      
                                            subsubitemField['found'] = true;                                   
                                            console.log("ADDING SUB SUB FIELD item: " );
                                            console.log(subsubitemField);                             

                                            TEMPLATES.ALL_FIELDS[fieldIndex]['sub_fields'][subfieldIndex]['sub_fields'].push(subsubitemField);                                         
                                        }   
                                    }
                                }
                                catch(baddd){
                                    console.log("BAD SUB SUB SUB SUB SUB FIELD ");
                                    console.log(baddd);
                                    TEMPLATES.ALL_BAD_FIELDS.push(subsubFieldLabel);                                
                                }                                   
                            }
                     
                            console.log("ADDED THE LIST IN ALL FIELDS IS ");
                            console.log(TEMPLATES.ALL_FIELDS[fieldIndex]);                                 
                         }
                      }else{
                         alert("unknown var");
                      }    
                     
                      
                  }
                  console.log("AFTER ADDING MUSTACHE VARS, TEMPLATES ALLFIELDS NOW");
                  console.log(TEMPLATES.ALL_FIELDS);
                  
                  TEMPLATES.SAVED_TEMPLATE = true;
                  TEMPLATES.TEMPLATE_CODE = theHtml;
                  TEMPLATES.SNIPPET['template_code'] = TEMPLATES.TEMPLATE_CODE;
                  TEMPLATES.SNIPPET['template_id'] = TEMPLATES.SAVED_ID;
                  
                  console.log("new template code: ");
                  console.log(TEMPLATES.TEMPLATE_CODE);
                  
                  TEMPLATES.reloadTemplate(true);
                  TEMPLATES.saveTemplate(true);    
                  $('.revert_container').css('display', 'block');
                  TEMPLATES.refreshReactVueButtons();
                  
                  
                  if(TEMPLATES.ALSO_SAVE_JSON){                      
                      TEMPLATES.ALSO_SAVE_JSON = false;
                      setTimeout(function(){
                          $('#save-json').trigger('click');
                      }, 200);
                  }
                  
                  toastr.success('Success', 'Template Code Saved');
                  
                  //alert('should save mustache template here... save as part of the snipcss snippet maybe?');
              }
              else if(myPanel == 'json'){
                  //save-json
                  let theJSON = editor.getDoc().getValue();
                  try{
                      let jsonObject = JSON.parse(theJSON);
                      
                      TEMPLATES.JSON_OBJECT = jsonObject;
                      TEMPLATES.SAVED_JSON = true;
                      toastr.success('Success', 'Template JSON Saved');  
                      if(TEMPLATES.IN_EXTENSION){
                           TEMPLATES.SNIPPET['json_string'] = theJSON;                          
                      }                      
                      
                      TEMPLATES.reloadTemplate(true);
                      if(TEMPLATES.IN_EXTENSION){
                            TEMPLATES.saveTemplate(true);      
                      }

                  }catch(exx){
                      alert("There is an error " + exx.message);
                      console.log("SNIPCSS - there was an error");
                      console.log(exx);
                  }
              }
          });
          
          $('#setitems-' + panelName).on('click', function(){
              MicroModal.show('modal-set-item-amount');     
              /*
              //fuck clearing content viewer... we should just update the iframe or wahtever
              clearContentViewer(function(){
                  loadSnippet(SNIPCSS.SELECTED_SNIPPET);
              });
              */
          });
            
                    
      }, 100);    
    
};

TEMPLATES.searchTextNodes = function($root, searchText, retNode) {
  const root = $root[0];
  if (root.nodeType === Node.TEXT_NODE && root.textContent.includes(searchText)) {
    return retNode ? $(root) : $(root.parentNode);
  }
  for (let i = 0; i < root.childNodes.length; i++) {
    const result = TEMPLATES.searchTextNodes($(root.childNodes[i]), searchText, retNode);
    if (result) {
      return result;
    }
  }
  return null;
};


TEMPLATES.findFirstElementAfterTextNode = function($textNode) {
    // Access the DOM node from the jQuery object
    const textNode = $textNode[0];

    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        console.error("Invalid text node provided");
        console.log(textNode.nodeType);
        return null;
    }

    let currentNode = textNode;
    while (currentNode) {
        currentNode = currentNode.nextSibling;
        if (currentNode && currentNode.nodeType === Node.ELEMENT_NODE) {
            return currentNode;
        }
    }

    return null;
};




TEMPLATES.searchAttributes = function($root, searchText) {
  var $element = null;

  $root.find('*').each(function() {
    var $current = $(this);

    // Check if any attribute contains searchText
    var hasSearchText = Array.from($current[0].attributes).some(function(attr) {
        let attrName = attr.name;
        if(attr.value.indexOf(searchText) >= 0){
            if(attrName == 'id' || attrName == 'class'){
                //alert("CHATGPT DIDNT LISTEN AND TRIED TO PUT VARIABLES IN CLASSES/IDS, GODDAMN MACHINES!");
                return false;
            }            
            console.log("found " + searchText + " in " + attr.value);
            return true;
        }
        return attr.value.includes(searchText);
    });

    if (hasSearchText) {
      $element = $current;
      return false; // Exit the .each loop early
    }
  });
  if($element == null){
    let hasSearchText2 = Array.from($root[0].attributes).some(function(attr) {
        let attrName = attr.name;
        if(attr.value.indexOf(searchText) >= 0){
            if(attrName == 'id' || attrName == 'class'){
                //alert("CHATGPT DIDNT LISTEN AND TRIED TO PUT VARIABLES IN CLASSES/IDS, GODDAMN MACHINES!");
                return false;
            }            
            console.log("in root - found " + searchText + " in " + attr.value);
            return true;
        }
        return attr.value.includes(searchText);
    });   
    if(hasSearchText2){
        return $root;
    }
  }
  
  

  return $element;
};


TEMPLATES.getMustacheVars = function(html) {
  const regex = /{{\s*([#^\/])?([a-zA-Z0-9_.]+)\s*}}/g;
  let match;
  const result = [];

  while ((match = regex.exec(html)) !== null) {
    const isLoopVar = match[1] === '#' || match[1] === '^';
    const varName = match[2];

    if (isLoopVar) {
      const subHtml = html.substr(regex.lastIndex);
      const endTag = `{{/${varName}}}`;
      const endIndex = subHtml.indexOf(endTag);
      const subVars = TEMPLATES.getMustacheVars(subHtml.substr(0, endIndex));
      const obj = { [varName]: subVars };
      result.push(obj);
      regex.lastIndex += endIndex + endTag.length;
    } else {
      result.push(varName);
    }
  }

  return result;
};


TEMPLATES.getIpsumWanted = function(theAttribute, templateElem){

    var theData = "";
    if(theAttribute == 'text'){
       if(templateElem == null){
           return "text=50";
       }
       var textArrNodes = TEMPLATES.getNodeTextArr(templateElem);
       var textNodesWanted = new Array();
       
       for(var x = 0; x < textArrNodes.length; x++){
           var aNode = textArrNodes[x];
           var nodeVal = aNode['value'];
           var nodeElem = aNode['elem'];
           nodeVal = replaceAll(nodeVal, '|', "");  
           var textType = "";
           //if only numbers 
           var onlyNumbers = /^[0-9]+$/.test(nodeVal.trim());
           var replacedNonalpha = nodeVal.replace(/[^a-z0-9]/gi,'');
           //var hasAlpha = /\d|[A-z]/.test(nodeVal.trim());
           if(onlyNumbers){
               textType = "number";
           }else if(replacedNonalpha.length <= 0){
               textType = "symbol";
           }       

           textNodesWanted.push(textType + "text=" + nodeVal.length);           
       }       
       var joinedWanted = textNodesWanted.join('|');
        
       return joinedWanted;
    }
    else if(theAttribute == 'alltext'){
       if(templateElem == null){
           return "text=150";
       }
        
       theData = $(templateElem).text();          
       var textType = "";
       //if only numbers 
       var onlyNumbers = /^[0-9]+$/.test(theData.trim());
       var hasAlpha = /\d|[A-z]/.test(theData.trim());
       if(onlyNumbers){
           textType = "number";
       }else if(!hasAlpha){
           textType = "symbol";
       }       
       
       return textType + "text=" + theData.length;
    }    
    else if(theAttribute == 'src'){ 
        //we have to get the image sizes
        if(templateElem == null){
           return "image=" + 'https://snipcss-images.s3.amazonaws.com/illustration-woman-presenting-graphs-1681479526.jpg';
        }        
        theData = $(templateElem).attr('src');
        
        return "image=" + theData;
    }
    else if(theAttribute == 'href'){
        if(templateElem == null){
            return "link";
        }
        theData = $(templateElem).attr('href');  
        if(theData == '#' || theData.startsWith('javascript')){
            return "nolink";
        }else{
            return "link";
        }
    } 
    else if(theAttribute == 'html'){
        if(templateElem == null){
            return "text=100";
        }        
        theData = $(templateElem).html();         
            //should we get xxxxxx<span>xxxxxxx</span>xxxxxxxxx
        var textType = "";
        //if only numbers 
        var onlyNumbers = /^[0-9]+$/.test(theData.trim());
        var hasAlpha = /\d|[A-z]/.test(theData.trim());
        if(onlyNumbers){
            textType = "number";
        }else if(hasAlpha){
            textType = "symbol";
        }       

        return textType + "text=" + theData.length;        

    }
    else if(theAttribute == 'background-image'){
        return "background-image";
    }    
    else if(theAttribute == 'sources'){
        if(templateElem == null){
           return "image=" + 'https://snipcss-images.s3.amazonaws.com/illustration-woman-presenting-graphs-1681479526.jpg';
        }            
        var allSources = new Array();
        var x = 1;
        $(templateElem).find('source').each(function(){
            var theSrc = $(this).attr('src');
            theSrc = theSrc.split('?')[0];
            var isImages = false;
            if(theSrc.endWith('jpg') || theSrc.endWith('png') || theSrc.endWith('gif')){
                isImages = true;
            }
        });
        return "image=" + theData;        
    }
    else if(theAttribute.indexOf('custom') == 0){
        if(templateElem == null){
           return "text=50";
        }            
        var partArr = theAttribute.split('=');
        if(partArr.length > 1){
            var theAttribute = partArr[1];
            theData = $(templateElem).attr(theAttribute);                                  
            return "text=" + theData.length;
        }
    }             
    return "tag";
};

//replace an 
TEMPLATES.replaceAttributeValue = function(theAttribute, templateElem, templateLabel){
    
    console.log("in replaceAttribute");
    console.log({theAttribute});
    console.log({templateElem});
    console.log({templateLabel});
    
    var templateVar = "{{{" + templateLabel + "}}}";
    var theData = "";
    if(theAttribute == 'text'){       
       var textArrNodes = TEMPLATES.getNodeTextArr(templateElem);
       
       for(var x = 0; x < textArrNodes.length; x++){
           var aNode = textArrNodes[x];
           var nodeVal = aNode['value'];
           /*
           var nodeValTrim = nodeVal.trim();
           if(nodeValTrim.length <= 0){
               continue;
           }*/
           var nodeElem = aNode['elem'];
           nodeVal = replaceAll(nodeVal, '|', "");  
           var y = x + 1;
           if(y > 1){
               templateVar = "{{{" + templateLabel + "-" + y + "}}}";
           }else{
               templateVar = "{{{" + templateLabel + "}}}";               
           }
           if(theData == ""){
               theData = nodeVal;
           }else{
               theData += "|" + nodeVal;
           }
           nodeElem.replaceWith(templateVar);
       }       
    }
    else if(theAttribute == 'alltext'){
       theData = $(templateElem).text();          
       $(templateElem).text(templateVar);
    }    
    else if(theAttribute == 'src'){                 
        theData = $(templateElem).attr('src');        
        //should be removed further upstream...
        $(templateElem).removeAttr('srcset');
        $(templateElem).attr('src', templateVar);
    }
    else if(theAttribute == 'href'){
        theData = $(templateElem).attr('href');  
        $(templateElem).attr('href', templateVar);  
    } 
    else if(theAttribute == 'html'){
        theData = $(templateElem).html();                                 
        $(templateElem).html(templateVar);
    }
    else if(theAttribute == 'background-image'){
        var imageUrl = $(templateElem).css('background-image');     
        if(imageUrl !== 'none' && imageUrl.indexOf('url') !== -1){
            imageUrl = TEMPLATES.getBackgroundUrl(imageUrl);
            theData = imageUrl;           
        }       
        $(templateElem).css('background-image', templateVar);
    }    
    else if(theAttribute == 'sources'){
        var allSources = new Array();
        var x = 1;
        $(templateElem).find('source').each(function(){
            var theSrc = $(this).attr('src');
            templateVar = "{{" + templateLabel + "-" + x + "}}";            
            allSources.push(theSrc);
            x++;
        });
        if(allSources.length > 0){
            theData = allSources.join("|");
        }             
    }
    else if(theAttribute.indexOf('custom') == 0){
        var partArr = theAttribute.split('=');
        if(partArr.length > 1){
            var theAttribute = partArr[1];
            theData = $(templateElem).attr(theAttribute);                                  
            $(templateElem).attr(theAttribute, templateVar);
        }
    }             
    return theData;
};


TEMPLATES.iframeUpdateField = function(fieldIndex, newData){
    console.log("setting fieldIndex to " + fieldIndex);
    console.log("new object ");
    console.log(newData);
    TEMPLATES.ALL_FIELDS[fieldIndex] = newData;
    console.log("ALL fields now");
    console.log(TEMPLATES.ALL_FIELDS);
    
    TEMPLATES.reloadTemplate(false);
    TEMPLATES.saveTemplate(true);    
};

TEMPLATES.iframeSetDataOfElement = function(elemSelector){    
    if(TEMPLATES.SELECTING_EDIT){
        var tagName = $(elemSelector).get(0).tagName.toLowerCase();
        if(tagName == "img"){
            $('#setelement_edit_attribute').val('src');
        }
        else if(tagName == 'span' || tagName == 'p' || tagName == 'div' || tagName == 'article' || tagName == 'section' || tagName == 'x')
        {
            $('#setelement_edit_attribute').val('text');        
        }else if(tagName == 'a'){
            $('#setelement_edit_attribute').val('href');                
        }
        MicroModal.show('modal-set-element');  
        TEMPLATES.MODAL_OPEN = true;    
        TEMPLATES.SET_DATA_SELECTOR = elemSelector;    
        TEMPLATES.MODAL_NAME = 'modal-set-element';    
    }else if(TEMPLATES.SELECTING_IPSONIFY){
        
        let theIndex = 1;
        let allIpsumPromises = new Array();
        if($('#editing_html').length <= 0){
            $(TEMPLATES.SNIPHTML).wrap('<div>').parent().appendTo('body').attr('id', 'editing_html');
        }           
        var ipsumifyElement = function(individualSelector, tagName){       
            //$(theElem).addClass('ipsumify-'))
            if(tagName == "img"){
                $('#setelement_edit_attribute').val('src');
                allIpsumPromises.push(TEMPLATES.SINGLE_IPSUM_REPLACEMENT(individualSelector, 'src', ''));             
            }
            else if(tagName == 'a'){
                //two of them
                allIpsumPromises.push(TEMPLATES.SINGLE_IPSUM_REPLACEMENT(individualSelector, 'text', '')); 
                allIpsumPromises.push(TEMPLATES.SINGLE_IPSUM_REPLACEMENT(individualSelector, 'href', '')); 
            }
            else if(tagName == 'span' || tagName == 'p' || tagName == 'div' || tagName == 'article' || 
                tagName == 'section' || tagName == 'x'){       
                allIpsumPromises.push(TEMPLATES.SINGLE_IPSUM_REPLACEMENT(individualSelector, 'text', ''));               
            }                
        };
        
        //give it a sec
        setTimeout(function(){
            $('#editing_html').find(elemSelector).find('*').addBack().each(function(){
                let myClass = 'ipsumify-' + theIndex;
                $(this).addClass(myClass);
                let tagName = this.tagName.toLowerCase();
                ipsumifyElement("." + myClass, tagName);
                theIndex++;
            });
            //do all replacements... then do reload
            //should do promises
            Promise.all(allIpsumPromises).then(theResults => {         
                setTimeout(function(){
                    console.log("done editing single... cleaning up");
                    for(let ip = 0; ip < 1000; ip++){
                        //if($('.ipsumify-' + ip).length > 0){
                            $('.ipsumify-' + ip).removeClass('.ipsumify-' + ip);
                        //}
                    }
                    
                    $('#editing_html').remove();
                    $('#template').remove();  

                    TEMPLATES.$SNIPHTML = $(TEMPLATES.SNIPPET['snip_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');                     
                    document.getElementById('templatecode_iframe').contentWindow.startReloading();
                    TEMPLATES.reloadTemplate(true);
                    TEMPLATES.saveTemplate(true);
                }, 100);
            });
            
        }, 100);
    }
    
};

TEMPLATES.iframeEditModalField = function(fieldIndex, subfieldIndex){

    var topField = TEMPLATES.ALL_FIELDS[fieldIndex];
    
    if(subfieldIndex == -1){
        //list root element... 
        if(topField['field_type'] == 'list'){
            $('#fieldproperty_attribute').hide();            
        }else{
            $('#fieldproperty_attribute').show();  
            var theAttribute = topField['attribute'];
            $('#fieldproperty_attribute').val(theAttribute);
        }
        var topLabel = topField['label'];
        $('#existing_fieldname').val(topLabel);
    }else{
        var subfield = topField['sub_fields'][subfieldIndex];
        var theAttribute = subfield['attribute'];
        var theLabel = subfield['label'];
        console.log("setting existing attribute in modal ");
        console.log(theAttribute);
        console.log(theLabel);
        $('#existing_fieldname').val(theLabel);        
        $('#fieldproperty_attribute').show();
        $('#fieldproperty_attribute').val(theAttribute);
        
    }
    MicroModal.show('modal-edit-field');  
    TEMPLATES.MODAL_OPEN = true;    
    TEMPLATES.EDIT_FIELD_INDEX = fieldIndex;
    TEMPLATES.EDIT_FIELD_SUBINDEX = subfieldIndex;
    TEMPLATES.MODAL_NAME = 'modal-edit-field';
};


TEMPLATES.iframeNewListField = function(parentSelector, listSelector){
    var listElem = $(listSelector).get(0);
    if(listElem == null){
        toastr.error('Error!', 'Could not create list selector (trouble generating selector from repeat element');        
        //alert("Could not create list selector (trouble generating selector from repeat element)");
        return;
    }
    var rootElem = TEMPLATES.$SNIPHTML.get(0);
    var myLevel = 1;
    var $myParent = $(listElem).parent();
    while($myParent.get(0) != rootElem){
        $myParent = $myParent.parent();
        myLevel++;
        if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
            break;
        }
    } 
    TEMPLATES.IFRAME_IS_LOADING = true;
    document.getElementById('templatecode_iframe').contentWindow.startReloading();
    setTimeout(function(){
        
    var wasSuccess = TEMPLATES.addListSelector(listElem, myLevel);        
    if(wasSuccess){
        TEMPLATES.processListSelectors(TEMPLATES.LIST_SELECTORS.length - 1);
        TEMPLATES.initTemplateViewer(function(){
            TEMPLATES.reloadTemplate(true);
            TEMPLATES.saveTemplate(false);
            //$('#panel_template_name').html(TEMPLATES.TEMPLATE_NAME);
            document.getElementById('templatecode_iframe').contentWindow.stopReloading();
            
            //document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS);             
            
        });        
        $('.btn-is-selecting').removeClass('btn-is-selecting');
        
        //why stop the listener?  keep going
        
        TEMPLATES.SELECTING_LIST = false;            
        TEMPLATES.SELECTING_ITEM = false;            
        TEMPLATES.SELECTING_EDIT = false;         
        TEMPLATES.SELECTING_EDIT = false;        
        document.getElementById('templatecode_iframe').contentWindow.stopListListener();           
    }else{
        toastr.error('Error!', 'Could not create list selector (trouble generating selector from repeat element');        
        //alert("Could not create list selector (item may be contained by existing list or contain an existing list)");
        document.getElementById('templatecode_iframe').contentWindow.stopReloading();
    }
    }, 5000);
    
    
};

TEMPLATES.iframeNewItemField = function(theSelector){
    //iframeNewItemField
      
       let existingFieldParents = new Array();
       var rootElem = TEMPLATES.$SNIPHTML.get(0);
        var elem = TEMPLATES.$SNIPHTML.find(theSelector).get(0); 
        if(!elem || elem == null){
            toastr.error('Error!', 'Could not create selector for element');        
            //alert("could not create selector for element");
            return;
        }
        console.log("element creating field from ");
        console.log(elem);
       
       var isSubfield = false;
       var subfieldIndex = -1;
       for(let x = 0; x < TEMPLATES.ALL_FIELDS.length; x++){
           var aField = TEMPLATES.ALL_FIELDS[x];
           
           var mySelector = aField['the_selector'];
           if(aField['field_type'] == 'list'){
               let firstElem = TEMPLATES.$SNIPHTML.find(mySelector).get(0);
               var parentElem = $(firstElem).parent().get(0);
               console.log("parent element of list");
               console.log(parentElem);
                if($.contains( parentElem, this )){
                    isSubfield = true;
                    subfieldIndex = x;
                }                    
           }
           else if(aField['field_type'] == 'item'){
              let firstElem = TEMPLATES.$SNIPHTML.find(mySelector).get(0);
              if(firstElem == elem){
                  //duplicate field???  allow it because could be different property... maybe force different property
              }
           }
       }  

        var myLevel = 1;
        var $myParent = $(elem).parent();
        while($myParent.get(0) != rootElem){
            $myParent = $myParent.parent();
            myLevel++;
            if(myLevel > 20 || $myParent == null || $myParent.length <= 0 ){
                break;
            }
        }     
        
        TEMPLATES.NEWFIELD_IS_SUBFIELD = isSubfield;
        TEMPLATES.NEWFIELD_SUBINDEX = subfieldIndex;
        TEMPLATES.NEWFIELD_ELEM = elem;
        TEMPLATES.NEWFIELD_SELECTOR = theSelector;
        TEMPLATES.NEWFIELD_LEVEL = myLevel;
        
        let tagName = elem.nodeName.toLowerCase();
        if(tagName == 'a'){
            $('#newfield_href').css('display', 'none');
        }else{
            $('#newfield_href').css('display', 'block');            
        }
        
        if(tagName == 'src'){
            $('#newfield_src').css('display', 'none');
        }else{
            $('#newfield_src').css('display', 'block');            
        }        
        
        if(!isSubfield){
            $('#newfield_type').text("Item");
        }
        else{
            //this is a new item field 
            $('#newfield_type').text("List");            
        }
               
        MicroModal.show('modal-new-field');  
        TEMPLATES.MODAL_OPEN = true;           
};


TEMPLATES.loadTemplateFromData = function(templateData){
    
    console.log("loading template data ");
    console.log(templateData);
    //var theDesc = "Template extracted from " + templateData['snip_url'];
    console.log(templateData);
    console.log("template code");
    console.log(templateData['template_code']);

    TEMPLATES.ALL_FIELDS = templateData['all_fields'];
    TEMPLATES.SNIPUID = 'xxxxxxxxxxxxxxxxx';
    TEMPLATES.SNIPID = templateData['snip_id'];
    TEMPLATES.TEMPLATE_CODE = templateData['template_code'];
    TEMPLATES.TEMPLATE_JSON = templateData['template_data'];
    $('#template').remove();
    console.log("snip HTML");
    console.log(templateData['result_html']);
    
    TEMPLATES.$SNIPHTML = $(templateData['result_html']).wrap('<div>').parent().appendTo('body').attr('id', 'template');
    TEMPLATES.SNIPCSS = templateData['template_css'];
    TEMPLATES.SNIPHTML = templateData['result_html'];
    TEMPLATES.TEMPLATE_NAME = templateData['template_name'];
    TEMPLATES.TEMPLATE_LANGUAGE = templateData['template_language'];        
    

    TEMPLATES.initTemplateViewer(function(){
        TEMPLATES.reloadTemplate(true);
        setTimeout(function(){
            TEMPLATES.refreshCodemirrorHeight();
        }, 2000);
    });
    
};


TEMPLATES.saveTemplate = function(refreshTether){
    
    if(TEMPLATES.SNIPPET == null){
        alert("Select a snippet first");
        return;
    }
    
    //this is a function in options.js
    updateSnippet(TEMPLATES.SNIPUID, TEMPLATES.SNIPPET, function(){
        if(refreshTether){
            if(TEMPLATES.IN_EXTENSION){            
                document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS);
            }
        }        
    });   
    
    //WHY HAVE A COMPLETELY SEPARATE THING???
    /*
    var setData = {};
    var tempData = {};
    
    var dashTemplateName = TEMPLATES.doDashes(TEMPLATES.TEMPLATE_NAME);
    tempData['all_fields'] = TEMPLATES.ALL_FIELDS;
    tempData['template_name'] = TEMPLATES.TEMPLATE_NAME;
    tempData['template_slug'] = dashTemplateName;
    tempData['template_data'] = TEMPLATES.JSON_OBJECT;
    tempData['template_code'] = TEMPLATES.TEMPLATE_CODE;
    tempData['template_html'] = TEMPLATES.SNIPHTML;
    tempData['template_css'] = TEMPLATES.SNIPCSS;
    tempData['original_id'] = TEMPLATES.SNIPID;
    tempData['original_uid'] = TEMPLATES.SNIPUID;    
    
    tempData['template_language'] = "Mustache";    
    tempData['version'] = "1.0";
    
    setData["template-" + dashTemplateName] = tempData;
    
    chrome.storage.local.set(setData, function() {
        //console.log("key should be " + SHAWK.SITE_NAME);  
        //console.log('Value is set to ');
        //console.log(siteData);     
        if(refreshTether){
            if(TEMPLATES.IN_EXTENSION){            
                document.getElementById('templatecode_iframe').contentWindow.refreshTetherLabels(TEMPLATES.ALL_FIELDS);
            }
        }
    }); 
    
    console.log("saving to all templates");
    chrome.storage.local.get(['all_templates'], function(result) {
        var allTemplates = {};
        if(!result["all_templates"]){
            allTemplates['templates'] = new Array();
            allTemplates['total'] = 0;
        }else{
            allTemplates = result['all_templates'];
        }    
        var currTemplates = allTemplates['templates'];  
        //var theIndex = -1;
        var wasFound = false;
        for(var a = 0; a < currTemplates.length; a++){
            var aTemplate = currTemplates[a];
            if(aTemplate == dashTemplateName){
                //doesnt need to be added
                wasFound = true;
            }            
        }
        if(!wasFound){
            currTemplates.push(dashTemplateName);
        }
        
        var setData = {};
        var allData = {};
        allData['templates'] = currTemplates;
        allData['total'] = currTemplates.length;
        setData['all_templates'] = allData;           

        chrome.storage.local.set(setData, function() {                    
            chrome.storage.local.get(['all_templates'], function(result2) {
                console.log("all templates ");
                console.log(result2['all_templates']);
                if(!wasFound){
                    TEMPLATES.loadTemplateList();
                }
            });
        });                        
    });         
    */
    
};

TEMPLATES.doDashes = function(str) {
    return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
};        

TEMPLATES.refreshCodemirrorHeight = function(){
    setTimeout(function(){
        //#template_control_pane
        if(TEMPLATES.IN_EXTENSION){
            let panelHeight = $('#template_control_pane').height() - $('#panelheader-json').height();   
            console.log("panel height: " + panelHeight);
            $('#template_code_panel .CodeMirror').height(panelHeight + "px");              
            $('#templatejson_panel .CodeMirror').height(panelHeight + "px");     
        }else{
            console.log("refreshing height---"); 
            let panelHeight = $('#template_code_panel').height() - $('#panelheader-template').height();  
            console.log("panel height: " + panelHeight);
            $('#template_code_panel .CodeMirror').height(panelHeight + "px");
            $('#templatecss_panel .CodeMirror').height(panelHeight + "px");
            $('#templatejson_panel .CodeMirror').height(panelHeight + "px");
        }
        /*
        var panelHeight = $('#css_panel').height() - $('#panelheader-html').height();   
        console.log("panel height: " + panelHeight);
        $('.CodeMirror').height(panelHeight + "px");        
        var viewerHeight = $('#right_template_viewer').height();
        var previewPanelHeight = $('#templatecode_iframe').height();
        
        var leftoverHeight = (viewerHeight - previewPanelHeight) - 50;
        console.log("leftover height");
        console.log(leftoverHeight);
        
        var codepanelHeight = $('#template_code_panel').height();   
        var viewpanelHeight = $('#template_view_panel').height();
        
        console.log('code panel height');
        console.log(codepanelHeight);
        console.log("viewpanelheight");
        console.log(viewpanelHeight);
        
        $('#template_code_panel .CodeMirror').height(leftoverHeight + "px");
        */
        //no codemirror
        //$('#template_view_panel .CodeMirror').height(viewpanelHeight + "px");

    }, 10);        
};

TEMPLATES.setImagesizeIpsum = function(theResults){
    console.log("IN SET IMAGE IPSUM WITH RESULTS");
    console.log(theResults);
    
    for(let fieldKey in TEMPLATES.IPSUM_VARIABLES){
        console.log("a variable key: " + fieldKey);
        let fieldVal = TEMPLATES.IPSUM_VARIABLES[fieldKey];
        console.log("a variable val: ");
        console.log(fieldVal);
        if(Array.isArray(fieldVal)){
            console.log("is array");
            //list object 
            for(let f = 0; f < fieldVal.length; f++){
                let listItemObject = fieldVal[f];
                console.log("list item object");
                console.log(listItemObject);
                for(let listItemKey in listItemObject){
                    console.log("listitemkey " + listItemKey);
                    var listItemVal = listItemObject[listItemKey];
                    //check if listItemVal is string here...
                    if(typeof listItemVal === "string") {
                        if(listItemVal.startsWith("image=") || listItemVal.startsWith("background-image=")){
                            var currImgKey = listItemVal.split('=')[0];                        
                            var currImgVal = listItemVal.split('=')[1];
                            currImgVal = currImgVal.split('|')[0];
                            for(var x = 0; x < theResults.length; x++){
                                let origUrl = theResults[x]['origurl'];
                                console.log("comparing " + origUrl);
                                console.log("vs " + currImgVal);
                                if(origUrl == currImgVal){
                                    let imgW = theResults[x]['width'];
                                    let imgH = theResults[x]['height'];                                
                                    let imgA = theResults[x]['hasalpha'];
                                    console.log("WOW IS THIS WORKING?  CHANGING LIST FIELD IMAGE FROM " + origUrl + " to " + imgW + "," + imgH);
                                    TEMPLATES.IPSUM_VARIABLES[fieldKey][f][listItemKey] = currImgKey + "=" + imgW +"," + imgH + "," + imgA;
                                }
                            }
                        }
                    }else{
                        //sublist
                        //i dont know
                    }
                }
            }
        }
        else{
            //item object 
            if(fieldVal.startsWith("image=") || fieldVal.startsWith("background-image=")){
                var currImgKey = fieldVal.split('=')[0];                        
                var currImgVal = fieldVal.split('=')[1];
                currImgVal = currImgVal.split('|')[0];
                for(var x = 0; x < theResults.length; x++){
                    let origUrl = theResults[x]['origurl'];
                    if(origUrl == currImgVal){
                        let imgW = theResults[x]['width'];
                        let imgH = theResults[x]['height'];                                
                        let imgA = theResults[x]['hasalpha'];                                
                        
                        console.log("WOW IS THIS WORKING?  CHANGING ITEM FIELD IMAGE FROM " + origUrl + " to " + imgW + "," + imgH);
                        TEMPLATES.IPSUM_VARIABLES[fieldKey] = currImgKey + "=" + imgW +"," + imgH + "," + imgA;
                    }
                }
            }            
            
        }
    }    
};

TEMPLATES.fillIpsumFields = function(){
    
    var getIpsumResult = function(ipsumStuff){
        
        var ipsumResults = new Array();
        let allIpsums = ipsumStuff.split('|');
        
        for(let a = 0; a < allIpsums.length; a++){
            let ipsumParts = allIpsums[a].split('=');
            let ipsumType = ipsumParts[0];
            let ipsumLength = 0;
            if(ipsumParts.length > 1){
                ipsumLength = ipsumParts[1];

            }    
            if(ipsumLength == 0){
                ipsumResults.push("");
                continue;
            }            

            if(ipsumType == 'text'){
                ipsumResults.push("xyzxyzxyz");
            }
            else if(ipsumType == 'symboltext'){
                ipsumResults.push("**********");        
            }
            else if(ipsumType == 'numbertext'){
                ipsumResults.push("123456678");
            }
            else if(ipsumType == 'image'){
                ipsumResults.push("https://snipcss-images.s3.amazonaws.com/azfzbHi-1650519233-HIWmYLqVA9w.jpg");
            }
            else if(ipsumType == 'link'){
                ipsumResults.push("https://www.snipcss.com");
            }
            else if(ipsumType == ''){

            }
        }
        console.log("ipsum stuff was: ");
        console.log(ipsumStuff);
        console.log("results done");
        console.log(ipsumResults);
        
        return ipsumResults;
    };
    
    let filledObject = {}; 
    let theTheme = TEMPLATES.IPSUM_THEME;
    for(let fieldKey in TEMPLATES.IPSUM_VARIABLES){
        let fieldVal = TEMPLATES.IPSUM_VARIABLES[fieldKey];
        if(Array.isArray(fieldVal)){
            //list object 
            let filledListArray = new Array();
            for(let f = 0; f < fieldVal.length; f++){
                let listItemObject = fieldVal[f];
                let filledListItem = {};
                for(let listItemKey in listItemObject){
                    var listItemVal = listItemObject[listItemKey];
                    let ipsumResult = getIpsumResult(listItemVal);
                    for(var x = 0; x < ipsumResult.length; x++){
                        if(x == 0){
                            filledListItem[listItemKey] = ipsumResult[x];
                        }else{
                            filledListItem[listItemKey + "-" + x] = ipsumResult[x];                            
                        }
                    }
                                        
                }
                filledListArray.push(filledListItem);
            }
            filledObject[fieldKey] = filledListArray;
        }
        else{
            
            let ipsumResult = getIpsumResult(fieldVal);
            filledObject[fieldKey] = ipsumResult;
        }
    }
    
    return filledObject;
};

TEMPLATES.reactifyMustacheHtml = function(){
    //Reactifying html does two things...
    //1. change class attribute to className
    //2. All void elements must have slash at end
    
    //let rootElem = TEMPLATES.$SNIPHTML.get(0);
    //let processedNodes = new Array();      

    var $clone = $('#mymustache').clone();
    var $cloneWrap = $clone.wrap('<div id="mustachewrap"></div>').parent(); 

    //var nodesByLevel
    
    console.log("clonehtml before");
    console.log($clone.get(0).innerHTML);
    
    $cloneWrap.find('*').each(function(){        
        let voidElements = ['area', 'base' , 'br' , 'col' , 'command' , 'embed' , 'hr' , 'img' , 
            'input' , 'keygen' , 'link' , 'meta' , 'param' , 'source' , 'track' , 'wbr'];
        var myTag = this.nodeName.toLowerCase();
        let currTagHasClasslist = true;
        if(myTag == 'path' || myTag == 'rect' || myTag == 'circle' ||
           myTag == 'ellipse' || myTag == 'line' || myTag == 'polyline' ||
           myTag == 'polygon' || myTag == 'svg'){   
              currTagHasClasslist = false;
        }    
 
        //console.log("SELECTOR TEST 2 - BY CLASS");   
        /*
        if(currTagHasClasslist){
            var elemClassnames = this.className;        
            $(this).removeAttr('class');
            if(elemClassnames && elemClassnames.length > 0){
                $(this).attr('className', elemClassnames);
            }
        }
        */  
        console.log("Processing " + myTag + "with Classnames ");
        
        if($(this).children().length > 0){
            //void elements can't have children
        }else{
            if(voidElements.includes(myTag)){
                console.log("Found void element");
                var outerHtml = this.outerHTML.trim();                
                console.log(outerHtml);
                if(outerHtml.endsWith("\/>")){
                    console.log("outerhtml ends with slash");
                }else if(outerHtml.endsWith(">")){
                    console.log("outerhtml ends with >");
                    //hacky                    
                    outerHtml = outerHtml.substr(0, outerHtml.length - 1) + "closeslash/>";
                    $(this).replaceWith(outerHtml);                    
                }else{
                    console.log("what the fuck");
                }
            }
        }        
    });
    console.log("after reactify");
    let retHtml = $clone.get(0).innerHTML;
    retHtml = replaceAll(retHtml, 'class="', 'className="');  
    //hacky
    retHtml = replaceAll(retHtml, 'closeslash="">', '\/>');  
    
    console.log(retHtml);    
    
    return retHtml;
};

TEMPLATES.getIpsumImage = function(){
    
};

TEMPLATES.getIpsumText = function(ipsumType, targetLength, hasPunctuation){
    let sentences = IPSUM[ipsumType]['sentences'];
    let tags = IPSUM[ipsumType]['tags'];
    if(targetLength < 10){
        //use a tag
        let anIndex = Math.floor(Math.random() * tags.length);
        let maxTries = 50;
        while(IPSUM.TAG_USED.contains(anIndex) && maxTries > 0){
            anIndex = (Math.random() * tags.length);
            maxTries--;
        }
        IPSUM.TAG_USED.push(anIndex);
        return tags[anIndex];
    }else{
        let ipsumText = "";
        while(ipsumText.length < (targetLength - 5) && maxTries > 0){
            let anIndex = Math.floor(Math.random() * sentences.length);
            if(!IPSUM.SENTENCE_USED.contains(anIndex)){
                ipsumText += sentences[anIndex];
                if(hasPunctuation){
                    ipsumText += '.';
                }
                ipsumText += ' ';                
            }
        }
        if(ipsumText == ""){
            return sentences[0];
        }
        
        return ipsumText;
    }
    
    return '';
};

TEMPLATES.getDefaultComponentName = function(){
    let templateName = TEMPLATES.TEMPLATE_NAME;        

    //get decent name for component
    for(let f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
        let aField = TEMPLATES.ALL_FIELDS[f];
        if(aField['field_type'] == 'list'){
            var fieldListName = aField['field_name'];  
            let firstChar = fieldListName.substring(0,1).toUpperCase();
            let restString = '';
            if(fieldListName.length > 1){
                restString = fieldListName.substring(1);
            }
            return firstChar + restString + "Component";
        }        
    }
    for(let f = 0; f < TEMPLATES.ALL_FIELDS.length; f++){
        let aField = TEMPLATES.ALL_FIELDS[f];
        if(aField['field_type'] == 'item' && aField['attribute'] == 'text'){
            var fieldListName = aField['field_name'];  
            let firstChar = fieldListName.substring(0,1).toUpperCase();
            let restString = '';
            if(fieldListName.length > 1){
                restString = fieldListName.substring(1);
            }
            return firstChar + restString + "Component";            
        }   
    }
    if(templateName.length > 5){
        let fieldListName = templateName.substring(0, 5);
        let firstChar = fieldListName.substring(0,1).toUpperCase();
        let restString = '';
        if(fieldListName.length > 1){
            restString = fieldListName.substring(1);
        }
        return firstChar + restString + "Component";                    
    }
    return "MyComponent";
};

TEMPLATES.resetFields = function(){
    console.log("resetting fields");
    TEMPLATES.initTemplateViewer(function(){});
    TEMPLATES.CURR_UID = "";
    TEMPLATES.CURR_SCREENSHOT = "";
    TEMPLATES.USE_IPSUM_SERVER = true;
    TEMPLATES.SNIPPET = null;
    TEMPLATES.$SNIPHTML = null;
    TEMPLATES.TOP_ELEM = null;
    TEMPLATES.SNIPCSS = null;
    TEMPLATES.SNIPHTML = null;  //original html
    TEMPLATES.RESULT_HTML = null;
    TEMPLATES.SNIPUID = null;
    TEMPLATES.SNIPID = null;
    TEMPLATES.TEMPLATE_NAME = "";
    TEMPLATES.COMPONENT_NAME = "";

    TEMPLATES.AUTOCREATE_REPEAT = true;
    TEMPLATES.AUTOCREATE_ALL = true;
    TEMPLATES.LIST_SELECTORS = new Array();
    TEMPLATES.MODAL_OPEN = false;
    TEMPLATES.EDIT_FIELD_INDEX = null;
    TEMPLATES.EDIT_FIELD_SUBINDEX = null;
    TEMPLATES.MODAL_NAME = '';
    TEMPLATES.SET_DATA_SELECTOR = null;
    TEMPLATES.INITIALIZED_VIEWER = false;
    TEMPLATES.SVG_VARIABLES = new Array();

    //for labels
    TEMPLATES.IMGNUM = 1;
    TEMPLATES.VIDNUM = 1;
    TEMPLATES.LINKNUM = 1;
    TEMPLATES.TITLENUM = 1;
    TEMPLATES.TEXTNUM = 1;

    //editors 
    TEMPLATES.JSON_EDITOR = null;
    TEMPLATES.TEMPLATE_EDITOR = null;
    TEMPLATES.CSS_EDITOR = null;  //only used on website version
    TEMPLATES.IFRAME_BODY = null;

    //code that gets injected
    TEMPLATES.TEMPLATE_CODE = "";
    TEMPLATES.TEMPLATE_LANGUAGE = "Mustache";
    TEMPLATES.JSON_OBJECT = {};
    TEMPLATES.IPSUM_VARIABLES = {};
    TEMPLATES.IPSUM_THEME = "lorem";
    TEMPLATES.DEFAULT_NUM_LISTITEMS = -1;

    //LIST
    TEMPLATES.SELECTING_LIST = false;
    TEMPLATES.SELECTING_ITEM = false;
    TEMPLATES.SELECTING_EDIT = false;

    //creating a new field modal
    TEMPLATES.NEWFIELD_IS_SUBFIELD = false;
    TEMPLATES.NEWFIELD_SUBINDEX = -1;
    TEMPLATES.NEWFIELD_ELEM = null;
    TEMPLATES.NEWFIELD_SELECTOR = "";
    TEMPLATES.NEWFIELD_LEVEL = 0;
    TEMPLATES.TEMPLATE_DB_ID = 0;

    TEMPLATES.ALL_FIELDS = new Array(); 

};

TEMPLATES.REFRESH_ENGINE_DISPLAY = function(){
    if(OPTIONS.TEMPLATE_ENGINE == 'mustache'){
        $('#current_template_engine').html('Mustache');    
        $('#rowtemplatebutton_react').css('display', 'block');
        $('#rowtemplatebutton_vue').css('display', 'block');
        $('#rowtemplatebutton_mustache').css('display', 'none');        
    }
    else if(OPTIONS.TEMPLATE_ENGINE == 'react'){
        $('#current_template_engine').html('React');            
        $('#rowtemplatebutton_react').css('display', 'none');
        $('#rowtemplatebutton_vue').css('display', 'block');
        $('#rowtemplatebutton_mustache').css('display', 'block');        
        
    }
    else if(OPTIONS.TEMPLATE_ENGINE == 'vue'){
        $('#current_template_engine').html('Vue');                    
        $('#rowtemplatebutton_react').css('display', 'block');
        $('#rowtemplatebutton_vue').css('display', 'none');
        $('#rowtemplatebutton_mustache').css('display', 'block');                
    }else{
        $('#current_template_engine').html('Mustache');    
        $('#rowtemplatebutton_react').css('display', 'block');
        $('#rowtemplatebutton_vue').css('display', 'block');
        $('#rowtemplatebutton_mustache').css('display', 'none');          
    }
    
};

TEMPLATES.getColorMapping = function(cssLines){
    TEMPLATES.ALL_COLORS = new Array();
    var parser = new cssjs();
    var parsedCssNew = parser.parseCSS(cssLines);         

    //console.log("css lines");
    for(var v = 0; v < parsedCssNew.length; v++){
        //console.log("testing type");
        //console.log(parsedCssNew[v]);        
        var parsedLine = parsedCssNew[v];
        if("rules" in parsedLine){
            for(var r = 0; r < parsedLine['rules'].length; r++){
                console.log("a rule");
                var aRule = parsedLine['rules'][r];
                console.log(aRule);
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
                console.log("testing directive for colors " + directive);
                ruleVal = ruleVal.replace('!important', '');
                var extractedColors = extractColorsWithRegex(ruleVal);
                if(extractedColors.length > 0){
                    for(let e = 0; e < extractedColors.length; e++){
                        var eColor = extractedColors[e];
                        if(TEMPLATES.ALL_COLORS.includes(eColor)){
                            
                        }else{
                            TEMPLATES.ALL_COLORS.push(eColor);
                        }
                    }
                }

            }

        }            
    }
    console.log("After parsing all css lines, the colors are: ");
    console.log(TEMPLATES.ALL_COLORS);    
}

TEMPLATES.SINGLE_IPSUM_REPLACEMENT = function(dataSelector, editAttr, overrideValue){
    //let promise
    var dfd = new $.Deferred();
    let updateNewValue = function(theElem, theAttribute, theData, mySelector){
        console.log("in update new value");
        console.log(theElem);
        console.log(theAttribute);
        console.log(theData);
        if(theAttribute == 'src'){                 
            $(theElem).attr('src', theData);
            console.log("setting src");
        }
        else if(theAttribute == 'href'){
            $(theElem).attr('href', theData);  
            console.log("setting href");                
        } 
        else if(theAttribute == 'text'){                             
            $(theElem).html(theData);
            console.log("inner html");                
        }
        else if(theAttribute == 'delete'){
            console.log("deleting element");
            $(theElem).remove();
        }          

        console.log("BEFORE EDIT ");
        console.log(TEMPLATES.SNIPHTML);
        if(mySelector.indexOf('ipsumify-') === 0){
            $(theElem).removeClass(mySelector.substring(1));
        }
        TEMPLATES.SNIPHTML = $('#editing_html').html();
        TEMPLATES.SNIPPET['snip_html'] = TEMPLATES.SNIPHTML;
        console.log("after edit sniphtml");
        console.log(TEMPLATES.SNIPHTML);
           

        //$('.btn-is-selecting').removeClass('btn-is-selecting');
        
        //why stop the listener?  keep going
        /*
        TEMPLATES.SELECTING_LIST = false;            
        TEMPLATES.SELECTING_ITEM = false;            
        TEMPLATES.SELECTING_EDIT = false;         
        TEMPLATES.SELECTING_EDIT = false;        
        document.getElementById('templatecode_iframe').contentWindow.stopListListener();                                  
         */
        if(TEMPLATES.MODAL_OPEN){
            MicroModal.close("modal-set-element");    
            TEMPLATES.MODAL_OPEN = false;
        }
        let retObj = {ipusm: theData};
        dfd.resolve(retObj);                
    };
    
    //give it a second
    setTimeout(function(){
        if($('#editing_html').find(dataSelector).length <= 0){
            toastr.error('Error!', 'Error: Could not find element in existing HTML');
            //alert("Error: Could not find element in existing HTML");
            return;
        }            
        console.log("finding dataselector");
        console.log(dataSelector);
        let editElem = $('#editing_html').find(dataSelector).get(0); 

                    //$('#setelement_edit_attribute').val();   
        let tagName = editElem.tagName.toLowerCase();     

        if(overrideValue == ''){
            var requestObj = {};
            if(editAttr == 'src'){
                var currSrc = $(editElem).attr('src');
                let parentWidth = $(editElem).parent().width();
                let parentHeight = $(editElem).parent().height();
                console.log("img parent width: " + parentWidth);
                console.log("img parent height: " + parentHeight);
                
                let imgPromise = TEMPLATES.getImageSizePromise(currSrc, parentWidth, parentHeight);
                imgPromise.then((retObj) => {
                  let imgW = retObj['width']; 
                  let imgH = retObj['height'];
                  let imgA = retObj['hasalpha'];
                  requestObj['randomdata'] = "image=" + imgW +"," + imgH + "," + imgA;           
                  API.LoremIpsonify(requestObj, TEMPLATES.IPSUM_THEME, function(retData){            
                        console.log("ipsum response for one image");
                        console.log(retData);
                        var customVal = retData['randomdata'];
                        updateNewValue(editElem, editAttr, customVal, dataSelector);
                   });
                });
            }
            else if(editAttr == 'text'){
                var theData = $(editElem).text();          
                var textType = "";
                //if only numbers 
                var onlyNumbers = /^[0-9]+$/.test(theData.trim());
                var hasAlpha = /\d|[A-z]/.test(theData.trim());
                if(onlyNumbers){
                    textType = "number";
                }else if(!hasAlpha){
                    textType = "symbol";
                }       

                requestObj['randomdata'] = "text=" + theData.length;   
                API.LoremIpsonify(requestObj, TEMPLATES.IPSUM_THEME, function(retData){            
                    console.log("ipsum response for one text");
                    console.log(retData);
                    var customVal = retData['randomdata'];
                    updateNewValue(editElem, editAttr, customVal, dataSelector);
                });

            }else if(editAttr == 'href'){
                updateNewValue(editElem, editAttr, '#yourlink', dataSelector);
            }else if(editAttr == 'delete'){
                updateNewValue(editElem, editAttr, '', dataSelector);
            }
        }else{
            var newValue = $('#set_element_custom_value').val();                      
            updateNewValue(editElem, editAttr, newValue, dataSelector);
        }        
    }, 50);
    
    return dfd.promise();

};

TEMPLATES.getImageSizePromise = function(url, pWidth, pHeight, changeElem) {
  if(url.indexOf('|') >= 0){
    url = url.split('|')[0];
  }

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        throw new Error(`Error fetching image: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        var hasAlpha = 0;
        
        
        var cvs = document.createElement('canvas');
        $('body').append(cvs);
        cvs.width = img.width;
        cvs.height = img.height;       
        
        let retWidth = img.naturalWidth;
        let retHeight = img.naturalHeight;
        
        var ctx = cvs.getContext('2d');
        console.log("drawing img... " + img.width + ", " + img.height);
        
        ctx.drawImage(img, 0,0, img.width, img.height);
        
        console.log("getting ctx data");;
        let topleftData = ctx.getImageData(0, 0, 1, 1).data;
        if(topleftData[3] < 128){
            hasAlpha = 1;
        }
        
        let toprightData = ctx.getImageData(img.width - 1, 0, 1, 1).data;
        if(toprightData[3] < 128){
            hasAlpha = 1;
        }
        
        let bottomrightData = ctx.getImageData(img.width - 1, img.height - 1, 1, 1).data;
        if(bottomrightData[3] < 128){
            hasAlpha = 1;
        }        
        let bottomleftData = ctx.getImageData(0, img.height - 1, 1, 1).data;
        if(bottomleftData[3] < 128){
            hasAlpha = 1;
        }        

        resolve({
          width: retWidth,
          height: retHeight,
          origurl: url,
          hasalpha: hasAlpha,
          origelem: changeElem,
          is_error: false,
          contenttype: contentType 
        });
        console.log("urlsize " + url);
        console.log('width', img.width);
        console.log('height', img.height);
        console.log('hasalpha', hasAlpha);
        setTimeout(function(){
            $(cvs).remove();
        }, 100);
      };
      img.onerror = function(){
        //on error
        console.log("image loading error");
        console.log(url);

        resolve({
          width: pWidth,
          height: pHeight,
          origurl: url,
          hasalpha: 0,
          origelem: changeElem,
          is_error: true,
          contenttype: contentType 
        });
      };
      img.src = imageUrl;

    } catch (error) {
      console.error('Error fetching image MIME type:', error);
        resolve({
          width: 128,
          height: 128,
          origurl: 'https://snipcss-images.s3.amazonaws.com/illustration-woman-presenting-graphs-1681479526.jpg',
          hasalpha: 0,
          origelem: '<img src="" />',
          is_error: true,
          contenttype: 'image/jpeg' 
        });
    }
  });
};

/*
TEMPLATES.getImageSizePromiseOLD = function(url, pWidth, pHeight, changeElem) {
  if(url.indexOf('|') >= 0){
      url = url.split('|')[0];
  }  
    
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        var hasAlpha = 0;
        
        
        var cvs = document.createElement('canvas');
        $('body').append(cvs);
        cvs.width = img.width;
        cvs.height = img.height;       
        
        let retWidth = img.naturalWidth;
        let retHeight = img.naturalHeight;
        
        var ctx = cvs.getContext('2d');
        console.log("drawing img... " + img.width + ", " + img.height);
        
        ctx.drawImage(img, 0,0, img.width, img.height);
        
        console.log("getting ctx data");;
        let topleftData = ctx.getImageData(0, 0, 1, 1).data;
        if(topleftData[3] < 128){
            hasAlpha = 1;
        }
        
        let toprightData = ctx.getImageData(img.width - 1, 0, 1, 1).data;
        if(toprightData[3] < 128){
            hasAlpha = 1;
        }
        
        let bottomrightData = ctx.getImageData(img.width - 1, img.height - 1, 1, 1).data;
        if(bottomrightData[3] < 128){
            hasAlpha = 1;
        }        
        let bottomleftData = ctx.getImageData(0, img.height - 1, 1, 1).data;
        if(bottomleftData[3] < 128){
            hasAlpha = 1;
        }        
       
        resolve({
            width: retWidth,
            height: retHeight,
            origurl: url,
            hasalpha: hasAlpha,
            origelem: changeElem,
            is_error: false
         });
        console.log("urlsize " + url);
        console.log('width', img.width);
        console.log('height', img.height);
        console.log('hasalpha', hasAlpha);
        setTimeout(function(){
            $(cvs).remove();
        }, 100);
    };
    img.onerror = function(){
        //on error
        console.log("image loading error");
        console.log(url);
        resolve({
            width: pWidth,
            height: pHeight,
            origurl: url,
            hasalpha: 0,
            origelem: changeElem,
            is_error: true
         });        
    };
    let cacheBreaker = new Date().getTime();
    img.src = url + "?" + cacheBreaker;

  });
};
    */

    function templateLoadMobileIcons(){

        if($('#mobileicon_container').length <= 0){
            $('#right_template_viewer > .gutter-vertical').after('<div id="mobileicon_container"><div id="mobileicon_absolute">' + 
                    '<a id="mobileicon_desktop" href="#"><i class="fas fa-desktop"></i></a>' +                       
                    '<a id="mobileicon_tablet" href="#"><i class="fas fa-tablet"></i></a>' + 
                    '<a id="mobileicon_mobile" href="#"><i class="fas fa-mobile"></i></a>' +                              
                    '</div></div>');
            

            $('body').on('click', '#mobileicon_mobile', function(){
                $('#template_view_panel').css('width', '380px');
                $('#preview_panel').css('width', '');     
                SNIPCSS.CURR_DEVICE_SIZE = "mobile";
                //frame info message in extension
                //$('.snipcss-frame-info').css('display', 'block');
                if(TEMPLATES.SNIPPET != null){
                    let noDeviceWidthFrame = replaceAll(TEMPLATES.SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
                    let anIframe = document.querySelector('#preview_iframe');
                    anIframe.contentDocument.body.innerHTML = '';                
                    anIframe.contentDocument.write(noDeviceWidthFrame);                               
                }
            });
            $('body').on('click', '#mobileicon_desktop', function(){
                $('#template_view_panel').css('width', '100%');           
                $('#preview_panel').css('width', '');             
                SNIPCSS.CURR_DEVICE_SIZE = "desktop"; 
                //frame info message in extension                
                //$('.snipcss-frame-info').css('display', 'none');
                if(SNIPCSS.SELECTED_SNIPPET != null){
                    let anIframe = document.querySelector('#preview_iframe');
                    anIframe.contentDocument.body.innerHTML = '';      
                    anIframe.contentDocument.write(SNIPCSS.SELECTED_SNIPPET['snip_iframe']);                               
                }

            });
            $('body').on('click', '#mobileicon_tablet', function(){
                $('#template_view_panel').css('width', '770px');                        
                $('#preview_panel').css('width', '');  
                SNIPCSS.CURR_DEVICE_SIZE = "tablet"; 
                $('.snipcss-frame-info').css('display', 'block');
                if(SNIPCSS.SELECTED_SNIPPET != null){
                    let noDeviceWidthFrame = replaceAll(SNIPCSS.SELECTED_SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
                    let anIframe = document.querySelector('#preview_iframe');  
                    anIframe.contentDocument.body.innerHTML = '';      
                    anIframe.contentDocument.write(noDeviceWidthFrame);                               
                }

            });
            $('body').on('click', '#mobileicon_custom', function(){
                MicroModal.show('modal-custom-width');   

                //$('.snipcss-frame-wrapper').css('width', '770px');                        
            });        
            
            
            
        }        
        

        
        
    }
    
    TEMPLATES.setDeviceCustomWidth = function(newWidth){
        $('#template_view_panel').css('width', newWidth + 'px');                        
        $('#preview_panel').css('width', '');  
        SNIPCSS.CURR_DEVICE_SIZE = "custom"; 
        $('.snipcss-frame-info').css('display', 'block');
        if(SNIPCSS.SELECTED_SNIPPET != null){
            let noDeviceWidthFrame = replaceAll(SNIPCSS.SELECTED_SNIPPET['snip_iframe'], 'max-device-width', 'max-width');
            let anIframe = document.querySelector('#preview_iframe');  
            anIframe.contentDocument.body.innerHTML = '';      
            anIframe.contentDocument.write(noDeviceWidthFrame);                               
        }          
    }  
    
    TEMPLATES.randomLetters = function(length){
        var letters = "abcdefghijklmnopqrstovwxyz";
        var len = letters.length - 1;
        var retString = "";
        for(var x =0; x < length; x++){
            var rand = Math.floor(Math.random() * len);
            retString = retString + letters.substr(rand, 1);
        }
        return retString; 
   }    
   
   
   TEMPLATES.refreshReactVueButtons = function(){
       let isActive = false;
       let hasLoop = false;
       if(TEMPLATES.TEMPLATE_CODE.indexOf("{{") >= 0 && TEMPLATES.TEMPLATE_CODE.indexOf("}}") >= 0){
           isActive = true;
           if(TEMPLATES.TEMPLATE_CODE.indexOf("{{#")){
               hasLoop = true;
           }
       }else{
           console.log("not active code");
           console.log(TEMPLATES.TEMPLATE_CODE);
       }
       if(isActive){
           setTimeout(function(){
                $('.convert_mustache').addClass('active_convert');               
           }, 500);
       }else{
           $('.convert_mustache').removeClass('active_convert');           
       }       
   };
   
   TEMPLATES.detectCopyrightProblems = function(allHtml, allCss, siteUrl){
       
        let allProblems = new Array();
        var siteName = siteUrl.replace("https://", "");
        siteName = siteName.replace("http://", "");
        siteName = siteName.replace('//', "");
        siteName = siteName.split('/')[0];
        siteName = siteName.replace('www.', '');       
        var cssLines = allCss.split("\n");        
        
        for(var v = 0; v < cssLines.length; v++){
            //console.log("testing type");
            //console.log(parsedCssNew[v]);        
            var aLine = cssLines[v];
            let lineIndex = v + 1;
            //console.log("Line: " );
            //console.log(aLine);

            var allUrls = aLine.split(',');                                
            for(var u = 0; u < allUrls.length; u++){
                var singleUrl = allUrls[u];
                if(singleUrl.indexOf('url') >= 0){ 
                    if(singleUrl.indexOf('snipcss-images.') >= 0){
                        continue;
                    }
                    if(singleUrl.indexOf('tabler-icons.min.css') >= 0){
                        continue;
                    }                    
                    if(singleUrl.indexOf('fonts.googleapis.com') >= 0){
                        continue;
                    }
                    if(singleUrl.indexOf('tablericons2') >= 0){
                        continue;
                    }
                    
                    let isDataUrl = false;
                    if(singleUrl.indexOf('data:') === -1){
                        isDataUrl = true;
                    }       
                    let aProblem = {
                        problem_type : 'CSS',
                        line_number: lineIndex,
                        thetext: aLine
                    };
                    allProblems.push(aProblem);                            
                }   

            }
        }
        
        let htmlUrls = TEMPLATES.extractUrls(allHtml);
        for(let h = 0; h < htmlUrls.length; h++){
            let urlObj = htmlUrls[h];
            let theUrl = urlObj['url'];
            let theLine = urlObj['line'];
            let theLineText = urlObj['line_text'];
            if(theUrl.indexOf('snipcss-images.') >= 0){
                continue;
            }
            if(theUrl.indexOf('fonts.googleapis.com') >= 0){
                continue;
            } 
            if(theUrl.indexOf('snipcss.com') >= 0){
                continue;
            }
            if(theLineText.indexOf('icon icon-tabler') >= 0){
                continue;
            }
            let aProblem = {
                problem_type : 'HTML',
                line_number: theLine,
                thetext: theLineText
            };
            allProblems.push(aProblem);
        }
        
        if(allHtml.indexOf(siteName) >= 0){
            let aProblem = {
                problem_type : 'HTML',
                line_number: "?",
                thetext: "The template html contains the text " + siteName + " so people could figure out original url." 
            };
            allProblems.push(aProblem);
        }
        if(allCss.indexOf(siteName) >= 0){
            let aProblem = {
                problem_type : 'CSS',
                line_number: "?",
                thetext: "The CSS contains the text " + siteName + " so people could figure out original url." 
            };
            allProblems.push(aProblem);
        }
        
        console.log("all problems");
        console.log(allProblems);  
        
        return allProblems;
   };
   
   TEMPLATES.replaceSvg = function(){
       
   };
   
    TEMPLATES.replaceImages = function(){
       let templateCode = TEMPLATES.TEMPLATE_CODE;
       $('#mymustache').remove();
       $(templateCode).wrap('<div>').parent().appendTo('body').attr('id', 'mymustache');   
       
        let rootId = $(templateCode).get(0).id;
        if(!rootId || rootId == "");
        {
            rootId = 'template-' + TEMPLATES.randomLetters(3);
        }
        TEMPLATES.SAVED_ID = rootId;       

       let imgPromises = new Array();
       //TEMPLATES.getImageSizePromise
       $('#mymustache').find('img').each(function(){
           let theSource = $(this).attr('src');
           if(theSource.indexOf('snipcss-images') >= 0){
               //already a snipcss image
               return;
           }
           if(theSource.indexOf('{{') >= 0){
               //already a template variable
               return;
           }
           let pWidth = $(this).parent().width();
           let pHeight = $(this).parent().height();
           let imgPromise = TEMPLATES.getImageSizePromise(theSource, pWidth, pHeight, this);   
           imgPromises.push(imgPromise);
       });
       
       Promise.all(imgPromises).then(theResults => { 

          TEMPLATES.IPSUM_VARIABLES = {};
          let resultElements = {};
          
          for(let m = 0; m < theResults.length; m++){
              
            let aResult = theResults[m];
            let theIndex = m + 1;
            console.log("aResult ");
            console.log(aResult);
            TEMPLATES.IPSUM_VARIABLES['image' + theIndex] = "image=" + aResult['width'] + "," + aResult['height'] + "," + aResult['hasalpha'];
            resultElements['image' + theIndex] = aResult['origelem'];     
          }
          API.LoremIpsonify(TEMPLATES.IPSUM_VARIABLES, TEMPLATES.IPSUM_THEME, function(retData){            
                console.log("response from server");
                console.log(retData);
                for(let aKey in retData){
                    let theElem = resultElements[aKey];
                    let theUrl = retData[aKey];
                    
                    $(theElem).attr('src', theUrl);
                }
                TEMPLATES.TEMPLATE_CODE = $('#mymustache').get(0).innerHTML;  
                console.log(TEMPLATES.TEMPLATE_CODE);
                
                TEMPLATES.SAVED_TEMPLATE = true;
                TEMPLATES.SNIPPET['template_code'] = TEMPLATES.TEMPLATE_CODE;
                TEMPLATES.SNIPPET['template_id'] = rootId;

                TEMPLATES.reloadTemplate(true);
                TEMPLATES.saveTemplate(true);    
                $('.revert_container').css('display', 'block');                
                $('#mymustache').remove();
                
          });           
          
       });
       
    
       
       //TEMPLATES.IPSUM_VARIABLES[fieldKey] = currImgKey + "=" + imgW +"," + imgH + "," + imgA;
       
       
   };
   
   TEMPLATES.replaceIcons = function(){
       
   };
   
   TEMPLATES.START_FAKE_PROGRESS = function(){
        $('#bar_container').empty();
        TEMPLATES.bar = new ProgressBar.Line('#bar_container', {
          strokeWidth: 4,
          duration: 100,
          color: '#FFEA82',
          trailColor: '#eee',
          trailWidth: 1,
          svgStyle: {width: '100%', height: '100%'},
          from: {color: '#FFEA82'},
          to: {color: '#1e7e34'},
          step: (state, bar) => {
            bar.path.setAttribute('stroke', state.color);
          }
        });
        let currVal = 0.0;
        let increment = 0.005;
        TEMPLATES.BAR_INTERVAL = setInterval(
        function(){
          currVal += increment;
          if(currVal > 0.97){
              increment = 0.0001;
          }
          else if(currVal > 0.90){
              increment = 0.0002;
          }
          else if(currVal > 0.80){
              increment = 0.0004;
          }
          else if(currVal > 0.70){
              increment = 0.0009;
          }    
          else if(currVal > 0.50){
              increment = 0.002;
          }               
          
          if(currVal >= 1.0){
            currVal = 1.0;
          }
          if(TEMPLATES.bar == null){
              clearInterval(TEMPLATES.BAR_INTERVAL);
          }else{
              TEMPLATES.bar.animate(currVal);
          }
        }, 100);  
        $('#bar_text').css('display', 'block');     
        $('#bar_text').html('Processing');            
   };
   /*
    TEMPLATES.extractUrls = function(html) {
        function getLineNumber(element) {
            const html = element.ownerDocument.documentElement.outerHTML;
            const elementHtml = element.outerHTML;
            const linesBeforeElement = html.split(elementHtml)[0].split('\n');
            return linesBeforeElement.length;
        }          
          
        const parser = new DOMParser();
        const document = parser.parseFromString(html, 'text/html');
        const urls = [];

        // Extract URLs from anchor tags
        const anchors = document.querySelectorAll('a');
        for (const anchor of anchors) {
          if (anchor.href) {
            urls.push({ url: anchor.href, line: getLineNumber(anchor) });
          }
        }

        // Extract URLs from image and SVG elements
        const imageElements = document.querySelectorAll('img, image');
        for (const imageElement of imageElements) {
          if (imageElement.src) {
            urls.push({ url: imageElement.src, line: getLineNumber(imageElement) });
          }
          if (imageElement.href && imageElement.href.baseVal) {
            urls.push({ url: imageElement.href.baseVal, line: getLineNumber(imageElement) });
          }
        }

        // Extract URLs from CSS background-image properties
        const elementsWithStyle = document.querySelectorAll('*[style]');
        for (const element of elementsWithStyle) {
          const style = element.getAttribute('style');
          const matches = style.match(/url\(['"]?([^'")]+)['"]?\)/g);
          if (matches) {
            for (const match of matches) {
              const url = match.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');
              urls.push({ url: url, line: getLineNumber(element) });
            }
          }
        }

        return urls;
      };
    */
    TEMPLATES.extractUrls = function(html) {
        const urlPattern = /https?:\/\/[^ \n"<>']+/g;
        const lines = html.split('\n');
        const urls = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(urlPattern);

          if (matches) {
            for (const url of matches) {
              urls.push({ url: url, line: i + 1, line_text: line });
            }
          }
        }

        return urls;
      }   
   
   