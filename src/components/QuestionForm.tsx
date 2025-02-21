import React, { useState } from 'react';

interface QuestionFormProps {
  onSubmit: (question: string) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(question);
    setQuestion('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question"
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default QuestionForm;