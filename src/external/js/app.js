var markdownFileList = [];
var numOfDaysToFlagAsNew = 10;
var numChanged = 0;
var variantHighlightList = [];

(function($, window, undefined){

    FastClick.attach(document.body);
    
    
    /** Tapestry Completed */
    
    $('body').bind('compile.completed', function(){
        
        $('.tapestry-menu > div.ng-scope > h3.menu__header').each(function(){
            $(this).css({'backgroundImage': 'url(assets/images/'+ $(this).text().toLowerCase() +'.png)'});
        })
        
        loadJSON();
    })

    $('body').bind('tapestry.completed', function(){
        APP.init();
    });


    /**
     * Initializes your JS
     */

    
    var APP = {
        init: function(){
            if ($('div.tapestry-menu-side > ul.ng-hide').length == 0) {
                for (var s in variantHighlightList) {
                    if (variantHighlightList[s].parent == $('li.active').text()) {
                        $('div.tapestry-menu-side > ul > li.ng-scope > a:contains("' + variantHighlightList[s].variant + '")').addClass("newUpdateMain");
                    }
                        
                }
            }
        }
    }

    
})(jQuery, window)

function loadJSON() {
    var masterJSON = [];
    var changelistJSON;
    var calls = [];
    
    calls.push(
        $.getJSON('changelist.json', function(data){
            changelistJSON = data;
        })
    );
    
    for(var i in jsonPath) {
        calls.push(
            $.getJSON(jsonPath[i].path, 
                (function(i){
                    return function(data) {
                        masterJSON.push(data);
                    }
                }(i))
             )
        );
    }
    
    $.when.apply($,calls).then(function(){

        //Enumerate File List
        for(var n in masterJSON){
                var obj = masterJSON[n];
            
                obj.length > 1 ? compileFileList(obj, true) : compileFileList(obj);
        }
        
        //Compare dates to create list of files that need to be highlighted
        for (var d in changelistJSON) {
            //Transform JSON local path to relative src path
            var target = changelistJSON[d].file.split("/inf-patterns");
            changelistJSON[d].file = "patterns" + target[1];
            
            var currentDate = new Date();
            var fileDate = new Date(changelistJSON[d].date);
            var oneDay = 24*60*60*1000;

            changelistJSON[d].diff = Math.ceil(Math.abs((currentDate.getTime() - fileDate.getTime())/(oneDay)));
            var rootParent = changelistJSON[d].file.match("patterns\/(?:\d\.)?(.*?)(?=\/)")[1];
                
            var test = /\d\..+/g;
            test.test(rootParent) ? changelistJSON[d].topParent = rootParent.substring(2) : changelistJSON[d].topParent = rootParent;
            
            for (var q in markdownFileList) {
                if (markdownFileList[q].path == changelistJSON[d].file) {
                    markdownFileList[q].topParent = changelistJSON[d].topParent;
                    markdownFileList[q].diff = changelistJSON[d].diff;
                    //console.log(markdownFileList[q])
                    break;
                }
            }
        }
        
        
        for (var e in markdownFileList){
            var finalTarget;
            
            if (markdownFileList[e].hasOwnProperty('parent')) {
                finalTarget = markdownFileList[e].parent
            } else {
                
                finalTarget = markdownFileList[e].name;
            }
            
            if (markdownFileList[e].diff < numOfDaysToFlagAsNew) {
                numChanged++
                $('nav.tapestry-menu > div.ng-scope > h3:contains("' + markdownFileList[e].topParent + '")').next().children(':contains("' + finalTarget + '")').children('a').addClass("newUpdateMain");
                
                if (markdownFileList[e].hasOwnProperty('parent'))
                    variantHighlightList.push({top: markdownFileList[e].topParent, parent: markdownFileList[e].parent, variant: markdownFileList[e].name})
            }
        }
        
        var newBlock = $('li.new-label');
        var container = $('div.top-menu-div');
        var containerHeight = container.height();
        var newBlockHeight = newBlock.outerHeight();
        
        if (numChanged > 0) {
            $('li.new-label > span', container).text(numChanged);
            container.height(containerHeight + newBlockHeight);
            newBlock.show();
        }
    });
}

//Helper function to enumerate the markdown file lists into a targetable format
function compileFileList(file, hasChildren){
    var obj;
    
    if (hasChildren) {
        
        for (var c in file) {
            obj = file[c];
            
            if(obj.hasOwnProperty('children')){
                
                if (obj.children.length > 1) {
                    var parent = obj.name;

                    for (var a in obj.children) {
                        markdownFileList.push({path: obj.children[a].path, name: obj.children[a].name, parent: parent}) 
                        //console.log(obj.children[a].path);
                    }
                    
                } else {
                    markdownFileList.push({path: obj.children[0].path, name: obj.name});
                    //console.log("Top Level: " + obj.children[0].path);
                }
                
            } else {
                markdownFileList.push({path: obj.path, name: obj.name});
                //console.log("Top Level: " + obj.path);
            }
        }
    } else {
        obj = file[0];
        obj.hasOwnProperty('children') ? markdownFileList.push({path: obj.children[0].path, name: obj.name}) : markdownFileList.push({path: obj.path, name: obj.name});
    }
}