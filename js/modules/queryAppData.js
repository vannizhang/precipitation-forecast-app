define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/promise/all", 
    "dojo/Deferred",
    "configs/map_config",
    "esri/graphic", 
    "esri/geometry/geometryEngine",
    "esri/InfoTemplate",
    "app_modules/queryTasksUtils",
    "app_modules/simpleSymbolUtils"
], function(declare, lang,
    all, Deferred,
    MapConfig, 
    Graphic,
    GeometryEngine,
    InfoTemplate,
    queryTasksUtils,
    simpleSymbolUtils
){
    var queryAppData = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            this.app = config.app || null;
        },  
        
        startup: function(config){
            
            this.mapEventGeom = config.mapEventGeom || null;
            this.queryGeom = config.queryGeom || null;
            this.placeName = [];
            this.deferred = new Deferred();
        
            if( !this.queryGeom ){
                this._getUserSelectedArea(this.mapEventGeom);
            } else {
                this._getPrecipData(this.queryGeom);
            }
            
            return this.deferred.promise;
        },
        
        _updatePlaceNameLabel: function(){
            var placeNameStrings = (!this.placeName.length) ? ['User Defined Area', (this.app.settings.userDrawnLayerArea * 0.39).toFixed(0) + ' Sq.Mile'] : this.placeName;  
            this.app.map.getLayer('ndfd-cumulativeTotal').hide();
            
            this.app.updateDomNodeText([
                {target: this.app.appUIs.layerMainTitleText, text: placeNameStrings[0]},
                {target: this.app.appUIs.layerSubTitleText, text: placeNameStrings[1]},
            ]);

            this.app.unselectToggleCumulativeButton();
            $(".info-box").addClass('semi-transparent');
            $('.info-box-text').hide();
        },
        
        _getQueryLayerURL: function(layers){
            var layerID = 0;

            if($('.category-item.active').attr('id') === 'draw-layer'){
                $('.category-item').removeClass('active');
                $('#watershed-layer').addClass('active');
            }

            var activeLayer = layers.filter(function(d){
                return d.name == $('.query-layer.active').attr('id');
            })[0];

            if(activeLayer.name == 'watershed-layer'){
                layerID = (this.app.map.getScale() > this.app.settings.subBasinMinScale) ? '1' : '2';
            }

            return activeLayer.url + layerID;
        },
        
        _getUserSelectedArea: function(geom){
            //check if clicked point is intersecting with the previously selected area or not
            if(this.app.map.getLayer('userDefinedArea').graphics && this.app.map.getLayer('userDefinedArea').graphics[0]){
                if(GeometryEngine.intersects(geom, this.app.map.getLayer('userDefinedArea').graphics[0].geometry)){
                    return;
                }
            }   
            
            this.app.resetApp();
            
            var qLayers = MapConfig.app_data.appDataQueryTasks.slice(0, 2);
            new queryTasksUtils({params: {geometry: geom}, queryTasks: this._getQueryLayerURL(qLayers)}).batchQueryTasks(lang.hitch(this, function(results){
                if(!results.length || !results[0].features.length) {
                    $('#loadingSpinner').hide();
                    return;
                }

                this.placeName = (results[0].features[0].attributes.name) ? [results[0].features[0].attributes.name, 'Watershed'] : [results[0].features[0].attributes.NAME + ' County', results[0].features[0].attributes.STATE_NAME];
                var graphicObj = results[0].features[0];
                
                graphicObj.symbol = new simpleSymbolUtils(this.app.getLayerStyle('userDefinedArea')).getSymbol();
                graphicObj.geometry = GeometryEngine.generalize(graphicObj.geometry, 0.5, true, 'miles');
                this.app.map.getLayer('userDefinedArea').add(graphicObj);
                this.app.map.centerAt(graphicObj.geometry.getCentroid());
                this.app.settings.userDrawnLayerArea = GeometryEngine.geodesicArea(graphicObj.geometry, 'square-miles').toFixed(0);
                this._getPrecipData(graphicObj.geometry);
            })); 
        },
        
        _getPrecipData: function(geom){
            this._updatePlaceNameLabel();            
            var qLayers = MapConfig.app_data.appDataQueryTasks.slice(2, 4).map(function(d){
                return d.url;
            });
            
            new queryTasksUtils({params: {geometry: geom}, queryTasks: qLayers}).batchQueryTasks(lang.hitch(this, function(results){
                if(!results[0].features.length){
                    alert('the area you selected will not rain in next 72 hours');
                    $('#loadingSpinner').hide();
                    return;
                }   
                this._processPrecipData(results, geom);
            }));
        },
        
        _processPrecipData: function(data, geom){
            var precipDataChart = [];

            var precipDataByPeriodClone = this.app.settings.precipDataByPeriod.map(function(d){
                var obj = {
                    amountByTime: {}, 
                    accumulationByTime: {}
                };
                obj.fromTime = d[0];
                obj.toTime = d[1];
                return obj;
            });
            
            function _getPrecipDataByPeriod(fromTime, toTime, layer){
                for (var i = precipDataByPeriodClone.length; i--;){
                    if(fromTime >= precipDataByPeriodClone[i].fromTime && toTime <= precipDataByPeriodClone[i].toTime ){
                        return precipDataByPeriodClone[i][layer];
                    }
                }
            }                
            
            for(var item in data){
                var layerName = (item == 0) ? 'amountByTime' : 'accumulationByTime';
                var layerNameFormated = (item == 0) ? 'Total Precipitation' : 'Total Accumulation';
                var mapLayerName = 'ndfd-' + layerName;
                
                data[item].features.forEach(lang.hitch(this, function(d){
                    
                    var infoTemplateContent = '<div class="place-name-main-info-template">' + this.placeName[0] + '</div><div class="place-name-sub-info-template">' + this.placeName[1] + '</div>';
                    
                    if(layerName == 'amountByTime'){
                        infoTemplateContent  += "<b>From</b>: ${fromdate:DateFormat}<br> <b>To</b>: ${todate:DateFormat}<br><br>";
                        infoTemplateContent += '<div class="precip-amount-info-template"><span style="color: #9ecae1;">${label}</span> of precipitation is expected between these times</div><br>'
                    }
                    
                    if(layerName == 'accumulationByTime'){
                        infoTemplateContent += "<b>From</b>: " + this.app.settings.periodStartTime + "<br> <b>To</b>: " + this.app.getSixHourTimeInterval(d.attributes.fromdate)[1] + "<br><br>";
                        infoTemplateContent += '<div class="precip-amount-info-template">A total accumulation of <span style="color: #bfbedc;">${label}</span> is expected between these times</div><br>'
                    }                    
                    
                    var infoTemplate = new InfoTemplate(layerNameFormated, infoTemplateContent);
                    var intersectedGeom = GeometryEngine.intersect(d.geometry, geom);
                    var intersectedGeomArea = GeometryEngine.geodesicArea(intersectedGeom, 'square-miles').toFixed(2);  
                    var graphic = new Graphic(intersectedGeom, null, d.attributes, infoTemplate);      
                    graphic.hide();
                    this.app.map.getLayer(mapLayerName).add(graphic);       

                    var groupObj = _getPrecipDataByPeriod(d.attributes.fromdate, d.attributes.todate, layerName);
                    
                    if(groupObj){
                        if(!groupObj['category' + d.attributes.category]){
                            groupObj['category' + d.attributes.category] = [parseFloat(intersectedGeomArea)];
                        } else {
                            groupObj['category' + d.attributes.category].push(parseFloat(intersectedGeomArea));
                        }
                    }
                }));
            }

            precipDataByPeriodClone.forEach(lang.hitch(this, function(obj, idx){  
                
                var layers = ['amountByTime', 'accumulationByTime'];
                var userDrawnLayerArea = +this.app.settings.userDrawnLayerArea;  
                var app = this.app;   
                
                var calcPrecipAmountByArea = function (layerName){
                    var low = 0; 
                    var high = 0; 
                    var areaByCategory = [];
                    var maxAccumulationCategoryIndex = 0;


                    $.each(obj[layerName], function(key, value){
                        var totalArea = 0;

                        for(var i in value){
                            totalArea += value[i];
                        } 

                        if(idx === precipDataByPeriodClone.length - 1 && layerName === 'accumulationByTime') {
                            var categoryIndex = parseInt(key.replace('category', ''));

                            if(categoryIndex > maxAccumulationCategoryIndex){
                                maxAccumulationCategoryIndex = categoryIndex;
                                app.settings.maxAccumulationCategoryIndex = categoryIndex;
                            }
                        }

                        var pctToTotalArea = parseFloat((totalArea/userDrawnLayerArea).toFixed(4));
                        
                        low += MapConfig.app_data.precipLookupTable[key].low * pctToTotalArea;
                        high += MapConfig.app_data.precipLookupTable[key].high * pctToTotalArea;

                        areaByCategory.push({
                            key: key,
                            totalArea: totalArea,
                            pctArea: pctToTotalArea
                        });
                    });       
                    
                    precipDataChart.push({
                        fromTime: obj.fromTime,
                        category: layerName,
                        amountLow: parseFloat(low.toFixed(4)),
                        amountHigh: parseFloat(high.toFixed(4)),
                        areaByCategory: areaByCategory
                    });                                           
                }                                
                
                layers.forEach(function(d){
                    calcPrecipAmountByArea(d);
                });
            }));        
            
            this.app.settings.precipDataChart = precipDataChart;
            this.deferred.resolve(precipDataChart);
        }               
    });
    
    return queryAppData;
    
});
