var map, generateChart;

require([
    "esri/map", 
    "esri/layers/GraphicsLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/config",

    "esri/toolbars/draw",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/UniqueValueRenderer",
    "esri/graphic", 
    "esri/Color", 

    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/InfoTemplate",

    "esri/geometry/geometryEngine",
    "esri/graphicsUtils",

    "app_modules/queryTasksUtils",
    "app_modules/simpleRendererUtils",
    "esri/layers/LayerDrawingOptions",
    "esri/layers/ImageParameters",

    "app_modules/initApp",
    "configs/map_config",

    "dojo/parser",
    "dojo/query",
    "dojo/dom", "dojo/on", "dojo/domReady!"
], function(
    Map, 
    GraphicsLayer, 
    ArcGISDynamicMapServiceLayer, esriConfig,
    Draw, SimpleFillSymbol, SimpleLineSymbol, UniqueValueRenderer,
    Graphic, Color, 
    Query, QueryTask, InfoTemplate,
    GeometryEngine, graphicsUtils,
    queryTasksUtils, simpleRendererUtils, LayerDrawingOptions, 
    ImageParameters,
    Application, MapConfig,
    parser, query, dom, on
) {
    parser.parse();

    var app = new Application();
    map = app.map;

    map.on("click", function(evt){
        if(!$('#draw-layer').hasClass('active')){
            //stop chart animation
            resetAnimation();

            //clear billboard content
            resetBillboard();

            //display the loading spinner
            $('#loadingSpinner').show();

            //query the precipitation data using the mapPoint and draw chart
            app.queryAppData.startup({mapEventGeom: evt.mapPoint}).then(function(d){
                generateChart(d);
            });
        }
    });  

    app.appUIs.chartSelectionBox.on('click', function(){
        toggleChartSelectionBox($(this));
    });

    app.appUIs.queryCategoryButton.on('click', function(){
        var checkedCategory = this.id;

        $(this).addClass('active');
        $(this).siblings().removeClass('active');
        $('#chart-container').addClass('hide');

        resetAnimation(); 
        resetBillboard();

        app.hideLayers(['watershed-layer', 'county-layer']);  
        app.emptyGraphicLayers(['ndfd-amountByTime', 'ndfd-accumulationByTime', 'userDefinedArea']);      

        if(checkedCategory !== 'draw-layer'){
            map.getLayer(checkedCategory).show();
            app.drawTool.deactivate();
        } else {
            map.getLayer('userDefinedArea').clear();
            app.drawTool.activate();
        }
    });

    app.appUIs.toggleCumulativeButton.on('click', function(){

        $(this).toggleClass('active');
        $(this).find('span.fa').toggleClass('fa-check-square-o fa-square-o');

        if($(this).hasClass('active')){
            map.getLayer('ndfd-cumulativeTotal').show();

            var checkedChartSelectionBox = app.appUIs.chartSelectionBox.filter('.fa-check-square-o');
            if(checkedChartSelectionBox.length) {
                toggleChartSelectionBox(checkedChartSelectionBox);
            }
        } else {
            map.getLayer('ndfd-cumulativeTotal').hide();
        }
    });

    app.appUIs.toggleAnimationButton.on('click', function(){
        toggleAnimation();
    });  

    var toggleChartSelectionBox = function(target){

        target.toggleClass('fa-check-square-o fa-square-o');
        
        var selectedID = target.attr('id');
        var checkedItemStatus = target.hasClass('fa-check-square-o');
        var selectedLayerName = (checkedItemStatus) ? target.attr('name') : 'ndfd-cumulativeTotal';
        var precipInfoTitleText = (selectedLayerName == 'ndfd-amountByTime') ? '% of area by precipitation' : '% of area by accumulation';
        var selectedLayerType = (selectedID == 'AccumOfPrecip') ? 'accumulation' : 'precipitation';

        if (checkedItemStatus) {
            target.closest('.chart-selection-item').removeClass('inactive'); 
            app.appUIs.precipInfoTitle.text(precipInfoTitleText);
            renderLayerByTime(app.settings.uniqueTimeValues[0]);
            app.unselectToggleCumulativeButton();
            map.getLayer('userDefinedArea').show();
            resetAnimation(); 
        } else {
            target.closest('.chart-selection-item').addClass('inactive');
            app.selectToggleCumulativeButton();
            map.getLayer('userDefinedArea').hide();
        }

        $('span.selection-box').each(function(i){
            if(this.id !== selectedID){
                $(this).closest('.chart-selection-item').addClass('inactive');
                $(this).removeClass('fa-check-square-o');
                $(this).addClass('fa-square-o');  
            }
        });

        toggleChartHighlighting('area' + selectedID);

        app.toggleVisibleLayer(app.settings.ndfdLayerNames, selectedLayerName);
        
        app.toggleMobileChart(selectedLayerType);
    };

    var toggleChartHighlighting = function(selectedChartType){
        var areaChartTypes = ['areaAmountOfPrecip', 'areaAccumOfPrecip'];

        var inactiveChartType = areaChartTypes.filter(function(d){
            return d !== selectedChartType;
        })[0];

        $('.' + selectedChartType).toggleClass('active'); 
        $('.' + inactiveChartType).removeClass('active'); 

        d3.selectAll(".period-bar").style('opacity', 0);
        d3.select("#x-axis").selectAll("g").selectAll('text').style('fill', '#eee'); 
    }; 

    var toggleAnimation = function(){
        if(!$(app.appUIs.toggleAnimationButton).hasClass('active') && !$(app.appUIs.toggleAnimationButton).hasClass('paused')){
            animatePrecipData();
            $(app.appUIs.toggleAnimationButton).addClass('active');   
            $(app.appUIs.toggleAnimationButton).find('span').toggleClass('fa-play-circle-o fa-pause-circle-o');        
        }
        else if(!$(app.appUIs.toggleAnimationButton).hasClass('paused') && $(app.appUIs.toggleAnimationButton).hasClass('active')){
            app.settings.isAnimationPasued = true;
            $(app.appUIs.toggleAnimationButton).addClass('paused');
            $(app.appUIs.toggleAnimationButton).find('span').toggleClass('fa-play-circle-o fa-pause-circle-o');  
            
        } 
        else if($(app.appUIs.toggleAnimationButton).hasClass('paused') && $(app.appUIs.toggleAnimationButton).hasClass('active')) { 
            app.settings.isAnimationPasued = false;
            $(app.appUIs.toggleAnimationButton).removeClass('paused');
            $(app.appUIs.toggleAnimationButton).find('span').toggleClass('fa-play-circle-o fa-pause-circle-o');  
        }    
    };

    var updateChartLegendAreaInfo = function(fromTime, toTime, category){

        var data = app.settings.precipDataChart.filter(function(d){
            var currentPeriodInfo = app.getSixHourTimeInterval(d.fromTime, true);
            return currentPeriodInfo[0] >= fromTime && currentPeriodInfo[1] <= toTime && d.category == category;
        });

        data = _.sortBy(data[0].areaByCategory, function(item) { 
            return parseInt(item.key.replace('category', '')); 
        });

        $('.table-cell').find("span.pct-area-label").text("0%");
        $('.precip-info-table-vertical-element').find("span.pct-area-label").text("0%");
        
        data.forEach(function(d){ 
            var pctAreaText = (d.pctArea * 100).toFixed(1) + '%';
            $(".table-cell[category='"+d.key+"']").find("span.pct-area-label").text(pctAreaText);
            $(".precip-info-table-vertical-element[category='"+d.key+"']").find("span.pct-area-label").text(pctAreaText);
        });
    };

    var populateHorizontalChartLegend = function(data){
        var tableRowTop = '';
        var tableRowBottom = '';
        var numOfItems = data.length;
        
        var getTableCellWidth = function(num){
            var cellWidth = '';

            if(num <= 10){
                cellWidth = (100 / numOfItems) + '%';
            } else {
                if(isEven(num)){
                    cellWidth = (100 / (numOfItems + 0)) * 2 + '%';
                } else {
                    cellWidth = (100 / (numOfItems + 1)) * 2 + '%';
                }
            }

            return cellWidth;
        };

        var isEven = function(n) {
            return n % 2 == 0;
        };

        var tableCellWidth = getTableCellWidth(numOfItems);

        data.forEach(function(d, i){
            var category = d.key;
            var categoryLowValue = d.low;
            var categoryHighValue = d.high;
            var cellColor = d.color;
            var textColor = d.textColor;

            var tableCellText = '<div class="table-cell" category="' + category + '" style="color: '+ textColor + '; background-color: '+ cellColor + '; width: ' + tableCellWidth + ';"><span class="table-cell-category-label">'+categoryLowValue + '-' + categoryHighValue +'</span><span class="table-cell-category-unit"> in</span><span class="pct-area-label"></span>' + '</div>';

            if(numOfItems <= 10){
                tableRowTop += tableCellText;
            } else {
                if( i < numOfItems/2) {
                    tableRowTop += tableCellText;
                } else {
                    tableRowBottom += tableCellText;
                }
            }
        });

        app.appUIs.precipInfoTableHeader.html(tableRowTop);
        app.appUIs.precipInfoTableRow.html(tableRowBottom);
    };

    var populateVerticalChartLegend = function(maxCategoryIndex){
        
        var legendData = [];
        var legendElementHeight = "";

        app.appUIs.precipInfoTableVertical.empty();

        while(maxCategoryIndex > -1){
            var categoryKey = 'category' + maxCategoryIndex;
            var data = _.clone(app.config.app_data.precipLookupTable[categoryKey]);
            data.key = categoryKey;
            legendData.push(data);
            maxCategoryIndex--;
        }

        legendElementHeight = ((1 / legendData.length) * 100 ) + "%";

        legendData.forEach(function(d){
            // console.log(d);

            var legendElement = createDOMElement({
                "type": "div",
                "class": "precip-info-table-vertical-element",
                "attributes": [
                    {name: 'category', value: d.key}
                ],
                "html": "<span class='amount'>" + d.low + " - " + d.high + " in</span><span class='pct-area-label'></span>",
                "styles": [
                    {name: "background-color", value: d.color},
                    {name: "height", value: legendElementHeight},
                    {name: "color", value: d.textColor},
                ]
            });
            app.appUIs.precipInfoTableVertical.append(legendElement);
        });

        $(".precip-info-table-vertical-element").on('mouseover', function(){
            var selectedCellCategory = $(this).attr('category');
            var categoryIndex = $(this).attr('category').replace(/category/gi, '');

            $(this).siblings().css('opacity', 0.7);
            $(this).css('opacity', 1);

            app.getActiveLayer(function(layer){
                var mapLayer = map.getLayer(layer.name);
                if(mapLayer.graphics.length){
                    // activelayer = true;
                    mapLayer.graphics.forEach(function(d){
                        if(d.visible){
                            if(d.attributes.category !== +categoryIndex){
                                d.hide();
                            } else {
                                d.show();
                            }
                        }
                    }); 
                }
            });

        });

        $(".precip-info-table-vertical-element").on('mouseout', function(){
            $(this).siblings().css('opacity', 1);
            renderLayerByTime(app.settings.selectedTime);
        });

        populateHorizontalChartLegend(legendData.reverse());

    };

    var renderLayerByTime = function(t){
        
        map.infoWindow.hide();     
        app.settings.selectedTime = t;  

        var periodInfo = app.getSixHourTimeInterval(t, true)
        var fromTime = periodInfo[0];
        var toTime = periodInfo[1];
        var layers = ['ndfd-amountByTime', 'ndfd-accumulationByTime'];
        var timeInfo = app.getSixHourTimeInterval(t);
        var timeInfoText = timeInfo[0] + ' - ' + timeInfo[1];

        layers.forEach(function(d){
            var graphics = map.getLayer(d).graphics;
            for(var i = graphics.length; i--;){
                var gStartDate = new Date(graphics[i].attributes.fromdate);
                var gToDate = new Date(graphics[i].attributes.todate);
                if(gStartDate >= fromTime && gToDate < toTime){
                    graphics[i].show();
                } else{
                    graphics[i].hide();
                }
            }         
        });
        
        app.getActiveLayer(function(layer){

            var fromTimeChartLabel = (layer.name == 'ndfd-accumulationByTime') ? app.getSimplifiedDate(app.settings.precipDataByPeriod[0][0], 'text') : app.getSimplifiedDate(fromTime, 'text');

            app.appUIs.chartTimeInfoFrom.text(fromTimeChartLabel);
            app.appUIs.chartTimeInfoTo.text(app.getSimplifiedDate(toTime, 'text'));

            app.toggleVisibleLayer(layers, layer.name);

            updateChartLegendAreaInfo(fromTime, toTime, layer.category);
        });        
        
        highlightXAxisPeriod(t);
        $('.precip-info-title span.time-info').text(' | ' + timeInfoText);

        $('.chart-tablet-view-item').removeClass('active');
        $('.chart-tablet-view-item[value="'+t+'"]').addClass('active');
    };    
    
    var animatePrecipData = function(index){

        var loop = app.settings.uniqueTimeValues.indexOf(app.settings.selectedTime);

        app.settings.animationInterval = setInterval(function(){
            
            if(!app.settings.isAnimationPasued) {

                if(loop === app.settings.uniqueTimeValues.length) {
                    loop = 0;
                }

                renderLayerByTime(app.settings.uniqueTimeValues[loop]); 
                loop++;
            } 

        }, 1000);          
    };

    var resetAnimation = function(){
        clearInterval(app.settings.animationInterval);
        app.settings.isAnimationPasued = false;   
        app.appUIs.toggleAnimationButton.removeClass('active');  
        app.appUIs.toggleAnimationButton.removeClass('paused'); 
        app.appUIs.toggleAnimationButton.find('span').removeClass('fa-pause-circle-o');   
        app.appUIs.toggleAnimationButton.find('span').addClass('fa-play-circle-o');  
    };

    var resetBillboard = function(){
        app.appUIs.layerMainTitleText.empty();
        app.appUIs.layerSubTitleText.empty();
        app.appUIs.chartTimeInfoFrom.empty();
        app.appUIs.chartTimeInfoTo.empty();
    };
    
    var highlightXAxisPeriod = function(periodStartTime){
        var periodEndTime = +app.getSixHourTimeInterval(periodStartTime, true)[1];

        var highlightThisPeriodOrNo = function(period, layer, type){
            
            if(layer == 'ndfd-accumulationByTime'){
                if(type == 'period-bar') {
                    if(period <= periodStartTime){
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    if(period <= periodEndTime){
                        return true;
                    } else {
                        return false;
                    }
                }

            } else {
                if(type == 'period-bar') {
                    if(period == periodStartTime) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    if(period >= periodStartTime && period <= periodEndTime) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }

        app.getActiveLayer(function(layer){
            
            d3.selectAll(".period-bar").each(function(d){

                var highlightChartElement = highlightThisPeriodOrNo(d, layer.name, 'period-bar');

                if(highlightChartElement){
                    d3.select(this).style("opacity", 0.4);
                } else {
                    d3.select(this).style("opacity", 0);
                }
            });
            
            d3.select("#x-axis").selectAll("g").each(function(d){

                var highlightChartElement = highlightThisPeriodOrNo(d, layer.name, 'x-axis');

                if(highlightChartElement){
                    // d3.select(this).select('text').style("fill", "#D9B798");
                    d3.select(this).select('text').style("fill", "#E79E19");
                } else {
                    // d3.select(this).select('line').style("stroke", "#fff");
                    d3.select(this).select('text').style("fill", "#eee");
                }
            });  
        });
    };
    
    var highlightYAxisByTime = function(){
        d3.select("#y-axis").selectAll("g").each(function(d){
            if(+d % 0.5 == 0 && +d !== 0){
                d3.select(this).select('line').style("stroke", "#2F4550");
                d3.select(this).select('line').style("stroke-width", "1px");
            } 
        });  
    };  

    var createDOMElement = function(options){
        options = options || {};
        if(!options.type) {
            console.log('DOM Type is required');
            return;
        }
        var domElement = $('<' + options.type + '></' + options.type + '>');
        if(options.id) domElement.attr('id', options.id);
        if(options.class) domElement.addClass(options.class);
        if(options.title) domElement.attr('title', options.title);
        if(options.styles) {
            options.styles.forEach(function(style) {
                domElement.css(style.name, style.value);
            });
        }
        if(options.attributes) {
            options.attributes.forEach(function(attr) {
                domElement.attr(attr.name, attr.value);
            });
        }
        if(options.text) {
            domElement.text(options.text);
        }
        if(options.html) {
            domElement.html(options.html);
        }
        if(options.clickEventListener) {
            domElement.on('click', options.clickEventListener);
        }
        if(options.mouseoverEventListener) {
            domElement.on('mouseover', options.mouseoverEventListener);
        }
        if(options.mouseoutEventListener) {
            domElement.on('mouseout', options.mouseoutEventListener);
        }
        return domElement;  
    };   
    
    generateChart = function(inputData){

        resetAnimation();        
        d3.select(".chart-svg").remove();
        $(".chart-tooltip").remove();
        $('#chart-container').removeClass('hide');
        $("#chartOpenIcon").addClass('hide');
        $('#loadingSpinner').hide();

        if($(window).width() < 483){
            $('.panel').addClass('hide');
        }

        var heightOffset = 0;
        var widthOffset = 0;
        var mouseHoverTime;

        var dataGroup = d3.nest()
            .key(function(d) {return d.category;})
            .entries(inputData); 
            
        app.settings.uniqueTimeValues = dataGroup[0].values.map(function(d) {
            return d.fromTime;
        });
        
        var uniqueTimeValuesForDomain = app.settings.uniqueTimeValues.map(function(d){
            return d;
        })
        uniqueTimeValuesForDomain.push(
            +app.getSixHourTimeInterval(uniqueTimeValuesForDomain[uniqueTimeValuesForDomain.length - 1], true)[1]
        );  

        function populateChartForTabletView(data){

            app.appUIs.chartTabletViewWrapper.empty();

            var maxValue = _.max(data[1].values, function(data){ 
                return data.amountHigh; 
            }).amountHigh;

            var getTableItemColor = function(amount){
                var color;

                if(amount) {
                    color = app.config.app_data.colorLookup.filter(function(d){
                        return amount >= +d[0] && amount <= +d[1];
                    });
                    if(color.length && color[0].length){
                        color = color[0][2]
                    } else {
                        color = 'rgba(0,0,0,0)';
                    }
                } else {
                    color = 'rgba(0,0,0,0)';
                }

                return color;
            };

            var getContrastYIQ = function(hexcolor){
                var r = parseInt(hexcolor.substr(0,2),16);
                var g = parseInt(hexcolor.substr(2,2),16);
                var b = parseInt(hexcolor.substr(4,2),16);
                var yiq = ((r*299)+(g*587)+(b*114))/1000;
                return (yiq >= 128) ? 'black' : 'red';
            }

            // console.log(getTableItemColor(0.36));

            data.forEach(function(item){

                var conatiner = (item.key == "amountByTime") 
                    ? $('.chart-tablet-view-items-wrapper.precipitation') 
                    : $('.chart-tablet-view-items-wrapper.accumulation');

                item.values.forEach(function(d){
                    // var barWidth = (d.amountHigh) 
                    //     ? ((d.amountHigh.toFixed(2) / maxValue).toFixed(2) * 100) + '%' 
                    //     : '0';

                    var barWidth;

                    if(d.amountHigh && d.amountLow){
                        if(d.category == "accumulationByTime") {
                            barWidth = ((d.amountHigh.toFixed(2) / maxValue).toFixed(2) * 100) + '%';
                        } else {
                            barWidth = (((d.amountHigh.toFixed(2) - d.amountLow.toFixed(2)) / maxValue).toFixed(2) * 100) + '%';
                        }
                    } else {
                        barWidth = '0';
                    }

                    var marginLeftValue = (d.amountLow && d.category !== "accumulationByTime") 
                        ? ((d.amountLow.toFixed(2) / maxValue).toFixed(2) * 100) + '%' 
                        : '0px';

                    var timeInfo = app.getSixHourTimeInterval(d.fromTime);
                    var timeInfoText = timeInfo[0] + ' - ' + timeInfo[1];
                    var barColor = getTableItemColor((+d.amountHigh + +d.amountLow) / 2);
                    var textColor = getContrastYIQ(barColor);

                    var tableItem = createDOMElement({
                        type: 'div', 
                        class: "chart-tablet-view-item",
                        attributes: [{
                            name: 'value', value: d.fromTime
                        }],
                        clickEventListener:  function(){
                            var fromTime = $(this).attr('value');
                            renderLayerByTime(fromTime);
                        }
                    });
                    var tableItemBar = createDOMElement({
                        type: 'span', 
                        class: "chart-tablet-view-item-bar",
                        styles: [
                            {name: "background-color", value: barColor},
                            {name: 'width', value: barWidth},
                            {name: 'margin-left', value: marginLeftValue},
                        ]
                    });
                    var tableItemTimeInfo = createDOMElement({
                        type: 'span', 
                        class: "chart-tablet-view-item-time-info",
                        styles: [
                            {name: "color", value: '#000'}
                        ],
                        text: timeInfoText
                    });
                    var tableItemPrecipInfo = createDOMElement({
                        type: 'span', 
                        class: "chart-tablet-view-item-precip-info",
                        styles: [
                            {name: "color", value: '#000'}
                        ],
                        text: d.amountLow.toFixed(2) + ' - ' + d.amountHigh.toFixed(2) + ' in'
                    });
                    tableItem.append(tableItemBar);
                    tableItem.append(tableItemTimeInfo);
                    tableItem.append(tableItemPrecipInfo);
                    conatiner.append(tableItem);
                });
                
            });
        }   
        
        function populateChartElements(){

            var docHeight = $(document).height();
            var docWidth = $(document).width();

            d3.select(".chart-svg").remove();
            $( ".chart-tooltip" ).remove();       
                 
            var chartContainerHeight = $('#chart-div').height();
            var chartContainerWidth = $('#chart-div').width();
            
            var margin = {top: 5, right: 15, bottom: 30, left: 15};

            var width = chartContainerWidth - margin.left - margin.right - widthOffset,
                height = chartContainerHeight - margin.top - margin.bottom - heightOffset;
                
            var svg = d3.select("#chart-div")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("class", "chart-svg")
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   
                
            var xScale = d3.scale.ordinal()
                .domain(uniqueTimeValuesForDomain)
                .rangeRoundBands([margin.left, width + margin.left + margin.right - 50], 0);   
                
            var xScaleOffset = (xScale.rangeBand()/2);
            
            var maxYValue = app.config.app_data.precipLookupTable['category' + app.settings.maxAccumulationCategoryIndex].high;   

            var yScale = d3.scale.linear()
                .range([height - margin.top, 0])
                .domain(
                    [0, maxYValue]
                );               
                
            var xAxis = d3.svg.axis()
                .innerTickSize(-(height - margin.top))
                .tickPadding(12)
                .scale(xScale)
                .orient("bottom")
                .tickFormat(function(d) { 
                    return app.getSimplifiedDate(d, true, {"chart-tick": true});
                });
                
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .innerTickSize(-(width + margin.right - 50))
                .tickPadding(10)
                .ticks(8)
                .orient("left");

            var getLinearGradientData = function(){
                var outputData = [];
                var offsetValue = 0;
                var offsetInterval = ((1 / (app.settings.maxAccumulationCategoryIndex)) * 100 );

                function convertHex(hex,opacity){
                    hex = hex.replace('#','');
                    r = parseInt(hex.substring(0,2), 16);
                    g = parseInt(hex.substring(2,4), 16);
                    b = parseInt(hex.substring(4,6), 16);

                    result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
                    return result;
                }

                app.config.legend_data[0].elements.forEach(function(d){

                    if(d.key <=  app.settings.maxAccumulationCategoryIndex){
                        outputData.push({offset: offsetValue + '%', color: convertHex(d.color, 95)});
                        offsetValue += offsetInterval;
                    }
                });
                return outputData;
            };

            // console.log(getLinearGradientData());

            svg.append("linearGradient")
                .attr("id", "precip-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", yScale(0))
                .attr("x2", 0).attr("y2", yScale(maxYValue))
                .selectAll("stop")
                .data(getLinearGradientData())
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });

            svg.append("rect")
                .attr("class", "background-fill")
                .attr("width", width - margin.right - margin.left - 5)
                .attr("height", height - margin.top)
                .attr("transform", "translate(" + (margin.left) + ",0)")
                .style("fill", 'url(#precip-gradient)'); 
                
            var periodBar = svg.selectAll(".period-bar")
                .data(app.settings.uniqueTimeValues)
                .enter().append("rect")
                .attr("class", "period-bar")
                .attr("x", function(d) { return xScale(d) + xScaleOffset; })
                .attr("width", xScaleOffset * 2)
                .attr("y", function(d) { return yScale(maxYValue); })
                .attr("height", function(d) { return height - margin.top; })
                .style("fill", '#E79E19')
                // .style("fill", 'none')
                // .style("stroke", '#E79E19')
                // .style("stroke-width", '1')
                .style("opacity", 0);                            
                
            svg.append("svg:g")
                    .attr("class", "x axis")
                    .attr("id", "x-axis")
                    .attr("transform", "translate(0," + (height - margin.top) + ")")
                    .call(xAxis)
                .selectAll(".tick text")
                    .call(wrap, '35');
                    
            d3.select("#x-axis").selectAll(".tick").attr("id", function(d,i) {return "axis-" + i});
                
            svg.append("svg:g")
                    .attr("class", "y axis")
                    .attr("id", "y-axis")
                    .attr("transform", "translate(" + (margin.left) + ",0)")
                    .call(yAxis);
                // .append("text")
                //     .attr("class", 'y-axis-label')
                //     .attr("transform", "rotate(-90)")
                //     .attr("y", 6)
                //     .attr("dy", ".71em")
                //     .style("text-anchor", "end")
                //     .style("fill", "#636363")
                //     .text("Inches");    

            var area = d3.svg.area()
                .x(function(d) { return xScale(d.fromTime) + xScaleOffset * 2; })
                .y0(function(d) { return yScale(d.amountLow); }) //lower
                .y1(function(d) { return yScale(d.amountHigh); });  //higher
                
            dataGroup.forEach(function(d){
                //draw the stacked area    
                var classValue = (d.key == 'amountByTime' ? 'area areaAmountOfPrecip' : 'area areaAccumOfPrecip');
                
                svg.append("svg:path")
                    .attr("class", classValue)
                    .attr("d", area(d.values));
                
            });                                 
                            
            var tooltipDiv = d3.select("body")
                .append("div") 
                .attr("class", "chart-tooltip") 
                .style("display", "none");     
                 
            svg.selectAll(".period-bar-overlay")
                .data(app.settings.uniqueTimeValues)
                .enter().append("rect")
                .attr("class", "period-bar-overlay")
                .attr("x", function(d) { return xScale(d) + xScaleOffset; })
                .attr("width", xScaleOffset * 2)
                .attr("y", function(d) { return yScale(maxYValue); })
                .attr("height", function(d) { return height - margin.top; })
                .style("opacity", 0)
                .on("mouseover", function(d) { 
                    highlightXAxisPeriod(d);
                    tooltipDiv.style("display", null);
                })  
                .on("mouseout", function() { 
                    d3.selectAll(".period-bar").style('opacity', 0);
                    d3.select("#x-axis").selectAll("g").selectAll('text').style('fill', '#eee');
                    tooltipDiv.style("display", 'none');
                    highlightXAxisPeriod(app.settings.selectedTime);
                }) 
                .on("mousemove", mousemove)
                .on("click", function(d) { 
                    resetAnimation();
                    renderLayerByTime(d);
                });     
                
            function mousemove(d){
                var tickPos = xScale.range();
                
                var m = d3.mouse(this),
                    lowDiff = 1e99, //positive infinite
                    xI = null;
                    
                for (var i = 0; i < tickPos.length; i++){
                    var diff = Math.abs(m[0] - tickPos[i]);
                    if (diff < lowDiff){
                        lowDiff = diff;
                        xI = ((i - 1) > 0) ? i - 1 : 0;
                    }
                }

                d3.select(".verticalLine").attr("transform", function () {
                    return "translate(" + (tickPos[xI] + xScaleOffset) + ", 0)";
                });              

                mouseHoverTime = dataGroup[0].values[xI].fromTime;;  
                
                var fromTime = new Date (mouseHoverTime);
                var toTime = new Date ( fromTime );
                toTime.setHours ( fromTime.getHours() + 6 );     
                
                var beginTime = new Date (app.settings.precipDataByPeriod[0][0]);     
                var period = (parseInt(fromTime - beginTime)/(60 * 60 * 1000));
                
                var tooltipContent = '';
                var totalAmountTextString = '';
                
                if(dataGroup[0].values[xI].amountLow == 0 && dataGroup[0].values[xI].amountHigh == 0){
                    totalAmountTextString = '0';
                } else {
                    totalAmountTextString = '<span class=""><b>' + dataGroup[0].values[xI].amountLow.toFixed(2) + '</b></span> to <span class=""><b>' + dataGroup[0].values[xI].amountHigh.toFixed(2) + '</b></span>';
                }
                
                tooltipContent += '<div class="tooltip-inner">' + 
                
                                    '<span>A total accumulation of <span class=""><b>' + dataGroup[1].values[xI].amountLow.toFixed(2) + '</b></span> to <span class=""><b>' + dataGroup[1].values[xI].amountHigh.toFixed(2) + '</b></span> inches is expected during the <b>' + period + '-hour</b> period.</span><br>' + 
                                                    
                                    '<span> ' + totalAmountTextString + ' inches of precipitation is expected from <b>' + app.getSimplifiedDate(fromTime, true) + '</b> to <b>' +
                                    app.getSimplifiedDate(toTime, true) + '</b>.</span><div>';
          
                                    
                var tooltipDivHeight = $('.chart-tooltip').height();
                var tooltipDivWidth = $('.chart-tooltip').width();
                var windowWidth = $(window).width();
                var leftOffest;
                var rightOffset;

                if ((d3.event.pageX + tooltipDivWidth + 50) > windowWidth){
                    leftOffest = null;
                    rightOffset = (windowWidth - d3.event.pageX + 50) + "px";
                } else {
                    leftOffest = Math.max(0, d3.event.pageX + 50) + "px";
                    rightOffset = null;
                }

                tooltipDiv.html(tooltipContent)
                    .style("left", leftOffest)
                    .style("right", rightOffset)
                    .style("top", Math.max(0, Math.min(d3.event.pageY - 200, docHeight - tooltipDivHeight)) + "px"); 
            }

            app.getActiveLayer(function(layer){
                $('.area' + layer.id).addClass('active');
            });
            
            // highlightYAxisByTime();                  
        }                                                   
        
        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                    
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        } 
        
        populateChartElements();
        $(window).resize(populateChartElements);  

        populateVerticalChartLegend(app.settings.maxAccumulationCategoryIndex);
        populateChartForTabletView(dataGroup);      
        renderLayerByTime(app.settings.uniqueTimeValues[0]);   
        // $(".intro-content").hide();
    }

});