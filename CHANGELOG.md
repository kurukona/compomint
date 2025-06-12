## [1.1.0](https://github.com/kurukona/compomint/compare/v1.0.3...v1.1.0) (2025-06-12)

### Features

* add Promise support to addTmplByUrl function ([32da4a9](https://github.com/kurukona/compomint/commit/32da4a9b57db52b5b229133811a505c34afbb7b6))

### Bug Fixes

* ensure Promise rejection when resources fail to load in addTmplByUrl ([3bf4bc2](https://github.com/kurukona/compomint/commit/3bf4bc25adc6f9a0230f718540cfa894acc3cd32))

## [1.0.3](https://github.com/kurukona/compomint/compare/v1.0.2...v1.0.3) (2025-05-21)

### Bug Fixes

* add protection against reserved property names in i18n functions ([6d49b0a](https://github.com/kurukona/compomint/commit/6d49b0aab5e74b57875ebf48e7eccc15c6cf3f03)), closes [#13](https://github.com/kurukona/compomint/issues/13)
* fix lazyEvaluate unable to access this context and element property ([451061d](https://github.com/kurukona/compomint/commit/451061d6ae3cf408d242a252c3aaedb9901eda27))
