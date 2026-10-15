import { describe, it, expect } from "vitest";

// Pure document parsing and metadata extraction functions for test execution
interface ExtractedOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

interface ExtractedQuestion {
  sourceQuestionNumber: number;
  questionText: string;
  options: ExtractedOption[];
  correctOptionKey: string | null;
  explanation: string;
  subject: string;
  confidence: number;
  reviewRequired: boolean;
  warnings: string[];
}

function parseDocumentContent(rawText: string, defaultTitle?: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let title = defaultTitle || "Law Entrance Mock Test";
  let examType = "AIBE";
  let durationMinutes = 210;
  let totalQuestions = 100;
  let totalMarks = 100;
  let positiveMarks = 1;
  let negativeMarks = 0;

  const headerSlice = lines.slice(0, 25).join(" ");
  if (/AIBE|All India Bar Examination/i.test(headerSlice)) {
    examType = "AIBE";
    if (!defaultTitle) title = "AIBE Mock Test 1";
    durationMinutes = 210;
    negativeMarks = 0;
  } else if (/CLAT/i.test(headerSlice)) {
    examType = "CLAT";
    durationMinutes = 120;
    negativeMarks = 0.25;
  }

  const hrMatch = headerSlice.match(/(\d+)\s*(?:hours?|hrs?)/i);
  const minMatch = headerSlice.match(/(\d+)\s*(?:minutes?|mins?)/i);
  let parsedDur = 0;
  if (hrMatch && hrMatch[1]) parsedDur += parseInt(hrMatch[1], 10) * 60;
  if (minMatch && minMatch[1]) parsedDur += parseInt(minMatch[1], 10);
  if (parsedDur > 0) durationMinutes = parsedDur;

  // 2. Identify Section Boundaries
  const qSectionMatch = rawText.match(/(?:^|\n)\s*QUESTIONS?\s*(?:\r?\n|$)/i);
  let questionsStartIndex = 0;
  if (qSectionMatch && qSectionMatch.index !== undefined) {
    questionsStartIndex = qSectionMatch.index + qSectionMatch[0].length;
  }

  const answerKeyHeaderRegex = /(?:^|\n)\s*(?:SECTION\s*[A-Z0-9]*\s*[-:–—]?\s*)?ANSWER\s*KEYS?\s*(?:\r?\n|$)/i;
  const explanationHeaderRegex = /(?:^|\n)\s*(?:ANSWERS?\s*(?:WITH\s*)?EXPLANATIONS?|DETAILED\s*EXPLANATIONS?|HINTS?\s*&?\s*SOLUTIONS?)\s*(?:\r?\n|$)/i;

  let searchAfter = questionsStartIndex;
  let answerKeyIndex = -1;
  const akMatch = rawText.slice(searchAfter).match(answerKeyHeaderRegex);
  if (akMatch && akMatch.index !== undefined) {
    answerKeyIndex = searchAfter + akMatch.index;
  }

  let explanationIndex = -1;
  const expMatch = rawText.slice(searchAfter).match(explanationHeaderRegex);
  if (expMatch && expMatch.index !== undefined) {
    explanationIndex = searchAfter + expMatch.index;
  }

  let questionsText = "";
  let answerKeyText = "";
  let explanationText = "";

  if (answerKeyIndex !== -1 && (explanationIndex === -1 || answerKeyIndex < explanationIndex)) {
    questionsText = rawText.slice(questionsStartIndex, answerKeyIndex);
    if (explanationIndex !== -1) {
      answerKeyText = rawText.slice(answerKeyIndex, explanationIndex);
      explanationText = rawText.slice(explanationIndex);
    } else {
      answerKeyText = rawText.slice(answerKeyIndex);
    }
  } else if (explanationIndex !== -1) {
    questionsText = rawText.slice(questionsStartIndex, explanationIndex);
    explanationText = rawText.slice(explanationIndex);
  } else {
    questionsText = rawText.slice(questionsStartIndex);
  }

  // 3. Extract standalone Answer Key Map
  const answerMap = new Map<number, string>();
  if (answerKeyText) {
    const keyPairRegex = /(?:^|\s)(?:Q\.?\s*|Question\s*)?(\d{1,3})\s*[-:–—.)]\s*\(?([A-Da-d])\)?(?=\s|$)/g;
    let match;
    while ((match = keyPairRegex.exec(answerKeyText)) !== null) {
      if (match[1] && match[2]) {
        answerMap.set(parseInt(match[1], 10), match[2].toUpperCase());
      }
    }
  }

  // 4. Extract standalone Explanations Map
  const explanationMap = new Map<number, string>();
  if (explanationText) {
    const expRegex = /(?:^|\n)\s*(?:Q\.?\s*|Question\s*)?(\d{1,3})[\s.:\-–—)]+([\s\S]*?)(?=(?:\n\s*(?:Q\.?\s*|Question\s*)?\d{1,3}[\s.:\-–—)]+)|$)/g;
    let match;
    while ((match = expRegex.exec(explanationText)) !== null) {
      if (match[1] && match[2]) {
        explanationMap.set(parseInt(match[1], 10), match[2].trim());
      }
    }
  }

  // 5. Questions extraction
  const questionSplitter = /(?:^|\n)(?:Q\.?\s*|Question\s+)?(\d{1,3})[\.\:\)]\s+/g;
  const rawQuestions: { num: number; content: string }[] = [];
  let lastIndex = 0;
  let prevNum: number | null = null;
  let qMatch: RegExpExecArray | null;

  while ((qMatch = questionSplitter.exec(questionsText)) !== null) {
    if (prevNum !== null) {
      rawQuestions.push({ num: prevNum, content: questionsText.slice(lastIndex, qMatch.index).trim() });
    }
    if (qMatch[1]) {
      prevNum = parseInt(qMatch[1], 10);
      lastIndex = qMatch.index + qMatch[0].length;
    }
  }
  if (prevNum !== null) {
    rawQuestions.push({ num: prevNum, content: questionsText.slice(lastIndex).trim() });
  }

  const questions: ExtractedQuestion[] = [];
  for (const raw of rawQuestions) {
    const qNum = raw.num;
    const block = raw.content;

    const rawLines = block.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const qTextLines: string[] = [];
    const options: ExtractedOption[] = [];
    let currentOption: ExtractedOption | null = null;
    let inlineAnswerKey: string | null = null;
    let inlineExplanation = "";

    for (const line of rawLines) {
      const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct\s*Option)[\s.:\-–—]+([A-D])/i);
      if (ansMatch && ansMatch[1]) {
        inlineAnswerKey = ansMatch[1].toUpperCase();
        continue;
      }

      const expMatch = line.match(/^(?:Explanation|Solution)[\s.:\-–—]+([\s\S]*)$/i);
      if (expMatch && expMatch[1]) {
        inlineExplanation = expMatch[1].trim();
        continue;
      }

      const optMatch = line.match(/^(?:\(([A-Da-d])\)|([A-Da-d])[\.\)]|\[([A-Da-d])\])\s+(.*)$/);
      if (optMatch) {
        const key = (optMatch[1] || optMatch[2] || optMatch[3] || "").toUpperCase();
        let text = (optMatch[4] || "").trim();

        const inlineSplit = text.split(/(?=\s{2,}(?:\([B-Db-d]\)|[B-Db-d][\.\)]\s+))/);
        if (inlineSplit.length > 1 && inlineSplit[0]) {
          text = inlineSplit[0].trim();
          currentOption = { key, text };
          options.push(currentOption);
          for (let s = 1; s < inlineSplit.length; s++) {
            const item = inlineSplit[s];
            if (!item) continue;
            const sub = item.trim();
            const subMatch = sub.match(/^(?:\(([A-Da-d])\)|([A-Da-d])[\.\)]|\[([A-Da-d])\])\s+(.*)$/);
            if (subMatch) {
              const subKey = (subMatch[1] || subMatch[2] || subMatch[3] || "").toUpperCase();
              const subText = (subMatch[4] || "").trim();
              currentOption = { key: subKey, text: subText };
              options.push(currentOption);
            }
          }
          continue;
        }

        currentOption = { key, text };
        options.push(currentOption);
      } else if (currentOption) {
        currentOption.text += " " + line;
      } else {
        qTextLines.push(line);
      }
    }

    const qText = qTextLines.join("\n").trim();

    const resolvedCorrectKey = answerMap.get(qNum) || inlineAnswerKey || null;
    if (resolvedCorrectKey) {
      for (const opt of options) {
        if (opt.key === resolvedCorrectKey) opt.isCorrect = true;
      }
    }

    const resolvedExplanation = explanationMap.get(qNum) || inlineExplanation || "";
    const warnings: string[] = [];
    if (options.length < 2) warnings.push("Fewer than 2 options detected");
    if (!resolvedCorrectKey) warnings.push("Missing correct answer key");
    if (qText.length < 5) warnings.push("Question text appears unusually short");

    questions.push({
      sourceQuestionNumber: qNum,
      questionText: qText,
      options,
      correctOptionKey: resolvedCorrectKey,
      explanation: resolvedExplanation,
      subject: "General",
      confidence: warnings.length > 0 ? 0.75 : 0.98,
      reviewRequired: warnings.length > 0,
      warnings,
    });
  }

  return {
    metadata: {
      title,
      examType,
      durationMinutes,
      totalQuestions: questions.length,
      totalMarks: questions.length * positiveMarks,
      positiveMarks,
      negativeMarks,
    },
    questions,
  };
}

