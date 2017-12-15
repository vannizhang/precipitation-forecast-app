define([
    "dojo/_base/declare",
    "dojo/promise/all", 
    "dojo/Deferred", 
    "esri/tasks/query",
    "esri/tasks/QueryTask",

], function(declare, 
    all, Deferred,
    Query, QueryTask
){
    
    var queryTaskObj = declare(null, {
        
        //set properties of object
        constructor: function (config) {
            this.tasks = config.queryTasks;
            this.params = this._initQueryTaskParameters(config.params);
        },  
        
        _initQueryTaskParameters: function(params){
            var q = new Query();
            if(params.geometry){
                q.spatialRelationship = q.SPATIAL_REL_INTERSECTS;
                q.geometry = params.geometry;
            }
            q.where = params.where || "1=1"
            q.returnGeometry = true;
            q.outFields = ['*'];
            q.num = 100;
            
            return q;
        },  
        
        //Called each time the promise is rejected    
        _promiseRejected: function(err) {
            console.error("Promise rejected: ", err.message);
        },                  
        
        batchQueryTasks: function(callback){
            var tasks = [];
            
            if(this.tasks.constructor !== Array){
                this.tasks = [this.tasks];
            }
            
            for(var i = 0, len = this.tasks.length; i < len; i++){
                var task = new QueryTask(this.tasks[i]);
                tasks.push(this.executeQueryTask(task));    
            }
            
            all(tasks).then(function(results){
                callback(results);
            })
        },
        
        executeQueryTask: function(queryTask) {
            var deferred = new Deferred();
            queryTask.execute(this.params).then(function(response){
                deferred.resolve(response);
            }, this._promiseRejected);
            
            return deferred.promise;
        }                 
    });
    
    return queryTaskObj;
    
});

