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
    "dojo/Deferred"

], function(declare, 
    all, Deferred
){
    
    var legend = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            this.data = config.data || null;
            this.app = config.app || null;
            this._startup();
        },  
        
        _startup: function(){
            if(this.data){
                this._createLegendElements(this.data);
            } else {
                console.log('input data is required to create the legend elements');
                return;
            }
        },
        
        _createLegendElements: function(data){
            var container = this.app.appUIs.legendGroupContainer;
            data.elements.forEach(function(d){
                var group = $('<div class="legend-group"></div>');
                var graphic = $('<div class="legend-item graphic legend-graphic" style="background-color: ' + d.color + ';" id="' + d.key + '"></div>');
                var label = $('<div class="legend-item label" "><span>' + d.value[0] + '</span></div>');
                group.append(graphic);
                group.append(label);
                $(container).append(group);
            });
            this._bindUIAction(this.app.appUIs.legendGraphic);
        },
        
        _bindUIAction: function(target){
            $(target).on('mouseover', function(){
                
            });
        },
        
        _customizedLegendHoverCallback: function(id){
            console.log(id);
        }
                       
    });
    
    return legend;
    
});

