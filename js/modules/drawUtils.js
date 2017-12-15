define([
    "dojo/_base/declare",
    "dojo/promise/all", 
    "dojo/_base/lang",
    "dojo/Deferred",
    "esri/toolbars/draw",

], function(declare, 
    all, lang, Deferred,
    Draw
){
    
    var drawTool = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            this.map = config.map || null;
            this.callback = config.callback || null;
            this.drawType = config.drawType || 'FREEHAND_POLYGON';
            this._startup();
        }, 

        _startup: function(){
            if(this.map){
                this._initDrawToolbar(this.map);
            } else {
                console.error('error: a input map object is required to start the draw tool');
            }
        },
        
        _initDrawToolbar: function(map){
            this.drawTool = new Draw(map);
            this.drawTool.on("draw-end", lang.hitch(this, this._drawEndHandler));
        },
        
        _drawEndHandler: function(evt){
            //deactivate the toolbar and clear existing graphics 
            this.deactivate();
            this.callback(evt);         
        },
        
        activate: function(){
            this.map.disableMapNavigation();
            this.drawTool.activate(Draw[this.drawType]);
        },
        
        deactivate: function(){
            this.drawTool.deactivate(); 
            this.map.enableMapNavigation(); 
        },
                       
    });
    
    return drawTool;
    
});

