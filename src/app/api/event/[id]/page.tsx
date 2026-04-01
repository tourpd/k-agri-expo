"use client";

export default function EventPage() {

  const apply = async () => {

    await fetch("/api/event/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_id: 1,
        name: "홍길동",
        phone: "01012341234",
      }),
    });

    alert("응모 완료");
  };

  return (

    <div>

      <h1>영진 로타리 이벤트</h1>

      <button onClick={apply}>
        응모하기
      </button>

    </div>

  );
}