import React from 'react';

// 跨平台 View 组件
// 在 Taro 环境中使用 View，在 Web 环境中使用 div
// 使用动态导入，在运行时检测

let ViewComponent: React.ComponentType<any> | string = 'div';
let TextComponent: React.ComponentType<any> | string = 'span';

// 检测是否是 React Native 环境（优先检测，避免加载 Taro）
const isReactNative = (): boolean => {
  try {
    // @ts-ignore - 在 Web 环境中这个模块不存在
    require('react-native');
    return true;
  } catch {
    return false;
  }
};

// 在运行时动态获取组件
const getViewComponent = (): React.ComponentType<any> | string => {
  // 优先检测 React Native，避免尝试加载 Taro 组件
  if (isReactNative()) {
    try {
      // @ts-ignore
      const reactNative = require('react-native');
      if (reactNative && reactNative.View) {
        return reactNative.View;
      }
    } catch (e) {
      // 如果 React Native 检测失败，回退到 div
      return 'div';
    }
  }
  
  // 仅在非 React Native 环境中尝试加载 Taro 组件
  if (!isReactNative()) {
    try {
      // @ts-ignore - 在 Web 环境中这个模块不存在
      const taroComponents = require('@tarojs/components');
      if (taroComponents && taroComponents.View) {
        return taroComponents.View;
      }
    } catch (e) {
      // 在 Web 环境中，@tarojs/components 不存在，使用 div
    }
  }
  return 'div';
};

const getTextComponent = (): React.ComponentType<any> | string => {
  // 优先检测 React Native，避免尝试加载 Taro 组件
  if (isReactNative()) {
    try {
      // @ts-ignore
      const reactNative = require('react-native');
      if (reactNative && reactNative.Text) {
        return reactNative.Text;
      }
    } catch (e) {
      // 如果 React Native 检测失败，回退到 span
      return 'span';
    }
  }
  
  // 仅在非 React Native 环境中尝试加载 Taro 组件
  if (!isReactNative()) {
    try {
      // @ts-ignore - 在 Web 环境中这个模块不存在
      const taroComponents = require('@tarojs/components');
      if (taroComponents && taroComponents.Text) {
        return taroComponents.Text;
      }
    } catch (e) {
      // 在 Web 环境中，@tarojs/components 不存在，使用 span
    }
  }
  return 'span';
};

// 延迟初始化，避免在模块加载时执行
ViewComponent = getViewComponent();
TextComponent = getTextComponent();

// 跨平台样式类型：支持 Web CSS 和 React Native 样式数组
type PlatformStyle = 
  | React.CSSProperties 
  | Record<string, any> 
  | Array<React.CSSProperties | Record<string, any> | false | null | undefined>;

// 跨平台 View 属性类型
interface PlatformViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: PlatformStyle;
  className?: string;
  [key: string]: any; // 允许其他平台特定的属性
}

// 跨平台 Text 属性类型
interface PlatformTextProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  style?: PlatformStyle;
  className?: string;
  [key: string]: any; // 允许其他平台特定的属性
}

export const PlatformView: React.FC<PlatformViewProps> = (props) => {
  // 每次渲染时都尝试获取最新的组件（以防模块动态加载）
  const Comp = getViewComponent();
  return React.createElement(Comp, props);
};

export const PlatformText: React.FC<PlatformTextProps> = (props) => {
  const Comp = getTextComponent();
  return React.createElement(Comp, props);
};

