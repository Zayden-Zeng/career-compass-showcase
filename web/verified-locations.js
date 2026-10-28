/* Generated from data.json by export_verified_locations.py. */
window.COMPASS_VERIFIED_LOCATIONS = {
  "tencent": {
    "map_location": {
      "lat": 31.160742,
      "lon": 121.460661,
      "source": "Tencent Cloud official event venue map link",
      "display_name": "腾讯滨江大厦 · 上海市徐汇区龙华街道龙爱路231号",
      "coordinate_system": "GCJ-02",
      "status": "verified",
      "district": "徐汇区",
      "location_type": "company_office",
      "role_location_verified": false,
      "source_url": "https://developer.cloud.tencent.com/salon/salon-2513",
      "map_url": "https://apis.map.qq.com/uri/v1/marker?marker=coord:31.160742,121.460661;title:腾讯滨江大厦411-412会议室;addr:上海市徐汇区龙华街道龙爱路231号&referer=tencent_cloud"
    },
    "offices": null,
    "location_precision": "address",
    "location_review": {
      "batch": "geo-2026-10-27-1",
      "reviewed_date": "2026-10-27",
      "decision": "verified company office/event venue; role-level location not verified",
      "source_url": "https://developer.cloud.tencent.com/salon/salon-2513",
      "rationale": "The official Tencent Cloud event page provides a GCJ-02 map link for Tencent Riverside Building, 231 Longai Road, Xuhui. The Hongmei Road candidate is retained as an alternate office and is not asserted nonexistent. This point proves a company office or venue, not the assigned office for every advertised role. The DataV polygons are GCJ-02, so the same-CRS coordinate is used unchanged with no GCJ-to-WGS conversion.",
      "previous_map_location": {
        "lat": 31.167389,
        "lon": 121.397336,
        "source": "Amap POI",
        "display_name": "上海腾讯大厦 · 虹梅路1801号新业园"
      }
    }
  },
  "huawei": {
    "map_location": {
      "address": "上海市青浦区金泽镇西岑社区（华为大道与港悦路辅路交叉口西北380米）",
      "lon": 120.97824,
      "lat": 31.070526,
      "coordinate_source_url": "https://gaode.com/place/B0FFKEMI72",
      "source_url": "https://www.shanghai.gov.cn/nw15343/20250623/0e61fed76b7341fbb4a42e24d136f848.html",
      "coordinate_precision": "campus_poi",
      "verification_note": "Campus POI, not a specific building or confirmed workplace for every Shanghai role.",
      "source": "Amap POI matched to independently published campus/building address",
      "display_name": "华为练秋湖研发中心 · 上海市青浦区金泽镇西岑社区（华为大道与港悦路辅路交叉口西北380米）",
      "status": "verified",
      "coordinate_system": "GCJ-02",
      "district": "青浦区",
      "location_type": "company_office",
      "role_location_verified": false,
      "verified_date": "2026-10-27"
    },
    "offices": [
      {
        "name": "华为上海研究所（金桥）",
        "address": "浦东新区新金桥路2222号",
        "lat": 31.26335,
        "lon": 121.633202,
        "source": "Amap POI",
        "status": "unverified"
      },
      {
        "name": "华为练秋湖研发中心（青浦）",
        "address": "上海市青浦区金泽镇西岑社区（华为大道与港悦路辅路交叉口西北380米）",
        "lat": 31.070526,
        "lon": 120.97824,
        "source": "Amap POI matched to independently published campus/building address",
        "status": "verified",
        "coordinate_source_url": "https://gaode.com/place/B0FFKEMI72",
        "source_url": "https://www.shanghai.gov.cn/nw15343/20250623/0e61fed76b7341fbb4a42e24d136f848.html",
        "coordinate_precision": "campus_poi",
        "verification_note": "Campus POI, not a specific building or confirmed workplace for every Shanghai role.",
        "display_name": "华为练秋湖研发中心 · 上海市青浦区金泽镇西岑社区（华为大道与港悦路辅路交叉口西北380米）",
        "coordinate_system": "GCJ-02",
        "district": "青浦区",
        "location_type": "company_office",
        "role_location_verified": false,
        "verified_date": "2026-10-27"
      }
    ],
    "location_precision": "campus_poi",
    "location_review": {
      "batch": "geo-2026-10-27-1",
      "reviewed_date": "2026-10-27",
      "decision": "verified campus/building POI after follow-up cross-check",
      "source_url": "https://www.shanghai.gov.cn/nw15343/20250623/0e61fed76b7341fbb4a42e24d136f848.html",
      "additional_source_urls": [
        "https://www.shanghai.gov.cn/nw17239/20250228/21cab8e9d0e448edb3b36c59b4d4cb88.html"
      ],
      "rationale": "Campus POI, not a specific building or confirmed workplace for every Shanghai role.",
      "previous_map_location": {
        "lat": 31.26335,
        "lon": 121.633202,
        "source": "Amap POI",
        "display_name": "华为上海研究所（金桥） · 浦东新区新金桥路2222号"
      },
      "previous_review_decision": "pending; old JinQiao Pudong POI quarantined, Lianqiu campus address proven but not exactly geocoded",
      "previous_review_rationale": "The Shanghai government and Qingpu government sources place the Lianqiu Lake R&D Center in Xicen, Jinze, Qingpu at 100 Peiya South Road. The old JinQiao point is in Pudong and is not the intended campus. The exact intended campus coordinate was not established in this batch, so the old point is preserved only as an alternate candidate and no new coordinate is guessed. A Shanghai-only role is not necessarily based at Lianqiu Lake.",
      "followup_sources": [
        "https://www.shanghai.gov.cn/nw15343/20250623/0e61fed76b7341fbb4a42e24d136f848.html",
        "https://gaode.com/place/B0FFKEMI72",
        "https://lbs.amap.com/faq/advisory/others/39838"
      ],
      "followup_date": "2026-10-27"
    }
  },
  "baosight": {
    "map_location": {
      "lat": null,
      "lon": null,
      "source": "pending exact-office verification",
      "display_name": "Exact Pudong office coordinate not established",
      "status": "unverified",
      "coordinate_system": null,
      "district": "浦东新区"
    },
    "offices": null,
    "location_precision": "unverified",
    "location_review": {
      "batch": "geo-2026-10-27-1",
      "reviewed_date": "2026-10-27",
      "decision": "pending; old Baoshan POI retained only as rejected alternate evidence",
      "source_url": "https://www.career.zju.edu.cn/jyxt/sczp/zpztgl/ckZpgwXq.zf?zpxxbh=5BA5E5E341DB0196E0653A68DD0E9B18",
      "rationale": "The 2026 Zhejiang University employer listing explicitly places the Big Data Engineer role in Pudong but gives only a district-level address. The old Baoshan POI is not evidence of this office. No new coordinate is guessed; the old candidate is preserved verbatim for review.",
      "previous_map_location": {
        "lat": 31.40546,
        "lon": 121.45638,
        "source": "Amap POI",
        "display_name": "上海宝信软件股份有限公司(总部) · 湄浦路361号互联宝地锦溥园-北区2-3号楼"
      }
    }
  },
  "hesai": {
    "map_location": {
      "address": "上海市嘉定区宝钱公路3188号",
      "lon": 121.201928,
      "lat": 31.418513,
      "coordinate_source_url": "https://www.amap.com/place/B0IU9ZUYZJ",
      "source_url": "https://www.jiading.gov.cn/upload/lvrong/infopublicity/publicinformation/file/7e5240f16f294ddd9fa017ca7dd2d2ca.pdf",
      "coordinate_precision": "campus_poi",
      "verification_note": "Jiading R&D/manufacturing campus, not Changning head office. Government PDF address checked in search-index text; direct retrieval timed out.",
      "source": "Amap POI matched to independently published campus/building address",
      "display_name": "禾赛麦克斯韦全球研发智造中心 · 上海市嘉定区宝钱公路3188号",
      "status": "verified",
      "coordinate_system": "GCJ-02",
      "district": "嘉定区",
      "location_type": "company_office",
      "role_location_verified": false,
      "verified_date": "2026-10-27"
    },
    "offices": [
      {
        "name": "禾赛科技（长宁办公点）",
        "address": "长宁区昭化路618号海粟文化广场A栋",
        "lat": 31.2245,
        "lon": 121.4152,
        "source": "Amap POI",
        "status": "unverified"
      },
      {
        "name": "禾赛麦克斯韦研发智造中心（嘉定）",
        "address": "上海市嘉定区宝钱公路3188号",
        "lat": 31.418513,
        "lon": 121.201928,
        "source": "Amap POI matched to independently published campus/building address",
        "status": "verified",
        "coordinate_source_url": "https://www.amap.com/place/B0IU9ZUYZJ",
        "source_url": "https://www.jiading.gov.cn/upload/lvrong/infopublicity/publicinformation/file/7e5240f16f294ddd9fa017ca7dd2d2ca.pdf",
        "coordinate_precision": "campus_poi",
        "verification_note": "Jiading R&D/manufacturing campus, not Changning head office. Government PDF address checked in search-index text; direct retrieval timed out.",
        "display_name": "禾赛麦克斯韦全球研发智造中心 · 上海市嘉定区宝钱公路3188号",
        "coordinate_system": "GCJ-02",
        "district": "嘉定区",
        "location_type": "company_office",
        "role_location_verified": false,
        "verified_date": "2026-10-27"
      }
    ],
    "location_precision": "campus_poi",
    "location_review": {
      "batch": "geo-2026-10-27-1",
      "reviewed_date": "2026-10-27",
      "decision": "verified campus/building POI after follow-up cross-check",
      "source_url": "https://www.shanghai.gov.cn/cmsres/92/9250f7790e9d49fd9296ed1ec248746c/b8b49c9c98f960b53d5d0d32d3c3138a.pdf",
      "rationale": "Jiading R&D/manufacturing campus, not Changning head office. Government PDF address checked in search-index text; direct retrieval timed out.",
      "previous_map_location": {
        "lat": 31.2245,
        "lon": 121.4152,
        "source": "Amap POI",
        "display_name": "禾赛科技（长宁办公点） · 长宁区昭化路618号海粟文化广场A栋"
      },
      "previous_review_decision": "pending; old Changning POI retained as alternate evidence, Jiading site address proven but not exactly geocoded",
      "previous_review_rationale": "The Shanghai government published company list identifies Shanghai Hesai Technology at 3188 Baoqian Road, Jiading. The existing POI is the Changning office point, and the exact intended site coordinate was not established. Declared district Jiading is preserved, the old candidate is retained verbatim, and no new coordinate is guessed.",
      "followup_sources": [
        "https://www.jiading.gov.cn/upload/lvrong/infopublicity/publicinformation/file/7e5240f16f294ddd9fa017ca7dd2d2ca.pdf",
        "https://www.amap.com/place/B0IU9ZUYZJ",
        "https://lbs.amap.com/faq/advisory/others/39838"
      ],
      "followup_date": "2026-10-27"
    }
  },
  "coupang": {
    "map_location": {
      "address": "上海市浦东新区金科路2889号长泰广场C座7楼",
      "lon": 121.602358,
      "lat": 31.206782,
      "coordinate_source_url": "https://www.amap.com/place/B0FFG6GRCD",
      "source_url": "https://www.coupang.jobs/en/locations/shanghai/",
      "coordinate_precision": "building_poi",
      "verification_note": "Official careers address matches Block C. Coordinate is the building POI, not the seventh-floor office footprint.",
      "source": "Amap POI matched to independently published campus/building address",
      "display_name": "酷澎上海办公室（长泰广场C座） · 上海市浦东新区金科路2889号长泰广场C座7楼",
      "status": "verified",
      "coordinate_system": "GCJ-02",
      "district": "浦东新区",
      "location_type": "company_office",
      "role_location_verified": false,
      "verified_date": "2026-10-27"
    },
    "offices": [
      {
        "address": "上海市浦东新区金科路2889号长泰广场C座7楼",
        "lon": 121.602358,
        "lat": 31.206782,
        "coordinate_source_url": "https://www.amap.com/place/B0FFG6GRCD",
        "source_url": "https://www.coupang.jobs/en/locations/shanghai/",
        "coordinate_precision": "building_poi",
        "verification_note": "Official careers address matches Block C. Coordinate is the building POI, not the seventh-floor office footprint.",
        "source": "Amap POI matched to independently published campus/building address",
        "display_name": "酷澎上海办公室（长泰广场C座） · 上海市浦东新区金科路2889号长泰广场C座7楼",
        "status": "verified",
        "coordinate_system": "GCJ-02",
        "district": "浦东新区",
        "location_type": "company_office",
        "role_location_verified": false,
        "verified_date": "2026-10-27",
        "name": "酷澎上海办公室（长泰广场C座）"
      }
    ],
    "location_precision": "building_poi",
    "location_review": {
      "batch": "geo-2026-10-27-1",
      "reviewed_date": "2026-10-27",
      "decision": "verified campus/building POI after follow-up cross-check",
      "source_url": "https://www.coupang.jobs/en/locations/shanghai/",
      "rationale": "Official careers address matches Block C. Coordinate is the building POI, not the seventh-floor office footprint.",
      "previous_map_location": {
        "lat": 31.349773,
        "lon": 121.588604,
        "source": "Amap POI",
        "display_name": "酷澎网络科技(上海)有限公司 · 基隆路9号洲际大厦F7层(基隆路地铁站1号口步行300米)"
      },
      "previous_review_decision": "pending; old Jilong Road POI is a different address and is quarantined",
      "previous_review_rationale": "The official Coupang Shanghai locations page gives Floor 7, Block C, Changtai Plaza, 2889 Jinke Road, Pudong. The existing 9 Jilong Road POI is a different address and is not treated as the recruited office. The exact target coordinate was not established, so the old candidate is preserved verbatim and no new coordinate is guessed.",
      "followup_sources": [
        "https://www.coupang.jobs/en/locations/shanghai/",
        "https://www.amap.com/place/B0FFG6GRCD",
        "https://lbs.amap.com/faq/advisory/others/39838"
      ],
      "followup_date": "2026-10-27"
    }
  }
};
