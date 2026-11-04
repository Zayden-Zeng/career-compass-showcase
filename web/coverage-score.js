/* One course has at most one point to share across its mapped directions. */
(function(root){
  'use strict';
  function calculate(courses,axes){
    const counts=axes.map(()=>0);
    for(const code of new Set(courses)){
      const weights=axes.map(axis=>Math.max(0,Number(axis[code])||0));
      const sum=weights.reduce((a,b)=>a+b,0),budget=Math.max(0,...weights);
      if(!sum)continue;
      weights.forEach((w,i)=>{counts[i]+=budget*w/sum;});
    }
    const capped=counts.map(n=>Math.min(3,n));
    const total=capped.reduce((a,b)=>a+b,0);
    return {counts:capped,total};
  }
  function level(total,thresholds){return thresholds.filter(n=>total+1e-9>=n).length;}
  function format(n){return String(Math.floor((n+1e-9)*100)/100);}
  root.CompassCoverage={calculate,level,format};
})(typeof window!=='undefined'?window:globalThis);
