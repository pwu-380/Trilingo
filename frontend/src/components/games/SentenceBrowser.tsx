import { useEffect, useState } from "react";
import { getSentences, deleteSentence } from "../../api/games";
import type { GameSentence } from "../../types/game";
import "./SentenceBrowser.css";

interface Props {
  onBack: () => void;
  onToast?: (message: string, type: "info" | "error" | "success") => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function SentenceBrowser({ onBack, onToast }: Props) {
  const [sentences, setSentences] = useState<GameSentence[]>([]);
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getSentences(level)
      .then((data) => {
        // Sort by HSK level ascending, then by id descending within each level
        const sorted = [...data.sentences].sort((a, b) =>
          a.hsk_level !== b.hsk_level ? a.hsk_level - b.hsk_level : b.id - a.id
        );
        setSentences(sorted);
      })
      .catch(() => setSentences([]))
      .finally(() => setLoading(false));
    setPage(0);
  }, [level]);

  const filtered = search
    ? sentences.filter((s) => {
        const q = search.toLowerCase();
        return s.sentence_zh.includes(search) || s.sentence_en.toLowerCase().includes(q) || s.vocab_word.includes(search);
      })
    : sentences;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(clampedPage * pageSize, (clampedPage + 1) * pageSize);

  const handleDelete = async (id: number) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    try {
      await deleteSentence(id);
      setSentences((prev) => prev.filter((s) => s.id !== id));
      onToast?.("Sentence deleted", "success");
    } catch {
      onToast?.("Failed to delete sentence", "error");
    }
    setConfirmId(null);
  };

  return (
    <div className="sb">
      <div className="sb-header">
        <button className="sb-back-btn" onClick={onBack}>Back</button>
        <span className="sb-title">Sentence Browser</span>
        <div className="sb-controls">
          <input
            className="sb-search"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
          <label className="sb-control">
            <span>Level:</span>
            <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
              <option value={0}>All</option>
              <option value={1}>HSK 1</option>
              <option value={2}>HSK 2</option>
              <option value={3}>HSK 3</option>
            </select>
          </label>
          <label className="sb-control">
            <span>Per page:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="sb-table-wrap">
        {loading && <div className="sb-empty">Loading...</div>}
        {!loading && sentences.length === 0 && (
          <div className="sb-empty">No sentences found. Play Mad Libs to generate some!</div>
        )}
        {!loading && sentences.length > 0 && filtered.length === 0 && (
          <div className="sb-empty">No sentences match "{search}"</div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="sb-table">
            <thead>
              <tr>
                <th className="sb-th-level">HSK</th>
                <th className="sb-th-vocab">Word</th>
                <th className="sb-th-zh">Chinese</th>
                <th className="sb-th-en">English</th>
                <th className="sb-th-del"></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => (
                <tr key={s.id}>
                  <td className="sb-td-level">{s.hsk_level}</td>
                  <td className="sb-td-vocab">{s.vocab_word}</td>
                  <td className="sb-td-zh">{s.sentence_zh}</td>
                  <td className="sb-td-en">{s.sentence_en}</td>
                  <td className="sb-td-del">
                    {confirmId === s.id ? (
                      <span className="sb-confirm-group">
                        <button className="sb-confirm-yes" onClick={() => handleDelete(s.id)} title="Confirm delete">&#x2713;</button>
                        <button className="sb-confirm-no" onClick={() => setConfirmId(null)} title="Cancel">&#x2717;</button>
                      </span>
                    ) : (
                      <button
                        className="sb-delete-btn"
                        onClick={() => handleDelete(s.id)}
                        title="Delete sentence"
                      >&#x2715;</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="sb-pagination">
          <span className="sb-page-info">{search && filtered.length !== sentences.length ? `${filtered.length} / ${sentences.length}` : sentences.length} sentences</span>
          <div className="sb-page-nav">
            <button disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)}>&lsaquo; Prev</button>
            <span>{clampedPage + 1} / {totalPages}</span>
            <button disabled={clampedPage >= totalPages - 1} onClick={() => setPage(clampedPage + 1)}>Next &rsaquo;</button>
          </div>
        </div>
      )}
    </div>
  );
}
