#!/bin/bash

# Toffee 版本升级脚本
# 使用方法：
#   ./patch.sh                    # 升级所有子包的 patch version
#   ./patch.sh --workspace core   # 只升级指定的子包（如 core）
#   ./patch.sh --workspace core audio ui  # 升级多个指定的子包
#   ./patch.sh --list             # 列出所有可升级的包

set -e

# 获取脚本所在目录，然后获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 解析参数
PATCH_MODE="all"  # all, workspace
WORKSPACES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --workspace|--workspaces|-w)
      PATCH_MODE="workspace"
      shift
      # 收集所有工作区名称，直到遇到下一个选项
      while [[ $# -gt 0 ]] && [[ ! "$1" =~ ^-- ]]; do
        WORKSPACES+=("$1")
        shift
      done
      ;;
    --list|-l)
      echo "📦 可升级的包列表："
      echo ""
      echo "子包："
      for pkg in packages/*/package.json; do
        if [ -f "$pkg" ]; then
          name=$(node -p "require('./$pkg').name" 2>/dev/null || echo "")
          version=$(node -p "require('./$pkg').version" 2>/dev/null || echo "")
          pkg_dir=$(dirname "$pkg" | sed 's|packages/||')
          if [ -n "$name" ] && [ -n "$version" ]; then
            echo "  - $name@$version (目录: $pkg_dir)"
          fi
        fi
      done
      exit 0
      ;;
    --help|-h)
      echo "Toffee 版本升级脚本"
      echo ""
      echo "使用方法："
      echo "  ./patch.sh                    # 升级所有子包的 patch version"
      echo "  ./patch.sh --workspace core   # 只升级指定的子包（如 core）"
      echo "  ./patch.sh --workspace core audio ui  # 升级多个指定的子包"
      echo "  ./patch.sh --list             # 列出所有可升级的包"
      echo ""
      exit 0
      ;;
    *)
      echo "❌ 未知参数: $1"
      echo "使用 --help 查看帮助信息"
      exit 1
      ;;
  esac
done

# 检查 git 工作区是否干净
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 错误: Git 工作区不干净，请先提交或暂存所有更改"
  echo ""
  echo "当前未提交的更改："
  git status --short
  echo ""
  echo "提示: npm version 命令需要干净的工作区才能创建 commit 和 tag"
  exit 1
fi

# 显示将要升级的包
echo "🔢 开始升级 Toffee 子包的 patch version..."
echo ""

case $PATCH_MODE in
  workspace)
    if [ ${#WORKSPACES[@]} -eq 0 ]; then
      echo "❌ 错误: --workspace 需要指定至少一个子包名称"
      echo "使用 --list 查看所有可用的子包"
      exit 1
    fi
    
    echo "📦 升级模式: 升级指定的子包"
    echo ""
    
    # 验证并升级每个指定的工作区
    for workspace in "${WORKSPACES[@]}"; do
      pkg_path="packages/$workspace/package.json"
      if [ ! -f "$pkg_path" ]; then
        echo "⚠️  警告: 子包 '$workspace' 不存在，跳过"
        continue
      fi
      
      name=$(node -p "require('./$pkg_path').name" 2>/dev/null || echo "")
      old_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
      
      if [ -z "$name" ] || [ -z "$old_version" ]; then
        echo "⚠️  警告: 无法读取子包 '$workspace' 的信息，跳过"
        continue
      fi
      
      echo "  - $name@$old_version -> (升级中...)"
      
      # 升级指定工作区的版本
      npm version patch --workspace="packages/$workspace" --no-git-tag-version
      
      # 读取新版本
      new_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
      echo "    ✅ 已升级到 $name@$new_version"
    done
    
    # 创建统一的 git commit 和 tag
    echo ""
    echo "📝 创建 git commit 和 tag..."
    git add packages/*/package.json
    git commit -m "chore: bump patch versions for specified packages" || true
    
    # 为每个升级的包创建 tag
    for workspace in "${WORKSPACES[@]}"; do
      pkg_path="packages/$workspace/package.json"
      if [ -f "$pkg_path" ]; then
        name=$(node -p "require('./$pkg_path').name" 2>/dev/null || echo "")
        new_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
        if [ -n "$name" ] && [ -n "$new_version" ]; then
          tag_name="${name}@${new_version}"
          git tag "$tag_name" 2>/dev/null || true
        fi
      fi
    done
    ;;
  all)
    echo "📦 升级模式: 升级所有子包"
    echo ""
    
    # 收集所有子包
    PACKAGES=()
    for pkg in packages/*/package.json; do
      if [ -f "$pkg" ]; then
        pkg_dir=$(dirname "$pkg" | sed 's|packages/||')
        PACKAGES+=("$pkg_dir")
      fi
    done
    
    if [ ${#PACKAGES[@]} -eq 0 ]; then
      echo "⚠️  警告: 没有找到任何子包"
      exit 0
    fi
    
    # 显示所有子包当前版本并升级
    for pkg_dir in "${PACKAGES[@]}"; do
      pkg_path="packages/$pkg_dir/package.json"
      name=$(node -p "require('./$pkg_path').name" 2>/dev/null || echo "")
      old_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
      
      if [ -z "$name" ] || [ -z "$old_version" ]; then
        echo "⚠️  警告: 无法读取子包 '$pkg_dir' 的信息，跳过"
        continue
      fi
      
      echo "  - $name@$old_version -> (升级中...)"
      
      # 升级指定工作区的版本
      npm version patch --workspace="packages/$pkg_dir" --no-git-tag-version
      
      # 读取新版本
      new_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
      echo "    ✅ 已升级到 $name@$new_version"
    done
    
    # 创建统一的 git commit 和 tag
    echo ""
    echo "📝 创建 git commit 和 tag..."
    git add packages/*/package.json
    git commit -m "chore: bump patch versions for all packages" || true
    
    # 为每个升级的包创建 tag
    for pkg_dir in "${PACKAGES[@]}"; do
      pkg_path="packages/$pkg_dir/package.json"
      if [ -f "$pkg_path" ]; then
        name=$(node -p "require('./$pkg_path').name" 2>/dev/null || echo "")
        new_version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
        if [ -n "$name" ] && [ -n "$new_version" ]; then
          tag_name="${name}@${new_version}"
          git tag "$tag_name" 2>/dev/null || true
        fi
      fi
    done
    ;;
esac

echo ""
echo "✅ 版本升级完成！"
