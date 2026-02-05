#!/bin/bash

# Toffee patch 版本升级脚本（仅子包，第三段版本号 +1，如 0.1.2 -> 0.1.3）
# 使用方法：
#   ./patch-version.sh                    # 升级所有子包的 patch version
#   ./patch-version.sh --workspace core   # 只升级指定的子包（如 core）
#   ./patch-version.sh --workspace core audio ui  # 升级多个指定的子包
#   ./patch-version.sh --list             # 列出所有可升级的包

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/version-bump.sh" patch "$@"
