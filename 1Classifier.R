libs <- c("plyr", "data.table", "dplyr", 'ggplot2', 'readr', 'randomForest', 'ROCR', 'tidyr', 'caret', 'DMwR')
lapply(libs, require, character.only = TRUE)

date='18nov18’

setwd(paste0("~/Desktop/cover-crop/Classifier/",date))

df <- list.files(full.names = TRUE) %>% 
    lapply(read_csv) %>% 
    bind_rows 

df$cover<-as.factor(df$cover)

#MODIS norms need to be put on proper scale
df$MODISnormNDVI <- df$NDVI-df$MODISnorm*.0001 
df$MODISnormNDVI_1 <- df$NDVI_1-df$MODISnorm_1*.0001 
df$MODISnormNDVI_2 <- df$NDVI_2-df$MODISnorm_2*.0001 

#Add unique field identifier
ok <- unite(df, "field_id", c("org", "bname", "bsid"), sep="_")
df$field_id <- ok$field_id
rm(ok)

##Stratify by field, whole df
sampled<-df
set.seed(101)

fieldlist <- unique(df$field_id)
samples <- fieldlist[sample(NROW(fieldlist), NROW(fieldlist) * .8)]

data.train <- sampled[which(sampled$field_id %in% samples), ]
data.test <- sampled[which(!(sampled$field_id %in% samples)), ]


drops <- c("system:index", ".geo", "aream", "fips","system.index",
           "AGRICDOY","AGRICDOY_1","AGRICDOY_2", "b1",
           "bname","bsid","cfmask" ,"cfmask_conf" )
data.train <- data.train[ , !(names(data.train) %in% drops)]
data.test <- data.test[ , !(names(data.test) %in% drops)]

#Write test and train sets
setwd("~/Desktop/cover-crop/Classifier/")
write.csv(data.train, paste0("training",date,".csv"), row.names=F)
write.csv(data.test, paste0("test",date,".csv"), row.names=F)


model.train <- randomForest(cover~ 
                              NIR + GREEN +  SWIR1 + 
                              GDD + GDD_1 +GDD_2 +
                              NDVI + NDVI_1 + NDVI_2 + NDVI_4 +
                              MODISnormNDVI + MODISnormNDVI_1 + MODISnormNDVI_2, 
                              ntree=128, nodesize=5, data=data.train)  
#b1 (GDDs) removed for target leakage
#AGRICDOY + AGRICDOY_1 + AGRICDOY_2 + removed due to results dependent on path/row
#oneimage (does only one image exist) removed, but numimages(NDVI_4) stays
#BLUE + RED + SWIR2 + removed due to overfit

varImpPlot(model.train, nvar=12, type=1)
varImpPlot(model.train, type=2)

preds <- predict(model.train, data.test) 
predsdf <- cbind(data.test, as.data.frame(preds))

predsdf$correct <- 0
predsdf$correct[which(predsdf$preds==predsdf$cover)] <- 1

length(which(predsdf$correct==1))/length(predsdf$correct)

fpfn <- predsdf %>%
  group_by(cover)%>%
  summarise(n=n(), errorpct = sum(correct==0)/n(), actuals=sum(as.numeric(cover)-1), predicted=sum(as.numeric(preds)-1))
fpfn 
