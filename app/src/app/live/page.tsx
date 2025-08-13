import VideoPlayer from '../../components/VideoPlayer';

export default function Live() {
  return (
    <main className="h-screen flex">
      <div className="w-3/4 h-full flex flex-col gap-5 text-stone-200 justify-center p-8">
        <VideoPlayer /> 
        <div>
          <h1 className="text-2xl font-bold text-white mb-4">Live Stream</h1>
        </div>
      </div>
    </main>
  );
}
