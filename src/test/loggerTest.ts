import logger from '@/lib/logger';

// Test the logger in different environments
console.log('Testing logger...');

logger.debug('This is a debug message', { test: 'data' });
logger.info('This is an info message', { test: 'data' });
logger.warn('This is a warning message', { test: 'data' });
logger.error('This is an error message', { test: 'data' });
logger.safe('This is a safe message');

console.log('Logger test completed');