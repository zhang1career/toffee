#import "CrashReporter.h"
#import <UIKit/UIKit.h>
#include <execinfo.h>
#include <signal.h>
#include <sys/utsname.h>
#include <mach/mach.h>

// 前向声明函数
static void uncaughtExceptionHandler(NSException *exception);
static void signalHandler(int signal);

static CrashReporter *sharedInstance = nil;
static NSUncaughtExceptionHandler *previousExceptionHandler = nil;
static struct sigaction previousSignalHandlers[32];

@implementation CrashReporter

+ (instancetype)sharedInstance {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[CrashReporter alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // 初始化默认值
    }
    return self;
}

- (void)initializeWithLogRetentionDays:(NSInteger)logRetentionDays {
    // 设置未捕获异常处理器
    previousExceptionHandler = NSGetUncaughtExceptionHandler();
    NSSetUncaughtExceptionHandler(&uncaughtExceptionHandler);
    
    // 设置信号处理器
    [self setupSignalHandlers];
    
    // 清理旧日志
    [self cleanupOldLogs:logRetentionDays];
}

- (void)setupSignalHandlers {
    // 需要捕获的信号
    int signals[] = {
        SIGABRT,   // 异常终止
        SIGBUS,    // 总线错误
        SIGFPE,    // 浮点异常
        SIGILL,    // 非法指令
        SIGSEGV,   // 段错误
        SIGTRAP,   // 跟踪陷阱
    };
    
    struct sigaction action;
    action.sa_handler = &signalHandler;
    sigemptyset(&action.sa_mask);
    action.sa_flags = SA_NODEFER | SA_ONSTACK;
    
    for (int i = 0; i < sizeof(signals) / sizeof(signals[0]); i++) {
        int signal = signals[i];
        sigaction(signal, &action, &previousSignalHandlers[signal]);
    }
}

- (NSString *)crashLogsDirectory {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths firstObject];
    NSString *crashLogsDir = [documentsDirectory stringByAppendingPathComponent:@"crash_logs"];
    
    // 确保目录存在
    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:crashLogsDir]) {
        [fileManager createDirectoryAtPath:crashLogsDir
                withIntermediateDirectories:YES
                                 attributes:nil
                                      error:nil];
    }
    
    return crashLogsDir;
}

- (void)saveCrashLogWithType:(NSString *)type
                      message:(NSString *)message
                        stack:(NSString *)stack
                        extra:(nullable NSString *)extra {
    // 创建崩溃日志字典
    NSMutableDictionary *logDict = [NSMutableDictionary dictionary];
    
    // 生成唯一 ID
    NSString *logId = [[NSUUID UUID] UUIDString];
    logDict[@"id"] = logId;
    
    // 类型和时间戳
    logDict[@"type"] = type ?: @"native";
    logDict[@"timestamp"] = [self currentTimestamp];
    logDict[@"message"] = message ?: @"Unknown error";
    
    if (stack) {
        logDict[@"stack"] = stack;
    }
    
    // 设备信息
    NSMutableDictionary *deviceInfo = [NSMutableDictionary dictionary];
    deviceInfo[@"iosVersion"] = [[UIDevice currentDevice] systemVersion];
    deviceInfo[@"deviceModel"] = [self deviceModel];
    deviceInfo[@"appVersion"] = [self appVersion];
    deviceInfo[@"memoryUsage"] = @([self currentMemoryUsage]);
    logDict[@"deviceInfo"] = deviceInfo;
    
    if (extra) {
        logDict[@"extra"] = extra;
    }
    
    // 保存到文件
    NSString *fileName = [NSString stringWithFormat:@"crash_%@_%@.log",
                         [self timestampForFileName],
                         type ?: @"native"];
    NSString *filePath = [[self crashLogsDirectory] stringByAppendingPathComponent:fileName];
    
    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:logDict
                                                       options:NSJSONWritingPrettyPrinted
                                                         error:&error];
    if (!error && jsonData) {
        [jsonData writeToFile:filePath atomically:YES];
        NSLog(@"💾 Crash log saved: %@", filePath);
    } else {
        NSLog(@"❌ Failed to save crash log: %@", error.localizedDescription);
    }
}

