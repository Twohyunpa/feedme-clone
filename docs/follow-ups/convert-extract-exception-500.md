# Defuddle 예외가 500으로 노출됨

- 증상: `lib/convert/convert-url.ts`에서 `Defuddle(...)` 호출이 던지는 예외가 `ConvertError`로 바뀌지 않아 `/api/convert`가 JSON이 아닌 500을 돌려준다. 화면에는 "서버와 통신하지 못했습니다"가 표시된다.
- 근거: 코드 검토(`code-review low`)에서 지적. 실제 재현은 하지 못했다(비 HTML 응답 등 추정 입력).
- 추정 원인: 추출 호출이 try 블록 밖에 있다.
- 제안: 추출을 try로 감싸 `extract-failed`로 변환하고, 비 HTML 콘텐츠 타입은 `fetch-failed`로 거절한다.
