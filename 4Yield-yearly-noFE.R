libs <- c("plyr", "data.table", "dplyr", 'ggplot2', 'randomForest', 'readr')
lapply(libs, require, character.only = TRUE)

years <- c(2008:2015)
crop <- 'soylong'

#Translating from SCYM units to Mg/ha
if( length(grep("*corn*", crop))==1){
  buMGha = 15.93
  biomass = .45
}else{
  buMGha = 14.87
  biomass = 1
}

setwd(paste0('~/Desktop/cover-crop/Yields/',crop))

allcrop <- list.files(full.names = TRUE) %>% 
  lapply(function(i){as.data.frame(fread(i))}) %>% 
  bind_rows

#Overall LM
ofa=formula(paste0("yield~ci+ year + 
                           prcp_early+prcp_end+prcp_mid+prcp_preplant+
                           tmax_early+tmax_end+tmax_mid+tmax_preplant+
                           tmin_early+tmin_end+tmin_mid+tmin_preplant+
                           vpd_early+vpd_end+vpd_mid+vpd_preplant+rootznaws+nccpi2cs"))

cclm <-  lm(ofa, data = allcrop)
summary(cclm)

cceffect <- as.data.frame(cbind(Year = years, coefs = rep(NA, length(years)), sters = rep(NA, length(years))))

for (i in 1:length(years)){
  year = years[i]
  allcropsub <- allcrop[which(allcrop$year==year),]
  cropyear <- subset(allcropsub, !is.na(allcropsub$yield))
  if( length(grep("*corn*", crop))==1){
    formula=formula(paste0("yield~C",year,"+prcp_early+prcp_end+prcp_mid+prcp_preplant+
                           tmax_early+tmax_end+tmax_mid+tmax_preplant+tmin_early+tmin_end+tmin_mid+tmin_preplant+
                           vpd_early+vpd_end+vpd_mid+vpd_preplant+rootznaws+nccpi2cs"))
  }else{
    formula=formula(paste0("yield~C",year,"+prcp_early+prcp_end+prcp_mid+prcp_preplant+
                           tmax_early+tmax_end+tmax_mid+tmax_preplant+tmin_early+tmin_end+tmin_mid+tmin_preplant+
                           vpd_early+vpd_end+vpd_mid+vpd_preplant+rootznaws+nccpi2cs"))
  }
  cclm <-  lm(formula, data = cropyear)
  cceffect$coefs[i] <-cclm$coefficients[2]
  cceffect$sters[i]<- summary(cclm)$coefficients[2,2]
  print(year)
  print(summary(cclm))
}

cceffect$coefs <- (cceffect$coefs/100)*biomass #*buMGha #switch units as needed
cceffect$sters <- (cceffect$sters/100)*biomass #*buMGha

setwd(paste0('~/Desktop/cover-crop/Yields/'))
write.csv(cceffect, paste0("noFEcceffectsbystateyear", crop), row.names = F)

##Get info for NCCPI plot
livar = "ci"
quantvar = 'nccpi2cs'

allcropsmallqua = allcrop %>%
  mutate(quantile = ntile( nccpi2cs , 10)) %>%
  group_by(quantile) %>%
  summarise(ccprob = mean(as.numeric(ci), na.rm=T))

write.csv(allcropsmallqua, paste0("CCbyNCCPIquantile", crop), row.names = F)

#plot likliehood
quaplot <- ggplot(allcropsmallqua, aes(x=quantile, y=ccprob)) +
  geom_point()
quaplot 

#lm of the same
nclm<-lm(nccpi2cs~ci, data = allcrop)
summary(nclm)
