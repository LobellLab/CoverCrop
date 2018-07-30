var datestr = '12Apr';

var C2007 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2007GDD0"),
    C2008 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2008GDD0"),
    C2009 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2009GDD0"),
    C2010 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2010GDD0"),
    C2011 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2011GDD0"),
    C2012 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2012GDD0"),
    C2013 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2013GDD0"),
    C2014 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2014GDD0"),
    C2015 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2015GDD0"),
    C2016 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2016GDD0");
var states = ee.FeatureCollection('ft:17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw');
var counties = ee.FeatureCollection('ft:18Ayj5e7JxxtTPm1BdMnnzWbZMrxMB49eqGDTsaSp');

var years = ee.List([2007,2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016]);

var state_list = ["IN","IL","IA", "MN", "WI", "MI", "OH"];
var subcount = counties.filter(ee.Filter.inList('State Abbr',state_list));
var ne_counties = counties.filter(ee.Filter.inList('GEO_ID2',[31107,31027,31051,31043,
31003, 31139, 31179, 31173, 31011, 31119, 31167, 31039, 31021,31125, 31141, 31037, 31053, 31177,
31121, 31143, 31023, 31155, 31055, 31153, 31081, 31185, 31159, 31109, 31025, 31131,
31035, 31059, 31151, 31067, 31097, 31127, 31133, 31147, 31129, 31169, 31095, 31001,
31079, 31093, 31077, 31183, 31071, 31175, 31163]));
var sd_counties = counties.filter(ee.Filter.inList('GEO_ID2',[46027, 46127, 46135, 46083, 46125,
46099, 46087, 46101, 46079, 46011, 46077, 46039, 46057, 46025, 46029, 46051, 46109, 46037, 46091]));
var subcount = subcount.merge(ne_counties).merge(sd_counties);

//Summed aggregation
function getHist(img, fcoll, scale){
  var histcoll = ee.Image(img).reduceRegions({
    collection: fcoll,
    reducer: ee.Reducer.fixedHistogram(0, 2, 2),
    scale: scale,
  });

  return histcoll.map(function(f){return ee.Feature(f).set({year:img.get('system:index')})});
}

function getHistColl(imgcoll, fcoll, scale, doexport, fname){
  var table = imgcoll.map(
    function(img){
      return getHist(img, fcoll, scale);
    }).flatten().filter(ee.Filter.neq('histogram', null));
  if(doexport===true){
    var newtable = table.select(['year', 'histogram', 'FIPS formula'],null, false);
    Export.table.toDrive(
      {collection:newtable,
      fileFormat:'GeoJSON',
      description:fname});
  }
  return table;
}


var images =  ee.ImageCollection.fromImages([C2007, C2008, C2009, C2010,
                                        C2011, C2012, C2013, C2014, C2015, C2016]);

var hists = getHistColl(images, subcount, 30, true,'hist_collection'+datestr);