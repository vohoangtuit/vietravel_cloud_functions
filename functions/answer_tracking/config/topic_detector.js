import fs from 'fs';
import path from 'path';

// Đọc và load file intent_keywords.json
const intentKeywordsPath = path.resolve('./intent_keywords.json');
const intentKeywords = JSON.parse(fs.readFileSync(intentKeywordsPath, 'utf8'));

/**
 * Phát hiện các topic chính từ list từ đã chuẩn hóa
 * @param {string[]} words - danh sách từ trong câu hỏi
 * @returns {string[]} - danh sách các chủ đề tìm thấy (vd: ['user', 'tour'])
 */
export function detectTopicsFromQuestion(words) {
  const detectedTopics = [];

  for (const topic in intentKeywords) {
    const keywords = intentKeywords[topic];
    if (keywords.some((k) => words.includes(k))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics;
}