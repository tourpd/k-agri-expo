# 조PD AI 방송국 데이터베이스

## broadcast_projects

방송 프로젝트 기본 정보

필드:

id
channel
title
working_title
program_type
target_duration
status
created_at
updated_at

status 예:

draft
analyzing
planning
script
scene_design
generating
editing
review
completed

---

## broadcast_sources

원본 자료

id
project_id
source_type
file_url
source_url
original_text
analysis_text
metadata
created_at

source_type:

article
pdf
image
video
audio
youtube
website
memo
library

---

## broadcast_scripts

대본 버전

id
project_id
version
title
hook
logline
script_text
duration_seconds
status
created_at

---

## broadcast_scenes

씬 단위 데이터

id
project_id
scene_no
start_time
end_time
scene_title
narration
visual_instruction
caption
source_type
source_id
ai_prompt
status
created_at

---

## broadcast_assets

영상 제작용 자산

id
project_id
scene_id
asset_type
file_url
provider
generation_prompt
duration
created_at

asset_type:

video
image
audio
music
graphic
map
chart
subtitle

---

## broadcast_edits

조PD 수정 기록

id
project_id
field_name
ai_original
user_revision
revision_reason
created_at

목적:

조PD 편집 패턴과 판단을 장기적으로 축적한다.

---

## broadcast_outputs

최종 결과물

id
project_id
output_type
file_url
duration
status
created_at

output_type:

youtube_long
youtube_short
thumbnail
preview
audio
subtitle