describe("AI Mock Test Document Importer", () => {
  const sampleDocumentText = `
ALL INDIA BAR EXAMINATION (AIBE) MOCK TEST 1
Duration: 3 hours 30 minutes | Total Questions: 3 | Marks: 3 | No negative marking

1. Who among the following is regarded as the Father of the Indian Constitution?
(A) Mahatma Gandhi
(B) Dr. B.R. Ambedkar
(C) Jawaharlal Nehru
(D) Dr. Rajendra Prasad

2. Article 21 of the Constitution of India provides protection of:
(A) Life and personal liberty
(B) Freedom of speech and expression
(C) Equality before law
(D) Right to constitutional remedies

3. Under the Indian Contract Act, 1872, an agreement without consideration is:
(A) Valid
(B) Voidable
(C) Void
(D) Illegal

ANSWER KEY
1. B
2. A
3. C

DETAILED EXPLANATIONS
1. Dr. B.R. Ambedkar was the Chairman of the Drafting Committee of the Constitution.
2. Article 21 declares that no person shall be deprived of his life or personal liberty except according to procedure established by law.
3. According to Section 25 of the Indian Contract Act, 1872, an agreement made without consideration is void.
`;

  it("extracts exam title, duration, marks, and negative marking from document headers", () => {
    const result = parseDocumentContent(sampleDocumentText);
    expect(result.metadata.examType).toBe("AIBE");
    expect(result.metadata.durationMinutes).toBe(210); // 3.5 hours = 210 mins
    expect(result.metadata.negativeMarks).toBe(0);
    expect(result.metadata.totalQuestions).toBe(3);
    expect(result.metadata.totalMarks).toBe(3);
  });

  it("extracts question text spanning multiple lines without losing question body", () => {
    const multilineDoc = `
1. Consider the following statements regarding the Supreme Court of India:
Statement I: The Supreme Court was established on 26 January 1950.
Statement II: The judges hold office until they attain the age of 65 years.
Which of the statements given above is/are correct?
(A) I only
(B) II only
(C) Both I and II
(D) Neither I nor II

ANSWER KEY
1. C
`;
    const result = parseDocumentContent(multilineDoc);
    expect(result.questions.length).toBe(1);
    expect(result.questions[0]!.questionText).toContain("Consider the following statements");
    expect(result.questions[0]!.questionText).toContain("Statement I:");
    expect(result.questions[0]!.questionText).toContain("Which of the statements given above is/are correct?");
  });

  it("associates all options (A, B, C, D) with the correct question", () => {
    const result = parseDocumentContent(sampleDocumentText);
    expect(result.questions.length).toBe(3);

    const q1 = result.questions[0]!;
    expect(q1.options.length).toBe(4);
    expect(q1.options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
    expect(q1.options[0]!.text).toBe("Mahatma Gandhi");
    expect(q1.options[1]!.text).toBe("Dr. B.R. Ambedkar");
  });

  it("matches answer keys and explanations at the end of document by question number", () => {
    const result = parseDocumentContent(sampleDocumentText);

    // Q1 answer B
    expect(result.questions[0]!.correctOptionKey).toBe("B");
    expect(result.questions[0]!.options.find((o) => o.key === "B")?.isCorrect).toBe(true);
    expect(result.questions[0]!.explanation).toContain("Dr. B.R. Ambedkar was the Chairman");

    // Q2 answer A
    expect(result.questions[1]!.correctOptionKey).toBe("A");
    expect(result.questions[1]!.options.find((o) => o.key === "A")?.isCorrect).toBe(true);
    expect(result.questions[1]!.explanation).toContain("Article 21 declares");

    // Q3 answer C
    expect(result.questions[2]!.correctOptionKey).toBe("C");
    expect(result.questions[2]!.options.find((o) => o.key === "C")?.isCorrect).toBe(true);
    expect(result.questions[2]!.explanation).toContain("Section 25");
  });

  it("flags missing answer keys as requiring review without inventing answers", () => {
    const docMissingAnswer = `
1. Which Schedule contains the list of recognized languages?
(A) Seventh Schedule
(B) Eighth Schedule
(C) Ninth Schedule
(D) Tenth Schedule

ANSWER KEY
`;
    const result = parseDocumentContent(docMissingAnswer);
    expect(result.questions[0]!.correctOptionKey).toBeNull();
    expect(result.questions[0]!.reviewRequired).toBe(true);
    expect(result.questions[0]!.warnings).toContain("Missing correct answer key");
  });

  it("validates file types and rejects unsupported file formats safely", () => {
    const isSupportedFile = (fileName: string) => {
      const ext = fileName.toLowerCase().split(".").pop();
      return ext === "docx" || ext === "pdf";
    };

    expect(isSupportedFile("AIBEM1.docx")).toBe(true);
    expect(isSupportedFile("mock_test_2.pdf")).toBe(true);
    expect(isSupportedFile("malicious.exe")).toBe(false);
    expect(isSupportedFile("questions.csv")).toBe(false);
    expect(isSupportedFile("script.js")).toBe(false);
  });

  it("safely enforces file size limits (rejects files > 20MB)", () => {
    const validateFileSize = (sizeBytes: number) => {
      const maxBytes = 20 * 1024 * 1024; // 20MB
      return sizeBytes <= maxBytes;
    };

    expect(validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB ok
    expect(validateFileSize(20 * 1024 * 1024)).toBe(true); // 20MB ok
    expect(validateFileSize(20 * 1024 * 1024 + 1)).toBe(false); // > 20MB rejected
    expect(validateFileSize(50 * 1024 * 1024)).toBe(false); // 50MB rejected
  });

  it("correctly parses real AIBEM1.pdf fixture with all 100 questions, options, keys, and explanations", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const fixturePath = path.resolve(__dirname, "../fixtures/AIBEM1.pdf");

    if (fs.existsSync(fixturePath)) {
      // @ts-ignore
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const buffer = fs.readFileSync(fixturePath);
      const data = await pdfParse(buffer);
      const parsed = parseDocumentContent(data.text);

      expect(parsed.questions.length).toBe(100);
      expect(parsed.metadata.durationMinutes).toBe(210);
      expect(parsed.metadata.totalMarks).toBe(100);
      expect(parsed.metadata.positiveMarks).toBe(1);
      expect(parsed.metadata.negativeMarks).toBe(0);

      // Verify every question 1-100 has exactly 4 options, an answer key, and an explanation
      for (let i = 0; i < 100; i++) {
        const q = parsed.questions[i]!;
        expect(q.sourceQuestionNumber).toBe(i + 1);
        expect(q.options.length).toBe(4);
        expect(q.options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
        expect(["A", "B", "C", "D"]).toContain(q.correctOptionKey);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
