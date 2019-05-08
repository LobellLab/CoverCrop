# Import GEE Python API
import ee

# Initialize EE using auth
ee.Initialize()

datestr = '18-nov-18’;
crop = 'corn'

counties = ee.FeatureCollection('ft:18Ayj5e7JxxtTPm1BdMnnzWbZMrxMB49eqGDTsaSp')

#get list of counties
sd_counties = ee.FeatureCollection(counties.filter(ee.Filter.inList('GEO_ID2',[46027, 46127, 46135, 46083, 46125,
46099, 46087, 46101, 46079, 46011, 46077, 46039, 46057, 46025, 46029, 46051, 46109, 46037, 46091])))
ne_counties = ee.FeatureCollection(counties.filter(ee.Filter.inList('GEO_ID2',[31107,31027,31051,31043,
31003, 31139, 31179, 31173, 31011, 31119, 31167, 31039, 31021,31125, 31141, 31037, 31053, 31177,
31121, 31143, 31023, 31155, 31055, 31153, 31081, 31185, 31159, 31109, 31025, 31131,
31035, 31059, 31151, 31067, 31097, 31127, 31133, 31147, 31129, 31169, 31095, 31001,
31079, 31093, 31077, 31183, 31071, 31175, 31163])));
indianacounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'IN'));
iowacounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'IA'));
illinoiscounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'IL'));
minnesotacounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'MN'));
wisconsincounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'WI'));
ohiocounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'OH'));
michigancounties = ee.FeatureCollection(counties.filterMetadata('State Abbr', 'equals', 'MI'));

cornbeltcoll = indianacounties.merge(iowacounties).merge(illinoiscounties).merge(minnesotacounties) \
                   .merge(wisconsincounties).merge(ohiocounties).merge(michigancounties).merge(ne_counties)\
                   .merge(sd_counties)

if crop == 'soy':
    cornbeltcoll = indianacounties.merge(iowacounties).merge(illinoiscounties)

def sampleFunction(region, img ,npx, cband,  scale, seed):
    s = img.stratifiedSample(
    numPoints= npx,
    classBand = cband,
    region= region.geometry(),
    scale = scale,
    projection= None,
    seed = seed,
    classValues = None,
    classPoints = None,
    dropNulls= False,
    tileScale= 6)
    return s.map(lambda s: s.copyProperties(region))


def getSamples(img, cband, region, scale, npx, seed, fname, fprefix) :

    samples = sampleFunction(region,img,npx, cband, scale, seed)#.flatten(); #region,
    #samples = regions.map(sampleFunction).flatten()

    task = ee.batch.Export.table.toCloudStorage(samples,
                                                description=fname,
                                                bucket='classifier-data',
                                                fileNamePrefix=fprefix,
                                                fileFormat='CSV')
    task.start()
    return samples


def getreg(flo):
    reg = cornbeltcoll.filterMetadata('FIPS formula', 'equals', flo);
    return reg

stabrs = ee.List(cornbeltcoll.aggregate_array("State Abbr")).map(lambda d:ee.String(d))
fipses = ee.List(cornbeltcoll.aggregate_array("FIPS formula")).map(lambda d:ee.Number(d))
fipsesArrayLength = fipses.length;
#print(cornbeltcoll.getInfo())

fl = fipses.length()
for j in range(0,fl.getInfo()): #0
    print(j)
    ff = fipses.get(j)
    region = getreg(ff)
    fipsstring = str(int(fipses.getInfo()[j]))
    regionstring = str(stabrs.getInfo()[j])
    #centering on 2015 yields (2014 cover crops)
    cband = 'C2014'
    regressionimage = ee.Image(
        "projects/lobell-lab/CoverCrop/master" + regionstring + "CCclassifier" + datestr + "GDD0" +crop)
    regressiontable = getSamples(regressionimage, cband, region, 30, None, 7500, 1,
                                 datestr + 'regres02' + regionstring,
                                 '7500' + datestr + 'all' + 'yield' + 'Covers' + crop + fipsstring)


