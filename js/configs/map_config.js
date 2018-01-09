define({
    //basic infomation needed to create map object
    map: {
        basemap: 'gray',
        center: [-95, 38],
        zoom: 6, 
        container_id: "mapDiv",
        showAttribution: false     
    },
    
    ui_components: {
        search: {
            containerID: "search",
            autoNavigate: false,
            enableInfoWindow: false,
            enableHighlight: false,
        },
        draw: {
            drawType: 'FREEHAND_POLYGON',
            resultLayer: 'userDefinedArea'
        }
    },
    
    layers: {
        graphic_layers: [
            // {id: 'userDrawnLayer'}, 
            {id: 'userDefinedArea'},           
            {id: 'ndfd-amountByTime'}, 
            {id: 'ndfd-accumulationByTime'}, 
            {id: 'userSearchedLocation'}
        ],
        dynamic_layers: [
            {
                url: 'https://utility.arcgis.com/usrsvcs/servers/c8513c2e93ed4e32a8bb6c50c51c91e9/rest/services/LiveFeeds/NDFD_Precipitation/MapServer',
                options: {
                    id: 'ndfd-cumulativeTotal',
                    visibleLayers: [2],
                    visible: true,
                    opacity: .6
                }
            },
            {
                url: 'https://utility.arcgis.com/usrsvcs/servers/d0df882241e6477a923e4fa3b05bd27e/rest/services/USA_WatershedBoundaryDataset/MapServer',
                options: {
                    id: 'watershed-layer',
                    visibleLayers: [1, 2],
                    opacity: 0.3
                }
            },
            {
                url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
                options: {
                    id: 'county-layer',
                    visibleLayers: [2],
                    opacity: 0.3,
                    showAttribution: false,
                    visible: false,
                }
            },            
        ],
        feature_layers: [],
        query_layers: []        
    }, 
    
    layer_style: {
        'ndfd-amountByTime': {
            renderer: {
                type: 'UniqueValueRenderer',
                column: 'category',
                style: 'solid',
                // outlineStyle: 'STYLE_SOLID',
                // outlineColor: '#636363',
                // outlineWidth: 1,
                color: [
                    [190, 223, 255, 0.8],
                    [160, 216, 242, 0.8],
                    [131, 209, 230, 0.8],
                    [101, 202, 217, 0.8],
                    [71, 195, 204, 0.8],
                    [78, 178, 153, 0.8],
                    [86, 162, 102, 0.8],
                    [93, 145, 51, 0.8],
                    [100, 128, 0, 0.8],
                    [148, 143, 0, 0.8],
                    [150, 94, 0, 0.8],
                    [174, 76, 0, 0.8],
                    [199, 59, 0, 0.8],
                    [185, 57, 0, 0.8],
                    [172, 54, 87, 0.8],
                    [158, 52, 130, 0.8],
                    [135, 61, 134, 0.8],
                    [112, 69, 137, 0.8],
                    [198, 140, 255, 0.8],
                ]
            }  
        },        
        'ndfd-accumulationByTime': {
            renderer: {
                type: 'UniqueValueRenderer',
                column: 'category',
                style: 'solid',
                color: [
                    [190, 223, 255, 0.8],
                    [160, 216, 242, 0.8],
                    [131, 209, 230, 0.8],
                    [101, 202, 217, 0.8],
                    [71, 195, 204, 0.8],
                    [78, 178, 153, 0.8],
                    [86, 162, 102, 0.8],
                    [93, 145, 51, 0.8],
                    [100, 128, 0, 0.8],
                    [148, 143, 0, 0.8],
                    [150, 94, 0, 0.8],
                    [174, 76, 0, 0.8],
                    [199, 59, 0, 0.8],
                    [185, 57, 0, 0.8],
                    [172, 54, 87, 0.8],
                    [158, 52, 130, 0.8],
                    [135, 61, 134, 0.8],
                    [112, 69, 137, 0.8],
                    [198, 140, 255, 0.8],
                ]
            }  
        },     
        'ndfd-cumulativeTotal': {
            renderer: {
                type: 'UniqueValueRenderer',
                column: 'category',
                style: 'solid',
                color: [
                    [190, 223, 255, 1],
                    [160, 216, 242, 1],
                    [131, 209, 230, 1],
                    [101, 202, 217, 1],
                    [71, 195, 204, 1],
                    [78, 178, 153, 1],
                    [86, 162, 102, 1],
                    [93, 145, 51, 1],
                    [100, 128, 0, 1],
                    [148, 143, 0, 1],
                    [150, 94, 0, 1],
                    [174, 76, 0, 1],
                    [199, 59, 0, 1],
                    [185, 57, 0, 1],
                    [172, 54, 87, 1],
                    [158, 52, 130, 1],
                    [135, 61, 134, 1],
                    [112, 69, 137, 1],
                    [198, 140, 255, 1],
                ]
            }  
        },         
        'userDefinedArea': {
            type: 'fill',
            color: [50, 50, 50, 0.4],
            outlineStyle: 'STYLE_SOLID',
            outlineColor: [90, 90, 90, 0],
            outlineWidth: 0  
        },
        'userSearchedLocation': {
            type: 'marker',
            size: 12,
            color: [200, 200, 200, 0.5],
            outlineStyle: 'STYLE_SOLID',
            outlineColor: [30, 30, 30, 0.8],
            outlineWidth: 1  
        }   
    },  
    
    legend_data: [
        {
            layer: 'precipLayer',
            field: 'category',
            elements: [
                { key: '0', value: [0.1], color:  '#bedfff'},
                { key: '1', value: [0.25], color:  '#a0d8f2'},
                { key: '2', value: [0.5], color:  '#83d1e6'},
                { key: '3', value: [0.75], color:  '#65cad9'},
                { key: '4', value: [1], color:  '#47c3cc'},
                { key: '5', value: [1.5], color:  '#4eb299'},
                { key: '6', value: [2], color:  '#56a266'},
                { key: '7', value: [2.5], color:  '#5d9133'},
                { key: '8', value: [3], color:  '#648000'},
                { key: '9', value: [4], color:  '#948f00'},
                { key: '10', value: [5], color:  '#965e00'},
                { key: '11', value: [6], color:  '#ae4c00'},
                { key: '12', value: [8], color:  '#c73b00'},
                { key: '13', value: [10], color:  '#b9392b'},
                { key: '14', value: [12], color:  '#ac3657'},
                { key: '15', value: [14], color:  '#9e3482'},
                { key: '16', value: [16], color:  '#873d86'},
                { key: '17', value: [18], color:  '#704589'},
                { key: '18', value: [20], color:  '#c68cff'},
                { key: '19', value: [''], color:  '#ffffff'}]
        },    
    ],
    
    app_data: {
        appID: 'FHUwdGajXziWcLJ0',
        precipLookupTable: {
            category0: {low: 0.01, high: 0.10, color: '#bedfff', textColor: '#3a3a3a'},
            category1: {low: 0.10, high: 0.25, color: '#a0d8f2', textColor: '#484848'},
            category2: {low: 0.25, high: 0.50, color: '#83d1e6', textColor: '#575757'},
            category3: {low: 0.50, high: 0.75, color: '#65cad9', textColor: '#656565'},
            category4: {low: 0.75, high: 1, color: '#47c3cc', textColor: '#656565'},
            category5: {low: 1, high: 1.50, color: '#4eb299', textColor: '#ebebeb'},
            category6: {low: 1.50, high: 2, color: '#56a266', textColor: '#ededed'},
            category7: {low: 2, high: 2.50, color: '#5d9133', textColor: '#efefef'},
            category8: {low: 2.50, high: 3, color: '#648000', textColor: '#f1f1f1'},
            category9: {low: 3, high: 4, color: '#948f00', textColor: '#f4f4f4'},
            category10: {low: 4, high: 5, color: '#965e00', textColor: '#ffffff'},
            category11: {low: 5, high: 6, color: '#ae4c00', textColor: '#ffffff'},
            category12: {low: 6, high: 8, color: '#c73b00', textColor: '#ffffff'},
            category13: {low: 8, high: 10, color: '#b9392b', textColor: '#ffffff'},
            category14: {low: 10, high: 12, color: '#ac3657', textColor: '#ffffff'},
            category15: {low: 12, high: 14, color: '#9e3482', textColor: '#ffffff'},
            category16: {low: 14, high: 16, color: '#873d86', textColor: '#ffffff'},
            category17: {low: 16, high: 18, color: '#704589', textColor: '#ffffff'},
            category18: {low: 18, high: 20, color: '#c68cff', textColor: '#ffffff'},
            category19: {low: 20, high: -999, color: '#ffffff', textColor: '#ffffff'} 
        },
        
        colorLookup: [
            [0.01, 0.1,  '#bedfff'],
            [0.1, 0.25,  '#a0d8f2'],
            [0.25, 0.5,  '#83d1e6'],
            [0.5, 0.75,  '#65cad9'],
            [0.75, 1,  '#47c3cc'],
            [1, 1.5,  '#4eb299'],
            [1.5, 2,  '#56a266'],
            [2, 2.5,  '#5d9133'],
            [2.5, 3,  '#648000'],
            [3, 4,  '#948f00'],
            [4, 5,  '#965e00'],
            [5, 6,  '#ae4c00'],
            [6, 8,  '#c73b00'],
            [8, 10,  '#b9392b'],
            [10, 12,  '#ac3657'],
            [12, 14,  '#9e3482'],
            [14, 16,  '#873d86'],
            [16, 18,  '#704589'],
            [18, 20,  '#c68cff'],
            [20, 999,  '#ffffff' ],
        ],
        
        appDataQueryTasks: [
            {name: 'watershed-layer', url: 'https://utility.arcgis.com/usrsvcs/servers/d0df882241e6477a923e4fa3b05bd27e/rest/services/USA_WatershedBoundaryDataset/MapServer/'},
            {name: 'county-layer', url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/'},
            {name: 'amountByTime', url: 'https://utility.arcgis.com/usrsvcs/servers/c8513c2e93ed4e32a8bb6c50c51c91e9/rest/services/LiveFeeds/NDFD_Precipitation/MapServer/0'},
            {name: 'accumulationByTime', url: 'https://utility.arcgis.com/usrsvcs/servers/c8513c2e93ed4e32a8bb6c50c51c91e9/rest/services/LiveFeeds/NDFD_Precipitation/MapServer/1'},
        ],
    } 
});