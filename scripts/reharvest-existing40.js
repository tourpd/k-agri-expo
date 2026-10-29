const URLS = [
"https://www.youtube.com/shorts/bRNz3GrDyo0",
"https://www.youtube.com/shorts/nTSSibciGc8",
"https://www.youtube.com/shorts/9R0_MqZ9xK0",
"https://youtu.be/PBAnRTr3XDs",
"https://youtu.be/HqNZCRMDoYo",
"https://www.youtube.com/shorts/HUNoFm6GiaY",
"https://www.youtube.com/shorts/sn-4oLvzwPc",
"https://www.youtube.com/shorts/LVhL2seW09M",
"https://www.youtube.com/shorts/-8_XqhEeW4A",
"https://www.youtube.com/shorts/JSzB_uJqruY",
"https://www.youtube.com/shorts/tCTOxubSXk4",
"https://www.youtube.com/shorts/VC5fYwUBjPE",
"https://www.youtube.com/shorts/xyobYC9hjU8",
"https://www.youtube.com/shorts/fPuywy70TMc",
"https://www.youtube.com/shorts/uQ_963_6P5k",
"https://www.youtube.com/shorts/-hBiY4-kyxA",
"https://www.youtube.com/shorts/4yn5AlBBPKE",
"https://www.youtube.com/shorts/43MjPOvjK2U",
"https://www.youtube.com/shorts/UHVSheCYorw",
"https://www.youtube.com/shorts/nPeXitWqlEU",
"https://www.youtube.com/shorts/UtYrjHjRK04",
"https://www.youtube.com/shorts/_CCK6FYXfQI",
"https://www.youtube.com/shorts/oA7TBLAx_yk",
"https://www.youtube.com/shorts/AuWq5PrNpvA",
"https://www.youtube.com/shorts/VUkeVKQsOfE",
"https://www.youtube.com/shorts/gjsMfngDbc0",
"https://www.youtube.com/shorts/fehMDPqppfU",
"https://www.youtube.com/shorts/4m6CfhL-7bw",
"https://www.youtube.com/shorts/-acxNiVyC2o",
"https://www.youtube.com/shorts/BaPO_tYmrcU",
"https://www.youtube.com/shorts/r8HMBRWej_w",
"https://www.youtube.com/shorts/hj6aLYEcVeY",
"https://www.youtube.com/shorts/q6rjTE1DMI0",
"https://www.youtube.com/shorts/us-M1CEJ40A",
"https://www.youtube.com/shorts/detKMBkpUSk",
"https://www.youtube.com/shorts/dmNQVjVpdoE",
"https://www.youtube.com/shorts/D2dlhS5mFHs",
"https://youtu.be/er6r01MCeMk",
"https://youtu.be/v9mnqOlYWiQ",
"https://youtu.be/-DNZ-yKT6II"
];

async function run() {
  console.log("REHARVEST 40 START");

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i];
    console.log(`\n[${i + 1}/${URLS.length}] ${url}`);

    const fd = new FormData();
    fd.append("video_url", url);
    fd.append("memo", "기존 40개 PV5 영상 재분석. 제목/설명/채널/가격/업체/제품/공간/차박/전장/격벽/팝업텐트 중심으로 실제 나온 정보만 추출.");

    try {
      const res = await fetch("http://localhost:3000/api/pv5/analyze-video", {
        method: "POST",
        body: fd,
      });

      const text = await res.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.log("JSON 아님:", text.slice(0, 200));
        continue;
      }

      console.log({
        success: json.success,
        saved: json.saved,
        db_id: json.db_id,
        title: json.youtube_meta?.title,
        summary: json.summary,
        error: json.error || json.save_error || "",
      });
    } catch (e) {
      console.log("ERR:", e.message);
    }
  }
}

run();
