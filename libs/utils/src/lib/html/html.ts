export function html(
  innerHTML: TemplateStringsArray,
  ...exps: (string | number)[]
) {
  return innerHTML.reduce(
    (acc, curr, i) => acc + curr + (exps[i] !== undefined ? exps[i] : ''),
    ''
  );
}
