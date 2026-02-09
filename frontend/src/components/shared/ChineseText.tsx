import type { PinyinPair } from "../../types/chat";
import "./ChineseText.css";

interface Props {
  pairs: PinyinPair[];
}

export default function ChineseText({ pairs }: Props) {
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
        )
      )}
    </span>
  );
}
