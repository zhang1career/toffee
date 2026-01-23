#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * 崩溃报告器
 * 负责捕获原生崩溃并保存到文件
 */
@interface CrashReporter : NSObject

/**
 * 单例实例
 */
+ (instancetype)sharedInstance;

/**
 * 初始化崩溃捕获
 * @param logRetentionDays 日志保留天数（默认 30 天）
 */
- (void)initializeWithLogRetentionDays:(NSInteger)logRetentionDays;

/**
 * 获取崩溃日志目录路径
 */
- (NSString *)crashLogsDirectory;

/**
 * 手动记录一个错误
 * @param error 错误对象
 * @param type 错误类型（native/js/unhandled_promise）
 */
- (void)recordError:(NSError *)error type:(NSString *)type;

/**
 * 保存崩溃日志（内部方法，供 Bridge 模块调用）
 */
- (void)saveCrashLogWithType:(NSString *)type
                      message:(NSString *)message
                        stack:(NSString *)stack
                        extra:(nullable NSString *)extra;

@end

NS_ASSUME_NONNULL_END

