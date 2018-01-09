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
], function(declare, Color, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol){
    
    // Create a new class named "simpleSymbol"
    var simpleSymbol = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            // initializing these properties with values in the constructor
            // ensures that they ready for use by other methods
            // (and are not null or undefined)
            
            this.type = config.type;
            this.color = config.color;
            this.size = config.size || 0;
            this.width = config.width || 0;
            this.style = config.style || null;
            this.outlineStyle = SimpleLineSymbol[config.outlineStyle] || SimpleLineSymbol.STYLE_NULL;
            this.outlineColor = config.outlineColor || [0, 0, 0];
            this.outlineWidth = config.outlineWidth || 0;
            this.symbol = {};
        },     
        
        _processFillSymbol: function() {
            var PolygonSymbol = new SimpleFillSymbol(
                this.style, 
                new SimpleLineSymbol(
                    this.outlineStyle,
                    new Color(this.outlineColor),
                    this.outlineWidth
                ), 
                new Color(this.color)
            ); 
            
            return PolygonSymbol;                     
        },
        
        _processLineSymbol: function() {
            var LineSymbol = new SimpleLineSymbol(
                this.style,
                new Color(this.color),
                this.width
            );   
            
            return LineSymbol;                
        },
        
        _processMarkerSymbol: function() {
            return new SimpleMarkerSymbol(
                this.style, 
                this.size, 
                new SimpleLineSymbol(
                    this.outlineStyle, 
                    new Color(this.outlineColor), 
                    this.outlineWidth
                ),
                new Color(this.color)
            );                    
        },                  
        
        getSymbol: function(){
            switch(this.type) {
                case 'marker':
                    this.style = SimpleMarkerSymbol[this.style] || SimpleMarkerSymbol.STYLE_CIRCLE;
                    this.symbol = this._processMarkerSymbol();
                    break;
                case 'line':
                    this.style = SimpleLineSymbol[this.style] || SimpleLineSymbol.STYLE_SOLID;
                    this.symbol = this._processLineSymbol();
                    break;
                case 'fill':
                    this.style = SimpleFillSymbol[this.style] || SimpleFillSymbol.STYLE_SOLID;
                    this.symbol = this._processFillSymbol();
                    break;
            }
            return this.symbol;              
        },

    });
    
    return simpleSymbol;
    
});

