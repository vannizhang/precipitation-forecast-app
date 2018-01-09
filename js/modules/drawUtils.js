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

