var cdl = ee.ImageCollection("USDA/NASS/CDL"),
    gddraster = ee.Image("users/cseifert/gddraster");
    
var datestring = ’18-nov-18’
    
//Gather all training data
var trainingmaster = ee.FeatureCollection("ft:1tC_tbjNesKuS19czLpgvWHwvsb4PaJlrXXCnqqkx”);
var test = ee.FeatureCollection("ft:1SnCwL8Mm9C8Ywse6xaB6AnE18ekxuw3WpWmIPznl”);

//Make istates composite
var states = ee.FeatureCollection('ft:17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw');
var indiana = ee.Feature(states.filterMetadata('id', 'equals', 'IN').first());
var iowa = ee.Feature(states.filterMetadata('id', 'equals', 'IA').first());
var illinois = ee.Feature(states.filterMetadata('id', 'equals', 'IL').first());
var istatescoll = ee.FeatureCollection([indiana, illinois, iowa]);
var istates = indiana.union(illinois).union(iowa);

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

//Removing bands here that don't have a physical reason to matter for cover cropping
var bands = ['MODISnormNDVI', 'MODISnormNDVI_1', 'MODISnormNDVI_2',
             'GDD','GDD_1','GDD_2', 'NIR','GREEN',
             'NDVI', 'NDVI_1', 'NDVI_2' ,'SWIR1', 'NDVI_4'];
             //'AGRICDOY','AGRICDOY_1','AGRICDOY_2',
            //'MODISnormNDVI', 'MODISnormNDVI_1', 'MODISnormNDVI_2',
            //'NDVI', 'NDVI_1', 'NDVI_2',SWIR2
            //thrown out from best pixel-level classifer b1 'BLUE','RED','GREEN', 

//function for qc
function performanceFromTable(classified_table, doexport, fname){

  var cfmatrix = classified_table.errorMatrix('cover', 'classification');
  
  var acc = cfmatrix.accuracy();
  var consacc = cfmatrix.consumersAccuracy();
  var prodacc = cfmatrix.producersAccuracy();
  var k = cfmatrix.kappa();

  var perform =  ee.Feature(null).set({
    'cfmatrix':cfmatrix,
    'accuracy':acc,
    'prod_accuracy':prodacc,
    'cons_accuracy':consacc,
    'kappa':k
    });
    
  if(doexport===true){
    Export.table.toCloudStorage(ee.FeatureCollection([perform]), fname, 'classifier-data', fname, 'GeoJSON');
    //Export.table.toDrive(samples, fname, '');
    //Export.table.toDrive(ee.FeatureCollection([perform]), fname, '', fname, 'GeoJSON');
  }
  
  return perform;
  
}


//Make a classifier - one can also see results for different
//parameters here
var treenums =  [128];//[64,128,256];
var leafnums =  [5];//[2,5,25,125];
var varspltnums = [4];//[3,4,5];

for (var i = 0; i< treenums.length; i++){
  var trees = treenums[i];
  for (var j = 0; j< leafnums.length; j++){
    var leaves = leafnums[j];
    for (var k = 0; k< varspltnums.length; k++){
      var vars = varspltnums[k];

      var classifier = ee.Classifier.randomForest({
        numberOfTrees:trees, 
        minLeafPopulation:leaves,
        variablesPerSplit:vars,
        outOfBagMode:false,
        seed:42
      }).train({
        features: trainingmaster,
        classProperty: 'cover',
        inputProperties: bands
      });
      
      //Get QC metrics
      var testClassified = test.classify(classifier);

      //print(classifier.explain());
      var trainAccuracy = trainingmaster.classify(classifier);//= classifier.confusionMatrix();
      
      performanceFromTable(testClassified, true, "alltest"+datestring+String(trees)+String(leaves)+String(vars));
      performanceFromTable(trainAccuracy, true, "alltrain"+datestring+String(trees)+String(leaves)+String(vars));
    }
  }
}

//Classify and output images
var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
var arrayLength = years.length;

var tick = function(i){
  //Year in this context is the year CC were planted
  var year = years[i]; 
  //Which image to classify
  var image = ee.Image("projects/lobell-lab/CoverCrop/region10gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image2 = ee.Image("projects/lobell-lab/CoverCrop/region20gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image3 = ee.Image("projects/lobell-lab/CoverCrop/region30gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image4 = ee.Image("projects/lobell-lab/CoverCrop/region40gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image5 = ee.Image("projects/lobell-lab/CoverCrop/region50gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image6 = ee.Image("projects/lobell-lab/CoverCrop/region60gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image7 = ee.Image("projects/lobell-lab/CoverCrop/region70gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image8 = ee.Image("projects/lobell-lab/CoverCrop/region80gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image9 = ee.Image("projects/lobell-lab/CoverCrop/region90gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image10 = ee.Image("projects/lobell-lab/CoverCrop/region100gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image11 = ee.Image("projects/lobell-lab/CoverCrop/region110gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  var image12 = ee.Image("projects/lobell-lab/CoverCrop/region120gdd153daysimgcountApr1218FreezeAndPlantingNDVI"+String(year));
  
  //in the case of overlap, the last mosiac is on top
  var totimg = ee.ImageCollection([image12, image6, image11, image10, image4, image5, image2, image, image3, image9, image8, image7]).mosaic();
  var totimg = totimg.addBands(gddraster, ['b1']);
  
  //min and max ndvis 
  var totimg = totimg.addBands(totimg.select(['NDVI']).subtract(totimg.select(['MODISnorm']).multiply(.0001)).rename(['MODISnormNDVI']), ['MODISnormNDVI']);
  var totimg = totimg.addBands(totimg.select(['NDVI_1']).subtract(totimg.select(['MODISnorm_1']).multiply(.0001)).rename(['MODISnormNDVI_1']), ['MODISnormNDVI_1']);
  var totimg = totimg.addBands(totimg.select(['NDVI_2']).subtract(totimg.select(['MODISnorm_2']).multiply(.0001)).rename(['MODISnormNDVI_2']), ['MODISnormNDVI_2']);

  //1 is corn 5 is soybean
  var crop = 1;
  var altcrop = 5;

  //Optional crop mask
  var cdl_20xx = ee.Image(cdl.filter(ee.Filter.eq('system:index', String(year+1))).first()).select('cropland');
  var cdl_20xxc =cdl_20xx.eq(crop).or(cdl_20xx.eq(altcrop)).updateMask(cdl_20xx.eq(crop).or(cdl_20xx.eq(altcrop))).toFloat();
  var totimg= totimg.updateMask(cdl_20xxc);
  
  var classified = totimg.select(bands).classify(classifier);
  Map.addLayer(classified, {min:0, max: 2, palette: ['00FF00', 'FF0000', '0000FF']}, 'classified'+String(year));
  
  //Optional - export classified image
  Export.image.toAsset({
    image: classified,
    description: '0PlantFreezeCCclassifier'+String(year)+'GDD0',
    assetId: 'projects/lobell-lab/CoverCrop/0PlantFreezeCCclassifier'+datestring+'all'+String(year)+'GDD0',
    scale: 30,
    region: cornbelt,
    maxPixels : 3263253718
  });
};

for (var i = 0; i< arrayLength; i++){
  tick(i);
}
