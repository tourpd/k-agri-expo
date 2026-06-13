export default function CropValueSearchHero() {
  return (
    <section className="mx-auto my-5 max-w-4xl rounded-2xl border bg-white px-5 py-6 shadow-md">
      <h2 className="text-center text-2xl font-black leading-snug text-black md:text-4xl">
        농부님,
        <br />
        오늘 <span className="text-green-700">내 작물</span> 얼마에 팔아야 할까요?
      </h2>

      <form
        action="/expo/crop-value"
        className="mx-auto mt-5 flex max-w-2xl items-center rounded-full border-2 border-green-200 bg-white px-4 py-2 shadow-sm"
      >
        <input
          name="crop"
          required
          placeholder="예: 홍산마늘, 양파, 오이"
          className="flex-1 bg-transparent px-3 py-4 text-2xl font-black outline-none placeholder:text-gray-400 md:text-3xl"
        />
        <button className="rounded-full bg-green-700 px-6 py-3 text-xl font-black text-white">
          확인
        </button>
      </form>
    </section>
  );
}
