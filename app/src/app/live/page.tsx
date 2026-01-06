import Chat from '@/components/Chat';
import VideoPlayer from '../../components/VideoPlayer/VideoPlayerWrapper';

const HLS_URL = process.env.NEXT_PUBLIC_HLS_URL || 'http://localhost:8000/live/stream.m3u8';

export default async function Live({
  searchParams
}: {
  searchParams: { embed?: string }
}) {
  const [embedType, embedId] = searchParams.embed ? searchParams.embed.split("/") : ["native", null];

  return (
    <main className="flex-1 min-h-0 flex">
      <div className="w-3/4 h-full flex flex-col gap-5 text-stone-200 justify-center p-8">
        <VideoPlayer 
          service={embedType}
          videoId={embedId || HLS_URL}
        />
        <div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {embedType === "native" ? "Live Stream" : `Embedding ${embedId}`}
          </h1>
        </div>
      </div>
      <div className="w-1/4 min-h-0 flex border-l border-nord2">
        <Chat />
      </div>
    </main>
  );
}
