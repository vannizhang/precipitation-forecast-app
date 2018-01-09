define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "configs/map_config",
    
    "esri/map",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/Color",
    "esri/graphicsUtils",
    "esri/toolbars/draw",
    "esri/geometry/geometryEngine",
    "esri/geometry/webMercatorUtils",
    
    "esri/layers/LayerDrawingOptions",
    "esri/renderers/SimpleRenderer",
    "esri/tasks/GenerateRendererParameters", 
    "esri/tasks/GenerateRendererTask",
    "esri/tasks/UniqueValueDefinition",
    "esri/tasks/ColorRamp",
    
    "esri/dijit/Search",
        
    "esri/arcgis/Portal", 
    "esri/arcgis/OAuthInfo", 
    "esri/IdentityManager",

    "app_modules/simpleSymbolUtils",
    "app_modules/simpleRendererUtils",
    "app_modules/queryAppData",
    "app_modules/drawUtils",
    "app_modules/legendUtils",

], function(declare, lang, on,
    MapConfig, 
    Map, Graphic, GraphicsLayer, ArcGISDynamicMapServiceLayer, Point,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Font, Color, graphicsUtils, Draw, GeometryEngine, webMercatorUtils,
    LayerDrawingOptions, SimpleRenderer,
    GenerateRendererParameters, GenerateRendererTask, UniqueValueDefinition, ColorRamp,
    Search, arcgisPortal, OAuthInfo, esriId,
    simpleSymbolUtils, simpleRendererUtils, queryAppData, drawUtils, legendUtils
){
    return declare(null, {
        
        settings: {
            userDrawnLayerArea: 0,
            subBasinMinScale: 0,
            periodStartTime: null,
            precipDataByPeriod: [],
            precipDataChart: [],
            ndfdLayerNames: ['ndfd-amountByTime', 'ndfd-accumulationByTime', 'ndfd-cumulativeTotal'],
            uniqueTimeValues: [],
            selectedTime: 0,
            isAnimationPasued: false,
            animationInterval: null,
            maxAccumulationCategoryIndex: 0
        },
        
        appUIs: {
            timeRangeText: $('#timeRangeWrapper'),
            layerMainTitleText: $('.layer-main-title'),
            layerSubTitleText: $('.layer-sub-title'),
            legendGroupContainer: $('.legend-group-container'),
            legendItemGraphic: $('.legend-graphic'),
            queryCategoryButton: $('.category-item'),
            toggleCumulativeButton: $('#toggleCumulative'),
            toggleAnimationButton: $('.play-animation-btn'),
            chartContainer: $('#chart-container'),
            chartTimeInfoFrom: $('.from-time-label'),
            chartTimeInfoTo: $('.to-time-label'),
            chartSelectionBox: $('.chart-selection-item span.selection-box'),
            precipInfoTitle: $('.precip-info-title > span.title'),
            precipInfoTableHeader: $('.precip-info-table-header'),
            precipInfoTableRow: $('.precip-info-table-row'),
            precipInfoTableCell: $('.table-cell'),
            precipInfoTableVertical: $('#precip-info-table-vertical'),
            chartTabletViewWrapper: $('.chart-tablet-view-items-wrapper')
        },

        constructor: function () {
            calcite.init();
            this.map = this._addMap();
            this.config = MapConfig; 
            this.searchWidget = (MapConfig.ui_components.search) ? this._initSearchWidget(MapConfig.ui_components.search) : null;
            this.queryAppData = new queryAppData({app: this}); 
        },
        
        //create a map object
        _addMap: function(){
            var map = new Map(MapConfig.map.container_id, {
                center: MapConfig.map.center,
                zoom: MapConfig.map.zoom,
                basemap: MapConfig.map.basemap,
                showAttribution: MapConfig.map.showAttribution,
            });
            //add layers to map
            this._initializeMapLayer(map);  
            map.on("load", lang.hitch(this, this._mapReadyHandler));          
            return map;
        },
        
        //add map layers included in the configuration file to map
        _initializeMapLayer: function(map){
            //add graphic layers to map
            if(MapConfig.layers.graphic_layers){
                for(var i = 0, len = MapConfig.layers.graphic_layers.length; i < len; i++){
                    var layerID = MapConfig.layers.graphic_layers[i].id;
                    var gLayer = new GraphicsLayer({
                        id: layerID
                    });
                    //add renderer to graphic layer if it's defined in the config file
                    if(MapConfig.layer_style[layerID] && MapConfig.layer_style[layerID].renderer){
                        var r = new simpleRendererUtils(MapConfig.layer_style[layerID].renderer).getRenderer();
                        gLayer.renderer = r;
                    }
                    map.addLayer(gLayer);
                }  
            }
            
            if(MapConfig.layers.dynamic_layers){
                for(var i = 0, len = MapConfig.layers.dynamic_layers.length; i < len; i++){
                    var dLayer = new ArcGISDynamicMapServiceLayer(MapConfig.layers.dynamic_layers[i].url, MapConfig.layers.dynamic_layers[i].options);  
                    dLayer.setVisibleLayers(MapConfig.layers.dynamic_layers[i].options.visibleLayers);
                    on(dLayer, "load", lang.hitch(this, this._dynamicLayerOnLoadHandler)); 
                }
            }
        }, 
        
        _mapReadyHandler: function(){
            this.drawTool = new drawUtils({
                map: this.map,
                callback: lang.hitch(this, this._drawEndHandler)
            });
        },

        _drawEndHandler: function(evt){
            $('#loadingSpinner').show();
            
            var symbol = new simpleSymbolUtils(this.getLayerStyle(MapConfig.ui_components.draw.resultLayer)).getSymbol();
            this.settings.userDrawnLayerArea = GeometryEngine.geodesicArea(evt.geometry, 'square-miles');
            this.map.getLayer(MapConfig.ui_components.draw.resultLayer).add(new Graphic(evt.geometry, symbol));            
        
            this.queryAppData.startup({queryGeom: evt.geometry}).then(function(d){
                generateChart(d);
            });
        },
        
        _populateTimeExtentArray: function(startTime, endTime, interval){
            var timeExtentArray = [];
            while(startTime < endTime){
                var startTimeNew = new Date ( startTime );
                startTimeNew.setHours ( startTime.getHours() + parseInt(interval) );
                timeExtentArray.push([startTime.getTime(), startTimeNew.getTime()]);
                startTime = startTimeNew
            } 
            return timeExtentArray;
        },
        
        _setLayerDrawingOption: function(layer){
            var layerDrawingOptions = [];
            var layerDrawingOption = new LayerDrawingOptions();
            layerDrawingOption.renderer = new simpleRendererUtils(MapConfig.layer_style[layer.id].renderer).getRenderer();
            layerDrawingOptions[layer.visibleLayers[0]] = layerDrawingOption; 
            layer.setLayerDrawingOptions(layerDrawingOptions);  
        },
        
        _dynamicLayerOnLoadHandler: function(layer){
            
            if(layer.layer.id == 'ndfd-cumulativeTotal'){
                
                var startTime = new Date(layer.layer.timeInfo.timeExtent.startTime);
                var endTime = new Date(layer.layer.timeInfo.timeExtent.endTime);
                var interval = layer.layer.timeInfo.defaultTimeInterval;
                
                this.settings.precipDataByPeriod = this._populateTimeExtentArray(startTime, endTime, interval);
                this.settings.periodStartTime = this.getSimplifiedDate(this.settings.precipDataByPeriod[0][0]);
                this.updateDomNodeText({
                    target: this.appUIs.timeRangeText,
                    text: this.getSimplifiedDate(this.settings.precipDataByPeriod[0][0]) + ' - ' + this.getSimplifiedDate(this.settings.precipDataByPeriod[this.settings.precipDataByPeriod.length - 1][0])
                });
                this._setLayerDrawingOption(layer.layer);
                   
                on(layer.layer, 'update-end', function(error){
                    if(error.error){
                        layer.layer.refresh();
                    }
                });
            }
            
            if(layer.layer.id == 'watershed-layer') {
                this.settings.subBasinMinScale = layer.layer.layerInfos[2].minScale;
            }
            
            map.addLayer(layer.layer);                
        },
        
        _initSearchWidget: function(config){
            var search = new Search({
                map: map,
                autoNavigate: config.autoNavigate,
                enableInfoWindow: config.enableInfoWindow,
                enableHighlight: config.enableHighlight,
            }, config.containerID);
            
            search.on('search-results', lang.hitch(this, function(response){
                var layerName = 'userSearchedLocation';
                this.emptyGraphicLayers(layerName)
                if(response.results["0"] && response.results["0"][0]){
                    var searchResultGeom = webMercatorUtils.geographicToWebMercator(response.results["0"][0].feature.geometry)
                    var symbol = new simpleSymbolUtils(MapConfig.layer_style[layerName]).getSymbol();
                    this.map.getLayer(layerName).add(new Graphic(searchResultGeom, symbol));
                    this.map.centerAt(searchResultGeom);
                    this.queryAppData.startup({mapEventGeom: searchResultGeom}).then(function(d){
                        generateChart(d);
                    });
                }
            }));

            search.startup();
            return search;
        },

        _signInToArcGISPortal: function(){
            var info = new OAuthInfo({
                appId: MapConfig.app_data.appID,
                popup: false
            });    
            esriId.registerOAuthInfos([info]);   
            
            new arcgisPortal.Portal(info.portalUrl).signIn()
            .then(function(){
                // console.log('you are logged in');
            })     
            .otherwise(
                function (error){
                    console.log("Error occurred while signing in: ", error);
                }
            );    
        },
        
        getLayerStyle: function(layer){
            var layerColor = MapConfig.layer_style[layer];
            return layerColor;
        },   
        
        resetApp: function(){
            this.appUIs.chartContainer.addClass('hide');  
            this.appUIs.toggleAnimationButton.removeClass('active'); 
            this.appUIs.toggleAnimationButton.removeClass('paused');          
            
            this.map.getLayer('userDefinedArea').clear();
            this.map.getLayer('ndfd-amountByTime').clear();
            this.map.getLayer('ndfd-accumulationByTime').clear();    
        },     

        getSixHourTimeInterval: function(t, unixEpoch){
            var fromTime = new Date (+t);
            var toTime = new Date ( fromTime );
            toTime.setHours ( fromTime.getHours() + 6 );   
            return (!unixEpoch) ? [this.getSimplifiedDate(fromTime), this.getSimplifiedDate(toTime)] : [fromTime, toTime];   
        },
        
        getSimplifiedDate: function(date, monthDateFormat, options){
            options = (options) ? options : {};
            var monthNames = [
                "January", "February", "March","April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
            ];
            var monthAbbr = [
                "Jan", "Feb", "Mar","Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            var date = new Date(date);
            var day = date.getDate();
            var monthIndex = date.getMonth() + 1;
            var year = date.getFullYear();
            var hours = date.getHours();
            var minutes = date.getMinutes().toString().substring(0, 2);       
            var dayDivider = (hours < 12) ? ' AM' : ' PM';
            var monthDate = (monthDateFormat == 'text') ? monthAbbr[monthIndex-1] + '-' + day : monthIndex + '/' + day + ' ';
            hours = (hours < 10) ? '0' + hours : hours;

            var outputDateTime = (!options["chart-tick"]) 
                ? monthDate + ' ' + hours + ':' +  minutes + '0' 
                : [monthAbbr[monthIndex-1], day, hours, dayDivider].join(' ');

            return outputDateTime;
        },
        
        emptyGraphicLayers: function(inputLayers){
            var layers = (inputLayers.constructor == Array) ? inputLayers : [inputLayers];
            layers.forEach(function(d){
                this.map.getLayer(d).clear();
            });
        },

        hideLayers: function(inputLayers){
            var layers = (inputLayers.constructor == Array) ? inputLayers : [inputLayers];
            layers.forEach(function(d){
                this.map.getLayer(d).hide();
            });
        },
        
        getActiveLayer: function(callback){
            var id, name, category;

            $('.chart-selection-item span.selection-box').each(function(index){
                if($(this).hasClass('fa-check-square-o')){
                    id = this.id;
                    name = $(this).attr('name');
                    category = (id == 'AccumOfPrecip') ? 'accumulationByTime' : 'amountByTime';
                }
            });  
            callback({
                id: id,
                name: name,
                category: category
            }); 
        },
        
        toggleVisibleLayer: function(layerNames, visibleLayer){
            layerNames.forEach(function(d) {
                (d == visibleLayer) ? this.map.getLayer(d).show() : this.map.getLayer(d).hide();
            });
        },
        
        updateDomNodeText: function(input){
            var nodeArr = (input.constructor == Array) ? input : [input];
            nodeArr.forEach(function(d){
                $(d.target).text(d.text);
            });
        },

        toggleMobileChart: function(visibleLayerType) {
            this.appUIs.chartTabletViewWrapper.each(function(){
                if($(this).hasClass(visibleLayerType)){
                    $(this).removeClass('hide');
                } else {
                    $(this).addClass('hide');
                }
            });
        },

        selectToggleCumulativeButton: function(target){
            var checkbox = this.appUIs.toggleCumulativeButton.find('span.fa');
            checkbox.addClass('fa-check-square-o');
            checkbox.removeClass('fa-square-o');
            this.appUIs.toggleCumulativeButton.addClass('active');
        }, 

        unselectToggleCumulativeButton: function(target){
            var checkbox = this.appUIs.toggleCumulativeButton.find('span.fa');
            checkbox.removeClass('fa-check-square-o');
            checkbox.addClass('fa-square-o');
            this.appUIs.toggleCumulativeButton.removeClass('active');
        }     
            
    });
});
