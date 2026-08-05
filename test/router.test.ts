import { CompomintRouter } from '../src/router';

describe('CompomintRouter', () => {
  let router: CompomintRouter;

  afterEach(() => {
    if (router) {
      router.stop();
    }
  });

  test('should match static route', () => {
    let matched = false;
    router = new CompomintRouter({
      routes: {
        '/': {
          handler: () => {
            matched = true;
          },
        },
      },
    });

    const res = router.match('/');
    expect(res).not.toBeNull();
    expect(res?.routePattern).toBe('/');
  });

  test('should match dynamic route params and query params', () => {
    router = new CompomintRouter({
      routes: {
        '/events/:id': {
          handler: (params: Record<string, string>, query: Record<string, string>) => {
            return { params, query };
          },
        },
      },
    });

    const res = router.match('/events/123?tab=info');
    expect(res).not.toBeNull();
    expect(res?.params.id).toBe('123');
    expect(res?.queryParams.tab).toBe('info');
  });

  test('should parse nested routes object', () => {
    router = new CompomintRouter({
      routes: {
        events: {
          ':id': {
            render: (match: any) => match.params.id,
          },
        },
      },
    });

    const res = router.match('/events/abc');
    expect(res).not.toBeNull();
    expect(res?.params.id).toBe('abc');
  });
});
