var cdl = ee.ImageCollection("USDA/NASS/CDL"),
    gddraster = ee.Image("users/cseifert/gddraster");

var datestr='18Nov18’;

//Master here is master polygon feature table
var master = ee.FeatureCollection("ft:1_qjZlWuOV5wEHTmObdac6KtbEl-CogbTdHeNlKDX");

/*POLYGON-LEVEL SAMPLING*/
function getSamples(img, regions, scale, factor, npx, seed, doexport, fname, fprefix){
  
  var samples = regions.map(
    
    function(region){
      
      var s = img.sample({
        region: region.geometry(), 
        scale: scale, 
        projection: null, 
        factor: factor, 
        numPixels: npx, 
        seed: seed, 
        dropNulls: true
      });
      
      return s.map(
        
        function(f){ 
          
          return ee.Feature(f.copyProperties(region));
          
        }); 
    
    }).flatten();

  if(doexport===true){
    Export.table.toCloudStorage(samples, fname, 'classifier-data', fprefix, 'CSV');
    //Export.table.toDrive(samples, fname, '');
  }

  return samples;
  
}

var buffer = function(feature){
  return feature.buffer(-30);
};

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
  
  //1 is corn 5 is soybean
  //Cycle references production cycle here
  var cc = ee.FeatureCollection(master.filterMetadata('cycle', 'equals',year+1));
  //CRP was coded as cover type 2
  var ccnoCRP = ee.FeatureCollection(cc.filterMetadata('cover', 'less_than',2));
  Map.addLayer(cc.draw({color: '006600', strokeWidth: 5}), {}, 'drawn');

  //Buffer feature collection to avoid outer pixels
  var ccb = ccnoCRP.map(buffer); 

  //Export data
  var bands = ['BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1', 'SWIR2',
            'NDVI', 'NDVI_1', 'NDVI_2', 'NDVI_4',
            'AGRICDOY','AGRICDOY_1','AGRICDOY_2',
            'GDD','GDD_1','GDD_2',
            'MODISnorm', 'MODISnorm_1', 'MODISnorm_2', 'b1'];
  //Sampling must be within (0,1]
  var training = getSamples(totimg.select(bands), ccb, 30, 1.0, null, 1, true,
  'bufferedGDD0unfiltered'+String(year), datestr +'finaladv'+String(year) );
  //Map.addLayer(training.draw({color: 'FFFFFF', strokeWidth: 5}), {}, 'buffered');
};

for (var i = 0; i< arrayLength; i++){
  tick(i);
}