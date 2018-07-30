##bife package may help here!

libs <- c("plyr", "data.table", "dplyr", 'ggplot2', 'randomForest', 'readr', 'lfe')
lapply(libs, require, character.only = TRUE)

years <- c(2008:2015)
crop <- 'cornlong'

#Translate SCYM units to Mg/ha
if( length(grep("*corn*", crop))==1){
  biomass = .45
}else{
  biomass = 1
}
setwd(paste0('~/Desktop/cover-crop/Yields/',crop))

allcrop <- list.files(full.names = TRUE) %>% 
  lapply(function(i){as.data.frame(fread(i))}) %>% 
  bind_rows

#Make ids for pixels
allcrop$pid = paste0(allcrop$pixel, allcrop$fname)

summary(as.factor(allcrop$ci3))

#Remove non-considered categories
allcrop$ci3[which(allcrop$ci3==2)] <- NA
allcrop$ci3[which(allcrop$ci3==1)] <- NA


allcrop$ci <- as.factor(allcrop$ci) 
allcrop$ci3 <- as.factor(allcrop$ci3)

#Very brittle way of retrieving the statename from the filename
if( length(grep("*corn*", crop))==1){
  allcrop$state<-as.numeric(substr(allcrop$fname, 28, 29))
}else{
  allcrop$state<-as.numeric(substr(allcrop$fname, 27, 28))
}

yieldFW <- felm( yield ~ ci+ year+
                   prcp_early+prcp_end+prcp_mid+prcp_preplant+
                   tmax_early+tmax_end+tmax_mid+tmax_preplant+
                   tmin_early+ tmin_end+ tmin_mid+tmin_preplant+
                   vpd_early+vpd_end+vpd_mid+vpd_preplant
                   | pid, data=allcrop) 

summary(yieldFW)

rm(yieldFW)

yieldFW <- felm( yield ~ ci3+ year+
                   prcp_early+prcp_end+prcp_mid+prcp_preplant+
                   tmax_early+tmax_end+tmax_mid+tmax_preplant+
                   tmin_early+ tmin_end+ tmin_mid+tmin_preplant+
                   vpd_early+vpd_end+vpd_mid+vpd_preplant
                 | pid, data=allcrop) 

summary(yieldFW)

rm(yieldFW)

#head(allcrop)
stateeffects <- as.data.frame(cbind(state=unique(allcrop$state), 
                                   effect = rep(NA, length(unique(allcrop$state))), se = rep(NA, length(unique(allcrop$state))), p = rep(NA, length(unique(allcrop$state))),
                                   effect3 = rep(NA, length(unique(allcrop$state))), se3 = rep(NA, length(unique(allcrop$state))),p3 = rep(NA, length(unique(allcrop$state))),
                                   effect5 = rep(NA, length(unique(allcrop$state))), se5 = rep(NA, length(unique(allcrop$state)), p5 = rep(NA, length(unique(allcrop$state)))
                                   )))
states <- unique(allcrop$state)

for(j in 1:length(states)){
  state = states[j]
  allcropsub <- allcrop[which(allcrop$state==state),]
  print(dim(allcropsub))
  yieldFW <- felm( yield ~ ci+year+
                     prcp_early+prcp_end+prcp_mid+prcp_preplant+
                     tmax_early+tmax_end+tmax_mid+tmax_preplant+
                     tmin_early+ tmin_end+ tmin_mid+tmin_preplant+
                     vpd_early+vpd_end+vpd_mid+vpd_preplant| pid, data=allcropsub) 
  stateeffects$effect[j] <- yieldFW$coefficients[1]
  stateeffects$se[j] <-yieldFW$se[1]
  stateeffects$p[j] <-summary(yieldFW)$coefficients[2,4]
  print(summary(yieldFW))
  print(attributes(yieldFW$coefficients)[[2]][[1]][1])
} 

#repeat for 3 year effect
for(j in 1:length(states)){
  state = states[j]
  allcropsub <- allcrop[which(allcrop$state==state),]
  print(dim(allcropsub))
  yieldFW <- felm( yield ~ ci3+year+
                     prcp_early+prcp_end+prcp_mid+prcp_preplant+
                     tmax_early+tmax_end+tmax_mid+tmax_preplant+
                     tmin_early+ tmin_end+ tmin_mid+tmin_preplant+
                     vpd_early+vpd_end+vpd_mid+vpd_preplant| pid, data=allcropsub) 
  stateeffects$effect3[j] <- yieldFW$coefficients[1]
  stateeffects$se3[j] <-yieldFW$se[1]
  stateeffects$p3[j] <-summary(yieldFW)$coefficients[2,4]
  print(summary(yieldFW))
  print(attributes(yieldFW$coefficients)[[2]][[1]][1])
} 

stateeffects$effect<- (stateeffects$effect/100)*biomass
stateeffects$se <- (stateeffects$effect/100)*biomass
stateeffects$effect3<- (stateeffects$effect3/100)*biomass
stateeffects$se3 <- (stateeffects$effect3/100)*biomass

setwd(paste0('~/Desktop/cover-crop/Yields/'))
write.csv(stateeffects, paste0("effectsbystateyear", crop), row.names = F)
