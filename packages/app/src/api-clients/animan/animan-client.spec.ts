import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocks so the module-level LambdaClient() uses the mocked client.
import { sendRegisterVideosRequest } from './animan-client';

// Mock config so importing the module under test doesn't require initConfig().
vi.mock('../../config/config', () => ({
  config: {
    value: {
      animan: {
        registerVideosLambdaName: 'register-videos-lambda',
      },
    },
  },
}));

const lambdaMock = mockClient(LambdaClient);

describe('sendRegisterVideosRequest', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    // Reset mock state and default to a successful invocation
    lambdaMock.reset();
    lambdaMock.on(InvokeCommand).resolves({ StatusCode: 200 });
  });

  it('invokes the configured lambda with a JSON payload containing all video keys', async () => {
    const v1 = { myAnimeListId: 1, dub: 'dub', episode: 1 };
    const v2 = { myAnimeListId: 2, dub: 'sub', episode: 2 };

    await sendRegisterVideosRequest([v1, v2]);

    expect(lambdaMock.calls()).toHaveLength(1);

    const sentCommand = lambdaMock.calls()[0].args[0] as InvokeCommand;
    expect(sentCommand).toBeInstanceOf(InvokeCommand);
    expect(sentCommand.input).toEqual({
      FunctionName: 'register-videos-lambda',
      Payload: JSON.stringify({ items: [{ videoKey: v1 }, { videoKey: v2 }] }),
    });
  });

  it('sends an empty items array when given no video keys', async () => {
    await sendRegisterVideosRequest([]);

    expect(lambdaMock.calls()).toHaveLength(1);
    const sentCommand = lambdaMock.calls()[0].args[0] as InvokeCommand;
    expect(sentCommand.input.Payload).toBe(JSON.stringify({ items: [] }));
  });

  it('propagates errors from the Lambda client', async () => {
    const v1 = { myAnimeListId: 1, dub: 'dub', episode: 1 };
    const err = new Error('boom');

    lambdaMock.reset();
    lambdaMock.on(InvokeCommand).rejects(err);

    await expect(sendRegisterVideosRequest([v1])).rejects.toThrow('boom');

    expect(lambdaMock.calls()).toHaveLength(1);
  });
});
