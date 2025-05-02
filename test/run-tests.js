// Run all tests
function runAllTests() {
  console.log('===== Compomint Tests Started =====');
  
  runTemplateTests();
  runHtmlElementTests();
  
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
document.addEventListener('DOMContentLoaded', runAllTests);

// Export modules (for Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    runTemplateTests,
    runHtmlElementTests
  };
}
