import ExamEngine from "@/components/exam/ExamEngine";
import { mockQuestions } from "@/lib/mockExamData";

export default function TestPage() {
  return <ExamEngine questions={mockQuestions} />;
}
