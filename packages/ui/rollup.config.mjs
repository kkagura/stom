import vue from 'rollup-plugin-vue';
import resolve from '@rollup/plugin-node-resolve';
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss'; // postcss插件
import postcssPresetEnv from 'postcss-preset-env';
import postcssImport from 'postcss-import';
import postcssUrl from 'postcss-url';
import postcssNested from 'postcss-nested';
import clear from 'rollup-plugin-clear'; // 打包前清除文件夹
import esbuild from 'rollup-plugin-esbuild';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default [
  {
    input: './src/frameworks/vue/index.ts', // 配置入口文件
    plugins: [
      // 配置插件
      clear({ targets: ['dist'], watch: false }),
      resolve(),
      commonjs(),
      vue(),
      esbuild({
        exclude: [],
        sourceMap: false,
        loaders: {
          '.vue': 'ts'
        },
        treeShaking: true,
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
            paths: {
              '@/*': ['./src/*']
            }
          }
        },
        target: 'esnext'
      })
    ],
    // 排除不进行打包的 npm 包，例如 Vue，以便减少包的体积
    external: ['vue'],
    output: {
      dir: 'dist/vue', // 配置输出文件
      format: 'esm' // 配置输出格式
    }
  },
  {
    input: './src/frameworks/vue/style.ts', // 配置入口文件
    plugins: [
      postcss({
        extensions: ['.css', '.postcss'],
        plugins: [postcssPresetEnv(), postcssImport(), postcssUrl(), postcssNested()],
        extract: path.resolve('dist/vue/index.css') //css 输出路径
      })
    ],
    // 排除不进行打包的 npm 包，例如 Vue，以便减少包的体积
    external: [],
    output: {
      dir: 'dist/vue'
    }
  }
];
