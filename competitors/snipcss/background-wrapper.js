
try {
    console.log("Importing background scripts");
    /*
    "scripts": ["js/jquery-3.3.1.min.js", 
        "js/uri.all.js",
        "js/css.min.js",
        "js/google_font_array.js",
        "js/snipcss_api.js",
        "snipbackground.js"]
  },
*/          
    importScripts("js/cheerioclient.js", 
        "js/uri.all.min.js", 
        "js/css.min.js", 
        "js/parsel.js",       
        "js/media-query-parser.bundle.js",
        "js/google_font_array.js",            
        "js/snipcss_api.js", 
        "js/tailwind_properties.js",   
        "js/tailwind_helper.js",   
        "js/tailwind_shortlong.js",           
        "js/tailwind_reduce.js",  
        "js/tailwind_main.js",          
        "snipbackground.js"); 
} catch (e) {
    console.log(e);
}

