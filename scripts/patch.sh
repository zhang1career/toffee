#!/bin/bash

# Toffee 补丁版本升级和发布包装脚本
# 使用方法：
#   ./patch.sh                    # 升级并发布所有子包
#   ./patch.sh --workspace core   # 升级并发布指定的子包
#   ./patch.sh --workspace core audio ui  # 升级并发布多个指定的子包
#   ./patch.sh --list             # 列出所有可升级的包
#   ./patch.sh --help             # 显示帮助信息
#
# 通过 npm 调用时，必须用 -- 把参数传给脚本，否则参数不会到达本脚本：
#   npm run patch                      # 升级并发布所有子包
#   npm run patch -- --workspace core  # 升级并发布指定的子包
#   npm run patch -- --list            # 列出可升级的包

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 如果是 --list 或 --help，只调用 patch-version.sh
if [[ "$1" == "--list" ]] || [[ "$1" == "-l" ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  "$SCRIPT_DIR/patch-version.sh" "$@"
  exit 0
fi

# 升级版本
echo "=========================================="
echo "📦 步骤 1/2: 升级版本"
echo "=========================================="
"$SCRIPT_DIR/patch-version.sh" "$@"

echo ""
echo "=========================================="
echo "🚀 步骤 2/2: 发布包"
echo "=========================================="
"$SCRIPT_DIR/publish.sh" "$@"

echo ""
echo "=========================================="
echo "✅ 版本升级和发布完成！"
echo "=========================================="
