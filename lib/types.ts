export type PageProps = {
  request: Request;
  context: {
    params: Record<string, string | Array<string>>;
  };
};

export type Store = {
  request: Request;
  context: {
    params: Record<string, string | Array<string>>;
  };
};
