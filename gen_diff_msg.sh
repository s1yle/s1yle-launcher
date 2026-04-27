#!/bin/bash

file=commit_HEAD~$1.txt

echo " "
echo "-------------------------------------------"
echo "开始生成差异文本，并写入 $file!"
echo "-------------------------------------------"
echo " "


# 如果文件存在则删除
if [ -f "commit.txt" ]; then
    echo " "
    echo "-------------------------------------------"
    echo "检测到 $file 已存在，即将删除该文件！"
    echo "-------------------------------------------"
    echo " "
    rm -f $file
fi

VERSION=""
if [ -n "$1" ]; then
    echo " "
    echo "-------------------------------------------"
    echo "✅ 监测到传入版本参数：HEAD~$1"
    echo "-------------------------------------------"
    echo " "
    VERSION="HEAD~$1"
fi


echo "===== 文件变更统计 =====" >> $file
echo $VERSION >> $file
echo "-------------------------------------------" >> $file
git diff --stat -w $VERSION >> $file

echo -e "\n===== 完整差异内容 =====" >> $file
git diff -w $VERSION >> $file

echo "✅ 差异文件已生成：commit.txt"
echo " "
