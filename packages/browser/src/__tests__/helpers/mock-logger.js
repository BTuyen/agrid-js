jest.mock('../../utils/logger', () => {
    const mockLogger = {
        _log: jest.fn(),
        critical: jest.fn(),
        uninitializedWarning: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createLogger: () => {
            return mockLogger;
        },
    };
    return {
        logger: mockLogger,
        createLogger: mockLogger.createLogger,
    };
});
import { isFunction } from '@agrid/core';
import { logger } from '../../utils/logger';
export const clearLoggerMocks = () => {
    Object.values(logger).forEach((mock) => {
        if (isFunction(mock.mockClear)) {
            mock.mockClear();
        }
    });
};
export const mockLogger = logger;
