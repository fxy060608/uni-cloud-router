import path from 'path'
import ts from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const tsPlugin = ts({
  check: process.env.NODE_ENV === 'production',
  tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
  tsconfigOverride: {
    compilerOptions: {
      declaration: false,
    },
    exclude: ['**/__tests__'],
  },
})

module.exports = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: `commonjs`,
  },
  external: ['fs', 'path', 'events', 'tty', 'util', 'os', 'querystring'],
  plugins: [
    nodeResolve(),
    commonjs({
      ignore: ['conditional-runtime-dependency'], // 使用旧版本 rollup-plugin-commonjs 解决 dynamic require
    }),
    tsPlugin,
    terser(),
  ],
}
