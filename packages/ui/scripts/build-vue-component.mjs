import glob from 'fast-glob';
import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import path from 'node:path';
import camelcase from 'camelcase';
import { emptyDir, ensureDir } from 'fs-extra';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const componentPath = path.join(__dirname, '..', 'src', 'frameworks', 'vue', 'icons');

const getSvgFiles = () => {
  return glob.sync('src/svg/*.svg', { cwd: path.join(__dirname, '../') });
};

const getName = file => {
  const filename = path.basename(file).replace('.svg', '');
  const componentName = camelcase(filename, { pascalCase: true });
  return {
    filename,
    componentName
  };
};

const formatCode = (code, parser = 'typescript') =>
  format(code, {
    parser,
    semi: false,
    singleQuote: true
  });

const transformToVueComponent = async file => {
  const content = await readFile(file, 'utf-8');
  const { filename, componentName } = getName(file);
  const vue = await formatCode(
    `
  <template>
  ${content}
  </template>
  <script lang="ts">
  import type { DefineComponent } from 'vue'
  export default ({
    name: "${componentName}",
  }) as DefineComponent
  </script>`,
    'vue'
  );
  writeFile(path.resolve(componentPath, `${filename}.vue`), vue, 'utf-8');
};

const generateEntry = async files => {
  const code = await formatCode(
    files
      .map(file => {
        const { filename, componentName } = getName(file);
        return `export { default as ${componentName} } from './${filename}.vue'`;
      })
      .join('\n')
  );
  await writeFile(path.resolve(componentPath, 'index.ts'), code, 'utf-8');
};

const buildVueComponents = async () => {
  await ensureDir(componentPath);
  await emptyDir(componentPath);
  const files = await getSvgFiles();
  await Promise.all(files.map(file => transformToVueComponent(file)));
  await generateEntry(files);
};

export default buildVueComponents;
