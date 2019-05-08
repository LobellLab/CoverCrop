
var datestr = '18-nov-18’
var rname =1; //repeat per region


var cdl = ee.ImageCollection("USDA/NASS/CDL"),
    gddraster = ee.Image("users/cseifert/gddraster");

  var NDVIGDD2007 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2007");
  var NDVIGDD2008 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2008");
  var NDVIGDD2009 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2009");
  var NDVIGDD2010 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2010");
  var NDVIGDD2011 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2011");
  var NDVIGDD2012 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2012");
  var NDVIGDD2013 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2013");
  var NDVIGDD2014 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2014");
  var NDVIGDD2015 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2015");
  var NDVIGDD2016 = ee.Image("projects/lobell-lab/CoverCrop/region"+String(rname)+"0gdd153daysimgcountApr1218FreezeAndPlantingNDVI2016");

//Import US boundaries
var states = ee.FeatureCollection('ft:17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw');
var counties = ee.FeatureCollection('ft:18Ayj5e7JxxtTPm1BdMnnzWbZMrxMB49eqGDTsaSp');

//Make Istates composite
var indiana = ee.Feature(states.filterMetadata('id', 'equals','IN').first());
var illinois = ee.Feature(states.filterMetadata('id', 'equals','IL').first());
var iowa = ee.Feature(states.filterMetadata('id', 'equals','IA').first());
//var istates =  indiana.union(illinois).union(iowa);

//Make cornbelt composite
var counties = ee.FeatureCollection('ft:18Ayj5e7JxxtTPm1BdMnnzWbZMrxMB49eqGDTsaSp');
var minnesota = ee.Feature(states.filterMetadata('id', 'equals', 'MN').first());
var wisconsin = ee.Feature(states.filterMetadata('id', 'equals', 'WI').first());
var ohio = ee.Feature(states.filterMetadata('id', 'equals', 'OH').first());
var michigan = ee.Feature(states.filterMetadata('id', 'equals', 'MI').first());
var ne_counties = ee.Feature(counties.filter(ee.Filter.inList('GEO_ID2',[31107,31027,31051,31043,
31003, 31139, 31179, 31173, 31011, 31119, 31167, 31039, 31021,31125, 31141, 31037, 31053, 31177,
31121, 31143, 31023, 31155, 31055, 31153, 31081, 31185, 31159, 31109, 31025, 31131,
31035, 31059, 31151, 31067, 31097, 31127, 31133, 31147, 31129, 31169, 31095, 31001,
31079, 31093, 31077, 31183, 31071, 31175, 31163])).union().geometry());
var sd_counties = ee.Feature(counties.filter(ee.Filter.inList('GEO_ID2',[46027, 46127, 46135, 46083, 46125,
46099, 46087, 46101, 46079, 46011, 46077, 46039, 46057, 46025, 46029, 46051, 46109, 46037, 46091])).union().geometry());
var cornbeltcoll = ee.FeatureCollection([indiana, illinois, iowa, minnesota, wisconsin, ne_counties, sd_counties]);
var cornbelt = indiana.union(illinois).union(iowa).union(wisconsin).union(minnesota).union(sd_counties).union(ne_counties).union(ohio).union(michigan);


var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];
var crop = 1;
var altcrop = 5;
var pasturecdl = 176;
var altpasturecdl = 37; //36 is alfalfa
var arrayLength = years.length;
var region = cornbelt;
var images = [NDVIGDD2007,NDVIGDD2008,NDVIGDD2009,NDVIGDD2010,
NDVIGDD2011,NDVIGDD2012,NDVIGDD2013,NDVIGDD2014,NDVIGDD2015];

var resultarray = [];

var tick = function(i){
  var year = years[i]; 
  var totimg = images[i];

  //make crop mask
  var cdl_20xx = ee.Image(cdl.filter(ee.Filter.eq('system:index', String(year+1))).first()).select('cropland');
  //var cdl_20xxc =cdl_20xx.eq(crop).updateMask(cdl_20xx.eq(crop)).toFloat();
  var cdl_20xxc =cdl_20xx.eq(crop).or(cdl_20xx.eq(altcrop)).updateMask(cdl_20xx.eq(crop).or(cdl_20xx.eq(altcrop))).toFloat();
  var maskedNDVI= totimg.updateMask(cdl_20xxc);
  //var stats = maskedNDVI.reduceRegions(region, ee.Reducer.count());
  var stats = maskedNDVI.reduceRegions({
  collection: region,
  reducer: ee.Reducer.mean(),
  scale: 30,
  });
  
  //make pasture mask
  var cdl_20xx = ee.Image(cdl.filter(ee.Filter.eq('system:index', String(year+1))).first()).select('cropland');
  var cdl_20xxc =cdl_20xx.eq(pasturecdl).or(cdl_20xx.eq(altpasturecdl)).updateMask(cdl_20xx.eq(pasturecdl).or(cdl_20xx.eq(altpasturecdl))).toFloat();

  var maskedNDVIpasture= totimg.updateMask(cdl_20xxc);
  //var stats = maskedNDVI.reduceRegions(region, ee.Reducer.count());
  var statspasture = maskedNDVIpasture.reduceRegions({
  collection: region,
  reducer: ee.Reducer.mean(),
  scale: 30,
  });
  
  var allcount = totimg.reduceRegion({
  //collection: region,
  maxPixels:42741092590,
  reducer: ee.Reducer.count(),
  scale: 30,
  });
  
  
  resultarray.push(ee.List([stats.aggregate_mean('NDVI'),statspasture.aggregate_mean('NDVI'),allcount.get('NDVI')]));
  var yearstat = ee.Feature(null, {ndvi:stats.aggregate_mean('NDVI'), pasture:statspasture.aggregate_mean('NDVI'), pixelcount:allcount.get('NDVI')});  

  //print(allcount.aggregate_count('NDVI'));
  //print(allcount.get('NDVI')) 
};

for (var i = 0; i< arrayLength; i++){
  tick(i);
}
print(resultarray);


  var fc = ee.FeatureCollection(resultarray.map(function(list) {
    var list = ee.List(list);
    var dict = {
        ndvi: list.get(0),
        pasture: list.get(1),
        pixelcount: list.get(2),
    };
    return ee.Feature(null, dict);
  }));
  
  print(fc);
  
  //and export array to geojson
  Export.table.toDrive(
        {collection:fc,
        fileFormat:'csv',
        description:'Greenness-9state'+datestr+rname});
