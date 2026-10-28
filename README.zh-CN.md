# Career Compass 职业指南针

[English](README.md) | **中文**

**通过城市位置、技能与大学课程，探索上海的职业机会。**

Career Compass 帮助计算机专业学生了解雇主的位置、探索已收录的技术岗位，并查看所选课程与岗位技能之间的联系。项目使用 Python 处理数据和匹配，提供终端界面及交互式浏览器地图。

![Career Compass 欢迎界面](screenshots/Screenshots-Welcome.png)

## 探索上海

浏览城市地图，选择行政区，查看公司位置和已收录岗位。相近的公司可以展开为交互式 Logo 星环；标记颜色区分有岗位记录和仅有公司信息的条目。

![上海地图和企业探索](screenshots/Screenshots-first_page.png)
![浦东企业](screenshots/Screenshots-Pudong-Map.png)
![企业星环](screenshots/Screenshots-Company-Galaxy.png)

## 从课程探索职业

选择课程，探索相关岗位及连接课程和岗位的技能。六方向课程画像展示课程覆盖的广度，里程碑用于庆祝学习进展。课程覆盖不代表技能掌握，也不保证符合岗位申请条件。

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
