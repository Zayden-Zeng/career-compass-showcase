/* Career Compass: a dependency-free, browser-local exploration prototype.
   Only independently sourced, verified coordinates may be plotted. */
(() => {
  'use strict';
  const sourceData = window.COMPASS_DATA;
  const bankPreview=window.COMPASS_BANK_PREVIEW;
  for(const company of bankPreview?.companies||[]){
    const index=sourceData.companies.findIndex(c=>c.id===company.id);
    if(index<0)sourceData.companies.push(company);else sourceData.companies[index]=company;
  }
  for(const company of sourceData.companies)for(const role of company.roles||[]){
    if(bankPreview?.translations?.[role.uid])role.title.en=bankPreview.translations[role.uid];
  }
  const heldCompanies=bankPreview?.review?.excluded||sourceData.preview_review?.excluded||{};
  // Reviewed map fields are exported from the same data.json. The location-only
  // snapshot also refreshes previews whose Python process predates the review.
  for(const company of sourceData.companies){
    const reviewed=window.COMPASS_VERIFIED_LOCATIONS?.[company.id];
    if(reviewed)for(const key of ['map_location','offices','location_precision','location_review'])company[key]=reviewed[key];
  }
  // Verified offices remain explorable even while individual roles await review.
  const data = {...sourceData,companies:sourceData.companies.filter(company=>Array.isArray(company.roles)&&!heldCompanies[company.id])};
  const logos = window.COMPASS_LOGOS || {};
  const geo = window.SHANGHAI_GEO;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const locales=window.COMPASS_I18N;
  // Coursework opens in English; language switches apply to the current visit.
  let language='en';
  const translated=values=>Array.isArray(values)?(values[locales.languages.indexOf(language)]||values[1]||values[0]||''):(values||'');
  const t=(key,values={})=>String(translated(locales.messages[key])||key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
  const localized=values=>typeof values==='string'?values:(values?.[language]||values?.en||values?.zh||'');
  const districtName=name=>translated(locales.districts[name])||name||t('locationUnspecified');
  const companyName=company=>language==='zh'?company.name:(language==='ar'?company.arabic||company.english||company.name:company.english||company.name);
  const skillName=skill=>localized(data.skill_labels?.[skill]||skill);
  const categoryName=id=>translated(locales.categories[id])||id;
  const experienceName=id=>translated(locales.experiences[id])||t('experienceUnknown');
  const latin=value=>`<bdi dir="ltr">${esc(value)}</bdi>`;
  const paths = {
    content: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>',
    commerce: '<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2m-7 5h8"/>',
    gaming: '<path d="M8 7h8c3 0 5 11 2 11l-4-3h-4l-4 3C3 18 5 7 8 7Z"/><path d="M7 11h4m-2-2v4m7-2h.01m2 2h.01"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/>',
    mobility: '<path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"/>',
    robotics: '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M2 11v5m20-5v5M9 16h6M8 11h1m6 0h1"/><circle cx="12" cy="3" r="1"/>',
    telecom: '<path d="M12 14v7m-4 0h8M5 16a10 10 0 0 1 0-12m14 12a10 10 0 0 0 0-12M8 13a5 5 0 0 1 0-6m8 6a5 5 0 0 0 0-6"/><circle cx="12" cy="10" r="2"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-1-10 6 6 0 0 1 11-1 5 5 0 0 1 1 11H7Z"/><path d="m10 11-2 2 2 2m4-4 2 2-2 2"/>'
  };
  const categories = {
    content:{name:'内容与社交',color:'#b579a0',bg:'#f5eaf1'},
    commerce:{name:'电商与服务',color:'#bb923f',bg:'#f6efdd'},
    gaming:{name:'游戏与娱乐',color:'#8a82bd',bg:'#eeebf7'},
    chip:{name:'芯片与计算',color:'#74944c',bg:'#eef3e3'},
    mobility:{name:'智能汽车',color:'#b96d61',bg:'#f7eae4'},
    robotics:{name:'机器人与AI',color:'#5f9c99',bg:'#e6f2ee'},
    telecom:{name:'通信与研发',color:'#b18463',bg:'#f4ede5'},
    cloud:{name:'云与软件',color:'#6a8dae',bg:'#e9eff6'},
    fusion:{name:'可控核聚变',color:'#8e6ca9',bg:'#f0eaf6'},
    manufacturing:{name:'高端制造',color:'#617f91',bg:'#eaf0f4'},
    health:{name:'医疗生物',color:'#a96e80',bg:'#f6eaf0'},
    finance:{name:'金融科技',color:'#8c8058',bg:'#f4f0e4'},
    energy:{name:'新能源',color:'#668944',bg:'#edf4e3'}
  };
  for(const id of ['fusion','manufacturing','health','finance','energy'])paths[id]=paths[id==='manufacturing'?'robotics':id==='finance'?'commerce':id==='health'?'content':'mobility'];
  const overviewView = [120,10,800,790];
  const state = {entered:false,district:null,zone:null,company:null,category:'all',query:'',internOnly:false,view:[...overviewView],role:null,dialog:null,catalogKind:'districts',catalogQuery:'',catalogReturn:false,mastered:{}};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = $('#city-map');
  const NS = 'http://www.w3.org/2000/svg';
  const features = new Map();
  let animation = 0, toastTimer, zoomMoving=false, zoomSettleTimer=0;
  let saved = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem('compass.saved.v1') || '[]');
    if (Array.isArray(raw)) saved = new Set(raw.filter(uid => typeof uid === 'string' && data.companies.some(c => c.roles.some(r => r.uid === uid))));
  } catch (_) { /* Browsing remains usable when local storage is unavailable. */ }

  function logoMeta(company) {
    const base=logos[company.id]||{};
    return {...base,...(base.variants?.[language]||base.variants?.en||{})};
  }
  function companyLogoSource(company) {
    const meta=logoMeta(company);
    if(meta.mode==='generated'||meta.source==='generated monogram')return '';
    return meta.src||'';
  }
  function logoBackground(company) {
    const meta=logoMeta(company);
    const value=meta.background||meta.bg||'#fff';
    return /^(#[0-9a-f]{3,8}|[a-z]+)$/i.test(value)?value:'#fff';
  }
    function logoHue(company) {
    const key=String(company.id||company.name||'');
    let h=0;for(let i=0;i<key.length;i++)h=(h*31+key.charCodeAt(i))%360;
    return h;
  }
  function monogramText(company) {
    const latin=String(company.english||company.name||'').trim();
    const words=latin.split(/\s+/).filter(Boolean);
    if(words.length>=2)return words.slice(0,2).map(w=>w[0]).join('').toUpperCase();
    if(latin.length>=2)return latin.slice(0,2).toUpperCase();
    return String(companyName(company)).slice(0,2);
  }
  function unavailableLogo() {
    return `<span class="company-logo logo-unavailable" title="${t('logoUnavailable')}" aria-label="${t('logoUnavailable')}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8b9990" stroke-width="1.4" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5"/></svg></span>`;
  }
  document.addEventListener('error',event=>{if(event.target.matches?.('.logo-img'))event.target.closest('.company-logo').outerHTML=unavailableLogo();},true);
  // Fit unclassified marks within the circular safe area without cropping their corners.
  document.addEventListener('load',event=>{
    const img=event.target;if(!img.matches?.('.logo-img[data-auto-fit]')||!img.naturalWidth||!img.naturalHeight)return;
    const ratio=Math.min(img.naturalWidth,img.naturalHeight)/Math.max(img.naturalWidth,img.naturalHeight);
    const size=Math.min(0.9,0.96/Math.sqrt(1+ratio*ratio));
    img.style.width=(size*100).toFixed(1)+'%';img.style.height=(size*100).toFixed(1)+'%';
  },true);
  function companyLogo(company) {
    const src=companyLogoSource(company);
    if(src){
      const meta=logoMeta(company);
      const cover=meta.mode==='solid';
      const pct=Math.round((meta.scale||0.88)*100);
      const zoomCss=meta.zoom&&meta.zoom>1.001?(';transform:scale('+meta.zoom+')'):'';
      const imgClass='logo-img';
      const zoomAttr=cover?' style="width:100%;height:100%;object-fit:cover"'
        :(' style="width:'+pct+'%;height:'+pct+'%;object-fit:contain'+zoomCss+'"');
      return `<span class="company-logo ${company.roles.length?'has-role-records':'entry-only'}${meta.round?' round':''}${cover?' logo-cover':''}" style="background:${esc(logoBackground(company))}" aria-hidden="true"><img class="${imgClass}" ${!cover&&!meta.scale&&!meta.zoom?'data-auto-fit="true"':''} src="${esc(src)}" alt="" decoding="async"${zoomAttr}></span>`;
    }
    return unavailableLogo();
  }
  function allDistrictCompanies(name) { return data.companies.filter(c => c.district===name); }
  function companySearchText(c) {
    return [c.name,c.english,c.arabic,...(c.id==='red'?['Red Note','Xiaohongshu']:[]),...(locales.districts[c.district]||[]),...Object.values(c.area_i18n||{}),...(locales.categories[c.category]||[]),...(c.zones||[]).map(z=>z==='lingang'?t('lingang'):z)].join(' ').toLowerCase();
  }
  function matchesRole(c,r) {
    const text=[companySearchText(c),...Object.values(r.title||{}),localized(r.location),...(r.skills||[]),...(r.skills||[]).map(skillName)].join(' ').toLowerCase();
    return !state.query || text.includes(state.query.toLowerCase());
  }
  function visibleRoles(c) { return c.roles.filter(r => matchesRole(c,r) && (!state.internOnly || ['intern','graduate'].includes((r.experience||{}).type))); }
  function visibleCompanies() {
    return data.companies.filter(c => (!selectedArea || (c.offices?.length?c.offices:[c.map_location]).some(o=>o&&window.COMPASS_COORDINATES.withinArea([o.lon,o.lat],selectedArea))) && (!state.district || c.district===state.district) && (!state.zone || (c.zones||[]).includes(state.zone)) && (state.category==='all' || c.category===state.category) && (!state.internOnly || visibleRoles(c).length) && (!state.query || visibleRoles(c).length || companySearchText(c).includes(state.query.toLowerCase())));
  }
  function toast(message) {
    clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').hidden=false;
    toastTimer=setTimeout(()=>{$('#toast').hidden=true;},2600);
  }
  function saveBookmarks() {
    $('#saved-count').textContent=saved.size;
    try {localStorage.setItem('compass.saved.v1',JSON.stringify([...saved]));return true;}
    catch (_) {toast(t('storageWarning'));return false;}
  }
  function updateSavedCount() { $('#saved-count').textContent=saved.size; }

  // Mercator projection, normalized once to a stable SVG coordinate space.
  const mercator=([lon,lat]) => [lon*Math.PI/180,-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
  const ringsOf = feature => feature.geometry.type==='MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
  const rawPoints=geo.features.flatMap(f=>ringsOf(f).flatMap(p=>p.flatMap(r=>r.map(mercator))));
  const minX=Math.min(...rawPoints.map(p=>p[0])),maxX=Math.max(...rawPoints.map(p=>p[0]));
  const minY=Math.min(...rawPoints.map(p=>p[1])),maxY=Math.max(...rawPoints.map(p=>p[1]));
  const scale=Math.min(850/(maxX-minX),650/(maxY-minY));
  const offsetX=(1000-(maxX-minX)*scale)/2,offsetY=(760-(maxY-minY)*scale)/2;
  const project=coord=>{const [x,y]=mercator(coord);return [(x-minX)*scale+offsetX,(y-minY)*scale+offsetY];};
  const projectWgs84=coord=>project(window.COMPASS_COORDINATES.wgs84ToGcj02(coord));
  const bounds = points => {
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  };
  function insideRing([x,y], ring) {
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const [xi,yi]=ring[i],[xj,yj]=ring[j];
      if(((yi>y)!==(yj>y)) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
    }
    return inside;
  }
  function insideFeature(pt, feature) {
    return feature.polygons.some(poly=>insideRing(pt,poly[0])&&!poly.slice(1).some(r=>insideRing(pt,r)));
  }
  function element(tag,attrs={}) {
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
    return el;
  }
  // Find room for each name inside its own district, including narrow central districts.
  function fitDistrictLabel(feature, widthRatio, heightRatio) {
    const [left,top,right,bottom]=feature.bounds;
    let best={x:feature.center[0],y:feature.center[1],size:0,score:0};
    const fits=(x,y,size)=>{
      const w=widthRatio*size/2,h=heightRatio*size/2;
      for(let row=0;row<=2;row++)for(let col=0;col<=2;col++){
        if(!insideFeature([x-w+w*col,y-h+h*row],feature))return false;
      }
      return true;
    };
    const consider=(x,y)=>{
      if(!insideFeature([x,y],feature))return;
      let low=0,high=Math.min((right-left)/widthRatio,(bottom-top)/heightRatio);
      for(let i=0;i<10;i++){const mid=(low+high)/2;if(fits(x,y,mid))low=mid;else high=mid;}
      // Prefer central placements where similarly sized labels fit.
      const score=low/(1+.12*Math.hypot(x-feature.center[0],y-feature.center[1])/Math.max(right-left,bottom-top));
      if(score>best.score)best={x,y,size:low*.94,score};
    };
    consider(...feature.center);
    for(let row=1;row<10;row++)for(let col=1;col<10;col++)consider(left+(right-left)*col/10,top+(bottom-top)*row/10);
    return best;
  }
  const physicalCoast=window.SHANGHAI_OSM.mainlandCoast;
  const coastStart=physicalCoast[0],coastEnd=physicalCoast[physicalCoast.length-1];
  const seaRing=[...physicalCoast,[124,coastEnd[1]],[124,29],[coastStart[0],29],coastStart];
  const seaCutout='M'+seaRing.map(projectWgs84).map(point=>point.join(',')).join('L')+'Z';
  const physicalLandClip=element('clipPath',{id:'physical-land-clip',clipPathUnits:'userSpaceOnUse'});
  physicalLandClip.append(element('path',{d:'M-4000,-4000H4000V4000H-4000Z '+seaCutout,'clip-rule':'evenodd','fill-rule':'evenodd'}));
  svg.querySelector('defs').append(physicalLandClip);
  for(const raw of geo.features) {
    const name=raw.properties.name;
    const polygons=ringsOf(raw).map(poly=>poly.map(ring=>ring.map(project)));
    const feature={name,polygons,center:project(raw.properties.centroid||raw.properties.center),bounds:bounds(polygons.flat(2))};
    const path=element('path',{d:polygons.flatMap(poly=>poly.map(ring=>'M'+ring.map(p=>p.map(v=>v.toFixed(2)).join(',')).join('L')+'Z')).join(''),class:'district'+(allDistrictCompanies(name).length?' has-data':''),'data-district':name,role:'button',tabindex:'0','aria-label':`${name}，${allDistrictCompanies(name).reduce((n,c)=>n+c.roles.length,0)}个项目岗位`, 'fill-rule':'evenodd'});
    const title=element('title');title.textContent=name;path.append(title);
    if(name!=='崇明区')path.setAttribute('clip-path','url(#physical-land-clip)');
    path.addEventListener('click',()=>toggleDistrict(name));
    path.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleDistrict(name);}});
    path.addEventListener('pointermove',event=>showTooltip(districtName(name),event));
    path.addEventListener('pointerleave',()=>{$('#map-tooltip').hidden=true;});
    path.addEventListener('focus',()=>{const stage=$('#map-stage').getBoundingClientRect(),box=path.getBoundingClientRect();showTooltip(districtName(name),{clientX:box.x+box.width/2,clientY:Math.max(stage.top+30,box.y+box.height/2)});});
    path.addEventListener('blur',()=>{$('#map-tooltip').hidden=true;});
    feature.path=path;features.set(name,feature);$('#district-layer').append(path);
    const label=element('text',{class:'district-label'+(allDistrictCompanies(name).length?' active-label':''),'dominant-baseline':'middle'});
    label.textContent=districtName(name);feature.label=label;$('#label-layer').append(label);
    label.addEventListener('click',()=>toggleDistrict(name));

  }

  // Lingang planning schematic removed (user decision, 2026-10-27).
  const riverLabels=[];

  // Real neighbour province land, so the sea only shows east of the coastline.
  (function addNeighbourLand(){
    const nb=window.SHANGHAI_NEIGHBOURS;
    const districtLayerEl=document.getElementById('district-layer');
    if(!nb||!districtLayerEl||document.getElementById('land-layer'))return;
    const land=document.createElementNS('http://www.w3.org/2000/svg','g');
    land.setAttribute('id','land-layer');land.setAttribute('aria-hidden','true');
    districtLayerEl.parentNode.insertBefore(land,districtLayerEl);
    const svgEl=document.getElementById('city-map');
    let cut=1000;
    try{cut=project([121.52,31.0])[0];}catch(e){}
    if(svgEl&&!document.getElementById('neighbour-clip')){
      let defs=svgEl.querySelector('defs');
      if(!defs){defs=document.createElementNS('http://www.w3.org/2000/svg','defs');svgEl.insertBefore(defs,svgEl.firstChild);}
      const cp=document.createElementNS('http://www.w3.org/2000/svg','clipPath');cp.setAttribute('id','neighbour-clip');
      const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x','-4000');rect.setAttribute('y','-4000');rect.setAttribute('width',String(cut+4000));rect.setAttribute('height','8000');
      cp.appendChild(rect);defs.appendChild(cp);
    }
    const ringPath=ring=>ring.map((pt,i)=>{const p=project(pt);return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ')+' Z';
    const landGeo=window.SHANGHAI_LAND;
    if(landGeo&&landGeo.polys){
      landGeo.polys.forEach(ring=>{
        const d=ring.map((pt,i)=>{const p=projectWgs84(pt);return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ')+' Z';
        land.append(element('path',{d,class:'coast-land','clip-path':'url(#physical-land-clip)'}));
      });
    }
    const coastCoverage=element('clipPath',{id:'verified-coast-coverage',clipPathUnits:'userSpaceOnUse'});
    const coverageRing=[[coastStart[0],coastStart[1]],[124,coastStart[1]],[124,coastEnd[1]],[coastStart[0],coastEnd[1]]];
    coastCoverage.append(element('path',{d:'M'+coverageRing.map(projectWgs84).map(point=>point.join(',')).join('L')+'Z'}));
    svg.querySelector('defs').append(coastCoverage);
    const mainlandRing=[...physicalCoast,[119,coastEnd[1]],[119,coastStart[1]],coastStart];
    land.append(element('path',{d:'M'+mainlandRing.map(projectWgs84).map(point=>point.join(',')).join('L')+'Z',class:'coast-land verified-mainland','clip-path':'url(#verified-coast-coverage)'}));
    nb.features.forEach(f=>{
      const g=f.geometry;if(!g)return;
      let d='';
      if(g.type==='Polygon'){d=g.coordinates.map(ringPath).join(' ');}
      else if(g.type==='MultiPolygon'){d=g.coordinates.map(poly=>poly.map(ringPath).join(' ')).join(' ');}
      const path=element('path',{d,'class':'neighbour-land','clip-path':'url(#neighbour-clip)'});
      const t=element('title');t.textContent=f.properties&&f.properties.name?f.properties.name:'';path.append(t);
      land.append(path);
    });
  })();
  // OSM-derived real geometry: Xiaoyangshan island outline + Donghai Bridge line.
  (function addOsmGeography(){
    const osm=window.SHANGHAI_OSM;
    const districtLayerEl=document.getElementById('district-layer');
    if(!osm||!districtLayerEl||document.getElementById('osm-geo-layer'))return;
    const layer=document.createElementNS('http://www.w3.org/2000/svg','g');
    layer.setAttribute('id','osm-geo-layer');
    districtLayerEl.parentNode.insertBefore(layer,districtLayerEl);
    const ringPath=ring=>ring.map((pt,i)=>{const p=projectWgs84(pt);return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ')+' Z';
    (osm.islands||[]).forEach(isl=>{
      const d=(isl.rings||[]).map(ringPath).join(' ');
      const p=element('path',{d,class:'osm-island'});
      const t=element('title',{'data-island-name':isl.name});t.textContent=isl.name||'';p.append(t);
      layer.append(p);
    });
    if(osm.bridge&&osm.bridge.length>1){
      const pts=osm.bridge.map(projectWgs84);
      const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
      const path=element('path',{d,class:'osm-bridge'});
      const t=element('title');t.textContent='Donghai Bridge (OSM)';path.append(t);
      layer.append(path);
    }
  })();
  const mainRiverLayer=element('g',{id:'main-rivers-layer'});
  const shoreLayer=element('g',{id:'verified-shore-layer','pointer-events':'none'});
  shoreLayer.append(element('path',{d:'M'+physicalCoast.map(projectWgs84).map(point=>point.join(',')).join('L'),class:'verified-coastline'}));
  $('#lingang-layer').before(shoreLayer);
  for(const area of window.SHANGHAI_OSM.waterAreas){
    const surface='M'+area.rings[0].map(projectWgs84).map(point=>point.join(',')).join('L')+'Z';
    mainRiverLayer.append(element('path',{d:surface,class:'verified-river-surface','data-water-source':area.source_relation,'pointer-events':'none'}));
  }
  const riverLandClip=element('clipPath',{id:'river-land-clip',clipPathUnits:'userSpaceOnUse'});
  for(const feature of features.values())riverLandClip.append(element('path',{d:feature.path.getAttribute('d'),'fill-rule':'evenodd','clip-rule':'evenodd'}));
  svg.querySelector('defs').append(riverLandClip);
  $('#lingang-layer').before(mainRiverLayer);
  for(const river of window.MAIN_RIVERS){
    const group=element('g',{class:'river-hover main-river'});
    for(const [lineIndex,line] of river.lines.entries()){
      if(river.id==='huangpu'&&lineIndex===1)continue;
      const d='M'+line.map(projectWgs84).map(p=>p.join(',')).join('L');
      const coastClip=river.id==='dazhi'?{'clip-path':'url(#physical-land-clip)'}:river.id==='huangpu'?{'clip-path':'url(#river-land-clip)'}:{};
      group.append(element('path',{d,class:'main-river-line '+river.id+(river.class?' '+river.class:''),'pointer-events':'none',...coastClip}));
      group.append(element('path',{d,class:'river-hit','data-river':river.id,'aria-label':river.name,...coastClip}));
    }
    const p=project(river.id==='huangpu'?[121.53,31.28]:[121.40,31.25]);
    const label=element('text',{x:p[0],y:p[1],class:'river-hover-label','text-anchor':'middle'});label.textContent=river.name;group.append(label);riverLabels.push(label);mainRiverLayer.append(group);
  }
  const riverTip=document.createElement('div');
  riverTip.className='river-floating-label';riverTip.hidden=true;
  $('#map-stage').append(riverTip);
  function showRiverTip(event){
    const hit=event.target.closest('.river-hit');
    if(!hit){riverTip.hidden=true;return;}
    $('#map-tooltip').hidden=true;
    riverTip.textContent=hit.getAttribute('aria-label');riverTip.hidden=false;
    const box=$('#map-stage').getBoundingClientRect();
    riverTip.style.left=Math.max(8,Math.min(box.width-riverTip.offsetWidth-8,event.clientX-box.left+14))+'px';
    riverTip.style.top=Math.max(8,event.clientY-box.top-riverTip.offsetHeight-12)+'px';
  }
  svg.addEventListener('pointermove',showRiverTip);
  svg.addEventListener('pointerleave',()=>{riverTip.hidden=true;});
  svg.addEventListener('click',event=>{if(event.target.closest('.river-hit, #dishui-lake')){event.stopPropagation();showRiverTip(event);}});
  // Dishui Lake: geographic location and a circular, light-blue water surface.
  // Approximate centre; 2.5 km water-surface diameter per the Lingang authority.
  const dishuiCoordinate=[121.93989,30.898222];
  const dishuiAnchor=projectWgs84(dishuiCoordinate);
  const dishuiCenter=[...dishuiAnchor];
  const dishuiRadius=Math.abs(projectWgs84([dishuiCoordinate[0]+1.25/(111.32*Math.cos(dishuiCoordinate[1]*Math.PI/180)),dishuiCoordinate[1]])[0]-dishuiAnchor[0]);
  const dishuiLake=element('circle',{id:'dishui-lake',cx:dishuiCenter[0],cy:dishuiCenter[1],r:dishuiRadius,class:'dishui-lake',role:'button',tabindex:'0','aria-label':'Dishui Lake','aria-pressed':'false'});
  const lakeRipple=element('circle',{cx:dishuiCenter[0],cy:dishuiCenter[1],r:dishuiRadius*1.35,class:'lake-ripple'});
  const lakeRipple2=element('circle',{cx:dishuiCenter[0],cy:dishuiCenter[1],r:dishuiRadius*1.35,class:'lake-ripple lake-ripple-2'});
  const dishuiLabel=element('text',{x:dishuiCenter[0],y:dishuiCenter[1],class:'dishui-label','text-anchor':'middle','dominant-baseline':'central','aria-hidden':'true','font-size':dishuiRadius*.25,'textLength':dishuiRadius*1.52,'lengthAdjust':'spacingAndGlyphs'});
  dishuiLabel.textContent=localized({zh:'滴水湖',en:'Dishui Lake',ar:'بحيرة ديشوي'});
  $('#lake-layer').append(lakeRipple2,lakeRipple,dishuiLake,dishuiLabel);
  dishuiLake.addEventListener('pointerenter',()=>$('#lake-layer').classList.add('lake-active'));
  dishuiLake.addEventListener('pointerleave',()=>{$('#lake-layer').classList.remove('lake-active');riverTip.hidden=true;});
  dishuiLake.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();dishuiLake.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  // Each activation focuses the lake and starts a fresh display.
  dishuiLake.style.cursor='pointer';
  let lakeZoomed=false;
  dishuiLake.addEventListener('click',event=>{
    event.stopPropagation();
    lakeZoomed=true;
    const w=170,h=w*svg.clientHeight/svg.clientWidth;
    const mapRect=svg.getBoundingClientRect();
    const header=document.querySelector('.site-header');
    const headerRect=header?.getBoundingClientRect();
    const visibleLeft=Math.max(mapRect.left,0),visibleRight=Math.min(mapRect.right,window.innerWidth);
    const visibleTop=Math.max(mapRect.top,0,headerRect&&headerRect.bottom>0?headerRect.bottom:0);
    const visibleBottom=Math.min(mapRect.bottom,window.innerHeight);
    const screenX=visibleRight>visibleLeft?(visibleLeft+visibleRight)/2:(mapRect.left+mapRect.right)/2;
    const screenY=visibleBottom>visibleTop?(visibleTop+visibleBottom)/2:(mapRect.top+mapRect.bottom)/2;
    const unitsPerPixel=w/mapRect.width;
    const centerX=dishuiCenter[0]-(screenX-(mapRect.left+mapRect.right)/2)*unitsPerPixel;
    const centerY=dishuiCenter[1]-(screenY-(mapRect.top+mapRect.bottom)/2)*unitsPerPixel;
    animateView([centerX-w/2,centerY-h/2,w,h]);
    dishuiLake.setAttribute('aria-pressed','true');
    playFireworks();
  });
  let fwCanvas=null, fwRaf=0, fwParts=[];
  function cleanupFireworks(){
    if(fwRaf)cancelAnimationFrame(fwRaf), fwRaf=0;
    fwParts=[]; fwCanvas&&fwCanvas.remove(); fwCanvas=null;
  }
  function playFireworks(){
    cleanupFireworks();
    const stage=document.getElementById('map-stage'); if(!stage)return;
    const canvas=document.createElement('canvas');
    canvas.className='fireworks-canvas';canvas.width=320;canvas.height=320;
    stage.appendChild(canvas);fwCanvas=canvas;
    const ctx=canvas.getContext('2d');
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const palette=['#ffbb16','#53bceb','#f55b55','#ffdb5f','#ffffff'];
    // A gentle opening leads into a rapid, shimmering gold finale.
    const bursts=[
      {x:160,y:145,at:0,kind:'ring',colors:['#ffd774','#fff5cd']},
      {x:125,y:165,at:900,kind:'flower',colors:['#ffd774','#ffa959']},
      {x:205,y:145,at:1800,kind:'flower',colors:['#65d9ff','#77a9ff','#ffffff']},
      {x:140,y:125,at:2700,kind:'ring',colors:['#ff84b5','#ffa9d2']},
      {x:185,y:175,at:3500,kind:'willow',colors:['#ffbf48','#ffe997']},
      {x:115,y:150,at:4400,kind:'flower',colors:['#a693ff','#61d6e5']},
      {x:205,y:135,at:5200,kind:'ring',colors:['#ff6b83','#ffd071']},
      {x:145,y:165,at:6000,kind:'willow',colors:['#83deed','#ffffff']},
      {x:190,y:135,at:6750,kind:'flower',colors:['#ff93c0','#ffd77b']}
    ];
    const gold=['#fff8d2','#ffe98b','#ffd23f','#ffb832'];
    const finalePoints=[[110,145],[208,135],[155,180],[140,108],[208,175],[100,175],[165,135],[222,120],[125,130],[190,165],[150,115],[175,150]];
    finalePoints.forEach(([x,y],i)=>bursts.push({x,y,at:7000+i*230,kind:'finale',colors:gold}));
    const start=performance.now(),duration=10000;
    const spawn=(burst)=>{
      const n=burst.kind==='finale'?54:burst.kind==='ring'?36:48;
      for(let i=0;i<n;i++){
        const angle=Math.PI*2*i/n+(Math.random()-.5)*(burst.kind==='ring'?.025:.12);
        const speed=burst.kind==='ring'?83:burst.kind==='finale'?68+Math.random()*45:58+Math.random()*43;
        fwParts.push({x:burst.x,y:burst.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
          born:burst.at,color:burst.colors[i%burst.colors.length],r:burst.kind==='ring'?2.8:2.5+Math.random()*1.5,
          kind:burst.kind,phase:Math.random()*6});
      }
    };
    const step=now=>{
      if(!fwCanvas)return;
      const t=now-start;
      if(t>=duration){cleanupFireworks();return;}
      // Geographic attachment: convert the lake centre and the local effect
      // radius to screen coordinates again on every frame, including zoom/pan.
      const matrix=svg.getScreenCTM();
      if(matrix){
        const point=svg.createSVGPoint();point.x=dishuiCenter[0];point.y=dishuiCenter[1];
        const center=point.matrixTransform(matrix);
        point.x=dishuiCenter[0]+dishuiRadius*5;
        const edge=point.matrixTransform(matrix);
        const radius=Math.hypot(edge.x-center.x,edge.y-center.y);
        const rect=stage.getBoundingClientRect();
        canvas.style.left=(center.x-rect.left-radius)+'px';canvas.style.top=(center.y-rect.top-radius)+'px';
        canvas.style.width=canvas.style.height=(radius*2)+'px';
      }
      ctx.clearRect(0,0,320,320);
      if(reduced){ctx.globalAlpha=.45;ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(160,160,18,0,Math.PI*2);ctx.fill();}
      else{
        for(const burst of bursts)if(t>=burst.at&&!burst.spawned){burst.spawned=true;spawn(burst);}
        fwParts=fwParts.filter(pt=>t-pt.born<1700);
        for(const pt of fwParts){
          const age=(t-pt.born)/1000,alpha=Math.max(0,1-age/1.7)*Math.min(1,(duration-t)/350);
          const x=pt.x+pt.vx*age,y=pt.y+pt.vy*age+(pt.kind==='willow'?38:18)*age*age;
          ctx.globalAlpha=alpha*.55;ctx.strokeStyle=pt.color;ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(x-pt.vx*.13,y-pt.vy*.13);ctx.lineTo(x,y);ctx.stroke();
          ctx.globalAlpha=alpha*(pt.kind==='finale'?.7+.3*Math.abs(Math.sin(age*12+pt.phase)):1);ctx.fillStyle=pt.color;ctx.beginPath();
          ctx.arc(x,y,pt.r,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.globalAlpha=1;fwRaf=requestAnimationFrame(step);
    };
    fwRaf=requestAnimationFrame(step);
  }

  // --- company hover: name on hover/focus, click still opens details ---
  // Hover is wired per pin in renderMarkers: it opens the same Galaxy as a click.


  // Trackpad pinch zoom (macOS sends ctrl+wheel for pinch gestures).
  // Zooms around the pointer, clamped to the city overview.
  function screenToView(clientX, clientY){
    const rect=svg.getBoundingClientRect();
    const [vx,vy,vw,vh]=state.view;
    const unit=1/Math.min(svg.clientWidth/vw, svg.clientHeight/vh);
    const offX=(svg.clientWidth-vw/unit)/2, offY=(svg.clientHeight-vh/unit)/2;
    return [vx+(clientX-rect.left-offX)*unit, vy+(clientY-rect.top-offY)*unit];
  }
  function zoomAt(clientX, clientY, factor){
    const [vx,vy,vw,vh]=state.view;
    const [px,py]=screenToView(clientX,clientY);
    const nw=Math.min(overviewView[2], Math.max(30, vw*factor));
    const nh=nw*vh/vw;
    const rx=(px-vx)/vw, ry=(py-vy)/vh;
    cancelAnimationFrame(animation);pendingView=null;
    beginGestureZoom();
    state.view=[px-rx*nw, py-ry*nh, nw, nh];
    applyView();
  }
  function beginGestureZoom(){
    zoomMoving=true;clearTimeout(zoomSettleTimer);
    zoomSettleTimer=setTimeout(()=>{zoomMoving=false;applyView();},160);
  }
  let wheelFrame=0;
  const mapStage=document.getElementById('map-stage');
  if(mapStage){
    mapStage.addEventListener('wheel', event=>{
      // Keep the page from scrolling while the pointer is over the map.
      event.preventDefault();
      if(typeof closePopover==='function')closePopover();
      const [vx,vy,vw,vh]=state.view;
      if(event.ctrlKey||event.metaKey){
        // Trackpad pinch: stronger per-event zoom than before.
        zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY*0.006));
        return;
      }
      // Two-finger scroll pans the map, in view units (constant on screen).
      const unitX=vw/svg.clientWidth, unitY=vh/svg.clientHeight;
      let nx=vx+event.deltaX*unitX*0.9, ny=vy+event.deltaY*unitY*0.9;
      const margin=0.15;
      nx=Math.min(1000-vw*0.25, Math.max(-vw*0.25, nx));
      ny=Math.min(760-vh*0.25, Math.max(-vh*0.25, ny));
      cancelAnimationFrame(animation);pendingView=null;beginGestureZoom();
      state.view=[nx,ny,vw,vh];
      if(!wheelFrame){wheelFrame=requestAnimationFrame(()=>{wheelFrame=0;applyView();});}
    }, {passive:false});
  }
  function lingangView(){
    return [...overviewView];
  }

  function showTooltip(name,event) {
    const stage=$('#map-stage').getBoundingClientRect(),companies=allDistrictCompanies(name),jobs=companies.reduce((n,c)=>n+c.roles.length,0);
    const tip=$('#map-tooltip');
    tip.innerHTML=`${esc(districtName(name))}<small>${jobs?`${t('companiesCount',{n:companies.length})} · ${t('rolesCount',{n:jobs})}`:t('noData')} · ${t('clickExplore')}</small>`;
    tip.hidden=false;
    tip.style.left=Math.max(8,Math.min(stage.width-tip.offsetWidth-8,event.clientX-stage.left+14))+'px';
    tip.style.top=Math.max(8,Math.min(stage.height-tip.offsetHeight-8,event.clientY-stage.top-70))+'px';
  }
  const employmentAreas = [{"zh": "张江", "en": "Zhangjiang", "coordinate": [121.610278, 31.207778], "radiusKm": 5}, {"zh": "金桥", "en": "Jinqiao", "coordinate": [121.61, 31.25], "radiusKm": 4}, {"zh": "外高桥", "en": "Waigaoqiao", "coordinate": [121.6, 31.34], "radiusKm": 6}, {"zh": "江湾—五角场", "en": "Jiangwan–Wujiaochang", "coordinate": [121.51, 31.31], "radiusKm": 4}, {"zh": "漕河泾", "en": "Caohejing", "coordinate": [121.4, 31.17], "radiusKm": 4}, {"zh": "徐汇滨江", "en": "West Bund", "coordinate": [121.46, 31.17], "radiusKm": 3}, {"zh": "紫竹", "en": "Zizhu", "coordinate": [121.45, 31.02], "radiusKm": 4}, {"zh": "市北高新", "en": "Shibei", "coordinate": [121.44, 31.29], "radiusKm": 3}, {"zh": "虹桥商务区", "en": "Hongqiao CBD", "coordinate": [121.31, 31.2], "radiusKm": 8}, {"zh": "虹桥临空", "en": "Hongqiao Linkong", "coordinate": [121.35, 31.23], "radiusKm": 4}, {"zh": "陆家嘴", "en": "Lujiazui", "coordinate": [121.51, 31.24], "radiusKm": 3}, {"zh": "北外滩", "en": "North Bund", "coordinate": [121.5, 31.25], "radiusKm": 3}, {"zh": "长阳创谷", "en": "Changyang Campus", "coordinate": [121.53, 31.28], "radiusKm": 4}, {"zh": "桃浦智创城", "en": "Taopu", "coordinate": [121.37, 31.28], "radiusKm": 4}, {"zh": "南大智慧城", "en": "Nanda", "coordinate": [121.36, 31.31], "radiusKm": 4}, {"zh": "嘉定汽车城（安亭）", "en": "Anting Auto City", "coordinate": [121.17, 31.29], "radiusKm": 8}, {"zh": "嘉定新城", "en": "Jiading New City", "coordinate": [121.26, 31.35], "radiusKm": 6}, {"zh": "松江G60科创走廊", "en": "Songjiang G60", "coordinate": [121.26, 31.07], "radiusKm": 16}, {"zh": "莘庄工业区", "en": "Xinzhuang Industrial", "coordinate": [121.38, 31.08], "radiusKm": 4}, {"zh": "青浦新城", "en": "Qingpu New City", "coordinate": [121.12, 31.15], "radiusKm": 7}, {"zh": "东方美谷（奉贤）", "en": "Oriental Beauty Valley", "coordinate": [121.49, 30.94], "radiusKm": 4}, {"zh": "滴水湖", "en": "Dishui Lake", "coordinate": [121.93, 30.9], "radiusKm": 6}, {"zh": "临港产业区", "en": "Lingang Industrial", "coordinate": [121.8, 30.88], "radiusKm": 12}, {"zh": "康桥", "en": "Kangqiao", "coordinate": [121.59, 31.14], "radiusKm": 4}, {"zh": "老静安", "en": "Old Jing’an", "coordinate": [121.451, 31.227], "radiusKm": 3}, {"zh": "静安寺", "en": "Jing’an Temple", "coordinate": [121.446, 31.223], "radiusKm": 2}, {"zh": "南京西路", "en": "West Nanjing Road", "coordinate": [121.461, 31.23], "radiusKm": 3}, {"zh": "前滩", "en": "Qiantan", "coordinate": [121.482, 31.155], "radiusKm": 3}, {"zh": "后滩", "en": "Houtan", "coordinate": [121.477, 31.177], "radiusKm": 3}, {"zh": "外滩金融带", "en": "Bund Financial Belt", "coordinate": [121.493, 31.23], "radiusKm": 4}, {"zh": "杨浦滨江", "en": "Yangpu Waterfront", "coordinate": [121.525, 31.263], "radiusKm": 4}, {"zh": "洋泾东外滩", "en": "Yangjing East Bund", "coordinate": [121.55, 31.249], "radiusKm": 4}, {"zh": "张江科学之门周边", "en": "Zhangjiang Science Gate Area", "coordinate": [121.615, 31.188], "radiusKm": 3}, {"zh": "张江机器人谷", "en": "Zhangjiang Robotics Valley", "coordinate": [121.61, 31.13], "radiusKm": 4}, {"zh": "滴水湖金融湾", "en": "Dishui Lake Financial Bay", "coordinate": [121.918, 30.891], "radiusKm": 3}, {"zh": "临港奉贤园区", "en": "Lingang Fengxian Park", "coordinate": [121.77, 30.87], "radiusKm": 10}, {"zh": "吴淞—宝山工业带", "en": "Wusong–Baoshan Industrial Belt", "coordinate": [121.469, 31.395], "radiusKm": 6}, {"zh": "长兴岛船舶产业基地", "en": "Changxing Shipbuilding Base", "coordinate": [121.75, 31.354], "radiusKm": 8}, {"zh": "虹口足球场—龙之梦", "en": "Hongkou Stadium–Dreams", "coordinate": [121.48, 31.271], "radiusKm": 3}];
  const areaLayer=element('g',{'id':'employment-area-layer','pointer-events':'none'});
  svg.append(areaLayer);
  let selectedArea=null;
  const areaLabels=employmentAreas.map(area=>{
    const group=element('g',area.zh==='滴水湖'?{class:'lake-area-label'}:{});
    const text=element('text',{'text-anchor':'middle',y:-10,fill:'#284f36','font-size':14,'font-weight':600,stroke:'#f9fbf6','stroke-width':5,'paint-order':'stroke'});
    group.append(text);areaLayer.append(group);
    return {area,group,text,point:project(area.coordinate)};
  });
  const areaControls=document.createElement('div');areaControls.className='area-search';
  areaControls.innerHTML='<span aria-hidden="true">⌕</span><input id="area-search" list="area-options" placeholder="Find an area" aria-label="Find an area"><datalist id="area-options">'+employmentAreas.map(a=>`<option value="${a.zh} / ${a.en}"></option>`).join('')+'</datalist><button id="area-clear" aria-label="清除片区" hidden>×</button>';
  $('.map-topline').after(areaControls);
  $('#area-search').addEventListener('input',event=>{
    const query=event.target.value.trim().toLowerCase();
    const area=employmentAreas.find(a=>[a.zh,a.en,a.zh+' / '+a.en].some(v=>v.toLowerCase()===query));
    if(!query){resetMap();return;}
    if(!area)return;
    selectedArea=area;$('#area-clear').hidden=false;
    const point=project(area.coordinate);
    state.district=null;state.zone=null;state.company=null;$('#district-select').value='';
    updateMapState();renderMarkers();renderPanel();
    const radius=area.radiusKm;
    const east=project([area.coordinate[0]+radius/(111.32*Math.cos(area.coordinate[1]*Math.PI/180)),area.coordinate[1]]);
    const north=project([area.coordinate[0],area.coordinate[1]+radius/111.32]);
    const aspect=svg.clientWidth/svg.clientHeight;
    const width=Math.max(Math.abs(east[0]-point[0])*2,Math.abs(north[1]-point[1])*2*aspect)*1.15,height=width/aspect;
    animateView([point[0]-width/2,point[1]-height/2,width,height]);
  });
  $('#area-clear').onclick=()=>resetMap();
  // District labels compete for space in the dense central cluster. At city
  // scale we keep the roomiest / data-bearing labels and hide the ones that
  // would overlap; hidden names still appear in the hover tooltip.
  function resolveDistrictLabelCollisions() {
    const items = [];
    for (const f of features.values()) {
      const label = f.label;
      if (!label || label.style.display === 'none') continue;
      let box;
      try { box = label.getBBox(); } catch (_) { continue; }
      const m = (label.getAttribute('transform') || '').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
      if (!m) continue;
      items.push({ f, x: Number(m[1]) + box.x, y: Number(m[2]) + box.y, w: box.width, h: box.height });
    }
    const score = it => [
      state.district === it.f.name ? 0 : 1,
      allDistrictCompanies(it.f.name).length ? 0 : 1,
      -(it.w * it.h),
    ];
    items.sort((a, b) => {
      const ra = score(a), rb = score(b);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
      return 0;
    });
    const placed = [];
    for (const it of items) {
      const pad = 2;
      const hit = placed.some(p => it.x < p.x + p.w + pad && it.x + it.w + pad > p.x && it.y < p.y + p.h + pad && it.y + it.h + pad > p.y);
      if (hit) it.f.label.style.display = 'none';
      else placed.push(it);
    }
  }
  function applyView() {
    const frameStart=performance.now();
    if (!svg.clientWidth || !svg.clientHeight) return;
    svg.setAttribute('viewBox',state.view.join(' '));
    const unit=1/Math.min(svg.clientWidth/state.view[2],svg.clientHeight/state.view[3]);
    const offsetX=(svg.clientWidth-state.view[2]/unit)/2,offsetY=(svg.clientHeight-state.view[3]/unit)/2;
    const toScreen=([x,y])=>[(x-state.view[0])/unit+offsetX,(y-state.view[1])/unit+offsetY];
    for(const item of areaLabels){
      item.group.style.display=!state.district&&item.area===selectedArea?'':'none';
      item.text.textContent=language==='zh'?item.area.zh:item.area.en;
      item.group.setAttribute('transform',`translate(${item.point[0]},${item.point[1]}) scale(${unit})`);
    }
    for(const f of features.values()) {
      const center=toScreen(f.center);
      const show=state.district?f.name===state.district:center[0]>=0&&center[0]<=svg.clientWidth&&center[1]>=0&&center[1]<=svg.clientHeight;
      if(!show||state.district){f.label.style.display='none';continue;}
      // Hold the collision decisions while the map moves; resolve once it settles.
      if(zoomMoving&&f.label.style.display==='none')continue;
      f.label.style.display='';
      const text=districtName(f.name);
      f.label.setAttribute('class','district-label'+(state.district===f.name?' selected-label':allDistrictCompanies(f.name).length?' active-label':''));
      f.layouts ||= new Map();
      if(!f.layouts.has(text)){
        f.label.textContent=text;
        f.label.style.writingMode='horizontal-tb';
        f.label.style.fontSize='10px';
        let box=f.label.getBBox();
        let layout={...fitDistrictLabel(f,box.width/10+.3,box.height/10+.3),vertical:false};
        
        f.layouts.set(text,layout);
      }
      const layout=f.layouts.get(text),size=Math.max(9.5*unit,Math.min(layout.size,(state.district?18:15)*unit));
      if(f.label.textContent!==text)f.label.textContent=text;
      f.label.style.writingMode='horizontal-tb';
      f.label.style.textOrientation='mixed';
      f.label.style.fontSize=size+'px';
      const box=f.label.getBBox();
      f.label.setAttribute('transform',`translate(${layout.x-box.x-box.width/2},${layout.y-box.y-box.height/2})`);
    }
    if(!state.district&&!zoomMoving)resolveDistrictLabelCollisions();
    $('#lake-layer').style.opacity=state.district&&state.district!=='浦东新区'?'.2':'1';
    $('#lake-layer').classList.toggle('lake-overview-hint',!state.district&&!state.zone&&state.view[2]>=overviewView[2]*.98);

    for(const el of $('#marker-layer').querySelectorAll('.company-pin')){el.setAttribute('transform',`translate(${el.dataset.x},${el.dataset.y}) scale(${unit})`);}
    for(const el of $('#marker-layer').querySelectorAll('.star-orb')){el.setAttribute('transform',`translate(${el.dataset.x},${el.dataset.y}) scale(${unit})`);}
    layoutCompanyMarkers(unit);
    const pins=Array.from($('#marker-layer').querySelectorAll('.company-marker-pin'));
    for(const el of pins){
      el.classList.toggle('selected-company',!!state.company&&el.dataset.companyIds.split(',').includes(state.company));
      el.setAttribute('transform',`translate(${el.dataset.x},${el.dataset.y}) scale(${unit})`);

    }
    for(const el of $('#marker-layer').querySelectorAll('.area-cluster')){
      el.setAttribute('transform',`translate(${el.dataset.x},${el.dataset.y}) scale(${unit})`);
    }
    for(const label of riverLabels){label.style.fontSize=9*unit+'px';label.setAttribute('dy',-8*unit);}
    const markers=[...$('#marker-layer').querySelectorAll('.company-marker')];
    const layout=separateMarkers(markers.map(marker=>({x:(Number(marker.dataset.x)-state.view[0])/unit+offsetX,y:(Number(marker.dataset.y)-state.view[1])/unit+offsetY,width:Number(marker.dataset.labelWidth)})),svg.clientWidth,svg.clientHeight);
    markers.forEach((marker,i)=>{
      const point=layout[i],x=state.view[0]+(point.x-offsetX)*unit,y=state.view[1]+(point.y-offsetY)*unit;
      marker.setAttribute('transform',`translate(${x},${y}) scale(${unit})`);
      const dx=(Number(marker.dataset.x)-x)/unit,dy=(Number(marker.dataset.y)-y)/unit;
      const guide=marker.querySelector('.marker-guide'),dot=marker.querySelector('.location-dot');
      guide.setAttribute('d',`M0,-13L${dx},${dy}`);dot.setAttribute('cx',dx);dot.setAttribute('cy',dy);
      guide.style.display=dot.style.display=Math.hypot(dx,dy)>15?'':'none';
    });
    const duration=performance.now()-frameStart;
    svg.dataset.renderMs=duration.toFixed(2);
    svg.dataset.maxRenderMs=Math.max(Number(svg.dataset.maxRenderMs||0),duration).toFixed(2);
  }
  function separateMarkers(items,width,height) {
    const points=items.map(item=>({...item}));
    const clamp=point=>{point.x=Math.max(point.width/2+10,Math.min(width-point.width/2-10,point.x));point.y=Math.max(58,Math.min(height-85,point.y));};
    points.forEach(clamp);
    for(let step=0;step<50;step++) {
      let moved=false;
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++) {
        const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y;
        const overlapX=(a.width+b.width)/2+10-Math.abs(dx),overlapY=87-Math.abs(dy);
        if(overlapX>0&&overlapY>0){
          if(overlapX<overlapY){const push=(overlapX+.5)/2*(dx>=0?1:-1);a.x-=push;b.x+=push;}
          else{const push=(overlapY+.5)/2*(dy>=0?1:-1);a.y-=push;b.y+=push;}
          clamp(a);clamp(b);moved=true;
        }
      }
      if(!moved)break;
    }
    return points;
  }
  let pendingView = null;
  function animateView(target) {
    pendingView = [...target];
    clearTimeout(zoomSettleTimer);zoomMoving=true;
    cancelAnimationFrame(animation);const start=[...state.view],time=performance.now();
    function frame(now) {
      const progress=reducedMotion?1:Math.min((now-time)/580,1),ease=1-Math.pow(1-progress,3);
      state.view=start.map((v,i)=>v+(target[i]-v)*ease);
      if(progress>=1){zoomMoving=false;pendingView=null;}
      applyView();
      if(progress<1) animation=requestAnimationFrame(frame);
    }
    animation=requestAnimationFrame(frame);
  }
  function districtView(name) {
    const feature=features.get(name);
    const aspect=svg.clientWidth/svg.clientHeight||1.35;
    const pts=[];
    for(const company of data.companies){
      if(company.district!==name) continue;
      const loc=company.map_location;
      if(loc&&typeof loc.lat==='number'&&typeof loc.lon==='number') pts.push(project([loc.lon,loc.lat]));
    }
    let x1,y1,x2,y2;
    if(pts.length>=2){
      x1=Math.min.apply(null,pts.map(p=>p[0])); x2=Math.max.apply(null,pts.map(p=>p[0]));
      y1=Math.min.apply(null,pts.map(p=>p[1])); y2=Math.max.apply(null,pts.map(p=>p[1]));
    }else if(feature&&feature.bounds){
      [x1,y1,x2,y2]=feature.bounds;
    }else{
      return [...overviewView];
    }
    let w=Math.max((x2-x1)*1.45,(y2-y1)*aspect*1.45, overviewView[2]*0.22);
    w=Math.min(w, overviewView[2]);
    const h=w/aspect;
    return [(x1+x2)/2-w/2,(y1+y2)/2-h/2,w,h];
  }
  // These clusters indicate documented area affiliation, never an office coordinate.
  const areaDistricts=['浦东新区','浦东新区','浦东新区','杨浦区','徐汇区','徐汇区','闵行区','静安区','闵行区','长宁区','浦东新区','虹口区','杨浦区','普陀区','宝山区','嘉定区','嘉定区','松江区','闵行区','青浦区','奉贤区','浦东新区','浦东新区','浦东新区'];
  function companyArea(company,areas){
    const text=company.area||'';
    return areas.find(a=>text.includes(a.zh.split(/[／（—]/)[0])) ||
      (text.includes('金科路')?areas.find(a=>a.zh==='张江'):null) ||
      (text.includes('临港')?areas.find(a=>a.zh==='临港产业区'):null);
  }
  // Real-coordinate company pins (OpenStreetMap geocoding).
  function renderCompanyPins(list) {
    const layer=$('#marker-layer');
    for (const company of list) {
      const loc=company.map_location;
      if(!loc||typeof loc.lat!=='number'||typeof loc.lon!=='number')continue;
      const pt=project([loc.lon,loc.lat]);
      const pin=element('g',{class:'company-pin','data-x':pt[0],'data-y':pt[1],role:'button',tabindex:'0','aria-label':companyName(company)});
      pin.append(element('circle',{r:4.6,class:'pin-dot'}));
      pin.append(element('circle',{r:11,fill:'transparent',class:'pin-hit'}));
      const title=element('title');title.textContent=companyName(company)+(loc.display_name?' · '+loc.display_name:'');pin.append(title);
      pin.addEventListener('click',event=>{event.stopPropagation();selectCompany(company.id);});
      pin.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCompany(company.id);}});
      layer.append(pin);
    }
  }
  // ---- Star-field rendering: every company becomes a small celestial body ----
  function openFromMap(id) {
    const company=data.companies.find(c=>c.id===id);
    if(!company) return;
    if(company.district && features.has(company.district) && state.district!==company.district && !state.zone && !selectedArea){
      selectDistrict(company.district);
    }
    state.company=id;
    renderMarkers(); renderPanel();
    if(innerWidth<821) $('.results-panel').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
  }
  function starOrb(company, x, y, opts) {
    opts = opts || {};
    const beamH = opts.beam ? 30 : 0;
    const g = element('g',{'class':'star-orb','data-x':x,'data-y':y,tabindex:'0',role:'button','aria-label':companyName(company)});
    if (beamH) { g.append(element('polygon',{points:'0,0 -9,'+(-beamH)+' 9,'+(-beamH),'class':'star-cone'})); g.append(element('circle',{r:2.2,'class':'star-anchor'})); }
    const body = element('g',{'class':'star-body',transform:'translate(0,'+(-beamH)+')'});
    body.append(element('circle',{r:21,fill:'none','class':'star-ring'}));
    body.append(element('circle',{r:20,'class':'star-halo'}));
    const core=element('circle',{r:11,'class':'star-core'});core.style.fill=logoBackground(company);body.append(core);
    const logo = companyLogoSource(company);
    if (logo) { const img=element('image',{href:logo,x:-9.5,y:-9.5,width:19,height:19,preserveAspectRatio:'xMidYMid meet','class':'star-logo','pointer-events':'none'}); img.style.clipPath='circle(50%)'; body.append(img); }
    else { const mono=element('text',{'text-anchor':'middle',y:-1,'class':'star-mono'}); mono.textContent=monogramText(company); body.append(mono); }
    body.append(element('circle',{r:20,fill:'transparent','class':'star-hit'}));
    const title=element('title'); title.textContent=companyName(company)+(opts.office&&opts.office.name?' · '+opts.office.name:'')+(opts.office&&opts.office.address?' ('+opts.office.address+')':''); body.append(title);
    g.append(body);
    g.addEventListener('click',event=>{event.stopPropagation();openFromMap(company.id);});
    g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openFromMap(company.id);}});
    return g;
  }
  function renderStarField(companies, center) {
    const layer = $('#marker-layer');
    let count = 0;
    for (const company of companies) {
      const offices = (Array.isArray(company.offices) && company.offices.length)
        ? company.offices
        : (company.map_location && typeof company.map_location.lat === 'number' ? [company.map_location] : []);
      for (const office of offices) {
        if (typeof office.lat !== 'number' || typeof office.lon !== 'number') continue;
        const pt = project([office.lon, office.lat]);
        layer.append(starOrb(company, pt[0], pt[1], {beam:true, office}));
        count++;
      }
    }
    return count;
  }
  function renderAreaCluster(areaName, companies, point, spread) {
    const layer = $('#marker-layer');
    const group = element('g',{'class':'star-cluster'});
    const n = Math.max(companies.length, 1);
    companies.forEach((company,i)=>{
      const angle = (i/n)*Math.PI*2 - Math.PI/2;
      const rad = (spread||20) + 10*(i%3);
      group.append(starOrb(company, point[0]+Math.cos(angle)*rad, point[1]+Math.sin(angle)*rad, {beam:false}));
    });
    const label = element('text',{x:point[0],y:point[1]+(spread||20)+26,'class':'star-area-label'});
    label.textContent = areaName;
    layer.append(group); layer.append(label);
  }
  let markerHint=null;
  function hideMarkerHint(){if(markerHint){markerHint.remove();markerHint=null;}}
  function showMarkerHint(anchor, entries, heading=''){
    hideMarkerHint();
    const stage=document.getElementById('map-stage');if(!stage)return;
    const hint=document.createElement('div');hint.className='marker-hint';hint.setAttribute('aria-hidden','true');
    hint.dir=document.documentElement.dir;
    if(heading){const name=document.createElement('strong');name.className='marker-hint-name';name.textContent=heading;hint.append(name);}
    entries.forEach(({count,status})=>{
      const row=document.createElement('span');row.className='marker-hint-row '+status;
      const dot=document.createElement('i');dot.className='marker-hint-dot';row.append(dot);
      const label=document.createElement('span');label.textContent=(count==null?'':count+' · ')+t(status==='has-role-records'?'legendRoles':'legendEntry');row.append(label);hint.append(row);
    });
    stage.append(hint);markerHint=hint;
    const sr=stage.getBoundingClientRect(),ar=anchor.getBoundingClientRect(),hr=hint.getBoundingClientRect();
    // Keep the entire expanded orbit clear, including icons still animating in.
    const orbit=activeGalaxy?.getBoundingClientRect();
    const target=orbit||ar, gap=12;
    const bounds={left:target.left-sr.left,right:target.right-sr.left,top:target.top-sr.top,bottom:target.bottom-sr.top};
    const clamp=(v,max)=>Math.max(8,Math.min(v,max-8));
    const cx=(bounds.left+bounds.right)/2;
    const choices=[
      [cx-hr.width/2,bounds.bottom+gap],[cx-hr.width/2,bounds.top-hr.height-gap]
    ];
    const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    const obstacles=[...stage.querySelectorAll('.company-marker-pin')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left-sr.left,right:r.right-sr.left,top:r.top-sr.top,bottom:r.bottom-sr.top};});
    let best=null;
    for(const [x,y] of choices){
      const left=clamp(x,sr.width-hr.width),top=clamp(y,sr.height-hr.height);
      const rect={left,right:left+hr.width,top,bottom:top+hr.height};
      if(orbit&&overlap(rect,bounds)>0)continue;
      const score=obstacles.reduce((sum,obstacle)=>sum+overlap(rect,obstacle),0);
      if(!best||score<best.score)best={left,top,score};
    }
    if(!best){hideMarkerHint();return;}
    hint.style.left=best.left+'px';hint.style.top=best.top+'px';
  }
  let activeGalaxy=null, galaxyTimer=0, activeGalaxyDot=null;
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closePopover();cleanupFireworks();}});
  const cancelGalaxyHide=()=>{clearTimeout(galaxyTimer);galaxyTimer=0;};
  function closePopover(){hideMarkerHint();cancelGalaxyHide();activeGalaxyDot=null;if(activeGalaxy){if(activeGalaxy._onMove)document.removeEventListener('pointermove',activeGalaxy._onMove);activeGalaxy.remove();activeGalaxy=null;}}
  function scheduleGalaxyHide(delay=220){if(!galaxyTimer)galaxyTimer=setTimeout(()=>{galaxyTimer=0;closePopover();},delay);}
  function openPopover(cluster,dotEl){
    closePopover();
    activeGalaxyDot=dotEl;
    const stage=document.getElementById('map-stage');if(!stage)return;
    const srect=stage.getBoundingClientRect(),drect=dotEl.getBoundingClientRect();
    const cx=drect.left-srect.left+drect.width/2, cy=drect.top-srect.top+drect.height/2;
    const n=cluster.length;
    const shown=cluster.slice(0,14);
    const extra=Math.max(0,n-14);
    const count=shown.length+(extra?1:0);
    const dual=count>6;
    const radius=n===1?46:dual?58:70;
    const outerRadius=108;
    const box=((dual?outerRadius:radius)+26)*2;
    const wrap=document.createElement('div');
    wrap.className='galaxy'+(dual?' galaxy-dense':'');
    wrap.style.width=box+'px';wrap.style.height=box+'px';
    let left=cx-box/2, top=cy-box/2;
    left=Math.max(6,Math.min(left,srect.width-box-6));
    top=Math.max(6,Math.min(top,srect.height-box-6));
    wrap.style.left=left+'px';wrap.style.top=top+'px';
    const ring=document.createElement('div');ring.className='galaxy-orbit';
    if(n>1){ring.style.width=(radius*2)+'px';ring.style.height=(radius*2)+'px';ring.style.left=(box/2-radius)+'px';ring.style.top=(box/2-radius)+'px';}
    const glow=document.createElement('div');glow.className='galaxy-glow';
    glow.style.left=(box/2-22)+'px';glow.style.top=(box/2-22)+'px';
    wrap.appendChild(ring);wrap.appendChild(glow);
    if(dual){
      const outer=document.createElement('div');outer.className='galaxy-orbit';
      outer.style.width=outer.style.height=(outerRadius*2)+'px';
      outer.style.left=outer.style.top=(box/2-outerRadius)+'px';
      wrap.appendChild(outer);
    }
    const items=shown.map(co=>({co,label:companyName(co)}));
    const angles=[];
    const radii=[];
    for(let i=0;i<count;i++){
      radii.push(dual&&i>=6?outerRadius:radius);
      if(dual){
        const outer=i>=6, slots=outer?count-6:6;
        angles.push(-Math.PI/2+(outer?Math.PI/6:0)+(outer?i-6:i)*Math.PI*2/slots);
      }
      else if(count===1){angles.push(-Math.PI/2);}
      else if(n<=3){const step=Math.PI*0.55;angles.push(-Math.PI/2+(i-(count-1)/2)*(step/Math.max(count-1,1)));}
      else{angles.push(-Math.PI/2+i*(Math.PI*2/count));}
    }
    items.forEach((item,i)=>{
      const orb=document.createElement('button');orb.type='button';orb.className='galaxy-orb '+(item.co.roles.length?'has-role-records':'entry-only');
      orb.setAttribute('aria-label',item.label+' — '+t(item.co.roles.length?'legendRoles':'legendEntry'));
      const orbStatus=item.co.roles.length?'has-role-records':'entry-only';
      orb.addEventListener('pointerenter',()=>showMarkerHint(orb,[{status:orbStatus}],item.label));
      orb.addEventListener('pointerleave',hideMarkerHint);
      orb.addEventListener('focus',()=>showMarkerHint(orb,[{status:orbStatus}],item.label));
      orb.addEventListener('blur',hideMarkerHint);
      orb.style.backgroundColor=logoBackground(item.co);
      orb.innerHTML=companyLogo(item.co);
      const a=angles[i], x=Math.cos(a)*radii[i], y=Math.sin(a)*radii[i];
      orb.style.left=(box/2+x-22)+'px';
      orb.style.top=(box/2+y-22)+'px';
      orb.style.transitionDelay=Math.min(i*10,60)+'ms';
      orb.addEventListener('click',ev=>{ev.stopPropagation();openFromMap(item.co.id);closePopover();});
      wrap.appendChild(orb);
    });
    if(extra){
      const more=document.createElement('button');more.type='button';more.className='galaxy-more';
      const a=angles[count-1], x=Math.cos(a)*radii[count-1], y=Math.sin(a)*radii[count-1];
      more.style.left=(box/2+x-22)+'px';more.style.top=(box/2+y-22)+'px';
      more.textContent='+'+extra;
      more.addEventListener('click',ev=>{ev.stopPropagation();showGalaxyList(cluster.slice(14),wrap,box);});
      wrap.appendChild(more);
    }
    wrap.addEventListener('pointerover',event=>{if(event.target.closest('button'))cancelGalaxyHide();});
    wrap.addEventListener('pointerleave',()=>scheduleGalaxyHide());
    wrap.addEventListener('focusin',cancelGalaxyHide);
    wrap.addEventListener('focusout',event=>{if(!wrap.contains(event.relatedTarget))scheduleGalaxyHide();});
    // Close only when the pointer is genuinely away from the galaxy disc or
    // after clicking elsewhere; no animation-end timers.
    const onMove=ev=>{
      if(dotEl.contains(ev.target)){cancelGalaxyHide();return;}
      if(wrap.contains(ev.target)&&ev.target.closest('button')){cancelGalaxyHide();return;}
      scheduleGalaxyHide();
    };
    document.addEventListener('pointermove',onMove);
    wrap._onMove=onMove;
    wrap.addEventListener('click',ev=>{if(ev.target===wrap||ev.target===ring||ev.target===glow){ev.stopPropagation();closePopover();}});
    stage.appendChild(wrap);
    activeGalaxy=wrap;
    requestAnimationFrame(()=>wrap.classList.add('is-open'));
  }
  function showGalaxyList(list,wrap,box){
    const old=wrap.querySelector('.galaxy-list');if(old){old.remove();return;}
    const panel=document.createElement('div');
    panel.className='galaxy-list';
    list.forEach(co=>{
      const row=document.createElement('button');row.type='button';row.className='galaxy-row';
      row.innerHTML=companyLogo(co)+'<span>'+esc(companyName(co))+'</span>';
      row.addEventListener('click',ev=>{ev.stopPropagation();openFromMap(co.id);closePopover();});
      panel.appendChild(row);
    });
    panel.style.left=(box/2+60)+'px';panel.style.top=(box/2-20)+'px';
    wrap.appendChild(panel);
  }
    const geoDistrictCache=new Map();
  function pointInRing(lon,lat,ring){
    let c=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/((yj-yi)||1e-12)+xi))c=!c;
    }
    return c;
  }
  function geoDistrictOf(lon,lat){
    const key=lon.toFixed(4)+','+lat.toFixed(4);
    if(geoDistrictCache.has(key))return geoDistrictCache.get(key);
    let found='';
    for(const f of geo.features){
      const g=f.geometry;if(!g)continue;
      const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
      for(const poly of polys){
        if(!poly||!poly.length)continue;
        if(!pointInRing(lon,lat,poly[0]))continue;
        let hole=false;
        for(let k=1;k<poly.length;k++){if(pointInRing(lon,lat,poly[k])){hole=true;break;}}
        if(!hole){found=f.properties.name;break;}
      }
      if(found)break;
    }
    geoDistrictCache.set(key,found);
    return found;
  }
  function companyOfficeRenderable(company,office,selectedDistrict){
    if(!company||!office||!selectedDistrict||company.district!==selectedDistrict)return false;
    if(office.status==='unverified')return false;
    if(typeof office.lat!=='number'||typeof office.lon!=='number')return false;
    if(!Number.isFinite(office.lat)||!Number.isFinite(office.lon))return false;
    const review=company.location_review;
    if(review&&review.batch==='geo-2026-10-27-1'){
      const map=company.map_location||{};
      if(map.status!=='verified'||office.status!=='verified')return false;
      if(office.coordinate_system!=='GCJ-02')return false;
      if(office.district!==selectedDistrict)return false;
      if(map.lat!==office.lat||map.lon!==office.lon)return false;
      return geoDistrictOf(office.lon,office.lat)===selectedDistrict;
    }
    return true;
  }
  let markerRecords=[],markerLayoutKey='';
  function layoutCompanyMarkers(unit){
    if(zoomMoving&&markerLayoutKey)return;
    const groups=window.COMPASS_CLUSTERING.cluster(markerRecords,unit,!!state.district||!!selectedArea||state.view[2]<350);
    const signature=groups.map(group=>group.key).join(';');
    if(signature===markerLayoutKey)return;
    markerLayoutKey=signature;closePopover();
    const layer=$('#marker-layer');layer.replaceChildren();
    for(const h of groups){
      const cluster=h.companies;
      const g=element('g',{'class':'company-marker-pin','data-x':h.x,'data-y':h.y,tabindex:'0',role:'button','aria-label':cluster.map(companyName).join(', ')});
      g.setAttribute('data-company-ids',cluster.map(c=>c.id).join(','));
      const n=cluster.length,radius=n>1?(state.view[2]<350?Math.min(14,9+Math.sqrt(n)):Math.min(8,5+Math.sqrt(n)*.8)):2.6;
      const withRoles=cluster.filter(c=>c.roles.length>0).length;
      const entryOnly=n-withRoles,mixed=withRoles>0&&entryOnly>0;
      g.dataset.roleCompanies=withRoles;g.dataset.entryCompanies=entryOnly;
      const highlight=element('circle',{r:radius+5,'class':'company-focus-ring',fill:'none','pointer-events':'none'});g.append(highlight);
      const dot=element('circle',{r:radius,'class':'company-dot'+(n>1?' company-density-dot':'')});
      dot.style.fill=withRoles?'#285544':(n>1?'#1769cf':'#edf4f7');
      dot.style.stroke=withRoles?'#f8fbf6':'#1769cf';dot.style.strokeWidth=n>1?'1.2':'1.5';g.append(dot);
      if(mixed){
        const circumference=2*Math.PI*(radius+1.5);
        g.append(element('circle',{r:radius+1.5,fill:'none',stroke:'#1769cf','stroke-width':2}));
        g.append(element('circle',{r:radius+1.5,fill:'none',stroke:'#285544','stroke-width':2,
          'stroke-dasharray':`${circumference*withRoles/n} ${circumference}`,'transform':'rotate(-90)','pointer-events':'none'}));
      }
      g.append(element('circle',{r:Math.max(4,radius+1),fill:'transparent','class':'company-hit'}));
      g.setAttribute('aria-description',t('markerRecruitment',{roles:withRoles,entries:entryOnly}));
      const hintEntries=[];if(withRoles)hintEntries.push({count:withRoles,status:'has-role-records'});if(entryOnly)hintEntries.push({count:entryOnly,status:'entry-only'});
      if(n>1){
        const count=element('text',{x:0,y:3.8,'text-anchor':'middle','class':'cluster-count'});
        count.style.fontSize=state.view[2]<350?'10px':'8px';count.setAttribute('y',state.view[2]<350?'3.4':'2.8');count.textContent=n;g.append(count);
      }

      let hoverTimer=0;
      g.addEventListener('pointerenter',()=>{
        showMarkerHint(g,hintEntries);
        cancelGalaxyHide();
        clearTimeout(hoverTimer);
        hoverTimer=setTimeout(()=>{
          if(activeGalaxyDot!==g){activeGalaxyDot=g;openPopover(cluster,g);showMarkerHint(g,hintEntries);}
        },110);
      });
      g.addEventListener('pointerleave',()=>{hideMarkerHint();clearTimeout(hoverTimer);scheduleGalaxyHide();});
      g.addEventListener('focus',()=>{
        if(activeGalaxyDot!==g){activeGalaxyDot=g;openPopover(cluster,g);}
        showMarkerHint(g,hintEntries);
      });
      g.addEventListener('click',event=>{
        event.stopPropagation();clearTimeout(hoverTimer);
        if(activeGalaxyDot!==g){activeGalaxyDot=g;openPopover(cluster,g);}
      });
      g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openPopover(cluster,g);}});
      layer.append(g);
    }
  }
  function renderMarkers(){
    const layer=$('#marker-layer');layer.replaceChildren();
    closePopover();
    const companies=visibleCompanies();
    const cells={};
    const hits=[];
    const mapped=new Set();
    for(const company of companies){
      const offices=(Array.isArray(company.offices)&&company.offices.length)?company.offices:(company.map_location?[company.map_location]:[]);
      for(const office of offices){
        if(!companyOfficeRenderable(company,office,state.district||company.district))continue;
        if(selectedArea&&!window.COMPASS_COORDINATES.withinArea([office.lon,office.lat],selectedArea))continue;
        mapped.add(company.id);
        const pt=project([office.lon,office.lat]);
        // Share a pin only for the same coordinate (six decimal places).
        // Grid-based clustering previously moved other offices to the first pin.
        const key=office.lon.toFixed(6)+','+office.lat.toFixed(6);
        (cells[key]=cells[key]||[]).push(company);
        hits.push({pt,key,lon:office.lon,lat:office.lat,district:company.district});
      }
    }
    let coverage=$('#map-coverage');
    if(!coverage){coverage=document.createElement('div');coverage.id='map-coverage';coverage.className='map-coverage';$('.map-footer').after(coverage);}
    coverage.replaceChildren();
    const legend=document.createElement('div');legend.className='map-legend';legend.innerHTML=`<span><i class="legend-roles"></i>${t('legendRoles')}</span><span><i class="legend-entry"></i>${t('legendEntry')}</span><span><i class="legend-mixed"></i>${t('legendMixed')}</span>`;coverage.append(legend);
    const summary=document.createElement('p');summary.textContent=t('mapCoverage',{mapped:mapped.size,total:companies.length});coverage.append(summary);
    const missing=companies.filter(c=>!mapped.has(c.id));
    if(missing.length){
      const details=document.createElement('details'),heading=document.createElement('summary');heading.textContent=t('mapMissing',{n:missing.length});details.append(heading);
      const list=document.createElement('ul');
      for(const company of missing){const item=document.createElement('li');item.textContent=companyName(company)+' — '+t('mapPending_'+company.id);list.append(item);}
      details.append(list);coverage.append(details);
    }
    markerRecords=hits.map(hit=>({key:hit.key,x:hit.pt[0],y:hit.pt[1],lon:hit.lon,lat:hit.lat,district:hit.district,companies:[...new Set(cells[hit.key])]})).filter((p,i,all)=>all.findIndex(other=>other.key===p.key)===i);
    markerLayoutKey='';
    applyView();
  }
  function selectDistrict(name) {
    dishuiLake.setAttribute('aria-pressed','false');
    if(typeof closePopover==='function')closePopover();    if(typeof collapsePops==='function')collapsePops();    if(typeof lakeZoomed!=='undefined')lakeZoomed=false;
    selectedArea=null;
    if(!features.has(name))return;
    state.district=name;state.zone=null;state.company=null;
    $('#district-select').value=name;$('#map-tooltip').hidden=true;
    updateMapState();renderMarkers();renderPanel();animateView(districtView(name));
  }
  // Clicking the already-open district zooms back out to the city overview.
  function toggleDistrict(name) {
    if (state.district === name && !state.zone) { resetMap(); return; }
    selectDistrict(name);
  }
  function resetMap(clearFilters=false) {
    dishuiLake.setAttribute('aria-pressed','false');
    if(typeof closePopover==='function')closePopover();    if(typeof collapsePops==='function')collapsePops();    if(typeof lakeZoomed!=='undefined')lakeZoomed=false;
    selectedArea=null;$("#area-search").value="";$("#area-clear").hidden=true;
    state.district=null;state.zone=null;state.company=null;$('#district-select').value='';
    if(clearFilters){state.query='';state.category='all';$('#search').value='';$('#category').value='all';}
    updateMapState();renderMarkers();renderPanel();animateView([...overviewView]);
  }
  function selectZone(zone) {
    lakeZoomed=false;
    dishuiLake.setAttribute('aria-pressed','false');
    state.zone=zone;state.district=null;state.company=null;
    $('#district-select').value='zone:'+zone;$('#map-tooltip').hidden=true;
    updateMapState();renderMarkers();renderPanel();animateView(lingangView());
  }
  function updateMapState() {
    for(const f of features.values()) {
      f.path.classList.toggle('selected',f.name===state.district);
      f.path.classList.toggle('faded',!!state.district&&f.name!==state.district);
      f.path.setAttribute('aria-pressed',String(f.name===state.district));
      f.path.setAttribute('aria-label',t('districtAria',{district:districtName(f.name),n:allDistrictCompanies(f.name).reduce((n,c)=>n+c.roles.length,0)}));
      f.path.querySelector('title').textContent=districtName(f.name);
    }
    $('#map-stage').classList.toggle('is-zoomed',!!state.district);
    $('#map-stage').classList.toggle('lingang-selected',state.zone==='lingang');
    $('#lingang-layer').style.opacity=state.district&&!['浦东新区','奉贤区'].includes(state.district)?'.22':'1';
    const lingangFocusBtn=$('#lingang-focus');
    if(lingangFocusBtn)lingangFocusBtn.setAttribute('aria-pressed',String(state.zone==='lingang'));
    $('#breadcrumb-detail').textContent=selectedArea?'　/　'+(language==='zh'?selectedArea.zh:selectedArea.en):state.zone?'　/　'+t('lingang'):state.district?'　/　'+districtName(state.district):'';
    $('#map-hint').textContent=t(state.zone||state.district?'markerHint':'mapHint');
    $('.live-label').innerHTML=`<i></i> ${t(state.zone?'zoneView':state.district?'inDistrict':'enterDistrict')}`;
    $('#district-shortcuts').querySelectorAll('button').forEach(b=>{const selected=b.dataset.zone?b.dataset.zone===state.zone:b.dataset.district===state.district;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  }
  function selectCompany(id) {
    const company=data.companies.find(c=>c.id===id);if(!company)return;
    if(!state.zone&&!selectedArea&&state.district!==company.district)selectDistrict(company.district);
    state.company=id;renderPanel();
    const offices=company.offices?.length?company.offices:(company.map_location?[company.map_location]:[]);
    const office=offices.find(o=>companyOfficeRenderable(company,o,state.district||company.district)&&(!selectedArea||window.COMPASS_COORDINATES.withinArea([o.lon,o.lat],selectedArea)));
    if(office){
      const [x,y]=project([office.lon,office.lat]);
      const width=100,height=width/(svg.clientWidth/svg.clientHeight||1.35);
      animateView([x-width/2,y-height/2,width,height]);
    }
    if(innerWidth<821) $('.results-panel').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
  }
  function companyCard(company) {
    const c=categories[company.category]||categories.manufacturing,roles=visibleRoles(company);
    return `<button class="company-card" data-open-company="${esc(company.id)}" aria-label="${esc(t('viewCompany',{company:companyName(company),n:roles.length}))}" style="--cat:${c.color};--cat-bg:${c.bg}"><div class="company-card-top">${companyLogo(company)}<div><div class="company-name">${esc(companyName(company))}</div><div class="company-en">${latin(company.english||company.name)}</div></div><span class="company-arrow" aria-hidden="true">↗</span></div><div class="company-meta"><span class="category-tag">${categoryName(company.category)}</span><span>${districtName(company.district)}</span>${(company.zones||[]).includes('lingang')?`<span class="zone-tag">${t('lingang')}</span>`:''}<span>· ${t('rolesCount',{n:roles.length})}</span></div><div class="company-roles">${esc(roles.length?roles.slice(0,2).map(r=>localized(r.title)).join(' / '):t('noVerifiedRoles'))}</div></button>`;
  }
  const safeURL=value=>/^https?:\/\//.test(value||'')?value:null;
  const roleLocation=role=>localized(role.location)||t('locationUnspecified');
  const statusKey=role=>role.status==='listed_open'?'statusOpen':role.status==='closed'?'statusClosed':role.status==='historical'?'statusHistorical':'statusPublished';
  const statusBadge=role=>`<span class="verification-badge ${role.status==='listed_open'?'verified-open':'published'}">${t(statusKey(role))}</span>`;
  function sourceKind(role) {
    const keys={official_talent_pool:'sourceTalentPool',official_job_listing:'sourceListing',official_job_list:'sourceListing',official_careers:'sourceCareers',official_job_detail:'sourceDetail',employer_job_board:'sourceEmployerBoard',university_employer_posting:'sourceUniversity',university_recruitment:'sourceUniversity',recruitment_event:'sourceRecruitmentEvent'};
    return t(keys[role.source_type]||'sourceRecruitment');
  }
  function companyLinks(company) {
    const links=[[company.careers_url,'careersEntry'],[company.website,'companyWebsite'],[company.company_source_url,'companyEvidence']];
    return `<div class="company-links">${links.filter(([url])=>safeURL(url)).map(([url,label])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t(label)} ↗</a>`).join('')}</div>${company.careers_scope?`<p class="careers-scope">${esc(localized(company.careers_scope))}</p>`:''}`;
  }
  function roleEvidence(role,compact=false) {
    const verified=role.verified_date||role.recorded_date;
    return `<div class="role-evidence ${compact?'compact':''}">${statusBadge(role)}<span>${t('jobLocation')}: ${esc(roleLocation(role))}</span>${verified?`<span>${t('checkedDate')}: ${esc(verified)}</span>`:''}${role.posted_date?`<span>${t('postedDate')}: ${esc(role.posted_date)}</span>`:''}${compact?'':`<span>${t('sourceType')}: ${sourceKind(role)}</span>${role.job_id?`<span>${t('jobId')}: ${latin(role.job_id)}</span>`:''}`}</div>`;
  }
  function roleCard(company,role) {
    return `<button class="role-card" data-open-role="${esc(role.uid)}" aria-label="${esc(t('viewRole',{role:localized(role.title)}))}"><h3>${esc(localized(role.title))}</h3>${language==='en'||!role.title.en||role.title.en===localized(role.title)?'':`<p>${latin(role.title.en)}</p>`}${roleEvidence(role,true)}<div class="skill-tags">${role.skills.length?role.skills.slice(0,4).map(s=>`<span>${latin(skillName(s))}</span>`).join(''):`<span>${t('noSkills')}</span>`}${role.skills.length>4?`<span>${latin('+'+(role.skills.length-4))}</span>`:''}</div><div class="role-card-footer"><span>${experienceName(role.experience.type)}</span><span>${t('roleDetails')} ↗</span></div><p class="card-source">${sourceKind(role)} · ${t('sourceInDetails')}</p>${role.verification_note?`<p class="card-audit-note">${esc(localized(role.verification_note))}</p>`:''}</button>`;
  }
  function renderPanel() {
    const panel=$('#results-content');
    if(state.company) {
      const c=data.companies.find(c=>c.id===state.company);
      if(!c){state.company=null;return renderPanel();}
      const roles=visibleRoles(c);
      const backName=selectedArea?(language==='zh'?selectedArea.zh:selectedArea.en):state.zone?t('lingang'):districtName(c.district);
      panel.innerHTML=`<div class="panel-heading"><button class="panel-back" data-back-companies><span aria-hidden="true">${language==='ar'?'→':'←'}</span> ${t('backCompanies',{district:backName})}</button><div class="company-summary">${companyLogo(c)}<div><h2>${esc(companyName(c))}</h2><p>${latin(c.english||c.name)} · ${categoryName(c.category)}</p></div></div><div class="company-location">⌖ ${esc(localized(c.area_i18n)||c.area||districtName(c.district))}</div><p>${t('officeNote')}</p>${companyLinks(c)}${c.company_evidence?`<details class="company-evidence"><summary>${t('companyEvidence')}</summary><p>${esc(localized(c.company_evidence))}</p></details>`:''}</div><div class="panel-subheading"><span>${t('exploreRoles')}</span><b>${t('resultsCount',{n:roles.length})}</b></div><div class="company-list roles-list">${roles.map(r=>roleCard(c,r)).join('')||`<div class="empty-state"><h3>${t(c.roles.length?'noRoles':'noVerifiedRoles')}</h3><p>${t(c.roles.length?'tryFilter':'checkCareers')}</p>${safeURL(c.careers_url)?`<a class="primary-button" href="${esc(c.careers_url)}" target="_blank" rel="noopener noreferrer">${t('careersEntry')} ↗</a>`:''}</div>`}</div><div class="panel-tip"><b>${t('roleTipTitle')}</b><br>${t('roleTip')}</div>`;
      return;
    }
    const isOverview=!selectedArea&&!state.zone&&!state.district&&!state.query&&state.category==='all'&&!state.internOnly;
    const companies=visibleCompanies();
    if(isOverview){
      // Curated discovery order, not a claim about live popularity.
      const featured=['bytedance','bilibili','meituan','red','tencent','mihoyo','nvidia','huawei','tesla'];
      companies.sort((a,b)=>{const x=featured.indexOf(a.id),y=featured.indexOf(b.id);return (x<0?featured.length:x)-(y<0?featured.length:y);});
    }
    const roles=companies.reduce((n,c)=>n+visibleRoles(c).length,0),name=selectedArea?(language==='zh'?selectedArea.zh:selectedArea.en):state.zone?t('lingang'):state.district?districtName(state.district):t('city');
    const empty=state.district&&!allDistrictCompanies(state.district).length;
    const intro=selectedArea?t('neighbourhoodIntro',{radius:selectedArea.radiusKm}):state.zone?t('zoneNote'):state.district?(locales.descriptions[state.district]?translated(locales.descriptions[state.district]):t('districtGeneric')):t('panelIntro');
    panel.innerHTML=`<div class="panel-heading"><div class="panel-kicker">${t(state.zone?'zoneExplorer':state.district?'districtExplorer':'cityExplorer')}</div><div class="panel-title-row"><h2>${esc(name)}</h2><span class="pill">${t('rolesCount',{n:roles})}</span></div><p>${intro}</p></div><div class="panel-subheading"><span>${t(state.query?'searchResults':isOverview?'featuredCompanies':'companies')}</span><b>${t('companiesCount',{n:companies.length})}</b></div><div class="company-list">${companies.length?companies.map(companyCard).join(''):`<div class="empty-state"><div class="empty-icon">⌁</div><h3>${t(empty?'emptyDistrict':'emptySearch')}</h3><p>${empty?t('emptyDistrictText',{district:name}):t('emptySearchText')}</p><button class="primary-button" data-empty-reset>${t(empty?'exploreCity':'clearFilters')} ↗</button></div>`}</div><div class="panel-tip"><b>${t('interestTip')}</b><br>${t(state.district?'companyTip':'greenTip')}</div>`;
  }
  function languageButtons() {
    return [['zh',language==='en'?'Chinese':'中文','zh-CN'],['en','English','en'],['ar',language==='en'?'Arabic':'العربية','ar-JO']].map(([id,label,locale])=>`<button type="button" data-language="${id}" lang="${locale}" dir="${id==='ar'?'rtl':'ltr'}" aria-pressed="${id===language}">${label}</button>`).join('');
  }
  const catalogTitleKey={districts:'browseDistricts',companies:'browseCompanies',roles:'browseRoles'};
  function catalogTotal(kind){
    return kind==='districts'?features.size:kind==='companies'?data.companies.length:data.companies.reduce((n,c)=>n+c.roles.length,0);
  }
  function openCatalog(kind,keepQuery=false){
    if(!catalogTitleKey[kind])return;
    if(!keepQuery)state.catalogQuery='';
    state.catalogKind=kind;state.catalogReturn=false;state.role=null;state.dialog='catalog';
    showDialog(`<div class="catalog-shell"><h2 id="dialog-title" tabindex="-1">${t(catalogTitleKey[kind])} <span class="pill">${catalogTotal(kind)}</span></h2><p class="catalog-intro">${t('catalogIntro')}</p><div class="catalog-switch" role="group" aria-label="${t('statsAria')}">${[['districts','catalogDistrictTab'],['companies','catalogCompanyTab'],['roles','catalogRoleTab']].map(([key,label])=>`<button type="button" data-catalog-kind="${key}" aria-pressed="${key===kind}">${t(label)} <b>${catalogTotal(key)}</b></button>`).join('')}</div><label class="catalog-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><input type="search" aria-label="${t('catalogSearch')}" id="catalog-search" value="${esc(state.catalogQuery)}" placeholder="${t('catalogSearch')}" autocomplete="off" dir="auto"></label><p id="catalog-count" class="catalog-count" role="status"></p><div id="catalog-list" class="catalog-list catalog-${kind}"></div></div>`);
    renderCatalogList();$('#dialog-title').focus({preventScroll:true});
  }
  function renderCatalogList(){
    const kind=state.catalogKind,query=state.catalogQuery.toLocaleLowerCase().trim();
    const matches=text=>!query||text.toLocaleLowerCase().includes(query);
    let rows=[];
    if(kind==='districts'){
      rows=[...features.keys()].filter(name=>matches([name,...locales.districts[name]].join(' '))).map(name=>{
        const companies=allDistrictCompanies(name),roles=companies.reduce((n,c)=>n+c.roles.length,0);
        return `<button type="button" class="catalog-row catalog-district" data-catalog-district="${esc(name)}"><span class="catalog-district-icon" aria-hidden="true">⌖</span><span class="catalog-row-copy"><strong>${esc(districtName(name))}</strong><small>${t('companiesCount',{n:companies.length})} · ${t('rolesCount',{n:roles})}</small></span><span class="catalog-arrow" aria-hidden="true">↗</span></button>`;
      });
    }else if(kind==='companies'){
      rows=data.companies.filter(c=>matches(companySearchText(c))).map(c=>`<button type="button" class="catalog-row" data-catalog-company="${esc(c.id)}">${companyLogo(c)}<span class="catalog-row-copy"><strong>${esc(companyName(c))}</strong><small>${districtName(c.district)} · ${categoryName(c.category)}</small><small>${t('rolesCount',{n:c.roles.length})}</small></span><span class="catalog-arrow" aria-hidden="true">↗</span></button>`);
    }else{
      rows=data.companies.flatMap(c=>c.roles.filter(role=>matches([companySearchText(c),...Object.values(role.title),roleLocation(role),...role.skills,...role.skills.map(skillName)].join(' '))).map(role=>`<button type="button" class="catalog-row catalog-role" data-catalog-role="${esc(role.uid)}">${companyLogo(c)}<span class="catalog-row-copy"><strong>${esc(localized(role.title))}</strong><small>${esc(companyName(c))} · ${t('jobLocation')}: ${esc(roleLocation(role))}</small><span class="catalog-role-status">${statusBadge(role)}</span></span><span class="catalog-arrow" aria-hidden="true">↗</span></button>`));
    }
    $('#catalog-count').textContent=t('catalogCount',{shown:rows.length,total:catalogTotal(kind)});
    $('#catalog-list').innerHTML=rows.join('')||`<div class="empty-state"><h3>${t('emptySearch')}</h3><p>${t('emptySearchText')}</p></div>`;
    $('#catalog-list').scrollTop=0;
  }
  function exploreCatalogItem(kind,value){
    $('#detail-dialog').close();resetMap(true);
    if(kind==='district')selectDistrict(value);else selectCompany(value);
    $('#breadcrumb-home').focus({preventScroll:true});
    $('.explorer').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
  }

  function showDialog(html) {
    $("#detail-dialog").classList.toggle("course-page",state.dialog==="courses");
    $('#dialog-content').innerHTML=`<div class="dialog-top"><span class="dialog-brand"><span class="dialog-brand-icon" aria-hidden="true">${$('.brand-icon').innerHTML}</span><span class="dialog-brand-name"><strong>Career Compass</strong><small>${t('dialogKicker')}</small></span></span><div class="dialog-actions"><div class="language-switch dialog-language" role="group" aria-label="${t('languages')}">${languageButtons()}</div><button class="close-dialog" aria-label="${t('close')}" data-close-dialog>×</button></div></div><div class="dialog-body">${html}</div>`;
    const dialog=$('#detail-dialog');document.querySelectorAll('#detail-dialog > .course-layout').forEach(node=>node.remove());if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
  }
  function getRole(uid) {
    for(const company of data.companies){const role=company.roles.find(r=>r.uid===uid);if(role)return {company,role};}
    return null;
  }
  function roleHeaderLinks(company,role) {
    const candidates=[[company.careers_url,'careersEntry'],[company.website,'companyWebsite']];
    const seen=new Set();
    const links=candidates.filter(([url])=>{const safe=safeURL(url);if(!safe||seen.has(safe))return false;seen.add(safe);return true;});
    if(!links.length&&safeURL(role.source_url))links.push([role.source_url,'sourceLink']);
    if(!links.length)return '';
    return `<div class="role-header-links">${links.map(([url,key])=>`<a href="${esc(safeURL(url))}" target="_blank" rel="noopener noreferrer">${esc(t(key))} ↗</a>`).join('')}</div>`;
  }
  function roleLocationPreview(company) {
    const offices=company.offices?.length?company.offices:(company.map_location?[company.map_location]:[]);
    const office=offices.find(o=>companyOfficeRenderable(company,o,company.district));
    if(!office)return '';
    const [x,y]=project([office.lon,office.lat]);
    const districts=[...features.values()].map(f=>`<path d="${esc(f.path.getAttribute('d'))}" fill="#dce9d3" stroke="#f8fbf6" stroke-width="1.3" vector-effect="non-scaling-stroke" fill-rule="evenodd"/>`).join('');
    const label=language==='zh'?'企业据点位置':language==='ar'?'موقع الشركة على الخريطة':'Company location';
    const caption=language==='zh'?'地图点位仅供参考，岗位地点请以招聘信息为准。':language==='ar'?'الموقع تقريبي؛ راجع إعلان الوظيفة للموقع الفعلي.':'Map location is indicative; check the job listing for the workplace.';
    return `<button type="button" class="role-location-preview" data-focus-role-map aria-label="${esc(label)}: ${esc(companyName(company))}"><div><strong>${esc(label)}</strong><small>${esc(districtName(company.district))} · ${esc(caption)}</small></div><svg viewBox="${x-130} ${y-70} 260 140" role="img" aria-label="${esc(label)}: ${esc(companyName(company))}"><rect x="${x-130}" y="${y-70}" width="260" height="140" fill="#dcebef"/>${districts}<circle cx="${x}" cy="${y}" r="7" fill="#285544" stroke="#fff" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#285544" stroke-opacity=".3" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></button>`;
  }
  function openRole(uid,fromCatalog=false) {
    const found=getRole(uid);if(!found)return;
    const showCatalogBack=fromCatalog||(state.dialog==='role'&&state.catalogReturn);
    const {company,role}=found;state.role=uid;state.dialog='role';state.catalogReturn=showCatalogBack;
    const mastered=new Set(state.mastered[uid]||[]),source=safeURL(role.source_url);
    showDialog(`${showCatalogBack?`<button type="button" class="panel-back" data-catalog-back>${t('catalogBack')}</button>`:''}<div class="dialog-company">${companyLogo(company)}<div>${esc(companyName(company))}<small>${t('companyBase')}: ${districtName(company.district)} · ${categoryName(company.category)}</small></div></div>${roleHeaderLinks(company,role)}<h2 id="dialog-title">${esc(localized(role.title))}</h2>${language==='en'||!role.title.en||role.title.en===localized(role.title)?'':`<div class="role-english">${latin(role.title.en)}</div>`}<div class="detail-tags"><span>${experienceName(role.experience.type)}</span><span>${t('skillsCount',{n:role.skills.length})}</span></div>${roleEvidence(role)}${roleLocationPreview(company)}<p class="location-distinction">${t('officeNote')}</p><section class="detail-section"><h3>${t('responsibilities')}</h3><p>${esc(localized(role.description))}</p></section><section class="detail-section"><h3>${t('experience')}</h3><p>${esc(localized(role.experience))||t('experienceUnknown')}</p></section><section class="detail-section"><h3>${t('requiredSkills')}</h3><p style="margin-bottom:12px">${t(role.skills.length?'selectSkills':'noSkillsHelp')}</p><div class="skills-picker">${role.skills.map((s,i)=>`<label class="skill-choice"><input type="checkbox" name="mastered" value="${esc(s)}" id="skill-${i}" ${mastered.has(s)?'checked':''}>${latin(skillName(s))}</label>`).join('')}</div><div class="learning-box" id="learning-results" aria-live="polite"></div></section><section class="detail-section source-box"><h3>${t('sourceTitle')}</h3>${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${t('sourceLink')} ↗</a>`:`<p>${t('sourceMissing')}</p>`}<p>${esc(localized(role.verification_note))||t('statusPublishedNote')}</p>${source?`<p class="source-url">${esc(source)}</p>`:''}</section><div class="detail-actions"><button class="primary-button" id="save-role" data-save-role="${esc(role.uid)}">${t(saved.has(role.uid)?'savedRole':'saveRole')}</button><button class="secondary-button" data-close-dialog>${t('continueMap')} ↗</button></div>`);
    renderLearning();
  }
  const COURSE_AR={
    'Find roles by course':'ابحث عن وظائف حسب المقرر',
    'Courses → roles':'من المقررات إلى الوظائف',
    'Find an area':'ابحث عن منطقة',
    'National':'وطنية',
    'Select studied courses to explore related roles. Course relevance does not prove skill mastery or eligibility.':'اختر المقررات التي درستها لاستكشاف الوظائف ذات الصلة. لا يعني ارتباط المقرر إتقان المهارة أو الأهلية للتوظيف.',
    'Search course code or name':'ابحث عن رمز المقرر أو اسمه',
    'Search courses':'البحث في المقررات',
    'All':'الكل','Undergrad':'البكالوريوس','Postgrad':'الدراسات العليا',
    'All subjects':'جميع التخصصات','Selected only':'المحددة فقط','Clear':'مسح','Expand':'توسيع','Collapse':'طي',
    'Related roles':'الوظائف ذات الصلة','skills matched':'مهارات متطابقة',
    'No courses selected yet':'لم يتم اختيار مقررات بعد',
    'Studied':'مكتمل','Marked as completed':'مكتمل',
    'N companies':'شركات',
    'Finding roles…':'جارٍ البحث عن الوظائف…',
    'Select courses. No results means no relationship is documented in this dataset.':'اختر المقررات. عدم وجود نتائج يعني عدم وجود علاقة موثقة في مجموعة البيانات هذه.',
    'Service unavailable. Please retry.':'الخدمة غير متاحة. يرجى المحاولة مرة أخرى.',
    'Storage unavailable; changes may not persist.':'التخزين غير متاح؛ قد لا يتم حفظ التغييرات.'};
  const courseText=(zh,en)=>language==='zh'?zh:(language==='ar'?(COURSE_AR[en]||en):en);
  let learnedCourses=new Set();
  function persistLearnedCourses() {
    try {
      if(learnedCourses.size)localStorage.setItem('compass-learned-courses',JSON.stringify([...learnedCourses]));
      else localStorage.removeItem('compass-learned-courses');
    } catch(error) {
      toast(courseText('无法保存，下次打开可能丢失。','Storage unavailable; changes may not persist.'));
    }
  }
  try { const savedCourses=JSON.parse(localStorage.getItem('compass-learned-courses')||'[]'); if(Array.isArray(savedCourses))learnedCourses=new Set(savedCourses.filter(c=>data.courses[c])); } catch(error) {}
  function courseChoice(code) {
    return `<label class="skill-choice${learnedCourses.has(code)?' is-done':''}"><input type="checkbox" data-learned-course="${esc(code)}" ${learnedCourses.has(code)?'checked':''}><bdi dir="ltr">${esc(code)}</bdi><span class="course-choice-name">· ${esc(localized(data.courses[code].name))}${code==='COMP9103' ? (language==='zh'?'（已停开）':language==='ar'?' (لم يعد متاحاً)':' (no longer offered)') : ''}</span></label>`;
  }
  let courseRequest=0;
  let courseDialogChangeHandler=null;
  // The axes count selected courses associated with the project's existing skill mappings.
  const courseRadarAxes = [
    {labels:['编程与算法','Programming & algorithms','البرمجة والخوارزميات'], skills:['Python','Java','C','C++','C#','Go','Data Structures','Data Structures and Algorithms','Algorithms']},
    {labels:['数据与统计','Data & statistics','البيانات والإحصاء'], skills:['SQL','Database','MySQL','PostgreSQL','MongoDB','Statistics','Data Analysis','ETL','Spark','Flink','R']},
    {labels:['人工智能','Artificial intelligence','الذكاء الاصطناعي'], skills:['Machine Learning','Deep Learning','Artificial Intelligence','LLM','RAG','Computer Vision','Reinforcement Learning','PyTorch','TensorFlow']},
    {labels:['系统与云','Systems & cloud','الأنظمة والسحابة'], skills:['Linux','Operating Systems','Distributed Systems','Parallel Computing','Cloud Computing','Docker','Kubernetes','Networking','Computer Networks']},
    {labels:['软件工程','Software engineering','هندسة البرمجيات'], skills:['JavaScript','TypeScript','HTML','CSS','React','REST API','Git','Software Testing','DevOps','CI/CD','Java']},
    {labels:['安全与硬件','Security & hardware','الأمن والعتاد'], skills:['Cybersecurity','Embedded Systems','Robotics','CUDA','GPU Architecture','Compiler','C','C++']}
  ];
  // 1 = core subject matter, 0.5 = explicit supporting topic; assumptions alone do not count.
  // Reviewed against the University unit descriptions, 2026-10-28. Unavailable units omitted.
  const courseAxisWeights = [
    {COMP2017:1,COMP2123:1,COMP3027:1,COMP9001:1,COMP9123:1,INFO1110:1,INFO1113:1,COMP9103:1,COMP5310:.5,COMP5339:.5},
    {COMP5310:1,COMP5339:1,COMP9120:1,DATA1001:1,DATA2001:1,DATA2002:1,ISYS2120:1,STAT5002:1,STAT5003:1,COMP5318:.5,COMP5347:.5},
    {COMP3308:1,COMP5318:1,COMP5328:1,COMP5329:1,COMP5310:.5,DATA2002:.5,STAT5003:.5},
    {COMP2017:1,COMP3520:1,COMP5348:1,COMP5349:1,COMP5426:1,COMP5313:.5,COMP5339:.5,COMP5047:.5},
    {COMP2017:1,COMP5347:1,COMP5348:1,COMP9103:1,INFO1113:1,SOFT2201:1,SOFT2412:1,COMP9001:.5,INFO1110:.5,COMP9120:.5},
    {COMP5618:1,ELEC5616:1,COMP2017:.5,COMP5047:.5,COMP5347:.5,ISYS2120:.5}
  ];
  let courseAchievementWasUnlocked = null;
  let radarPreviousCourseCount=null;
  let radarStarUntil=0;
  let radarStarTimer=null;
  let selectedRadarAxis = null;
  const courseAxisWeight = (code, axisIndex) => courseAxisWeights[axisIndex][code] || 0;
  const courseAxisMatches = (code, axisIndex) => courseAxisWeight(code,axisIndex)>0;
  function renderCourseRadar() {
    const box=document.querySelector('#course-radar');if(!box)return;
    const idx=language==='zh'?0:language==='ar'?2:1;
    const courseCount=learnedCourses.size;
    if(radarPreviousCourseCount!==null && courseCount===radarPreviousCourseCount+1 && courseCount>0 && courseCount%5===0)radarStarUntil=Date.now()+4200;
    radarPreviousCourseCount=courseCount;
    const counts=courseRadarAxes.map((axis,i)=>[...learnedCourses].filter(code=>courseAxisMatches(code,i)).length);
    const unlocked=counts.every(count=>count>=3);
    const celebrate=unlocked && courseAchievementWasUnlocked===false;
    courseAchievementWasUnlocked=unlocked;
    box.classList.toggle('radar-unlocked',unlocked);
    box.classList.toggle('radar-celebrate',celebrate);
    const gaps=courseRadarAxes.map((axis,i)=>counts[i]<3 ? `${axis.labels[idx]} ${counts[i]}/3` : null).filter(Boolean);
    const badge=unlocked ? ['✦ 六边形战士 · 已解锁','✦ Hexagon Ranger · Unlocked','✦ مستكشف الأبعاد الستة · تم الفتح'][idx] : ['六边形战士 · 待解锁','Hexagon Ranger · Locked','مستكشف الأبعاد الستة · مغلق'][idx];
    const progress=unlocked ? ['六个方向各有至少 3 门关联课程；这是课程探索成就，不是能力认证。','At least 3 related courses in each direction. This achievement describes course coverage, not proficiency.','ثلاثة مقررات مرتبطة على الأقل في كل اتجاه؛ هذا إنجاز لتغطية المقررات وليس شهادة مهارة.'][idx] : [`各方向需 3 门关联课程；待补：${gaps.join('、')}`, `Three related courses per direction; remaining: ${gaps.join(', ')}`, `ثلاثة مقررات مرتبطة لكل اتجاه؛ المتبقي: ${gaps.join('، ')}`][idx];
    const radarIntensity=counts.reduce((sum,count)=>sum+Math.min(count,3),0)/18;
    const points=counts.map((count,i)=>{const angle=-Math.PI/2+i*Math.PI/3, r=80*Math.min(count,3)/3;return `${100+Math.cos(angle)*r},${100+Math.sin(angle)*r}`;}).join(' ');
    const ring=r=>Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*Math.PI/3;return `${100+Math.cos(a)*r},${100+Math.sin(a)*r}`;}).join(' ');
    const title=['课程方向画像','Your course profile','ملف اتجاهات المقررات'][idx];
    const description=['每个方向显示关联课程数，图形上限为 3 门。核心与辅助关联见课程图例；课程覆盖不代表技能掌握。','Each axis shows related courses, capped visually at 3. See the legend for core and supporting relevance. Coverage is not proficiency.','يعرض كل محور عدد المقررات ذات الصلة بحد بصري قدره ٣. التغطية لا تعني إتقان المهارات.'][idx];
    box.innerHTML=`<div class="radar-copy"><span class="radar-kicker">COURSE PROFILE</span><h3>${title}</h3><p>${description}</p><p class="radar-filter-hint">${['点击图中的方向筛选课程，再次点击显示全部。','Select a direction to filter courses; select it again to show all.','اختر اتجاهاً لتصفية المقررات، ثم اختره مجدداً لعرض الكل.'][idx]}</p><div class="radar-achievement ${unlocked?'is-unlocked':''}"><strong>${badge}</strong><span>${esc(progress)}</span></div></div><div class="radar-visual" dir="ltr">${courseRadarAxes.map((axis,i)=>`<button type="button" class="radar-label radar-label-${i}" data-radar-axis="${i}" aria-pressed="${selectedRadarAxis===i}" dir="${language==='ar'?'rtl':'auto'}"><span>${esc(axis.labels[idx])}</span><b><bdi dir="ltr">${counts[i]}</bdi></b></button>`).join('')}<svg class="radar-chart" viewBox="12 12 176 176" aria-hidden="true"><defs><radialGradient id="course-radar-spectrum" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="80"><stop offset="0%" stop-color="#9fe6c3"/><stop offset="25%" stop-color="#45bcac"/><stop offset="50%" stop-color="#4f8ed5"/><stop offset="75%" stop-color="#866bc8"/><stop offset="100%" stop-color="#e9a85c"/></radialGradient><radialGradient id="course-radar-gold" gradientUnits="userSpaceOnUse" cx="100" cy="100" r="80"><stop offset="0%" stop-color="#fff2b8"/><stop offset="45%" stop-color="#f5d371"/><stop offset="100%" stop-color="#bc821a"/></radialGradient></defs><g class="radar-grid">${[16,32,48,64,80].map(r=>`<polygon points="${ring(r)}"/>`).join('')}${Array.from({length:6},(_,i)=>{const a=-Math.PI/2+i*Math.PI/3;return `<line x1="100" y1="100" x2="${100+Math.cos(a)*80}" y2="${100+Math.sin(a)*80}"/>`;}).join('')}</g><polygon class="radar-fill" style="--radar-opacity:${(0.70+radarIntensity*0.18).toFixed(2)}" points="${points}"/></svg></div>`;
    if(Date.now()<radarStarUntil){const visual=box.querySelector('.radar-visual');visual?.classList.add('radar-star-active');const overlay=document.createElement('div');overlay.className='radar-star-toast';overlay.setAttribute('aria-label',['课程里程碑','Course milestone','إنجاز المقررات'][idx]);overlay.innerHTML=`<div class="milestone-emblem" aria-hidden="true"><svg viewBox="0 0 96 104"><ellipse cx="48" cy="91" rx="32" ry="6" fill="#123c31" opacity=".12"/><path d="M23 83V40c0-17 11-29 25-29s25 12 25 29v43c-16 7-34 7-50 0Z" fill="#f5edcd" stroke="#b1bf9c" stroke-width="2"/><path d="M29 80V41c0-14 8-23 19-23s19 9 19 23v39c-12 5-26 5-38 0Z" fill="#fffaf0"/><path d="M39 33h18M39 39h18" stroke="#b1c69c" stroke-width="2" stroke-linecap="round"/><text x="48" y="67" text-anchor="middle" fill="#245b47" font-size="27" font-weight="700" font-family="system-ui">${courseCount}</text><path d="M17 87h62" stroke="#92ad96" stroke-width="2" stroke-linecap="round"/></svg></div><div class="milestone-copy"><span class="milestone-eyebrow">${['学习旅程','YOUR LEARNING JOURNEY','رحلة التعلم'][idx]}</span><strong>${['里程碑','Milestone','محطة'][idx]} <bdi dir="ltr">${courseCount/5}</bdi></strong><span>${[ `已选择 ${courseCount} 门课程`, `${courseCount} courses selected`, `تم اختيار ${courseCount} مقررات` ][idx]}</span></div><span class="milestone-shimmer" aria-hidden="true"></span>`;box.appendChild(overlay);clearTimeout(radarStarTimer);radarStarTimer=setTimeout(()=>{radarStarUntil=0;visual?.classList.remove('radar-star-active');overlay.remove();},Math.max(0,radarStarUntil-Date.now()));}
  }
  function openCourses() {
    radarPreviousCourseCount=learnedCourses.size;
    state.dialog='courses';state.role=null;
    const codes=Object.keys(data.courses);
    const prefixes=[...new Set(codes.map(c=>c.slice(0,4)))].sort();
    const groups=prefixes.map(p=>{
      const list=codes.filter(c=>c.slice(0,4)===p).sort();
      return `<section class="course-group" data-prefix="${p}"><h3 class="course-group-title">${p}<span>${list.length}</span></h3><div class="course-grid">${list.map(courseChoice).join('')}</div></section>`;
    }).join('');
    showDialog(`<h2 id="dialog-title">${courseText('按课程找岗位','Find roles by course')}</h2><p>${courseText('勾选已学课程，查看相关岗位。课程关联不等于已掌握技能或满足录用要求。','Select studied courses to explore related roles. Course relevance does not prove skill mastery or eligibility.')}</p>
      <section id="course-radar" class="course-radar" aria-live="polite"></section>
      <div class="course-toolbar">
        <input id="course-search" class="course-search" placeholder="${courseText('搜索课程代码或名称','Search course code or name')}" aria-label="${courseText('搜索课程','Search courses')}">
        <div class="course-chips" id="course-level-chips"><button type="button" class="chip active" data-level="all">${courseText('全部','All')}</button><button type="button" class="chip" data-level="ug">${courseText('本科','Undergrad')}</button><button type="button" class="chip" data-level="pg">${courseText('研究生','Postgrad')}</button></div>
        <div class="course-chips" id="course-prefix-chips"><button type="button" class="chip active" data-prefix="all">${courseText('全部学科','All subjects')}</button>${prefixes.map(p=>`<button type="button" class="chip" data-prefix="${p}">${p}</button>`).join('')}</div>
        <div class="course-toolbar-row"><button type="button" class="chip" id="course-selected-only">${courseText('只看已选','Selected only')} <b id="course-selected-count">0</b></button><button type="button" class="chip ghost" id="course-clear">${courseText('清空','Clear')}</button></div>
      </div>
      <div id="course-axis-legend" class="course-axis-legend" hidden></div>
      <div id="course-selected-chips" class="course-selected"></div>
      <div id="course-groups-wrap">${groups}</div>
      <div id="course-results" aria-live="polite"></div>`);
    const dialogBody=document.querySelector('#dialog-content .dialog-body');
    if(dialogBody&&!dialogBody.querySelector('.course-layout')){
      const layout=document.createElement('div');layout.className='course-layout';
      const left=document.createElement('div');left.className='course-left';
      const right=document.createElement('aside');right.className='course-right';
      [' .course-toolbar','#course-axis-legend','#course-selected-chips','#course-groups-wrap'].forEach(sel=>{const el=dialogBody.querySelector(sel.trim());if(el)left.appendChild(el);});
      const head=document.createElement('div');head.className='course-right-head';
      head.innerHTML='<h3>'+courseText('相关岗位','Related roles')+'</h3><button type="button" id="course-expand" class="chip">'+courseText('展开','Expand')+'</button>';
      right.appendChild(head);
      const res=dialogBody.querySelector('#course-results');if(res)right.appendChild(res);
      layout.appendChild(left);layout.appendChild(right);
      dialogBody.appendChild(layout);
      const exp=dialogBody.querySelector('#course-expand');
      if(exp)exp.onclick=()=>{layout.classList.toggle('expanded');exp.textContent=layout.classList.contains('expanded')?courseText('收起','Collapse'):courseText('展开','Expand');};
    }
    const st={level:'all',prefix:'all',selectedOnly:false,query:''};
    const levelOf=code=>{const n=parseInt(code.slice(4),10);return n>=5000?'pg':'ug';};
    const apply=()=>{
      document.querySelectorAll('.course-group').forEach(section=>{
        let shown=0;
        section.querySelectorAll('label').forEach(label=>{
          const input=label.querySelector('input');const code=input.dataset.learnedCourse;input.checked=learnedCourses.has(code);
          let ok=!st.query||label.textContent.toLowerCase().includes(st.query);
          if(ok&&st.level!=='all')ok=levelOf(code)===st.level;
          if(ok&&st.prefix!=='all')ok=code.slice(0,4)===st.prefix;
          if(ok&&st.selectedOnly)ok=learnedCourses.has(code);
          if(ok&&selectedRadarAxis!==null)ok=courseAxisMatches(code,selectedRadarAxis);
          label.hidden=!ok;if(ok)shown++;
          label.classList.remove('axis-core','axis-supporting');
          if(selectedRadarAxis!==null&&ok)label.classList.add(courseAxisWeight(code,selectedRadarAxis)===1?'axis-core':'axis-supporting');
          label.classList.toggle('is-done',learnedCourses.has(code));
        });
        section.hidden=shown===0;
        if(selectedRadarAxis!==null){const grid=section.querySelector('.course-grid');[...grid.children].sort((a,b)=>courseAxisWeight(b.querySelector('input').dataset.learnedCourse,selectedRadarAxis)-courseAxisWeight(a.querySelector('input').dataset.learnedCourse,selectedRadarAxis)||a.querySelector('input').dataset.learnedCourse.localeCompare(b.querySelector('input').dataset.learnedCourse)).forEach(el=>grid.appendChild(el));}
        else {const grid=section.querySelector('.course-grid');[...grid.children].sort((a,b)=>a.querySelector('input').dataset.learnedCourse.localeCompare(b.querySelector('input').dataset.learnedCourse)).forEach(el=>grid.appendChild(el));}
      });
      document.querySelectorAll('#course-level-chips .chip').forEach(b=>b.classList.toggle('active',b.dataset.level===st.level));
      document.querySelectorAll('#course-prefix-chips .chip').forEach(b=>b.classList.toggle('active',b.dataset.prefix===st.prefix));
      $('#course-selected-only').classList.toggle('active',st.selectedOnly);
      const legend=$('#course-axis-legend');legend.hidden=selectedRadarAxis===null;
      if(selectedRadarAxis!==null){const idx=language==='zh'?0:language==='ar'?2:1;legend.innerHTML=`<span class="axis-legend-item"><i class="axis-legend-core"></i>${['核心关联 · +1 分','Core relevance · +1 point','صلة أساسية · +1'][idx]}</span><span class="axis-legend-item"><i class="axis-legend-supporting"></i>${['辅助关联 · +0.5 分','Supporting relevance · +0.5 points','صلة مساندة · +0.5'][idx]}</span><small>${['分值表示课程关联，不代表能力评估。','Points describe course relevance, not proficiency.','النقاط تعبر عن صلة المقرر لا عن مستوى المهارة.'][idx]}</small>`;}

      const count=$('#course-selected-count');if(count)count.textContent=learnedCourses.size;
      renderSelectedChips();
      renderCourseRadar();
    };
    const renderSelectedChips=()=>{
      const box=$('#course-selected-chips');if(!box)return;
      const list=[...learnedCourses];
      box.innerHTML=list.length?list.map(code=>`<button type="button" class="selected-chip" data-remove-course="${esc(code)}">${esc(code)}<span aria-hidden="true">×</span></button>`).join(''):`<span class="course-selected-empty">${courseText('尚未选择课程','No courses selected yet')}</span>`;
    };
    $('#course-radar').onclick=event=>{const button=event.target.closest('[data-radar-axis]');if(!button)return;const axis=Number(button.dataset.radarAxis);selectedRadarAxis=selectedRadarAxis===axis?null:axis;st.level='all';st.prefix='all';st.selectedOnly=false;st.query='';$('#course-search').value='';apply();document.querySelector(`[data-radar-axis="${axis}"]`)?.focus({preventScroll:true});};
    $('#course-search').oninput=event=>{st.query=event.target.value.trim().toLowerCase();apply();};
    $('#course-level-chips').onclick=event=>{const b=event.target.closest('button[data-level]');if(!b)return;st.level=b.dataset.level;apply();};
    $('#course-prefix-chips').onclick=event=>{const b=event.target.closest('button[data-prefix]');if(!b)return;st.prefix=b.dataset.prefix;apply();};
    $('#course-selected-only').onclick=()=>{st.selectedOnly=!st.selectedOnly;apply();};
    $('#course-clear').onclick=()=>{learnedCourses.clear();persistLearnedCourses();apply();renderCourseMatches();};
    $('#course-selected-chips').onclick=event=>{const b=event.target.closest('[data-remove-course]');if(!b)return;learnedCourses.delete(b.dataset.removeCourse);persistLearnedCourses();apply();renderCourseMatches();};
    if(courseDialogChangeHandler)$('#detail-dialog').removeEventListener('change',courseDialogChangeHandler);
    courseDialogChangeHandler=event=>{if(event.target.dataset.learnedCourse){apply();renderCourseMatches();}};
    $('#detail-dialog').addEventListener('change',courseDialogChangeHandler);
    apply();
    renderCourseMatches();
  }
  async function renderCourseMatches() {
    const request=++courseRequest,box=$('#course-results');if(!box)return;
    if(!box.hasChildNodes())box.textContent=courseText('正在查找…','Finding roles…');
    try {
      const response=await fetch('/api/course-matches',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courses:[...learnedCourses]})});
      if(!response.ok)throw new Error();
      const result=await response.json();if(request!==courseRequest||!box.isConnected)return;
      // New records use links calculated by the same Python engine at export.
      for(const item of bankPreview?.course_matches||[]){
        result.results=result.results.filter(existing=>existing.uid!==item.uid);
        const found=getRole(item.uid);if(!found)continue;
        const links=item.links.filter(link=>learnedCourses.has(link.code));
        if(links.length){const covered=new Set(links.map(link=>link.skill));const role=getRole(item.uid).role;result.results.push({...item,links,covered_count:covered.size,remaining:role.skills.filter(skill=>!covered.has(skill))});}
      }
      result.results=result.results.filter(item=>getRole(item.uid));
      result.results.sort((a,b)=>b.covered_count-a.covered_count||a.uid.localeCompare(b.uid));
      box.innerHTML=`<h3>${courseText('相关岗位','Related roles')}: ${result.results.length}</h3>`+result.results.map(item=>{
        const found=getRole(item.uid);if(!found)return '';
        return `<button type="button" class="course-role-item" data-open-role="${esc(item.uid)}"><span class="course-role-logo">${companyLogo(found.company)}</span><span class="course-role-text"><b>${esc(companyName(found.company))} · ${esc(localized(found.role.title))}</b><small>${item.covered_count} / ${item.total} ${courseText('技能匹配','skills matched')}</small></span></button>`;
      }).join('')+(!result.results.length?`<p>${courseText('请选择课程；没有匹配时表示当前数据没有对应关系。','Select courses. No results means no relationship is documented in this dataset.')}</p>`:'');
    } catch(error) {if(box.isConnected)box.textContent=courseText('服务连接失败，请重试。','Service unavailable. Please retry.');}
  }
  const courseNav=document.createElement('button');courseNav.className='nav-item';courseNav.id='nav-courses';courseNav.textContent=courseText('课程找岗位','Courses → roles');$('#nav-saved').before(courseNav);courseNav.onclick=openCourses;
  $('#detail-dialog').addEventListener('change',event=>{
    const code=event.target.dataset.learnedCourse;if(!code)return;
    event.target.checked?learnedCourses.add(code):learnedCourses.delete(code);
    persistLearnedCourses();
    const badge=event.target.closest('label').querySelector('strong');
    if(badge)badge.textContent=event.target.checked?courseText('已学','Studied'):'';
    // Course ticks do not change skill analysis; keep the role panel intact.
  });
  let analysisRequest = 0;
  async function renderLearning() {
    const uid=state.role, found=getRole(uid), box=$('#learning-results');
    if(!found||!box)return;
    if(!found.role.skills.length){box.innerHTML=`<strong>${t('noSkills')}</strong><p>${t('noSkillsHelp')}</p>`;return;}
    const request=++analysisRequest;
    const mastered=[...$('#detail-dialog').querySelectorAll('input[name="mastered"]:checked')].map(i=>i.value);
    state.mastered[uid]=mastered;
    box.textContent=language==='zh'?'正在分析…':'Analysing…';
    try {
      const cached=bankPreview?.plans[uid+'|'+language+'|'+[...mastered].sort().join(',')];
      let result=cached;
      if(!result){
        const response=await fetch('/api/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid,mastered,language})});
        if(!response.ok)throw new Error('Analysis unavailable');
        result=await response.json();
      }
      if(request!==analysisRequest||state.role!==uid||!box.isConnected)return;
      const missing=result.missing, extra=result.unmapped;
      box.innerHTML=`<h3>${courseText('这个岗位可以学哪些课程','Courses related to this role')}</h3><div class="skills-picker">${result.all_courses.map(rec=>courseChoice(rec.code)).join('')||courseText('当前暂无课程映射','No course mapping yet')}</div>${result.all_courses.map(rec=>`<p><b>${esc(rec.code)}</b>: ${rec.reasons.map(esc).join('; ')}</p>`).join('')}<p>${courseText('已学课程与技能自评分别记录。','Studied courses and self-assessed skills are recorded separately.')}</p><strong>${missing.length?t('remaining',{n:missing.length}):t('allCovered')}</strong><p>${missing.map(s=>latin(skillName(s))).join(' · ')}</p><ul>${result.recommendations.map(rec=>`<li><b>${latin(rec.code)} · ${esc(localized(data.courses[rec.code].name))}</b><br>${rec.reasons.map(esc).join('<br>')}<br><small>${t('courseConditions')}: ${esc(localized(data.courses[rec.code].prerequisite))}</small></li>`).join('')}</ul>${extra.length?`<p>${esc(t('unmapped',{skills:extra.map(skillName).join(', ')}))}</p>`:''}<p>${t('courseCaveat')}</p><button type="button" class="secondary-button" id="download-plan">${language==='zh'?'下载学习计划':'Download learning plan'}</button>`;
      $('#download-plan').onclick=()=>{
        const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='career_compass_plan.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      };
    } catch(error) {
      if(request===analysisRequest&&box.isConnected)box.textContent=language==='zh'?'无法连接分析服务，请启动 server.py 后重试。':'Cannot connect to analysis service. Start server.py and retry.';
    }
  }
  function openSaved() {
    state.role=null;state.dialog='saved';
    const items=[...saved].map(getRole).filter(Boolean);
    showDialog(`<h2 id="dialog-title">${t('saved')}</h2><p class="about-copy">${t('savedIntro',{n:items.length})}</p>${items.length?items.map(({company,role})=>`<div class="saved-row">${companyLogo(company)}<button data-open-role="${role.uid}"><h3>${esc(localized(role.title))}</h3><p>${esc(companyName(company))} · ${districtName(company.district)} ↗</p></button><button class="remove-saved" data-remove-saved="${role.uid}">${t('remove')}</button></div>`).join(''):`<div class="empty-state"><div class="empty-icon">♡</div><h3>${t('savedEmpty')}</h3><p>${t('savedHow')}</p><button class="primary-button" data-close-dialog>${t('explore')} ↗</button></div>`}`);
  }
  function openAbout() {
    state.role=null;state.dialog='about';
    const values={companies:data.companies.length,roles:data.companies.reduce((n,c)=>n+c.roles.length,0),districts:features.size,date:'2026-10-26'};
    showDialog(`<h2 id="dialog-title">${t('aboutTitle')}</h2><div class="about-copy"><p>${t('aboutIntro')}</p>${[['howTitle','howText'],['scopeTitle','scopeText'],['freshnessTitle','freshnessText'],['graphicsTitle','graphicsText'],['runtimeTitle','runtimeText']].map(([heading,body])=>`<p><b>${t(heading)}</b><br>${t(body,values)}</p>`).join('')}<p><a href="data-audit.json" target="_blank" rel="noopener">${t('auditLink')} ↗</a> · <a href="legacy-roles-archive.json" target="_blank" rel="noopener">${t('legacyArchiveLink')} ↗</a></p><p><a href="https://geo.datav.aliyun.com/areas_v3/bound/310000_full.json" target="_blank" rel="noopener noreferrer">${t('mapSource')}</a></p></div><button class="primary-button" data-close-dialog>${t('continueMap')} ↗</button>`);
  }
  function renderStaticUI() {
    const islandNames={'小洋山岛':{zh:'小洋山岛',en:'Xiaoyangshan Island',ar:'جزيرة شياويانغشان'},'大乌龟岛':{zh:'大乌龟岛',en:'Dawugui Island',ar:'جزيرة داووغوي'},'洋山群岛':{zh:'洋山群岛',en:'Yangshan Islands',ar:'جزر يانغشان'}};
    document.querySelectorAll('[data-island-name]').forEach(title=>title.textContent=localized(islandNames[title.dataset.islandName]));
    const riverNames={huangpu:{zh:'黄浦江',en:'Huangpu River',ar:'نهر هوانغبو'},suzhou:{zh:'苏州河',en:'Suzhou Creek',ar:'نهر سوتشو'},dazhi:{zh:'大治河',en:'Dazhi River',ar:'نهر داتشي'},jinhui:{zh:'金汇港',en:'Jinhui River',ar:'قناة جينهوي'}};
    document.querySelectorAll('[data-river]').forEach(hit=>hit.setAttribute('aria-label',localized(riverNames[hit.dataset.river])));
    riverLabels.forEach((label,index)=>label.textContent=localized(riverNames[window.MAIN_RIVERS[index].id]));
    dishuiLabel.textContent=localized({zh:'滴水湖',en:'Dishui Lake',ar:'بحيرة ديشوي'});
    dishuiLake.setAttribute('aria-label',localized({zh:'滴水湖',en:'Dishui Lake',ar:'بحيرة ديشوي'}));
    dishuiLake.setAttribute('title',localized({zh:'点击聚焦滴水湖并播放烟花',en:'Click to focus Dishui Lake and play fireworks',ar:'انقر للتركيز على بحيرة ديشوي وعرض الألعاب النارية'}));
    courseNav.textContent=courseText("课程找岗位","Courses → roles");
    document.documentElement.lang=state.entered?(language==='zh'?'zh-CN':language==='ar'?'ar-JO':'en'):'en';
    $('.brand-tagline').textContent=localized({zh:'通江达海，中国上海',en:'Where rivers meet the sea · Shanghai',ar:'حيث تلتقي الأنهار بالبحر · شنغهاي'});
    document.documentElement.dir=language==='ar'?'rtl':'ltr';const dlgEl=$('#detail-dialog');if(dlgEl)dlgEl.dir=language==='ar'?'rtl':'ltr';document.title=state.entered?t('title'):'Career Compass';
    $('meta[name="description"]').content=t('intro');
    const textSelectors={'#nav-explore':'explore','#nav-saved .nav-label':'saved','#nav-about .nav-label':'about','.prototype-badge>span':'prototype','.intro-copy':'intro','.search-hint':'interest','.select-wrap:nth-of-type(2)>span':'industry','.select-wrap:nth-of-type(3)>span':'district','#clear-filters>span':'reset','#breadcrumb-home':'city','.water-label':'eastSea','.map-footer>span':'mapNote','.map-footer>a':'mapSource','.site-footer>span:last-child':'footerNote'};
    for(const [selector,key] of Object.entries(textSelectors))$(selector).textContent=t(key);
    const ib=document.getElementById('intern-only');if(ib)ib.textContent=language==='zh'?'只看实习/校招':(language==='ar'?'التدريب':'Interns & campus only');
    if(ib)ib.title=ib.textContent;
    document.getElementById('area-clear')?.setAttribute('aria-label',localized({zh:'清除片区',en:'Clear area',ar:'مسح المنطقة'}));
    $('.eyebrow').innerHTML=`<span></span> ${t('eyebrow')}`;
    $('#page-title').innerHTML=`${t('heroStart')}${language==='zh'?'':' '}<span>${t('heroEnd')}</span>`;
    const stats=$('.intro-stats').children;
    const counts=[features.size,data.companies.length,data.companies.reduce((n,c)=>n+c.roles.length,0)];
    ['district','company','role'].forEach((key,i)=>{stats[i].querySelector('strong').innerHTML=`${counts[i]}<em>${t(key+'Unit')}</em>`;stats[i].querySelector('span').textContent=t(key+'Stat');stats[i].setAttribute('aria-label',t(catalogTitleKey[['districts','companies','roles'][i]])+' ('+counts[i]+')');stats[i].title=t(catalogTitleKey[['districts','companies','roles'][i]]);});
    $('#search').placeholder=t('search');
    const areaInput=document.getElementById('area-search');
    if(areaInput)areaInput.placeholder=courseText('查找片区','Find an area');$('#search').setAttribute('aria-label',t('search'));$('#search').dir='auto';
    $('.bottom-bar>span').innerHTML=`${t('bottom')} <span aria-hidden="true">↗</span>`;
    $('.site-footer>span:first-child').innerHTML=`${latin('CAREER COMPASS')} <b>／</b> ${t('footerBrand')}`;
    const ariaSelectors={'.brand':'homeAria','.site-header nav':'navAria','.intro-stats':'statsAria','.toolbar':'filtersAria','#category':'industry','#district-select':'district','.explorer':'mapAria','#city-map':'mapAria','.results-panel':'resultsAria','#industry-legend':'legendAria','#district-shortcuts':'district','#language-switch':'languages'};
    for(const [selector,key] of Object.entries(ariaSelectors))$(selector).setAttribute('aria-label',t(key));
    for(const [id,key] of [['zoom-in','zoomIn'],['zoom-out','zoomOut'],['reset-map','resetMap'],['clear-filters','reset']]){$('#'+id).title=t(key);$('#'+id).setAttribute('aria-label',t(key));}
    $('#language-switch').innerHTML=languageButtons();
    $('#category').innerHTML=`<option value="all">${t('allIndustries')}</option>`+Object.keys(categories).map(id=>`<option value="${id}">${categoryName(id)}</option>`).join('');$('#category').value=state.category;
    $('#district-select').innerHTML=`<option value="">${t('city')}</option><optgroup label="${t('adminDistricts')}">`+[...features.keys()].map(name=>`<option value="${name}">${districtName(name)}</option>`).join('')+`</optgroup><optgroup label="${t('industryZones')}"><option value="zone:lingang">${t('lingang')}</option></optgroup>`;$('#district-select').value=state.zone?'zone:'+state.zone:state.district||'';
    $('#district-shortcuts').innerHTML=[...new Set(data.companies.map(c=>c.district))].map(name=>`<button data-district="${name}" aria-pressed="${name===state.district}">${districtName(name)}<span>${allDistrictCompanies(name).reduce((n,c)=>n+c.roles.length,0)}</span></button>`).join('');
    $('#district-shortcuts').insertAdjacentHTML('beforeend',`<button class="zone-shortcut" data-zone="lingang" aria-pressed="${state.zone==='lingang'}">${t('lingang')}<span>${data.companies.filter(c=>(c.zones||[]).includes('lingang')).length} ${t('companyUnit')}</span></button>`);
    {const unverified=data.companies.filter(c=>!c.district||c.district.indexOf('待核实')>=0).length; if(unverified) $("#district-shortcuts").insertAdjacentHTML("beforeend",'<button class="zone-shortcut unverified-shortcut" data-catalog-open="companies" aria-pressed="false">'+(language==="zh"?"区位待核实":"Location unverified")+' <span>'+unverified+(language==="zh"?" 家":"")+'</span></button>');}
    $('#industry-legend').innerHTML=Object.entries(categories).map(([id,c])=>`<span class="legend-item" style="--cat:${c.color}"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[id]}</svg>${categoryName(id)}</span>`).join('');
  }
  let deferredLanguageRefresh=false;
  function setLanguage(next) {
    if(!locales.languages.includes(next)||next===language)return;
    const dialog=$('#detail-dialog'),wasOpen=dialog.open,scroll=dialog.scrollTop,mode=state.dialog,role=state.role;
    language=next;
    $('#map-tooltip').hidden=true;$('#toast').hidden=true;
    deferredLanguageRefresh=false;
    renderStaticUI();updateMapState();renderMarkers();renderPanel();applyView();
    if(wasOpen){if(mode==='courses')openCourses();else if(mode==='role')openRole(role);else if(mode==='saved')openSaved();else if(mode==='about')openAbout();else if(mode==='catalog')openCatalog(state.catalogKind,true);dialog.scrollTop=scroll;}
    const button=document.querySelector(`${wasOpen?'.dialog-language':'#language-switch'} [data-language="${language}"]`);button?.focus({preventScroll:true});
  }

  let preRendered=false;
  const ensureRendered=()=>{if(preRendered)return;preRendered=true;$('#app-shell').hidden=false;renderStaticUI();applyView();if(typeof renderMarkers==='function')renderMarkers();};
  const schedulePreRender=()=>{if('requestIdleCallback' in window)requestIdleCallback(ensureRendered,{timeout:1200});else setTimeout(ensureRendered,500);};
  schedulePreRender();
  // Bind navigation and filters using ordinary DOM events.
  $('#enter-app').addEventListener('click',()=>{
    const welcome=$('#welcome-screen');
    if(welcome.classList.contains('is-leaving')) return;
    welcome.classList.add('is-entering');
    const needle=document.querySelector('.welcome-screen .compass-needle');
    if(needle&&!document.querySelector('.needle-spin')){
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','needle-spin');
      needle.parentNode.insertBefore(g,needle);
      g.appendChild(needle);
      needle.style.transform='none';
      needle.style.transition='none';
      const t0=Date.now();
      const spin=()=>{
        const p=Math.max(0,Math.min((Date.now()-t0)/800,1));
        const deg=(1080*Math.pow(p,2.2))||0;
        g.setAttribute('transform','rotate('+deg.toFixed(1)+' 48 43)');
        if(p<1) requestAnimationFrame(spin);
      };
      requestAnimationFrame(spin);
    }
    ensureRendered();
    state.entered=true;
    $('#page-title').focus({preventScroll:true});
    setTimeout(()=>{welcome.classList.add('is-leaving');},820);
    setTimeout(()=>{welcome.hidden=true;welcome.classList.remove('is-entering','is-leaving');},1100);
  });
  $('.intro-stats').addEventListener('click',event=>{const button=event.target.closest('[data-catalog-kind]');if(button)openCatalog(button.dataset.catalogKind);});
  const lingangFocusEl=$('#lingang-focus');
  if(lingangFocusEl)lingangFocusEl.addEventListener('click',()=>state.zone==='lingang'?resetMap():selectZone('lingang'));
  $('#district-shortcuts').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.catalogOpen){openCatalog(button.dataset.catalogOpen);return;}button.dataset.zone?selectZone(button.dataset.zone):toggleDistrict(button.dataset.district);});
  $('#district-select').addEventListener('change',event=>{const value=event.target.value;value.startsWith('zone:')?selectZone(value.slice(5)):value?selectDistrict(value):resetMap();});
  $('#category').addEventListener('change',event=>{state.category=event.target.value;state.company=null;renderMarkers();renderPanel();});
  $('#search').addEventListener('input',event=>{state.query=event.target.value.trim();state.company=null;renderMarkers();renderPanel();});
  $('#intern-only').addEventListener('click',()=>{state.internOnly=!state.internOnly;$('#intern-only').setAttribute('aria-pressed',String(state.internOnly));$('#intern-only').classList.toggle('active',state.internOnly);state.company=null;renderMarkers();renderPanel();});
  $('#clear-filters').addEventListener('click',()=>resetMap(true));
  document.querySelectorAll('.brand').forEach(brand=>{
    brand.addEventListener('click',event=>{
      const dialog=$('#detail-dialog');
      if(dialog&&dialog.open){event.preventDefault();dialog.close();resetMap(true);window.scrollTo({top:0,behavior:'smooth'});}
    });
  });
  $('#nav-explore').addEventListener('click',()=>resetMap(true));
  $('#breadcrumb-home').addEventListener('click',()=>resetMap());
  const riverHits=element('g',{class:'river-hit-overlay'});
  document.querySelectorAll('.river-hit').forEach(hit=>riverHits.append(hit.cloneNode(true)));
  svg.append(riverHits);
  $('#reset-map').addEventListener('click',()=>resetMap());
  // Clicking sea or unused map space returns to the city overview.
  $('#map-stage').addEventListener('click',event=>{
    if(event.target.closest('button,input,select,a,[role="button"],.district,.district-label,.area-cluster,.area-label,.area-search'))return;
    $('#map-tooltip').hidden=true;
    resetMap();
  });

  $('#zoom-in').addEventListener('click',()=>zoom(.78));
  $('#zoom-out').addEventListener('click',()=>zoom(1.28));
  function zoom(factor) {
    // Accumulate quick clicks against the destination, not an unfinished frame.
    const [x,y,w,h]=pendingView || state.view;
    const newWidth=Math.max(30,w*factor),newHeight=newWidth*h/w;
    // Leaving district scale restores the original centre and all district labels.
    if(factor>1 && (newWidth>=overviewView[2] || newHeight>=overviewView[3])) {
      if(!state.district&&!state.zone&&!selectedArea&&!state.company){
        // At the overview limit, keep existing pins instead of repeatedly
        // rebuilding the map for every extra wheel/button input.
        const destination=pendingView||state.view;
        if(destination.some((value,index)=>Math.abs(value-overviewView[index])>.01))animateView([...overviewView]);
      }else resetMap();
      return;
    }
    animateView([x+(w-newWidth)/2,y+(h-newHeight)/2,newWidth,newHeight]);
  }
  $('#nav-about').addEventListener('click',openAbout);
  $('#nav-saved').addEventListener('click',openSaved);
  $('#results-content').addEventListener('click',event=>{
    const c=event.target.closest('[data-open-company]'),r=event.target.closest('[data-open-role]');
    if(c)selectCompany(c.dataset.openCompany);else if(r)openRole(r.dataset.openRole);
    else if(event.target.closest('[data-back-companies]')){state.company=null;renderPanel();applyView();}
    else if(event.target.closest('[data-empty-reset]'))resetMap(true);
  });
  const returnToRole=document.createElement('button');
  returnToRole.type='button';returnToRole.className='return-to-role';returnToRole.hidden=true;
  document.getElementById('map-stage').append(returnToRole);
  let mapReturnRole=null;
  function focusRoleOnMap(uid) {
    const found=getRole(uid);if(!found)return;
    const {company}=found;
    const offices=company.offices?.length?company.offices:(company.map_location?[company.map_location]:[]);
    const office=offices.find(o=>companyOfficeRenderable(company,o,company.district));if(!office)return;
    mapReturnRole={uid,fromCatalog:!!state.catalogReturn};
    returnToRole.textContent=language==='zh'?'← 返回岗位详情':language==='ar'?'→ العودة إلى تفاصيل الوظيفة':'← Back to role details';
    returnToRole.hidden=false;
    $('#detail-dialog').close();
    selectDistrict(company.district);
    const [x,y]=project([office.lon,office.lat]);
    const width=100,height=width/(svg.clientWidth/svg.clientHeight||1.35);
    animateView([x-width/2,y-height/2,width,height]);
    $('#map-stage').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'center'});
    returnToRole.focus({preventScroll:true});
  }
  returnToRole.addEventListener('click',()=>{
    if(!mapReturnRole)return;
    const target=mapReturnRole;returnToRole.hidden=true;openRole(target.uid,target.fromCatalog);
  });
  $('#detail-dialog').addEventListener('click',event=>{
    const r=event.target.closest('[data-open-role]'),s=event.target.closest('[data-save-role]'),remove=event.target.closest('[data-remove-saved]');
    const catalog=event.target.closest('[data-catalog-kind]'),district=event.target.closest('[data-catalog-district]'),company=event.target.closest('[data-catalog-company]'),role=event.target.closest('[data-catalog-role]');
    if(event.target.closest('[data-focus-role-map]'))focusRoleOnMap(state.role);
    else if(catalog)openCatalog(catalog.dataset.catalogKind);
    else if(district)exploreCatalogItem('district',district.dataset.catalogDistrict);
    else if(company)exploreCatalogItem('company',company.dataset.catalogCompany);
    else if(role)openRole(role.dataset.catalogRole,true);
    else if(event.target.closest('[data-catalog-back]'))openCatalog('roles',true);
    else if(event.target.closest('[data-close-dialog]'))$('#detail-dialog').close();
    else if(r)openRole(r.dataset.openRole);
    else if(s){const uid=s.dataset.saveRole;saved.has(uid)?saved.delete(uid):saved.add(uid);const persisted=saveBookmarks();s.textContent=t(saved.has(uid)?'savedRole':'saveRole');if(persisted)toast(t(saved.has(uid)?'savedToast':'removedToast'));}
    else if(remove){saved.delete(remove.dataset.removeSaved);saveBookmarks();openSaved();}
    else if(event.target===$('#detail-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}
  });
  $('#detail-dialog').addEventListener('input',event=>{if(event.target.id==='catalog-search'){state.catalogQuery=event.target.value;renderCatalogList();}});
  $('#detail-dialog').addEventListener('change',event=>{if(event.target.matches('input[name="mastered"]'))renderLearning();});
  new ResizeObserver(()=>applyView()).observe(svg);
  document.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(button)setLanguage(button.dataset.language);});
  $('#detail-dialog').addEventListener('close',()=>{state.dialog=null;if(deferredLanguageRefresh){deferredLanguageRefresh=false;renderStaticUI();updateMapState();renderMarkers();renderPanel();applyView();}});
  renderStaticUI();updateSavedCount();applyView();updateMapState();renderMarkers();renderPanel();
})();
