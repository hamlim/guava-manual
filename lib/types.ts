export type PageProps = {
  request: Request;
  context: {
    params: Record<string, string | Array<string>>;
    // set the status code for the response
    status: (status: number) => void;
  };
};

export type Store = {
  request: Request;
  context: {
    params: Record<string, string | Array<string>>;
    // set the status code for the response
    status: (status: number) => void;
  };
};
