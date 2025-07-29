## [1.1.4](https://github.com/kurukona/compomint/compare/v1.1.3...v1.1.4) (2025-07-29)

### Bug Fixes

* resolve CVE-2025-7783 in form-data dependency ([57c2867](https://github.com/kurukona/compomint/commit/57c2867a5e528774a16255148885144c235491d8))

## [1.1.3](https://github.com/kurukona/compomint/compare/v1.1.2...v1.1.3) (2025-07-21)

### Bug Fixes

* eventId variable conflicts in template rules (fixes [#21](https://github.com/kurukona/compomint/issues/21)) ([0446c09](https://github.com/kurukona/compomint/commit/0446c096124e0f367f6ded26da0e37b33dfe8f2f))

## [1.1.2](https://github.com/kurukona/compomint/compare/v1.1.1...v1.1.2) (2025-07-17)

### Bug Fixes

* templateEngine option handling in addTmplByUrl (fixes [#19](https://github.com/kurukona/compomint/issues/19)) ([0cfbe12](https://github.com/kurukona/compomint/commit/0cfbe126d5d866e0b9adec19f41341daa9ca3f2f))

## [1.1.1](https://github.com/kurukona/compomint/compare/v1.1.0...v1.1.1) (2025-07-08)

### Bug Fixes

* i18n array handling - preserve array structure instead of converting to objects ([567bbac](https://github.com/kurukona/compomint/commit/567bbac7e85bc4ce45d7da2aeab349b3f3ee339d)), closes [#17](https://github.com/kurukona/compomint/issues/17)

### Performance Improvements

* optimize i18n array handling performance ([e065108](https://github.com/kurukona/compomint/commit/e0651087ba89c41291c513790393f6db0242e5de))

## [1.1.0](https://github.com/kurukona/compomint/compare/v1.0.3...v1.1.0) (2025-06-12)

### Features

* add Promise support to addTmplByUrl function ([32da4a9](https://github.com/kurukona/compomint/commit/32da4a9b57db52b5b229133811a505c34afbb7b6))

### Bug Fixes

* ensure Promise rejection when resources fail to load in addTmplByUrl ([3bf4bc2](https://github.com/kurukona/compomint/commit/3bf4bc25adc6f9a0230f718540cfa894acc3cd32))

## [1.0.3](https://github.com/kurukona/compomint/compare/v1.0.2...v1.0.3) (2025-05-21)

### Bug Fixes

* add protection against reserved property names in i18n functions ([6d49b0a](https://github.com/kurukona/compomint/commit/6d49b0aab5e74b57875ebf48e7eccc15c6cf3f03)), closes [#13](https://github.com/kurukona/compomint/issues/13)
* fix lazyEvaluate unable to access this context and element property ([451061d](https://github.com/kurukona/compomint/commit/451061d6ae3cf408d242a252c3aaedb9901eda27))
