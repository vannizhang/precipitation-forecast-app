define([
    "dojo/_base/declare",
    "esri/Color",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/renderers/UniqueValueRenderer",
], function(
    declare, Color, 
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    UniqueValueRenderer
){
    // Create a new class named "simpleSymbol"
    var simpleRenderer = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            // initializing these properties with values in the constructor
            // ensures that they ready for use by other methods
            // (and are not null or undefined)
            
            this.type = config.type;
            this.column = config.column;
            this.color = config.color || ['#FFFFFF'];
            this.size = config.size || 0;
            this.width = config.width || 0;
            this.style = config.style || null;
            this.outlineStyle = SimpleLineSymbol[config.outlineStyle] || SimpleLineSymbol.STYLE_NULL;
            this.outlineColor = config.outlineColor || [0, 0, 0, 0];
            this.outlineWidth = config.outlineWidth || 0;
            this.renderer = {};
        },    
        
        _processUniqueValueRenderer: function() {
            var defaultSymbol = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_NULL);
            defaultSymbol.outline.setStyle(SimpleLineSymbol.STYLE_NULL);  
            
            var uvr = new UniqueValueRenderer(defaultSymbol, this.column); 
            
            var sls = new SimpleLineSymbol(
                this.outlineStyle,
                new Color(this.outlineColor),
                this.outlineWidth
            );
            
            for(var i = 0, len = this.color.length; i < len; i++){
                uvr.addValue(i, new SimpleFillSymbol("solid", sls).setColor(new Color(this.color[i])));
            }            
            
            return uvr;                     
        },             
        
        getRenderer: function(){
            switch(this.type) {
                case 'UniqueValueRenderer':
                    this.renderer = this._processUniqueValueRenderer();
                    break;
            }
            return this.renderer;              
        },

    });
    
    return simpleRenderer;
    
});

