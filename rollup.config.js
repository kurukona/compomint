import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/compomint.ts',
  context: 'window',
  output: [
    // UMD (for CDN/global)
    {
      file: 'dist/compomint.umd.js',
      format: 'umd',
      name: 'Compomint',
      sourcemap: true,
    },
    {
      file: 'dist/compomint.umd.min.js',
      format: 'umd',
      name: 'Compomint',
      sourcemap: true,
      plugins: [terser()],
    },
    // ESM (for modern bundlers)
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