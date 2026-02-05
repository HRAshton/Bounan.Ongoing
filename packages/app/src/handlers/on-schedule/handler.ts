import type { EventBridgeEvent } from 'aws-lambda';

import type { VideoKey } from '../../../../../third-party/common/ts/interfaces';
import { sendRegisterVideosRequest } from '../../api-clients/animan-client';
import { getEpisodes } from '../../api-clients/loan-api-client';
import { initConfig } from '../../config/config';
import type { AnimeEntity } from '../../models/anime-entity';
import { checkIfCompleted } from '../../shared/helpers/is-completed';
import { deleteAnime, getAll } from './repository';

const getNewVideos = async (anime: AnimeEntity): Promise<VideoKey[]> => {
  const loanApiEpisodes = await getEpisodes(anime.myAnimeListId, anime.dub);
  console.log('Loan API videos: ', JSON.stringify(loanApiEpisodes));

  const newVideos = loanApiEpisodes.filter(ep => !anime.episodes.has(ep));
  console.log('New videos: ', JSON.stringify(newVideos));

  return newVideos.map(ep => ({
    myAnimeListId: anime.myAnimeListId,
    dub: anime.dub,
    episode: ep,
  }));
}

const registerNewVideos = async (): Promise<void> => {
  const registeredAnimes = await getAll();
  console.log('Registered animes: ', JSON.stringify(registeredAnimes));

  const newVideos = [];
  for (const anime of registeredAnimes) {
    const videos = await getNewVideos(anime);
    newVideos.push(...videos);
  }
  console.log('New videos: ', JSON.stringify(newVideos));

  console.log('Videos to register: ', JSON.stringify(newVideos));
  if (newVideos.length === 0) {
    console.log('No videos to register');
    return;
  }

  await sendRegisterVideosRequest(newVideos);
};

const cleanupCompletedSeries = async (): Promise<void> => {
  const registeredAnimes = await getAll();

  for (const anime of registeredAnimes) {
    const isCompleted = await checkIfCompleted(anime.myAnimeListId, new Date(anime.updatedAt), anime.episodes);
    if (isCompleted) {
      await deleteAnime(anime);
      console.info(`Anime was deleted: ${anime.myAnimeListId}`);
    }
  }
}

const process = async (): Promise<void> => {
  console.log('Processing videos');
  await registerNewVideos();

  console.log('Cleaning up completed series');
  await cleanupCompletedSeries();
}

export const handler = async (event: EventBridgeEvent<never, never>): Promise<void> => {
  console.log('Processing event: ', JSON.stringify(event));
  await initConfig();
  await process();
  console.info('done');
};
