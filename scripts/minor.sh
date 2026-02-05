#!/bin/bash

# Toffee 小版本（minor）升级和发布包装脚本
# 使用方法：
#   ./minor.sh                    # 升级并发布所有子包
#   ./minor.sh --workspace core   # 升级并发布指定的子包
#   ./minor.sh --workspace core audio ui  # 升级并发布多个指定的子包
#   ./minor.sh --list             # 列出所有可升级的包
#   ./minor.sh --help             # 显示帮助信息
#
# 通过 npm 调用时，必须用 -- 把参数传给脚本，否则参数不会到达本脚本：
#   npm run minor                      # 升级并发布所有子包
#   npm run minor -- --workspace core  # 升级并发布指定的子包
#   npm run minor -- --list            # 列出可升级的包
#   npm run minor:list                 # 同上，便捷命令

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 如果是 --list 或 --help，只调用 minor-version.sh
if [[ "$1" == "--list" ]] || [[ "$1" == "-l" ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  "$SCRIPT_DIR/minor-version.sh" "$@"
  exit 0
fi

# 小版本升级
echo "=========================================="
echo "📦 步骤 1/2: 小版本升级"
echo "=========================================="
"$SCRIPT_DIR/minor-version.sh" "$@"

echo ""
echo "=========================================="
echo "🚀 步骤 2/2: 发布包"
echo "=========================================="
"$SCRIPT_DIR/publish.sh" "$@"

echo ""
echo "=========================================="
echo "✅ 小版本升级和发布完成！"
echo "=========================================="
