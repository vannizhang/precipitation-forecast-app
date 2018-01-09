/*
   Copyright 2017 Esri
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.​
*/
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

