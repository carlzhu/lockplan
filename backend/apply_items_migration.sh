#!/bin/bash

# 应用 Items 表迁移的脚本

echo "正在应用 Items 表迁移..."

# 方法 1: 直接应用新迁移（假设第一个迁移已经应用）
dotnet ef database update 20260122080640_AddItemsTable --project DoNow.Infrastructure --startup-project DoNow.Api

echo "迁移完成！"
