#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * React Native Bridge 模块
 * 提供 JavaScript 调用原生崩溃报告功能的接口
 */
@interface RCTCrashReporter : NSObject <RCTBridgeModule>

@end

NS_ASSUME_NONNULL_END

