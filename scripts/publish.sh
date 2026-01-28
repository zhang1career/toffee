#!/bin/bash

# Toffee 发布脚本
# 使用方法：
#   ./publish.sh                    # 发布所有包（根包 + 所有子包）
#   ./publish.sh --root             # 只发布根包
#   ./publish.sh --workspace core   # 只发布指定的子包（如 core）
#   ./publish.sh --workspace core audio ui  # 发布多个指定的子包
#   ./publish.sh --list             # 列出所有可发布的包

set -e

# 获取脚本所在目录，然后获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 加载 .env 文件（如果存在）
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo "📝 从 .env 文件加载环境变量..."
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# 检查 GITHUB_TOKEN 是否设置
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ 错误: GITHUB_TOKEN 环境变量未设置"
  echo ""
  echo "请选择以下方式之一："
  echo ""
  echo "方式 1: 在项目根目录创建 .env 文件，添加:"
  echo "  GITHUB_TOKEN=your_github_token_here"
  echo ""
  echo "方式 2: 设置环境变量:"
  echo "  export GITHUB_TOKEN=your_github_token_here"
  echo ""
  echo "方式 3: 使用 npm login:"
  echo "  npm login --registry=https://npm.pkg.github.com --scope=@zhang1career"
  echo "  (Password 处输入你的 GitHub Personal Access Token，不是密码)"
  exit 1
fi

# 解析参数
PUBLISH_MODE="all"  # all, root, workspace
WORKSPACES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --root)
      PUBLISH_MODE="root"
      shift
      ;;
    --workspace|--workspaces|-w)
      PUBLISH_MODE="workspace"
      shift
      # 收集所有工作区名称，直到遇到下一个选项
      while [[ $# -gt 0 ]] && [[ ! "$1" =~ ^-- ]]; do
        WORKSPACES+=("$1")
        shift
      done
      ;;
    --list|-l)
      echo "📦 可发布的包列表："
      echo ""
      echo "根包："
      ROOT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "unknown")
      ROOT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
      echo "  - $ROOT_NAME@$ROOT_VERSION"
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
      echo "Toffee 发布脚本"
      echo ""
      echo "使用方法："
      echo "  ./publish.sh                    # 发布所有包（根包 + 所有子包）"
      echo "  ./publish.sh --root             # 只发布根包"
      echo "  ./publish.sh --workspace core   # 只发布指定的子包（如 core）"
      echo "  ./publish.sh --workspace core audio ui  # 发布多个指定的子包"
      echo "  ./publish.sh --list             # 列出所有可发布的包"
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

# 显示将要发布的包
echo "🚀 开始发布 Toffee 包到 GitHub Packages..."
echo ""

case $PUBLISH_MODE in
  root)
    echo "📦 发布模式: 只发布根包"
    ROOT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "unknown")
    ROOT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
    echo "  - $ROOT_NAME@$ROOT_VERSION"
    echo ""
    npm publish --registry=https://npm.pkg.github.com
    ;;
  workspace)
    if [ ${#WORKSPACES[@]} -eq 0 ]; then
      echo "❌ 错误: --workspace 需要指定至少一个子包名称"
      echo "使用 --list 查看所有可用的子包"
      exit 1
    fi
    
    echo "📦 发布模式: 发布指定的子包"
    echo ""
    
    # 验证并发布每个指定的工作区
    for workspace in "${WORKSPACES[@]}"; do
      pkg_path="packages/$workspace/package.json"
      if [ ! -f "$pkg_path" ]; then
        echo "⚠️  警告: 子包 '$workspace' 不存在，跳过"
        continue
      fi
      
      name=$(node -p "require('./$pkg_path').name" 2>/dev/null || echo "")
      version=$(node -p "require('./$pkg_path').version" 2>/dev/null || echo "")
      echo "  - $name@$version"
      
      # 发布指定的工作区
      npm publish --workspace="packages/$workspace" --registry=https://npm.pkg.github.com
    done
    ;;
  all)
    echo "📦 发布模式: 发布所有包（根包 + 所有子包）"
    echo ""
    
    # 显示根包版本
    ROOT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
    ROOT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "unknown")
    echo "  - $ROOT_NAME@$ROOT_VERSION"
    
    # 显示所有子包版本
    for pkg in packages/*/package.json; do
      if [ -f "$pkg" ]; then
        name=$(node -p "require('./$pkg').name" 2>/dev/null || echo "")
        version=$(node -p "require('./$pkg').version" 2>/dev/null || echo "")
        if [ -n "$name" ] && [ -n "$version" ]; then
          echo "  - $name@$version"
        fi
      fi
    done
    echo ""
    
    # 发布所有包
    npm publish --workspaces --registry=https://npm.pkg.github.com
    ;;
esac

echo ""
echo "✅ 发布完成！"
