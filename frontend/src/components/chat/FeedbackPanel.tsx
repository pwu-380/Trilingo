import "./FeedbackPanel.css";

interface Props {
  feedback: string;
}

export default function FeedbackPanel({ feedback }: Props) {
  return (
    <div className="feedback-panel">
      <span className="feedback-label">Feedback</span>
      <p>{feedback}</p>
    </div>
  );
}
