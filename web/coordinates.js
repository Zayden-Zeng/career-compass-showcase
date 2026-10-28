(() => {
  'use strict';
  function wgs84ToGcj02([longitude,latitude]) {
    if(longitude<72.004||longitude>137.8347||latitude<0.8293||latitude>55.8271)return [longitude,latitude];
    const horizontal=longitude-105,vertical=latitude-35;
    const sine=Math.sin,pi=Math.PI;
    const shared=(20*sine(6*horizontal*pi)+20*sine(2*horizontal*pi))*2/3;
    let latitudeShift=-100+2*horizontal+3*vertical+0.2*vertical*vertical+0.1*horizontal*vertical+0.2*Math.sqrt(Math.abs(horizontal))+shared;
    latitudeShift+=(20*sine(vertical*pi)+40*sine(vertical*pi/3))*2/3;
    latitudeShift+=(160*sine(vertical*pi/12)+320*sine(vertical*pi/30))*2/3;
    let longitudeShift=300+horizontal+2*vertical+0.1*horizontal*horizontal+0.1*horizontal*vertical+0.1*Math.sqrt(Math.abs(horizontal))+shared;
    longitudeShift+=(20*sine(horizontal*pi)+40*sine(horizontal*pi/3))*2/3;
    longitudeShift+=(150*sine(horizontal*pi/12)+300*sine(horizontal*pi/30))*2/3;
    const radians=latitude*pi/180;
    const eccentricity=0.006693421622965943;
    const denominator=1-eccentricity*sine(radians)**2;
    latitudeShift=latitudeShift*180/((6378245*(1-eccentricity))/(denominator*Math.sqrt(denominator))*pi);
    longitudeShift=longitudeShift*180/(6378245/Math.sqrt(denominator)*Math.cos(radians)*pi);
    return [longitude+longitudeShift,latitude+latitudeShift];
  }
  function withinArea(point,area){
    if(!area)return true;
    if(!point.every(Number.isFinite))return false;
    const [lon,lat]=area.coordinate;
    const east=(point[0]-lon)*111.32*Math.cos(lat*Math.PI/180);
    const north=(point[1]-lat)*111.32;
    return Math.hypot(east,north)<=area.radiusKm;
  }
  window.COMPASS_COORDINATES={wgs84ToGcj02,withinArea};
})();
