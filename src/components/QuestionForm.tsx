import React, { useState } from 'react';

interface QuestionFormProps {
  onSubmit: (question: string) => void;
}

const QuestionForm: React.FC<{ onSubmit: (question: string) => void }> = ({ onSubmit }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question here..."
      />
      <button type="submit">Ask Question</button>
    </form>
  );
};

export default QuestionForm;