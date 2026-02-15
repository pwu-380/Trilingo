import type { PinyinPair } from "../../types/chat";
import type { WordBoundary } from "../../types/chat";
import "./ChineseText.css";

interface Props {
  pairs: PinyinPair[];
  words?: WordBoundary[];
  onWordClick?: (word: string, pinyin: string, rect: DOMRect) => void;
}

export default function ChineseText({ pairs, words, onWordClick }: Props) {
  // Segmented mode: group pairs by word boundaries
  if (words && onWordClick) {
    return (
      <span className="chinese-text">
        {words.map((wb, wi) => {
          const wordPairs = pairs.slice(wb.start, wb.end);
          const hasPinyin = wordPairs.some((p) => p.pinyin);
          const pinyinStr = wordPairs
            .filter((p) => p.pinyin)
            .map((p) => p.pinyin)
            .join(" ");

          return (
            <span
              key={wi}
              className={hasPinyin ? "word-group clickable" : "word-group"}
              onClick={
                hasPinyin
                  ? (e) => {
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      onWordClick(wb.word, pinyinStr, rect);
                    }
                  : undefined
              }
            >
              {wordPairs.map((p, i) =>
                p.pinyin ? (
                  <ruby key={i}>
                    {p.char}
                    <rp>(</rp>
                    <rt>{p.pinyin}</rt>
                    <rp>)</rp>
                  </ruby>
                ) : (
                  <span key={i}>{p.char}</span>
                ),
              )}
            </span>
          );
        })}
      </span>
    );
  }

  // Default flat mode (backward-compatible)
  return (
    <span className="chinese-text">
      {pairs.map((p, i) =>
        p.pinyin ? (
          <ruby key={i}>
            {p.char}
            <rp>(</rp>
            <rt>{p.pinyin}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{p.char}</span>
        ),
      )}
    </span>
  );
}
