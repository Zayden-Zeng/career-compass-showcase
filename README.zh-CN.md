# Career Compass 职业指南针

[English](README.md) | **中文**

**通过城市位置、技能与大学课程，探索上海的职业机会。**

Career Compass 帮助计算机专业学生探索大学学习与上海潜在职业机会之间的联系。项目将公司位置、已收录的技术岗位、技能要求和课程信息集中起来，提供交互式浏览器地图和 Python 终端界面。

### 想解决什么问题？

学生可能知道自己学过哪些课程，却不容易看出课程与真实招聘信息中的技能要求有什么联系。招聘信息分散在不同公司的网页上，雇主的位置和不同区域的机会也不容易放在一起比较。Career Compass 将这些信息整合起来，作为探索职业方向的起点；课程匹配不代表已经具备岗位要求的能力。

### 为什么选择上海？

上海是中国最发达的城市之一，拥有丰富的产业和大型雇主，可能为计算机专业毕业生提供多种机会。上海的国际联系和多元商业环境，也使它成为国际学生及海外归国中国留学生探索工作和生活的有价值选择。具体机会、申请资格和个人体验因人而异。

### 项目如何帮助用户？

用户可以从地图出发，按位置探索公司及已收录的岗位；也可以从课程出发，通过已记录的技能关联查看相关岗位。岗位详情在有来源记录时提供链接，方便用户核查原始信息。Python 分析功能还可以根据用户自行标记的技能，与岗位记录进行比较，并建议相关课程。

![Career Compass 欢迎界面](screenshots/Screenshots-Welcome.png)

## 探索上海

浏览城市地图，选择行政区，查看公司位置和已收录岗位。相近的公司可以展开为交互式 Logo 星环；标记颜色区分有岗位记录和仅有公司信息的条目。

![上海地图和企业探索](screenshots/Screenshots-first_page.png)
![浦东企业](screenshots/Screenshots-Pudong-Map.png)
![企业星环](screenshots/Screenshots-Company-Galaxy.png)

**地图图例：** 绿色表示有岗位详情记录的公司；蓝色表示尚无岗位记录、仅有公司或招聘入口的条目；混合颜色表示该组包含两种情况。数字表示当前缩放级别下聚合的附近公司数量，展开星环后，Logo 外圈也会显示对应状态。

![地图状态图例](screenshots/Screenshots-Map-Legend.png)
![带状态光圈的企业星环](screenshots/Screenshots-Galaxy-Legend.png)

## 浏览行政区、企业和岗位

在可搜索的列表中浏览上海行政区、企业和已收录的岗位，选择条目继续查看相关信息。

![行政区列表](screenshots/Screenshots-District-Directory.png)
![企业列表](screenshots/Screenshots-Company-Directory.png)
![岗位列表](screenshots/Screenshots-Role-Directory.png)

## 查看岗位详情

打开岗位可查看已记录的招聘地点、招聘状态、来源、技能，以及供参考的企业据点。请通过原招聘页面核实最新信息；企业地图标记不代表每个岗位的工作地点都已确认。

![岗位详情示例](screenshots/Screenshots-Role-Details.png)

*这些截图来自此前的数据版本，岗位地点及来源核查后，数量和具体记录可能发生变化。*

## 从课程探索职业

选择课程，探索相关岗位及连接课程和岗位的技能。六方向课程画像展示课程覆盖的广度；点击某个方向可筛选相关课程。

- **Milestone（里程碑）：** 每当已选课程数量达到 5 的倍数（5、10、15 门等），会短暂出现里程碑动画。例如，Milestone 1 表示已选 5 门，Milestone 2 表示已选 10 门。
- **六边形战士（Hexagon Ranger）：** 当六个方向各有至少 3 门已选关联课程时，解锁金色六边形成就。一门课程如果关联多个方向，会分别计入这些方向，因此不一定需要 18 门不同课程。解锁条件按关联课程的门数计算，并非每个方向必须达到 3 个加权分；课程筛选另用核心关联（+1）和辅助关联（+0.5）展示关联强弱。
- **成就含义：** 这两项都是课程探索功能，反映课程选择和关联，并不证明技能掌握或满足岗位申请条件。

![课程、相关岗位和六方向画像](screenshots/Screenshots-Course-Matching-Hexagon.png)
![课程里程碑](screenshots/Screenshots-Course-Milestone.png)

## 发现滴水湖

点击地图上的滴水湖，地图将聚焦到湖附近并播放烟花彩蛋。

![滴水湖烟花](screenshots/Screenshots-Dishui-Fireworks.png)
![滴水湖烟花尾声](screenshots/Screenshots-Dishui-Fireworks-Finale.png)

## 界面语言

浏览器界面支持中文、英文和阿拉伯语；终端界面支持中文和英文。

![中文界面](screenshots/Screenshots-Chinese-Interface.png)
![阿拉伯语界面](screenshots/Screenshots-Arabic-Interface.png)

## 下载和运行

1. 在仓库页面选择 **Code → Download ZIP**，然后解压。
2. 在解压后的文件夹中打开终端，运行 `python3 server.py`（Windows 可运行 `py server.py`）。
3. 浏览器通常会自动打开；如果没有，请在同一台电脑访问 http://127.0.0.1:8766/。使用期间保持终端运行。
4. 如果要使用终端界面，请运行 `python3 career_compass.py`。

需要 Python 3.10 或更高版本和浏览器，无需安装第三方 Python 包。这个本地网页应用需要在 Ed 环境之外运行。详细的运行方法、代码结构、局限和 AI 使用声明见 [README.txt](README.txt)。GitHub 是额外的访问途径，代码仍通过 Ed 提交。

**数据说明：** 记录收集于不同时间，可能不完整或已经过期；收录的岗位不一定仍在招聘。使用岗位、地点或课程信息前，请核查原始来源。
