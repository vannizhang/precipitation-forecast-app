$(document).ready(function(){
    
//    $('.toggle-item').on('click', function(){
//        $(this).addClass('active');
//        $(this).siblings().removeClass('active');
//    });
   
   $('.selection-item').on('click', function(){
       $(this).toggleClass('active');
       $(this).siblings().removeClass('active');
   });
   
   $('.nav-icon').on('click', function(){
       var iconName = this.id.split('-')[0];
       var targetPanel = $('#' + iconName + '-div');

       if($(this).hasClass('active')){
           $(this).removeClass('active');
           $('.panel').addClass('hide');
       } else {
           $('.panel').removeClass('hide');
            $(this).addClass('active');
            $(this).siblings().removeClass('active');

            $(targetPanel).show();
            $(targetPanel).siblings('.panel-item').hide();
       }
   });

   $('#info-icon').on('click', function(){
       $('#welcome-dialog').removeClass('hide');
   });
   
   $('#chartCloseIcone').on('click', function(){
       $("#chart-container").addClass('hide');
       $("#chartOpenIcon").removeClass('hide');
       
   });
   
   $("#chartOpenIcon").on('click', function(){
       $("#chart-container").removeClass('hide');
       $("#chartOpenIcon").addClass('hide');
   });

   $('#toggle-menu-icon').on('click', function(){
        $('.panel').toggleClass('hide');
        var containerWidth = $(".search-input-box").width();
        $(".arcgisSearch .searchGroup .searchInput").css("width", (containerWidth - 88));        
   });

   $(".close-dialog").on('click', function(){
       $('.dialog-container').addClass('hide');
   });

   $(".nav-dialog").on('click', function(){
       var targetID = $(this).attr('target-item');
       $('.dialog-container').addClass('hide');
       $("#" + targetID).removeClass('hide');
   });

   $(".dialog-window").on('click', function(event){
       event.stopPropagation();
   });

   $(".dialog-container").on('click', function(){
       $(this).addClass('hide');
   });
   
   $(window).resize(function(){
    //    setSizeForLegendContainer();
        var windowWidth = $( window ).width();
        // updateChartLocationInfoContent();
        updateDOMElementPropeties(windowWidth);
        // updateSearchInputWidth(windowWidth);
   });  
   
   $('#layers-div').resize(function(){
    //    setSizeForLegendContainer();
   });  

//    var updateChartLocationInfoContent = function() {

//         var locationInfoWrapper = $('.location-info');
//         var locationNameText = $('.location-info > span.layer-main-title');
//         var locationTypeText = $('.location-info > span.layer-sub-title');

//         var wrapperWidth = locationInfoWrapper.width();
//         var locationNameTextWidth = locationNameText.width();
//         var locationTypeTextWidth = locationTypeText.width();

//         if(wrapperWidth && locationNameTextWidth && locationTypeTextWidth) {
//             if ( (locationNameTextWidth + locationTypeTextWidth + 3) >= wrapperWidth ){
//                 locationTypeText.hide();
//             } else {
//                 locationTypeText.show();
//             }  
//         }
//    };

   var updateDOMElementPropeties = function(windowWidth){
       if(windowWidth < 483){
            $('.panel').addClass('hide')

            $('.toggle-item').addClass('hide');

            var containerWidth = $(".search-input-box").width();
            $(".arcgisSearch .searchGroup .searchInput").css("width", (containerWidth - 88));

            // $("#chart-container").css('top', 128 + 50); 

       } else {
           $('.panel').removeClass('hide');
           $('.toggle-item').removeClass('hide');
        //    $('#title').removeClass('hide');

           $(".arcgisSearch .searchGroup .searchInput").css("width", '200px');

        //    $("#chart-container").css('top', 'unset'); 
       }
   }

    updateDOMElementPropeties($( window ).width());

});