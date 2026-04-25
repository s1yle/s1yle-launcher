#!/bin/bash


echo " "
echo "-------------------------------------------"
echo "开始生成差异文本，并写入 commit.txt！"
echo "-------------------------------------------"
echo " "


if [ -f "commit.txt" ]; then
    echo " "
    echo "-------------------------------------------"
    echo "检测到 commit.txt 已存在，即将删除该文件！"
    echo "-------------------------------------------"
    echo " "
    rm -f commit.txt  # -f 强制删除
fi

echo "===== 文件变更统计 =====" >> commit.txt
git diff --stat -w >> commit.txt

echo -e "\n===== 暂存区完整差异 =====" >> commit.txt
git diff -w >> commit.txt


echo "✅ 差异文件已生成：commit.txt"
echo " "