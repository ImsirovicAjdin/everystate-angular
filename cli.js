#!/usr/bin/env node

/**
 * @everystate/angular CLI - opt-in self-test
 *
 * Usage:
 *   npx everystate-angular-self-test          # run self-test
 *   npx everystate-angular-self-test --help   # show help
 */

(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
@everystate/angular - self-test CLI

Usage:
  everystate-angular-self-test          Run the bundled self-test
  everystate-angular-self-test --help   Show this help message

The self-test verifies the store-side patterns that the Angular adapter
functions consume: subscribe+get (usePath), set (useIntent), wildcard
subscribe (useWildcard), setAsync lifecycle (useAsync), batch, and the
Injectable service DI contract.

It requires @everystate/core to be installed.
No Angular runtime is needed - the test exercises the store layer only.
`.trim());
    process.exit(0);
  }

  try {
    await import('./self-test.js');
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('\n✗ Missing dependency. Make sure @everystate/core is installed:');
      console.error('  npm install @everystate/core\n');
      process.exit(1);
    }
    console.error('Self-test failed:', err.message);
    process.exit(1);
  }
})();
