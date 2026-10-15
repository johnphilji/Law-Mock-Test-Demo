// @ts-ignore
import mammoth from "mammoth";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface ExtractedOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface ExtractedQuestion {
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

export interface ExtractedExamMetadata {
  title: string;
  examType: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  instructions: string[];
}

export interface ExtractionResult {
  metadata: ExtractedExamMetadata;
  questions: ExtractedQuestion[];
  rawTextLength: number;
  summary: {
    totalDetected: number;
    withAllOptions: number;
    withAnswerKey: number;
    withExplanations: number;
    reviewRequired: number;
  };
}

/**
 * Extracts raw text from DOCX or PDF file buffer
 */
export async function extractRawTextFromFile(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value || "";
  } else if (extension === "pdf") {
    const parserFn = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
    const data = await parserFn(fileBuffer);
    return data?.text || "";
  } else {
    throw new Error(`Unsupported file format .${extension}. Please upload a .docx or .pdf file.`);
  }
}

/**
 * Parses raw document text into structured exam metadata, questions, options, and answer keys.
 */
export function parseDocumentContent(rawText: string, defaultTitle?: string): ExtractionResult {
  // Step 1: Clean running headers and footers (e.g. "AIBE Mock Test 1 | Page 2", "Page 2 of 22")
  const cleanedText = rawText
    .replace(/(?:^|\n)\s*(?:[A-Za-z0-9\s–—\-]+)?\|\s*Page\s*\d+\s*(?:\r?\n|$)/gi, "\n")
    .replace(/(?:^|\n)\s*Page\s*\d+\s*(?:of\s*\d+)?\s*(?:\r?\n|$)/gi, "\n");

  const lines = cleanedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Metadata Extraction from document header
  let title = defaultTitle || "AIBE Mock Test 1";
  let examType = "AIBE";
  let durationMinutes = 210; // Default 3h 30m for AIBE
  let totalQuestions = 100;
  let totalMarks = 100;
  let positiveMarks = 1;
  let negativeMarks = 0;
  const instructions: string[] = [];

  const headerSlice = lines.slice(0, 30).join(" ");
  if (/AIBE|All India Bar Examination/i.test(headerSlice)) {
    examType = "AIBE";
    if (!defaultTitle) title = "AIBE Mock Test 1";
    durationMinutes = 210;
    negativeMarks = 0;
  } else if (/CLAT|Common Law Admission Test/i.test(headerSlice)) {
    examType = "CLAT";
    if (!defaultTitle) title = "CLAT All-India Mock Test";
    durationMinutes = 120;
    negativeMarks = 0.25;
  } else if (/AILET/i.test(headerSlice)) {
    examType = "AILET";
    if (!defaultTitle) title = "AILET Mock Test";
    durationMinutes = 120;
    negativeMarks = 0.25;
  } else if (/JUDICIARY/i.test(headerSlice)) {
    examType = "JUDICIARY";
    if (!defaultTitle) title = "Judiciary Prelims Mock Test";
    durationMinutes = 120;
  }

  // Duration regex (supports "3 hours 30 minutes", "120 mins", "2 hours", etc.)
  const hrMatch = headerSlice.match(/(\d+)\s*(?:hours?|hrs?)/i);
  const minMatch = headerSlice.match(/(\d+)\s*(?:minutes?|mins?)/i);
  let parsedDur = 0;
  if (hrMatch && hrMatch[1]) parsedDur += parseInt(hrMatch[1], 10) * 60;
  if (minMatch && minMatch[1]) parsedDur += parseInt(minMatch[1], 10);
  if (parsedDur > 0) durationMinutes = parsedDur;

  // Negative marking regex
  if (/no negative marking|negative marking:\s*(?:nil|none|0)/i.test(headerSlice)) {
    negativeMarks = 0;
  } else {
    const negMatch = headerSlice.match(/negative marking:?\s*-?(\d+(?:\.\d+)?)/i);
    if (negMatch && negMatch[1]) {
      negativeMarks = parseFloat(negMatch[1]);
    }
  }

  // Step 2: Identify Section Boundaries
  // Distinct section headers that appear on their OWN LINE:
  // - Questions start: standalone line "QUESTIONS" or after Instructions
  // - Answer Key start: standalone line "ANSWER KEY"
  // - Explanations start: standalone line "ANSWERS WITH EXPLANATIONS" or "DETAILED EXPLANATIONS"
  
  const qSectionMatch = cleanedText.match(/(?:^|\n)\s*QUESTIONS?\s*(?:\r?\n|$)/i);
  let questionsStartIndex = 0;
  if (qSectionMatch && qSectionMatch.index !== undefined) {
    questionsStartIndex = qSectionMatch.index + qSectionMatch[0].length;
  }

  // Answer key section header (must be a standalone line, not part of a sentence in instructions)
  const answerKeyHeaderRegex = /(?:^|\n)\s*(?:SECTION\s*[A-Z0-9]*\s*[-:–—]?\s*)?ANSWER\s*KEYS?\s*(?:\r?\n|$)/i;
  // Explanations section header (standalone line)
  const explanationHeaderRegex = /(?:^|\n)\s*(?:ANSWERS?\s*(?:WITH\s*)?EXPLANATIONS?|DETAILED\s*EXPLANATIONS?|HINTS?\s*&?\s*SOLUTIONS?|SOLUTIONS?\s*&?\s*EXPLANATIONS?)\s*(?:\r?\n|$)/i;

  let searchAfter = questionsStartIndex;
  let answerKeyIndex = -1;
  const akMatch = cleanedText.slice(searchAfter).match(answerKeyHeaderRegex);
  if (akMatch && akMatch.index !== undefined) {
    answerKeyIndex = searchAfter + akMatch.index;
  }

  let explanationIndex = -1;
  const expMatch = cleanedText.slice(searchAfter).match(explanationHeaderRegex);
  if (expMatch && expMatch.index !== undefined) {
    explanationIndex = searchAfter + expMatch.index;
  }

  let questionsText = "";
  let answerKeyText = "";
  let explanationText = "";

  if (answerKeyIndex !== -1 && (explanationIndex === -1 || answerKeyIndex < explanationIndex)) {
    questionsText = cleanedText.slice(questionsStartIndex, answerKeyIndex);
    if (explanationIndex !== -1) {
      answerKeyText = cleanedText.slice(answerKeyIndex, explanationIndex);
      explanationText = cleanedText.slice(explanationIndex);
    } else {
      answerKeyText = cleanedText.slice(answerKeyIndex);
    }
  } else if (explanationIndex !== -1) {
    questionsText = cleanedText.slice(questionsStartIndex, explanationIndex);
    explanationText = cleanedText.slice(explanationIndex);
  } else {
    questionsText = cleanedText.slice(questionsStartIndex);
  }

  // Step 3: Extract Standalone Answer Key Map
  // Supports table / grid format: "1-A 2-D 3-A 4-B", "1. A", "1) (A)", "Q1: A", etc.
  const answerMap = new Map<number, string>();
  if (answerKeyText) {
    const keyPairRegex = /(?:^|\s)(?:Q\.?\s*|Question\s*)?(\d{1,3})\s*[-:–—.)]\s*\(?([A-Da-d])\)?(?=\s|$)/g;
    let match;
    while ((match = keyPairRegex.exec(answerKeyText)) !== null) {
      if (match[1] && match[2]) {
        const qNum = parseInt(match[1], 10);
        const optKey = match[2].toUpperCase();
        answerMap.set(qNum, optKey);
      }
    }
  }

  // Step 4: Extract Explanations, Inline Answers, and Subjects
  // Format: "Q1. Ans: (A) [Public Interest Litigation] \n Explanation text..."
  const explanationMap = new Map<number, string>();
  const subjectMap = new Map<number, string>();

  if (explanationText) {
    const expBlockRegex = /(?:^|\n)\s*(?:Q\.?\s*|Question\s*)?(\d{1,3})\s*[\.:\-–—)]+\s*(?:Ans(?:wer)?\s*[\.:\-–—]*\s*\(?([A-Da-d])\)?\s*)?(?:\[(.*?)\])?\s*([\s\S]*?)(?=(?:\n\s*(?:Q\.?\s*|Question\s*)?\d{1,3}\s*[\.:\-–—)]+)|$)/gi;
    let match;
    while ((match = expBlockRegex.exec(explanationText)) !== null) {
      if (match[1]) {
        const qNum = parseInt(match[1], 10);
        const optKey = match[2] ? match[2].toUpperCase() : null;
        const subj = match[3] ? match[3].trim() : null;
        const text = match[4] ? match[4].trim() : "";

        if (optKey && !answerMap.has(qNum)) {
          answerMap.set(qNum, optKey);
        }
        if (subj) {
          subjectMap.set(qNum, subj);
        }
        if (text) {
          explanationMap.set(qNum, text);
        }
      }
    }
  }

  // Step 5: Extract Subject Blueprint Table (if present on Page 16)
  // Format: "Constitutional Law 10 9, 14, 16, 26, 53, 65, 67, 78, 83, 84"
  if (answerKeyText) {
    const blueprintLines = answerKeyText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    for (const bLine of blueprintLines) {
      const bMatch = bLine.match(/^([A-Za-z0-9,\s–—\(\)]+?)\s+\d+\s+((?:\d+\s*,\s*)+\d+|\d+)$/);
      if (bMatch && bMatch[1] && bMatch[2]) {
        const subjName = bMatch[1].trim();
        const qNums = bMatch[2].split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
        for (const num of qNums) {
          if (!subjectMap.has(num)) {
            subjectMap.set(num, subjName);
          }
        }
      }
    }
  }

  // Step 6: Question & Option Extraction from questionsText
  const questionSplitter = /(?:^|\n)\s*(?:Q\.?\s*|Question\s+)?(\d{1,3})[\.\:\)]\s+/g;
  const rawQuestions: { num: number; content: string }[] = [];

  let lastIndex = 0;
  let prevNum: number | null = null;
  let qMatch: RegExpExecArray | null;

  while ((qMatch = questionSplitter.exec(questionsText)) !== null) {
    if (prevNum !== null) {
      const content = questionsText.slice(lastIndex, qMatch.index).trim();
      rawQuestions.push({ num: prevNum, content });
    }
    if (qMatch[1]) {
      prevNum = parseInt(qMatch[1], 10);
      lastIndex = qMatch.index + qMatch[0].length;
    }
  }

  if (prevNum !== null) {
    const content = questionsText.slice(lastIndex).trim();
    rawQuestions.push({ num: prevNum, content });
  }

  // Step 7: Parse Options and Question Text for each question
  const questions: ExtractedQuestion[] = [];

  for (const raw of rawQuestions) {
    const qNum = raw.num;
    const block = raw.content;

    const rawLines = block.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const qTextLines: string[] = [];
    const options: ExtractedOption[] = [];
    let currentOption: ExtractedOption | null = null;

    for (const line of rawLines) {
      // Check if line starts an option: (A) Text, A) Text, A. Text, [A] Text
      const optMatch = line.match(/^(?:\(([A-Da-d])\)|([A-Da-d])[\.\)]|\[([A-Da-d])\])\s+(.*)$/);
      if (optMatch && optMatch[4] !== undefined) {
        const key = (optMatch[1] || optMatch[2] || optMatch[3] || "").toUpperCase();
        let text = optMatch[4].trim();

        // Check if multiple options are on the same line, e.g. "(A) Yes  (B) No"
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
            if (subMatch && subMatch[4] !== undefined) {
              const subKey = (subMatch[1] || subMatch[2] || subMatch[3] || "").toUpperCase();
              const subText = subMatch[4].trim();
              currentOption = { key: subKey, text: subText };
              options.push(currentOption);
            }
          }
          continue;
        }

        currentOption = { key, text };
        options.push(currentOption);
      } else if (currentOption) {
        // Continuation of current option text
        currentOption.text += " " + line;
      } else {
        // Question text line
        qTextLines.push(line);
      }
    }

    const qText = qTextLines.join(" ").trim();

    // Determine correct option: from answer key section, or inline answer
    const resolvedCorrectKey = answerMap.get(qNum) || null;

    // Mark option as correct
    if (resolvedCorrectKey) {
      for (const opt of options) {
        if (opt.key === resolvedCorrectKey) {
          opt.isCorrect = true;
        }
      }
    }

    const resolvedExplanation = explanationMap.get(qNum) || "";
    const resolvedSubject = subjectMap.get(qNum) || "General";

    // Warnings and confidence check
    const warnings: string[] = [];
    if (options.length < 2) {
      warnings.push("Fewer than 2 options detected");
    }
    if (!resolvedCorrectKey) {
      warnings.push("Missing correct answer key");
    }
    if (qText.length < 5) {
      warnings.push("Question text appears unusually short");
    }

    const reviewRequired = warnings.length > 0;
    const confidence = reviewRequired ? 0.75 : 0.98;

    questions.push({
      sourceQuestionNumber: qNum,
      questionText: qText,
      options,
      correctOptionKey: resolvedCorrectKey,
      explanation: resolvedExplanation,
      subject: resolvedSubject,
      confidence,
      reviewRequired,
      warnings,
    });
  }

  // Summary counts
  const totalDetected = questions.length;
  const withAllOptions = questions.filter((q) => q.options.length >= 4).length;
  const withAnswerKey = questions.filter((q) => q.correctOptionKey !== null).length;
  const withExplanations = questions.filter((q) => q.explanation.length > 0).length;
  const reviewRequiredCount = questions.filter((q) => q.reviewRequired).length;

  return {
    metadata: {
      title,
      examType,
      durationMinutes,
      totalQuestions: totalDetected || totalQuestions,
      totalMarks: totalDetected * positiveMarks || totalMarks,
      positiveMarks,
      negativeMarks,
      instructions,
    },
    questions,
    rawTextLength: rawText.length,
    summary: {
      totalDetected,
      withAllOptions,
      withAnswerKey,
      withExplanations,
      reviewRequired: reviewRequiredCount,
    },
  };
}
