import postcss from 'postcss';
import fs from 'fs/promises';
import postcssPresetEnv from 'postcss-preset-env';
import postcssImport from 'postcss-import';
import postcssUrl from 'postcss-url';
import postcssNested from 'postcss-nested';

const esbuildPostcssPlugin = () => {
  /** @type {import('esbuild').Plugin} */
  const plugin = {
    name: 'esbuild-postcss',
    setup(build) {
      build.onLoad({ filter: /\.(css|postcss)$/ }, async args => {
        const css = await fs.readFile(args.path, 'utf8');
        const result = await postcss([postcssPresetEnv(), postcssImport(), postcssUrl(), postcssNested()]).process(css, { from: undefined });
        return { contents: result.css, loader: 'css' };
      });
    }
  };
  return plugin;
};

export default esbuildPostcssPlugin;
