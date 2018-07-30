#make files for yield and yield FE regressions
libs <- c("plyr", "data.table", "dplyr", 'ggplot2', 'randomForest', 'readr')
lapply(libs, require, character.only = TRUE)

crop <-'corn'

setwd(paste0('~/Desktop/cover-crop/Yields/',crop))

getvpd = function(x){
  tmin=x[1]
  tmax=x[2]
  vp=x[3]
  tday = .725*tmax+.275*tmin
  #old degrees kelvin version
  #vp=exp(-0.000188/tday-13.1-.015*tday+8e-07*tday^2-1.69e-11*tday^3+6.456*log(tday))
  tf = tday*1.8+32
  tday = tf+459.67
  #Uses rankine scale and churns out psi, so it goes
  vps=exp(-1.044e4/tday-11.29-2.7e-2*tday+1.289e-5*tday^2-2.478e-9*tday^3+6.456*log(tday))
  vpd = vps*6894.76 - vp # convert to Pa and subtract vp
  vpd
}

makearrdf <- function(df){
  arrdf <- as.data.frame(cbind(pixel = NA,   year = NA, ci=NA, ci3=NA,ci5=NA,
                               C2007 = NA,C2008 = NA,C2009 = NA,C2010 = NA,C2011 = NA,
                               C2012 = NA,C2013 = NA,C2014 = NA,C2015 = NA,
                               prcp_early = NA , prcp_end = NA , prcp_mid = NA ,prcp_preplant = NA ,
                               tmax_early = NA ,tmax_end = NA ,tmax_mid = NA ,tmax_preplant = NA ,
                               tmin_early = NA ,tmin_end = NA ,tmin_mid = NA ,tmin_preplant = NA,
                               vp_early = NA ,vp_end = NA ,vp_mid = NA ,vp_preplant = NA,
                               yield=NA, mukey=NA, fname = NA))
                              #vpd_early = NA ,vpd_end = NA ,vpd_mid = NA ,vpd_preplant = NA ,rootznaws = NA ,nccpi2cs"))
  years <- c(2008:2015)
  for (i in 1:length(years)){
    year = years[i]
    covercode = paste0("C",year-1)
    ci <- df[,grep(covercode, names(df))]
    df$ci3 <- rep(NA, length(row.names(df)))
    if (year>=2010){
      covercodem1 = paste0("C",year-2)
      covercodem2 = paste0("C",year-3)
      df$ci3 = rowSums(cbind(df[,grep(covercode, names(df))] , df[,grep(covercodem1, names(df))] ,  df[,grep(covercodem2, names(df))]), na.rm=T)
    }
    df$ci5 <- rep(NA, length(row.names(df)))
    if (year>=2012){
      covercodem1 = paste0("C",year-2)
      covercodem2 = paste0("C",year-3)
      covercodem3 = paste0("C",year-4)
      covercodem4 = paste0("C",year-5)
      df$ci5 = rowSums(cbind(df[,grep(covercode, names(df))], df[,grep(covercodem1, names(df))], df[,grep(covercodem2, names(df))],
                df[,grep(covercodem3, names(df))], df[,grep(covercodem4, names(df))]), na.rm=T)
    }
    cc <- df[,grep("C1*", names(df))]
    yearcode = paste0("*",year)
    gg <- df[,grep(yearcode, names(df))][-1]
    yeardf <- cbind(pixel=row.names(gg), year= rep(year, length(row.names(gg))), 
                    ci,df$ci3, df$ci5, cc, gg, df$mukey, df$filen)
    names(yeardf)<-names(arrdf)
    arrdf <- rbind(arrdf, yeardf)
  }
  arrdf <- arrdf[-1,]

arrdf
}

soil <- as.data.frame(fread("../VALU_ALL.txt", check.names = TRUE))
soilsub <- as.data.frame(cbind(mukey = soil$mukey, rootznaws = soil$rootznaws, nccpi2cs = soil$nccpi2cs))

files = list.files()
for (i in 1:length(files)){
  if (!file.exists(paste0("../",crop,"long/",files[i]))){
    fname = files[i]
    data2 = as.data.frame(fread(fname))  
    data2 = cbind(data2, filen = rep(fname, dim(data2)[1]))
    allcrop <- makearrdf(data2)
    preplant = cbind(allcrop$tmin_preplant, allcrop$tmax_preplant ,allcrop$vp_preplant)
    allcrop$vpd_preplant=apply(preplant,1, getvpd)
    early = cbind(allcrop$tmin_early, allcrop$tmax_early ,allcrop$vp_early)
    allcrop$vpd_early=apply(early,1, getvpd)
    mid = cbind(allcrop$tmin_mid, allcrop$tmax_mid ,allcrop$vp_mid)
    allcrop$vpd_mid=apply(mid,1, getvpd)
    end = cbind(allcrop$tmin_end, allcrop$tmax_end ,allcrop$vp_end)
    allcrop$vpd_end=apply(end,1, getvpd)
    rm(preplant,early,mid,end)
    allcrop<-join(allcrop,soilsub, type='left')
    write.csv(allcrop, paste0("../",crop,"long/",files[i]), row.names = F)
  }
}

