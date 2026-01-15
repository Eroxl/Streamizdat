type AllButLast<T extends any[]> = T extends [...infer Rest, any] ? Rest : never;

function runMiddleware<T extends (...args: any[]) => void>(
  middlewareList: T[],
  ...args: AllButLast<Parameters<T>>
) {
  const run = (index: number) => {
    if (index >= middlewareList.length) return;

    const middleware = middlewareList[index];
    middleware(...args, () => run(index + 1));
  };

  run(0);
}

export default runMiddleware;