import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler } from './handler';

const initConfigMock = vi.hoisted(() => vi.fn());
const configValue = vi.hoisted(() => ({
  loanApiConfig: { token: 'test-token' },
}));
const setTokenMock = vi.hoisted(() => vi.fn());
const getExistingVideosMock = vi.hoisted(() => vi.fn());

const sendRegisterVideosRequestMock = vi.hoisted(() => vi.fn());
const checkIfCompletedMock = vi.hoisted(() => vi.fn());

const getAllMock = vi.hoisted(() => vi.fn());
const deleteAnimeMock = vi.hoisted(() => vi.fn());

vi.mock('../../config/config', () => ({
  initConfig: initConfigMock,
  config: {
    get value() {
      return configValue;
    },
  },
}));

vi.mock('../../../../../third-party/loan-api/src/loan-api-client', () => ({
  setToken: setTokenMock,
  getExistingVideos: getExistingVideosMock,
}));

vi.mock('../../api-clients/animan-client', () => ({
  sendRegisterVideosRequest: sendRegisterVideosRequestMock,
}));

vi.mock('../../shared/helpers/is-completed', () => ({
  checkIfCompleted: checkIfCompletedMock,
}));

vi.mock('./repository', () => ({
  getAll: getAllMock,
  deleteAnime: deleteAnimeMock,
}));

describe('handler', () => {
  beforeEach(() => {
    initConfigMock.mockReset();
    setTokenMock.mockReset();
    getExistingVideosMock.mockReset();
    sendRegisterVideosRequestMock.mockReset();
    checkIfCompletedMock.mockReset();
    getAllMock.mockReset();
    deleteAnimeMock.mockReset();

    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('initializes config, sets loan token, registers new videos, and deletes completed anime', async () => {
    // Two animes registered
    getAllMock.mockResolvedValue([
      {
        myAnimeListId: 1,
        dub: false,
        updatedAt: '2026-01-23T10:00:00.000Z',
        episodes: new Set([1]), // already have ep 1
      },
      {
        myAnimeListId: 2,
        dub: true,
        updatedAt: '2026-01-23T10:00:00.000Z',
        episodes: new Set([1, 2, 3]),
      },
    ]);

    // Loan API returns videos for each anime
    getExistingVideosMock
      .mockResolvedValueOnce([
        { episode: 1, videoKey: 'v1' }, // existing
        { episode: 2, videoKey: 'v2' }, // new for anime 1
      ])
      .mockResolvedValueOnce([
        { episode: 1, videoKey: 'a' },
        { episode: 2, videoKey: 'b' },
        { episode: 3, videoKey: 'c' },
      ]);

    // Cleanup pass: first anime not completed, second completed
    checkIfCompletedMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await handler({} as never);

    expect(initConfigMock).toHaveBeenCalledTimes(1);
    expect(setTokenMock).toHaveBeenCalledTimes(1);
    expect(setTokenMock).toHaveBeenCalledWith('test-token');

    // new videos only includes v2
    expect(sendRegisterVideosRequestMock).toHaveBeenCalledTimes(1);
    expect(sendRegisterVideosRequestMock).toHaveBeenCalledWith([{ episode: 2, videoKey: 'v2' }]);

    expect(checkIfCompletedMock).toHaveBeenCalledTimes(2);
    expect(deleteAnimeMock).toHaveBeenCalledTimes(1);
    expect(deleteAnimeMock).toHaveBeenCalledWith(
      expect.objectContaining({ myAnimeListId: 2, dub: true }),
    );
  });

  it('does not call sendRegisterVideosRequest when there are no new videos', async () => {
    getAllMock.mockResolvedValue([
      {
        myAnimeListId: 1,
        dub: false,
        updatedAt: '2026-01-23T10:00:00.000Z',
        episodes: new Set([1, 2]),
      },
    ]);

    getExistingVideosMock.mockResolvedValueOnce([
      { episode: 1, videoKey: 'v1' },
      { episode: 2, videoKey: 'v2' },
    ]);

    checkIfCompletedMock.mockResolvedValueOnce(false);

    await handler({} as never);

    expect(sendRegisterVideosRequestMock).not.toHaveBeenCalled();
    expect(deleteAnimeMock).not.toHaveBeenCalled();
  });

  it('does not delete anime when not completed', async () => {
    getAllMock.mockResolvedValue([
      {
        myAnimeListId: 10,
        dub: false,
        updatedAt: '2026-01-23T10:00:00.000Z',
        episodes: new Set([1]),
      },
    ]);

    getExistingVideosMock.mockResolvedValueOnce([{ episode: 1, videoKey: 'v1' }]);
    checkIfCompletedMock.mockResolvedValueOnce(false);

    await handler({} as never);

    expect(deleteAnimeMock).not.toHaveBeenCalled();
  });

  it('propagates initConfig errors', async () => {
    initConfigMock.mockRejectedValueOnce(new Error('config down'));

    await expect(handler({} as never)).rejects.toThrow('config down');
    expect(setTokenMock).not.toHaveBeenCalled();
  });

  it('propagates sendRegisterVideosRequest errors', async () => {
    getAllMock.mockResolvedValueOnce([
      {
        myAnimeListId: 1,
        dub: false,
        updatedAt: '2026-01-23T10:00:00.000Z',
        episodes: new Set([1]),
      },
    ]);

    getExistingVideosMock.mockResolvedValueOnce([
      { episode: 1, videoKey: 'v1' },
      { episode: 2, videoKey: 'v2' }, // new
    ]);

    sendRegisterVideosRequestMock.mockRejectedValueOnce(new Error('lambda down'));
    checkIfCompletedMock.mockResolvedValueOnce(false);

    await expect(handler({} as never)).rejects.toThrow('lambda down');
  });
});
