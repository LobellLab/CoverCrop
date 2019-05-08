var datestr = '18-nov-18’;

var soy = ee.Image("projects/lobell-lab/scym_srlandsat_gcviqlty_srmodisblend_pyv1f_usa_soybean_img"),
    oldcorn = ee.Image("projects/lobell-lab/scym_srlandsat_gcviqlty_srmodisblend_pyv1f_usa_maize_img"),
    gddraster = ee.Image("users/cseifert/gddraster"),
    corn = ee.Image("projects/lobell-lab/scym_v09c_srblend_gcviqlty_ctabv8loc_beltstates_maize_merged"),
    daymet_coll = ee.ImageCollection("NASA/ORNL/DAYMET");

var C2007 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2007GDD0"),
    C2008 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2008GDD0"),
    C2009 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2009GDD0"),
    C2010 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2010GDD0"),
    C2011 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2011GDD0"),
    C2012 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2012GDD0"),
    C2013 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2013GDD0"),
    C2014 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2014GDD0"),
    C2015 = ee.Image("projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier"+datestr+"all2015GDD0");
    
var imagemaster = ee.Image([C2007, C2008, C2009, C2010, C2011, C2012, C2013, C2014, C2015])
.rename(['C2007', 'C2008', 'C2009', 'C2010', 'C2011', 'C2012', 'C2013', 'C2014', 'C2015']);


var states = ee.FeatureCollection('ft:17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw');
 
//Make istates composite
var states = ee.FeatureCollection('ft:17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw');
var indiana = ee.Feature(states.filterMetadata('id', 'equals', 'IN').first());
var iowa = ee.Feature(states.filterMetadata('id', 'equals', 'IA').first());
var illinois = ee.Feature(states.filterMetadata('id', 'equals', 'IL').first());
var istatescoll = ee.FeatureCollection([indiana, illinois, iowa]);
//var istates = indiana.union(illinois).union(iowa);

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
//var cornbeltcoll = ee.FeatureCollection([indiana, illinois, iowa, minnesota, wisconsin, ne_counties, sd_counties]);
var cornbelt = indiana.union(illinois).union(iowa).union(wisconsin).union(minnesota).union(sd_counties).union(ne_counties).union(ohio).union(michigan);
var soybelt = indiana.union(illinois).union(iowa);

//Get soil composite
var illinois_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_IL_20m");
var indiana_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_IN_20m");
var iowa_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_IA_20m");
var michigan_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_MI_20m");
var michigan_soil = michigan_soil.cast(['b1','uint32'],['b1']);
var minnesota_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_MN_20m");
var nebraska_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_NE_20m");
var ohio_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_OH_20m");
var southDakota_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_SD_20m");
var southDakota_soil = michigan_soil.cast(['b1','uint32'],['b1']);
var wisconsin_soil = ee.Image("users/JinZhenong/gSSURGO_Midwest/gSSURGO_Mukey_WI_20m");
var soil = ee.ImageCollection([indiana_soil, iowa_soil, illinois_soil,// michigan_soil,
     minnesota_soil,nebraska_soil,ohio_soil,southDakota_soil,wisconsin_soil]).mosaic();


//Get soil data
function getSoilData(image){

    var mukey = image.addBands(soil.select('b1').rename('mukey'));
  
  return image.addBands(mukey);
}

//Get weather data
function getWeatherData(image){
  var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014]//2015
  var yl = years.length;
  for (var l = 0; l< yl; l++){
    var year = years[l];
    var eeyear = ee.Number(year);
    var preplantstartd = ee.Date.fromYMD(eeyear.add(1), 4, 1);
    var preplantendd = ee.Date.fromYMD(eeyear.add(1), 5, 1);
    
    var earlystartd = ee.Date.fromYMD(eeyear.add(1), 6, 1);
    var earlyendd = ee.Date.fromYMD(eeyear.add(1), 7, 1);
    
    var midstartd = ee.Date.fromYMD(eeyear.add(1), 7, 1);
    var midendd = ee.Date.fromYMD(eeyear.add(1), 8, 1);
    
    var endstartd = ee.Date.fromYMD(eeyear.add(1), 8, 1);
    var endendd = ee.Date.fromYMD(eeyear.add(1), 9, 1);
    
    var preplant_weather_data = ee.ImageCollection(daymet_coll.filterDate(preplantstartd, preplantendd)).mean();
    var early_weather_data = ee.ImageCollection(daymet_coll.filterDate(preplantstartd, earlyendd)).mean();
    var mid_weather_data = ee.ImageCollection(daymet_coll.filterDate(preplantstartd, midendd)).mean();
    var end_weather_data = ee.ImageCollection(daymet_coll.filterDate(preplantstartd, endendd)).mean();
    
    var wvars = ['prcp','tmax', 'tmin','vp'];
    
    var preplant = image.addBands(preplant_weather_data.select(wvars,
              ['prcp_preplant'+String(year+1), 'tmax_preplant'+String(year+1), 'tmin_preplant'+String(year+1),'vp_preplant'+String(year+1)])
              .select(['prcp_preplant'+String(year+1), 'tmax_preplant'+String(year+1), 'tmin_preplant'+String(year+1),'vp_preplant'+String(year+1)]));
    var early = image.addBands(early_weather_data.select(wvars,
               ['prcp_early'+String(year+1), 'tmax_early'+String(year+1), 'tmin_early'+String(year+1),'vp_early'+String(year+1)])
              .select(['prcp_early'+String(year+1), 'tmax_early'+String(year+1), 'tmin_early'+String(year+1),'vp_early'+String(year+1)]));
    var mid = image.addBands(mid_weather_data.select(wvars,
               ['prcp_mid'+String(year+1), 'tmax_mid'+String(year+1), 'tmin_mid'+String(year+1),'vp_mid'+String(year+1)])
              .select(['prcp_mid'+String(year+1), 'tmax_mid'+String(year+1), 'tmin_mid'+String(year+1),'vp_mid'+String(year+1)]));
    var end = image.addBands(end_weather_data.select(wvars, ['prcp_end'+String(year+1), 'tmax_end'+String(year+1), 'tmin_end'+String(year+1),'vp_end'+String(year+1)])
              .select(['prcp_end'+String(year+1), 'tmax_end'+String(year+1), 'tmin_end'+String(year+1),'vp_end'+String(year+1)]));
    
    var image = image.addBands(preplant).addBands(early).addBands(mid).addBands(end);
  }
  return image;
}



