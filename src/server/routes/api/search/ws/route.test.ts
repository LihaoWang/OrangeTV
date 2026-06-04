/**
 * @jest-environment node
 */

import type { AppRequest } from '@/server/web';

const mockGetAvailableApiSites = jest.fn();
const mockGetConfig = jest.fn();
const mockSearchFromApi = jest.fn();

jest.mock('@/server/route-auth', () => ({
  getRouteUsername: () => 'owner',
}));

jest.mock('@/lib/config', () => ({
  getAvailableApiSites: mockGetAvailableApiSites,
  getConfig: mockGetConfig,
}));

jest.mock('@/lib/downstream', () => ({
  searchFromApi: mockSearchFromApi,
}));

jest.mock('@/lib/yellow', () => ({
  yellowWords: [],
}));

type SsePayload = {
  type: string;
  totalSources?: number;
  completedSources?: number;
  source?: string;
  results?: unknown[];
};

describe('/api/search/ws', () => {
  beforeAll(async () => {
    const { Blob, File } = await import('node:buffer');
    const { ReadableStream, TransformStream } = await import('node:stream/web');
    const { MessageChannel, MessagePort } = await import('node:worker_threads');
    Object.assign(globalThis, {
      Blob,
      DOMException: class DOMException extends Error {
        constructor(message?: string, public name = 'DOMException') {
          super(message);
        }
      },
      File,
      MessageChannel,
      MessagePort,
      ReadableStream,
      TransformStream,
    });
    const { FormData, Headers, Request, Response } = await import('undici');
    Object.assign(globalThis, { FormData, Headers, Request, Response });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue({
      SiteConfig: {
        DisableYellowFilter: false,
      },
    });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          list: [
            {
              id: 'sd-1',
              name: '短剧结果',
              cover: 'https://example.com/cover.jpg',
              update_time: '2026-01-01T00:00:00Z',
            },
          ],
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;
  });

  it('completes when shortdrama is the only counted search source', async () => {
    mockGetAvailableApiSites.mockResolvedValue([]);

    const response = await callSearchWs('歌手2026');
    const events = await readSseEvents(response);

    expect(events[0]).toMatchObject({ type: 'start', totalSources: 1 });
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'source_result',
        source: 'shortdrama',
        results: expect.any(Array),
      })
    );
    expect(events.at(-1)).toMatchObject({
      type: 'complete',
      completedSources: 1,
    });
  });

  it('emits one source event for each counted source before completing', async () => {
    mockGetAvailableApiSites.mockResolvedValue([
      { key: 'alpha', name: 'Alpha Source' },
    ]);
    mockSearchFromApi.mockResolvedValue([
      {
        id: 'alpha-1',
        title: '歌手2026',
        poster: 'https://example.com/poster.jpg',
        episodes: ['episode-1'],
        source: 'alpha',
        source_name: 'Alpha Source',
        year: '2026',
        type_name: '综艺',
        douban_id: 0,
      },
    ]);

    const response = await callSearchWs('歌手2026');
    const events = await readSseEvents(response);
    const sourceEvents = events.filter(
      (event) => event.type === 'source_result' || event.type === 'source_error'
    );

    expect(events[0]).toMatchObject({ type: 'start', totalSources: 2 });
    expect(sourceEvents).toHaveLength(2);
    expect(sourceEvents.map((event) => event.source).sort()).toEqual([
      'alpha',
      'shortdrama',
    ]);
    expect(events.at(-1)).toMatchObject({
      type: 'complete',
      completedSources: 2,
    });
  });
});

async function callSearchWs(query: string) {
  const route = await import('./route');
  const request = new Request(
    `http://localhost:3000/api/search/ws?q=${encodeURIComponent(query)}`
  ) as AppRequest;
  Object.assign(request, {
    cookies: {
      get: () => undefined,
    },
  });
  return route.GET(request);
}

async function readSseEvents(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Expected SSE response body');

  const decoder = new TextDecoder();
  const events: SsePayload[] = [];
  let buffer = '';
  let doneReading = false;

  try {
    while (!doneReading) {
      const result = await Promise.race([
        reader.read(),
        new Promise<'timeout'>((resolve) => {
          setTimeout(() => resolve('timeout'), 500);
        }),
      ]);

      if (result === 'timeout') {
        throw new Error(
          `Timed out waiting for SSE completion after ${events.length} events`
        );
      }

      if (result.done) {
        doneReading = true;
        break;
      }
      buffer += decoder.decode(result.value, { stream: true });

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex >= 0) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const dataLine = rawEvent
          .split('\n')
          .find((line) => line.startsWith('data: '));
        if (dataLine) {
          events.push(JSON.parse(dataLine.slice(6)));
        }
        separatorIndex = buffer.indexOf('\n\n');
      }

      if (events.at(-1)?.type === 'complete') break;
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  return events;
}
