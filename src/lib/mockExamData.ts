export type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

export interface MockQuestion {
  id: string;
  order: number;
  subject: string;
  text: string;
  options: { key: string; text: string }[];
}

export const mockSubjects = ["Constitutional Law", "IPC", "CrPC", "Evidence Act"];

const lawQuestions = [
  {
    subject: "Constitutional Law",
    text: "Under which Article of the Constitution of India is the power to issue writs for the enforcement of Fundamental Rights vested in the Supreme Court?",
    options: [
      { key: "A", text: "Article 32" },
      { key: "B", text: "Article 226" },
      { key: "C", text: "Article 13" },
      { key: "D", text: "Article 14" },
    ]
  },
  {
    subject: "Constitutional Law",
    text: "Which of the following is NOT a Fundamental Right under the Indian Constitution?",
    options: [
      { key: "A", text: "Right to Equality" },
      { key: "B", text: "Right to Property" },
      { key: "C", text: "Right to Freedom of Religion" },
      { key: "D", text: "Right against Exploitation" },
    ]
  },
  {
    subject: "IPC",
    text: "Under Section 300 of the Indian Penal Code, culpable homicide is NOT murder if it is committed under:",
    options: [
      { key: "A", text: "Grave and sudden provocation" },
      { key: "B", text: "Intoxication administered against will" },
      { key: "C", text: "Unsoundness of mind" },
      { key: "D", text: "Right of private defense exceeding limits" },
    ]
  },
  {
    subject: "IPC",
    text: "Which section of the IPC deals with 'Theft'?",
    options: [
      { key: "A", text: "Section 378" },
      { key: "B", text: "Section 383" },
      { key: "C", text: "Section 390" },
      { key: "D", text: "Section 405" },
    ]
  },
  {
    subject: "CrPC",
    text: "Under the Code of Criminal Procedure, 1973, an FIR is filed under which section?",
    options: [
      { key: "A", text: "Section 154" },
      { key: "B", text: "Section 155" },
      { key: "C", text: "Section 156(3)" },
      { key: "D", text: "Section 161" },
    ]
  },
  {
    subject: "CrPC",
    text: "Anticipatory bail is granted under which section of the CrPC?",
    options: [
      { key: "A", text: "Section 437" },
      { key: "B", text: "Section 438" },
      { key: "C", text: "Section 439" },
      { key: "D", text: "Section 436" },
    ]
  },
  {
    subject: "Evidence Act",
    text: "Under the Indian Evidence Act, 1872, 'Fact in issue' means and includes:",
    options: [
      { key: "A", text: "Any fact from which the existence, non-existence, nature or extent of any right, liability or disability is asserted or denied." },
      { key: "B", text: "Any fact which is admitted by the parties." },
      { key: "C", text: "Any fact which is judicially noticeable." },
      { key: "D", text: "Any fact proved by documentary evidence only." },
    ]
  },
  {
    subject: "Evidence Act",
    text: "Which section of the Indian Evidence Act deals with the admissibility of electronic records?",
    options: [
      { key: "A", text: "Section 65A and 65B" },
      { key: "B", text: "Section 62" },
      { key: "C", text: "Section 63" },
      { key: "D", text: "Section 64" },
    ]
  }
];

export const mockQuestions: MockQuestion[] = Array.from({ length: 100 }).map((_, i) => {
  const qTemplate = lawQuestions[i % lawQuestions.length];
  
  // Distribute sequentially among subjects
  const subjectIndex = Math.floor(i / 25);
  const forcedSubject = mockSubjects[subjectIndex];
  
  // Find a template question matching the forced subject, or fallback
  const matchingTemplates = lawQuestions.filter(q => q.subject === forcedSubject);
  const finalTemplate = matchingTemplates.length > 0 
    ? matchingTemplates[i % matchingTemplates.length] 
    : qTemplate;

  return {
    id: `q_${i + 1}`,
    order: i + 1,
    subject: finalTemplate.subject,
    text: `${finalTemplate.text} (Q${i + 1})`,
    options: finalTemplate.options,
  };
});