//Mask down to relevant pixels
//var masked = ee.Image(classified.filter(ee.Filter.eq('1', String(year+1))).first());

//var images = [C2007, C2008, C2009, C2010, C2011, C2012, C2013, C2014, C2015];
var cropimagcol = corn;//soy;
var crop= 'corn';//'soy';
var regions = [indiana, iowa, illinois, minnesota, wisconsin, ohio, michigan,ne_counties, sd_counties];
var regionstrings = ['IN', 'IA', 'IL', 'MN', 'WI', 'OH', 'MI', 'NE', 'SD'];
var regionsArrayLength = regions.length;


var tick = function(j, region, regionstring){
  //var year = years[i]; 
  var image = getSoilData(imagemaster);
  var image = getWeatherData(image);
  var regressionimage = ee.Image([cropimagcol
                              .select('yield_2008','yield_2009','yield_2010',
                              'yield_2011','yield_2012','yield_2013','yield_2014','yield_2015'),
                              image.select('C2007', 'C2008', 'C2009', 'C2010', 'C2011', 'C2012', 
                              'C2013','C2014', 'C2015','mukey',
                              'prcp_preplant2008', 'tmax_preplant2008', 'tmin_preplant2008','vp_preplant2008',
                              'prcp_early2008', 'tmax_early2008', 'tmin_early2008','vp_early2008',
                              'prcp_mid2008', 'tmax_mid2008', 'tmin_mid2008','vp_mid2008',
                              'prcp_end2008', 'tmax_end2008', 'tmin_end2008','vp_end2008',
                              'prcp_preplant2009', 'tmax_preplant2009', 'tmin_preplant2009','vp_preplant2009',
                              'prcp_early2009', 'tmax_early2009', 'tmin_early2009','vp_early2009',
                              'prcp_mid2009', 'tmax_mid2009', 'tmin_mid2009','vp_mid2009',
                              'prcp_end2009', 'tmax_end2009', 'tmin_end2009','vp_end2009',
                              'prcp_preplant2010', 'tmax_preplant2010', 'tmin_preplant2010','vp_preplant2010',
                              'prcp_early2010', 'tmax_early2010', 'tmin_early2010','vp_early2010',
                              'prcp_mid2010', 'tmax_mid2010', 'tmin_mid2010','vp_mid2010',
                              'prcp_end2010', 'tmax_end2010', 'tmin_end2010','vp_end2010',
                              'prcp_preplant2011', 'tmax_preplant2011', 'tmin_preplant2011','vp_preplant2011',
                              'prcp_early2011', 'tmax_early2011', 'tmin_early2011','vp_early2011',
                              'prcp_mid2011', 'tmax_mid2011', 'tmin_mid2011','vp_mid2011',
                              'prcp_end2011', 'tmax_end2011', 'tmin_end2011','vp_end2011',
                              'prcp_preplant2012', 'tmax_preplant2012', 'tmin_preplant2012','vp_preplant2012',
                              'prcp_early2012', 'tmax_early2012', 'tmin_early2012','vp_early2012',
                              'prcp_mid2012', 'tmax_mid2012', 'tmin_mid2012','vp_mid2012',
                              'prcp_end2012', 'tmax_end2012', 'tmin_end2012','vp_end2012',
                              'prcp_preplant2013', 'tmax_preplant2013', 'tmin_preplant2013','vp_preplant2013',
                              'prcp_early2013', 'tmax_early2013', 'tmin_early2013','vp_early2013',
                              'prcp_mid2013', 'tmax_mid2013', 'tmin_mid2013','vp_mid2013',
                              'prcp_end2013', 'tmax_end2013', 'tmin_end2013','vp_end2013',
                              'prcp_preplant2014', 'tmax_preplant2014', 'tmin_preplant2014','vp_preplant2014',
                              'prcp_early2014', 'tmax_early2014', 'tmin_early2014','vp_early2014',
                              'prcp_mid2014', 'tmax_mid2014', 'tmin_mid2014','vp_mid2014',
                              'prcp_end2014', 'tmax_end2014', 'tmin_end2014','vp_end2014',
                              'prcp_preplant2015', 'tmax_preplant2015', 'tmin_preplant2015','vp_preplant2015',
                              'prcp_early2015', 'tmax_early2015', 'tmin_early2015','vp_early2015',
                              'prcp_mid2015', 'tmax_mid2015', 'tmin_mid2015','vp_mid2015',
                              'prcp_end2015', 'tmax_end2015', 'tmin_end2015','vp_end2015'),
                              gddraster.select('b1')]);
  Export.image.toAsset({
    image: regressionimage,
    description: 'master'+regionstring+'CCclassifier'+'GDD0',
    assetId: 'projects/lobell-lab/CoverCrop/master'+regionstring+'CCclassifier'+datestr+'GDD0' + crop,
    scale: 30,
    region: region,
    maxPixels : 3263253718
  });
};


for (var j = 0; j< regionsArrayLength; j++){
    var region = regions[j];
    var regionstring = regionstrings[j];
    tick(j, region, regionstring);
}