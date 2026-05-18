-- 기존 DB에 pattern_type 컬럼 추가 (신규 설치는 init.sql에 포함됨)
ALTER TABLE uploads
  ADD COLUMN pattern_type ENUM('crown', 'm_line') NOT NULL DEFAULT 'crown'
  AFTER mimetype;