- (void)recordError:(NSError *)error type:(NSString *)type {
    NSString *message = error.localizedDescription ?: @"Unknown error";
    NSString *stack = [NSString stringWithFormat:@"Domain: %@, Code: %ld",
                      error.domain, (long)error.code];
    [self saveCrashLogWithType:type message:message stack:stack extra:nil];
}

- (void)cleanupOldLogs:(NSInteger)retentionDays {
    NSString *logsDir = [self crashLogsDirectory];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    NSArray *files = [fileManager contentsOfDirectoryAtPath:logsDir error:nil];
    if (!files) return;
    
    NSDate *cutoffDate = [NSDate dateWithTimeIntervalSinceNow:-retentionDays * 24 * 60 * 60];
    
    for (NSString *fileName in files) {
        NSString *filePath = [logsDir stringByAppendingPathComponent:fileName];
        NSDictionary *attributes = [fileManager attributesOfItemAtPath:filePath error:nil];
        NSDate *modificationDate = attributes[NSFileModificationDate];
        
        if (modificationDate && [modificationDate compare:cutoffDate] == NSOrderedAscending) {
            [fileManager removeItemAtPath:filePath error:nil];
            NSLog(@"🗑️ Deleted old crash log: %@", fileName);
        }
    }
}

#pragma mark - Helper Methods

- (NSString *)currentTimestamp {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    formatter.dateFormat = @"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    formatter.timeZone = [NSTimeZone timeZoneWithAbbreviation:@"UTC"];
    return [formatter stringFromDate:[NSDate date]];
}

- (NSString *)timestampForFileName {
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    formatter.dateFormat = @"yyyyMMdd_HHmmss";
    return [formatter stringFromDate:[NSDate date]];
}

- (NSString *)deviceModel {
    struct utsname systemInfo;
    uname(&systemInfo);
    return [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
}

- (NSString *)appVersion {
    return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"Unknown";
}

- (double)currentMemoryUsage {
    struct task_basic_info info;
    mach_msg_type_number_t size = sizeof(info);
    kern_return_t kerr = task_info(mach_task_self(), TASK_BASIC_INFO, (task_info_t)&info, &size);
    
    if (kerr == KERN_SUCCESS) {
        return info.resident_size / 1024.0 / 1024.0; // 转换为 MB
    }
    return 0;
}

- (NSString *)stackTrace {
    void *callstack[128];
    int frames = backtrace(callstack, 128);
    char **symbols = backtrace_symbols(callstack, frames);
    
    NSMutableString *stackTrace = [NSMutableString string];
    for (int i = 0; i < frames; i++) {
        [stackTrace appendFormat:@"%s\n", symbols[i]];
    }
    
    free(symbols);
    return stackTrace;
}

@end

#pragma mark - C Functions

void uncaughtExceptionHandler(NSException *exception) {
    CrashReporter *reporter = [CrashReporter sharedInstance];
    
    NSString *message = [NSString stringWithFormat:@"%@: %@",
                         exception.name, exception.reason];
    NSString *stack = [[exception.callStackSymbols componentsJoinedByString:@"\n"] copy];
    
    [reporter saveCrashLogWithType:@"native" message:message stack:stack extra:nil];
    
    // 调用之前的处理器（如果有）
    if (previousExceptionHandler) {
        previousExceptionHandler(exception);
    }
}

void signalHandler(int signal) {
    CrashReporter *reporter = [CrashReporter sharedInstance];
    
    NSString *signalName = [NSString stringWithFormat:@"SIG%d", signal];
    NSString *message = [NSString stringWithFormat:@"Signal %@ received", signalName];
    NSString *stack = [reporter stackTrace];
    
    [reporter saveCrashLogWithType:@"native" message:message stack:stack extra:signalName];
    
    // 恢复之前的信号处理器并重新触发信号
    struct sigaction previousAction = previousSignalHandlers[signal];
    if (previousAction.sa_handler != SIG_DFL && previousAction.sa_handler != SIG_IGN) {
        sigaction(signal, &previousSignalHandlers[signal], NULL);
        raise(signal);
    }
}

