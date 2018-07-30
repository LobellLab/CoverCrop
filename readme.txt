The following describes a procedure for replicating the classification-based findings of "Satellite Detection of Cover Crops and Their Effects on Crop Yield in the Midwestern United States"
by Christopher Seifert, George Azzari and David Lobell. 

The first step in this process is to use the data provided at https://fusiontables.google.com/DataSource?docid=1Cjc8BJozJQ_0eeFebxymszVS99jvuqDw-Ne_dE6J to sample a set of 
composite rasters shared through the Lobell Lab Google Earth Engine (GEE) account using the 0TableToSamples.js script. 

Once the resulting .csv files are locally held, use 1Classifier.R to generate a test and training set for future use in GEE. This script also creates a random forest 
model in R and briefly looks at accuracy - based on the current setup, accuracy should be roughly 92% depending on the seed set - same as you will soon get in GEE.

Speaking of which, now is the time to replicate the classifier you just produced - this time in Earth Engine proper. 11FinalClassifier.js is the relevant script to 
use here. It allows for some searching in the parameter space for the number of trees, node size and number of variables to consider per plot,
but to replicate the paper result, 128, 5 and 4 are the relevant parameters. 

Now it is time to look at trends - 

21Trends.js will yield the cover crop counts needed for all single year analysis
22MultiYearTrends.js will yield two-year cover crop counts necessary for all two-year analysis. Here it is critical to create the added rasters before the geojson. 
23Greenness.js will yield all .csv files needed for panel C of figure 1


Now on to the regressions to replicate the findings behind figures 3 and 4 -

30AllYieldAllWeatherMasterImgs.js will create a set of rasters appropriately stacked for the final analysis
Here, switching to the python GEE API is necessary to prevent browser issues created by launching a large number of tasks against the service.
31Stratified-sample-master.py is the relevant file to run. It may need to be rerun individually for any counties with 1-byte outputs or memory errors. 
Once the resulting files are local, 32Yield-fileprep.R is a necessary preprocessing step to get the yield files in order (e.g. get VPD in correct units)
4Yield-yearly-noFE.R is then needed to get yearly cover crop yield differences. 
5Yield-FE.R will output the .csv necessary to replicate the cover crop effects by year findings. 

Finally, once the scripts from this section (30* onward) are run, rerun each with the second crop (corn vs soy). 