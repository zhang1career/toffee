#!/bin/bash

# Toffee minor 版本升级脚本（仅子包，第二段版本号 +1、第三段归零，如 0.1.2 -> 0.2.0）
# 使用方法：
#   ./minor-version.sh                    # 升级所有子包的 minor version
#   ./minor-version.sh --workspace core   # 只升级指定的子包（如 core）
#   ./minor-version.sh --workspace core audio ui  # 升级多个指定的子包
#   ./minor-version.sh --list             # 列出所有可升级的包

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/version-bump.sh" minor "$@"
