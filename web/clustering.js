/* Cluster visually adjacent points within a district without altering office coordinates. */
(() => {
  'use strict';
  function screenDistance(a,b,unit){return Math.hypot(a.x-b.x,a.y-b.y)/unit;}
  function cluster(points,unit=1,nearby=false){
    unit=Math.max(Number.EPSILON,unit);
    const groups=[];
    const sorted=[...points].sort((a,b)=>a.key.localeCompare(b.key));
    for(const point of sorted){
      let group=groups.find(g=>g.points.some(p=>p.key===point.key));
      if(!group&&nearby){
        let nearest=Infinity;
        for(const candidate of groups){
          if(candidate.points.some(p=>p.district!==point.district||screenDistance(p,point,unit)>58))continue;
          const distance=screenDistance({x:candidate.x/candidate.points.length,y:candidate.y/candidate.points.length},point,unit);
          if(distance<=32&&distance<nearest){group=candidate;nearest=distance;}
        }
      }
      if(!group){group={x:0,y:0,points:[],companies:[]};groups.push(group);}
      group.points.push(point);group.x+=point.x;group.y+=point.y;
      for(const company of point.companies){
        if(!group.companies.some(existing=>existing.id===company.id))group.companies.push(company);
      }
    }
    return groups.map(g=>({...g,x:g.x/g.points.length,y:g.y/g.points.length,key:g.points.map(p=>p.key).join('|')}));
  }
  window.COMPASS_CLUSTERING={cluster};
})();
