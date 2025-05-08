// Run all tests
function runAllTests(compomint) {
  console.log('===== Compomint Tests Started =====');

  runTemplateTests(compomint);
  runHtmlElementTests(compomint);

  console.log('\n===== Test Summary =====');
  console.log(`Total Assertions: ${CompomintTest.assertions}`);
  console.log(`Passed: ${CompomintTest.passed}`);
  console.log(`Failed: ${CompomintTest.failed}`);

  if (CompomintTest.failed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log(`\n✗ ${CompomintTest.failed} tests failed.`);
  }
}

// Run tests on page load
document.addEventListener('DOMContentLoaded', () => { runAllTests(compomint) });

// Export modules (for Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    runTemplateTests,
    runHtmlElementTests
  };
}
