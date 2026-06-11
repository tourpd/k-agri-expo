export default function VideoReviewCenter() {
  return (
    <section className="rounded-3xl bg-white p-8 text-black shadow-xl">
      <h2 className="text-4xl font-black">영상 리뷰센터</h2>
      <p className="mt-3 text-xl font-bold text-stone-600">
        소비자가 글 후기뿐 아니라 영상 후기, 사진 후기, 별점을 남기는 공간입니다.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-stone-100 p-6">
          <p className="text-lg font-black text-stone-500">영상후기</p>
          <p className="mt-2 text-4xl font-black">0개</p>
        </div>
        <div className="rounded-3xl bg-stone-100 p-6">
          <p className="text-lg font-black text-stone-500">사진후기</p>
          <p className="mt-2 text-4xl font-black">0개</p>
        </div>
        <div className="rounded-3xl bg-stone-100 p-6">
          <p className="text-lg font-black text-stone-500">평균점수</p>
          <p className="mt-2 text-4xl font-black">-</p>
        </div>
      </div>

      <button className="mt-6 rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white">
        영상 리뷰 업로드 폼 만들기
      </button>
    </section>
  );
}
