import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/compomint-core.ts',
  context: 'window',
  output: [
    {
      file: 'dist/compomint.js',
      format: 'umd',
      name: 'Compomint',
      sourcemap: true,
    },
    {
      file: 'dist/compomint.min.js',
      format: 'umd',
      name: 'Compomint',
      sourcemap: true,
      plugins: [terser()],
    },
    {
      file: 'dist/compomint.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/compomint.esm.min.js',
      format: 'esm',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env'],
      exclude: 'node_modules/**',
    }),
    resolve(),
    commonjs(),
  ],
};