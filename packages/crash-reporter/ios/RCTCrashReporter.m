#import "RCTCrashReporter.h"
#import "CrashReporter.h"
#import <React/RCTLog.h>

@implementation RCTCrashReporter

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

/**
 * 初始化崩溃捕获
 */
RCT_EXPORT_METHOD(initialize:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSInteger retentionDays = 30;
        if (config[@"logRetentionDays"]) {
            retentionDays = [config[@"logRetentionDays"] integerValue];
        }
        
        BOOL enableNativeCapture = YES;
        if (config[@"enableNativeCrashCapture"] != nil) {
            enableNativeCapture = [config[@"enableNativeCrashCapture"] boolValue];
        }
        
        if (enableNativeCapture) {
            [[CrashReporter sharedInstance] initializeWithLogRetentionDays:retentionDays];
            RCTLogInfo(@"✅ CrashReporter initialized (native capture enabled)");
        } else {
            RCTLogInfo(@"✅ CrashReporter initialized (native capture disabled)");
        }
        
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

/**
 * 获取所有崩溃日志
 */
RCT_EXPORT_METHOD(getCrashLogs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *logsDir = [[CrashReporter sharedInstance] crashLogsDirectory];
        NSFileManager *fileManager = [NSFileManager defaultManager];
        
        NSArray *files = [fileManager contentsOfDirectoryAtPath:logsDir error:nil];
        if (!files) {
            resolve(@[]);
            return;
        }
        
        NSMutableArray *logs = [NSMutableArray array];
        
        for (NSString *fileName in files) {
            if (![fileName hasSuffix:@".log"]) {
                continue;
            }
            
            NSString *filePath = [logsDir stringByAppendingPathComponent:fileName];
            NSData *data = [NSData dataWithContentsOfFile:filePath];
            if (!data) {
                continue;
            }
            
            NSError *error = nil;
            NSDictionary *logDict = [NSJSONSerialization JSONObjectWithData:data
                                                                   options:0
                                                                     error:&error];
            if (!error && logDict) {
                [logs addObject:logDict];
            }
        }
        
        // 按时间戳排序（最新的在前）
        [logs sortUsingComparator:^NSComparisonResult(NSDictionary *obj1, NSDictionary *obj2) {
            NSString *timestamp1 = obj1[@"timestamp"] ?: @"";
            NSString *timestamp2 = obj2[@"timestamp"] ?: @"";
            return [timestamp2 compare:timestamp1];
        }];
        
        resolve(logs);
    } @catch (NSException *exception) {
        reject(@"GET_LOGS_ERROR", exception.reason, nil);
    }
}

/**
 * 获取最近一次崩溃日志
 */
RCT_EXPORT_METHOD(getLastCrashLog:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [self getCrashLogs:^(NSArray *logs) {
            if (logs && [logs count] > 0) {
                resolve(logs[0]);
            } else {
                resolve([NSNull null]);
            }
        } rejecter:reject];
    } @catch (NSException *exception) {
        reject(@"GET_LAST_LOG_ERROR", exception.reason, nil);
    }
}

/**
 * 清理所有崩溃日志
 */
RCT_EXPORT_METHOD(clearCrashLogs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *logsDir = [[CrashReporter sharedInstance] crashLogsDirectory];
        NSFileManager *fileManager = [NSFileManager defaultManager];
        
        NSArray *files = [fileManager contentsOfDirectoryAtPath:logsDir error:nil];
        if (files) {
            for (NSString *fileName in files) {
                if ([fileName hasSuffix:@".log"]) {
                    NSString *filePath = [logsDir stringByAppendingPathComponent:fileName];
                    [fileManager removeItemAtPath:filePath error:nil];
                }
            }
        }
        
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CLEAR_LOGS_ERROR", exception.reason, nil);
    }
}

/**
 * 手动记录一个错误
 */
RCT_EXPORT_METHOD(recordError:(NSString *)message
                  stack:(NSString *)stack
                  type:(NSString *)type
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [[CrashReporter sharedInstance] saveCrashLogWithType:type ?: @"js"
                                                      message:message ?: @"Unknown error"
                                                        stack:stack
                                                        extra:nil];
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"RECORD_ERROR", exception.reason, nil);
    }
}

@end

